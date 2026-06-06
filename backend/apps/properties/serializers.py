from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Property
from apps.condominiums.models import Condominium
from apps.residents.models import ResidentProfile
from apps.payments.models import Payment
from django.utils import timezone

User = get_user_model()

class UserNestedSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    document_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'email',
            'phone',
            'profile_image',
            'document_id',
        ]
        extra_kwargs = {
            'username': {'validators': []},
            'email': {'validators': []},
        }

    def get_document_id(self, obj):
        try:
            profile = getattr(obj, 'resident_profile', None)
            if profile:
                return profile.document_id or ''
        except Exception:
            pass

        return ''

class PropertySerializer(serializers.ModelSerializer):
    owner = UserNestedSerializer(required=False, allow_null=True)
    tenant = UserNestedSerializer(required=False, allow_null=True)
    condominium = serializers.PrimaryKeyRelatedField(
        queryset=Condominium.objects.all(),
        required=False,
        allow_null=True
    )
    property_type = serializers.CharField(required=False)

    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'condominium', 'property_type', 'building', 'floor', 'unit_number',
            'status', 'payment_status', 'owner', 'tenant', 'monthly_fee', 'rent_fee', 'owner_start_date', 'tenant_start_date',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'payment_status']

    def get_payment_status(self, obj):
        profiles = []
        if obj.owner and hasattr(obj.owner, 'resident_profile'):
            profiles.append(obj.owner.resident_profile)
        if obj.tenant and hasattr(obj.tenant, 'resident_profile'):
            profiles.append(obj.tenant.resident_profile)
            
        if not profiles:
            return 'al-dia'
            
        payments = Payment.objects.filter(residente__in=profiles)
        
        if payments.filter(estado='MOROSO').exists():
            return 'moroso'
        if payments.filter(estado='PENDIENTE').exists():
            return 'pendiente'
            
        return 'al-dia'

    def _handle_user_data(self, user_data, instance=None, resident_type="owner"):
        if not user_data:
            return None

        email = user_data.get('email')
        if not email:
            return None

        user = instance if instance else None

        if not user:
            user = User.objects.filter(email=email).first()

        if not user:
            raise serializers.ValidationError({
                resident_type: "El usuario indicado no existe en la tabla de cuentas. Debes seleccionar un usuario registrado."
            })

        username = user_data.get('username', '').strip()
        full_name = user_data.get('full_name', '').strip()
        phone = user_data.get('phone', '').strip()

        if username and username != user.username:
            raise serializers.ValidationError({
                resident_type: "El nombre de usuario no coincide con el correo seleccionado."
            })

        if full_name and full_name != user.full_name:
            raise serializers.ValidationError({
                resident_type: "El nombre completo no coincide con el usuario seleccionado."
            })

        if phone and phone != user.phone:
            raise serializers.ValidationError({
                resident_type: "El teléfono no coincide con el usuario seleccionado."
            })

        document_id = ''
        profile, created = ResidentProfile.objects.get_or_create(
            user=user,
            defaults={
                'resident_type': resident_type,
                'document_id': document_id,
                'condominium_id': 1
            }
        )

        if not created and document_id:
            profile.document_id = document_id
            profile.save()

        return user

    @transaction.atomic
    def create(self, validated_data):
        owner_data = validated_data.pop('owner', None)
        tenant_data = validated_data.pop('tenant', None)
        
        # If no condominium provided, use the first one
        if 'condominium' not in validated_data or not validated_data['condominium']:
            condo = Condominium.objects.first()
            if not condo:
                condo = Condominium.objects.create(name="Condominio Principal")
            validated_data['condominium'] = condo
            
        # Defaults for unit
        if 'property_type' not in validated_data:
            validated_data['property_type'] = 'apartment'
            
        owner = self._handle_user_data(owner_data, resident_type="owner")
        tenant = self._handle_user_data(tenant_data, resident_type="tenant")
        
        property_instance = Property.objects.create(
            owner=owner,
            tenant=tenant,
            **validated_data
        )

        today = timezone.localdate()

        if owner and property_instance.monthly_fee:
            profile = ResidentProfile.objects.filter(user=owner).first()
            if profile:
                Payment.objects.create(
                    monto=property_instance.monthly_fee,
                    tipo='MENSUALIDAD',
                    estado='PENDIENTE',
                    descripcion=f'Condominio - {property_instance.building} {property_instance.unit_number} - Mes {today.month}',
                    residente=profile,
                    residente_nombre=owner.full_name or owner.email,
                    unidad=f'{property_instance.building} {property_instance.unit_number}'
                )

        if tenant and property_instance.rent_fee:
            profile = ResidentProfile.objects.filter(user=tenant).first()
            if profile:
                Payment.objects.create(
                    monto=property_instance.rent_fee,
                    tipo='MENSUALIDAD',
                    estado='PENDIENTE',
                    descripcion=f'Alquiler - {property_instance.building} {property_instance.unit_number} - Mes {today.month}',
                    residente=profile,
                    residente_nombre=tenant.full_name or tenant.email,
                    unidad=f'{property_instance.building} {property_instance.unit_number}'
                )

        return property_instance

    @transaction.atomic
    def update(self, instance, validated_data):
        # Handle owner
        if 'owner' in validated_data:
            owner_data = validated_data.pop('owner')
            if not owner_data:
                instance.owner = None
            else:
                instance.owner = self._handle_user_data(owner_data, instance.owner, resident_type="owner")

        # Handle tenant
        if 'tenant' in validated_data:
            tenant_data = validated_data.pop('tenant')
            if not tenant_data:
                instance.tenant = None
                instance.tenant_start_date = None
            else:
                instance.tenant = self._handle_user_data(tenant_data, instance.tenant, resident_type="tenant")
        
        # Handle simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
                
        instance.save()
        return instance
