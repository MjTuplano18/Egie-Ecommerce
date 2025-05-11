import random
import string
from datetime import timedelta
import os

from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Customer, UserAddress

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

    if not all([username, email, firebase_uid]):  # Password not required for Google sign-up
        return Response({'message': 'Username, email and Firebase UID are required!'},
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
            password=password if password else None,  # Handle case where password is not provided (Google sign-up)
        )

        # Save first name and last name if provided
        if first_name:
            customer.first_name = first_name
        if last_name:
            customer.last_name = last_name

        # Save firebase UID
        customer.firebase_uid = firebase_uid
        customer.save()

        # Generate tokens for immediate sign in
        refresh = RefreshToken.for_user(customer)

        return Response({
            'message': f'User {username} registered successfully!',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': {
                'id': customer.id,
                'username': customer.username,
                'email': customer.email,
                'first_name': customer.first_name,
                'last_name': customer.last_name
            }
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
    firebase_uid = request.data.get('firebaseUid')

    try:
        # Get the user with the provided email
        customer = Customer.objects.get(email=email)

        # If firebase_uid is provided, handle Google sign in
        if firebase_uid:
            if customer.firebase_uid == firebase_uid:
                login(request, customer)
                refresh = RefreshToken.for_user(customer)
                response_data = {
                    'message': 'Login successful!',
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'user': {
                        'id': customer.id,
                        'username': customer.username,
                        'email': customer.email,
                        'first_name': customer.first_name,
                        'last_name': customer.last_name,
                        'phone_number': customer.phone_number,
                        'birth_date': customer.birth_date,
                    }
                }

                if customer.profile_picture:
                    response_data['user']['profile_picture'] = request.build_absolute_uri(settings.MEDIA_URL + customer.profile_picture)
                else:
                    response_data['user']['profile_picture'] = None

                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Invalid credentials!'}, status=status.HTTP_401_UNAUTHORIZED)

        # Handle regular email/password sign in
        user = authenticate(username=customer.username, password=password)
        if user is not None:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            response_data = {
                'message': 'Login successful!',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone_number': user.phone_number,
                    'birth_date': user.birth_date,
                }
            }

            if user.profile_picture:
                response_data['user']['profile_picture'] = request.build_absolute_uri(settings.MEDIA_URL + user.profile_picture)
            else:
                response_data['user']['profile_picture'] = None

            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Invalid password!'}, status=status.HTTP_401_UNAUTHORIZED)

    except Customer.DoesNotExist:
        return Response({'message': 'Invalid Credentials!'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
@permission_classes([IsAuthenticated])
@csrf_exempt
def update_profile(request):
    """
    Update user profile information
    """
    try:
        # Get the authenticated user
        user = request.user

        # Update user fields if provided
        if 'first_name' in request.data:
            user.first_name = request.data.get('first_name')
        if 'last_name' in request.data:
            user.last_name = request.data.get('last_name')
        if 'phone_number' in request.data:
            user.phone_number = request.data.get('phone_number')
        if 'birth_date' in request.data:
            user.birth_date = request.data.get('birth_date')

        # Handle profile picture upload
        if 'profile_picture' in request.FILES:
            profile_pic = request.FILES['profile_picture']

            # Create directory if it doesn't exist
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'profile_pictures')
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)

            # Generate unique filename
            filename = f"{user.id}_{profile_pic.name}"
            filepath = os.path.join(upload_dir, filename)

            # Save the file
            with open(filepath, 'wb+') as destination:
                for chunk in profile_pic.chunks():
                    destination.write(chunk)

            # Save the file path to the user model
            user.profile_picture = os.path.join('profile_pictures', filename)

        user.save()

        # Prepare response data
        response_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'birth_date': user.birth_date,
        }

        if user.profile_picture:
            response_data['profile_picture'] = request.build_absolute_uri(settings.MEDIA_URL + user.profile_picture)

        return Response({
            'message': 'Profile updated successfully',
            'success': True,
            'user': response_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'message': f'Error updating profile: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def change_password(request):
    """
    Change user password (when logged in)
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({
            'message': 'Current password and new password are required',
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = request.user

        # Verify current password
        if not check_password(current_password, user.password):
            return Response({
                'message': 'Current password is incorrect',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save()

        # Generate new tokens since credentials changed
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Password changed successfully',
            'success': True,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'message': f'Error changing password: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Get user profile information
    """
    try:
        user = request.user
        
        response_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'birth_date': user.birth_date,
        }

        if user.profile_picture:
            response_data['profile_picture'] = request.build_absolute_uri(settings.MEDIA_URL + user.profile_picture)
        else:
            response_data['profile_picture'] = None

        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'message': f'Error fetching profile: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_address(request):
    """
    Get user's default address
    """
    try:
        user = request.user
        address = user.addresses.filter(is_default=True).first() or user.addresses.first()
        
        if address:
            return Response({
                'address_line': address.address_line,
                'city': address.city,
                'province': address.province,
                'postal_code': address.postal_code,
                'country': address.country,
                'address_type': address.address_type,
            }, status=status.HTTP_200_OK)
        else:
            return Response({}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'message': f'Error fetching address: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def update_address(request):
    """
    Update or create user's address
    """
    try:
        user = request.user
        address_data = {
            'address_line': request.data.get('address_line'),
            'city': request.data.get('city'),
            'province': request.data.get('province'),
            'postal_code': request.data.get('postal_code'),
            'country': request.data.get('country', 'Philippines'),
            'address_type': request.data.get('address_type', 'shipping'),
        }
        
        # Try to get existing address of the same type
        address = user.addresses.filter(address_type=address_data['address_type']).first()
        
        if address:
            # Update existing address
            for key, value in address_data.items():
                setattr(address, key, value)
            address.save()
        else:
            # Create new address
            address = UserAddress.objects.create(user=user, **address_data)
            # Make it default if it's the only address
            if user.addresses.count() == 1:
                address.is_default = True
                address.save()

        return Response({
            'message': 'Address updated successfully',
            'success': True,
            'address': {
                'address_line': address.address_line,
                'city': address.city,
                'province': address.province,
                'postal_code': address.postal_code,
                'country': address.country,
                'address_type': address.address_type,
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'message': f'Error updating address: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)