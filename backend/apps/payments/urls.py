from django.urls import path
from . import views

urlpatterns = [
    path('resumen/', views.dashboard_pagos, name='resumen_pagos'),
    path('todos/', views.lista_todos_pagos, name='todos_pagos'),
    path('mensualidades/', views.lista_mensualidades, name='mensualidades'),
    path('abonos/', views.lista_abonos, name='abonos'),
    path('pendientes/', views.lista_pendientes, name='pendientes'),
]