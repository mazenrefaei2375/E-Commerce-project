from django.urls import path
from . import views

urlpatterns = [
    path('admin/analytics/', views.AdminDashboardView.as_view(), name='admin-analytics'),
]
