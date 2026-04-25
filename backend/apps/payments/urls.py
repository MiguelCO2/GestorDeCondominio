from django.urls import path
from . import views

urlpatterns = [
    path('api/resumen/', views.dashboard_pagos, name='resumen_pagos'),
    path('api/todos/', views.lista_todos_pagos, name='todos_pagos'),
    path('api/mensualidades/', views.lista_mensualidades, name='mensualidades'),
    path('api/abonos/', views.lista_abonos, name='abonos'),
    path('api/pendientes/', views.lista_pendientes, name='pendientes'),
]