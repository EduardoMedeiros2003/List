
from django.db.models import Q

from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Item, List, ListMember
from .serializers import ItemSerializer, ListSerializer


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
