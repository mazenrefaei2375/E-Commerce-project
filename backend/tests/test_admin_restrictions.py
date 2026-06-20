from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product
from wishlist.models import WishlistItem


class AdminShoppingRestrictionTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@test.com', password='admin123', first_name='A', last_name='D',
        )
        self.customer = User.objects.create_user(
            email='cust@test.com', password='cust123', first_name='C', last_name='U', is_active=True,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin@test.com', 'password': 'admin123',
        }, format='json')
        self.admin_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'cust@test.com', 'password': 'cust123',
        }, format='json')
        self.cust_token = resp.data['access']

        self.cat = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            category=self.cat, title='Test Product', price=10, stock=10, status='approved',
        )

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_admin_cannot_add_to_cart(self):
        resp = self.client.post(reverse('cart'), {
            'product_id': self.product.id, 'quantity': 1,
        }, format='json', **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_get_cart(self):
        resp = self.client.get(reverse('cart'), **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_checkout(self):
        resp = self.client.post(reverse('checkout'), {
            'full_name': 'X', 'phone': '0', 'address': 'A', 'city': 'C', 'country': 'EG',
        }, format='json', **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_add_wishlist(self):
        resp = self.client.post(reverse('wishlist-add'), {
            'product_id': self.product.id,
        }, format='json', **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_can_add_to_cart(self):
        resp = self.client.post(reverse('cart'), {
            'product_id': self.product.id, 'quantity': 1,
        }, format='json', **self._auth(self.cust_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_customer_can_checkout(self):
        self.client.post(reverse('cart'), {
            'product_id': self.product.id, 'quantity': 1,
        }, format='json', **self._auth(self.cust_token))
        resp = self.client.post(reverse('checkout'), {
            'full_name': 'X', 'phone': '0', 'address': 'A', 'city': 'C', 'country': 'EG',
        }, format='json', **self._auth(self.cust_token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_admin_can_still_manage_products(self):
        resp = self.client.get(reverse('admin-products'), **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_admin_can_still_manage_orders(self):
        resp = self.client.get(reverse('admin-orders'), **self._auth(self.admin_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
