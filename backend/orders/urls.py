from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('orders/seller/', views.SellerOrderListView.as_view(), name='seller-orders'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', views.SellerOrderStatusView.as_view(), name='order-status'),
]
