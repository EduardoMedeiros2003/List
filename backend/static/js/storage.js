const STORAGE_KEYS = {
  lists: "listahub_lists",
  users: "listahub_users",
  currentUser: "listahub_current_user",
  theme: "listahub_theme",
  initialized: "listahub_initialized"
};

const API_BASE_URL = "/api";
const TOKEN_KEY = "list_auth_token";
// Cache das listas recebidas do backend.
let apiListsCache = null;

// Recupera o token da sessão autenticada.
function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Realiza requisições autenticadas para a API Django.
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const headers = {
        Accept: "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Token ${token}`;
    }

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Sessão inválida ou token expirado.
    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("list_username");

        window.location.href = "/";
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            data?.detail ||
            data?.message ||
            "Não foi possível concluir a requisição.";

        throw new Error(message);
    }

    return data;
}

// Busca as listas reais do usuário autenticado.
async function getListsFromAPI() {
    const response = await apiRequest("/lists/");

    const lists = response.map(normalizeListFromAPI);

    saveLists(lists);

    return lists;
}

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


function normalizeListFromAPI(data) {
    return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        category: data.category || "",
        color: data.color || "#2b2f77",
        icon: data.icon || "",

        owner: data.owner,
        ownerName: data.owner_name || "",

        createdAt: data.created_at,
        updatedAt: data.updated_at,

        shareCode: data.share_code || data.shareCode || null,

        members: (data.members || []).map(member => ({
            id: member.id,
            userId: member.user,
            name: member.user_name || "Usuário",
            role: member.role
        })),

        items: (data.items || []).map(item => ({
            id: item.id,
            list: item.list,
            name: item.name,
            description: item.description || "",
            priority: item.priority || "none",
            status: item.status || "pending",
            category: item.category || "geral",
            tag: item.tag || "",
            quantity: item.quantity || "",
            unit: item.unit || "",
            addedBy: item.added_by,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        }))
    };
}

function getLists() {
    if (apiListsCache !== null) {
        return apiListsCache;
    }

    return loadJSON(STORAGE_KEYS.lists, []);
}

function saveLists(lists) {
    apiListsCache = lists;
    saveJSON(STORAGE_KEYS.lists, lists);
}

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