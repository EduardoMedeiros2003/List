
from django.contrib import admin
from django.urls import include, path

from lists import page_views


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("lists.urls")),

    # Páginas do frontend
    path("", page_views.login_page, name="login_page"),
    path("cadastro/", page_views.register_page, name="register_page"),

    # API do backend
    path("api/", include("lists.urls")),
]

