
from django.db.models import Q

from rest_framework import generics, permissions, viewsets
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny

from .models import Item, List, ListMember
from .serializers import (
    ItemSerializer,
    ListMemberSerializer,
    ListSerializer,
    RegisterSerializer,
)


# =====================================================
# PERMISSÕES PERSONALIZADAS
# =====================================================

class IsListOwnerOrReadOnly(permissions.BasePermission):
    """
    Membros podem visualizar a lista.
    Somente o proprietário pode alterar ou excluir a lista.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.owner_id == request.user.id


class CanManageItem(permissions.BasePermission):
    """
    O proprietário e os editores podem alterar itens.
    Visualizadores têm acesso somente de leitura.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if obj.list.owner_id == request.user.id:
            return True

        return ListMember.objects.filter(
            user=request.user,
            list=obj.list,
            role=ListMember.Role.EDITOR,
        ).exists()


class IsListMemberOwner(permissions.BasePermission):
    """
    Somente o proprietário da lista pode gerenciar seus membros.
    """

    def has_object_permission(self, request, view, obj):
        return obj.list.owner_id == request.user.id


# =====================================================
# LISTAS
# =====================================================

class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        IsListOwnerOrReadOnly,
    ]

    def get_queryset(self):
        return List.objects.filter(
            Q(owner=self.request.user)
            | Q(members__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# =====================================================
# ITENS
# =====================================================

class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        CanManageItem,
    ]

    def get_queryset(self):
        return Item.objects.filter(
            Q(list__owner=self.request.user)
            | Q(list__members__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        target_list = serializer.validated_data["list"]

        is_owner = target_list.owner_id == self.request.user.id

        is_editor = ListMember.objects.filter(
            user=self.request.user,
            list=target_list,
            role=ListMember.Role.EDITOR,
        ).exists()

        if not (is_owner or is_editor):
            raise PermissionDenied(
                "Você não tem permissão para adicionar itens a esta lista."
            )

        serializer.save(added_by=self.request.user)


# =====================================================
# MEMBROS DAS LISTAS
# =====================================================

class ListMemberViewSet(viewsets.ModelViewSet):
    serializer_class = ListMemberSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        return ListMember.objects.filter(
            Q(list__owner=self.request.user)
            | Q(list__members__user=self.request.user)
        ).distinct()

    def get_permissions(self):
        permission_list = [permissions.IsAuthenticated()]

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            permission_list.append(IsListMemberOwner())

        return permission_list

    def perform_create(self, serializer):
        target_list = serializer.validated_data["list"]

        if target_list.owner_id != self.request.user.id:
            raise PermissionDenied(
                "Somente o proprietário pode adicionar membros."
            )

        serializer.save()


# =====================================================
# AUTENTICAÇÃO
# =====================================================

class RegisterView(generics.CreateAPIView):
    """
    Cadastro de novos usuários.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class LoginView(ObtainAuthToken):
    """
    Autenticação de usuários e geração de token.

    Não utiliza autenticação por sessão nesta rota,
    evitando a exigência de CSRF no login via JSON.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
