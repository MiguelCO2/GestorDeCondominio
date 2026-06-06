import os, sys, django
sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User
from apps.payments.views import registrar_gasto
from django.core.files.uploadedfile import SimpleUploadedFile

# 1. Setup mock user
user = User.objects.filter(role='admin').first() or User.objects.first()
if not user:
    print("No users in DB, creating a test admin...")
    user = User.objects.create_superuser('admin_test@test.com', 'admin_test', 'admin123', role='admin')

print("Using User:", user.email, "Role:", user.role)

# 2. Test mock request for registrar_gasto (Multipart)
rf = APIRequestFactory()
image_data = b'x\x9c\x00\x01\x00\xfe\xff\x00\x00\x00\x00\x00\x00\x00\x00' # Dummy image bytes
mock_file = SimpleUploadedFile('receipt.jpg', image_data, content_type='image/jpeg')

data = {
    'categoria': 'MANTENIMIENTO',
    'descripcion': 'Reparación de ascensor test',
    'monto': '150.00',
    'fecha': '2026-06-06',
    'torre': 'Torre A-1',
    'comprobante': mock_file
}

request = rf.post('/api/pagos/gastos/registrar/', data, format='multipart')
force_authenticate(request, user=user)

try:
    response = registrar_gasto(request)
    print("registrar_gasto Response Status:", response.status_code)
    print("registrar_gasto Response Data:", response.content.decode('utf-8'))
except Exception as e:
    import traceback
    print("registrar_gasto failed!")
    traceback.print_exc()
