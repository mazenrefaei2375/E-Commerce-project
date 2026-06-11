from rest_framework import serializers
from .models import Category, Brand, Tag, Product, ProductImage, Review


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'image']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'order']


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user_email', 'user_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['user']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    main_image = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    discount_price = serializers.DecimalField(
        source='discounted_price', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'price', 'discount', 'discount_price',
            'stock', 'category', 'category_name', 'brand', 'brand_name',
            'featured', 'average_rating', 'main_image', 'created_at'
        ]

    def get_main_image(self, obj):
        img = obj.images.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    seller_name = serializers.SerializerMethodField()
    discount_price = serializers.DecimalField(
        source='discounted_price', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'discount', 'discount_price',
            'stock', 'category', 'brand', 'tags', 'images', 'reviews',
            'seller', 'seller_name', 'status', 'featured',
            'average_rating', 'review_count', 'created_at', 'updated_at'
        ]

    def get_seller_name(self, obj):
        return f"{obj.seller.first_name} {obj.seller.last_name}"


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'title', 'description', 'price', 'stock', 'discount',
            'category', 'brand', 'tags'
        ]
