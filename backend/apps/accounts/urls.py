from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginAPIView,
    MeAPIView,
    RegisterAPIView,
    ProfileAPIView,
    VerifyEmailAPIView,
    VerifyEmailChangeAPIView,
    ResendEmailVerificationAPIView,
)


urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="login"),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("verify-email/", VerifyEmailAPIView.as_view(), name="verify_email"),
    path("resend-verification/", ResendEmailVerificationAPIView.as_view(), name="resend_verification"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("verify-email-change/", VerifyEmailChangeAPIView.as_view(), name="verify_email_change"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeAPIView.as_view(), name="me"),
]