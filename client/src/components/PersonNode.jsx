import { memo } from "react";
import { Handle, Position } from "reactflow";
import { User, UserRound } from "lucide-react";

function PersonNode({ data }) {
  const { person, onOpenEdit, onOpenMenu } = data;
  const isFemale = person.gender === "mujer";
  const Icon = isFemale ? UserRound : User;

  return (
    <div
      className="person-node"
      onClick={(e) => {
        e.stopPropagation();
        onOpenEdit(person.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenMenu(person.id, e.clientX, e.clientY);
      }}
    >
      <Handle type="target" position={Position.Top} className="rf-handle" />
      <div className="person-node__rect">
        <span className="person-node__name">{person.name}</span>
        <span className={`person-node__icon person-node__icon--${person.gender}`}>
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>

      <div className="person-node__expand">
        <div className="person-node__expand-row">
          <span className="person-node__label">Nombre</span>
          <span className="person-node__value">{person.name}</span>
        </div>
        <div className="person-node__expand-row">
          <span className="person-node__label">Género</span>
          <span className="person-node__value person-node__value--capitalize">
            {person.gender}
          </span>
        </div>
        <div className="person-node__expand-row person-node__expand-row--data">
          <span className="person-node__label">Datos</span>
          <span className="person-node__value">
            {person.data ? person.data : "—"}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="rf-handle" />
    </div>
  );
}

export default memo(PersonNode);
