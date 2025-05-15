# backend/products/views.py
from django.db.models import Q, Avg
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    ProductCategory, Brand, Color, Product, ProductImage,
    AttributeType, AttributeOption, ProductAttribute, Discount
)
from .serializers import (
    ProductCategorySerializer, BrandSerializer, ColorSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductImageSerializer,
    AttributeTypeSerializer, AttributeOptionSerializer, ProductAttributeSerializer
)

class ProductPagination(PageNumberPagination):
    page_size = 12  # Number of items per page
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductListSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'color', 'is_featured', 'is_new_arrival', 'is_top_seller', 'category__name']
    search_fields = ['name', 'description', 'brand__name', 'category__name', 'sub_category']
    ordering_fields = ['name', 'selling_price', 'added_at', 'stock', 'rating', 'sales_count']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)

        # Price range filtering
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(selling_price__gte=float(min_price))

        if max_price:
            queryset = queryset.filter(selling_price__lte=float(max_price))

        # Rating filtering - "rating and up"
        rating = self.request.query_params.get('rating__gte')
        if rating:
            try:
                rating_value = float(rating)
                queryset = queryset.filter(rating__gte=rating_value)
            except (ValueError, TypeError):
                pass

        # Brand name filtering - support multiple brands (OR condition)
        brand_names_param = self.request.query_params.get('brand_names')
        if brand_names_param:
            brand_names = brand_names_param.split(',')
            if brand_names:
                brand_filter = Q()
                for brand_name in brand_names:
                    brand_filter |= Q(brand__name=brand_name.strip())
                queryset = queryset.filter(brand_filter)

        # Category name filtering
        category_name = self.request.query_params.get('category__name')
        if category_name:
            queryset = queryset.filter(category__name=category_name)

        # Attribute filtering
        attributes = self.request.query_params.getlist('attribute')
        if attributes:
            for attr in attributes:
                try:
                    attr_id = int(attr)
                    queryset = queryset.filter(attributes__attribute_id=attr_id)
                except ValueError:
                    pass

        # In stock filtering
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            queryset = queryset.filter(stock__gt=0)

        return queryset.distinct()

    @action(detail=False)
    def featured(self, request):
        """Get featured products"""
        queryset = self.get_queryset().filter(is_featured=True).order_by('-added_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def new_arrivals(self, request):
        """Get new arrival products"""
        queryset = self.get_queryset().filter(is_new_arrival=True).order_by('-added_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def top_sellers(self, request):
        """Get top selling products"""
        queryset = self.get_queryset().filter(is_top_seller=True).order_by('-sales_count')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get all products for a specific category"""
        category = self.get_object()
        products = Product.objects.filter(category=category, is_active=True)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]

class ColorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([AllowAny])
def brands_by_category(request):
    """Get brands available for a specific category"""
    category_name = request.query_params.get('category', '')
    if not category_name:
        # If no category specified, return all brands
        brands = Brand.objects.all()
    else:
        # Get brands that have products in the specified category
        brands = Brand.objects.filter(
            products__category__name=category_name
        ).distinct()
    
    serializer = BrandSerializer(brands, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_products(request):
    """Search products by name, description, brand, or category"""
    query = request.query_params.get('q', '')
    if not query:
        return Response({'message': 'Query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    products = Product.objects.filter(
        Q(name__icontains=query) |
        Q(description__icontains=query) |
        Q(brand__name__icontains=query) |
        Q(category__name__icontains=query),
        is_active=True
    )

    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)