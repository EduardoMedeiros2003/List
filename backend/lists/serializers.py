
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Item, List, ListMember


class ItemSerializer(serializers.ModelSerializer):

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

    def validate_list(self, value):
        if self.instance and value.pk != self.instance.list_id:
            raise serializers.ValidationError(
                "Não é permitido mover um item para outra lista."
            )

        return value


class ListMemberSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    list = serializers.PrimaryKeyRelatedField(
        queryset=List.objects.all()
    )

    class Meta:
        model = ListMember
        fields = [
            "id",
            "user",
            "user_name",
            "list",
            "role",
            "joined_at",
        ]
        read_only_fields = ["id", "joined_at", "user_name"]

    def validate(self, attrs):
        # Impede trocar o usuário ou a lista durante uma atualização.
        if self.instance:
            if (
                "user" in attrs
                and attrs["user"].pk != self.instance.user_id
            ):
                raise serializers.ValidationError({
                    "user": "Não é permitido trocar o usuário de um membro."
                })

            if (
                "list" in attrs
                and attrs["list"].pk != self.instance.list_id
            ):
                raise serializers.ValidationError({
                    "list": "Não é permitido mover um membro para outra lista."
                })

        # Verifica duplicidade na criação.
        user = attrs.get(
            "user",
            self.instance.user if self.instance else None,
        )

        target_list = attrs.get(
            "list",
            self.instance.list if self.instance else None,
        )

        if user is not None and target_list is not None:
            existing_membership = ListMember.objects.filter(
                user=user,
                list=target_list,
            )

            if self.instance:
                existing_membership = existing_membership.exclude(
                    pk=self.instance.pk
                )

            if existing_membership.exists():
                raise serializers.ValidationError({
                    "user": "Este usuário já participa desta lista."
                })

        return attrs


class ListSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.username",
        read_only=True
    )

    items = ItemSerializer(many=True, read_only=True)
    members = ListMemberSerializer(many=True, read_only=True)

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
            "owner_name",
            "items",
            "members",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "owner_name",
            "items",
            "members",
            "created_at",
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "email": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
