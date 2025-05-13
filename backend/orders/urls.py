# backend/orders/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.cart_view, name='cart'),
    path('cart/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/update/<int:item_id>/', views.update_cart_item, name='update-cart-item'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove-from-cart'),
    path('orders/', views.order_history, name='order-history'),
    path('orders/<int:order_id>/', views.order_detail, name='order-detail'),
    path('create-order/', views.create_order, name='create-order'),
]
