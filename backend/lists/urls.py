
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

from .views import (
    ItemViewSet,
    ListMemberViewSet,
    ListViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register("lists", ListViewSet, basename="list")
router.register("items", ItemViewSet, basename="item")
router.register("members", ListMemberViewSet, basename="member")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", obtain_auth_token, name="login"),
] + router.urls
