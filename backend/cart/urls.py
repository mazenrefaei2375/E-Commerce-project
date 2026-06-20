from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/<int:item_id>/', views.CartItemUpdateView.as_view(), name='cart-item-update'),
    path('cart/items/<int:item_id>/delete/', views.CartItemDeleteView.as_view(), name='cart-item-delete'),
]
