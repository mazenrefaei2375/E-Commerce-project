from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from .models import Category, Brand, Tag, Product, ProductImage, Review
from .serializers import (
    CategorySerializer, BrandSerializer, TagSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer, ProductImageSerializer, ReviewSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(status='approved')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'tags']
    search_fields = ['title', 'description', 'tags__name', 'brand__name']
    ordering_fields = ['price', 'created_at', 'average_rating']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.filter(status='approved')
        # Seller sees all their own products (including pending/rejected)
        if self.action in ['update', 'partial_update', 'destroy'] or \
           self.request.query_params.get('seller') == 'me':
            if self.request.user.is_authenticated:
                return Product.objects.filter(seller=self.request.user)
            return Product.objects.none()
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def update(self, request, *args, **kwargs):
        product = self.get_object()
        if product.seller != request.user:
            return Response(
                {'error': 'You can only edit your own products'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if product.seller != request.user:
            return Response(
                {'error': 'You can only delete your own products'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='my-products')
    def my_products(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        products = Product.objects.filter(seller=request.user)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        products = Product.objects.filter(featured=True, status='approved')[:10]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        products = Product.objects.filter(status='approved').order_by('-created_at')[:10]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='best-sellers')
    def best_sellers(self, request):
        products = Product.objects.filter(status='approved').annotate(
            sold=Count('orderitem')
        ).filter(sold__gt=0).order_by('-sold')[:10]
        if not products:
            products = Product.objects.filter(status='approved')[:10]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='related')
    def related(self, request, pk=None):
        product = self.get_object()
        related = Product.objects.filter(
            status='approved', category=product.category
        ).exclude(id=product.id)[:4]
        if related.count() < 4:
            brand_related = Product.objects.filter(
                status='approved', brand=product.brand
            ).exclude(id=product.id).exclude(id__in=related.values_list('id', flat=True))
            related = list(related) + list(brand_related[:4 - len(related)])
        serializer = ProductListSerializer(related, many=True, context={'request': request})
        return Response(serializer.data)


class ProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        return ProductImage.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = Product.objects.get(pk=product_id)
        if product.seller != self.request.user:
            raise permissions.PermissionDenied()
        serializer.save(product=product)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        return Review.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = Product.objects.get(pk=product_id)
        if Review.objects.filter(product=product, user=self.request.user).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'You have already reviewed this product'})
        serializer.save(product=product)
