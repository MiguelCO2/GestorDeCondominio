from rest_framework import viewsets
from .models import Property
from .serializers import PropertySerializer
from apps.payments.models import Payment
from apps.residents.models import ResidentProfile

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.select_related("condominium", "owner", "tenant").all().order_by("-created_at")
    serializer_class = PropertySerializer
