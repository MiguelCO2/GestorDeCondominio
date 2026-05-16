from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Announcement
from .serializers import AnnouncementSerializer

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-pinned', '-created_at')
    serializer_class = AnnouncementSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.pinned:
            Announcement.objects.exclude(pk=instance.pk).update(pinned=False)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.pinned:
            Announcement.objects.exclude(pk=instance.pk).update(pinned=False)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        announcements = Announcement.objects.all().order_by('-created_at')[:2]
        serializer = self.get_serializer(announcements, many=True)
        return Response(serializer.data)

# Create your views here.
