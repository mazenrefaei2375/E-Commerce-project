from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('sellers/', views.AdminSellerListView.as_view(), name='admin-sellers'),
    path('sellers/create/', views.AdminSellerCreateView.as_view(), name='admin-seller-create'),
    path('users/<int:pk>/make-seller/', views.AdminMakeSellerView.as_view(), name='admin-make-seller'),
    path('users/<int:pk>/remove-seller/', views.AdminRemoveSellerView.as_view(), name='admin-remove-seller'),
    path('users/<int:pk>/seller-settings/', views.AdminSellerSettingsView.as_view(), name='admin-seller-settings'),
    path('users/<int:pk>/activate/', views.AdminUserActivateView.as_view(), name='admin-user-activate'),
    path('users/<int:pk>/deactivate/', views.AdminUserDeactivateView.as_view(), name='admin-user-deactivate'),
    path('products/', views.AdminProductListView.as_view(), name='admin-products'),
    path('products/create/', views.AdminProductCreateView.as_view(), name='admin-product-create'),
    path('products/<int:pk>/', views.AdminProductUpdateView.as_view(), name='admin-product-update'),
    path('products/<int:pk>/delete/', views.AdminProductDeleteView.as_view(), name='admin-product-delete'),
    path('products/<int:pk>/approve/', views.AdminProductApproveView.as_view(), name='admin-product-approve'),
    path('products/<int:pk>/reject/', views.AdminProductRejectView.as_view(), name='admin-product-reject'),
    path('products/<int:pk>/feature/', views.AdminProductFeatureView.as_view(), name='admin-product-feature'),
    path('categories/', views.AdminCategoryListView.as_view(), name='admin-categories'),
    path('orders/', views.AdminOrderListView.as_view(), name='admin-orders'),
    path('orders/<int:pk>/status/', views.AdminOrderStatusUpdateView.as_view(), name='admin-order-status'),
    path('dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('users/<int:pk>/delete/', views.AdminDeleteUserView.as_view(), name='admin-user-delete'),
]
