import re

from django.conf import settings
from django.core.mail import send_mail

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


def send_email_verification_code(user):
    code = user.generate_email_verification_code()
    user.save(update_fields=[
        "email_verification_code",
        "email_verification_expires_at",
    ])

    send_mail(
        subject="Código de verificación - Residencias Los Robles",
        message=(
            f"Hola {user.full_name or user.username},\n\n"
            f"Tu código de verificación es: {code}\n\n"
            "Este código vence en 10 minutos.\n\n"
            "Si no solicitaste este registro, puedes ignorar este mensaje."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

def send_email_change_code(user, new_email):
    code = user.generate_email_change_code(new_email)
    user.save(update_fields=[
        "pending_email",
        "email_change_code",
        "email_change_expires_at",
    ])

    send_mail(
        subject="Código para cambiar tu correo - Residencias Los Robles",
        message=(
            f"Hola {user.full_name or user.username},\n\n"
            f"Tu código para confirmar el cambio de correo es: {code}\n\n"
            "Este código vence en 10 minutos.\n\n"
            "Si no solicitaste este cambio, puedes ignorar este mensaje."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[new_email],
        fail_silently=False,
    )

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

class UserSuggestionSerializer(serializers.ModelSerializer):
    document_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "profile_image",
            "document_id",
        )

    def get_document_id(self, obj):
        try:
            if hasattr(obj, "resident_profile") and obj.resident_profile:
                return obj.resident_profile.document_id
        except Exception:
            pass

        return ""

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
        user.is_active = False
        user.email_verified = False
        user.save()

        send_email_verification_code(user)

        return user

class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get("email").lower().strip()
        code = attrs.get("code").strip()

        user = User.objects.filter(email=email).first()

        if not user:
            raise serializers.ValidationError({
                "email": "No existe una cuenta con este correo."
            })

        if user.email_verified and user.is_active:
            raise serializers.ValidationError({
                "detail": "Este correo ya fue verificado."
            })

        if not user.is_email_verification_code_valid(code):
            raise serializers.ValidationError({
                "code": "El código es inválido o ya venció."
            })

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]

        user.email_verified = True
        user.is_active = True
        user.email_verification_code = ""
        user.email_verification_expires_at = None
        user.save(update_fields=[
            "email_verified",
            "is_active",
            "email_verification_code",
            "email_verification_expires_at",
        ])

        return user

class ResendEmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()

        user = User.objects.filter(email=value).first()

        if not user:
            raise serializers.ValidationError("No existe una cuenta con este correo.")

        if user.email_verified and user.is_active:
            raise serializers.ValidationError("Este correo ya fue verificado.")

        self.user = user
        return value

    def save(self):
        send_email_verification_code(self.user)
        return self.user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email").lower().strip()
        password = attrs.get("password")

        user = User.objects.filter(email=email).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError({
                "detail": "Correo o contraseña incorrectos."
            })

        if not user.is_active:
            if not user.email_verified:
                raise serializers.ValidationError({
                    "detail": "Debes verificar tu correo electrónico antes de iniciar sesión."
                })

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
    
    def update(self, instance, validated_data):
        new_email = validated_data.pop("email", None)
        email_change_requested = False

        if new_email:
            new_email = new_email.lower().strip()

            if new_email != instance.email:
                if User.objects.exclude(id=instance.id).filter(email=new_email).exists():
                    raise serializers.ValidationError({
                        "email": "Este correo ya está registrado en otra cuenta."
                    })

                send_email_change_code(instance, new_email)
                email_change_requested = True

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        instance.email_change_requested = email_change_requested

        return instance

    def validate_phone(self, value):
        clean_phone = "".join(filter(str.isdigit, value))

        if len(clean_phone) < 10 or len(clean_phone) > 15:
            raise serializers.ValidationError(
                "Ingresa un número de teléfono válido. Debe tener entre 10 y 15 dígitos."
            )

        return clean_phone

class VerifyEmailChangeSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        user = self.context["request"].user
        code = attrs.get("code", "").strip()

        if not user.is_email_change_code_valid(code):
            raise serializers.ValidationError({
                "code": "El código es inválido o ya venció."
            })

        return attrs

    def save(self):
        user = self.context["request"].user

        user.email = user.pending_email
        user.pending_email = ""
        user.email_change_code = ""
        user.email_change_expires_at = None

        user.save(update_fields=[
            "email",
            "pending_email",
            "email_change_code",
            "email_change_expires_at",
        ])

        return user