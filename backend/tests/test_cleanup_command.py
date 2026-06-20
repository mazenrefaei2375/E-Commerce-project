from django.test import TestCase
from django.core.management import call_command
from io import StringIO
from users.models import User
from products.models import Category, Product
from orders.models import Order
from cart.models import Cart, CartItem


class CleanupCommandTests(TestCase):

    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@ecommerce.com', password='a', first_name='A', last_name='D',
        )
        self.seller = User.objects.create_user(
            email='seller@gmail.com', password='a', first_name='S', last_name='E',
            is_active=True, is_seller=True, seller_is_active=True,
        )
        self.manual = User.objects.create_user(
            email='mazen@gmail.com', password='a', first_name='M', last_name='Z',
            is_active=True,
        )
        self.test1 = User.objects.create_user(
            email='customer_123@test.com', password='a', first_name='T', last_name='C',
            is_active=True,
        )
        self.test2 = User.objects.create_user(
            email='orderuser@example.com', password='a', first_name='O', last_name='U',
            is_active=True,
        )

        self.cat = Category.objects.create(name='CleanupTest')
        cart = Cart.objects.create(user=self.test1)
        CartItem.objects.create(cart=cart, product=Product.objects.create(
            category=self.cat, title='P1', price=10, stock=10,
        ))
        Order.objects.create(
            user=self.test1, full_name='X', phone='0', address='A',
            city='C', country='EG', total=10,
        )

    def test_dry_run_does_not_delete_users(self):
        out = StringIO()
        count_before = User.objects.count()
        call_command('cleanup_test_data', stdout=out)
        count_after = User.objects.count()
        self.assertEqual(count_before, count_after)
        self.assertIn('DRY RUN', out.getvalue())

    def test_confirm_deletes_test_users(self):
        out = StringIO()
        call_command('cleanup_test_data', '--confirm', stdout=out)
        self.assertFalse(User.objects.filter(email__iendswith='@test.com').exists())
        self.assertFalse(User.objects.filter(email__iendswith='@example.com').exists())
        self.assertIn('Deleted test data successfully', out.getvalue())

    def test_admin_remains_after_cleanup(self):
        call_command('cleanup_test_data', '--confirm', stdout=StringIO())
        self.assertTrue(User.objects.filter(email='admin@ecommerce.com').exists())

    def test_seller_remains_after_cleanup(self):
        call_command('cleanup_test_data', '--confirm', stdout=StringIO())
        self.assertTrue(User.objects.filter(email='seller@gmail.com').exists())

    def test_manual_user_remains_after_cleanup(self):
        call_command('cleanup_test_data', '--confirm', stdout=StringIO())
        self.assertTrue(User.objects.filter(email='mazen@gmail.com').exists())

    def test_related_data_deleted_with_confirm(self):
        user = self.test1
        self.assertEqual(Cart.objects.filter(user=user).count(), 1)
        self.assertEqual(Order.objects.filter(user=user).count(), 1)
        call_command('cleanup_test_data', '--confirm', stdout=StringIO())
        self.assertEqual(Cart.objects.filter(user=user).count(), 0)
        self.assertEqual(Order.objects.filter(user=user).count(), 0)
