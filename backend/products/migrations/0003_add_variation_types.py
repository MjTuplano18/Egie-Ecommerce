# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_productvariation_original_price'),
    ]

    operations = [
        migrations.CreateModel(
            name='CategoryVariationType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, help_text='Display name for the variation type (e.g., "Model", "Capacity", "Wattage")')),
                ('category', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='variation_type', to='products.productcategory')),
            ],
            options={
                'verbose_name': 'Category Variation Type',
                'verbose_name_plural': 'Category Variation Types',
            },
        ),
        migrations.AddField(
            model_name='productcategory',
            name='default_variation_type',
            field=models.CharField(max_length=50, blank=True, help_text='Default name for variations in this category (e.g., "Model" for CPUs)'),
        ),
    ]
