function createList(data) {
  const lists = getLists();
  const now = new Date().toISOString();
  const list = {
    id:createId("list"), name:data.name.trim(), description:data.description?.trim() || "",
    category:data.category, color:data.color, icon:data.icon, members:[
      {id:getCurrentUser().id,name:getCurrentUser().name,role:"Administrador"}
    ], items:[], createdAt:now, updatedAt:now, shareCode:generateShareCode()
  };
  lists.unshift(list); saveLists(lists); return list;
}
function updateList(listId, changes) {
  const lists = getLists();
  const index = lists.findIndex(l => l.id === listId);
  if (index === -1) return null;
  lists[index] = {...lists[index], ...changes, updatedAt:new Date().toISOString()};
  saveLists(lists); return lists[index];
}
function deleteList(listId) {
  saveLists(getLists().filter(l => l.id !== listId));
}
function getListById(listId) {
  return getLists().find(l => l.id === listId);
}
function getListByCode(code) {
  return getLists().find(l => l.shareCode.toLowerCase() === code.trim().toLowerCase());
}
function addMember(listId, name) {
  const list = getListById(listId);
  if (!list || !name.trim()) return;
  list.members.push({id:createId("user"), name:name.trim(), role:"Membro"});
  updateList(listId, {members:list.members});
}
function removeMember(listId, memberId) {
  const list = getListById(listId);
  if (!list || memberId === getCurrentUser().id) return false;
  updateList(listId, {members:list.members.filter(m => m.id !== memberId)});
  return true;
}