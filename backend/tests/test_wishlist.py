from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product
from wishlist.models import WishlistItem


class WishlistTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.category = Category.objects.create(name='Test')
        self.product1 = Product.objects.create(
            category=self.category, title='Product 1', price=10, stock=5, status='approved',
        )
        self.product2 = Product.objects.create(
            category=self.category, title='Product 2', price=20, stock=5, status='approved',
        )
        self.product_rejected = Product.objects.create(
            category=self.category, title='Rejected', price=5, stock=1, status='rejected',
        )

        self.customer = User.objects.create_user(
            email='cust@test.com', password='cust123', first_name='C', last_name='U', is_active=True,
        )
        self.other = User.objects.create_user(
            email='other@test.com', password='other123', first_name='O', last_name='U', is_active=True,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'cust@test.com', 'password': 'cust123',
        }, format='json')
        self.token = resp.data['access']
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'other@test.com', 'password': 'other123',
        }, format='json')
        self.other_token = resp.data['access']
        self.other_auth = {'HTTP_AUTHORIZATION': f'Bearer {self.other_token}'}

    def test_authenticated_can_add_to_wishlist(self):
        resp = self.client.post(reverse('wishlist-add'), {
            'product_id': self.product1.id,
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WishlistItem.objects.filter(user=self.customer).count(), 1)

    def test_cannot_add_same_product_twice(self):
        self.client.post(reverse('wishlist-add'), {'product_id': self.product1.id}, format='json', **self.auth)
        resp = self.client.post(reverse('wishlist-add'), {'product_id': self.product1.id}, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('already', resp.data.get('message', '').lower())
        self.assertEqual(WishlistItem.objects.filter(user=self.customer).count(), 1)

    def test_customer_can_list_own_wishlist(self):
        WishlistItem.objects.create(user=self.customer, product=self.product1)
        WishlistItem.objects.create(user=self.customer, product=self.product2)
        resp = self.client.get(reverse('wishlist-list'), **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_customer_can_remove_wishlist_item(self):
        item = WishlistItem.objects.create(user=self.customer, product=self.product1)
        resp = self.client.delete(reverse('wishlist-delete', kwargs={'pk': item.id}), **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.filter(user=self.customer).count(), 0)

    def test_cannot_remove_another_users_wishlist_item(self):
        other_item = WishlistItem.objects.create(user=self.other, product=self.product1)
        resp = self.client.delete(reverse('wishlist-delete', kwargs={'pk': other_item.id}), **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_guest_cannot_access_wishlist(self):
        resp = self.client.get(reverse('wishlist-list'))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_guest_cannot_add_to_wishlist(self):
        resp = self.client.post(reverse('wishlist-add'), {'product_id': self.product1.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_add_rejected_product_to_wishlist(self):
        resp = self.client.post(reverse('wishlist-add'), {
            'product_id': self.product_rejected.id,
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
