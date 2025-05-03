from django.contrib.auth import authenticate, login
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from .models import Customer
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt


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
        # You might want to store the firebase_uid in your Customer model
        # customer.firebase_uid = firebase_uid
        # customer.save()
        
        return Response({
            'message': f'User {username} registered successfully!'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- SIGN IN ---
# --- SIGN IN ---
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def signin(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'message': 'Email and password are required!'}, status=status.HTTP_400_BAD_REQUEST)

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


@api_view(['POST'])
@permission_classes([AllowAny])
def update_password(request):
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    
    if not email or not new_password:
        return Response({
            'message': 'Email and new password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = Customer.objects.get(email=email)
        
        # Use set_password to properly hash the password
        user.set_password(new_password)
        user.save()
        
        # Log the success for debugging
        print(f"Password updated successfully for user: {email}")

        return Response({
            'message': 'Password updated successfully',
            'success': True
        }, status=status.HTTP_200_OK)
    except Customer.DoesNotExist:
        print(f"User not found with email: {email}")
        return Response({
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating password: {str(e)}")
        return Response({
            'message': f'Error updating password: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)