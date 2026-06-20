from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.SellerDashboardView.as_view(), name='seller-dashboard'),
    path('products/', views.SellerProductListView.as_view(), name='seller-products'),
    path('products/create/', views.SellerProductCreateView.as_view(), name='seller-product-create'),
    path('products/<int:pk>/', views.SellerProductUpdateView.as_view(), name='seller-product-update'),
    path('products/<int:pk>/delete/', views.SellerProductDeleteView.as_view(), name='seller-product-delete'),
    path('orders/', views.SellerOrderListView.as_view(), name='seller-orders'),
    path('order-items/<int:pk>/status/', views.SellerOrderItemStatusView.as_view(), name='seller-order-item-status'),
]
