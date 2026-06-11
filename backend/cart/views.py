from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Cart, CartItem
from products.models import Product
from .serializers import CartSerializer, CartItemSerializer


def get_or_create_cart(request):
    """Get cart for authenticated user or guest session."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart
    session_id = request.headers.get('X-Session-ID')
    if session_id:
        try:
            return Cart.objects.get(session_id=session_id, user__isnull=True)
        except Cart.DoesNotExist:
            pass
    return Cart.objects.create(user=None)


class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer

    def get_object(self):
        return get_or_create_cart(self.request)


class CartItemAddView(APIView):
    def post(self, request):
        cart = get_or_create_cart(request)
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(pk=product_id, status='approved')
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if quantity > product.stock:
            return Response({'error': f'Only {product.stock} items in stock'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            item.quantity = min(item.quantity + quantity, product.stock)
            item.save()

        cart.refresh_from_db()
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartItemUpdateView(APIView):
    def put(self, request, pk):
        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(pk=pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(request.data.get('quantity', item.quantity))
        if quantity < 1:
            return Response({'error': 'Quantity must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity > item.product.stock:
            return Response({'error': f'Only {item.product.stock} items in stock'}, status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.save()
        cart.refresh_from_db()
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, pk):
        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(pk=pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        cart.refresh_from_db()
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartMergeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            guest_cart = Cart.objects.get(session_id=session_id, user__isnull=True)
        except Cart.DoesNotExist:
            return Response({'message': 'No guest cart to merge'})

        user_cart, _ = Cart.objects.get_or_create(user=request.user)

        for item in guest_cart.items.all():
            user_item, created = CartItem.objects.get_or_create(
                cart=user_cart, product=item.product,
                defaults={'quantity': item.quantity}
            )
            if not created:
                user_item.quantity = min(
                    user_item.quantity + item.quantity,
                    item.product.stock
                )
                user_item.save()

        guest_cart.delete()
        return Response(CartSerializer(user_cart, context={'request': request}).data)
