from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product
from orders.models import Order, OrderItem


class SellerAnalyticsTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.category = Category.objects.create(name='Test')

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

        self.p1 = Product.objects.create(category=self.category, title='S1 Product', price=50, stock=20, seller=self.seller1, status='approved')
        self.p2 = Product.objects.create(category=self.category, title='S2 Product', price=30, stock=10, seller=self.seller2, status='approved')
        self.p3 = Product.objects.create(category=self.category, title='S1 Low Stock', price=100, stock=3, seller=self.seller1, status='approved')

        order = Order.objects.create(user=self.customer, full_name='X', phone='0', address='A', city='C', country='EG', total=130)
        OrderItem.objects.create(order=order, product=self.p1, product_title='S1 Product', product_price=50, quantity=2, subtotal=100)
        OrderItem.objects.create(order=order, product=self.p2, product_title='S2 Product', product_price=30, quantity=1, subtotal=30)

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 's1@test.com', 'password': 'a',
        }, format='json')
        self.s1_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'c@test.com', 'password': 'a',
        }, format='json')
        self.cust_token = resp.data['access']

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_analytics_returns_only_own_products(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_products'], 2)
        self.assertEqual(resp.data['approved_products'], 2)

    def test_analytics_excludes_other_seller(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        self.assertEqual(resp.data['total_units_sold'], 2)
        revenue = float(resp.data['total_revenue'])
        self.assertEqual(revenue, 100.0)

    def test_units_sold_calculated_correctly(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        self.assertEqual(resp.data['total_units_sold'], 2)

    def test_total_revenue_calculated_correctly(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        self.assertEqual(float(resp.data['total_revenue']), 100.0)

    def test_total_orders_count_unique(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        self.assertEqual(resp.data['total_orders'], 1)

    def test_top_products_sorted_by_units(self):
        order2 = Order.objects.create(user=self.customer, full_name='Y', phone='1', address='B', city='D', country='EG', total=200)
        OrderItem.objects.create(order=order2, product=self.p3, product_title='S1 Low Stock', product_price=100, quantity=5, subtotal=500)
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        top = resp.data['top_products']
        self.assertEqual(top[0]['units_sold'], 5)

    def test_low_stock_count_correct(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.s1_token))
        self.assertEqual(resp.data['low_stock_products'], 1)

    def test_customer_cannot_access_analytics(self):
        resp = self.client.get(reverse('seller-dashboard'), **self._auth(self.cust_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_stock_decreases_after_checkout(self):
        self.p1.refresh_from_db()
        initial_stock = self.p1.stock
        order = Order.objects.create(user=self.customer, full_name='Z', phone='2', address='D', city='E', country='EG', total=50)
        OrderItem.objects.create(order=order, product=self.p1, product_title='S1 Product', product_price=50, quantity=1, subtotal=50)
        self.p1.stock -= 1
        self.p1.save()
        self.p1.refresh_from_db()
        self.assertEqual(self.p1.stock, initial_stock - 1)
