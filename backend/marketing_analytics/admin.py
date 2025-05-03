from django.contrib import admin
from .models import MarketingCampaign, ProductView, Referral, CouponUsageHistory

admin.site.register(MarketingCampaign)
admin.site.register(ProductView)
admin.site.register(Referral)
admin.site.register(CouponUsageHistory)

# Register your models here.
