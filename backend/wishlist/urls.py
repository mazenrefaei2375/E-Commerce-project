from django.urls import path
from . import views

urlpatterns = [
    path('', views.WishlistListView.as_view(), name='wishlist-list'),
    path('add/', views.WishlistAddView.as_view(), name='wishlist-add'),
    path('<int:pk>/delete/', views.WishlistDeleteView.as_view(), name='wishlist-delete'),
]
