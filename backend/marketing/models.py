from django.db import models

# Create your models here.
class Bundle(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class BundleItem(models.Model):
    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} of {self.product.productName} in {self.bundle.name}"

class BundleRating(models.Model):
    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE)
    rating = models.PositiveIntegerField()
    review = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rating} stars for {self.bundle.name} by {self.user.username}"


class ProductBundleDiscount(models.Model):
    discount = models.ForeignKey('products.Discount', on_delete=models.CASCADE, related_name='bundle_discounts')
    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name='discounts')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='bundle_discounts')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('discount', 'bundle', 'product')

    def __str__(self):
        return f"{self.discount.code} for {self.bundle.name} - {self.product.productName}"
