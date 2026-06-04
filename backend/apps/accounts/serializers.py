import re

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
            "profile_image",
        )

class RegisterSerializer(serializers.ModelSerializer):
    
    username = serializers.CharField(
    validators=[],
    min_length=3,
    max_length=30,
    error_messages={
        "required":"El nombre de usuario es obligatorio.",
        "invalid": "Ingresa un nombre de usuario valido",
        "blank": "El correo electrónico no puede estar vacío.",
        "min_length": "El nombre de usuario debe tener al menos 3 caracteres.",
        "max_length": "El nombre de usuario no puede tener más de 30 caracteres.",
        }
    )

    email = serializers.EmailField(
    validators=[],
    error_messages={
        "required": "El correo electrónico es obligatorio.",
        "invalid": "Ingresa un correo electrónico válido.",
        "blank": "El correo electrónico no puede estar vacío.",
        }
    )

    phone = serializers.CharField(
        min_length=10,
        max_length=15,
        error_messages={
            "required": "El teléfono es obligatorio.",
            "blank": "El teléfono no puede estar vacío.",
            "min_length": "El teléfono debe tener al menos 10 dígitos.",
            "max_length": "El teléfono no puede tener más de 15 dígitos.",
        },
    )

    password = serializers.CharField(
        write_only=True,
        min_length=6,
        error_messages={
            "required": "La contraseña es obligatoria.",
            "blank": "La contraseña no puede estar vacía.",
            "min_length": "La contraseña debe tener al menos 6 caracteres.",
        },
    )

    password_confirm = serializers.CharField(
        write_only=True,
        min_length=6,
        error_messages={
            "required": "Debes confirmar la contraseña.",
            "blank": "La confirmación de contraseña no puede estar vacía.",
            "min_length": "La confirmación debe tener al menos 6 caracteres.",
        },
    )

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
                "Ingresa un número de teléfono válido. Debe tener entre 10 y 15 dígitos."
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
        
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError(
                "Ingresa un nombre de usuario válido. Solo puede contener letras, números y guion bajo."
            )

        return value

    def validate_role(self, value):
        allowed_public_roles = ["resident"]

        if value not in allowed_public_roles:
            raise serializers.ValidationError(
                "No puedes registrar usuarios con este rol desde la app."
            )

        return value

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if not re.search(r"[A-Z]", password):
            raise serializers.ValidationError({
                "password": "La contraseña debe contener al menos una letra mayúscula."
            })

        if not re.search(r"[^A-Za-z0-9]", password):
            raise serializers.ValidationError({
                "password": "La contraseña debe contener al menos un carácter especial."
            })

        if password != password_confirm:
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

class ProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False,
        validators=[],
        error_messages={
            "invalid": "Ingresa un correo electrónico válido.",
            "blank": "El correo electrónico no puede estar vacío.",
        },
    )

    full_name = serializers.CharField(
        required=False,
        max_length=150,
        error_messages={
            "blank": "El nombre completo no puede estar vacío.",
            "max_length": "El nombre completo no puede tener más de 150 caracteres.",
        },
    )

    phone = serializers.CharField(
        required=False,
        error_messages={
            "blank": "El teléfono no puede estar vacío.",
        },
    )

    profile_image = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = (
            "email",
            "full_name",
            "phone",
            "profile_image",
        )

    def validate_email(self, value):
        value = value.lower().strip()
        user = self.context["request"].user

        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado en otra cuenta.")

        return value

    def validate_phone(self, value):
        clean_phone = "".join(filter(str.isdigit, value))

        if len(clean_phone) < 10 or len(clean_phone) > 15:
            raise serializers.ValidationError(
                "Ingresa un número de teléfono válido. Debe tener entre 10 y 15 dígitos."
            )

        return clean_phone