from django.conf import settings
from django.db import models
from apps.condominiums.models import Condominium
from apps.properties.models import Property


class ResidentProfile(models.Model):
    RESIDENT_TYPE_CHOICES = (
        ("owner", "Propietario"),
        ("tenant", "Arrendatario"),
        ("family_member", "Familiar"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        verbose_name="Usuario",
        on_delete=models.CASCADE,
        related_name="resident_profile",
    )
    condominium = models.ForeignKey(
        Condominium,
        verbose_name="Condominio",
        on_delete=models.CASCADE,
        related_name="residents",
    )
    property = models.ForeignKey(
        Property,
        verbose_name="Propiedad",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="residents",
    )
    resident_type = models.CharField(
        "Tipo de residente",
        max_length=30,
        choices=RESIDENT_TYPE_CHOICES,
    )
    document_id = models.CharField("Documento de identidad", max_length=50, blank=True)
    emergency_contact = models.CharField("Contacto de emergencia", max_length=150, blank=True)
    is_active = models.BooleanField("Activo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.email

    class Meta:
        verbose_name = "Perfil de residente"
        verbose_name_plural = "Perfiles de residentes"