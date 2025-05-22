from rest_framework import serializers
from .models import Bundle, BundleItem, BundleRating
from products.serializers import ProductListSerializer

class BundleItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True, required=False)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    savings = serializers.SerializerMethodField()

    class Meta:
        model = BundleItem
        fields = ['id', 'product', 'product_id', 'quantity', 'unit_price', 'subtotal', 'savings']

    def get_savings(self, obj):
        if not obj.bundle or not obj.subtotal:
            return 0
        return (obj.subtotal * obj.bundle.discount_percentage) / 100

class BundleRatingSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = BundleRating
        fields = ['id', 'rating', 'review', 'createdAt', 'username']

    def get_username(self, obj):
        return obj.user.username if obj.user else "Anonymous"

class BundleListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    savings_amount = serializers.DecimalField(max_digits=10, decimal_places=2, source='total_savings', read_only=True)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Bundle
        fields = [
            'id', 'name', 'description', 'image', 'item_count',
            'average_rating', 'total_price', 'discounted_price',
            'savings_amount', 'discount_percentage', 'featured',
            'createdAt'
        ]

    def get_item_count(self, obj):
        return obj.items.count()

    def get_average_rating(self, obj):
        return obj.average_rating

class BundleDetailSerializer(serializers.ModelSerializer):
    items = BundleItemSerializer(many=True, read_only=True)
    ratings = BundleRatingSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    savings_amount = serializers.DecimalField(max_digits=10, decimal_places=2, source='total_savings', read_only=True)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=1, read_only=True)
    ratings_count = serializers.SerializerMethodField()

    class Meta:
        model = Bundle
        fields = [
            'id', 'name', 'description', 'image', 'items', 'ratings',
            'total_price', 'discounted_price', 'savings_amount',
            'discount_percentage', 'average_rating', 'ratings_count',
            'featured', 'createdAt', 'updatedAt'
        ]

    def get_ratings_count(self, obj):
        return obj.ratings.count()