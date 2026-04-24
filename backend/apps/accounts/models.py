from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("super_admin", "Super Admin"),
        ("admin", "Administrador"),
        ("board", "Junta de Condominio"),
        ("resident", "Residente"),
        ("security", "Seguridad"),
        ("accountant", "Contador"),
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="resident")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email