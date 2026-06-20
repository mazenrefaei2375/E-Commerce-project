from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['email']
    list_display = ['email', 'first_name', 'last_name', 'mobile', 'is_seller', 'seller_type', 'is_active', 'is_staff']
    list_filter = ['is_seller', 'seller_type', 'is_active', 'is_staff']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'mobile', 'address', 'birthdate', 'city', 'country', 'profile_picture')}),
        ('Seller info', {'fields': ('is_seller', 'seller_type', 'can_add_products', 'seller_is_active')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'mobile', 'password1', 'password2'),
        }),
    )
    search_fields = ['email', 'first_name', 'last_name', 'mobile']
