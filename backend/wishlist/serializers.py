from rest_framework import serializers
from products.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'created_at']


class AddWishlistSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
