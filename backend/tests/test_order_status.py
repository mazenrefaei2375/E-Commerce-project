from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product
from orders.models import Order


class OrderStatusUpdateTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@test.com', password='admin123',
            first_name='A', last_name='D',
        )
        self.customer = User.objects.create_user(
            email='cust@test.com', password='cust123',
            first_name='C', last_name='U', is_active=True,
        )
        self.seller = User.objects.create_user(
            email='seller@test.com', password='sell123',
            first_name='S', last_name='E', is_active=True,
            is_seller=True, seller_is_active=True, can_add_products=True,
        )

        self.category = Category.objects.create(name='Test')
        self.order = Order.objects.create(
            user=self.customer,
            full_name='Test Customer', phone='0100', address='Addr',
            city='Cairo', country='Egypt', total=100.00,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin@test.com', 'password': 'admin123',
        }, format='json')
        self.admin_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'cust@test.com', 'password': 'cust123',
        }, format='json')
        self.cust_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'seller@test.com', 'password': 'sell123',
        }, format='json')
        self.seller_token = resp.data['access']

    def test_admin_can_update_order_status(self):
        resp = self.client.patch(
            reverse('admin-order-status', kwargs={'pk': self.order.id}),
            {'status': 'processing'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {self.admin_token}',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'processing')
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'processing')

    def test_admin_update_returns_updated_order(self):
        resp = self.client.patch(
            reverse('admin-order-status', kwargs={'pk': self.order.id}),
            {'status': 'shipped'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {self.admin_token}',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'shipped')
        self.assertIn('total', resp.data)

    def test_customer_cannot_update_order_status(self):
        resp = self.client.patch(
            reverse('admin-order-status', kwargs={'pk': self.order.id}),
            {'status': 'processing'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {self.cust_token}',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_cannot_update_order_status(self):
        resp = self.client.patch(
            reverse('admin-order-status', kwargs={'pk': self.order.id}),
            {'status': 'processing'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {self.seller_token}',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_status_returns_400(self):
        resp = self.client.patch(
            reverse('admin-order-status', kwargs={'pk': self.order.id}),
            {'status': 'invalid_status'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {self.admin_token}',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', resp.data)

    def test_customer_can_still_view_own_order(self):
        resp = self.client.get(
            reverse('order-detail', kwargs={'pk': self.order.id}),
            HTTP_AUTHORIZATION=f'Bearer {self.cust_token}',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'pending')
