from django.db import models


class Payment(models.Model):
    TIPO_PAGO = [
        ('MENSUALIDAD', 'Mensualidad'),
        ('ABONO', 'Abono'),
    ]

    ESTADO_PAGO = [
        ('COBRADO', 'Cobrado'),
        ('PENDIENTE', 'Pendiente'),
        ('MOROSO', 'Moroso'),
    ]

    METODO_PAGO = [
        ('TRANSFERENCIA', 'Transferencia'),
        ('PAGO_MOVIL', 'Pago Móvil'),
        ('EFECTIVO', 'Efectivo'),
    ]

    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=20, choices=TIPO_PAGO)
    estado = models.CharField(max_length=20, choices=ESTADO_PAGO, default='PENDIENTE')
    descripcion = models.CharField(max_length=255, blank=True, default='')
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODO_PAGO,
        default='TRANSFERENCIA',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    residente = models.ForeignKey(
        'residents.ResidentProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pagos',
    )
    residente_nombre = models.CharField(max_length=150, blank=True, default='')
    unidad = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f"{self.tipo} - ${self.monto} ({self.estado})"


class Expense(models.Model):
    CATEGORIAS = [
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('SEGURIDAD', 'Seguridad'),
        ('SERVICIOS', 'Servicios'),
        ('ADMINISTRACION', 'Administración'),
        ('OTROS', 'Otros'),
    ]

    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='OTROS')
    descripcion = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateField()
    torre = models.CharField(max_length=100)  # e.g. 'Torre A-1', 'Torre B-1'
    comprobante = models.FileField(upload_to='comprobantes/', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.categoria} - {self.descripcion} (${self.monto}) - {self.torre}"

