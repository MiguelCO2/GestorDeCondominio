import json
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsPorterOrAdminOrCreator
from .models import Visita

# 1. Alimentar la pantalla completa de Expo
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPorterOrAdminOrCreator])
def dashboard_visitas(request):
    hoy = timezone.now().date()
    
    # Filtramos solo las visitas del día actual
    visitas_hoy = Visita.objects.filter(hora_entrada__date=hoy)
    
    # Calculamos los contadores superiores
    total_hoy = visitas_hoy.count()
    activas_count = visitas_hoy.filter(activa=True).count()

    # Separamos las listas y las ordenamos por hora
    visitas_activas = list(visitas_hoy.filter(activa=True).order_by('-hora_entrada').values())
    visitas_completadas = list(visitas_hoy.filter(activa=False).order_by('-hora_salida').values())

    # Empaquetamos todo tal cual lo necesita tu diseño
    datos = {
        "contadores": {
            "activas": activas_count,
            "hoy": total_hoy
        },
        "lista_activas": visitas_activas,
        "lista_completadas": visitas_completadas
    }
    
    return JsonResponse(datos)

# 2. Registrar cuando alguien entra
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPorterOrAdminOrCreator])
def registrar_entrada(request):
    data = json.loads(request.body)
    nueva_visita = Visita.objects.create(
        nombre_visitante=data['nombre_visitante'],
        motivo=data.get('motivo', 'Visita social'),
        placa_vehiculo=data.get('placa_vehiculo', ''),
        nombre_residente=data['nombre_residente'],
        apartamento_destino=data['apartamento_destino']
    )
    return JsonResponse({"mensaje": "Entrada registrada", "id": nueva_visita.id}, status=201)

# 3. Registrar cuando alguien sale
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPorterOrAdminOrCreator])
def registrar_salida(request, visita_id):
    try:
        visita = Visita.objects.get(id=visita_id)
        if not visita.activa:
            return JsonResponse({"error": "La visita ya salió previamente"}, status=400)
        
        visita.activa = False
        visita.hora_salida = timezone.now()
        visita.save()
        return JsonResponse({"mensaje": "Salida registrada correctamente"})
    except Visita.DoesNotExist:
        return JsonResponse({"error": "Visita no encontrada"}, status=404)