from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import ActivationToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'confirm_password', 'mobile']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            mobile=validated_data.get('mobile', ''),
            is_active=False,
        )
        ActivationToken.objects.create(user=user)
        return user


class ActivateSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate(self, data):
        try:
            self.activation = ActivationToken.objects.get(token=data['token'])
        except ActivationToken.DoesNotExist:
            raise serializers.ValidationError({'token': 'Invalid activation token'})
        if not self.activation.is_valid():
            raise serializers.ValidationError({'token': 'Activation token has expired'})
        return data

    def save(self):
        user = self.activation.user
        user.is_active = True
        user.save()
        self.activation.delete()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('No user found with this email')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        try:
            self.activation = ActivationToken.objects.get(token=data['token'])
        except ActivationToken.DoesNotExist:
            raise serializers.ValidationError({'token': 'Invalid token'})
        if not self.activation.is_valid():
            raise serializers.ValidationError({'token': 'Token has expired'})
        return data

    def save(self):
        user = self.activation.user
        user.set_password(self.validated_data['password'])
        user.save()
        self.activation.delete()
        return user


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'mobile',
            'profile_pic', 'birthdate', 'city', 'country', 'is_seller',
            'date_joined'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'is_seller']
