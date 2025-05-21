from django.db import models

class Bundle(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='bundles/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=7.00, help_text="Default bundle discount of 7%")
    total_savings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    featured = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def calculate_savings(self):
        """Calculate and update the total savings for the bundle"""
        total = self.total_price
        self.total_savings = (total * self.discount_percentage) / 100
        self.save(update_fields=['total_savings'])

    @property
    def average_rating(self):
        """Calculate the average rating for this bundle"""
        ratings = self.ratings.all()
        if not ratings:
            return 0
        return sum(r.rating for r in ratings) / ratings.count()

    @property
    def total_price(self):
        """Calculate the total price of all items in the bundle"""
        return sum(item.product.selling_price * item.quantity for item in self.items.all())

    @property
    def discounted_price(self):
        """Calculate the discounted price after applying the bundle discount"""
        total = self.total_price
        if total > 0:
            discount_amount = (total * self.discount_percentage) / 100
            return total - discount_amount
        return 0

    def __str__(self):
        return self.name

class BundleItem(models.Model):
    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, editable=False)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, editable=False)

    def save(self, *args, **kwargs):
        # Update prices when saving
        if self.product:
            self.unit_price = self.product.selling_price
            self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        # Recalculate bundle savings
        self.bundle.calculate_savings()

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.bundle.name}"

class BundleRating(models.Model):
    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE)
    rating = models.PositiveIntegerField()
    review = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('bundle', 'user')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update bundle rating
        bundle = self.bundle
        avg_rating = bundle.ratings.aggregate(models.Avg('rating'))['rating__avg'] or 0
        bundle.rating = avg_rating
        bundle.save(update_fields=['rating'])

class ProductBundleDiscount(models.Model):
    discount = models.ForeignKey('products.Discount', on_delete=models.CASCADE, related_name='bundle_discounts')
    bundle = models.ForeignKey(Bundle, on_delete=models.CASCADE, related_name='discounts')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='bundle_discounts')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('discount', 'bundle', 'product')

    def __str__(self):
        return f"{self.discount.code} for {self.bundle.name} - {self.product.productName}"
