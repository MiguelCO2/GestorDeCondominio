from datetime import timedelta
import random

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

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
    profile_image = models.ImageField(upload_to="profiles/", null=True, blank=True)

    email_verified = models.BooleanField(default=False)
    email_verification_code = models.CharField(max_length=6, blank=True)
    email_verification_expires_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def generate_email_verification_code(self):
        code = str(random.randint(100000, 999999))
        self.email_verification_code = code
        self.email_verification_expires_at = timezone.now() + timedelta(minutes=10)
        return code
    
    def is_email_verification_code_valid(self, code):
        if not self.email_verification_code:
            return False

        if not self.email_verification_expires_at:
            return False

        if timezone.now() > self.email_verification_expires_at:
            return False

        return self.email_verification_code == code

    def __str__(self):
        return self.email