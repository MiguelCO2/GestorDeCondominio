from rest_framework.routers import DefaultRouter

from .views import ResidentProfileViewSet

router = DefaultRouter()
router.register(r"residents", ResidentProfileViewSet, basename="resident")

urlpatterns = router.urls
