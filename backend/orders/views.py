# backend/orders/views.py
from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Cart, CartItem, OrderDetails, OrderItem, Payment, Shipping
from products.models import Product
from django.db import transaction

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    """Get user's cart"""
    print(f"Cart view request for user: {request.user.username}")

    # Get or create cart for the user
    cart, created = Cart.objects.get_or_create(user=request.user)
    print(f"Cart: {cart.id}, Created: {created}")

    # Get all cart items
    cart_items = CartItem.objects.filter(cart=cart).select_related('product')
    print(f"Found {cart_items.count()} cart items")

    # Calculate total
    total = sum(item.product.selling_price * item.quantity for item in cart_items)

    # Format response
    items = []
    for item in cart_items:
        image_url = None
        feature_image = item.product.images.filter(is_feature=True).first()
        if feature_image and feature_image.image:
            image_url = feature_image.image.url
        else:
            first_image = item.product.images.first()
            if first_image and first_image.image:
                image_url = first_image.image.url

        items.append({
            'id': item.id,
            'product_id': item.product.id,
            'name': item.product.name,
            'price': float(item.product.selling_price),
            'quantity': item.quantity,
            'subtotal': float(item.product.selling_price * item.quantity),
            'image': image_url
        })
        print(f"Added item to response: {item.product.name}, ID: {item.id}, Product ID: {item.product.id}")

    response_data = {
        'items': items,
        'total': float(total),
        'item_count': len(items)
    }
    print(f"Returning cart with {len(items)} items, total: {total}")

    return Response(response_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add item to cart"""
    print(f"Add to cart request data: {request.data}")
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))

    if not product_id:
        return Response({'message': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id)
        if not product.is_active:
            return Response({'message': 'Product is not available'}, status=status.HTTP_400_BAD_REQUEST)
    except Product.DoesNotExist:
        return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if quantity is valid
    if quantity <= 0:
        return Response({'message': 'Quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if product is in stock
    if product.stock < quantity:
        return Response({'message': 'Not enough stock available'}, status=status.HTTP_400_BAD_REQUEST)

    # Get or create cart
    cart, created = Cart.objects.get_or_create(user=request.user)
    print(f"Cart: {cart.id}, Created: {created}")

    # Check if item already exists in cart
    try:
        cart_item = CartItem.objects.get(cart=cart, product=product)
        cart_item.quantity += quantity
        cart_item.save()
        print(f"Updated existing cart item: {cart_item.id}, New quantity: {cart_item.quantity}")
    except CartItem.DoesNotExist:
        cart_item = CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity
        )
        print(f"Created new cart item: {cart_item.id}, Quantity: {cart_item.quantity}")

    # Get updated cart items for response
    cart_items = CartItem.objects.filter(cart=cart).select_related('product')
    total = sum(item.product.selling_price * item.quantity for item in cart_items)

    # Format response with cart details
    items = []
    for item in cart_items:
        items.append({
            'id': item.id,
            'product_id': item.product.id,
            'name': item.product.name,
            'price': float(item.product.selling_price),
            'quantity': item.quantity,
            'subtotal': float(item.product.selling_price * item.quantity),
            'image': item.product.images.filter(is_feature=True).first().image.url if item.product.images.filter(is_feature=True).exists() else None
        })

    return Response({
        'message': 'Product added to cart successfully',
        'cart': {
            'items': items,
            'total': float(total),
            'item_count': len(items)
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, item_id):
    """Update cart item quantity"""
    quantity = request.data.get('quantity')

    if not quantity:
        return Response({'message': 'Quantity is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        quantity = int(quantity)
    except ValueError:
        return Response({'message': 'Quantity must be a number'}, status=status.HTTP_400_BAD_REQUEST)

    # Get cart item
    try:
        cart_item = CartItem.objects.get(id=item_id)
        if cart_item.cart.user != request.user:
            return Response({'message': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    except CartItem.DoesNotExist:
        return Response({'message': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    # Delete item if quantity is 0
    if quantity <= 0:
        cart_item.delete()
        return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)

    # Check if product is in stock
    if cart_item.product.stock < quantity:
        return Response({'message': 'Not enough stock available'}, status=status.HTTP_400_BAD_REQUEST)

    # Update quantity
    cart_item.quantity = quantity
    cart_item.save()

    return Response({'message': 'Cart updated successfully'}, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    """Remove item from cart"""
    try:
        cart_item = CartItem.objects.get(id=item_id)
        if cart_item.cart.user != request.user:
            return Response({'message': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    except CartItem.DoesNotExist:
        return Response({'message': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    cart_item.delete()
    return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """Clear all items from user's cart"""
    try:
        cart = Cart.objects.get(user=request.user)
        CartItem.objects.filter(cart=cart).delete()
        return Response({'message': 'Cart cleared successfully'}, status=status.HTTP_200_OK)
    except Cart.DoesNotExist:
        return Response({'message': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_order(request):
    """Create a new order from cart items"""
    # Get user's cart
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        return Response({'message': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if cart has items
    cart_items = CartItem.objects.filter(cart=cart)
    if not cart_items.exists():
        return Response({'message': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate total price
    total_price = sum(item.product.selling_price * item.quantity for item in cart_items)

    # Create order
    order = OrderDetails.objects.create(
        user=request.user,
        totalPrice=total_price,
        status=OrderDetails.OrderStatus.PENDING
    )

    # Create order items
    for cart_item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            price=cart_item.product.selling_price
        )

        # Update product stock
        product = cart_item.product
        product.stock -= cart_item.quantity
        product.save()

    # Clear cart
    cart_items.delete()

    return Response({
        'message': 'Order created successfully',
        'order_id': order.id
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_history(request):
    """Get user's order history"""
    orders = OrderDetails.objects.filter(user=request.user).order_by('-createdAt')

    result = []
    for order in orders:
        order_items = []
        for item in order.items.all():
            order_items.append({
                'id': item.id,
                'product_id': item.product.id,
                'name': item.product.name,
                'price': float(item.price),
                'quantity': item.quantity,
                'subtotal': float(item.price * item.quantity)
            })

        result.append({
            'id': order.id,
            'date': order.createdAt,
            'status': order.status,
            'total': float(order.totalPrice),
            'items': order_items
        })

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """Get details of a specific order"""
    try:
        order = OrderDetails.objects.get(id=order_id, user=request.user)
    except OrderDetails.DoesNotExist:
        return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    order_items = []
    for item in order.items.all():
        order_items.append({
            'id': item.id,
            'product_id': item.product.id,
            'name': item.product.name,
            'price': float(item.price),
            'quantity': item.quantity,
            'subtotal': float(item.price * item.quantity)
        })

    # Get shipping info if available
    shipping_info = None
    try:
        shipping = Shipping.objects.get(order=order)
        shipping_info = {
            'address': shipping.address,
            'tracking_number': shipping.trackingNumber,
            'shipping_method': shipping.shippingMethod,
            'status': shipping.status
        }
    except Shipping.DoesNotExist:
        pass

    # Get payment info if available
    payment_info = None
    try:
        payment = Payment.objects.get(order=order)
        payment_info = {
            'provider': payment.provider,
            'status': payment.status,
            'amount': float(payment.amount)
        }
    except Payment.DoesNotExist:
        pass

    return Response({
        'id': order.id,
        'date': order.createdAt,
        'status': order.status,
        'total': float(order.totalPrice),
        'items': order_items,
        'shipping': shipping_info,
        'payment': payment_info
    })
