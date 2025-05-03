from django.db import models
from accounts.models import Customer


# Create your models here.
class MarketingCampaign(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ProductView(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_views')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='views')
    viewed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} viewed by {self.user or 'Guest'}"

class Referral(models.Model):
    referrer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='referrals_made')
    referred_user = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='referred_by')
    referral_code = models.CharField(max_length=100)
    used_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.referrer.username} referred {self.referred_user.username}"

class CouponUsageHistory(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='coupon_usage')
    discount = models.ForeignKey('products.Discount', on_delete=models.CASCADE)
    order_id = models.PositiveIntegerField()
    used_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} used {self.discount.code}"