from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Condominium
from .serializers import CondominiumSerializer


class CondominiumViewSet(viewsets.ModelViewSet):
    queryset = Condominium.objects.all().order_by("-created_at")
    serializer_class = CondominiumSerializer
    parser_classes = (MultiPartParser, FormParser)
