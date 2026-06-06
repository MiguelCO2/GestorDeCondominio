from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminOrCreator

from .models import ResidentProfile
from .serializers import ResidentProfileSerializer


class ResidentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ResidentProfileSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAdminOrCreator()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ResidentProfile.objects.none()

        if user.role in ["super_admin", "admin", "board", "accountant"]:
            return ResidentProfile.objects.select_related(
                "user",
                "condominium",
                "property",
            ).all().order_by("-created_at")

        if user.role == "resident":
            from apps.properties.models import Property
            from django.db.models import Q
            
            profile = getattr(user, "resident_profile", None)
            prop = None
            if profile and profile.property_id:
                prop = profile.property
            else:
                prop = Property.objects.filter(Q(owner=user) | Q(tenant=user)).first()

            if prop:
                return ResidentProfile.objects.select_related(
                    "user",
                    "condominium",
                    "property",
                ).filter(property=prop).order_by("-created_at")
            return ResidentProfile.objects.none()

        return ResidentProfile.objects.none()

    def create(self, request, *args, **kwargs):
        payload = request.data.copy()

        if request.user.is_authenticated and not payload.get("user"):
            payload["user"] = request.user.id
        elif not request.user.is_authenticated and not payload.get("user"):
            return Response(
                {"user": ["Este campo es obligatorio cuando no hay autenticacion."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticacion requerida."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        profile = ResidentProfile.objects.select_related(
            "user",
            "condominium",
            "property",
        ).filter(user=request.user).first()
        if not profile:
            return Response(
                {"detail": "No existe perfil de residente para este usuario."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(profile)
        return Response(serializer.data)

