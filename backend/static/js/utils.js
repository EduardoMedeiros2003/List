const ICONS = ["🎬","📺","🛒","✅","📚","✈️","💡","📝","📦","🎵","🏠","⭐"];
const COLORS = ["#6366f1","#8b5cf6","#22c55e","#f97316","#ef4444","#ec4899","#06b6d4","#eab308"];

function formatDate(iso) {
  return new Intl.DateTimeFormat("pt-BR", {day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(iso));
}
function formatRelativeDate(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff/60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes/60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours/24);
  if (days < 7) return `há ${days} dias`;
  return formatDate(iso);
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function priorityLabel(priority) {
  return {none:"Sem",high:"🔴 Alta", medium:"🟡 Média", low:"🟢 Baixa"}[priority] || "Sem";
}
function categoryLabel(category) {
  return {filmes:"Filmes",series:"Séries",compras:"Compras",tarefas:"Tarefas",livros:"Livros",viagens:"Viagens",ideias:"Ideias",personalizada:"Personalizada"}[category] || category;
}
function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}
function generateShareCode() {
  return "LST-" + Math.random().toString(36).slice(2,8).toUpperCase();
}