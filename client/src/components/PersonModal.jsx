import { useEffect, useState } from "react";

// mode: "create" | "edit"
// createContext: { relationLabel, gender, relationType, relativeId } (mode === "create")
// person: existing person object (mode === "edit")
export default function PersonModal({
  mode,
  person,
  createContext,
  canDelete,
  onSave,
  onDelete,
  onClose,
  error,
}) {
  const [name, setName] = useState(mode === "edit" ? person.name : "");
  const [gender, setGender] = useState(
    mode === "edit" ? person.gender : createContext.gender
  );
  const [data, setData] = useState(mode === "edit" ? person.data : "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isChildCreation = mode === "create" && createContext.relationType === "child";
  const [spouseId, setSpouseId] = useState(
    isChildCreation ? createContext.spouseOptions?.[0]?.id : undefined
  );

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const title =
    mode === "create" ? `Agregar ${createContext.relationLabel}` : "Editar sujeto";

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal__title">{title}</h2>

        <label className="modal__field">
          <span>Nombre</span>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
          />
        </label>

        <label className="modal__field">
          <span>Género</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            disabled={mode === "create"}
          >
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>
        </label>

        <label className="modal__field">
          <span>Datos</span>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Fecha de nacimiento, notas, etc."
            rows={4}
          />
        </label>

        {isChildCreation && createContext.spouseOptions.length > 1 && (
          <label className="modal__field">
            <span>Cónyuge (el otro padre/madre)</span>
            <select value={spouseId} onChange={(e) => setSpouseId(e.target.value)}>
              {createContext.spouseOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="modal__error">{error}</p>}

        {mode === "edit" && !canDelete && (
          <p className="modal__hint">
            No se puede eliminar: tiene relaciones que dejarían a otros sujetos
            desconectados del árbol.
          </p>
        )}

        <div className="modal__actions">
          {mode === "edit" &&
            (confirmingDelete ? (
              <div className="modal__confirm-delete">
                <span>¿Eliminar a {person.name}?</span>
                <button className="btn btn--danger" onClick={onDelete}>
                  Sí, eliminar
                </button>
                <button className="btn btn--ghost" onClick={() => setConfirmingDelete(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                className="btn btn--danger-outline"
                disabled={!canDelete}
                onClick={() => setConfirmingDelete(true)}
              >
                Eliminar sujeto
              </button>
            ))}

          <div className="modal__actions-right">
            <button className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              disabled={!name.trim()}
              onClick={() => onSave({ name: name.trim(), gender, data, spouseId })}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
