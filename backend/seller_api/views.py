from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from products.models import Product
from products.serializers import ProductAdminSerializer, ProductCreateSerializer
from orders.models import OrderItem


class IsActiveSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_seller
            and request.user.seller_is_active
        )


class SellerProductListView(generics.ListAPIView):
    serializer_class = ProductAdminSerializer
    permission_classes = [IsActiveSeller]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)


class SellerProductCreateView(generics.CreateAPIView):
    serializer_class = ProductCreateSerializer
    permission_classes = [IsActiveSeller]

    def perform_create(self, serializer):
        if not self.request.user.can_add_products:
            self.permission_denied(self.request, message='You are not allowed to add products')
        status_val = 'approved' if self.request.user.seller_type == 'trusted' else 'pending'
        serializer.save(seller=self.request.user, store_type='seller', status=status_val)


class SellerProductUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProductAdminSerializer
    permission_classes = [IsActiveSeller]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)


class SellerProductDeleteView(generics.DestroyAPIView):
    permission_classes = [IsActiveSeller]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user)


class SellerDashboardView(APIView):
    permission_classes = [IsActiveSeller]

    def get(self, request):
        user = request.user
        products = Product.objects.filter(seller=user)

        total_products = products.count()
        active_products = products.filter(status='approved').count()
        pending_products = products.filter(status='pending').count()
        approved_products = products.filter(status='approved').count()
        rejected_products = products.filter(status='rejected').count()

        order_items = OrderItem.objects.filter(product__seller=user).select_related('order', 'product')

        total_units_sold = order_items.aggregate(total=Sum('quantity'))['total'] or 0
        total_revenue = order_items.aggregate(total=Sum('subtotal'))['total'] or 0
        total_orders = order_items.values('order').distinct().count()

        low_stock_products = products.filter(stock__lte=5, stock__gt=0).count()

        # Top products by units sold
        top_products_data = order_items.values(
            'product__id', 'product__title'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum('subtotal'),
        ).order_by('-units_sold')[:5]

        top_products = []
        for tp in top_products_data:
            prod = products.filter(id=tp['product__id']).first()
            top_products.append({
                'id': tp['product__id'],
                'title': tp['product__title'],
                'units_sold': tp['units_sold'],
                'revenue': str(tp['revenue']),
                'current_stock': prod.stock if prod else 0,
            })

        # Recent orders (last 10)
        recent_items = order_items.select_related('order', 'product').order_by('-order__created_at')[:10]
        recent_orders = []
        for item in recent_items:
            recent_orders.append({
                'order_id': item.order.id,
                'product_title': item.product_title,
                'quantity': item.quantity,
                'price': str(item.product_price),
                'subtotal': str(item.subtotal),
                'order_status': item.order.status,
                'created_at': item.order.created_at.isoformat(),
            })

        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'pending_products': pending_products,
            'approved_products': approved_products,
            'rejected_products': rejected_products,
            'total_units_sold': total_units_sold,
            'total_revenue': str(total_revenue),
            'total_orders': total_orders,
            'low_stock_products': low_stock_products,
            'top_products': top_products,
            'recent_orders': recent_orders,
        })


class SellerOrderListView(APIView):
    permission_classes = [IsActiveSeller]

    def get(self, request):
        user = request.user
        order_items = OrderItem.objects.filter(
            product__seller=user
        ).select_related('order', 'order__user', 'product').order_by('-order__created_at')

        orders_map = {}
        for item in order_items:
            oid = item.order.id
            if oid not in orders_map:
                orders_map[oid] = {
                    'order_id': oid,
                    'customer_name': item.order.full_name,
                    'customer_email': item.order.user.email,
                    'order_status': item.order.status,
                    'created_at': item.order.created_at.isoformat(),
                    'items': [],
                    'seller_subtotal': '0',
                }
            orders_map[oid]['items'].append({
                'id': item.id,
                'product_title': item.product_title,
                'quantity': item.quantity,
                'price': str(item.product_price),
                'subtotal': str(item.subtotal),
                'seller_status': item.seller_status,
            })
            current = float(orders_map[oid]['seller_subtotal'])
            orders_map[oid]['seller_subtotal'] = str(current + float(item.subtotal))

        return Response(list(orders_map.values()))


class SellerOrderItemStatusView(APIView):
    permission_classes = [IsActiveSeller]

    def patch(self, request, pk):
        item = get_object_or_404(OrderItem, pk=pk, product__seller=request.user)

        new_status = request.data.get('seller_status')
        valid_statuses = [c[0] for c in OrderItem.SELLER_STATUS_CHOICES]

        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.seller_status = new_status
        item.save()

        return Response({
            'id': item.id,
            'seller_status': item.seller_status,
        })
