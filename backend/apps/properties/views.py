from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminOrCreator
from .models import Property
from .serializers import PropertySerializer

class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminOrCreator()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Property.objects.none()

        if user.role in ["super_admin", "admin", "board", "security", "accountant"]:
            return Property.objects.select_related("condominium", "owner", "tenant").all().order_by("-created_at")

        if user.role == "resident":
            from django.db.models import Q
            profile = getattr(user, "resident_profile", None)
            
            q_filter = Q(owner=user) | Q(tenant=user)
            if profile and profile.property_id:
                q_filter |= Q(id=profile.property_id)
                
            return Property.objects.select_related("condominium", "owner", "tenant").filter(q_filter).distinct().order_by("-created_at")

        return Property.objects.none()

    def perform_destroy(self, instance):
        from apps.payments.models import Payment
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
