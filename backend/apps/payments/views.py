import json
from decimal import Decimal, InvalidOperation
from datetime import datetime, date

from django.db.models import Sum, Q
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from apps.residents.models import ResidentProfile
from apps.properties.models import Property

from .models import Payment, Expense

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


def get_resident_property(profile):
    if not profile:
        return None
    if getattr(profile, 'property', None):
        return profile.property
    return Property.objects.filter(Q(owner=profile.user) | Q(tenant=profile.user)).first()


def _unit_display(pago):
    if pago.unidad:
        return pago.unidad
    if pago.residente_id and pago.residente:
        prop = get_resident_property(pago.residente)
        if prop:
            parts = [p for p in (prop.building, prop.unit_number) if p]
            return ' · '.join(parts) if parts else prop.unit_number
    return ''


def _status_front(estado):
    if estado == 'COBRADO':
        return 'completado'
    return 'pendiente'


def payment_to_dict(pago, include_legacy=True):
    document_id = ''
    building = ''
    floor = ''
    unit_number = ''
    
    if pago.residente:
        document_id = pago.residente.document_id or ''
        
        user = pago.residente.user
        prop = None
        if user:
            prop = user.owned_properties.first() or user.rented_properties.first()
            
        if not prop and pago.residente.property_id:
            prop = pago.residente.property
            
        if prop:
            building = prop.building or ''
            floor = prop.floor or ''
            unit_number = prop.unit_number or ''
            
    if not building and pago.unidad:
        # Intentar extraer "Torre X" de pago.unidad si existe
        u_str = pago.unidad
        if "Torre" in u_str:
            parts = u_str.split("Apto", 1)
            if len(parts) == 2:
                building = parts[0].strip()
                unit_number = "Apto" + parts[1]
            else:
                unit_number = u_str
        else:
            unit_number = u_str

    # Intentar extraer el mes de la descripción (ej: "Mes 6")
    month_name = MESES_ES[pago.fecha_creacion.month - 1]
    
    import re
    match = re.search(r'Mes (\d+)', pago.descripcion or '')
    if match:
        try:
            m_idx = int(match.group(1))
            if 1 <= m_idx <= 12:
                month_name = MESES_ES[m_idx - 1]
        except ValueError:
            pass

    due_date = f"09 {month_name} {pago.fecha_creacion.year}"
    payment_date = _format_date_short(pago.fecha_creacion) if pago.estado == 'COBRADO' else ''

    data = {
        'id': pago.id,
        'resident': _resident_display(pago),
        'document_id': document_id,
        'building': building,
        'floor': floor,
        'unit_number': unit_number,
        'unit': _unit_display(pago),
        'amount': float(pago.monto),
        'date': _format_date_short(pago.fecha_creacion),
        'type': TIPO_BACK_TO_FRONT.get(pago.tipo, pago.tipo),
        'status': _status_front(pago.estado),
        'method': METODO_BACK_TO_FRONT.get(pago.metodo_pago, pago.metodo_pago),
        'month': month_name,
        'due_date': due_date,
        'payment_date': payment_date,
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
    cobrado = Payment.objects.filter(estado='COBRADO').aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    pendiente = Payment.objects.filter(estado='PENDIENTE').aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    morosos = Payment.objects.filter(estado='MOROSO').aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

    # Consolidated stats for current month and year
    today = timezone.now().date()
    income_month = Payment.objects.filter(
        estado='COBRADO',
        fecha_creacion__month=today.month,
        fecha_creacion__year=today.year
    ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

    expense_month = Expense.objects.filter(
        fecha__month=today.month,
        fecha__year=today.year
    ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

    expense_all_time = Expense.objects.aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    balance = cobrado - expense_all_time

    # Collection rate calculation: cobrado / (cobrado + pendiente + morosos) for the current month
    cobrado_m = Payment.objects.filter(estado='COBRADO', fecha_creacion__month=today.month, fecha_creacion__year=today.year).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    pendiente_m = Payment.objects.filter(estado='PENDIENTE', fecha_creacion__month=today.month, fecha_creacion__year=today.year).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    morosos_m = Payment.objects.filter(estado='MOROSO', fecha_creacion__month=today.month, fecha_creacion__year=today.year).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    
    total_m = cobrado_m + pendiente_m + morosos_m
    collection_rate = int((cobrado_m / total_m) * 100) if total_m > 0 else 100

    # Count and amount of unpaid/overdue residents (all time in state MOROSO)
    overdue_qs = Payment.objects.filter(estado='MOROSO')
    overdue_count = overdue_qs.values('residente', 'residente_nombre').distinct().count()
    overdue_amount = overdue_qs.aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

    # Trends of the last 6 months
    income_trend = []
    expense_trend = []
    
    months_list = []
    curr_year = today.year
    curr_month = today.month
    for _ in range(6):
        months_list.insert(0, (curr_year, curr_month))
        curr_month -= 1
        if curr_month == 0:
            curr_month = 12
            curr_year -= 1

    for yr, mo in months_list:
        inc_sum = Payment.objects.filter(
            estado='COBRADO',
            fecha_creacion__year=yr,
            fecha_creacion__month=mo
        ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        
        exp_sum = Expense.objects.filter(
            fecha__year=yr,
            fecha__month=mo
        ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        
        income_trend.append(float(inc_sum))
        expense_trend.append(float(exp_sum))

    total_residents = ResidentProfile.objects.filter(is_active=True).count()
    occupied_units = Property.objects.filter(Q(owner__isnull=False) | Q(tenant__isnull=False)).count()

    datos = {
        'total_cobrado': float(cobrado),
        'total_pendiente': float(pendiente),
        'total_morosos': float(morosos),
        'cobrado': float(cobrado),
        'pendiente': float(pendiente),
        'moroso': float(morosos),
        'balance': float(balance),
        'incomeMonth': float(income_month),
        'expenseMonth': float(expense_month),
        'overdue': overdue_count,
        'overdueAmount': float(overdue_amount),
        'collectionRate': collection_rate,
        'incomeTrend': income_trend,
        'expenseTrend': expense_trend,
        'totalResidents': total_residents,
        'occupiedUnits': occupied_units,
    }
    return JsonResponse(datos)


def lista_morosos(request):
    # Get all unpaid payments in state MOROSO
    unpaid = Payment.objects.filter(estado='MOROSO').select_related(
        'residente__user',
        'residente__property'
    ).order_by('-fecha_creacion')
    
    # Group by resident name or resident profile id
    groups = {}
    for p in unpaid:
        key = p.residente_id if p.residente_id else p.residente_nombre
        if not key:
            continue
        if key not in groups:
            groups[key] = {
                'name': _resident_display(p),
                'unit': _unit_display(p) or p.unidad or 'Sin Unidad',
                'payments': [],
            }
        groups[key]['payments'].append(p)
        
    # Now build the Debtor objects
    debtors_list = []
    import hashlib
    for idx, (key, info) in enumerate(groups.items(), start=1):
        payments = info['payments']
        total_amount = sum(float(p.monto) for p in payments)
        months_count = len(payments)
        
        # Find the last payment of this resident that is COBRADO
        last_payment_date_str = 'Sin pagos'
        res_id = key if isinstance(key, int) else None
        res_name = key if isinstance(key, str) else None
        
        last_cobrado = None
        if res_id:
            last_cobrado = Payment.objects.filter(residente_id=res_id, estado='COBRADO').order_by('-fecha_creacion').first()
        elif res_name:
            last_cobrado = Payment.objects.filter(residente_nombre__iexact=res_name, estado='COBRADO').order_by('-fecha_creacion').first()
            
        if last_cobrado:
            last_payment_date_str = _format_date_short(last_cobrado.fecha_creacion)
            
        # Severity based on months count
        if months_count >= 4:
            severity = 'critica'
        elif months_count >= 3:
            severity = 'alta'
        elif months_count >= 2:
            severity = 'media'
        else:
            severity = 'baja'
            
        # Initials for avatar
        name = info['name']
        parts = [p for p in name.split() if p]
        avatar = ''.join(p[0].upper() for p in parts[:2]) if parts else 'R'
        
        # Color hash based on name
        h = int(hashlib.md5(name.encode('utf-8')).hexdigest(), 16)
        colors_palette = ['#ea580c', '#7c3aed', '#b91c1c', '#0d9488', '#2563eb', '#16a34a']
        color = colors_palette[h % len(colors_palette)]
        
        debtors_list.append({
            'id': res_id or idx,
            'name': name,
            'unit': info['unit'],
            'months': months_count,
            'amount': total_amount,
            'lastPayment': last_payment_date_str,
            'avatar': avatar,
            'color': color,
            'severity': severity,
        })
        
    return JsonResponse({'debtors': debtors_list})


def expense_to_dict(gasto):
    return {
        'id': gasto.id,
        'categoria': gasto.categoria,
        'categoria_display': gasto.get_categoria_display(),
        'descripcion': gasto.descripcion,
        'monto': float(gasto.monto),
        'fecha': gasto.fecha.strftime('%Y-%m-%d') if gasto.fecha else '',
        'torre': gasto.torre,
        'comprobante': gasto.comprobante.url if gasto.comprobante else None,
        'fecha_creacion': gasto.fecha_creacion.isoformat() if gasto.fecha_creacion else '',
    }


def lista_gastos(request):
    qs = Expense.objects.all().order_by('-fecha', '-fecha_creacion')
    
    torre = request.GET.get('torre')
    if torre and torre.upper() != 'TODOS':
        qs = qs.filter(torre__iexact=torre)
        
    categoria = request.GET.get('categoria')
    if categoria:
        qs = qs.filter(categoria__iexact=categoria)
        
    mes = request.GET.get('mes')
    if mes:
        try:
            qs = qs.filter(fecha__month=int(mes))
        except ValueError:
            pass
            
    ano = request.GET.get('ano') or request.GET.get('year')
    if ano:
        try:
            qs = qs.filter(fecha__year=int(ano))
        except ValueError:
            pass
            
    return JsonResponse({
        'gastos': [expense_to_dict(g) for g in qs]
    })


@csrf_exempt
@require_http_methods(['POST'])
def registrar_gasto(request):
    body = _parse_body(request) or {}
    
    categoria = body.get('categoria', 'OTROS').upper()
    valid_choices = [choice[0] for choice in Expense.CATEGORIAS]
    if categoria not in valid_choices:
        categoria = 'OTROS'
        
    descripcion = body.get('descripcion', '').strip()
    if not descripcion:
        return JsonResponse({'error': 'La descripción es obligatoria'}, status=400)
        
    raw_amount = body.get('monto') if body.get('monto') is not None else body.get('amount')
    if raw_amount is None:
        return JsonResponse({'error': 'El monto es obligatorio'}, status=400)
    try:
        monto = Decimal(str(raw_amount).replace(',', '.'))
    except (InvalidOperation, TypeError):
        return JsonResponse({'error': 'Monto inválido'}, status=400)
        
    if monto <= 0:
        return JsonResponse({'error': 'El monto debe ser mayor a cero'}, status=400)
        
    raw_fecha = body.get('fecha') or body.get('date')
    if not raw_fecha:
        return JsonResponse({'error': 'La fecha es obligatoria'}, status=400)
        
    try:
        fecha = datetime.strptime(raw_fecha.split('T')[0], '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Fecha inválida. Debe ser YYYY-MM-DD'}, status=400)
        
    torre = body.get('torre', '').strip()
    if not torre:
        return JsonResponse({'error': 'La torre asociada es obligatoria'}, status=400)
        
    comprobante = request.FILES.get('comprobante')
    
    gasto = Expense.objects.create(
        categoria=categoria,
        descripcion=descripcion,
        monto=monto,
        fecha=fecha,
        torre=torre,
        comprobante=comprobante
    )
    
    return JsonResponse({'gasto': expense_to_dict(gasto)}, status=201)


@csrf_exempt
@require_http_methods(['POST', 'PUT'])
def editar_gasto(request, pk):
    try:
        gasto = Expense.objects.get(pk=pk)
    except Expense.DoesNotExist:
        return JsonResponse({'error': 'El gasto no existe'}, status=404)
        
    body = _parse_body(request) or {}
    
    if 'categoria' in body:
        categoria = body.get('categoria').upper()
        valid_choices = [choice[0] for choice in Expense.CATEGORIAS]
        if categoria in valid_choices:
            gasto.categoria = categoria
            
    if 'descripcion' in body:
        descripcion = body.get('descripcion').strip()
        if descripcion:
            gasto.descripcion = descripcion
            
    raw_amount = body.get('monto') if body.get('monto') is not None else body.get('amount')
    if raw_amount is not None:
        try:
            monto = Decimal(str(raw_amount).replace(',', '.'))
            if monto > 0:
                gasto.monto = monto
        except (InvalidOperation, TypeError):
            return JsonResponse({'error': 'Monto inválido'}, status=400)
            
    raw_fecha = body.get('fecha') or body.get('date')
    if raw_fecha:
        try:
            gasto.fecha = datetime.strptime(raw_fecha.split('T')[0], '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'error': 'Fecha inválida. Debe ser YYYY-MM-DD'}, status=400)
            
    if 'torre' in body:
        torre = body.get('torre').strip()
        if torre:
            gasto.torre = torre
            
    if 'comprobante' in request.FILES:
        gasto.comprobante = request.FILES.get('comprobante')
    elif 'comprobante' in body and (body.get('comprobante') == 'null' or body.get('comprobante') is None):
        gasto.comprobante = None
        
    gasto.save()
    return JsonResponse({'gasto': expense_to_dict(gasto)})


def resumen_torre(request):
    torre = request.GET.get('torre')
    if not torre:
        return JsonResponse({'error': 'La torre es obligatoria'}, status=400)
        
    now = timezone.now()
    try:
        mes = int(request.GET.get('mes', now.month))
        ano = int(request.GET.get('ano') or request.GET.get('year') or now.year)
    except ValueError:
        return JsonResponse({'error': 'Periodo inválido'}, status=400)
        
    if torre.upper() == 'TODOS':
        base_payments = Payment.objects.all()
        base_expenses = Expense.objects.all()
    else:
        # Resolve properties associated with this building to find their users
        property_users = Property.objects.filter(building__iexact=torre).values_list('owner_id', 'tenant_id')
        user_ids = set()
        for owner_id, tenant_id in property_users:
            if owner_id: user_ids.add(owner_id)
            if tenant_id: user_ids.add(tenant_id)
            
        base_payments = Payment.objects.filter(
            Q(residente__user_id__in=user_ids) | Q(unidad__icontains=torre)
        )
        base_expenses = Expense.objects.filter(torre__iexact=torre)
    
    ingresos_mes = base_payments.filter(
        estado='COBRADO',
        fecha_creacion__month=mes,
        fecha_creacion__year=ano
    ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    
    gastos_mes = base_expenses.filter(
        fecha__month=mes,
        fecha__year=ano
    ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    
    # Available balance (all-time total income - all-time total expenses for this tower)
    ingresos_totales = base_payments.filter(estado='COBRADO').aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    gastos_totales = base_expenses.aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
    
    balance_disponible = ingresos_totales - gastos_totales
    
    return JsonResponse({
        'torre': torre,
        'mes': mes,
        'ano': ano,
        'ingresos_mes': float(ingresos_mes),
        'gastos_mes': float(gastos_mes),
        'balance_disponible': float(balance_disponible),
    })


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
    if not unidad and profile:
        prop = get_resident_property(profile)
        if prop:
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
