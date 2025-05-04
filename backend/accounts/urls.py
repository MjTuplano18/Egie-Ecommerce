from django.urls import path, re_path
from . import views


urlpatterns = [
    # API endpoints
    path('api/signup/', views.signup, name='signup'),
    path('api/signin/', views.signin, name='signin'),
    path('verify-email/', views.index, name='verify-email'),
    
    # Password reset endpoints
    path('api/request-password-reset/', views.request_password_reset, name='request_password_reset'),
    path('api/verify-and-reset-password/', views.verify_and_reset_password, name='verify_and_reset_password'),
    path('api/reset-password/', views.reset_password, name='reset_password'),  # Direct reset (admin/emergency)

    # Serve React App - catch all other URLs
    re_path(r'^.*', views.index, name='index'),
]