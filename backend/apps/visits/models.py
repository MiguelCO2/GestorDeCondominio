from django.db import models
from django.utils import timezone

class Visita(models.Model):
    # Tipos de motivo basados en tu diseño
    MOTIVOS = [
        ('Visita social', 'Visita social'),
        ('Delivery', 'Delivery'),
        ('Servicio técnico', 'Servicio técnico'),
        ('Otros', 'Otros'),
    ]

    nombre_visitante = models.CharField(max_length=150)
    motivo = models.CharField(max_length=50, choices=MOTIVOS, default='Visita social')
    placa_vehiculo = models.CharField(max_length=20, blank=True, null=True) # Opcional
    
    # En un sistema completo, esto sería una ForeignKey a la app 'residents'
    # Por ahora usamos texto para que sea funcional de inmediato
    nombre_residente = models.CharField(max_length=150)
    apartamento_destino = models.CharField(max_length=20)

    # El default=timezone.now registra la hora exacta al crear el registro
    hora_entrada = models.DateTimeField(default=timezone.now)
    # null=True permite que esté vacío hasta que la visita se retire
    hora_salida = models.DateTimeField(null=True, blank=True)
    
    # Controla si la visita sigue adentro
    activa = models.BooleanField(default=True)

    def __str__(self):
        estado = "Activa" if self.activa else "Completada"
        return f"{self.nombre_visitante} a {self.apartamento_destino} ({estado})"