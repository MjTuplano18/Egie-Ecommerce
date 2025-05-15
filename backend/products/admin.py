from django.contrib import admin
from django.utils.html import format_html
from .models import ProductCategory, Brand, Color, Product, ProductImage, AttributeType, AttributeOption, ProductAttribute

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    readonly_fields = ['image_preview']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="150" height="150" style="object-fit: contain;" />', obj.image.url)
        return "No image"

class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'selling_price', 'stock', 'rating', 'ratings_count', 'is_active', 'is_new_arrival', 'is_top_seller')
    list_filter = ('category', 'brand', 'is_active', 'is_new_arrival', 'is_top_seller')
    search_fields = ('name', 'description', 'brand__name', 'category__name')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductAttributeInline]
    list_editable = ('is_active', 'is_new_arrival', 'is_top_seller')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'short_description')
        }),
        ('Categorization', {
            'fields': ('category', 'brand', 'color')
        }),
        ('Pricing', {
            'fields': ('original_price', 'selling_price')
        }),
        ('Inventory', {
            'fields': ('stock',)
        }),
        ('Rating', {
            'fields': ('rating', 'ratings_count'),
            'description': 'Product rating (0-5 stars) and number of ratings received'
        }),
        ('Status', {
            'fields': ('is_active', 'is_new_arrival', 'is_top_seller')
        }),
        ('Specifications', {
            'fields': ('specifications',),
            'classes': ('collapse',)
        }),
        ('Additional Metrics', {
            'fields': ('sales_count',),
            'classes': ('collapse',)
        })
    )

@admin.register(ProductCategory)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'image_preview')
    search_fields = ('name',)
    list_filter = ('parent',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: contain;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Image'

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'is_feature')
    list_filter = ('is_feature', 'product__category')
    search_fields = ('product__name',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: contain;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Preview'

@admin.register(AttributeType)
class AttributeTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(AttributeOption)
class AttributeOptionAdmin(admin.ModelAdmin):
    list_display = ('type', 'value')
    list_filter = ('type',)