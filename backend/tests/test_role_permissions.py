from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from products.models import Category, Product


class RolePermissionTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Create admin
        self.admin = User.objects.create_superuser(
            email='admin@test.com', password='admin123',
            first_name='Admin', last_name='User',
        )

        # Create customer
        self.customer = User.objects.create_user(
            email='cust@test.com', password='cust123',
            first_name='Cust', last_name='User', is_active=True,
        )

        # Create seller (basic, can_add_products=False)
        self.seller_basic = User.objects.create_user(
            email='basic@test.com', password='seller123',
            first_name='Basic', last_name='Seller',
            is_active=True, is_seller=True, seller_type='basic',
            can_add_products=False, seller_is_active=True,
        )

        # Create seller (approved, can_add_products=True)
        self.seller_approved = User.objects.create_user(
            email='approved@test.com', password='seller123',
            first_name='Approved', last_name='Seller',
            is_active=True, is_seller=True, seller_type='approved',
            can_add_products=True, seller_is_active=True,
        )

        # Create seller (trusted, can_add_products=True)
        self.seller_trusted = User.objects.create_user(
            email='trusted@test.com', password='seller123',
            first_name='Trusted', last_name='Seller',
            is_active=True, is_seller=True, seller_type='trusted',
            can_add_products=True, seller_is_active=True,
        )

        self.category = Category.objects.create(name='Test Category')

    def _login(self, email, password):
        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': email, 'password': password,
        }, format='json')
        return resp.data['access']

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_customer_cannot_access_admin_users(self):
        token = self._login('cust@test.com', 'cust123')
        resp = self.client.get(reverse('admin-users'), **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_cannot_access_seller_products(self):
        token = self._login('cust@test.com', 'cust123')
        resp = self.client.get(reverse('seller-products'), **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_users(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.get(reverse('admin-users'), **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 4)

    def test_admin_can_make_user_seller(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.patch(
            reverse('admin-make-seller', kwargs={'pk': self.customer.id}),
            **self._auth(token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['is_seller'])
        self.assertEqual(resp.data['seller_type'], 'basic')
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_seller)

    def test_admin_can_update_seller_settings(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.patch(
            reverse('admin-seller-settings', kwargs={'pk': self.seller_basic.id}),
            {'seller_type': 'approved', 'can_add_products': True},
            format='json', **self._auth(token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.seller_basic.refresh_from_db()
        self.assertEqual(self.seller_basic.seller_type, 'approved')
        self.assertTrue(self.seller_basic.can_add_products)

    def test_basic_seller_without_permission_cannot_create_product(self):
        token = self._login('basic@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'P1', 'price': 10, 'stock': 5,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_approved_seller_creates_pending_product(self):
        token = self._login('approved@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'Approved Product', 'price': 20, 'stock': 5,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get(id=resp.data['id'])
        self.assertEqual(product.status, 'pending')

    def test_trusted_seller_creates_approved_product(self):
        token = self._login('trusted@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'Trusted Product', 'price': 30, 'stock': 5,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get(id=resp.data['id'])
        self.assertEqual(product.status, 'approved')

    def test_seller_only_sees_own_products(self):
        token_a = self._login('approved@test.com', 'seller123')
        token_t = self._login('trusted@test.com', 'seller123')

        self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'A Product', 'price': 10, 'stock': 1,
        }, format='json', **self._auth(token_a))
        self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'T Product', 'price': 20, 'stock': 1,
        }, format='json', **self._auth(token_t))

        resp = self.client.get(reverse('seller-products'), **self._auth(token_a))
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['title'], 'A Product')

    def test_admin_can_approve_product(self):
        token = self._login('approved@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'Pending', 'price': 10, 'stock': 1,
        }, format='json', **self._auth(token))
        product_id = resp.data['id']

        admin_token = self._login('admin@test.com', 'admin123')
        resp = self.client.patch(
            reverse('admin-product-approve', kwargs={'pk': product_id}),
            **self._auth(admin_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'approved')

    def test_admin_can_reject_product(self):
        token = self._login('approved@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'RejectMe', 'price': 10, 'stock': 1,
        }, format='json', **self._auth(token))
        product_id = resp.data['id']

        admin_token = self._login('admin@test.com', 'admin123')
        resp = self.client.patch(
            reverse('admin-product-reject', kwargs={'pk': product_id}),
            **self._auth(admin_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'rejected')

    def test_public_only_sees_approved_products(self):
        token = self._login('approved@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id, 'title': 'Hidden', 'price': 10, 'stock': 5,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        Product.objects.create(
            category=self.category, title='Visible', price=20, stock=5, status='approved',
        )

        resp = self.client.get(reverse('product-list'))
        titles = [p['title'] for p in resp.data]
        self.assertNotIn('Hidden', titles)
        self.assertIn('Visible', titles)

    def test_admin_can_create_seller_account(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': 'new_seller@test.com',
            'first_name': 'New', 'last_name': 'Seller',
            'password': 'Strong123', 'confirm_password': 'Strong123',
            'seller_type': 'approved', 'can_add_products': True, 'seller_is_active': True,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='new_seller@test.com')
        self.assertTrue(user.is_seller)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.seller_type, 'approved')
        self.assertTrue(user.can_add_products)

    def test_customer_cannot_create_seller_account(self):
        token = self._login('cust@test.com', 'cust123')
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': 'bad@test.com', 'first_name': 'X', 'last_name': 'X',
            'password': 'Strong123', 'confirm_password': 'Strong123',
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_create_converts_existing_customer(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': 'cust@test.com',
            'first_name': 'Dup', 'last_name': 'User',
            'password': 'Strong123', 'confirm_password': 'Strong123',
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('set as seller', resp.data.get('message', '').lower())

    def test_seller_create_password_mismatch_fails(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': 'mismatch@test.com', 'first_name': 'X', 'last_name': 'X',
            'password': 'Strong123', 'confirm_password': 'WrongOne',
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_products(self):
        Product.objects.create(category=self.category, title='Laptop', price=1000, stock=5, status='approved')
        Product.objects.create(category=self.category, title='Mouse', price=50, stock=10, status='approved')

        resp = self.client.get(reverse('product-list') + '?search=Laptop')
        titles = [p['title'] for p in resp.data]
        self.assertIn('Laptop', titles)
        self.assertNotIn('Mouse', titles)

    def test_admin_can_list_all_products(self):
        Product.objects.create(category=self.category, title='Approved', price=10, stock=1, status='approved')
        Product.objects.create(category=self.category, title='Pending', price=20, stock=1, status='pending')

        token = self._login('admin@test.com', 'admin123')
        resp = self.client.get(reverse('admin-products'), **self._auth(token))
        titles = [p['title'] for p in resp.data]
        self.assertIn('Approved', titles)
        self.assertIn('Pending', titles)

    def test_admin_can_create_product_via_api(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.post(reverse('admin-product-create'), {
            'category': self.category.id,
            'title': 'Admin Created',
            'price': 25.99,
            'stock': 10,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['title'], 'Admin Created')
        product = Product.objects.get(id=resp.data['id'])
        self.assertEqual(product.status, 'approved')

    def test_customer_cannot_create_product_via_admin_api(self):
        token = self._login('cust@test.com', 'cust123')
        resp = self.client.post(reverse('admin-product-create'), {
            'category': self.category.id,
            'title': 'Not Allowed',
            'price': 10,
            'stock': 5,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_product_has_no_seller(self):
        token = self._login('admin@test.com', 'admin123')
        resp = self.client.post(reverse('admin-product-create'), {
            'category': self.category.id,
            'title': 'Admin Store Product',
            'price': 50,
            'stock': 5,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resp.data['seller'])
        self.assertEqual(resp.data['store_type'], 'admin')
        self.assertEqual(resp.data['status'], 'approved')

    def test_seller_product_has_store_type_seller(self):
        token = self._login('approved@test.com', 'seller123')
        resp = self.client.post(reverse('seller-product-create'), {
            'category': self.category.id,
            'title': 'Seller Store Product',
            'price': 30,
            'stock': 3,
        }, format='json', **self._auth(token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get(id=resp.data['id'])
        self.assertEqual(product.store_type, 'seller')
        self.assertEqual(product.seller, self.seller_approved)


class SellerManagementTests(TestCase):

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
            is_seller=True, seller_type='approved', can_add_products=True,
            seller_is_active=True,
        )

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin@test.com', 'password': 'admin123',
        }, format='json')
        self.admin_token = resp.data['access']

        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'cust@test.com', 'password': 'cust123',
        }, format='json')
        self.cust_token = resp.data['access']

    def _admin(self):
        return {'HTTP_AUTHORIZATION': f'Bearer {self.admin_token}'}

    def _cust(self):
        return {'HTTP_AUTHORIZATION': f'Bearer {self.cust_token}'}

    def test_remove_seller_role_successfully(self):
        resp = self.client.patch(
            reverse('admin-remove-seller', kwargs={'pk': self.seller.id}),
            **self._admin(),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.seller.refresh_from_db()
        self.assertFalse(self.seller.is_seller)
        self.assertFalse(self.seller.can_add_products)
        self.assertFalse(self.seller.seller_is_active)
        self.assertTrue(self.seller.is_active)

    def test_removed_seller_not_in_sellers_list(self):
        self.client.patch(
            reverse('admin-remove-seller', kwargs={'pk': self.seller.id}),
            **self._admin(),
        )
        resp = self.client.get(reverse('admin-sellers'), **self._admin())
        ids = [u['id'] for u in resp.data]
        self.assertNotIn(self.seller.id, ids)

    def test_removed_seller_still_in_users_list(self):
        self.client.patch(
            reverse('admin-remove-seller', kwargs={'pk': self.seller.id}),
            **self._admin(),
        )
        resp = self.client.get(reverse('admin-users'), **self._admin())
        ids = [u['id'] for u in resp.data]
        self.assertIn(self.seller.id, ids)

    def test_create_seller_new_email(self):
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': 'new_seller@test.com',
            'first_name': 'New', 'last_name': 'Seller',
            'password': 'Strong123', 'confirm_password': 'Strong123',
            'seller_type': 'approved', 'can_add_products': True, 'seller_is_active': True,
        }, format='json', **self._admin())
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='new_seller@test.com').exists())

    def test_create_seller_with_existing_customer_converts(self):
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': self.customer.email.upper(),
            'first_name': 'Converted', 'last_name': 'User',
            'password': 'Strong123', 'confirm_password': 'Strong123',
            'seller_type': 'approved', 'can_add_products': True, 'seller_is_active': True,
        }, format='json', **self._admin())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_seller)
        self.assertEqual(self.customer.seller_type, 'approved')
        self.assertTrue(self.customer.can_add_products)
        self.assertIn('set as seller', resp.data.get('message', '').lower())

    def test_remove_then_reactivate_seller(self):
        self.client.patch(
            reverse('admin-remove-seller', kwargs={'pk': self.seller.id}),
            **self._admin(),
        )
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': self.seller.email,
            'first_name': 'Reactivated', 'last_name': 'Seller',
            'password': 'Strong123', 'confirm_password': 'Strong123',
            'seller_type': 'trusted', 'can_add_products': True, 'seller_is_active': True,
        }, format='json', **self._admin())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.seller.refresh_from_db()
        self.assertTrue(self.seller.is_seller)
        self.assertEqual(self.seller.seller_type, 'trusted')
        self.assertIn('set as seller', resp.data.get('message', '').lower())

    def test_cannot_create_seller_with_admin_email(self):
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': self.admin.email,
            'first_name': 'X', 'last_name': 'X',
            'password': 'Strong123', 'confirm_password': 'Strong123',
        }, format='json', **self._admin())
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Admin', resp.data.get('error', ''))

    def test_cannot_duplicate_active_seller(self):
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': self.seller.email,
            'first_name': 'X', 'last_name': 'X',
            'password': 'Strong123', 'confirm_password': 'Strong123',
        }, format='json', **self._admin())
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already', resp.data.get('error', ''))

    def test_customer_cannot_create_seller_via_admin_endpoint(self):
        resp = self.client.post(reverse('admin-seller-create'), {
            'email': 'bad@test.com',
            'password': 'Strong123', 'confirm_password': 'Strong123',
        }, format='json', **self._cust())
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
