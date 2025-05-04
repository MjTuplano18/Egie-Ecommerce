from django.contrib.auth import authenticate, login
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Customer
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from django.utils import timezone
from datetime import timedelta

# Serve React frontend
def index(request):
    return render(request, 'index.html')


# --- SIGN UP ---
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def signup(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    firebase_uid = request.data.get('firebaseUid')
    first_name = request.data.get('firstName')
    last_name = request.data.get('lastName')

    if not all([username, email, password, firebase_uid]):
        return Response({'message': 'All fields are required!'},
                      status=status.HTTP_400_BAD_REQUEST)

    if Customer.objects.filter(username=username).exists():
        return Response({'message': 'Username already exists!'},
                      status=status.HTTP_400_BAD_REQUEST)

    if Customer.objects.filter(email=email).exists():
        return Response({'message': 'Email already exists!'},
                      status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create and save new customer
        customer = Customer.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        
        # Save first name and last name if provided
        if first_name:
            customer.first_name = first_name
        if last_name:
            customer.last_name = last_name
            
        # Save firebase UID if needed
        # customer.firebase_uid = firebase_uid  # Uncomment if you have this field in your model
        
        customer.save()

        return Response({
            'message': f'User {username} registered successfully!'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- SIGN IN ---
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def signin(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'message': 'Email and password are required!'},
                        status=status.HTTP_400_BAD_REQUEST
                        )

    try:
        # Get the user with the provided email
        customer = Customer.objects.get(email=email)

        # Authenticate with the username associated with this email
        user = authenticate(username=customer.username, password=password)

        if user is not None:
            login(request, user)
            return Response({
                'message': 'Login successful!',
                'token': 'your-token-generation-logic-here',  # You might want to generate a token
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    # Add other user fields as needed
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Invalid password!'}, status=status.HTTP_401_UNAUTHORIZED)

    except Customer.DoesNotExist:
        return Response({'message': 'Invalid Credentials!'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def request_password_reset(request):
    email = request.data.get('email')
    
    if not email:
        return Response({
            'message': 'Email is required',
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = Customer.objects.get(email=email)
        
        # Generate a 6-digit verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Store the verification code in the user model
        user.verification_code = verification_code
        user.verification_code_timestamp = timezone.now()
        user.save()
        
        # Prepare email content
        html_message = render_to_string('email/password_reset.html', {
            'verification_code': verification_code
        })
        plain_message = strip_tags(html_message)

        # Send email with HTML content
        subject = 'EGIE GameShop - Password Reset Verification Code'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]
        
        try:
            send_mail(
                subject,
                plain_message,
                from_email,
                recipient_list,
                html_message=html_message,
                fail_silently=False
            )
            return Response({
                'message': 'Verification code sent to your email',
                'success': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'message': f'Error sending email: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Customer.DoesNotExist:
        # For security reasons, don't reveal that the user doesn't exist
        return Response({
            'message': 'If your email is registered, you will receive a verification code',
            'success': True
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'message': f'Error processing request: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def verify_and_reset_password(request):
    email = request.data.get('email')
    verification_code = request.data.get('verification_code')
    new_password = request.data.get('new_password')
    
    if not all([email, verification_code, new_password]):
        return Response({
            'message': 'Email, verification code, and new password are required',
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = Customer.objects.get(email=email)
        
        # Check if verification code exists and is valid
        if not user.verification_code or user.verification_code != verification_code:
            return Response({
                'message': 'Invalid verification code',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if code is expired (10 minutes)
        if not user.verification_code_timestamp or \
           timezone.now() > user.verification_code_timestamp + timedelta(minutes=10):
            return Response({
                'message': 'Verification code has expired',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset password
        user.set_password(new_password)
        
        # Clear verification code
        user.verification_code = None
        user.verification_code_timestamp = None
        user.save()
        
        return Response({
            'message': 'Password updated successfully',
            'success': True
        }, status=status.HTTP_200_OK)
    except Customer.DoesNotExist:
        return Response({
            'message': 'User not found',
            'success': False
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'message': f'Error updating password: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def reset_password(request):
    """
    Direct password reset without verification (for admin or emergency use)
    """
    email = request.data.get('email')
    new_password = request.data.get('new_password')

    if not email or not new_password:
        return Response({
            'message': 'Email and new password are required',
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = Customer.objects.get(email=email)

        # Use set_password to properly hash the password
        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Password updated successfully',
            'success': True
        }, status=status.HTTP_200_OK)
    except Customer.DoesNotExist:
        return Response({
            'message': 'User not found',
            'success': False
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'message': f'Error updating password: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)