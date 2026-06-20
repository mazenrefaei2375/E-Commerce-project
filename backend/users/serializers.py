from rest_framework import serializers
from django.utils import timezone
from django.core.validators import RegexValidator
from .models import User


mobile_validator = RegexValidator(r'^[0-9]*$', 'Mobile number must contain digits only.')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    mobile = serializers.CharField(required=False, allow_blank=True, validators=[mobile_validator])

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'mobile', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data.pop('password'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            mobile=validated_data.get('mobile', ''),
            is_active=True,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    mobile = serializers.CharField(required=False, allow_blank=True, validators=[mobile_validator])

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'mobile',
            'address', 'birthdate', 'city', 'country', 'profile_picture',
            'is_staff', 'is_superuser', 'is_seller', 'seller_type',
            'can_add_products', 'seller_is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'date_joined']

    def validate_birthdate(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError('Birthdate cannot be in the future.')
        return value


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'mobile',
            'is_staff', 'is_superuser', 'is_seller', 'seller_type',
            'can_add_products', 'seller_is_active', 'is_active', 'date_joined',
        ]


class SellerCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'mobile',
            'password', 'confirm_password', 'seller_type', 'can_add_products', 'seller_is_active',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        seller_type = validated_data.pop('seller_type', 'basic')
        can_add_products = validated_data.pop('can_add_products', False)
        seller_is_active = validated_data.pop('seller_is_active', True)
        password = validated_data.pop('password')

        user = User.objects.create_user(
            **validated_data,
            password=password,
            is_seller=True,
            seller_type=seller_type,
            can_add_products=can_add_products,
            seller_is_active=seller_is_active,
            is_active=True,
        )
        return user


class SellerSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['seller_type', 'can_add_products', 'seller_is_active']
