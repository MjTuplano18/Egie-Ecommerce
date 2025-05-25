import logging
from django.utils import timezone
from django.db import transaction
from .models import Cart

logger = logging.getLogger(__name__)

class CartMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def merge_carts(self, source_cart, target_cart):
        """Merge items from source cart into target cart"""
        with transaction.atomic():
            # Fetch all items at once to optimize performance
            source_items = source_cart.items.select_for_update().select_related('product', 'variation')
            target_items = target_cart.items.select_for_update().select_related('product', 'variation')
            
            # Create lookup dict for target cart items
            target_map = {(i.product_id, getattr(i, 'variation_id', None)): i for i in target_items}
            
            for item in source_items:
                try:
                    key = (item.product_id, getattr(item, 'variation_id', None))
                    target_item = target_map.get(key)

                    if target_item:
                        # Check stock availability before updating
                        available_stock = item.variation.stock if item.variation else item.product.stock
                        new_quantity = target_item.quantity + item.quantity
                        if new_quantity <= available_stock:
                            target_item.quantity = new_quantity
                            target_item.save()
                    else:
                        # Create new item with verified stock
                        available_stock = item.variation.stock if item.variation else item.product.stock
                        if item.quantity <= available_stock:
                            item.pk = None  # Create new instance
                            item.cart = target_cart
                            item.save()
                except Exception as e:
                    logger.error("Error merging cart item %s: %s", item.id, str(e))
                    # Continue with next item even if one fails

    def handle_authenticated_user(self, request):
        """Process cart for authenticated users"""
        with transaction.atomic():
            cart, created = Cart.objects.select_for_update().get_or_create(
                user=request.user,
                defaults={'is_active': True}
            )

            if not created:
                if cart.is_expired():
                    cart.deactivate()
                    cart = Cart.objects.create(user=request.user)
                elif not cart.is_active:
                    if not cart.reactivate():
                        cart = Cart.objects.create(user=request.user)
                else:
                    cart.last_activity = timezone.now()
                    cart.save()

            # Merge from temp_cart_id (e.g., from guest login)
            temp_cart_id = request.session.pop('temp_cart_id', None)
            if temp_cart_id:
                try:
                    temp_cart = Cart.objects.get(id=temp_cart_id)
                    self.merge_carts(temp_cart, cart)
                    temp_cart.delete()
                except Cart.DoesNotExist:
                    pass

            # Merge from anonymous cart in session
            anon_cart_id = request.session.pop('cart_id', None)
            if anon_cart_id:
                try:
                    anon_cart = Cart.objects.select_for_update().get(id=anon_cart_id, user__isnull=True)
                    self.merge_carts(anon_cart, cart)
                    anon_cart.delete()
                except Cart.DoesNotExist:
                    pass

        return cart

    def handle_anonymous_user(self, request):
        """Process cart for anonymous users"""
        cart_id = request.session.get('cart_id')
        cart = None

        if cart_id:
            try:
                cart = Cart.objects.get(id=cart_id, user__isnull=True)
                if cart.is_expired():
                    cart.delete()
                    cart = None
                else:
                    cart.last_activity = timezone.now()
                    cart.save()
            except Cart.DoesNotExist:
                cart = None

        if not cart:
            cart = Cart.objects.create()
            request.session['cart_id'] = cart.id

        return cart

    def __call__(self, request):
        """Main middleware handler"""
        if request.user.is_authenticated:
            cart = self.handle_authenticated_user(request)
        else:
            cart = self.handle_anonymous_user(request)

        request.cart = cart
        response = self.get_response(request)
        return response
