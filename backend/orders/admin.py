from django.contrib import admin
from .models import Cart, CartItem, OrderDetails, OrderItem, Payment, Shipping

admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(OrderDetails)
admin.site.register(OrderItem)
admin.site.register(Payment)
admin.site.register(Shipping)

# Register your models here.
