from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from products.models import Product, Category
from orders.models import Order, OrderItem


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        today = timezone.now()
        last_month = today - timedelta(days=30)

        total_users = User.objects.count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(
            Q(status='delivered') | Q(status='shipped')
        ).aggregate(total=Sum('total'))['total'] or 0

        pending_products = Product.objects.filter(status='pending').count()
        recent_orders = Order.objects.filter(created_at__gte=last_month).count()
        recent_revenue = Order.objects.filter(
            Q(status='delivered') | Q(status='shipped'),
            created_at__gte=last_month
        ).aggregate(total=Sum('total'))['total'] or 0

        orders_by_status = Order.objects.values('status').annotate(count=Count('id'))
        top_products = OrderItem.objects.values(
            'product_title'
        ).annotate(
            sold=Sum('quantity')
        ).order_by('-sold')[:5]
        top_categories = Product.objects.values(
            'category__name'
        ).annotate(
            product_count=Count('id')
        ).order_by('-product_count')[:5]

        return Response({
            'total_users': total_users,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'pending_products': pending_products,
            'recent_orders': recent_orders,
            'recent_revenue': float(recent_revenue),
            'orders_by_status': list(orders_by_status),
            'top_products': list(top_products),
            'top_categories': list(top_categories),
        })
