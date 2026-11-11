
document.addEventListener("DOMContentLoaded", async () => {

    // 1. Verifica a autenticação.
    const token = getAuthToken();

    if (!token) {
        window.location.replace("/");
        return;
    }

    // 2. Carrega as listas reais do backend.
    try {
        await getListsFromAPI();
    } catch (error) {
        console.error("Erro ao carregar listas:", error);

        // Evita exibir dados fictícios caso a API falhe.
        saveLists([]);

        showToast("Não foi possível carregar suas listas.");
    }

    // 3. Inicializa a interface após carregar os dados.
    setupEvents();
    initUI();

    // 4. Menu responsivo da sidebar.
    const sidebar = document.getElementById("sidebar");
    const mobileMenu = document.querySelector(".mobile-menu");

    if (sidebar && mobileMenu && !mobileMenu.dataset.sidebarReady) {

        let overlay = document.querySelector(".sidebar-overlay");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            document.body.appendChild(overlay);
        }

        function setSidebarOpen(isOpen) {
            sidebar.classList.toggle("is-open", isOpen);
            document.body.classList.toggle("sidebar-open", isOpen);

            mobileMenu.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }

        mobileMenu.setAttribute("aria-controls", "sidebar");
        mobileMenu.setAttribute("aria-expanded", "false");

        mobileMenu.addEventListener("click", () => {
            const isOpen = sidebar.classList.contains("is-open");
            setSidebarOpen(!isOpen);
        });

        overlay.addEventListener("click", () => {
            setSidebarOpen(false);
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                setSidebarOpen(false);
            }
        });

        sidebar.addEventListener("click", event => {
            if (event.target.closest(".nav-item, .sidebar-list")) {
                setSidebarOpen(false);
            }
        });

        mobileMenu.dataset.sidebarReady = "true";
    }

    // 5. Abre uma lista por código, caso exista.
    const params = new URLSearchParams(location.search);
    const requestedList = params.get("list");

    if (requestedList) {
        const list = getListByCode(requestedList);

        if (list) {
            showList(list.id);
        }
    }
});
