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
