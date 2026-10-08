from django.contrib.auth.models import User
from django.db import models


class List(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=20, default="#2b2f77")
    icon = models.CharField(max_length=50, blank=True)

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_lists"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ListMember(models.Model):
    class Role(models.TextChoices):
        EDITOR = "editor", "Editor"
        VIEWER = "viewer", "Visualizador"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="list_memberships"
    )

    list = models.ForeignKey(
        List,
        on_delete=models.CASCADE,
        related_name="members"
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "list"],
                name="unique_list_member"
            )
        ]

    def __str__(self):
        return f"{self.user.username} - {self.list.name}"


class Item(models.Model):
    class Priority(models.TextChoices):
        NONE = "none", "Sem"
        LOW = "low", "Baixa"
        MEDIUM = "medium", "Média"
        HIGH = "high", "Alta"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        COMPLETED = "completed", "Concluído"

    list = models.ForeignKey(
        List,
        on_delete=models.CASCADE,
        related_name="items"
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NONE
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    category = models.CharField(max_length=100, default="geral")
    tag = models.CharField(max_length=50, blank=True)

    quantity = models.CharField(max_length=50, blank=True)
    unit = models.CharField(max_length=50, blank=True)

    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="added_items"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name