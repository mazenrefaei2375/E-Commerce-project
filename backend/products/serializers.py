from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'title', 'slug', 'price', 'stock', 'image',
                  'category', 'category_name', 'created_at']


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'title', 'slug', 'description', 'price', 'stock',
                  'image', 'category', 'created_at', 'updated_at']


class ProductAdminSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_email = serializers.CharField(source='seller.email', read_only=True)
    store_type_display = serializers.CharField(source='get_store_type_display', read_only=True)
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'stock', 'image',
            'category', 'category_name', 'seller', 'seller_email',
            'status', 'is_featured', 'store_type', 'store_type_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['slug', 'seller', 'store_type', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Product
        fields = ['id', 'category', 'title', 'description', 'price', 'stock', 'image', 'seller', 'store_type', 'status']
        read_only_fields = ['id', 'seller', 'store_type', 'status']
