from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Property
from apps.condominiums.models import Condominium

User = get_user_model()

class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone']
        extra_kwargs = {
            'email': {'validators': []}, # Remove unique validator for nested updates
        }

class PropertySerializer(serializers.ModelSerializer):
    owner = UserNestedSerializer(required=False, allow_null=True)
    tenant = UserNestedSerializer(required=False, allow_null=True)
    condominium = serializers.PrimaryKeyRelatedField(
        queryset=Condominium.objects.all(),
        required=False,
        allow_null=True
    )
    property_type = serializers.CharField(required=False)

    class Meta:
        model = Property
        fields = [
            'id', 'condominium', 'property_type', 'building', 'floor', 'unit_number',
            'status', 'owner', 'tenant', 'monthly_fee', 'owner_start_date', 'tenant_start_date',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def _handle_user_data(self, user_data, instance=None):
        if not user_data:
            return None
            
        email = user_data.get('email')
        if not email:
            return None
            
        user = None
        if instance:
            user = instance
            
        if not user:
            user = User.objects.filter(email=email).first()
            
        if user:
            # Update existing user
            if 'full_name' in user_data:
                user.full_name = user_data['full_name']
            if 'phone' in user_data:
                user.phone = user_data['phone']
            user.save()
            return user
        else:
            # Create new user
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            return User.objects.create(
                username=username,
                email=email,
                full_name=user_data.get('full_name', ''),
                phone=user_data.get('phone', '')
            )

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
            
        owner = self._handle_user_data(owner_data)
        tenant = self._handle_user_data(tenant_data)
        
        property_instance = Property.objects.create(
            owner=owner,
            tenant=tenant,
            **validated_data
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
                instance.owner = self._handle_user_data(owner_data, instance.owner)

        # Handle tenant
        if 'tenant' in validated_data:
            tenant_data = validated_data.pop('tenant')
            if not tenant_data:
                instance.tenant = None
                instance.tenant_start_date = None
            else:
                instance.tenant = self._handle_user_data(tenant_data, instance.tenant)
        
        # Handle simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
                
        instance.save()
        return instance
