from django.db import models

# Create your models here.
class AdminType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class AdminUser(models.Model):
    user = models.OneToOneField('accounts.Customer', on_delete=models.CASCADE)
    adminType = models.ForeignKey(AdminType, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.adminType.name}"
