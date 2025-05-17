# backend/products/views.py
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
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
    AttributeTypeSerializer, AttributeOptionSerializer, ProductAttributeSerializer,
    RatingReviewSerializer
)

class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductListSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'color', 'is_featured', 'is_new_arrival', 'is_top_seller']
    search_fields = ['name', 'description', 'brand__name', 'category__name', 'sub_category']
    ordering_fields = ['name', 'selling_price', 'added_at', 'stock', 'rating', 'sales_count']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(selling_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(selling_price__lte=max_price)

        rating = self.request.query_params.get('rating__gte')
        if rating:
            queryset = queryset.filter(rating__gte=rating)

        brand_names = self.request.query_params.get('brand_names')
        if brand_names:
            brands = [name.strip() for name in brand_names.split(',')]
            queryset = queryset.filter(brand__name__in=brands)

        attributes = self.request.query_params.getlist('attribute')
        if attributes:
            for attr_id in attributes:
                queryset = queryset.filter(attributes__attribute_id=attr_id)

        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            queryset = queryset.filter(stock__gt=0)

        return queryset.distinct()

    @action(detail=False)
    def featured(self, request):
        return self._custom_filter(request, is_featured=True)

    @action(detail=False)
    def new_arrivals(self, request):
        return self._custom_filter(request, is_new_arrival=True)

    @action(detail=False)
    def top_sellers(self, request):
        # Get products marked as top sellers
        queryset = self.get_queryset().filter(is_top_seller=True)

        # If no products are marked as top sellers, get products with highest sales count
        if not queryset.exists():
            queryset = self.get_queryset().order_by('-sales_count')[:10]

        # Order by sales count
        queryset = queryset.order_by('-sales_count')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def _custom_filter(self, request, **kwargs):
        queryset = self.get_queryset().filter(**kwargs)
        ordering = kwargs.get('ordering')
        if ordering:
            queryset = queryset.order_by(ordering)
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
    category_name = request.query_params.get('category', '')
    if not category_name:
        brands = Brand.objects.all()
    else:
        brands = Brand.objects.filter(products__category__name=category_name).distinct()
    serializer = BrandSerializer(brands, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_products(request):
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