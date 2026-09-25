let activeListId = null;
let activeFilter = "all";
let activeSort = "created";
let activeItemSearch = "";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function openModal(content) {
  $("#modalContent").innerHTML = content;
  $("#modalBackdrop").classList.remove("hidden");
}
function closeModal() { $("#modalBackdrop").classList.add("hidden"); }
function renderSidebar() {
  const container = $("#sidebarLists");
  container.innerHTML = getLists().map(list => `
    <div class="sidebar-list" data-open-list="${list.id}">
      <span class="sidebar-list-dot" style="background:${list.color}"></span>
      <span class="sidebar-list-name">${escapeHTML(list.name)}</span>
    </div>`).join("");
}
function renderStats() {
  const lists = getLists();
  const totalItems = lists.reduce((n,l) => n + l.items.length, 0);
  const completed = lists.reduce((n,l) => n + l.items.filter(i=>i.status==="completed").length, 0);
  const pending = totalItems - completed;
  $("#statsGrid").innerHTML = [
    ["☷","Listas",lists.length],["◈","Itens",totalItems],["✓","Concluídos",completed],["○","Pendentes",pending]
  ].map(s=>`<div class="stat-card card"><div class="stat-icon">${s[0]}</div><div><span class="stat-label">${s[1]}</span><strong class="stat-value">${s[2]}</strong></div></div>`).join("");
}
function renderDashboard() {
  renderStats(); renderSidebar();
  const query = $("#listSearch").value.toLowerCase();
  const category = $("#categoryFilter").value;
  const lists = getLists().filter(l =>
    (!query || `${l.name} ${l.description}`.toLowerCase().includes(query)) &&
    (category === "all" || l.category === category)
  );
  $("#listCount").textContent = `${lists.length} ${lists.length === 1 ? "lista" : "listas"}`;
  $("#listGrid").innerHTML = lists.map(renderListCard).join("");
  $("#emptyLists").classList.toggle("hidden", lists.length !== 0);
}
function renderListCard(list) {
  const total = list.items.length, done = list.items.filter(i=>i.status==="completed").length;
  const progress = total ? Math.round(done/total*100) : 0;
  return `<article class="list-card card" style="--list-color:${list.color}" data-open-list="${list.id}">
    <span class="list-card-accent"></span>
    <div class="list-card-head"><div class="list-icon">${list.icon}</div><button class="more-btn" data-edit-list="${list.id}" aria-label="Editar lista">⋯</button></div>
    <h3>${escapeHTML(list.name)}</h3>
    <p class="list-card-description">${escapeHTML(list.description || "Sem descrição.")}</p>
    <div class="progress-row"><span>${done}/${total} concluídos</span><strong>${progress}%</strong></div>
    <div class="progress"><span style="width:${progress}%"></span></div>
    <div class="card-footer"><span>Atualizada ${formatRelativeDate(list.updatedAt)}</span><div class="members">${list.members.slice(0,4).map(m=>`<span class="member-avatar" title="${escapeHTML(m.name)}">${escapeHTML(m.name[0])}</span>`).join("")}</div></div>
  </article>`;
}
function showList(listId) {
  activeListId = listId; activeFilter="all"; activeSort="created"; activeItemSearch="";
  $("#dashboardView").classList.add("hidden"); $("#sharedView").classList.add("hidden"); $("#listView").classList.remove("hidden");
  renderListPage();
  $("#breadcrumb").textContent = getListById(listId)?.name || "Lista";
}
function renderListPage() {
  const list = getListById(activeListId);
  if (!list) return goDashboard();
  const total=list.items.length, done=list.items.filter(i=>i.status==="completed").length, progress=total?Math.round(done/total*100):0;
  const visible = list.items.filter(item => {
    const q=activeItemSearch.toLowerCase();
    const matchesSearch=!q || `${item.name} ${item.description} ${item.category} ${item.tag}`.toLowerCase().includes(q);
    const matchesFilter=activeFilter==="all" ||
      (activeFilter==="completed" && item.status==="completed") ||
      (activeFilter==="pending" && item.status!=="completed") ||
      item.priority===activeFilter;
    return matchesSearch && matchesFilter;
  }).sort((a,b)=> {
   if(activeSort==="priority") {
    const priorityOrder = {
      high: 0,
      medium: 1,
      low: 2,
      none: 3
    };

    return (priorityOrder[a.priority] ?? 3) -
           (priorityOrder[b.priority] ?? 3);
}
  });
  $("#listPage").innerHTML = `
    <div class="list-page-header" style="--list-color:${list.color}">
      <button class="back-link" id="backDashboard">← Voltar</button>
      <div class="list-page-top">
        <div class="list-page-title"><div class="big-list-icon">${list.icon}</div><div><h1>${escapeHTML(list.name)}</h1><p>${escapeHTML(list.description || "Sem descrição.")}</p></div></div>
        <div class="list-header-actions"><button class="header-btn" id="shareListBtn">↗ Compartilhar</button><button class="header-btn" id="editListBtn">✎ Editar</button></div>
      </div>
      <div class="list-metrics"><div class="metric"><strong>${total}</strong><span>itens</span></div><div class="metric"><strong>${done}</strong><span>concluídos</span></div><div class="metric"><strong>${list.members.length}</strong><span>integrantes</span></div></div>
      <div class="list-progress-wrap"><div class="progress"><span style="width:${progress}%"></span></div></div>
    </div>

    <div class="items-toolbar">
      <div class="item-search"><input id="itemSearch" type="search" value="${escapeHTML(activeItemSearch)}" placeholder="Pesquisar itens, descrições, categorias..."></div>
      <select id="itemSort" class="select-control"><option value="created" ${activeSort==="created"?"selected":""}>Mais recentes</option><option value="priority" ${activeSort==="priority"?"selected":""}>Prioridade</option><option value="name" ${activeSort==="name"?"selected":""}>Nome</option><option value="status" ${activeSort==="status"?"selected":""}>Status</option></select>
    </div>
    <div class="item-filters">
      ${[["all","Todas"],["none","⚪ Sem"],["high","🔴 Alta"],["medium","🟡 Média"],["low","🟢 Baixa"],["completed","Concluídas"],["pending","Pendentes"]].map(([v,l])=>`<button class="filter-btn ${activeFilter===v?"active":""}" data-filter="${v}">${l}</button>`).join("")}
    </div>
    <div class="quick-add"><input id="quickItemInput" placeholder="Digite um novo item e pressione Enter..." aria-label="Novo item"><button class="primary-btn" id="quickAddBtn">Adicionar</button></div>
    <div class="items-list">${visible.length ? visible.map(renderItem).join("") : `<div class="empty-state card"><div class="empty-icon">✓</div><h3>Nenhum item encontrado</h3><p>Adicione um item ou ajuste os filtros.</p></div>`}</div>

    <div class="list-extra-grid">
      <div class="panel card"><div class="panel-header"><h3>Integrantes</h3><button class="text-btn" id="addMemberBtn">＋ Adicionar</button></div>
        ${list.members.map(m=>`<div class="member-row"><div class="member-info"><div class="avatar">${escapeHTML(m.name[0])}</div><div><strong>${escapeHTML(m.name)}</strong><span>${m.role}</span></div></div>${m.id!==getCurrentUser().id?`<button class="small-btn" data-remove-member="${m.id}" title="Remover">×</button>`:""}</div>`).join("")}
      </div>
      <div class="panel card"><div class="panel-header"><h3>Compartilhar lista</h3></div><p class="muted">Compartilhamento simulado nesta versão.</p><div class="share-code"><code>${list.shareCode}</code><button class="secondary-btn" id="copyCodeBtn">Copiar</button></div><button class="secondary-btn" id="copyLinkBtn" style="width:100%;margin-top:9px">Copiar link</button></div>
    </div>`;
}
function renderItem(item) {
  return `<article class="item-card ${item.status==="completed"?"completed":""}">
    <input class="item-check" type="checkbox" ${item.status==="completed"?"checked":""} data-toggle-item="${item.id}" aria-label="Concluir ${escapeHTML(item.name)}">
    <div class="item-main"><span class="item-name">${escapeHTML(item.name)}</span><div class="item-meta"><span class="priority priority-${item.priority}">${priorityLabel(item.priority)}</span><span>${escapeHTML(item.category)}</span>${item.quantity?`<span>${escapeHTML(item.quantity)} ${escapeHTML(item.unit)}</span>`:""}<span>por ${escapeHTML(item.addedBy)}</span></div></div>
    <div class="item-actions"><button class="small-btn" data-edit-item="${item.id}" title="Editar">✎</button><button class="small-btn" data-delete-item="${item.id}" title="Excluir">×</button></div>
  </article>`;
}
function openListModal(listId=null) {
  const list=listId?getListById(listId):null;
  let selectedColor=list?.color || COLORS[0], selectedIcon=list?.icon || ICONS[0];
  openModal(`<div class="modal-header"><h2 id="modalTitle">${list?"Editar lista":"Criar nova lista"}</h2><button class="modal-close" id="modalClose">×</button></div>
  <form id="listForm"><div class="form-grid">
    <div class="field full"><label for="listName">Nome da lista</label><input id="listName" required value="${escapeHTML(list?.name||"")}" placeholder="Ex.: Filmes para assistir"></div>
    <div class="field full"><label for="listDescription">Descrição</label><textarea id="listDescription" placeholder="Descreva o objetivo desta lista...">${escapeHTML(list?.description||"")}</textarea></div>
  <div class="field">
    <label for="listCategory">Categoria</label>
    <input
      id="listCategory"
      value="${escapeHTML(list?.category || "")}"
      placeholder="Ex.: Filmes, Estudos, Viagem"
      required
  >
  </div>
    <div class="field"><label>Ícone</label><div class="icon-picker">${ICONS.map(i=>`<button type="button" class="icon-option ${i===selectedIcon?"selected":""}" data-pick-icon="${i}">${i}</button>`).join("")}</div></div>
    <div class="field full"><label>Cor</label><div class="color-picker">${COLORS.map(c=>`<button type="button" class="color-option ${c===selectedColor?"selected":""}" style="background:${c}" data-pick-color="${c}" aria-label="Cor ${c}"></button>`).join("")}</div></div>
  </div><div class="modal-actions"><button type="button" class="secondary-btn" id="modalCancel">Cancelar</button><button class="primary-btn">${list?"Salvar alterações":"Criar lista"}</button></div></form>`);
  $("#listForm").dataset.color=selectedColor; $("#listForm").dataset.icon=selectedIcon;
  $$("[data-pick-color]").forEach(b=>b.onclick=()=>{ $("#listForm").dataset.color=b.dataset.pickColor; $$("[data-pick-color]").forEach(x=>x.classList.remove("selected")); b.classList.add("selected"); });
  $$("[data-pick-icon]").forEach(b=>b.onclick=()=>{ $("#listForm").dataset.icon=b.dataset.pickIcon; $$("[data-pick-icon]").forEach(x=>x.classList.remove("selected")); b.classList.add("selected"); });
  $("#listForm").onsubmit=e=>{e.preventDefault();const data={name:$("#listName").value,description:$("#listDescription").value,category:$("#listCategory").value,color:$("#listForm").dataset.color,icon:$("#listForm").dataset.icon};if(list)updateList(list.id,data),showToast("Lista atualizada ✓");else createList(data),showToast("Lista criada ✓");closeModal();renderDashboard();if(list&&activeListId===list.id)renderListPage();};
}
function openItemModal(itemId=null) {
  const list=getListById(activeListId), item=itemId?list.items.find(i=>i.id===itemId):null;
  openModal(`<div class="modal-header"><h2 id="modalTitle">${item?"Editar item":"Adicionar item"}</h2><button class="modal-close" id="modalClose">×</button></div>
  <form id="itemForm"><div class="form-grid">
  <div class="field full"><label for="itemName">Nome</label><input id="itemName" required value="${escapeHTML(item?.name||"")}" placeholder="Nome do item"></div>
  <div class="field full"><label for="itemDescription">Descrição</label><textarea id="itemDescription">${escapeHTML(item?.description||"")}</textarea></div>
  <div class="field"><label for="itemPriority">Prioridade</label><select id="itemPriority"><option value="none" ${!item || item.priority === "none" ? "selected" : ""}>⚪ Sem</option><option value="high" ${item?.priority==="high"?"selected":""}>🔴 Alta</option><option value="medium" ${!item||item.priority==="medium"?"selected":""}>🟡 Média</option><option value="low" ${item?.priority==="low"?"selected":""}>🟢 Baixa</option></select></div>
  <div class="field"><label for="itemCategory">Categoria/Tag</label><input id="itemCategory" value="${escapeHTML(item?.category||"geral")}"></div>
  <div class="field"><label for="itemQuantity">Quantidade</label><input id="itemQuantity" value="${escapeHTML(item?.quantity||"")}"></div>
  <div class="field"><label for="itemUnit">Unidade</label><input id="itemUnit" value="${escapeHTML(item?.unit||"")} placeholder="kg, litros, un..."></div>
  </div><div class="modal-actions"><button type="button" class="secondary-btn" id="modalCancel">Cancelar</button><button class="primary-btn">${item?"Salvar alterações":"Adicionar item"}</button></div></form>`);
  $("#itemForm").onsubmit=e=>{e.preventDefault();const data={name:$("#itemName").value,description:$("#itemDescription").value,priority:$("#itemPriority").value,category:$("#itemCategory").value,quantity:$("#itemQuantity").value,unit:$("#itemUnit").value};if(item)updateItem(list.id,item.id,data),showToast("Item atualizado ✓");else addItem(list.id,data),showToast("Item adicionado ✓");closeModal();renderDashboard();renderListPage();};
}
function openShareModal() {
  const list=getListById(activeListId);
  openModal(`<div class="modal-header"><h2>Compartilhar lista</h2><button class="modal-close" id="modalClose">×</button></div><p class="muted">Envie este código para outra pessoa. Nesta versão, a entrada é simulada no mesmo navegador.</p><div class="share-code" style="margin:18px 0"><code>${list.shareCode}</code><button class="secondary-btn" id="modalCopyCode">Copiar</button></div><button class="primary-btn" id="modalCopyLink" style="width:100%">Copiar link simulado</button>`);
  $("#modalCopyCode").onclick=()=>copyText(list.shareCode,"Código copiado ✓");
  $("#modalCopyLink").onclick=()=>copyText(`${location.origin}${location.pathname}?list=${list.shareCode}`,"Link copiado ✓");
}
function openMemberModal() {
  openModal(`<div class="modal-header"><h2>Adicionar integrante</h2><button class="modal-close" id="modalClose">×</button></div><form id="memberForm"><div class="field"><label for="memberName">Nome</label><input id="memberName" required placeholder="Ex.: Maria"></div><div class="modal-actions"><button type="button" class="secondary-btn" id="modalCancel">Cancelar</button><button class="primary-btn">Adicionar</button></div></form>`);
  $("#memberForm").onsubmit=e=>{e.preventDefault();addMember(activeListId,$("#memberName").value);closeModal();renderDashboard();renderListPage();showToast("Integrante adicionado ✓");};
}
function copyText(text,message){navigator.clipboard?.writeText(text).then(()=>showToast(message)).catch(()=>showToast(text));}
function goDashboard(){activeListId=null;$("#listView").classList.add("hidden");$("#sharedView").classList.add("hidden");$("#dashboardView").classList.remove("hidden");$("#breadcrumb").textContent="Dashboard";renderDashboard();}
function goShared(){activeListId=null;$("#dashboardView").classList.add("hidden");$("#listView").classList.add("hidden");$("#sharedView").classList.remove("hidden");$("#breadcrumb").textContent="Compartilhadas";renderShared();}
function renderShared(){const lists=getLists();$("#sharedCards").innerHTML=lists.map(renderListCard).join("");}
function joinByCode(code){const list=getListByCode(code);if(!list){showToast("Código não encontrado.");return;}showToast(`Lista "${list.name}" encontrada ✓`);showList(list.id);}
function setupEvents() {
  $("#createListBtn").onclick=()=>openListModal();
  $("#sidebarAdd").onclick=()=>openListModal();
  $("#listSearch").oninput=renderDashboard;
  $("#categoryFilter").onchange=renderDashboard;
  $("#joinListBtn").onclick=()=>openJoinModal();
  $("#joinListText").onclick=()=>openJoinModal();
  $("#sharedJoinBtn").onclick=()=>joinByCode($("#sharedCode").value);
  $("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
  $("#themeToggle").onclick=toggleTheme;
  document.addEventListener("click",e=>{
    const open=e.target.closest("[data-open-list]"); if(open){showList(open.dataset.openList);$("#sidebar").classList.remove("open");return;}
    const edit=e.target.closest("[data-edit-list]"); if(edit){e.stopPropagation();openListModal(edit.dataset.editList);return;}
    const filter=e.target.closest("[data-filter]"); if(filter){activeFilter=filter.dataset.filter;renderListPage();return;}
    const toggle=e.target.closest("[data-toggle-item]"); if(toggle){toggleItem(activeListId,toggle.dataset.toggleItem);renderDashboard();renderListPage();showToast("Status atualizado ✓");return;}
    const editItem=e.target.closest("[data-edit-item]"); if(editItem){openItemModal(editItem.dataset.editItem);return;}
    const delItem=e.target.closest("[data-delete-item]"); if(delItem){confirmAction("Excluir item?","Tem certeza que deseja excluir este item?",()=>{deleteItem(activeListId,delItem.dataset.deleteItem);renderDashboard();renderListPage();showToast("Item excluído");});return;}
    const remove=e.target.closest("[data-remove-member]"); if(remove){confirmAction("Remover integrante?","Essa pessoa será removida da lista.",()=>{removeMember(activeListId,remove.dataset.removeMember);renderDashboard();renderListPage();showToast("Integrante removido");});return;}
    if(e.target.id==="backDashboard")goDashboard();
    if(e.target.id==="editListBtn")openListModal(activeListId);
    if(e.target.id==="shareListBtn")openShareModal();
    if(e.target.id==="addMemberBtn")openMemberModal();
    if(e.target.id==="copyCodeBtn")copyText(getListById(activeListId).shareCode,"Código copiado ✓");
    if(e.target.id==="copyLinkBtn")copyText(`${location.origin}${location.pathname}?list=${getListById(activeListId).shareCode}`,"Link copiado ✓");
    if(e.target.id==="quickAddBtn")quickAdd();
    if(e.target.id==="modalClose"||e.target.id==="modalCancel")closeModal();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  document.addEventListener("input",e=>{if(e.target.id==="quickItemInput"&&e.key==="Enter")quickAdd();});
  document.addEventListener("change",e=>{if(e.target.id==="itemSort"){activeSort=e.target.value;renderListPage();}});
  document.addEventListener("input",e=>{if(e.target.id==="itemSearch"){activeItemSearch=e.target.value;renderListPage();setTimeout(()=>{$("#itemSearch")?.focus();$("#itemSearch")?.setSelectionRange(activeItemSearch.length,activeItemSearch.length)},0);}});
}
function quickAdd(){
  const input = $("#quickItemInput");
  if(!input?.value.trim()) return;

  addItem(activeListId, {
    name: input.value,
    category: "geral"
  });

  renderDashboard();
  renderListPage();
  showToast("Item adicionado ✓");
}
function confirmAction(title,message,action){openModal(`<div class="modal-header"><h2>${title}</h2><button class="modal-close" id="modalClose">×</button></div><p class="muted">${message}</p><div class="modal-actions"><button class="secondary-btn" id="modalCancel">Cancelar</button><button class="danger-btn" id="confirmDelete">Excluir</button></div>`);$("#confirmDelete").onclick=()=>{action();closeModal();};}
function openJoinModal(){openModal(`<div class="modal-header"><h2>Entrar em uma lista</h2><button class="modal-close" id="modalClose">×</button></div><p class="muted">Digite o código recebido para abrir uma lista compartilhada.</p><div class="field" style="margin-top:15px"><label for="joinModalCode">Código da lista</label><input id="joinModalCode" placeholder="LST-8F3K2A"></div><div class="modal-actions"><button class="secondary-btn" id="modalCancel">Cancelar</button><button class="primary-btn" id="joinModalSubmit">Entrar na lista</button></div>`);$("#joinModalSubmit").onclick=()=>{const code=$("#joinModalCode").value;closeModal();joinByCode(code);};}
function toggleTheme(){const next=getTheme()==="light"?"dark":"light";saveTheme(next);applyTheme();showToast(next==="dark"?"Tema escuro ativado":"Tema claro ativado");}
function applyTheme(){const dark=getTheme()==="dark";document.documentElement.dataset.theme=dark?"dark":"light";$("#themeIcon").textContent=dark?"☀":"☾";$("#themeLabel").textContent=dark?"Tema claro":"Tema escuro";}
function initUI(){applyTheme();$("#currentUserName").textContent=getCurrentUser().name;renderDashboard();}
