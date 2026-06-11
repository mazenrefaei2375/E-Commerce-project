from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'brands', views.BrandViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('products/<int:product_pk>/images/', views.ProductImageViewSet.as_view(
        {'get': 'list', 'post': 'create'}
    ), name='product-images-list'),
    path('products/<int:product_pk>/images/<int:pk>/', views.ProductImageViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}
    ), name='product-images-detail'),
    path('products/<int:product_pk>/reviews/', views.ReviewViewSet.as_view(
        {'get': 'list', 'post': 'create'}
    ), name='product-reviews-list'),
    path('products/<int:product_pk>/reviews/<int:pk>/', views.ReviewViewSet.as_view(
        {'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}
    ), name='product-reviews-detail'),
]
