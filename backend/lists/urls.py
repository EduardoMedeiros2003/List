
from rest_framework.routers import DefaultRouter

from .views import ItemViewSet, ListViewSet

router = DefaultRouter()
router.register("lists", ListViewSet, basename="list")
router.register("items", ItemViewSet, basename="item")

urlpatterns = router.urls
