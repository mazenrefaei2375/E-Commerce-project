from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from datetime import date, timedelta


class ProfileValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='valid@test.com', password='test123',
            first_name='V', last_name='U', is_active=True,
        )
        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'valid@test.com', 'password': 'test123',
        }, format='json')
        self.token = resp.data['access']
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_profile_rejects_mobile_with_letters(self):
        resp = self.client.patch(reverse('user_profile'), {
            'mobile': '012abc34',
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mobile', resp.data)

    def test_profile_accepts_mobile_digits_only(self):
        resp = self.client.patch(reverse('user_profile'), {
            'mobile': '01012345678',
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.mobile, '01012345678')

    def test_profile_accepts_empty_mobile(self):
        resp = self.client.patch(reverse('user_profile'), {
            'mobile': '',
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.mobile, '')

    def test_profile_rejects_future_birthdate(self):
        future = (date.today() + timedelta(days=365)).isoformat()
        resp = self.client.patch(reverse('user_profile'), {
            'birthdate': future,
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('birthdate', resp.data)

    def test_profile_accepts_past_birthdate(self):
        past = '1995-06-15'
        resp = self.client.patch(reverse('user_profile'), {
            'birthdate': past,
        }, format='json', **self.auth)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.birthdate.isoformat(), past)
