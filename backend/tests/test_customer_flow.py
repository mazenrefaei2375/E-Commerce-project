from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product
from orders.models import Order, OrderItem
from cart.models import Cart, CartItem
from users.models import User


class CustomerFlowIntegrationTest(TestCase):
    """Full customer purchase flow: register -> login -> add to cart -> checkout -> verify"""

    def setUp(self):
        self.client = APIClient()

        # Test constants
        self.customer_email = 'customer@test.com'
        self.customer_password = 'test12345'
        self.product_price = 1000.00
        self.product_stock = 10
        self.cart_quantity = 2
        self.expected_total = 2000.00
        self.expected_order_total = 2020.00
        self.expected_remaining_stock = 8

        # Create test category and product (needed before API interactions)
        self.category = Category.objects.create(name='Electronics')
        self.product = Product.objects.create(
            category=self.category,
            title='Wireless Headphones',
            description='High quality wireless headphones',
            price=self.product_price,
            stock=self.product_stock,
            image='https://via.placeholder.com/300',
        )

    def _login(self, email, password):
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'email': email, 'password': password},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, f'Login failed: {resp.data}')
        return resp.data['access']

    def test_full_customer_purchase_flow(self):
        # ============================================================
        # STEP 1: Register customer
        # ============================================================
        resp = self.client.post(
            reverse('register'),
            {
                'email': self.customer_email,
                'first_name': 'Test',
                'last_name': 'Customer',
                'mobile': '01000000000',
                'password': self.customer_password,
                'confirm_password': self.customer_password,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED,
                         f'Register failed: {resp.data}')
        self.assertEqual(resp.data['user']['email'], self.customer_email)

        # ============================================================
        # STEP 2: Login and get JWT token
        # ============================================================
        token = self._login(self.customer_email, self.customer_password)
        auth_header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # ============================================================
        # STEP 3: Verify product is visible and in stock
        # ============================================================
        resp = self.client.get(reverse('product-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        products = resp.data
        self.assertGreaterEqual(len(products), 1, 'Product list is empty')
        product_from_api = next(
            (p for p in products if p['title'] == 'Wireless Headphones'), None
        )
        self.assertIsNotNone(product_from_api, 'Product not found in list')
        self.assertEqual(float(product_from_api['price']), self.product_price)
        self.assertGreater(int(product_from_api['stock']), 0, 'Product is out of stock')

        # Product detail by slug
        resp = self.client.get(
            reverse('product-detail', kwargs={'slug': self.product.slug})
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(float(resp.data['price']), self.product_price)
        self.assertEqual(resp.data['stock'], self.product_stock)

        # ============================================================
        # STEP 4: Add product to cart
        # ============================================================
        resp = self.client.post(
            reverse('cart'),
            {
                'product_id': self.product.id,
                'quantity': self.cart_quantity,
            },
            format='json',
            **auth_header,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK,
                         f'Add to cart failed: {resp.data}')

        # ============================================================
        # STEP 5: Verify cart contains the item
        # ============================================================
        resp = self.client.get(reverse('cart'), **auth_header)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['item_count'], 1, 'Cart should have 1 item')
        item = resp.data['items'][0]
        self.assertEqual(item['product_title'], 'Wireless Headphones')
        self.assertEqual(item['quantity'], self.cart_quantity)

        # ============================================================
        # STEP 6: Verify cart total is correct
        # ============================================================
        self.assertEqual(
            float(resp.data['total']), self.expected_total,
            f'Cart total {resp.data["total"]} != expected {self.expected_total}'
        )
        self.assertEqual(
            float(item['subtotal']), self.expected_total,
            f'Item subtotal {item["subtotal"]} != expected {self.expected_total}'
        )

        # ============================================================
        # STEP 7: Checkout
        # ============================================================
        checkout_data = {
            'full_name': 'Test Customer',
            'phone': '01000000000',
            'address': '123 Test Street',
            'city': 'Cairo',
            'country': 'Egypt',
            'payment_method': 'Cash on Delivery',
        }
        resp = self.client.post(
            reverse('checkout'),
            checkout_data,
            format='json',
            **auth_header,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED,
                         f'Checkout failed: {resp.data}')
        order_data = resp.data
        order_id = order_data['id']

        # ============================================================
        # STEP 8: Verify order is created
        # ============================================================
        self.assertTrue(Order.objects.filter(id=order_id).exists(),
                        f'Order #{order_id} was not created in database')
        self.assertEqual(order_data['status'], 'pending')
        self.assertEqual(order_data['payment_method'], 'Cash on Delivery')

        # ============================================================
        # STEP 9: Verify order items were created correctly
        # ============================================================
        self.assertEqual(len(order_data['items']), 1, 'Order should have 1 item')
        order_item = order_data['items'][0]
        self.assertEqual(order_item['product_title'], 'Wireless Headphones')
        self.assertEqual(float(order_item['product_price']), self.product_price)
        self.assertEqual(order_item['quantity'], self.cart_quantity)
        self.assertEqual(float(order_item['subtotal']), self.expected_total)

        # ============================================================
        # STEP 10: Verify order total is correct (items + shipping)
        # ============================================================
        self.assertEqual(
            float(order_data['total']), self.expected_order_total,
            f'Order total {order_data["total"]} != expected {self.expected_order_total}'
        )
        self.assertEqual(float(order_data.get('shipping_fee', 0)), 20.00)

        # ============================================================
        # STEP 11: Verify cart is empty after checkout
        # ============================================================
        resp = self.client.get(reverse('cart'), **auth_header)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['item_count'], 0,
                         'Cart should be empty after checkout')
        self.assertEqual(float(resp.data['total']), 0.00)

        # ============================================================
        # STEP 12: Verify product stock decreased
        # ============================================================
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, self.expected_remaining_stock,
                         f'Stock {self.product.stock} != expected {self.expected_remaining_stock}')

        # ============================================================
        # STEP 13: Verify user can view order history
        # ============================================================
        resp = self.client.get(reverse('order-list'), **auth_header)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1, 'Should have exactly 1 order in history')
        self.assertEqual(resp.data[0]['id'], order_id)
        self.assertEqual(float(resp.data[0]['total']), self.expected_order_total)
        self.assertEqual(resp.data[0]['item_count'], 1)

        # ============================================================
        # STEP 14: Verify user can view order detail
        # ============================================================
        resp = self.client.get(
            reverse('order-detail', kwargs={'pk': order_id}),
            **auth_header,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['id'], order_id)
        self.assertEqual(resp.data['full_name'], 'Test Customer')
        self.assertEqual(resp.data['phone'], '01000000000')
        self.assertEqual(resp.data['address'], '123 Test Street')
        self.assertEqual(resp.data['city'], 'Cairo')
        self.assertEqual(resp.data['country'], 'Egypt')
        self.assertEqual(len(resp.data['items']), 1)

        # ============================================================
        # STEP 15: Verify another user cannot view this order
        # ============================================================
        # Register and login as another user
        resp = self.client.post(
            reverse('register'),
            {
                'email': 'other@test.com',
                'first_name': 'Other',
                'last_name': 'User',
                'mobile': '01100000000',
                'password': 'testpass123',
                'confirm_password': 'testpass123',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        other_token = self._login('other@test.com', 'testpass123')
        other_auth = {'HTTP_AUTHORIZATION': f'Bearer {other_token}'}

        # Other user sees empty order history
        resp = self.client.get(reverse('order-list'), **other_auth)
        self.assertEqual(len(resp.data), 0,
                         'Other user should see 0 orders')

        # Other user cannot access the order detail
        resp = self.client.get(
            reverse('order-detail', kwargs={'pk': order_id}),
            **other_auth,
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND,
                         'Other user should get 404 for another user\'s order')


class EdgeCaseTests(TestCase):
    """Edge case and validation tests"""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Edge')
        self.product = Product.objects.create(
            category=self.category,
            title='Edge Product',
            price=50.00,
            stock=5,
        )

        resp = self.client.post(reverse('register'), {
            'email': 'edge@test.com',
            'first_name': 'Edge',
            'last_name': 'Tester',
            'mobile': '01200000000',
            'password': 'testpass123',
            'confirm_password': 'testpass123',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'edge@test.com',
            'password': 'testpass123',
        }, format='json')
        self.token = resp.data['access']
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_checkout_empty_cart_rejected(self):
        resp = self.client.post(reverse('checkout'), {
            'full_name': 'X', 'phone': '1', 'address': 'A',
            'city': 'C', 'country': 'EG',
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', resp.data)

    def test_add_out_of_stock_product_rejected(self):
        self.product.stock = 0
        self.product.save()

        resp = self.client.post(reverse('cart'), {
            'product_id': self.product.id,
            'quantity': 1,
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', resp.data)

    def test_unauthorized_cannot_access_cart(self):
        resp = self.client.get(reverse('cart'))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthorized_cannot_access_orders(self):
        resp = self.client.get(reverse('order-list'))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthorized_cannot_checkout(self):
        resp = self.client.post(reverse('checkout'), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
