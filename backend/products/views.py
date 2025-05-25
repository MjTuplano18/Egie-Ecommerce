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
    AttributeType, AttributeOption, ProductAttribute, ProductVariation, Discount
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

    @action(detail=True, methods=['get'], url_path='compatible')
    def compatible_products(self, request, slug=None):
        """Get compatible products for a specific product"""
        product = self.get_object()
        compatible_products = product.compatible_builds.filter(is_active=True)

        # If no compatible products are explicitly set, try to find products in the same category
        if not compatible_products.exists() and product.category:
            # Get up to 6 products from the same category, excluding the current product
            compatible_products = Product.objects.filter(
                category=product.category,
                is_active=True
            ).exclude(id=product.id)[:6]

        # Use a custom serializer to include all needed fields
        serializer = ProductListSerializer(compatible_products, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by category name
        category_name = self.request.query_params.get('category__name')
        if category_name:
            queryset = queryset.filter(category__name=category_name)

        # Filter by subcategory
        subcategory_name = self.request.query_params.get('subcategory__name')
        if subcategory_name and subcategory_name != 'all':
            queryset = queryset.filter(sub_category__iexact=subcategory_name)

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
    lookup_field = 'name'  # Allow looking up categories by name

    @action(detail=False, methods=['get'])
    def subcategories(self, request):
        """Get subcategories for a specific category"""
        category_name = request.query_params.get('category', '')
        if not category_name:
            return Response({'message': 'Category parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the parent category
            parent_category = ProductCategory.objects.get(name=category_name)
            # Get all subcategories
            subcategories = Product.objects.filter(
                category=parent_category
            ).values('sub_category').distinct()
            
            # Extract unique subcategory names
            subcategory_list = [
                {'id': idx, 'name': item['sub_category']} 
                for idx, item in enumerate(subcategories) 
                if item['sub_category']
            ]
            
            return Response(subcategory_list)
        except ProductCategory.DoesNotExist:
            return Response(
                {'message': f'Category "{category_name}" not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        category = self.get_object()
        products = Product.objects.filter(category=category, is_active=True)

        # Apply additional filters if provided
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            products = products.filter(selling_price__gte=min_price)
        if max_price:
            products = products.filter(selling_price__lte=max_price)

        rating = request.query_params.get('rating__gte')
        if rating:
            products = products.filter(rating__gte=rating)

        brand_names = request.query_params.get('brand_names')
        if brand_names:
            brands = [name.strip() for name in brand_names.split(',')]
            products = products.filter(brand__name__in=brands)

        in_stock = request.query_params.get('in_stock')
        if in_stock == 'true':
            products = products.filter(stock__gt=0)

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

@api_view(['GET'])
@permission_classes([AllowAny])
def products_by_category_name(request):
    category_name = request.query_params.get('name', '')
    if not category_name:
        return Response({'message': 'Category name parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Get the category
    try:
        category = ProductCategory.objects.get(name=category_name)
    except ProductCategory.DoesNotExist:
        return Response({'message': f'Category "{category_name}" not found'}, status=status.HTTP_404_NOT_FOUND)

    # Get products for this category
    products = Product.objects.filter(category=category, is_active=True)

    # Apply additional filters
    min_price = request.query_params.get('min_price')
    max_price = request.query_params.get('max_price')
    if min_price:
        products = products.filter(selling_price__gte=min_price)
    if max_price:
        products = products.filter(selling_price__lte=max_price)

    rating = request.query_params.get('rating__gte')
    if rating:
        products = products.filter(rating__gte=rating)

    brand_names = request.query_params.get('brand_names')
    if brand_names:
        brands = [name.strip() for name in brand_names.split(',')]
        products = products.filter(brand__name__in=brands)

    in_stock = request.query_params.get('in_stock')
    if in_stock == 'true':
        products = products.filter(stock__gt=0)

    # Paginate results if needed
    paginator = PageNumberPagination()
    paginator.page_size = 12
    page = paginator.paginate_queryset(products, request)

    if page is not None:
        serializer = ProductListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def variation_values_by_category(request):
    category_name = request.query_params.get('category', '')
    if not category_name:
        return Response({'message': 'Category name parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        category = ProductCategory.objects.get(name=category_name)
        variation_type = category.variation_type

        if variation_type and variation_type.attribute_type:
            values = AttributeOption.objects.filter(
                type=variation_type.attribute_type
            ).values_list('value', flat=True)
            return Response(list(values))

        return Response([])
    except ProductCategory.DoesNotExist:
        return Response({'message': f'Category "{category_name}" not found'}, status=status.HTTP_404_NOT_FOUND)

