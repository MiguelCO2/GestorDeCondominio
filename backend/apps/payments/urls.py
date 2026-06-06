from django.urls import path
from . import views

urlpatterns = [
    path('resumen/', views.dashboard_pagos, name='resumen_pagos'),
    path('todos/', views.lista_todos_pagos, name='todos_pagos'),
    path('mensualidades/', views.lista_mensualidades, name='mensualidades'),
    path('abonos/', views.lista_abonos, name='abonos'),
    path('pendientes/', views.lista_pendientes, name='pendientes'),
    path('crear/', views.registrar_pago, name='crear_pago'),
    path('gastos/', views.lista_gastos, name='lista_gastos'),
    path('gastos/crear/', views.registrar_gasto, name='registrar_gasto'),
    path('gastos/editar/<int:pk>/', views.editar_gasto, name='editar_gasto'),
    path('resumen-torre/', views.resumen_torre, name='resumen_torre'),
]