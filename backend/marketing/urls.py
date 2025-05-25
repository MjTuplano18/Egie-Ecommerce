from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BundleViewSet, CustomBuildViewSet

router = DefaultRouter()
router.register(r'bundles', BundleViewSet)
router.register(r'custom-builds', CustomBuildViewSet)

urlpatterns = [
    path('', include(router.urls)),
]