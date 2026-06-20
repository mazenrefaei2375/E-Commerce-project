from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from products.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer, AddWishlistSerializer


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            return False
        return request.user.is_authenticated


class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related('product__category')


class WishlistAddView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = AddWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = get_object_or_404(Product, id=serializer.validated_data['product_id'])

        if product.status != 'approved':
            return Response(
                {'error': 'This product is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item, created = WishlistItem.objects.get_or_create(
            user=request.user, product=product
        )

        if not created:
            return Response(
                {'message': 'Product already in wishlist'},
                status=status.HTTP_200_OK
            )

        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)


class WishlistDeleteView(APIView):
    permission_classes = [IsCustomer]

    def delete(self, request, pk):
        item = get_object_or_404(WishlistItem, pk=pk, user=request.user)
        item.delete()
        return Response({'message': 'Removed from wishlist'}, status=status.HTTP_200_OK)
