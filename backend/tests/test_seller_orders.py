from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product
from orders.models import Order, OrderItem


class SellerOrderTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='T')

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
        self.inactive_seller = User.objects.create_user(
            email='si@test.com', password='a', first_name='SI', last_name='U',
            is_active=True, is_seller=True, seller_is_active=False,
        )
        self.customer = User.objects.create_user(
            email='c@test.com', password='a', first_name='C', last_name='U', is_active=True,
        )

        self.p1 = Product.objects.create(category=self.cat, title='S1 Product', price=50, stock=20, seller=self.seller1, status='approved')
        self.p2 = Product.objects.create(category=self.cat, title='S2 Product', price=30, stock=10, seller=self.seller2, status='approved')

        self.order = Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=130)
        self.item1 = OrderItem.objects.create(order=self.order, product=self.p1, product_title='S1 Product', product_price=50, quantity=2, subtotal=100)
        self.item2 = OrderItem.objects.create(order=self.order, product=self.p2, product_title='S2 Product', product_price=30, quantity=1, subtotal=30)

        resp = self.client.post(reverse('token_obtain_pair'), {'email': 's1@test.com', 'password': 'a'}, format='json')
        self.s1_token = resp.data['access']
        resp = self.client.post(reverse('token_obtain_pair'), {'email': 's2@test.com', 'password': 'a'}, format='json')
        self.s2_token = resp.data['access']
        resp = self.client.post(reverse('token_obtain_pair'), {'email': 'si@test.com', 'password': 'a'}, format='json')
        self.si_token = resp.data['access']
        resp = self.client.post(reverse('token_obtain_pair'), {'email': 'c@test.com', 'password': 'a'}, format='json')
        self.cust_token = resp.data['access']

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_seller_sees_only_own_products_in_orders(self):
        resp = self.client.get(reverse('seller-orders'), **self._auth(self.s1_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        orders = resp.data
        self.assertEqual(len(orders), 1)
        self.assertEqual(len(orders[0]['items']), 1)
        self.assertEqual(orders[0]['items'][0]['product_title'], 'S1 Product')

    def test_seller_order_list_excludes_other_seller(self):
        resp = self.client.get(reverse('seller-orders'), **self._auth(self.s1_token))
        for item in resp.data[0]['items']:
            self.assertNotEqual(item['product_title'], 'S2 Product')

    def test_seller_can_update_own_item_status(self):
        resp = self.client.patch(
            reverse('seller-order-item-status', kwargs={'pk': self.item1.id}),
            {'seller_status': 'preparing'},
            format='json',
            **self._auth(self.s1_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.item1.refresh_from_db()
        self.assertEqual(self.item1.seller_status, 'preparing')

    def test_seller_cannot_update_other_seller_item(self):
        resp = self.client.patch(
            reverse('seller-order-item-status', kwargs={'pk': self.item2.id}),
            {'seller_status': 'preparing'},
            format='json',
            **self._auth(self.s1_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_cannot_access_seller_orders(self):
        resp = self.client.get(reverse('seller-orders'), **self._auth(self.cust_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_inactive_seller_cannot_access(self):
        resp = self.client.get(reverse('seller-orders'), **self._auth(self.si_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_status_returns_400(self):
        resp = self.client.patch(
            reverse('seller-order-item-status', kwargs={'pk': self.item1.id}),
            {'seller_status': 'delivered'},
            format='json',
            **self._auth(self.s1_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
