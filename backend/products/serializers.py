# backend/products/serializers.py
from rest_framework import serializers
from .models import (
    ProductCategory, Brand, Color, Product, ProductImage,
    AttributeType, AttributeOption, ProductAttribute, Discount,
    RatingReview
)

class ProductCategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'image', 'image_url', 'parent']

    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'url'):
                return obj.image.url
        except Exception:
            pass
        return None

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'description']

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name']

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'alt_text', 'is_feature']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

class AttributeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeType
        fields = ['id', 'name']

class AttributeOptionSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='type.name', read_only=True)

    class Meta:
        model = AttributeOption
        fields = ['id', 'type', 'type_name', 'value']

class ProductAttributeSerializer(serializers.ModelSerializer):
    attribute_details = AttributeOptionSerializer(source='attribute', read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ['id', 'attribute', 'attribute_details']

class ProductListSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'short_description', 'selling_price',
            'brand_name', 'category_name', 'sub_category', 'rating',
            'is_featured', 'is_new_arrival', 'is_top_seller', 'main_image'
        ]

    def get_main_image(self, obj):
        feature_image = obj.images.filter(is_feature=True).first()
        if feature_image:
            return feature_image.image.url
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = ProductCategorySerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'description', 'short_description',
            'original_price', 'selling_price', 'stock', 'brand', 'category',
            'color', 'is_featured', 'is_new_arrival', 'is_top_seller',
            'rating', 'ratings_count', 'sales_count', 'specifications',
            'sub_category', 'images', 'attributes', 'added_at', 'updated_at'
        ]

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    color_name = serializers.CharField(source='color.name', read_only=True) if Color else None
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(source='attributes.all', many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'original_price',
            'selling_price', 'stock', 'brand', 'brand_name',
            'category', 'category_name', 'color', 'color_name',
            'added_at', 'updated_at', 'is_active', 'images',
            'attributes', 'average_rating', 'review_count'
        ]

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return sum(review.rating for review in reviews) / reviews.count()
        return 0

    def get_review_count(self, obj):
        return obj.reviews.count()

class RatingReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = RatingReview
        fields = ['id', 'user_name', 'product', 'rating', 'review', 'created_at']

class ProductDetailSerializer(ProductSerializer):
    reviews = RatingReviewSerializer(many=True, read_only=True, source='reviews')

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['reviews']
