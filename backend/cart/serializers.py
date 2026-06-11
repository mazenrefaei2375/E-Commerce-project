from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(source='product.discounted_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock = serializers.IntegerField(source='product.stock', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_title', 'product_price',
            'discounted_price', 'product_image', 'quantity', 'subtotal', 'stock'
        ]

    def get_product_image(self, obj):
        img = obj.product.images.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1')
        return value

    def validate(self, data):
        product = data.get('product')
        if self.instance:
            product = product or self.instance.product
        if product and data.get('quantity', self.instance.quantity if self.instance else 1) > product.stock:
            raise serializers.ValidationError({'quantity': f'Only {product.stock} items in stock'})
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'updated_at']
