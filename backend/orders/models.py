from django.db import models
from django.utils import timezone

class Cart(models.Model):
    user = models.OneToOneField('accounts.Customer', on_delete=models.CASCADE, related_name='cart', null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.user:
            return f"Cart of {self.user.username}"
        return f"Anonymous Cart #{self.id}"

    def is_expired(self):
        from datetime import timedelta
        from django.utils import timezone
        return timezone.now() - self.last_activity > timedelta(days=7)

    def reactivate(self):
        """Reactivate an inactive cart"""
        from django.utils import timezone
        # Only reactivate if not expired
        if not self.is_expired():
            self.is_active = True
            self.last_activity = timezone.now()
            return True
        return False

    def deactivate(self):
        """Deactivate cart"""
        self.is_active = False
        self.save()

    @property
    def total(self):
        """Calculate total price of all items in cart"""
        return sum(item.subtotal for item in self.items.all())
    
    @property
    def items_count(self):
        """Get number of unique items in cart"""
        return self.items.count()
    
    @property
    def total_quantity(self):
        """Get total quantity of all items in cart"""
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    variation = models.ForeignKey('products.ProductVariation', null=True, blank=True, 
                                on_delete=models.SET_NULL, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    selected = models.BooleanField(default=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product', 'variation')

    def __str__(self):
        variation_name = f" ({self.variation.name})" if self.variation else ""
        cart_owner = self.cart.user.username if self.cart.user else f"Anonymous Cart #{self.cart.id}"
        return f"{self.quantity} of {self.product.name}{variation_name} in {cart_owner}'s cart"

    @property
    def unit_price(self):
        """Get price of single unit considering variations"""
        if self.variation:
            return self.variation.final_price
        return self.product.selling_price

    @property
    def subtotal(self):
        """Calculate total price for this item"""
        return self.unit_price * self.quantity

    def clean(self):
        """Validate stock availability"""
        from django.core.exceptions import ValidationError
        available_stock = self.variation.stock if self.variation else self.product.stock
        if self.quantity > available_stock:
            raise ValidationError(f'Only {available_stock} items available in stock')

class OrderDetails(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        CONFIRMED = 'Confirmed', 'Confirmed'
        SHIPPED = 'Shipped', 'Shipped'
        DELIVERED = 'Delivered', 'Delivered'
        CANCELLED = 'Cancelled', 'Cancelled'
        FAILED = 'Failed', 'Failed'
        RETURNED = 'Returned', 'Returned'

    user = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='orders')
    totalPrice = models.DecimalField(max_digits=10, decimal_places=2)
    createdAt = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    discount = models.ForeignKey('products.Discount', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(OrderDetails, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.product.productName} in Order #{self.order.id}"

class Payment(models.Model):
    class PaymentProvider(models.TextChoices):
        GCASH = 'GCash', 'GCash'
        PAYMAYA = 'PayMaya', 'PayMaya'
        CREDIT_CARD = 'CreditCard', 'Credit Card'
        COD = 'CashOnDelivery', 'Cash on Delivery'

    class PaymentStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        CONFIRMED = 'Confirmed', 'Confirmed'
        FAILED = 'Failed', 'Failed'
        CANCELLED = 'Cancelled', 'Cancelled'
        REFUNDED = 'Refunded', 'Refunded'

    order = models.ForeignKey(OrderDetails, on_delete=models.CASCADE, related_name='payments')
    provider = models.CharField(max_length=50, choices=PaymentProvider.choices, default=PaymentProvider.GCASH)
    transaction_id = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id}"

class Shipping(models.Model):
    user = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='shipping')
    order = models.ForeignKey(OrderDetails, on_delete=models.CASCADE, related_name='shipping')
    trackingNumber = models.CharField(max_length=100)
    address = models.TextField()
    shippingMethod = models.CharField(max_length=50)
    shippedAt = models.DateTimeField(null=True, blank=True)
    deliveredAt = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50)

    def __str__(self):
        return f"Shipping for Order #{self.order.id}"

class OrderReport(models.Model):
    order = models.ForeignKey(OrderDetails, on_delete=models.CASCADE, related_name='reports')
    reportText = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for Order #{self.order.id}"