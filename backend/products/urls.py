from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'brands', views.BrandViewSet)
router.register(r'colors', views.ColorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('search/', views.search_products, name='search-products'),
    path('variation-values/', views.variation_values_by_category, name='variation-values'),
    # These endpoints are handled by @action decorators in ProductViewSet
    path('products/new-arrivals/', views.ProductViewSet.as_view({'get': 'new_arrivals'}), name='new-arrivals'),
    path('products/top_sellers/', views.ProductViewSet.as_view({'get': 'top_sellers'}), name='top-sellers'),
    # Compatible products endpoint - using slug as lookup
    path('products/<slug:slug>/compatible/', views.ProductViewSet.as_view({'get': 'compatible_products'}), name='compatible-products'),
    # Category products are handled by the CategoryViewSet products action
    path('categories/<int:pk>/products/', views.CategoryViewSet.as_view({'get': 'products'}), name='category-products'),
]