from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class ProductCategory(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories')

    class Meta:
        verbose_name_plural = 'Product Categories'

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Color(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    short_description = models.TextField(blank=True, help_text="A brief description for product listings")
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(help_text="Base stock for product without variations. If variations exist, their individual stocks will be used instead.")
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products')
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=True)
    is_top_seller = models.BooleanField(default=False)

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    ratings_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(default=0)

    specifications = models.JSONField(default=dict, blank=True)
    warranty = models.CharField(max_length=255, blank=True, help_text="Warranty period or conditions")
    sub_category = models.CharField(max_length=100, blank=True)

    bundles = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='bundled_with')
    compatible_builds = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='compatible_with')

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_new_arrival']),
            models.Index(fields=['is_top_seller']),
            models.Index(fields=['rating']),
            models.Index(fields=['sales_count']),
        ]
        ordering = ['-added_at']

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        if self.ratings_count == 0:
            return 0
        return self.rating

    @property
    def total_stock(self):
        """
        Calculate total available stock.
        If variations exist, return the sum of all variation stocks.
        Otherwise, return the base product stock.
        """
        variations = self.variations.all()
        if variations.exists():
            return sum(variation.stock for variation in variations)
        return self.stock

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    is_feature = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_feature', 'id']

    def __str__(self):
        return f"Image for {self.product.name}"

    def save(self, *args, **kwargs):
        if self.is_feature:
            ProductImage.objects.filter(product=self.product).exclude(id=self.id).update(is_feature=False)
        elif not ProductImage.objects.filter(product=self.product, is_feature=True).exists():
            self.is_feature = True
        super().save(*args, **kwargs)

class AttributeType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class AttributeOption(models.Model):
    type = models.ForeignKey(AttributeType, on_delete=models.CASCADE, related_name='options')
    value = models.CharField(max_length=100)

    class Meta:
        unique_together = ('type', 'value')

    def __str__(self):
        return f"{self.type.name}: {self.value}"

class ProductVariation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=255, help_text="Variation name (e.g., '8GB/256SSD')")
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,
                                          help_text="Amount to add/subtract from base product price")
    stock = models.PositiveIntegerField(default=0, help_text="Available stock for this specific variation")
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('product', 'name')

    def __str__(self):
        return f"{self.product.name} - {self.name}"

    def save(self, *args, **kwargs):
        # If this is marked as default, unmark other variations
        if self.is_default:
            ProductVariation.objects.filter(product=self.product).exclude(id=self.id).update(is_default=False)
        # If no default exists for this product, mark this as default
        elif not ProductVariation.objects.filter(product=self.product, is_default=True).exists():
            self.is_default = True
        super().save(*args, **kwargs)

    @property
    def final_price(self):
        """Calculate the final price for this variation"""
        return self.product.selling_price + self.price_adjustment


class ProductAttribute(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    attribute = models.ForeignKey(AttributeOption, on_delete=models.CASCADE)
    variation = models.ForeignKey(ProductVariation, on_delete=models.CASCADE, related_name='attributes', null=True, blank=True)

    class Meta:
        unique_together = ('product', 'attribute', 'variation')

    def __str__(self):
        variation_name = f" ({self.variation.name})" if self.variation else ""
        return f"{self.product.name}{variation_name} - {self.attribute}"

class ProductInventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory')
    location = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Inventory of {self.product.name} at {self.location}"

class Discount(models.Model):
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    discount_percent = models.FloatField()
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

class RatingReview(models.Model):
    user = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField()
    review = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        indexes = [models.Index(fields=['product'])]

    def __str__(self):
        return f"Review by {self.user.username} on {self.product.name}"

class ProductPerformance(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='performance')
    sales_count = models.IntegerField(default=0)
    return_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Performance of {self.product.name}"
