from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/', views.CartItemAddView.as_view(), name='cart-add-item'),
    path('cart/items/<int:pk>/', views.CartItemUpdateView.as_view(), name='cart-update-item'),
    path('cart/merge/', views.CartMergeView.as_view(), name='cart-merge'),
]
