from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product
from orders.models import Order, OrderItem


class AdminDashboardAnalyticsTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@test.com', password='admin123', first_name='A', last_name='D',
        )
        self.customer = User.objects.create_user(
            email='c@test.com', password='a', first_name='C', last_name='U', is_active=True,
        )
        self.seller = User.objects.create_user(
            email='s@test.com', password='a', first_name='S', last_name='E',
            is_active=True, is_seller=True, seller_is_active=True,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin@test.com', 'password': 'admin123',
        }, format='json')
        self.admin_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'c@test.com', 'password': 'a',
        }, format='json')
        self.cust_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 's@test.com', 'password': 'a',
        }, format='json')
        self.seller_token = resp.data['access']

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_admin_can_access_dashboard(self):
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', resp.data)
        self.assertIn('total_revenue', resp.data)
        self.assertIn('top_products', resp.data)
        self.assertIn('recent_orders', resp.data)

    def test_customer_cannot_access_dashboard(self):
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.cust_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_cannot_access_dashboard(self):
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.seller_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_revenue_calculated_correctly(self):
        cat = Category.objects.create(name='T')
        prod = Product.objects.create(category=cat, title='P', price=50, stock=10, status='approved')
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=120)
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertGreater(float(resp.data['total_revenue']), 0)

    def test_top_products_calculated(self):
        cat = Category.objects.create(name='T')
        p = Product.objects.create(category=cat, title='Top', price=10, stock=20, status='approved')
        order = Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=10)
        OrderItem.objects.create(order=order, product=p, product_title='Top', product_price=10, quantity=3, subtotal=30)
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertGreaterEqual(len(resp.data['top_products']), 1)

    def test_low_stock_count_correct(self):
        cat = Category.objects.create(name='T')
        Product.objects.create(category=cat, title='Low', price=5, stock=3, status='approved')
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertEqual(resp.data['low_stock_products'], 1)

    def test_net_revenue_includes_delivered_only(self):
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=100, status='delivered')
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=200, status='pending')
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=50, status='cancelled')
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertEqual(float(resp.data['net_revenue']), 100.0)

    def test_net_revenue_excludes_pending_processing_shipped(self):
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=200, status='delivered')
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=300, status='processing')
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=400, status='shipped')
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertEqual(float(resp.data['net_revenue']), 200.0)

    def test_net_revenue_returns_zero_when_no_delivered(self):
        Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=100, status='pending')
        resp = self.client.get(reverse('admin-dashboard'), **self._auth(self.admin_token))
        self.assertEqual(float(resp.data['net_revenue']), 0.0)


class AdminDeleteUserTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@test.com', password='admin123', first_name='A', last_name='D',
        )
        self.admin2 = User.objects.create_superuser(
            email='admin2@test.com', password='admin123', first_name='A2', last_name='D',
        )
        self.customer = User.objects.create_user(
            email='c@test.com', password='a', first_name='C', last_name='U', is_active=True,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin@test.com', 'password': 'admin123',
        }, format='json')
        self.admin_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'c@test.com', 'password': 'a',
        }, format='json')
        self.cust_token = resp.data['access']

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_admin_can_delete_customer(self):
        resp = self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': self.customer.id}),
            **self._auth(self.admin_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=self.customer.id).exists())

    def test_admin_cannot_delete_self(self):
        resp = self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': self.admin.id}),
            **self._auth(self.admin_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('own', resp.data.get('error', '').lower())

    def test_admin_cannot_delete_last_admin(self):
        self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': self.admin2.id}),
            **self._auth(self.admin_token),
        )
        resp = self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': self.admin.id}),
            **self._auth(self.admin_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_cannot_delete_users(self):
        resp = self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': self.customer.id}),
            **self._auth(self.cust_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_deleted_user_email_can_be_reused(self):
        email = self.customer.email
        self.client.delete(
            reverse('admin-user-delete', kwargs={'pk': self.customer.id}),
            **self._auth(self.admin_token),
        )
        user2 = User.objects.create_user(
            email=email, password='new', first_name='N', last_name='U',
        )
        self.assertIsNotNone(user2.id)
