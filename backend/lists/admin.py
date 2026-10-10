
from django.contrib import admin

from .models import Item, List, ListMember


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "owner",
        "created_at",
    )

    search_fields = (
        "name",
        "description",
        "owner__username",
    )

    list_filter = (
        "category",
        "created_at",
    )


@admin.register(ListMember)
class ListMemberAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "list",
        "role",
        "joined_at",
    )

    search_fields = (
        "user__username",
        "list__name",
    )

    list_filter = (
        "role",
        "joined_at",
    )


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "list",
        "priority",
        "status",
        "added_by",
        "created_at",
    )

    search_fields = (
        "name",
        "description",
        "list__name",
    )

    list_filter = (
        "priority",
        "status",
        "category",
    )
