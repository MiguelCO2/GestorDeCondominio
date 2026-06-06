from rest_framework import viewsets
from .models import Property
from .serializers import PropertySerializer
from apps.payments.models import Payment
from apps.residents.models import ResidentProfile

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.select_related("condominium", "owner", "tenant").all().order_by("-created_at")
    serializer_class = PropertySerializer

    def perform_create(self, serializer):
        property_instance = serializer.save()
        
        # Create Condo Payment for Owner
        if property_instance.owner and property_instance.monthly_fee:
            resident_profile = ResidentProfile.objects.filter(user=property_instance.owner).first()
            Payment.objects.create(
                monto=property_instance.monthly_fee,
                tipo='MENSUALIDAD',
                estado='PENDIENTE',
                descripcion=f'Condominio - {property_instance.building} {property_instance.unit_number}',
                residente=resident_profile,
                residente_nombre=property_instance.owner.full_name or property_instance.owner.email,
                unidad=f'{property_instance.building} {property_instance.unit_number}'
            )
            
        # Create Rent Payment for Tenant
        if property_instance.tenant and property_instance.rent_fee:
            resident_profile = ResidentProfile.objects.filter(user=property_instance.tenant).first()
            Payment.objects.create(
                monto=property_instance.rent_fee,
                tipo='MENSUALIDAD',
                estado='PENDIENTE',
                descripcion=f'Alquiler - {property_instance.building} {property_instance.unit_number}',
                residente=resident_profile,
                residente_nombre=property_instance.tenant.full_name or property_instance.tenant.email,
                unidad=f'{property_instance.building} {property_instance.unit_number}'
            )
