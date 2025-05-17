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
    # These endpoints are handled by @action decorators in ProductViewSet
    path('products/new-arrivals/', views.ProductViewSet.as_view({'get': 'new_arrivals'}), name='new-arrivals'),
    path('products/top_sellers/', views.ProductViewSet.as_view({'get': 'top_sellers'}), name='top-sellers'),
    # Category products are handled by the CategoryViewSet products action
    path('categories/<int:pk>/products/', views.CategoryViewSet.as_view({'get': 'products'}), name='category-products'),
]