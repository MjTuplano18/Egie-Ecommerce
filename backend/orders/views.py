# backend/orders/views.py
from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from .models import Cart, CartItem, OrderDetails, OrderItem, Payment, Shipping
from products.models import Product, ProductVariation
from django.db import transaction

@api_view(['GET'])
@permission_classes([AllowAny])  # Allow anonymous users
@ensure_csrf_cookie
def cart_view(request):
    """Get user's cart"""
    try:
        if request.user.is_authenticated:
            # Get or create cart for logged in user
            cart, created = Cart.objects.get_or_create(
                user=request.user,
                defaults={'is_active': True}
            )
        else:
            # Get or create temporary cart for anonymous user
            temp_cart_id = request.session.get('temp_cart_id')
            if temp_cart_id:
                try:
                    cart = Cart.objects.get(id=temp_cart_id)
                except Cart.DoesNotExist:
                    cart = Cart.objects.create(user=None)
                    request.session['temp_cart_id'] = cart.id
            else:
                cart = Cart.objects.create(user=None)
                request.session['temp_cart_id'] = cart.id

        if not cart.is_active:
            cart.reactivate()
            cart.save()

        # Get all cart items with related products and variations
        cart_items = CartItem.objects.filter(cart=cart).select_related(
            'product', 'variation', 'product__brand'
        ).prefetch_related('product__images')

        # Format response
        items = []
        for item in cart_items:
            # Get product image
            image_url = None
            feature_image = item.product.images.filter(is_feature=True).first()
            if feature_image and feature_image.image:
                image_url = feature_image.image.url
            elif item.product.images.exists():
                image_url = item.product.images.first().image.url

            # Get available stock and price
            if item.variation:
                available_stock = item.variation.stock
                unit_price = item.variation.final_price
            else:
                available_stock = item.product.stock
                unit_price = item.product.selling_price

            items.append({
                'id': item.id,
                'product_id': item.product.id,
                'name': item.product.name,
                'brand': item.product.brand.name,
                'variation': item.variation.name if item.variation else None,
                'variation_id': item.variation.id if item.variation else None,
                'price': float(unit_price),
                'quantity': item.quantity,
                'subtotal': float(unit_price * item.quantity),
                'image': image_url,
                'in_stock': available_stock >= item.quantity,
                'available_stock': available_stock,
                'selected': item.selected
            })

        response_data = {
            'items': items,
            'total': float(cart.total),
            'item_count': cart.items_count,
            'total_quantity': cart.total_quantity
        }
        return Response(response_data)

    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_protect
@transaction.atomic
def add_to_cart(request):
    """Add item to cart"""
    try:
        product_id = request.data.get('product_id')
        variation_id = request.data.get('variation_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'message': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get active product
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        # Handle variations
        variation = None
        if variation_id:
            try:
                variation = product.variations.get(id=variation_id)
            except ProductVariation.DoesNotExist:
                return Response({'message': 'Variation not found'}, status=status.HTTP_404_NOT_FOUND)

        # Use cart from middleware (already created/validated)
        cart = request.cart

        # Validate quantity
        if quantity <= 0:
            return Response({'message': 'Quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        # Check stock availability
        available_stock = variation.stock if variation else product.stock
        if available_stock < quantity:
            return Response(
                {'message': f'Only {available_stock} items available in stock'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create user's cart using get_or_create
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            defaults={'is_active': True}
        )

        if not cart.is_active:
            cart.reactivate()
            cart.save()        # Try to find existing cart item
        cart_item = CartItem.objects.select_for_update().filter(
            cart=cart,
            product=product,
            variation=variation
        ).first()

        if cart_item:
            # Update existing item
            new_quantity = cart_item.quantity + quantity
            if new_quantity > available_stock:
                return Response(
                    {'message': f'Cannot add {quantity} more items. Only {available_stock - cart_item.quantity} additional items available.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_quantity
            cart_item.selected = True  # Ensure item is selected
            cart_item.save()
        else:
            # Create new cart item
            cart_item = CartItem.objects.create(
                cart=cart,
                product=product,
                variation=variation,
                quantity=quantity,
                selected=True
            )

        # Get updated cart data
        cart_items = CartItem.objects.filter(cart=cart).select_related(
            'product', 'variation', 'product__brand'
        ).prefetch_related('product__images')

        # Format response
        items = []
        for item in cart_items:
            # Get product image
            image_url = None
            feature_image = item.product.images.filter(is_feature=True).first()
            if feature_image and feature_image.image:
                image_url = feature_image.image.url
            elif item.product.images.exists():
                image_url = item.product.images.first().image.url

            # Get available stock and price for this item
            if item.variation:
                item_stock = item.variation.stock
                unit_price = item.variation.final_price
            else:
                item_stock = item.product.stock
                unit_price = item.product.selling_price

            items.append({
                'id': item.id,
                'product_id': item.product.id,
                'name': item.product.name,
                'brand': item.product.brand.name,
                'variation': item.variation.name if item.variation else None,
                'variation_id': item.variation.id if item.variation else None,
                'price': float(unit_price),
                'quantity': item.quantity,
                'subtotal': float(unit_price * item.quantity),
                'image': image_url,
                'in_stock': item_stock >= item.quantity,
                'available_stock': item_stock,
                'selected': item.selected
            })

        return Response({
            'message': 'Product added to cart successfully',
            'cart': {
                'items': items,
                'total': float(cart.total),
                'item_count': cart.items_count,
                'total_quantity': cart.total_quantity
            }
        }, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        cart_item = CartItem.objects.select_related('product', 'variation').get(id=item_id)
        if cart_item.cart.user != request.user:
            return Response({'message': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    except CartItem.DoesNotExist:
        return Response({'message': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    # Delete item if quantity is 0
    if quantity <= 0:
        cart_item.delete()
        return Response({
            'message': 'Item removed from cart',
            'cart_total': float(cart_item.cart.total),
            'item_count': cart_item.cart.items_count,
            'total_quantity': cart_item.cart.total_quantity
        }, status=status.HTTP_200_OK)

    # Check if product is in stock
    available_stock = cart_item.variation.stock if cart_item.variation else cart_item.product.stock
    if available_stock < quantity:
        return Response({
            'message': f'Only {available_stock} items available in stock'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update quantity
    cart_item.quantity = quantity
    cart_item.save()

    # Get updated cart data
    cart = cart_item.cart
    return Response({
        'message': 'Cart updated successfully',
        'item': {
            'id': cart_item.id,
            'quantity': cart_item.quantity,
            'subtotal': float(cart_item.subtotal)
        },
        'cart_total': float(cart.total),
        'item_count': cart.items_count,
        'total_quantity': cart.total_quantity
    }, status=status.HTTP_200_OK)

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
