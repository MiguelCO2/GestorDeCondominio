from rest_framework import permissions

class IsCreator(permissions.BasePermission):
    """
    Permiso para el Creador (super_admin). Acceso total.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'super_admin')


class IsAdminOrCreator(permissions.BasePermission):
    """
    Permiso para Creador y Administradores (super_admin, admin, board).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'admin', 'board']


class IsContadorOrAdminOrCreator(permissions.BasePermission):
    """
    Permiso para Creador, Administradores y Contadores (super_admin, admin, board, accountant).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'admin', 'board', 'accountant']


class IsPorterOrAdminOrCreator(permissions.BasePermission):
    """
    Permiso para Creador, Administradores y Porteros (super_admin, admin, board, security).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'admin', 'board', 'security']


class IsResidentOrAdminOrCreator(permissions.BasePermission):
    """
    Permiso para Creador, Administradores y Residentes (super_admin, admin, board, resident).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'admin', 'board', 'resident']
