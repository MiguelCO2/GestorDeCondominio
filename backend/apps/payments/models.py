from django.db import models

# Create your models here.

class Payment(models.Model):
    # Tipos de pago
    TIPO_PAGO = [
        ('MENSUALIDAD', 'Mensualidad'),
        ('ABONO', 'Abono'),
    ]
    
    # Estados del pago
    ESTADO_PAGO = [
        ('COBRADO', 'Cobrado'),
        ('PENDIENTE', 'Pendiente'),
        ('MOROSO', 'Moroso'),
    ]

    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=20, choices=TIPO_PAGO)
    estado = models.CharField(max_length=20, choices=ESTADO_PAGO, default='PENDIENTE')
    descripcion = models.CharField(max_length=255)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    # Aquí iría tu ForeignKey conectando al residente o la propiedad
    # residente = models.ForeignKey('residents.Resident', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.tipo} - ${self.monto} ({self.estado})"