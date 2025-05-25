# backend/products/serializers.py
from rest_framework import serializers
from .models import (
    ProductCategory, Brand, Color, Product, ProductImage,
    AttributeType, AttributeOption, ProductAttribute, ProductVariation, Discount,
    RatingReview, ProductPerformance, ProductSpecification
)

class ProductCategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    variation_type = serializers.CharField(source='variation_type_display')

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'image', 'image_url', 'parent', 'variation_type', 'default_variation_type']

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

class ProductVariationSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariation
        fields = ['id', 'name', 'price_adjustment', 'stock', 'is_default', 'final_price', ]

class ProductAttributeSerializer(serializers.ModelSerializer):
    attribute_details = AttributeOptionSerializer(source='attribute', read_only=True)
    variation_name = serializers.CharField(source='variation.name', read_only=True, allow_null=True)

    class Meta:
        model = ProductAttribute
        fields = ['id', 'attribute', 'attribute_details', 'variation', 'variation_name']

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ['id', 'name', 'value']

class ProductListSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    brand = BrandSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image = serializers.SerializerMethodField()
    image_urls = serializers.SerializerMethodField()
    total_stock = serializers.ReadOnlyField()
    has_variations = serializers.SerializerMethodField()
    spec_entries = ProductSpecificationSerializer(many=True, read_only=True)
    attribute_option = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'short_description', 'selling_price',
            'original_price', 'brand_name', 'brand', 'category_name', 'sub_category', 'rating',
            'is_featured', 'is_new_arrival', 'is_top_seller', 'main_image', 'image_urls',
            'stock', 'total_stock', 'has_variations', 'specifications', 'spec_entries', 'variations',
            'attribute_option'
        ]

    def get_has_variations(self, obj):
        return obj.variations.exists()

    def get_main_image(self, obj):
        feature_image = obj.images.filter(is_feature=True).first()
        if feature_image and feature_image.image:
             return feature_image.image.url

        first_image = obj.images.first()
        if first_image and first_image.image:
            return first_image.image.url
        return None

    def get_image_urls(self, obj):
        """Get all image URLs for the product"""
        return [img.image.url for img in obj.images.all() if img.image]

    def get_attribute_option(self, obj):
        """
        Get the primary attribute option for this product based on its category.
        For example:
        - For Processors: returns the "Model" value (e.g., "Ryzen 7", "i7")
        - For RAM: returns the "Capacity" value (e.g., "8GB", "16GB")
        """
        # Try to get the category variation type
        try:
            category = obj.category
            variation_type = CategoryVariationType.objects.get(category=category)
            attribute_type = variation_type.attribute_type

            # Find product attributes with this type
            product_attrs = ProductAttribute.objects.filter(
                product=obj,
                attribute__type=attribute_type
            ).first()

            if product_attrs:
                return product_attrs.attribute.value

            # If no attribute found, check specifications
            if variation_type.name in obj.specifications:
                return obj.specifications[variation_type.name]

        except Exception:
            # If anything fails, try to extract from specifications
            if obj.category and obj.category.default_variation_type:
                variation_name = obj.category.default_variation_type
                if variation_name in obj.specifications:
                    return obj.specifications[variation_name]

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
    variations = ProductVariationSerializer(many=True, read_only=True)
    reviews = RatingReviewSerializer(many=True, read_only=True)
    spec_entries = ProductSpecificationSerializer(many=True, read_only=True)
    total_stock = serializers.ReadOnlyField()
    has_variations = serializers.SerializerMethodField()
    compatible_builds = serializers.SerializerMethodField()

    # Group attributes by type for easier frontend handling
    attribute_types = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'description', 'short_description',
            'original_price', 'selling_price', 'stock', 'total_stock', 'has_variations',
            'brand', 'category', 'color', 'is_featured', 'is_new_arrival', 'is_top_seller',
            'rating', 'ratings_count', 'sales_count', 'specifications', 'spec_entries', 'warranty',
            'sub_category', 'images', 'attributes', 'variations', 'attribute_types',
            'added_at', 'updated_at', 'reviews', 'compatible_builds'
        ]

    def get_compatible_builds(self, obj):
        """Get a list of compatible products"""
        compatible_builds = obj.compatible_builds.filter(is_active=True)
        if compatible_builds.exists():
            return ProductListSerializer(compatible_builds, many=True).data
        return []

    def get_has_variations(self, obj):
        return obj.variations.exists()

    def get_attribute_types(self, obj):
        """Group attributes by their type for easier frontend handling"""
        result = {}
        for attr in obj.attributes.all():
            type_name = attr.attribute.type.name
            if type_name not in result:
                result[type_name] = []

            # Include variation info if available
            variation_info = None
            if attr.variation:
                variation_info = {
                    'id': attr.variation.id,
                    'name': attr.variation.name,
                    'price_adjustment': float(attr.variation.price_adjustment),
                    'final_price': float(attr.variation.final_price),
                    'stock': attr.variation.stock,
                    'is_default': attr.variation.is_default
                }

            result[type_name].append({
                'id': attr.attribute.id,
                'value': attr.attribute.value,
                'variation': variation_info
            })

        return result