from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BundleViewSet

router = DefaultRouter()
router.register(r'bundles', BundleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]