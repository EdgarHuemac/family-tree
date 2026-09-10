const BASE = "/api";

async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Error de red");
  return body;
}

export const api = {
  getTree: () => fetch(`${BASE}/tree`).then(handle),

  addPerson: ({ name, gender, data, relationType, relativeId, spouseId }) =>
    fetch(`${BASE}/person`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gender, data, relationType, relativeId, spouseId }),
    }).then(handle),

  updatePerson: (id, { name, gender, data }) =>
    fetch(`${BASE}/person/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gender, data }),
    }).then(handle),

  deletePerson: (id) =>
    fetch(`${BASE}/person/${id}`, { method: "DELETE" }).then(handle),
};
