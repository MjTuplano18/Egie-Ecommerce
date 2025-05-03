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

@ensure_csrf_cookie
def get_csrf_token(request):
    return HttpResponse("CSRF cookie set")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    path("api/create-order/", orders_views.create_order, name="create_order"),  # Order creation endpoint
    path('api/get-csrf-token/', get_csrf_token, name='get_csrf_token'),
    
]
