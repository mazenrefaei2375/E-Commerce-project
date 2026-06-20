from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product_title', 'product_price', 'quantity', 'subtotal', 'seller_status']


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'status', 'total', 'shipping_fee', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'full_name', 'phone', 'address', 'city',
                  'country', 'payment_method', 'card_last4', 'total', 'shipping_fee', 'items', 'created_at']


class CheckoutSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=50)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)
    payment_method = serializers.CharField(max_length=50, default='cash')
    card_last4 = serializers.CharField(max_length=4, required=False, allow_blank=True, default='')
