import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.properties.serializers import PropertySerializer
data = {
    'unit_number': 'Apto 1-A',
    'owner': {
        'email': 'test3@test.com',
        'full_name': 'Test User',
        'document_id': '123456'
    }
}
s = PropertySerializer(data=data)
print("Is Valid:", s.is_valid())
print("Errors:", s.errors)
print("Validated Data Owner:", s.validated_data.get('owner'))
