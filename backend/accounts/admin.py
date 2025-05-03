from django.contrib import admin
from .models import  Customer, UserAddress, UserPayment, Notification, Wishlist
# Register your models here.
admin.site.register(Customer)
admin.site.register(UserAddress)
admin.site.register(UserPayment)
admin.site.register(Notification)
admin.site.register(Wishlist)
