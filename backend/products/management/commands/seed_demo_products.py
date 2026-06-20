from django.core.management.base import BaseCommand
from users.models import User
from products.models import Category, Product
from django.utils.text import slugify


SELLER_EMAIL = 'seller1@nilemart.com'

CATEGORIES = [
    ('Electronics', 'Phones, headphones, watches, and tech accessories.'),
    ('Fashion', 'Clothes, shoes, and daily wear.'),
    ('Home & Kitchen', 'Home appliances and kitchen tools.'),
    ('Accessories', 'Bags, wallets, and lifestyle accessories.'),
    ('Beauty & Care', 'Skincare and personal care products.'),
    ('Sports & Fitness', 'Fitness equipment and sports items.'),
]

PRODUCTS = [
    ('Wireless Headphones', 'Electronics', 1200, 15, '/products/headphones.jpg',
     'Comfortable wireless headphones with clear sound and long battery life.'),
    ('Smart Watch', 'Electronics', 1800, 8, '/products/smart-watch.jpg',
     'A modern smart watch for fitness tracking, notifications, and daily use.'),
    ('Bluetooth Speaker', 'Electronics', 950, 12, '/products/speaker.jpg',
     'Portable Bluetooth speaker with strong sound and compact design.'),
    ("Men's Hoodie", 'Fashion', 750, 20, '/products/hoodie.jpg',
     'Soft and comfortable hoodie suitable for casual daily outfits.'),
    ('Running Sneakers', 'Fashion', 1600, 6, '/products/sneakers.jpg',
     'Lightweight running sneakers designed for comfort and daily movement.'),
    ('Leather Backpack', 'Accessories', 1100, 10, '/products/backpack.jpg',
     'Stylish leather backpack with practical storage for work or university.'),
    ('Coffee Maker', 'Home & Kitchen', 2200, 5, '/products/coffee-maker.jpg',
     'Easy-to-use coffee maker for preparing fresh coffee at home.'),
    ('Ceramic Mug Set', 'Home & Kitchen', 450, 25, '/products/mug-set.jpg',
     'Elegant ceramic mug set suitable for coffee, tea, and daily use.'),
    ('Skincare Set', 'Beauty & Care', 900, 14, '/products/skincare.jpg',
     'Complete skincare set for a simple and refreshing daily routine.'),
    ('Yoga Mat', 'Sports & Fitness', 500, 3, '/products/yoga-mat.jpg',
     'Comfortable yoga mat suitable for stretching, workouts, and home fitness.'),
]


class Command(BaseCommand):
    help = 'Seed demo products with local image paths, assigned to seller1@nilemart.com.'

    def handle(self, *args, **options):
        # --- Find or error on seller ---
        try:
            seller = User.objects.get(email=SELLER_EMAIL)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f'Seller {SELLER_EMAIL} does not exist. Please create it first from Admin Sellers page.'
            ))
            return

        # Ensure seller permissions
        updated_seller = False
        if not seller.is_seller:
            seller.is_seller = True
            updated_seller = True
        if not seller.seller_is_active:
            seller.seller_is_active = True
            updated_seller = True
        if not seller.can_add_products:
            seller.can_add_products = True
            updated_seller = True
        if not seller.is_active:
            seller.is_active = True
            updated_seller = True
        if updated_seller:
            seller.save()
            self.stdout.write(self.style.SUCCESS(f'Updated seller permissions for {SELLER_EMAIL}'))
        else:
            self.stdout.write(f'Found seller {SELLER_EMAIL} with correct permissions.')

        # --- Categories ---
        cat_created = 0
        cat_updated = 0
        cat_map = {}
        for name, desc in CATEGORIES:
            cat, created = Category.objects.get_or_create(name=name)
            if not cat.slug:
                cat.slug = slugify(name)
                cat.save()
            cat_map[name] = cat
            if created:
                cat_created += 1
            else:
                cat_updated += 1
        self.stdout.write(f'Categories: {cat_created} created, {cat_updated} updated.')

        # --- Products ---
        prod_created = 0
        prod_updated = 0
        for title, cat_name, price, stock, image, desc in PRODUCTS:
            category = cat_map[cat_name]
            defaults = {
                'category': category,
                'seller': seller,
                'price': price,
                'stock': stock,
                'image': image,
                'description': desc,
                'status': 'approved',
                'store_type': 'seller',
            }
            prod, created = Product.objects.update_or_create(
                title=title,
                defaults=defaults,
            )
            if not created and prod.slug:
                pass  # keep existing slug
            if created:
                prod_created += 1
            else:
                prod_updated += 1
        self.stdout.write(f'Products: {prod_created} created, {prod_updated} updated.')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {prod_created + prod_updated} demo products assigned to {SELLER_EMAIL}.'
        ))
        self.stdout.write('Login as seller1 to view them in Seller Dashboard.')
