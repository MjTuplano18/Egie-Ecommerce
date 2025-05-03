import base64
import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from orders.models import Payment, OrderDetails
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger('django')  # Use Django's default logger


@csrf_exempt
@api_view(['POST'])
def create_order(request):
    """Create a payment session for an order"""
    # Log incoming request
    logger.info(f"Received payment request: {request.data}")

    data = request.data
    payment_method = data.get('type')
    order_id = data.get('order_id')

    if not payment_method or not order_id:
        logger.error(f"Missing data: payment_method={payment_method}, order_id={order_id}")
        return Response({'error': "Missing payment method or order ID"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = OrderDetails.objects.get(pk=order_id)
        logger.info(f"Found order: {order_id}, total={order.totalPrice}")
    except OrderDetails.DoesNotExist:
        logger.error(f"Order not found: {order_id}")
        return Response({'error': "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    # Handle COD directly
    if payment_method == 'cod':
        logger.info(f"Processing COD order: {order_id}")
        payment = Payment.objects.create(
            order=order,
            provider="CashOnDelivery",
            amount=order.totalPrice,
            status='Pending',
            transaction_id=''
        )
        return Response({
            "message": "COD order placed",
            "payment_id": payment.id
        }, status=status.HTTP_201_CREATED)

    # For online payments
    amount = int(order.totalPrice * 100)  # Convert to centavos

    # Verify PayMongo credentials exist
    if not hasattr(settings, 'PAYMONGO_SECRET_KEY'):
        logger.error("PAYMONGO_SECRET_KEY not found in settings")
        return Response({'error': "PayMongo API key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Encode credentials
    secret_key = settings.PAYMONGO_SECRET_KEY
    encoded_secret = base64.b64encode(f"{secret_key}:".encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded_secret}",
        "Content-Type": "application/json",
    }

    # Frontend URLs
    success_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173') + "/checkout/thankyou"
    cancel_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173') + "/payment/cancelled"

    # Create payload
    payload = {
        "data": {
            "attributes": {
                "line_items": [
                    {
                        "currency": "PHP",
                        "amount": amount,
                        "description": f"Order #{order_id}",
                        "name": "E-Commerce Checkout"
                    }
                ],
                "payment_method_types": [payment_method],
                "success_url": success_url,
                "cancel_url": cancel_url,
            }
        }
    }

    logger.info(f"PayMongo request payload: {payload}")
    logger.info(f"PayMongo API URL: https://api.paymongo.com/v1/checkout_sessions")

    try:
        paymongo_response = requests.post(
            "https://api.paymongo.com/v1/checkout_sessions",
            headers=headers,
            json=payload,
            timeout=30
        )

        logger.info(f"PayMongo response status: {paymongo_response.status_code}")

        response_data = paymongo_response.json()
        logger.info(f"PayMongo response data: {response_data}")

        if paymongo_response.status_code != 200:
            logger.error(f"PayMongo error: {response_data}")
            return Response({
                "error": "PayMongo API error",
                "details": response_data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save payment record
        payment = Payment.objects.create(
            order=order,
            provider=payment_method,
            amount=order.totalPrice,
            status="Pending",
            transaction_id=response_data["data"]["id"]
        )

        redirect_url = response_data["data"]["attributes"]["checkout_url"]
        logger.info(f"Created payment {payment.id}, redirecting to {redirect_url}")

        return Response({
            "checkout_url": redirect_url,
            "payment_id": payment.id
        }, status=status.HTTP_200_OK)

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return Response({
            "error": "Network error connecting to PayMongo",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return Response({
            "error": "Unexpected error",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)