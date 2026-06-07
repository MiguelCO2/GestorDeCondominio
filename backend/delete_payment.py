import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payments.models import Payment

deleted, _ = Payment.objects.filter(residente_nombre__icontains='Luis artkgfk').delete()
print(f"Deleted {deleted} payments.")
