import uuid
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import ActivationToken
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, ActivateSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    ProfileSerializer,
)

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send activation email (console backend)
        activation = ActivationToken.objects.filter(user=user).first()
        activation_url = f"http://localhost:5173/activate/{activation.token}/"
        send_mail(
            subject='Activate your account',
            message=f'Click the link to activate your account (valid 24h): {activation_url}',
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@ecommerce.com',
            recipient_list=[user.email],
        )
        print(f"\n=== ACTIVATION LINK ===\n{activation_url}\n======================\n")

        return Response(
            {'message': 'Account created. Check your email for the activation link.'},
            status=status.HTTP_201_CREATED
        )


class ActivateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Account activated successfully'})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account not activated. Please check your email.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = get_tokens_for_user(user)
        return Response({
            'tokens': tokens,
            'user': ProfileSerializer(user).data,
        })


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user

        activation, _ = ActivationToken.objects.get_or_create(
            user=user,
            defaults={'token': uuid.uuid4()}
        )
        if not activation.is_valid():
            activation.delete()
            activation = ActivationToken.objects.create(user=user)

        reset_url = f"http://localhost:5173/password-reset/confirm/{activation.token}/"
        send_mail(
            subject='Password Reset',
            message=f'Click the link to reset your password (valid 24h): {reset_url}',
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@ecommerce.com',
            recipient_list=[user.email],
        )
        print(f"\n=== PASSWORD RESET LINK ===\n{reset_url}\n============================\n")

        return Response({'message': 'Password reset link sent to your email'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password reset successfully'})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
