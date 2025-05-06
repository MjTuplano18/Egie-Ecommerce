from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class Customer(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    birth_date = models.DateField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    profile_picture = models.CharField(max_length=255, blank=True, null=True)  # For storing file path
    created_at = models.DateTimeField(auto_now_add=True)
    verification_code = models.CharField(max_length=10, blank=True, null=True)
    verification_code_timestamp = models.DateTimeField(null=True, blank=True)


    def __str__(self):
        return self.username

class UserAddress(models.Model):
    ADDRESS_TYPE_CHOICES = [('billing', 'Billing'), ('shipping', 'Shipping')]

    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='addresses')
    address_line = models.TextField()
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10)
    country = models.CharField(max_length=100, default='Philippines')
    address_type = models.CharField(max_length=20, choices=ADDRESS_TYPE_CHOICES)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'address_type')

    def __str__(self):
        return f"{self.user.username} - {self.address_line}, {self.city}"

class UserPayment(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    provider = models.CharField(max_length=50)
    payment_method_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.provider}"

class Notification(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"

class Wishlist(models.Model):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"