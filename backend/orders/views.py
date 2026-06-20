from django.db import transaction
from decimal import Decimal
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from cart.models import Cart
from .models import Order, OrderItem
from .serializers import (
    CheckoutSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
)


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            return False
        return request.user.is_authenticated


class CheckoutView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            items_total = 0
            order_items = []

            for cart_item in cart.items.select_related('product'):
                product = cart_item.product
                if cart_item.quantity > product.stock:
                    return Response(
                        {'error': f'Not enough stock for {product.title}. Available: {product.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                subtotal = product.price * cart_item.quantity
                items_total += subtotal

                order_items.append(OrderItem(
                    product=product,
                    product_title=product.title,
                    product_price=product.price,
                    quantity=cart_item.quantity,
                    subtotal=subtotal,
                ))

            shipping_fee = Decimal('20.00')
            total = items_total + shipping_fee

            order = Order.objects.create(
                user=request.user,
                full_name=serializer.validated_data['full_name'],
                phone=serializer.validated_data['phone'],
                address=serializer.validated_data['address'],
                city=serializer.validated_data['city'],
                country=serializer.validated_data['country'],
                payment_method=serializer.validated_data.get('payment_method', 'cash'),
                card_last4=serializer.validated_data.get('card_last4', '')[:4],
                shipping_fee=shipping_fee,
                total=total,
            )

            for item in order_items:
                item.order = order
                item.product.stock -= item.quantity
                item.product.save()

            OrderItem.objects.bulk_create(order_items)
            cart.items.all().delete()

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


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
