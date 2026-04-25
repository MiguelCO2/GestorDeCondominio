from django.db import models


class Condominium(models.Model):
    name = models.CharField("Nombre", max_length=150)
    address = models.TextField("Direccion", blank=True)
    city = models.CharField("Ciudad", max_length=100, blank=True)
    country = models.CharField("Pais", max_length=100, blank=True)
    phone = models.CharField("Telefono", max_length=30, blank=True)
    email = models.EmailField("Correo electronico", blank=True)
    logo = models.ImageField(
        "Logo",
        upload_to="condominiums/logos/",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Condominio"
        verbose_name_plural = "Condominios"