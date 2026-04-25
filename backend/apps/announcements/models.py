from django.db import models

class Announcement(models.Model):

    CATEGORY_CHOICES = [
        ('maintenance', 'Mantenimiento'),
        ('assembly', 'Asamblea'),
        ('security', 'Seguridad'),
        ('common', 'Áreas Comunes'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
# Create your models here.
