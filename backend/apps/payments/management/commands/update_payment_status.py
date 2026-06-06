import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.payments.models import Payment
from apps.properties.models import Property
from apps.residents.models import ResidentProfile

class Command(BaseCommand):
    help = 'Actualiza el estado de los pagos y genera nuevos pagos mensuales'

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        
        # 1. Generate new monthly payments if it's the 1st of the month
        if today.day == 1:
            self.stdout.write("Generando pagos del mes...")
            properties = Property.objects.select_related('owner', 'tenant').all()
            for prop in properties:
                # Condo Payment
                if prop.owner and prop.monthly_fee:
                    profile = ResidentProfile.objects.filter(user=prop.owner).first()
                    Payment.objects.create(
                        monto=prop.monthly_fee,
                        tipo='MENSUALIDAD',
                        estado='PENDIENTE',
                        descripcion=f'Condominio - {prop.building} {prop.unit_number} - Mes {today.month}',
                        residente=profile,
                        residente_nombre=prop.owner.full_name or prop.owner.email,
                        unidad=f'{prop.building} {prop.unit_number}'
                    )
                # Rent Payment
                if prop.tenant and prop.rent_fee:
                    profile = ResidentProfile.objects.filter(user=prop.tenant).first()
                    Payment.objects.create(
                        monto=prop.rent_fee,
                        tipo='MENSUALIDAD',
                        estado='PENDIENTE',
                        descripcion=f'Alquiler - {prop.building} {prop.unit_number} - Mes {today.month}',
                        residente=profile,
                        residente_nombre=prop.tenant.full_name or prop.tenant.email,
                        unidad=f'{prop.building} {prop.unit_number}'
                    )
            self.stdout.write(self.style.SUCCESS("Pagos del mes generados correctamente."))

        # 2. Update statuses to MOROSO based on deadlines
        self.stdout.write("Verificando fechas límite de pago...")
        
        # Condominio deadline: 10th of the month
        if today.day >= 10:
            condo_payments = Payment.objects.filter(
                estado='PENDIENTE',
                descripcion__icontains='Condominio'
            )
            count = condo_payments.update(estado='MOROSO')
            self.stdout.write(f"Actualizados {count} pagos de condominio a MOROSO.")
            
        # Alquiler deadline: 10th of the month
        if today.day > 10:
            rent_payments = Payment.objects.filter(
                estado='PENDIENTE',
                descripcion__icontains='Alquiler'
            )
            count = rent_payments.update(estado='MOROSO')
            self.stdout.write(f"Actualizados {count} pagos de alquiler a MOROSO.")

        self.stdout.write(self.style.SUCCESS("Comando ejecutado exitosamente."))
