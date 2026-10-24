
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Item, List, ListMember


class ListAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="proprietario",
            password="senha-teste-123",
        )
        self.viewer = User.objects.create_user(
            username="visualizador",
            password="senha-teste-123",
        )
        self.editor = User.objects.create_user(
            username="editor",
            password="senha-teste-123",
        )

        self.list = List.objects.create(
            name="Lista de filmes",
            owner=self.owner,
        )

        ListMember.objects.create(
            user=self.viewer,
            list=self.list,
            role=ListMember.Role.VIEWER,
        )
        ListMember.objects.create(
            user=self.editor,
            list=self.list,
            role=ListMember.Role.EDITOR,
        )

        self.list_url = reverse("list-detail", args=[self.list.id])
        self.lists_url = reverse("list-list")

    def test_owner_can_update_list(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            self.list_url,
            {"name": "Filmes atualizados"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.list.refresh_from_db()
        self.assertEqual(self.list.name, "Filmes atualizados")

    def test_viewer_cannot_update_list(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.patch(
            self.list_url,
            {"name": "Alteração indevida"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.list.refresh_from_db()
        self.assertEqual(self.list.name, "Lista de filmes")

    def test_user_only_sees_lists_they_belong_to(self):
        outsider = User.objects.create_user(
            username="externo",
            password="senha-teste-123",
        )
        self.client.force_authenticate(user=outsider)

        response = self.client.get(self.lists_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"] if isinstance(response.data, dict) and "results" in response.data else response.data, [])


class ItemAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="item_owner",
            password="senha-teste-123",
        )
        self.viewer = User.objects.create_user(
            username="item_viewer",
            password="senha-teste-123",
        )
        self.editor = User.objects.create_user(
            username="item_editor",
            password="senha-teste-123",
        )

        self.list = List.objects.create(
            name="Lista de testes",
            owner=self.owner,
        )

        ListMember.objects.create(
            user=self.viewer,
            list=self.list,
            role=ListMember.Role.VIEWER,
        )
        ListMember.objects.create(
            user=self.editor,
            list=self.list,
            role=ListMember.Role.EDITOR,
        )

        self.item = Item.objects.create(
            list=self.list,
            name="Filme de teste",
            added_by=self.owner,
        )

        self.items_url = reverse("item-list")
        self.item_url = reverse("item-detail", args=[self.item.id])

    def test_owner_can_create_item(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.items_url,
            {
                "list": self.list.id,
                "name": "Novo filme",
                "priority": "none",
                "status": "pending",
                "category": "filmes",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Item.objects.filter(list=self.list, name="Novo filme").count(),
            1,
        )

    def test_editor_can_create_item(self):
        self.client.force_authenticate(user=self.editor)

        response = self.client.post(
            self.items_url,
            {
                "list": self.list.id,
                "name": "Filme do editor",
                "priority": "none",
                "status": "pending",
                "category": "filmes",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_viewer_cannot_create_item(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.post(
            self.items_url,
            {
                "list": self.list.id,
                "name": "Filme não autorizado",
                "priority": "none",
                "status": "pending",
                "category": "filmes",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_viewer_cannot_update_item(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.patch(
            self.item_url,
            {"name": "Alteração não autorizada"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.item.refresh_from_db()
        self.assertEqual(self.item.name, "Filme de teste")

    def test_editor_can_update_item(self):
        self.client.force_authenticate(user=self.editor)

        response = self.client.patch(
            self.item_url,
            {"name": "Filme editado"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.name, "Filme editado")


class ListMemberAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="member_owner",
            password="senha-teste-123",
        )
        self.editor = User.objects.create_user(
            username="member_editor",
            password="senha-teste-123",
        )
        self.viewer = User.objects.create_user(
            username="member_viewer",
            password="senha-teste-123",
        )
        self.new_user = User.objects.create_user(
            username="member_new_user",
            password="senha-teste-123",
        )

        self.list = List.objects.create(
            name="Lista compartilhada",
            owner=self.owner,
        )

        ListMember.objects.create(
            user=self.editor,
            list=self.list,
            role=ListMember.Role.EDITOR,
        )
        self.viewer_membership = ListMember.objects.create(
            user=self.viewer,
            list=self.list,
            role=ListMember.Role.VIEWER,
        )

        self.members_url = reverse("member-list")

    def test_owner_can_add_member(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.members_url,
            {
                "user": self.new_user.id,
                "list": self.list.id,
                "role": ListMember.Role.VIEWER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ListMember.objects.filter(
                user=self.new_user,
                list=self.list,
                role=ListMember.Role.VIEWER,
            ).exists()
        )

    def test_editor_cannot_add_member(self):
        self.client.force_authenticate(user=self.editor)

        response = self.client.post(
            self.members_url,
            {
                "user": self.new_user.id,
                "list": self.list.id,
                "role": ListMember.Role.VIEWER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            ListMember.objects.filter(
                user=self.new_user,
                list=self.list,
            ).exists()
        )

    def test_owner_can_remove_member(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(
            reverse(
                "member-detail",
                args=[self.viewer_membership.id],
            )
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ListMember.objects.filter(
                pk=self.viewer_membership.id
            ).exists()
        )

    def test_editor_cannot_remove_member(self):
        self.client.force_authenticate(user=self.editor)

        response = self.client.delete(
            reverse(
                "member-detail",
                args=[self.viewer_membership.id],
            )
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(
            ListMember.objects.filter(
                pk=self.viewer_membership.id
            ).exists()
        )

    def test_owner_cannot_add_duplicate_member(self):
        self.client.force_authenticate(user=self.owner)

        payload = {
            "user": self.new_user.id,
            "list": self.list.id,
            "role": ListMember.Role.VIEWER,
        }

        first_response = self.client.post(
            self.members_url,
            payload,
            format="json",
        )
        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )

        second_response = self.client.post(
            self.members_url,
            payload,
            format="json",
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            ListMember.objects.filter(
                user=self.new_user,
                list=self.list,
            ).count(),
            1,
        )



class RegisterAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")

    def test_user_can_register(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "novo_usuario",
                "email": "novo@example.com",
                "password": "SenhaTeste123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="novo_usuario").exists()
        )
        self.assertNotIn("password", response.data)

    def test_registration_rejects_short_password(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "senha_curta",
                "email": "curta@example.com",
                "password": "123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            User.objects.filter(username="senha_curta").exists()
        )

    def test_registration_rejects_duplicate_username(self):
        User.objects.create_user(
            username="usuario_existente",
            password="SenhaTeste123",
        )

        response = self.client.post(
            self.register_url,
            {
                "username": "usuario_existente",
                "email": "outro@example.com",
                "password": "SenhaTeste123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
