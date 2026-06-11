from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, OrderItem
from cart.models import Cart
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    OrderCreateSerializer, OrderStatusSerializer
)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        items = cart.items.select_related('product').all()
        if not items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        for item in items:
            if item.quantity > item.product.stock:
                return Response(
                    {'error': f'Not enough stock for {item.product.title}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        total = sum(item.subtotal for item in items)
        order = Order.objects.create(
            user=request.user,
            shipping_address=serializer.validated_data['shipping_address'],
            shipping_city=serializer.validated_data['shipping_city'],
            shipping_country=serializer.validated_data['shipping_country'],
            total=total,
        )

        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_title=item.product.title,
                price=item.product.discounted_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            item.product.stock -= item.quantity
            item.product.save()

        items.delete()
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


class SellerOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_seller:
            return Order.objects.none()
        seller_products = self.request.user.products.values_list('id', flat=True)
        order_ids = OrderItem.objects.filter(
            product_id__in=seller_products
        ).values_list('order_id', flat=True).distinct()
        return Order.objects.filter(id__in=order_ids)


class SellerOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        if not request.user.is_seller and not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.is_seller and not request.user.is_staff:
            seller_product_ids = request.user.products.values_list('id', flat=True)
            has_item = order.items.filter(product_id__in=seller_product_ids).exists()
            if not has_item:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data['status']
        order.save()
        return Response(OrderDetailSerializer(order).data)
