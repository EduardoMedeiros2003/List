const STORAGE_KEYS = {
  lists: "listahub_lists",
  users: "listahub_users",
  currentUser: "listahub_current_user",
  theme: "listahub_theme",
  initialized: "listahub_initialized"
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLists() { return loadJSON(STORAGE_KEYS.lists, []); }
function saveLists(lists) { saveJSON(STORAGE_KEYS.lists, lists); }
function getUsers() { return loadJSON(STORAGE_KEYS.users, [{ id:"user_eduardo", name:"Eduardo", role:"Administrador" }]); }
function getCurrentUser() { return loadJSON(STORAGE_KEYS.currentUser, { id:"user_eduardo", name:"Eduardo", role:"Administrador" }); }
function getTheme() { return localStorage.getItem(STORAGE_KEYS.theme) || "light"; }
function saveTheme(theme) { localStorage.setItem(STORAGE_KEYS.theme, theme); }

function initializeDemoData() {
  if (localStorage.getItem(STORAGE_KEYS.initialized)) return;

  const now = new Date().toISOString();
  const makeItem = (name, priority="medium", done=false, category="geral") => ({
    id: createId("item"),
    name, description:"", priority, status:done ? "completed" : "pending",
    category, addedBy:"Eduardo", createdAt:now, updatedAt:now
  });

  const movies = {
    id:createId("list"), name:"Filmes para assistir",
    description:"Filmes que queremos assistir juntos", category:"filmes",
    color:"#6366f1", icon:"🎬", members:[
      {id:"user_eduardo",name:"Eduardo",role:"Administrador"},
      {id:"user_joao",name:"João",role:"Membro"},
      {id:"user_maria",name:"Maria",role:"Membro"}
    ],
    items:[
      makeItem("Interestelar","high",true,"filme"),
      makeItem("O Senhor dos Anéis","medium",true,"filme"),
      makeItem("Homem-Aranha","medium",false,"filme"),
      makeItem("Batman","low",false,"filme"),
      makeItem("Matrix","high",false,"filme")
    ], createdAt:now,updatedAt:now,shareCode:"LST-8F3K2A"
  };

  const groceries = {
    id:createId("list"), name:"Feira da semana",
    description:"Produtos para a compra da semana", category:"compras",
    color:"#22c55e", icon:"🛒", members:[
      {id:"user_eduardo",name:"Eduardo",role:"Administrador"},
      {id:"user_joao",name:"João",role:"Membro"}
    ],
    items:[
      makeItem("Arroz","high",false,"produto"),
      makeItem("Feijão","high",false,"produto"),
      makeItem("Carne","high",true,"produto"),
      makeItem("Leite","medium",false,"produto"),
      makeItem("Café","medium",false,"produto"),
      makeItem("Frutas","low",true,"produto"),
      makeItem("Verduras","low",false,"produto")
    ], createdAt:now,updatedAt:now,shareCode:"LST-4Q7M9B"
  };

  saveLists([movies, groceries]);
  saveJSON(STORAGE_KEYS.currentUser, {id:"user_eduardo",name:"Eduardo",role:"Administrador"});
  localStorage.setItem(STORAGE_KEYS.initialized, "true");
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}