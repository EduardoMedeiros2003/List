document.addEventListener("DOMContentLoaded", () => {
  initializeDemoData();
  setupEvents();
  initUI();

// Menu responsivo da sidebar
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

        mobileMenu.setAttribute("aria-expanded", String(isOpen));
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

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarOpen(false);
        }
    });

    sidebar.addEventListener("click", (event) => {
        if (event.target.closest(".nav-item, .sidebar-list")) {
            setSidebarOpen(false);
        }
    });

    mobileMenu.dataset.sidebarReady = "true";
}


  const params = new URLSearchParams(location.search);
  const requestedList = params.get("list");
  if (requestedList) {
    const list = getListByCode(requestedList);
    if (list) showList(list.id);
  }
});