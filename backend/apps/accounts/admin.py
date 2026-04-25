from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


# admin.site.register(User, UserAdmin)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "email", "username", "full_name", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "username", "full_name")
    ordering = ("id",)

    fieldsets = UserAdmin.fieldsets + (
        ("Información adicional", {"fields": ("full_name", "phone", "role")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Información adicional", {"fields": ("email", "full_name", "phone", "role")}),
    )