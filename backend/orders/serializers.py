from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_title', 'price', 'quantity', 'subtotal']


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'status', 'total', 'items_count', 'created_at', 'updated_at']

    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user_email', 'shipping_address', 'shipping_city',
            'shipping_country', 'status', 'total', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField()
    shipping_country = serializers.CharField()


class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
