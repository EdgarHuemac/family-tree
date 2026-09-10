// Pure helpers that mirror the server's relationship logic, used to decide
// what the context menu / edit modal should offer without extra round-trips.

export function getParents(tree, personId) {
  return tree.relations
    .filter((r) => r.type === "parent-child" && r.child === personId)
    .map((r) => tree.people.find((p) => p.id === r.parent))
    .filter(Boolean);
}

export function hasParentOfGender(tree, personId, gender) {
  return getParents(tree, personId).some((p) => p.gender === gender);
}

export function getSpouses(tree, personId) {
  return tree.relations
    .filter((r) => r.type === "spouse" && (r.a === personId || r.b === personId))
    .map((r) => tree.people.find((p) => p.id === (r.a === personId ? r.b : r.a)))
    .filter(Boolean);
}

function buildAdjacency(tree, excludeId) {
  const adj = new Map();
  for (const p of tree.people) {
    if (p.id !== excludeId) adj.set(p.id, new Set());
  }
  for (const r of tree.relations) {
    if (r.type === "parent-child") {
      if (r.parent === excludeId || r.child === excludeId) continue;
      adj.get(r.parent)?.add(r.child);
      adj.get(r.child)?.add(r.parent);
    } else if (r.type === "sibling" || r.type === "spouse") {
      if (r.a === excludeId || r.b === excludeId) continue;
      adj.get(r.a)?.add(r.b);
      adj.get(r.b)?.add(r.a);
    }
  }
  return adj;
}

function isConnected(adj) {
  const ids = [...adj.keys()];
  if (ids.length <= 1) return true;
  const seen = new Set([ids[0]]);
  const stack = [ids[0]];
  while (stack.length) {
    const cur = stack.pop();
    for (const next of adj.get(cur) || []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen.size === ids.length;
}

// Mirrors the server rule: a person can only be removed if doing so does not
// split the remaining tree into disconnected pieces.
export function canDeletePerson(tree, personId) {
  return isConnected(buildAdjacency(tree, personId));
}
