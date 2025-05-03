from django.db import models

# Create your models here.
class UserActivityLog(models.Model):
    user = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='activity_logs')
    activity_type = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.activity_type}"

class AuditLog(models.Model):
    action = models.CharField(max_length=255)
    performed_by = models.ForeignKey('accounts.Customer', on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    table_name = models.CharField(max_length=255)
    object_id = models.PositiveIntegerField()
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audit: {self.action} on {self.table_name} by {self.performed_by}"