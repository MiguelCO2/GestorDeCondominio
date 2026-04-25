from rest_framework import serializers

from .models import ResidentProfile


class ResidentProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(
        source="user.email",
        read_only=True,
        label="Correo del usuario",
    )
    user_full_name = serializers.CharField(
        source="user.full_name",
        read_only=True,
        label="Nombre completo del usuario",
    )
    condominium_name = serializers.CharField(
        source="condominium.name",
        read_only=True,
        label="Nombre del condominio",
    )
    property_unit_number = serializers.CharField(
        source="property.unit_number",
        read_only=True,
        label="Numero de unidad",
    )

    class Meta:
        model = ResidentProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_full_name",
            "condominium",
            "condominium_name",
            "property",
            "property_unit_number",
            "resident_type",
            "document_id",
            "emergency_contact",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "user": {"label": "Usuario", "required": False},
            "condominium": {"label": "Condominio"},
            "property": {"label": "Propiedad"},
            "resident_type": {"label": "Tipo de residente"},
            "document_id": {"label": "Documento de identidad"},
            "emergency_contact": {"label": "Contacto de emergencia"},
            "is_active": {"label": "Activo"},
            "created_at": {"label": "Fecha de creacion"},
        }
