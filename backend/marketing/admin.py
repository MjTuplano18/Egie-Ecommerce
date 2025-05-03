from django.contrib import admin
from .models import ProductBundleDiscount, Bundle, BundleItem, BundleRating

admin.site.register(ProductBundleDiscount)
admin.site.register(Bundle)
admin.site.register(BundleItem)
admin.site.register(BundleRating)
# Register your models here.
