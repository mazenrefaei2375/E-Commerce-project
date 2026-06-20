from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from users.models import User
from cart.models import Cart, CartItem


PROTECTED_EMAILS = [
    'admin@ecommerce.com',
    'seller@gmail.com',
    'ma@nu.edu.eg',
    'mazen@gmail.com',
    'maz@gmail.com',
]

TEST_PATTERNS = ['%test.com', '%example.com']


class Command(BaseCommand):
    help = 'Clean up test-generated data (users, carts, orders, wishlist). Dry-run by default.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Actually delete the data. Without this flag, only a dry run is performed.',
        )
        parser.add_argument(
            '--clean-orphan-carts',
            action='store_true',
            help='Remove cart items from carts that have no items but cart record exists.',
        )

    def _find_test_users(self):
        q = Q()
        for pattern in TEST_PATTERNS:
            if pattern.startswith('%'):
                q |= Q(email__iendswith=pattern[1:])
            else:
                q |= Q(email__icontains=pattern)
        return User.objects.filter(q).exclude(email__in=PROTECTED_EMAILS)

    def _find_orphan_cart_items(self):
        return CartItem.objects.filter(cart__items__isnull=True)

    def handle(self, *args, **options):
        confirm = options['confirm']
        clean_orphan = options['clean_orphan_carts']

        # --- Find test users ---
        test_users = self._find_test_users()
        test_user_ids = list(test_users.values_list('id', flat=True))

        self.stdout.write('=' * 60)
        self.stdout.write('  CLEANUP TEST DATA')
        self.stdout.write('=' * 60)

        if confirm:
            self.stdout.write(self.style.WARNING('\n  MODE: CONFIRMED DELETE'))
        else:
            self.stdout.write(self.style.SUCCESS('\n  MODE: DRY RUN (no data will be deleted)'))

        # --- Report test users ---
        self.stdout.write(f'\n  Test users found: {test_users.count()}')
        for u in test_users:
            self.stdout.write(f'    - {u.email} ({u.first_name} {u.last_name})')

        if test_users.count() == 0 and not clean_orphan:
            self.stdout.write('\n  No test users found. Nothing to clean.')
            return

        # --- Report related data ---
        test_carts = Cart.objects.filter(user_id__in=test_user_ids)
        test_cart_items = CartItem.objects.filter(cart__user_id__in=test_user_ids)

        from orders.models import Order, OrderItem
        test_orders = Order.objects.filter(user_id__in=test_user_ids)
        test_order_items = OrderItem.objects.filter(order__user_id__in=test_user_ids)

        from wishlist.models import WishlistItem
        test_wishlist = WishlistItem.objects.filter(user_id__in=test_user_ids)

        self.stdout.write(f'\n  Related data:')
        self.stdout.write(f'    Carts:          {test_carts.count()}')
        self.stdout.write(f'    Cart items:     {test_cart_items.count()}')
        self.stdout.write(f'    Orders:         {test_orders.count()}')
        self.stdout.write(f'    Order items:    {test_order_items.count()}')
        self.stdout.write(f'    Wishlist items: {test_wishlist.count()}')

        # --- Orphan carts ---
        if clean_orphan:
            orphan_items = self._find_orphan_cart_items()
            self.stdout.write(f'\n  Orphan cart items: {orphan_items.count()}')

        # --- Protected data check ---
        protected = User.objects.filter(email__in=PROTECTED_EMAILS)
        self.stdout.write(f'\n  Protected accounts (will NOT be deleted):')
        for u in protected:
            self.stdout.write(f'    - {u.email} ({u.first_name} {u.last_name})')

        # --- Perform or simulate delete ---
        if confirm:
            with transaction.atomic():
                test_wishlist.delete()
                test_order_items.delete()
                test_orders.delete()
                test_cart_items.delete()
                test_carts.delete()
                test_users.delete()

                if clean_orphan:
                    self._find_orphan_cart_items().delete()

            self.stdout.write(self.style.SUCCESS('\n  Deleted test data successfully.'))

            remaining = User.objects.all()
            self.stdout.write(f'\n  Remaining users: {remaining.count()}')
            for u in remaining:
                role = 'Admin' if (u.is_staff or u.is_superuser) else 'Seller' if u.is_seller else 'Customer'
                self.stdout.write(f'    - {u.email} [{role}]')
        else:
            self.stdout.write(self.style.WARNING('\n  Dry run only. No data was deleted.'))
            self.stdout.write(self.style.WARNING('  Run with --confirm to delete.'))

        self.stdout.write('')
