function addItem(listId, data) {
  const list = getListById(listId);
  if (!list || !data.name.trim()) return null;
  const now = new Date().toISOString();
  const item = {
    id:createId("item"), name:data.name.trim(), description:data.description?.trim() || "",
    priority:data.priority || "medium", status:"pending", category:data.category || "geral",
    tag:data.tag || "", addedBy:getCurrentUser().name, createdAt:now, updatedAt:now,
    quantity:data.quantity || "", unit:data.unit || ""
  };
  list.items.push(item);
  updateList(listId, {items:list.items});
  return item;
}
function updateItem(listId, itemId, changes) {
  const list = getListById(listId);
  if (!list) return null;
  const item = list.items.find(i => i.id === itemId);
  if (!item) return null;
  Object.assign(item, changes, {updatedAt:new Date().toISOString()});
  updateList(listId, {items:list.items});
  return item;
}
function deleteItem(listId, itemId) {
  const list = getListById(listId);
  if (!list) return;
  updateList(listId, {items:list.items.filter(i => i.id !== itemId)});
}
function toggleItem(listId, itemId) {
  const list = getListById(listId);
  const item = list?.items.find(i => i.id === itemId);
  if (!item) return;
  item.status = item.status === "completed" ? "pending" : "completed";
  item.updatedAt = new Date().toISOString();
  updateList(listId, {items:list.items});
}