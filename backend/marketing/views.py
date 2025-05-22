from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, Sum, F
from django.utils import timezone

from .models import Bundle, BundleItem, BundleRating
from .serializers import BundleListSerializer, BundleDetailSerializer, BundleRatingSerializer, BundleItemSerializer
from products.models import Product, ProductCategory

class BundleViewSet(viewsets.ModelViewSet):
    queryset = Bundle.objects.filter(is_active=True)
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return BundleListSerializer
        if self.action in ['add_item', 'bulk_add_items']:
            return BundleItemSerializer
        return BundleDetailSerializer

    def list(self, request, *args, **kwargs):
        """Get all active bundles with optional filtering"""
        queryset = self.filter_queryset(self.get_queryset())

        # Filter by featured status
        featured = request.query_params.get('featured', None)
        if featured is not None:
            queryset = queryset.filter(featured=featured == 'true')

        # Filter by minimum savings
        min_savings = request.query_params.get('min_savings', None)
        if min_savings:
            queryset = queryset.filter(total_savings__gte=float(min_savings))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top-rated bundles"""
        top_bundles = self.queryset.annotate(
            avg_rating=Avg('ratings__rating')
        ).filter(
            avg_rating__gt=0
        ).order_by('-avg_rating', '-createdAt')[:4]

        serializer = BundleListSerializer(top_bundles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured bundles with highest savings"""
        featured_bundles = self.queryset.filter(
            featured=True
        ).order_by('-total_savings')[:6]

        serializer = BundleListSerializer(featured_bundles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add a product to a bundle"""
        bundle = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        bundle_item, created = BundleItem.objects.get_or_create(
            bundle=bundle,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            bundle_item.quantity += quantity
            bundle_item.save()

        bundle.calculate_savings()
        serializer = BundleDetailSerializer(bundle)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """Rate a bundle"""
        bundle = self.get_object()
        user = request.user

        if not user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        rating = request.data.get('rating')
        review = request.data.get('review', '')

        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return Response(
                {'error': 'Invalid rating value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        bundle_rating, created = BundleRating.objects.get_or_create(
            bundle=bundle,
            user=user,
            defaults={'rating': rating, 'review': review}
        )

        if not created:
            bundle_rating.rating = rating
            bundle_rating.review = review
            bundle_rating.save()

        serializer = BundleDetailSerializer(bundle)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """Get recommended bundles including both top-rated and featured bundles"""
        # First get bundles with ratings
        rated_bundles = self.queryset.annotate(
            avg_rating=Avg('ratings__rating')
        ).filter(
            avg_rating__isnull=False  # Only get bundles that have ratings
        ).order_by('-avg_rating', '-createdAt')[:3]

        # Then get featured bundles that aren't in the rated bundles
        featured_bundles = self.queryset.filter(
            featured=True
        ).exclude(
            id__in=rated_bundles.values_list('id', flat=True)
        ).order_by('-total_savings')[:3]

        # If we still don't have enough bundles, get the most recently created ones
        total_bundles = rated_bundles.count() + featured_bundles.count()
        if total_bundles < 6:
            remaining_bundles = self.queryset.exclude(
                id__in=list(rated_bundles.values_list('id', flat=True)) +
                      list(featured_bundles.values_list('id', flat=True))
            ).order_by('-createdAt')[:6-total_bundles]
        else:
            remaining_bundles = []

        # Combine all bundles
        bundles = list(rated_bundles) + list(featured_bundles) + list(remaining_bundles)
        serializer = BundleListSerializer(bundles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """Rate a bundle"""
        bundle = self.get_object()
        user = request.user

        # Check if user has already rated this bundle
        existing_rating = BundleRating.objects.filter(bundle=bundle, user=user).first()

        if existing_rating:
            # Update existing rating
            serializer = BundleRatingSerializer(existing_rating, data=request.data)
        else:
            # Create new rating
            serializer = BundleRatingSerializer(data=request.data)

        if serializer.is_valid():
            if not existing_rating:
                serializer.save(bundle=bundle, user=user)
            else:
                serializer.save()

            # Update bundle's average rating
            bundle.rating = bundle.average_rating
            bundle.save()

            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def bulk_add_items(self, request, pk=None):
        """Add multiple products to a bundle at once"""
        bundle = self.get_object()
        items = request.data.get('items', [])

        if not isinstance(items, list):
            return Response(
                {'error': 'Items must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        added_items = []
        errors = []

        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)

            try:
                product = Product.objects.get(pk=product_id)

                # Validate product availability
                if not product.is_active or product.stock < quantity:
                    errors.append(f"Product {product.name} is not available in requested quantity")
                    continue

                bundle_item, created = BundleItem.objects.get_or_create(
                    bundle=bundle,
                    product=product,
                    defaults={'quantity': quantity}
                )

                if not created:
                    bundle_item.quantity = quantity  # Update quantity instead of adding
                    bundle_item.save()

                added_items.append(bundle_item)

            except Product.DoesNotExist:
                errors.append(f"Product with ID {product_id} not found")

        if added_items:
            bundle.calculate_savings()

        response_data = {
            'bundle': BundleDetailSerializer(bundle).data,
            'added_items': BundleItemSerializer(added_items, many=True).data
        }

        if errors:
            response_data['errors'] = errors
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)

        return Response(response_data)

    @action(detail=True, methods=['post'])
    def update_item(self, request, pk=None):
        """Update the quantity of a product in the bundle"""
        bundle = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        if quantity < 0:
            return Response(
                {'error': 'Quantity must be positive'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            bundle_item = BundleItem.objects.get(
                bundle=bundle,
                product_id=product_id
            )

            if quantity == 0:
                bundle_item.delete()
                bundle.calculate_savings()
                return Response({'message': 'Item removed from bundle'})

            bundle_item.quantity = quantity
            bundle_item.save()

            bundle.calculate_savings()
            return Response(BundleItemSerializer(bundle_item).data)

        except BundleItem.DoesNotExist:
            return Response(
                {'error': 'Product not found in bundle'},
                status=status.HTTP_404_NOT_FOUND
            )