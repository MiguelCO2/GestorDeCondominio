import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.properties.models import Property
from apps.payments.models import Payment
from apps.residents.models import ResidentProfile
from django.contrib.auth import get_user_model

User = get_user_model()

print("Borrando todos los pagos...")
Payment.objects.all().delete()

print("Borrando todas las propiedades (residentes)...")
Property.objects.all().delete()

print("Borrando perfiles de residentes...")
ResidentProfile.objects.all().delete()

print("Borrando usuarios que no son superusuarios...")
User.objects.filter(is_superuser=False).delete()

print("¡Base de datos limpiada con éxito!")
