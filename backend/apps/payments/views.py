import json
from decimal import Decimal, InvalidOperation

from django.db.models import Sum
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from apps.residents.models import ResidentProfile

from .models import Payment

MESES_ES = (
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
)

TIPO_FRONT_TO_BACK = {
    'Mensualidad': 'MENSUALIDAD',
    'MENSUALIDAD': 'MENSUALIDAD',
    'Abono': 'ABONO',
    'ABONO': 'ABONO',
}

TIPO_BACK_TO_FRONT = {
    'MENSUALIDAD': 'Mensualidad',
    'ABONO': 'Abono',
}

METODO_FRONT_TO_BACK = {
    'Transferencia': 'TRANSFERENCIA',
    'TRANSFERENCIA': 'TRANSFERENCIA',
    'Pago Móvil': 'PAGO_MOVIL',
    'PAGO_MOVIL': 'PAGO_MOVIL',
    'Efectivo': 'EFECTIVO',
    'EFECTIVO': 'EFECTIVO',
}

METODO_BACK_TO_FRONT = {
    'TRANSFERENCIA': 'Transferencia',
    'PAGO_MOVIL': 'Pago Móvil',
    'EFECTIVO': 'Efectivo',
}


def _format_date_short(dt):
    if not dt:
        return ''
    local = dt
    if hasattr(dt, 'month'):
        return f"{local.day} {MESES_ES[local.month - 1]}"
    return str(dt)


def _resident_display(pago):
    if pago.residente_id and pago.residente:
        profile = pago.residente
        name = getattr(profile.user, 'full_name', None) or ''
        if not name:
            name = getattr(profile.user, 'email', '') or ''
        return name
    return pago.residente_nombre or ''


def _unit_display(pago):
    if pago.unidad:
        return pago.unidad
    if pago.residente_id and pago.residente and pago.residente.property_id:
        prop = pago.residente.property
        parts = [p for p in (prop.building, prop.unit_number) if p]
        return ' · '.join(parts) if parts else prop.unit_number
    return ''


def _status_front(estado):
    if estado == 'COBRADO':
        return 'completado'
    return 'pendiente'


def payment_to_dict(pago, include_legacy=True):
    data = {
        'id': pago.id,
        'resident': _resident_display(pago),
        'unit': _unit_display(pago),
        'amount': float(pago.monto),
        'date': _format_date_short(pago.fecha_creacion),
        'type': TIPO_BACK_TO_FRONT.get(pago.tipo, pago.tipo),
        'status': _status_front(pago.estado),
        'method': METODO_BACK_TO_FRONT.get(pago.metodo_pago, pago.metodo_pago),
    }
    if include_legacy:
        data.update({
            'monto': str(pago.monto),
            'tipo': pago.tipo,
            'estado': pago.estado,
            'descripcion': pago.descripcion,
            'metodo_pago': pago.metodo_pago,
            'fecha_creacion': pago.fecha_creacion.isoformat(),
            'residente_id': pago.residente_id,
            'residente_nombre': pago.residente_nombre,
            'unidad': pago.unidad,
        })
    return data


def _payments_queryset():
    return Payment.objects.select_related(
        'residente__user',
        'residente__property',
    ).order_by('-fecha_creacion')


def _pagos_response(queryset):
    return JsonResponse({
        'pagos': [payment_to_dict(p) for p in queryset],
    })


def dashboard_pagos(request):
    cobrado = Payment.objects.filter(estado='COBRADO').aggregate(Sum('monto'))['monto__sum'] or 0.00
    pendiente = Payment.objects.filter(estado='PENDIENTE').aggregate(Sum('monto'))['monto__sum'] or 0.00
    morosos = Payment.objects.filter(estado='MOROSO').aggregate(Sum('monto'))['monto__sum'] or 0.00

    datos = {
        'total_cobrado': float(cobrado),
        'total_pendiente': float(pendiente),
        'total_morosos': float(morosos),
        'cobrado': float(cobrado),
        'pendiente': float(pendiente),
        'moroso': float(morosos),
    }
    return JsonResponse(datos)


