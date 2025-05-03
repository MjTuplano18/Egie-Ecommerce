from django.contrib import admin
from .models import (
    ProductCategory,
    Brand,
    Color,
    Product,
    ProductImage,
    AttributeType,
    AttributeOption,
    ProductAttribute,
    ProductInventory,
    Discount,
    RatingReview,
    ProductPerformance
)

# Register your models here.
admin.site.register(ProductCategory)
admin.site.register(Brand)
admin.site.register(Color)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(AttributeType)
admin.site.register(AttributeOption)
admin.site.register(ProductAttribute)
admin.site.register(ProductInventory)
admin.site.register(Discount)
admin.site.register(RatingReview)
admin.site.register(ProductPerformance)