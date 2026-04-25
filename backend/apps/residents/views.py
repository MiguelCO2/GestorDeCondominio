from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ResidentProfile
from .serializers import ResidentProfileSerializer


class ResidentProfileViewSet(viewsets.ModelViewSet):
    queryset = ResidentProfile.objects.select_related(
        "user",
        "condominium",
        "property",
    ).all().order_by("-created_at")
    serializer_class = ResidentProfileSerializer

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

        profile = self.get_queryset().filter(user=request.user).first()
        if not profile:
            return Response(
                {"detail": "No existe perfil de residente para este usuario."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(profile)
        return Response(serializer.data)
