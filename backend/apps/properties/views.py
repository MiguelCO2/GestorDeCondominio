from rest_framework import viewsets
from .models import Property
from .serializers import PropertySerializer
from apps.payments.models import Payment
from apps.residents.models import ResidentProfile

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.select_related("condominium", "owner", "tenant").all().order_by("-created_at")
    serializer_class = PropertySerializer

    def perform_destroy(self, instance):
        users_to_delete = []
        profiles = []
        
        if instance.owner:
            users_to_delete.append(instance.owner)
            if hasattr(instance.owner, 'resident_profile'):
                profiles.append(instance.owner.resident_profile)
                
        if instance.tenant:
            users_to_delete.append(instance.tenant)
            if hasattr(instance.tenant, 'resident_profile'):
                profiles.append(instance.tenant.resident_profile)
                
        if profiles:
            Payment.objects.filter(residente__in=profiles).delete()
            
        instance.delete()
        
        for u in users_to_delete:
            u.delete()
