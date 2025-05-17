# backend/products/serializers.py
from rest_framework import serializers
from .models import (
    ProductCategory, Brand, Color, Product, ProductImage,
    AttributeType, AttributeOption, ProductAttribute, Discount,
    RatingReview, ProductPerformance
)

class ProductCategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'image', 'image_url', 'parent']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
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
        if feature_image and feature_image.image:
             return feature_image.image.url

        first_image =obj.images.first()
        if first_image and first_image.image:
            return first_image.image.url
        return None

class RatingReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = RatingReview
        fields = ['id', 'user_name', 'product', 'rating', 'review', 'created_at']

class ProductDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = ProductCategorySerializer(read_only=True)
    color = ColorSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    reviews = RatingReviewSerializer(many=True, read_only=True, source='reviews')

    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'description', 'short_description',
            'original_price', 'selling_price', 'stock', 'brand', 'category',
            'color', 'is_featured', 'is_new_arrival', 'is_top_seller',
            'rating', 'ratings_count', 'sales_count', 'specifications',
            'sub_category', 'images', 'attributes', 'added_at', 'updated_at', 'reviews'
        ]