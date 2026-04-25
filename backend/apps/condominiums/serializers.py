from rest_framework import serializers

from .models import Condominium


class CondominiumSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Condominium
        fields = [
            "id",
            "name",
            "address",
            "city",
            "country",
            "phone",
            "email",
            "logo",
            "logo_url",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "logo_url"]
        extra_kwargs = {
            "name": {"label": "Nombre"},
            "address": {"label": "Direccion"},
            "city": {"label": "Ciudad"},
            "country": {"label": "Pais"},
            "phone": {"label": "Telefono"},
            "email": {"label": "Correo electronico"},
            "logo": {"label": "Logo"},
        }

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request")
        if request is None:
            return obj.logo.url
        return request.build_absolute_uri(obj.logo.url)
