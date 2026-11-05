from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ItemViewSet,
    ListMemberViewSet,
    ListViewSet,
    LoginView,
    RegisterView,
)

router = DefaultRouter()

router.register("lists", ListViewSet, basename="list")
router.register("items", ItemViewSet, basename="item")
router.register("members", ListMemberViewSet, basename="member")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("", include(router.urls)),
]