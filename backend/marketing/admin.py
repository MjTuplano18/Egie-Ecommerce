from django.contrib import admin
from django import forms
from .models import ProductBundleDiscount, Bundle, BundleItem, BundleRating, CustomBuild, CustomBuildItem
from products.models import Product

class CustomBuildItemInline(admin.TabularInline):
    model = CustomBuildItem
    extra = 1
    fields = ['product', 'component_type', 'quantity', 'price']
    readonly_fields = ['price']

class BundleItemInline(admin.TabularInline):
    model = BundleItem
    extra = 1  # Number of empty forms to display
    fields = ['product', 'quantity', 'unit_price', 'subtotal']
    readonly_fields = ['unit_price', 'subtotal']

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        # Add a queryset filter for products if needed
        formset.form.base_fields['product'].queryset = Product.objects.filter(is_active=True)
        return formset

@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ['name', 'discount_percentage', 'total_price', 'discounted_price', 'total_savings', 'is_active', 'featured']
    list_filter = ['is_active', 'featured']
    search_fields = ['name', 'description']
    readonly_fields = ['total_savings']
    inlines = [BundleItemInline]

    def total_price(self, obj):
        return f"₱{obj.total_price:,.2f}"

    def discounted_price(self, obj):
        return f"₱{obj.discounted_price:,.2f}"

@admin.register(BundleRating)
class BundleRatingAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'user', 'rating', 'createdAt']
    list_filter = ['rating', 'createdAt']
    search_fields = ['bundle__name', 'user__username', 'review']

@admin.register(BundleItem)
class BundleItemAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'product', 'quantity', 'unit_price', 'subtotal']
    list_filter = ['bundle']
    search_fields = ['bundle__name', 'product__name']
    readonly_fields = ['unit_price', 'subtotal']

# Custom Build Admin
class CustomBuildItemInline(admin.TabularInline):
    model = CustomBuildItem
    extra = 1
    fields = ['product', 'component_type', 'quantity', 'price']
    readonly_fields = ['price']

@admin.register(CustomBuild)
class CustomBuildAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'total_price', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'user__username', 'description']
    inlines = [CustomBuildItemInline]

# Register remaining models
admin.site.register(ProductBundleDiscount)
admin.site.register(CustomBuildItem)