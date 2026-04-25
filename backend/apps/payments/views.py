from django.http import JsonResponse
from django.db.models import Sum
from .models import Payment

# 1. FUNCIÓN PARA EL INICIO (Totales)
def dashboard_pagos(request):
    # Usamos aggregate(Sum) para sumar automáticamente los montos en la base de datos
    cobrado = Payment.objects.filter(estado='PAGADO').aggregate(Sum('monto'))['monto__sum'] or 0.00
    pendiente = Payment.objects.filter(estado='PENDIENTE').aggregate(Sum('monto'))['monto__sum'] or 0.00
    morosos = Payment.objects.filter(estado='MOROSO').aggregate(Sum('monto'))['monto__sum'] or 0.00

    datos = {
        'total_cobrado': cobrado,
        'total_pendiente': pendiente,
        'total_morosos': morosos
    }
    # Retornamos un JSON para que Expo lo lea fácilmente
    return JsonResponse(datos)


# 2. FUNCIÓN: Lista de TODOS los pagos
def lista_todos_pagos(request):
    # .values() convierte el QuerySet en una lista de diccionarios
    pagos = list(Payment.objects.all().values())
    return JsonResponse({'pagos': pagos}, safe=False)


# 3. FUNCIÓN: Lista de pagos de MENSUALIDADES
def lista_mensualidades(request):
    pagos = list(Payment.objects.filter(tipo='MENSUALIDAD').values())
    return JsonResponse({'pagos': pagos}, safe=False)


# 4. FUNCIÓN: Lista de ABONOS realizados
def lista_abonos(request):
    pagos = list(Payment.objects.filter(tipo='ABONO').values())
    return JsonResponse({'pagos': pagos}, safe=False)


# 5. FUNCIÓN: Lista de pagos PENDIENTES
def lista_pendientes(request):
    # Podemos incluir aquí a los morosos si quieres que salgan en la misma lista
    pagos = list(Payment.objects.filter(estado__in=['PENDIENTE', 'MOROSO']).values())
    return JsonResponse({'pagos': pagos}, safe=False)