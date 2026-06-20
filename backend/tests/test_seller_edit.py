from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product


class SellerEditProductTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='Test Cat')

        self.seller1 = User.objects.create_user(
            email='s1@test.com', password='a', first_name='S1', last_name='U',
            is_active=True, is_seller=True, seller_type='approved',
            can_add_products=True, seller_is_active=True,
        )
        self.seller2 = User.objects.create_user(
            email='s2@test.com', password='a', first_name='S2', last_name='U',
            is_active=True, is_seller=True, seller_type='approved',
            can_add_products=True, seller_is_active=True,
        )
        self.customer = User.objects.create_user(
            email='c@test.com', password='a', first_name='C', last_name='U', is_active=True,
        )

        self.product1 = Product.objects.create(
            category=self.cat, title='S1 Product', price=50, stock=10,
            seller=self.seller1, status='approved', store_type='seller',
        )
        self.admin_product = Product.objects.create(
            category=self.cat, title='Admin Product', price=30, stock=5,
            seller=None, status='approved', store_type='admin',
        )

        resp = self.client.post(reverse('token_obtain_pair'), {'email': 's1@test.com', 'password': 'a'}, format='json')
        self.s1_token = resp.data['access']
        resp = self.client.post(reverse('token_obtain_pair'), {'email': 's2@test.com', 'password': 'a'}, format='json')
        self.s2_token = resp.data['access']
        resp = self.client.post(reverse('token_obtain_pair'), {'email': 'c@test.com', 'password': 'a'}, format='json')
        self.cust_token = resp.data['access']

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_seller_can_edit_own_product(self):
        resp = self.client.patch(
            reverse('seller-product-update', kwargs={'pk': self.product1.id}),
            {'title': 'Updated Title', 'price': 99.99, 'stock': 20, 'category': self.cat.id},
            format='json', **self._auth(self.s1_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.title, 'Updated Title')
        self.assertEqual(float(self.product1.price), 99.99)

    def test_seller_cannot_edit_other_seller_product(self):
        resp = self.client.patch(
            reverse('seller-product-update', kwargs={'pk': self.product1.id}),
            {'title': 'Hacked'},
            format='json', **self._auth(self.s2_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_cannot_edit_seller_product(self):
        resp = self.client.patch(
            reverse('seller-product-update', kwargs={'pk': self.product1.id}),
            {'title': 'Hacked'},
            format='json', **self._auth(self.cust_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_update_keeps_status_unchanged(self):
        self.product1.status = 'approved'
        self.product1.save()
        resp = self.client.patch(
            reverse('seller-product-update', kwargs={'pk': self.product1.id}),
            {'price': 77},
            format='json', **self._auth(self.s1_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.status, 'approved')

    def test_seller_can_update_image_url(self):
        resp = self.client.patch(
            reverse('seller-product-update', kwargs={'pk': self.product1.id}),
            {'title': 'New', 'price': 10, 'stock': 1, 'category': self.cat.id, 'image': '/products/test.jpg'},
            format='json', **self._auth(self.s1_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.image, '/products/test.jpg')
