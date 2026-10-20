
from rest_framework.routers import DefaultRouter

from .views import ItemViewSet, ListMemberViewSet, ListViewSet

router = DefaultRouter()
router.register("lists", ListViewSet, basename="list")
router.register("items", ItemViewSet, basename="item")
router.register("members", ListMemberViewSet, basename="member")

urlpatterns = router.urls
