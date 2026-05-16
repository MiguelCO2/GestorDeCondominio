from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "full_name",
            "phone",
            "role",
            "is_active",
        )

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "full_name",
            "phone",
            "role",
            "password",
            "password_confirm",
        )

    def validate_phone(self, value):
        clean_phone = "".join(filter(str.isdigit, value))

        if len(clean_phone) < 10 or len(clean_phone) > 15:
            raise serializers.ValidationError(
                "Ingresa un número de teléfono válido."
            )

        return clean_phone

    def validate_email(self, value):
        value = value.lower().strip()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")

        return value

    def validate_username(self, value):
        value = value.strip()

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está registrado.")

        return value

    def validate_role(self, value):
        allowed_public_roles = ["resident"]

        if value not in allowed_public_roles:
            raise serializers.ValidationError(
                "No puedes registrar usuarios con este rol desde la app."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm": "Las contraseñas no coinciden."
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")

        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError({
                "detail": "Correo o contraseña incorrectos."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "detail": "Este usuario está desactivado."
            })

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }