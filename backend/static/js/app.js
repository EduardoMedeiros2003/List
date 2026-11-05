document.addEventListener("DOMContentLoaded", () => {
  initializeDemoData();
  setupEvents();
  initUI();

  const params = new URLSearchParams(location.search);
  const requestedList = params.get("list");
  if (requestedList) {
    const list = getListByCode(requestedList);
    if (list) showList(list.id);
  }
});