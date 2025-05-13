# backend/products/views.py
from django.db.models import Q, Avg
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    ProductCategory, Brand, Color, Product, ProductImage,
    AttributeType, AttributeOption, ProductAttribute, Discount, RatingReview
)
from .serializers import (
    ProductCategorySerializer, BrandSerializer, ColorSerializer,
    ProductSerializer, ProductDetailSerializer, RatingReviewSerializer
)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'color']
    search_fields = ['name', 'description', 'brand__name', 'category__name']
    ordering_fields = ['name', 'selling_price', 'added_at', 'stock']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)

        # Price range filtering
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(selling_price__gte=float(min_price))

        if max_price:
            queryset = queryset.filter(selling_price__lte=float(max_price))

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

        return queryset

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products (newest products for now)"""
        products = self.get_queryset().order_by('-added_at')[:8]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def review(self, request, slug=None):
        """Add a review to a product"""
        product = self.get_object()

        # Check if user already reviewed this product
        if RatingReview.objects.filter(user=request.user, product=product).exists():
            return Response(
                {'message': 'You have already reviewed this product'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new review
        serializer = RatingReviewSerializer(data={
            'user': request.user.id,
            'product': product.id,
            'rating': request.data.get('rating'),
            'review': request.data.get('review')
        })

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]

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
def search_products(request):
    """Search products by name, description, brand, or category"""
    query = request.query_params.get('q', '')
    if not query:
        return Response({'message': 'Query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    products = Product.objects.filter(
        Q(name__icontains=query) |
        Q(description__icontains=query) |
        Q(brand__name__icontains=query) |
        Q(category__name__icontains=query)
    ).filter(is_active=True)

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)
