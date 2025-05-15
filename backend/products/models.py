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
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField()
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products')
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    # New fields
    is_featured = models.BooleanField(default=False, help_text="Mark this product as featured")
    is_new_arrival = models.BooleanField(default=True, help_text="Mark this product as a new arrival")
    is_top_seller = models.BooleanField(default=False, help_text="Mark this product as a top seller")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00,
                               validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    ratings_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(default=0, help_text="Number of times this product has been sold")
    specifications = models.JSONField(default=dict, blank=True, help_text="Technical specifications of the product")
    short_description = models.TextField(blank=True, help_text="A brief description for product listings")
    sub_category = models.CharField(max_length=100, blank=True, help_text="Sub-category or type of the product")

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_new_arrival']),
            models.Index(fields=['is_top_seller']),
            models.Index(fields=['rating']),
            models.Index(fields=['sales_count']),
        ]
        ordering = ['-added_at']  # Newest products first by default

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        if self.ratings_count == 0:
            return 0
        return self.rating

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    is_feature = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_feature', 'id']  # Featured images first

    def __str__(self):
        return f"Image for {self.product.name}"

    def save(self, *args, **kwargs):
        if self.is_feature:
            # If this image is being set as featured, unset is_feature for other images
            ProductImage.objects.filter(product=self.product).exclude(id=self.id).update(is_feature=False)
        elif not ProductImage.objects.filter(product=self.product, is_feature=True).exists():
            # If no featured image exists for this product, set this one as featured
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

class ProductAttribute(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    attribute = models.ForeignKey(AttributeOption, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('product', 'attribute')

    def __str__(self):
        return f"{self.product.name} - {self.attribute}"

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
