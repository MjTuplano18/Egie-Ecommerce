from django.contrib import admin
from .models import UserActivityLog, AuditLog

# Register your models here.
admin.site.register(UserActivityLog)
admin.site.register(AuditLog)
