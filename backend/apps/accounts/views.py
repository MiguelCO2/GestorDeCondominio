from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    UserSuggestionSerializer,
    ProfileUpdateSerializer,
    VerifyEmailSerializer,
    VerifyEmailChangeSerializer,
    ResendEmailVerificationSerializer,
)

import unicodedata


User = get_user_model()


def normalize_text(value):
    value = value or ""
    value = unicodedata.normalize("NFD", value)
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return value.lower().strip()

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta.",
                    "email": user.email,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            from rest_framework_simplejwt.tokens import RefreshToken

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Correo verificado correctamente.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailChangeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyEmailChangeSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Correo actualizado correctamente.",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendEmailVerificationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendEmailVerificationSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Te enviamos un nuevo código de verificación."
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserSuggestionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = normalize_text(request.query_params.get("q", ""))

        if len(query) < 2:
            return Response([], status=status.HTTP_200_OK)

        users = User.objects.filter(is_active=True).order_by("full_name", "username")

        matches = []
        for user in users:
            searchable = normalize_text(
                f"{user.full_name} {user.username} {user.email} {user.phone}"
            )

            if query in searchable:
                matches.append(user)

            if len(matches) >= 10:
                break

        serializer = UserSuggestionSerializer(matches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            user = serializer.save()

            response_data = UserSerializer(user).data

            if getattr(user, "email_change_requested", False):
                response_data["requires_email_verification"] = True
                response_data["pending_email"] = user.pending_email
                response_data["message"] = "Te enviamos un código para confirmar el nuevo correo."

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)