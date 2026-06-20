from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import models
from users.models import User
from users.serializers import (
    AdminUserListSerializer, SellerCreateSerializer, SellerSettingsSerializer, UserSerializer,
)
from products.models import Product, Category
from products.serializers import ProductAdminSerializer, ProductCreateSerializer, CategorySerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdmin]


class AdminSellerListView(generics.ListAPIView):
    queryset = User.objects.filter(is_seller=True).order_by('-date_joined')
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdmin]


class AdminSellerCreateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response(
                {'email': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing = User.objects.filter(email__iexact=email).first()

        # Case 5: Admin/staff cannot be converted to seller
        if existing and (existing.is_staff or existing.is_superuser):
            return Response(
                {'error': 'Admin accounts cannot be converted to sellers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Case 4: Already an active seller
        if existing and existing.is_seller:
            return Response(
                {'error': 'This user is already a seller.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Case 2 & 3: Existing customer or former seller
        if existing:
            serializer = SellerCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            data.pop('confirm_password', None)

            was_seller_before = existing.is_seller or existing.can_add_products or existing.seller_is_active

            existing.first_name = data.get('first_name', existing.first_name)
            existing.last_name = data.get('last_name', existing.last_name)
            if data.get('mobile'):
                existing.mobile = data['mobile']
            if data.get('password'):
                existing.set_password(data['password'])

            existing.is_seller = True
            existing.seller_type = data.get('seller_type', 'basic')
            existing.can_add_products = data.get('can_add_products', False)
            existing.seller_is_active = data.get('seller_is_active', True)
            existing.save()

            return Response({
                'message': 'Existing user set as seller.',
                'user': AdminUserListSerializer(existing).data,
            }, status=status.HTTP_200_OK)

        # Case 1: New email, create fresh account
        serializer = SellerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Seller account created.',
            'user': AdminUserListSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminMakeSellerView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_seller = True
        user.seller_type = 'basic'
        user.can_add_products = False
        user.seller_is_active = True
        user.save()
        return Response(AdminUserListSerializer(user).data)


class AdminRemoveSellerView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_seller = False
        user.can_add_products = False
        user.seller_is_active = False
        user.save()
        return Response(AdminUserListSerializer(user).data)


class AdminSellerSettingsView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = SellerSettingsSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminUserListSerializer(user).data)


class AdminUserActivateView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_active = True
        user.save()
        return Response(AdminUserListSerializer(user).data)


class AdminUserDeactivateView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot deactivate your own admin account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_staff or user.is_superuser:
            active_admins = User.objects.filter(
                is_active=True
            ).filter(
                models.Q(is_staff=True) | models.Q(is_superuser=True)
            ).count()

            if active_admins <= 1:
                return Response(
                    {'error': 'You cannot deactivate the last active admin account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        user.is_active = False
        user.save()
        return Response(AdminUserListSerializer(user).data)


class AdminProductListView(generics.ListAPIView):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductAdminSerializer
    permission_classes = [IsAdmin]


class AdminProductCreateView(generics.CreateAPIView):
    serializer_class = ProductCreateSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        serializer.save(seller=None, store_type='admin', status='approved')


class AdminProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductAdminSerializer
    permission_classes = [IsAdmin]


class AdminProductDeleteView(generics.DestroyAPIView):
    queryset = Product.objects.all()
    permission_classes = [IsAdmin]


class AdminProductApproveView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.status = 'approved'
        product.save()
        return Response(ProductAdminSerializer(product).data)


class AdminProductRejectView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.status = 'rejected'
        product.save()
        return Response(ProductAdminSerializer(product).data)


class AdminProductFeatureView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.is_featured = not product.is_featured
        product.save()
        return Response(ProductAdminSerializer(product).data)


class AdminCategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]


class AdminOrderListView(generics.ListAPIView):
    from orders.models import Order
    from orders.serializers import OrderDetailSerializer
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAdmin]


class AdminOrderStatusUpdateView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        from orders.models import Order
        from orders.serializers import OrderDetailSerializer

        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()
        return Response(OrderDetailSerializer(order).data)


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from orders.models import Order, OrderItem
        from wishlist.models import WishlistItem
        from django.db.models import Sum

        total_users = User.objects.count()
        total_customers = User.objects.filter(is_staff=False, is_superuser=False, is_seller=False).count()
        total_sellers = User.objects.filter(is_seller=True).count()
        total_products = Product.objects.count()
        approved_products = Product.objects.filter(status='approved').count()
        pending_products = Product.objects.filter(status='pending').count()
        rejected_products = Product.objects.filter(status='rejected').count()
        total_orders = Order.objects.count()
        total_revenue = Order.objects.aggregate(total=Sum('total'))['total'] or 0
        shipping_revenue = Order.objects.aggregate(total=Sum('shipping_fee'))['total'] or 0
        low_stock_products = Product.objects.filter(stock__lte=5, stock__gt=0).count()

        net_revenue = Order.objects.filter(status='delivered').aggregate(total=Sum('total'))['total'] or 0

        # Top selling products
        top_data = OrderItem.objects.values(
            'product__id', 'product__title'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum('subtotal'),
        ).order_by('-units_sold')[:5]

        top_products = []
        for tp in top_data:
            prod = Product.objects.filter(id=tp['product__id']).first()
            top_products.append({
                'id': tp['product__id'],
                'title': tp['product__title'],
                'units_sold': tp['units_sold'],
                'revenue': str(tp['revenue']),
                'current_stock': prod.stock if prod else 0,
            })

        # Recent orders
        recent = Order.objects.select_related('user').order_by('-created_at')[:10]
        recent_orders = []
        for o in recent:
            recent_orders.append({
                'id': o.id,
                'customer_name': o.full_name,
                'customer_email': o.user.email,
                'status': o.status,
                'total': str(o.total),
                'created_at': o.created_at.isoformat(),
            })

        return Response({
            'total_users': total_users,
            'total_customers': total_customers,
            'total_sellers': total_sellers,
            'total_products': total_products,
            'approved_products': approved_products,
            'pending_products': pending_products,
            'rejected_products': rejected_products,
            'total_orders': total_orders,
            'total_revenue': str(total_revenue),
            'shipping_revenue': str(shipping_revenue),
            'low_stock_products': low_stock_products,
            'net_revenue': str(net_revenue),
            'top_products': top_products,
            'recent_orders': recent_orders,
        })


class AdminDeleteUserView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_staff or user.is_superuser:
            active_admins = User.objects.filter(
                is_active=True
            ).filter(
                models.Q(is_staff=True) | models.Q(is_superuser=True)
            ).count()

            if active_admins <= 1:
                return Response(
                    {'error': 'You cannot delete the last active admin account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {'error': 'Admin accounts cannot be deleted. Deactivate the account instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.delete()
        return Response({'message': 'User deleted successfully.'})
