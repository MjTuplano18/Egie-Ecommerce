# backend/orders/serializers.py
from rest_framework import serializers
from .models import Cart, CartItem, OrderDetails, OrderItem, Payment, Shipping
from products.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'createdAt', 'subtotal']
    
    def get_subtotal(self, obj):
        return obj.product.selling_price * obj.quantity

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total', 'item_count']
    
    def get_total(self, obj):
        return sum(item.product.selling_price * item.quantity for item in obj.items.all())
    
    def get_item_count(self, obj):
        return obj.items.count()

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price', 'createdAt']

class OrderDetailsSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrderDetails
        fields = ['id', 'user', 'totalPrice', 'createdAt', 'status', 'discount', 'items']
