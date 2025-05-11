"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from orders import views as orders_views
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse
from rest_framework import routers
from products.views import ProductViewSet
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

#Router and registration for viewsets
router =routers.DefaultRouter()
router.register(r'products', ProductViewSet)

@ensure_csrf_cookie
def get_csrf_token(request):
    return HttpResponse("CSRF cookie set")


urlpatterns = [
    # API URLs should come before the catch-all patterns
    path('api/', include(router.urls)),
    path("api/create-order/", orders_views.create_order, name="create_order"),
    path('api/get-csrf-token/', get_csrf_token, name='get_csrf_token'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Admin and other URLs
    path('admin/', admin.site.urls),
  # This should be the LAST pattern as it might be catching all requests
    path('', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)