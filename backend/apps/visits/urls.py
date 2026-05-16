from django.urls import path
from . import views

urlpatterns = [
    # Esta es la URL que usarás en el useEffect de React Native
    path('api/pantalla-principal/', views.dashboard_visitas, name='dashboard_visitas'),
    
    # URLs para los botones de la app
    path('api/entrada/nueva/', views.registrar_entrada, name='registrar_entrada'),
    path('api/salida/<int:visita_id>/', views.registrar_salida, name='registrar_salida'),
]