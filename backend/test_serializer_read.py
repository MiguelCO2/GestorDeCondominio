import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.properties.serializers import PropertySerializer
from apps.properties.models import Property
p = Property.objects.last()
print("Owner Data in Serializer Output:")
print(PropertySerializer(p).data.get('owner'))
