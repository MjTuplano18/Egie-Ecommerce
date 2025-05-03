from django.contrib import admin
from .models import AdminType, AdminUser

admin.site.register(AdminType)
admin.site.register(AdminUser)
# Register your models here.
