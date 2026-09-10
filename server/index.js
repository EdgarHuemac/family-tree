import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "family-tree.json");
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");

const app = express();
app.use(express.json());

// ---------- Persistence helpers ----------

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initial = {
      people: [{ id: randomUUID(), name: "Yo", gender: "hombre", data: "" }],
      relations: [],
    };
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

async function readTree() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeTree(tree) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tree, null, 2));
}

// ---------- Graph helpers ----------

function findParents(tree, personId) {
  return tree.relations
    .filter((r) => r.type === "parent-child" && r.child === personId)
    .map((r) => tree.people.find((p) => p.id === r.parent))
    .filter(Boolean);
}

function findSpouseIds(tree, personId) {
  return tree.relations
    .filter((r) => r.type === "spouse" && (r.a === personId || r.b === personId))
    .map((r) => (r.a === personId ? r.b : r.a));
}

function buildAdjacency(tree, excludeId = null) {
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
  const queue = [ids[0]];
  while (queue.length) {
    const cur = queue.pop();
    for (const next of adj.get(cur) || []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === ids.length;
}

function canDelete(tree, personId) {
  const adjWithout = buildAdjacency(tree, personId);
  return isConnected(adjWithout);
}

// ---------- Routes ----------

app.get("/api/tree", async (req, res) => {
  const tree = await readTree();
  res.json(tree);
});

// Add a new person related to an existing one.
// relationType: "father" | "mother" | "sibling" | "spouse" | "child"
app.post("/api/person", async (req, res) => {
  const { name, gender, data, relationType, relativeId, spouseId } = req.body;
  if (!name || !gender || !relationType || !relativeId) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }
  const tree = await readTree();
  const relative = tree.people.find((p) => p.id === relativeId);
  if (!relative) return res.status(404).json({ error: "Sujeto no encontrado." });

  if (relationType === "father" || relationType === "mother") {
    const existingGender = relationType === "father" ? "hombre" : "mujer";
    const already = findParents(tree, relativeId).some(
      (p) => p.gender === existingGender
    );
    if (already) {
      return res
        .status(400)
        .json({ error: `Este sujeto ya tiene un/a ${relationType === "father" ? "padre" : "madre"}.` });
    }
  }

  let chosenSpouseId = null;
  if (relationType === "child") {
    const spouseIds = findSpouseIds(tree, relativeId);
    if (spouseIds.length === 0) {
      return res.status(400).json({
        error: "Este sujeto necesita un cónyuge antes de poder agregar hijos.",
      });
    }
    chosenSpouseId = spouseId && spouseIds.includes(spouseId) ? spouseId : spouseIds[0];
  }

  const newPerson = { id: randomUUID(), name, gender, data: data || "" };
  tree.people.push(newPerson);

  if (relationType === "father" || relationType === "mother") {
    tree.relations.push({ type: "parent-child", parent: newPerson.id, child: relativeId });
  } else if (relationType === "sibling") {
    const parents = findParents(tree, relativeId);
    if (parents.length > 0) {
      for (const parent of parents) {
        tree.relations.push({ type: "parent-child", parent: parent.id, child: newPerson.id });
      }
    } else {
      tree.relations.push({ type: "sibling", a: relativeId, b: newPerson.id });
    }
  } else if (relationType === "spouse") {
    tree.relations.push({ type: "spouse", a: relativeId, b: newPerson.id });
  } else if (relationType === "child") {
    tree.relations.push({ type: "parent-child", parent: relativeId, child: newPerson.id });
    tree.relations.push({ type: "parent-child", parent: chosenSpouseId, child: newPerson.id });
  } else {
    return res.status(400).json({ error: "Tipo de relación inválido." });
  }

  await writeTree(tree);
  res.json(tree);
});

app.put("/api/person/:id", async (req, res) => {
  const { id } = req.params;
  const { name, gender, data } = req.body;
  const tree = await readTree();
  const person = tree.people.find((p) => p.id === id);
  if (!person) return res.status(404).json({ error: "Sujeto no encontrado." });
  if (name !== undefined) person.name = name;
  if (gender !== undefined) person.gender = gender;
  if (data !== undefined) person.data = data;
  await writeTree(tree);
  res.json(tree);
});

app.get("/api/person/:id/can-delete", async (req, res) => {
  const tree = await readTree();
  res.json({ canDelete: canDelete(tree, req.params.id) });
});

app.delete("/api/person/:id", async (req, res) => {
  const { id } = req.params;
  const tree = await readTree();
  const exists = tree.people.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: "Sujeto no encontrado." });
  if (!canDelete(tree, id)) {
    return res.status(400).json({
      error: "No se puede eliminar: dejaría a otros sujetos desconectados del árbol.",
    });
  }
  tree.people = tree.people.filter((p) => p.id !== id);
  tree.relations = tree.relations.filter(
    (r) =>
      (r.type === "parent-child" && r.parent !== id && r.child !== id) ||
      ((r.type === "sibling" || r.type === "spouse") && r.a !== id && r.b !== id)
  );
  await writeTree(tree);
  res.json(tree);
});

// Serve built frontend in production
app.use(express.static(CLIENT_DIST));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(CLIENT_DIST, "index.html"), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor de Árbol Genealógico escuchando en http://localhost:${PORT}`);
});
