from django.db import models

# Create your models here.
class SalesReport(models.Model):
    reportName = models.CharField(max_length=255)
    totalSales = models.PositiveIntegerField(default=0)
    totalOrders = models.PositiveIntegerField(default=0)
    totalRevenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-createdAt']

    def __str__(self):
        return f"Report: {self.reportName} - {self.createdAt.strftime('%Y-%m-%d')}"

class ProductSales(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='product_sales')
    report = models.ForeignKey(SalesReport, on_delete=models.CASCADE, related_name='sales_entries')
    totalRevenue = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('product', 'report')

    def __str__(self):
        return f"{self.product.productName} - {self.totalRevenue} in {self.report.reportName}"

