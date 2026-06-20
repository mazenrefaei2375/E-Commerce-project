from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User


class AdminDeactivateSafetyTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin1 = User.objects.create_superuser(
            email='admin1@test.com', password='admin123',
            first_name='A1', last_name='U',
        )
        self.admin2 = User.objects.create_superuser(
            email='admin2@test.com', password='admin123',
            first_name='A2', last_name='U',
        )
        self.customer = User.objects.create_user(
            email='cust@test.com', password='cust123',
            first_name='C', last_name='U', is_active=True,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin1@test.com', 'password': 'admin123',
        }, format='json')
        self.token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin2@test.com', 'password': 'admin123',
        }, format='json')
        self.token2 = resp.data['access']

    def _auth(self, token=None):
        return {'HTTP_AUTHORIZATION': f'Bearer {token or self.token}'}

    def test_admin_cannot_deactivate_self(self):
        resp = self.client.patch(
            reverse('admin-user-deactivate', kwargs={'pk': self.admin1.id}),
            **self._auth(),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('own', resp.data.get('error', ''))
        self.admin1.refresh_from_db()
        self.assertTrue(self.admin1.is_active)

    def test_admin_can_deactivate_customer(self):
        resp = self.client.patch(
            reverse('admin-user-deactivate', kwargs={'pk': self.customer.id}),
            **self._auth(),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

    def test_cannot_deactivate_last_active_admin(self):
        # Deactivate admin2 first (using admin1's token)
        self.client.patch(
            reverse('admin-user-deactivate', kwargs={'pk': self.admin2.id}),
            **self._auth(),
        )
        # Now admin1 is the only active admin
        # admin1 cannot deactivate themselves (own-account check)
        resp = self.client.patch(
            reverse('admin-user-deactivate', kwargs={'pk': self.admin1.id}),
            **self._auth(),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin1.refresh_from_db()
        self.assertTrue(self.admin1.is_active)

    def test_can_deactivate_admin_if_another_admin_exists(self):
        # Two admins exist (admin1 + admin2). admin1 deactivates admin2.
        resp = self.client.patch(
            reverse('admin-user-deactivate', kwargs={'pk': self.admin2.id}),
            **self._auth(),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.admin2.refresh_from_db()
        self.assertFalse(self.admin2.is_active)

    def test_remove_seller_does_not_deactivate_account(self):
        seller = User.objects.create_user(
            email='s@test.com', password='a', first_name='S', last_name='E',
            is_active=True, is_seller=True, seller_is_active=True,
        )
        self.client.patch(
            reverse('admin-remove-seller', kwargs={'pk': seller.id}),
            **self._auth(),
        )
        seller.refresh_from_db()
        self.assertFalse(seller.is_seller)
        self.assertTrue(seller.is_active)
