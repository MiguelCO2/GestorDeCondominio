from rest_framework.routers import DefaultRouter

from .views import CondominiumViewSet

router = DefaultRouter()
router.register(r"condominiums", CondominiumViewSet, basename="condominium")

urlpatterns = router.urls
