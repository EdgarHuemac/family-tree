import { useCallback, useEffect, useState } from "react";
import FamilyTree from "./components/FamilyTree.jsx";
import ContextMenu from "./components/ContextMenu.jsx";
import PersonModal from "./components/PersonModal.jsx";
import { api } from "./lib/api.js";
import { canDeletePerson, hasParentOfGender, getSpouses } from "./lib/graph.js";

export default function App() {
  const [tree, setTree] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [menu, setMenu] = useState(null); // { personId, x, y }
  const [modal, setModal] = useState(null); // { mode, ... }
  const [modalError, setModalError] = useState(null);

  const loadTree = useCallback(() => {
    api
      .getTree()
      .then((t) => {
        setTree(t);
        setLoadError(null);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const closeMenu = useCallback(() => setMenu(null), []);
  const closeModal = useCallback(() => {
    setModal(null);
    setModalError(null);
  }, []);

  const openMenu = useCallback((personId, x, y) => {
    setMenu({ personId, x, y });
  }, []);

  const openEdit = useCallback((personId) => {
    setMenu(null);
    setModal({ mode: "edit", personId });
  }, []);

  function handleMenuAction(relationType, relativeId, extra = {}) {
    const genderMap = {
      father: "hombre",
      mother: "mujer",
      "sibling-m": "hombre",
      "sibling-f": "mujer",
      "spouse-m": "hombre",
      "spouse-f": "mujer",
      "child-m": "hombre",
      "child-f": "mujer",
    };
    const labelMap = {
      father: "padre",
      mother: "madre",
      "sibling-m": "hermano",
      "sibling-f": "hermana",
      "spouse-m": "cónyuge",
      "spouse-f": "cónyuge",
      "child-m": "hijo",
      "child-f": "hija",
    };
    let normalizedType = relationType;
    if (relationType.startsWith("sibling")) normalizedType = "sibling";
    if (relationType.startsWith("spouse")) normalizedType = "spouse";
    if (relationType.startsWith("child")) normalizedType = "child";

    setModal({
      mode: "create",
      relativeId,
      relationType: normalizedType,
      relationLabel: labelMap[relationType],
      gender: genderMap[relationType],
      spouseOptions: extra.spouseOptions || [],
    });
  }

  async function handleSave(fields) {
    try {
      if (modal.mode === "create") {
        await api.addPerson({
          name: fields.name,
          gender: fields.gender,
          data: fields.data,
          relationType: modal.relationType,
          relativeId: modal.relativeId,
          spouseId: fields.spouseId,
        });
      } else {
        await api.updatePerson(modal.personId, fields);
      }
      closeModal();
      loadTree();
    } catch (e) {
      setModalError(e.message);
    }
  }

  async function handleDelete() {
    try {
      await api.deletePerson(modal.personId);
      closeModal();
      loadTree();
    } catch (e) {
      setModalError(e.message);
    }
  }

  if (loadError) {
    return (
      <div className="state-screen">
        <p>No se pudo conectar con el servidor.</p>
        <p className="state-screen__detail">{loadError}</p>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="state-screen">
        <p>Cargando árbol…</p>
      </div>
    );
  }

  const menuPerson = menu ? tree.people.find((p) => p.id === menu.personId) : null;
  const menuSpouses = menuPerson ? getSpouses(tree, menuPerson.id) : [];
  const menuOptions = menuPerson
    ? [
        {
          label: "Agregar padre",
          disabled: hasParentOfGender(tree, menuPerson.id, "hombre"),
          onSelect: () => handleMenuAction("father", menuPerson.id),
        },
        {
          label: "Agregar madre",
          disabled: hasParentOfGender(tree, menuPerson.id, "mujer"),
          onSelect: () => handleMenuAction("mother", menuPerson.id),
        },
        {
          label: "Agregar hermano",
          onSelect: () => handleMenuAction("sibling-m", menuPerson.id),
        },
        {
          label: "Agregar hermana",
          onSelect: () => handleMenuAction("sibling-f", menuPerson.id),
        },
        {
          label: "Agregar cónyuge (hombre)",
          onSelect: () => handleMenuAction("spouse-m", menuPerson.id),
        },
        {
          label: "Agregar cónyuge (mujer)",
          onSelect: () => handleMenuAction("spouse-f", menuPerson.id),
        },
        {
          label: "Agregar hijo",
          disabled: menuSpouses.length === 0,
          hint: menuSpouses.length === 0 ? "Agrega primero un cónyuge" : undefined,
          onSelect: () =>
            handleMenuAction("child-m", menuPerson.id, { spouseOptions: menuSpouses }),
        },
        {
          label: "Agregar hija",
          disabled: menuSpouses.length === 0,
          hint: menuSpouses.length === 0 ? "Agrega primero un cónyuge" : undefined,
          onSelect: () =>
            handleMenuAction("child-f", menuPerson.id, { spouseOptions: menuSpouses }),
        },
      ]
    : [];

  const editingPerson =
    modal?.mode === "edit" ? tree.people.find((p) => p.id === modal.personId) : null;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Árbol Genealógico</h1>
        <p className="app__hint">
          Clic derecho para agregar familiares · Clic izquierdo para editar
        </p>
      </header>

      <div className="app__canvas">
        <FamilyTree
          tree={tree}
          onOpenEdit={openEdit}
          onOpenMenu={openMenu}
          onPaneClick={closeMenu}
        />
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} options={menuOptions} onClose={closeMenu} />
      )}

      {modal?.mode === "create" && (
        <PersonModal
          mode="create"
          createContext={{
            relationLabel: modal.relationLabel,
            gender: modal.gender,
            relationType: modal.relationType,
            relativeId: modal.relativeId,
            spouseOptions: modal.spouseOptions,
          }}
          error={modalError}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {modal?.mode === "edit" && editingPerson && (
        <PersonModal
          mode="edit"
          person={editingPerson}
          canDelete={canDeletePerson(tree, editingPerson.id)}
          error={modalError}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
