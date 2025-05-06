# EGIE Online GameShop: A Full-Stack E-commerce Platform for Gaming Products

EGIE Online GameShop is a modern e-commerce platform built with Django and React that provides a seamless shopping experience for gaming enthusiasts. The platform combines robust backend functionality with a responsive frontend interface to offer product management, user authentication, order processing, and advanced analytics capabilities.

The platform features a comprehensive product catalog with detailed categorization, dynamic pricing, inventory management, and customer reviews. It includes advanced features like bundle offerings, marketing campaign tracking, and detailed sales analytics. The system supports multiple payment methods and provides real-time order tracking, while maintaining detailed audit logs for security and compliance.

## Repository Structure
```
.
├── backend/                      # Django backend application
│   ├── accounts/                # User authentication and profile management
│   ├── products/               # Product catalog and inventory management
│   ├── orders/                 # Order processing and payment handling
│   ├── sales/                  # Sales reporting and analytics
│   ├── marketing/              # Marketing campaigns and bundle management
│   ├── marketing_analytics/    # Marketing performance tracking
│   ├── logs_audit/            # System audit logging
│   ├── adminpanels/           # Admin interface customizations
│   ├── config/                # Django project settings and configuration
│   └── templates/             # HTML templates for emails and base pages
├── src/                        # React frontend application
│   ├── components/            # Reusable UI components
│   ├── views/                 # Page components and layouts
│   ├── lib/                   # Utility functions and helpers
│   └── firebase.js           # Firebase configuration for authentication
```

## Usage Instructions
### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Firebase account for authentication
- SMTP server for email notifications

Required Python packages:
```
django>=5.2
django-cors-headers
djangorestframework
psycopg2-binary
python-decouple
```

Required Node.js packages:
```
react
react-router-dom
axios
tailwindcss
firebase
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd egie-online-gameshop
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure environment variables:
Create a `.env` file in the backend directory:
```
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_HOST_USER=your_email
EMAIL_HOST_PASSWORD=your_email_password
```

4. Set up the database:
```bash
python manage.py migrate
python manage.py createsuperuser
```

5. Set up the frontend:
```bash
cd ../
npm install
```

### Getting Started
1. Start the backend server:
```bash
cd backend
python manage.py runserver
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Access the application:
- Frontend: http://localhost:5173
- Admin interface: http://localhost:8000/admin

### More Detailed Examples

1. Product Management:
```python
# Creating a new product
from products.models import Product, ProductCategory, Brand

brand = Brand.objects.create(name="Gaming Brand")
category = ProductCategory.objects.create(name="Gaming Peripherals")
product = Product.objects.create(
    name="Gaming Mouse",
    slug="gaming-mouse",
    description="High-performance gaming mouse",
    original_price=99.99,
    selling_price=79.99,
    stock=100,
    brand=brand,
    category=category
)
```

2. Order Processing:
```python
# Creating a new order
from orders.models import OrderDetails, OrderItem

order = OrderDetails.objects.create(
    user=user,
    total_price=total,
    status="Pending"
)
OrderItem.objects.create(
    order=order,
    product=product,
    quantity=1,
    price=product.selling_price
)
```

### Troubleshooting

1. Database Connection Issues:
```bash
# Check PostgreSQL service status
sudo service postgresql status

# Verify database connection
python manage.py dbshell
```

2. CORS Issues:
- Verify CORS settings in backend/config/settings.py
- Check that frontend requests include proper headers

3. Authentication Issues:
- Verify Firebase configuration in src/firebase.js
- Check browser console for authentication errors
- Verify CSRF token is being sent with requests

## Data Flow
The application follows a standard client-server architecture with RESTful API communication.

```ascii
Frontend (React) <--> API Layer (Django REST) <--> Database (PostgreSQL)
     |                     |                           |
     |                     |                           |
User Auth <--> Firebase    |                    Data Storage
                          |
                    Email Service
```

Key component interactions:
- Frontend components make API calls to Django backend
- Django processes requests through middleware and views
- Database operations are handled through Django ORM
- Authentication flows through Firebase
- Email notifications via SMTP
- File storage handled by Django's storage backend