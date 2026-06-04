# Generated manually for payments module integration

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('residents', '0001_initial'),
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='descripcion',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='payment',
            name='metodo_pago',
            field=models.CharField(
                choices=[
                    ('TRANSFERENCIA', 'Transferencia'),
                    ('PAGO_MOVIL', 'Pago Móvil'),
                    ('EFECTIVO', 'Efectivo'),
                ],
                default='TRANSFERENCIA',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='residente',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='pagos',
                to='residents.residentprofile',
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='residente_nombre',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='payment',
            name='unidad',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
