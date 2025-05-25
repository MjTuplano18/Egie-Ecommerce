from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import (
    ProductCategory, Brand, Color, Product, ProductImage,
    AttributeType, AttributeOption, ProductAttribute, ProductVariation,
    ProductInventory, Discount, RatingReview, ProductPerformance,
    ProductSpecification, CategoryVariationType
)

class ProductInventoryInline(admin.TabularInline):
    model = ProductInventory
    extra = 1
    fields = ('location', 'quantity', 'created_at', 'deleted_at')
    readonly_fields = ('created_at', 'deleted_at')

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 4
    readonly_fields = ['image_preview']

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="150" height="150" style="object-fit: contain;" />', obj.image.url)
        return "No image"

class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    fields = ('name', 'price_adjustment', 'stock', 'is_default')

class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1
    fields = ('attribute', 'variation')
    autocomplete_fields = ['attribute', 'variation']

class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 3
    fields = ('name', 'value')
    verbose_name = "Specification"
    verbose_name_plural = "Specifications"

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'brand', 'category', 'selling_price', 'stock',
        'is_featured', 'is_new_arrival', 'is_top_seller', 'average_rating'
    )
    list_filter = (
        'brand', 'category', 'is_featured', 'is_new_arrival',
        'is_top_seller', 'is_active'
    )
    search_fields = ('name', 'description', 'short_description', 'brand__name')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductVariationInline, ProductAttributeInline, ProductSpecificationInline, ProductInventoryInline]
    filter_horizontal = ('compatible_builds',)
    fieldsets = (
        (None, {
            'fields': (
                'name', 'slug', 'brand', 'category', 'sub_category', 'color',
                'description', 'short_description', 'warranty'
            )
        }),
        ('Pricing & Stock', {
            'fields': (
                'original_price', 'selling_price', 'stock'
            )
        }),
        ('Display Flags', {
            'fields': (
                'is_featured', 'is_new_arrival', 'is_top_seller', 'is_active'
            )
        }),
        ('Ratings & Stats', {
            'fields': (
                'rating', 'ratings_count', 'sales_count'
            )
        }),
        ('Relations', {
            'fields': (
                'compatible_builds',
            )
        }),
    )

@admin.register(CategoryVariationType)
class CategoryVariationTypeAdmin(admin.ModelAdmin):
    list_display = ('category', 'name')
    search_fields = ('category__name', 'name')

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'default_variation_type')
    search_fields = ('name',)
    list_filter = ('parent',)

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(AttributeType)
class AttributeTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(AttributeOption)
class AttributeOptionAdmin(admin.ModelAdmin):
    list_display = ('type', 'value')
    list_filter = ('type',)
    search_fields = ('value',)

@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'price_adjustment', 'stock', 'is_default')
    list_filter = ('is_default',)
    search_fields = ('product__name', 'name')

@admin.register(ProductInventory)
class ProductInventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'location', 'quantity', 'created_at', 'deleted_at')
    list_filter = ('location',)
    search_fields = ('product__name',)

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'valid_from', 'valid_to', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('code',)

@admin.register(RatingReview)
class RatingReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'rating', 'created_at')
    search_fields = ('user__username', 'product__name')
    list_filter = ('rating', 'created_at')

@admin.register(ProductSpecification)
class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'value')
    list_filter = ('name',)
    search_fields = ('product__name', 'name', 'value')
    autocomplete_fields = ['product']

@admin.register(ProductPerformance)
class ProductPerformanceAdmin(admin.ModelAdmin):
    list_display = ('product', 'sales_count', 'return_count')
    search_fields = ('product__name',)