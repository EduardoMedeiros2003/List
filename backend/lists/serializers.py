
from rest_framework import serializers

from .models import Item, List, ListMember


class ListSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = [
            "id",
            "name",
            "description",
            "category",
            "color",
            "icon",
            "owner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]


class ListMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListMember
        fields = [
            "id",
            "user",
            "list",
            "role",
            "joined_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "joined_at",
        ]


class ItemSerializer(serializers.ModelSerializer):
    
    def validate_list(self, value):
        if self.instance and value.pk != self.instance.list_id:
            raise serializers.ValidationError(
                "Não é permitido mover um item para outra lista."
            )

        return value

    class Meta:
        model = Item
        fields = [
            "id",
            "list",
            "name",
            "description",
            "priority",
            "status",
            "category",
            "tag",
            "quantity",
            "unit",
            "added_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "added_by",
            "created_at",
            "updated_at",
        ]
