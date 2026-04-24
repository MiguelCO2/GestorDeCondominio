from django.conf import settings
from django.db import models
from apps.condominiums.models import Condominium


class Property(models.Model):
    PROPERTY_TYPE_CHOICES = (
        ("apartment", "Apartamento"),
        ("house", "Casa"),
        ("commercial", "Local Comercial"),
    )

    STATUS_CHOICES = (
        ("occupied", "Ocupada"),
        ("vacant", "Vacía"),
        ("rented", "Alquilada"),
    )

    condominium = models.ForeignKey(
        Condominium,
        on_delete=models.CASCADE,
        related_name="properties",
    )
    property_type = models.CharField(max_length=30, choices=PROPERTY_TYPE_CHOICES)
    building = models.CharField(max_length=100, blank=True)
    floor = models.CharField(max_length=20, blank=True)
    unit_number = models.CharField(max_length=50)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="vacant")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_properties",
    )

    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rented_properties",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.condominium.name} - {self.unit_number}"