def lista_todos_pagos(request):
    return _pagos_response(_payments_queryset())


def lista_mensualidades(request):
    return _pagos_response(_payments_queryset().filter(tipo='MENSUALIDAD'))


def lista_abonos(request):
    return _pagos_response(_payments_queryset().filter(tipo='ABONO'))


def lista_pendientes(request):
    return _pagos_response(
        _payments_queryset().filter(estado__in=['PENDIENTE', 'MOROSO'])
    )


def _parse_body(request):
    if request.content_type and 'application/json' in request.content_type:
        try:
            return json.loads(request.body.decode('utf-8') or '{}')
        except json.JSONDecodeError:
            return None
    return request.POST.dict() if request.POST else {}


def _resolve_residente(body):
    residente_id = body.get('residente_id') or body.get('resident_id')
    if residente_id:
        try:
            return ResidentProfile.objects.select_related('user', 'property').get(
                pk=int(residente_id)
            )
        except (ResidentProfile.DoesNotExist, TypeError, ValueError):
            return None

    nombre = (body.get('resident') or body.get('residente') or body.get('residente_nombre') or '').strip()
    if not nombre:
        return None

    profile = (
        ResidentProfile.objects.select_related('user', 'property')
        .filter(user__full_name__iexact=nombre)
        .first()
    )
    if profile:
        return profile

    return (
        ResidentProfile.objects.select_related('user', 'property')
        .filter(user__email__iexact=nombre)
        .first()
    )


@csrf_exempt
@require_http_methods(['POST'])
def registrar_pago(request):
    body = _parse_body(request)
    if body is None:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    raw_amount = body.get('amount') if body.get('amount') is not None else body.get('monto')
    if raw_amount is None:
        return JsonResponse({'error': 'El monto es obligatorio'}, status=400)

    try:
        monto = Decimal(str(raw_amount).replace(',', '.'))
    except (InvalidOperation, TypeError):
        return JsonResponse({'error': 'Monto inválido'}, status=400)

    if monto <= 0:
        return JsonResponse({'error': 'El monto debe ser mayor a cero'}, status=400)

    raw_tipo = body.get('type') or body.get('tipo') or 'MENSUALIDAD'
    tipo = TIPO_FRONT_TO_BACK.get(raw_tipo)
    if not tipo:
        return JsonResponse({'error': 'Tipo de pago inválido'}, status=400)

    raw_metodo = body.get('method') or body.get('metodo') or body.get('metodo_pago') or 'Transferencia'
    metodo = METODO_FRONT_TO_BACK.get(raw_metodo)
    if not metodo:
        return JsonResponse({'error': 'Método de pago inválido'}, status=400)

    residente_nombre = (body.get('resident') or body.get('residente') or body.get('residente_nombre') or '').strip()
    if not residente_nombre:
        return JsonResponse({'error': 'El residente es obligatorio'}, status=400)

    profile = _resolve_residente(body)
    unidad = (body.get('unit') or body.get('unidad') or '').strip()
    if not unidad and profile and profile.property_id:
        prop = profile.property
        parts = [p for p in (prop.building, prop.unit_number) if p]
        unidad = ' · '.join(parts) if parts else prop.unit_number

    raw_estado = body.get('estado') or body.get('status')
    if raw_estado in ('completado', 'COBRADO', 'cobrado'):
        estado = 'COBRADO'
    elif raw_estado in ('moroso', 'MOROSO'):
        estado = 'MOROSO'
    elif raw_estado in ('pendiente', 'PENDIENTE'):
        estado = 'PENDIENTE'
    else:
        estado = 'COBRADO'

    descripcion = (body.get('descripcion') or body.get('description') or '').strip()
    if not descripcion:
        descripcion = f"{TIPO_BACK_TO_FRONT.get(tipo, tipo)} - {residente_nombre}"

    pago = Payment.objects.create(
        monto=monto,
        tipo=tipo,
        estado=estado,
        descripcion=descripcion,
        metodo_pago=metodo,
        residente=profile,
        residente_nombre=residente_nombre,
        unidad=unidad,
    )

    return JsonResponse({'pago': payment_to_dict(pago)}, status=201)
