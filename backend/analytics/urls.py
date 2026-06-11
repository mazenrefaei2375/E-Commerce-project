from django.urls import path
from . import views

urlpatterns = [
    path('admin/analytics/', views.AdminDashboardView.as_view(), name='admin-analytics'),
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/categories/', views.AdminCategoryView.as_view(), name='admin-categories'),
    path('admin/categories/<int:pk>/', views.AdminCategoryDetailView.as_view(), name='admin-categories-detail'),
    path('admin/tags/', views.AdminTagView.as_view(), name='admin-tags'),
    path('admin/tags/<int:pk>/', views.AdminTagDetailView.as_view(), name='admin-tags-detail'),
]
