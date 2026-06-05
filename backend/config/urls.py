from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/anuncios/', include('apps.announcements.urls')),
      path('api/', include('apps.announcements.urls')),
    path('api/pagos/', include('apps.payments.urls')),
    path("api/", include("apps.condominiums.urls")),
    path("api/", include("apps.properties.urls")),
    path("api/", include("apps.residents.urls")),
    path("api/pagos/", include("apps.payments.urls")),
    path("api/condominios/", include("apps.condominiums.urls")),
    path("api/residentes/", include("apps.residents.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path('api/visitas/', include('apps.visits.urls'))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
