from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'seller', 'price', 'stock', 'status', 'is_featured', 'created_at']
    list_filter = ['category', 'status', 'is_featured']
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
