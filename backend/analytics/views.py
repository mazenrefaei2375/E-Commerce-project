from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, generics
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from products.models import Product, Category, Brand, Tag
from orders.models import Order, OrderItem
from orders.serializers import OrderListSerializer


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


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Order.objects.all().order_by('-created_at')


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

    def get(self, request):
        users = self.get_queryset()[:100]
        data = [{
            'id': u.id, 'email': u.email, 'first_name': u.first_name,
            'last_name': u.last_name, 'is_seller': u.is_seller,
            'is_active': u.is_active, 'is_staff': u.is_staff,
            'date_joined': u.date_joined,
        } for u in users]
        return Response(data)


class AdminCategoryView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Category.objects.all()

    def get(self, request):
        cats = Category.objects.all()
        data = [{'id': c.id, 'name': c.name} for c in cats]
        return Response(data)

    def post(self, request):
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Name required'}, status=400)
        cat = Category.objects.create(name=name)
        return Response({'id': cat.id, 'name': cat.name}, status=201)


class AdminCategoryDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, pk):
        Category.objects.filter(pk=pk).delete()
        return Response(status=204)


class AdminTagView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        tags = Tag.objects.all()
        data = [{'id': t.id, 'name': t.name} for t in tags]
        return Response(data)

    def post(self, request):
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Name required'}, status=400)
        tag = Tag.objects.create(name=name)
        return Response({'id': tag.id, 'name': tag.name}, status=201)


class AdminTagDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, pk):
        Tag.objects.filter(pk=pk).delete()
        return Response(status=204)
