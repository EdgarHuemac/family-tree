import { useState } from "react";
import { EdgeLabelRenderer, getSmoothStepPath, getStraightPath } from "reactflow";

const KIND_META = {
  "parent-child": { label: "Padres e hijos", color: "#0071e3" },
  sibling: { label: "Hermanos", color: "#ff9500" },
  spouse: { label: "Cónyuges", color: "#ff2d55" },
};

const BASE_COLOR = "#c7c7cc";

export default function RelationEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const [hovered, setHovered] = useState(false);
  const kind = data?.kind || "parent-child";
  const meta = KIND_META[kind];

  const [edgePath, labelX, labelY] =
    kind === "parent-child"
      ? getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
      : getStraightPath({ sourceX, sourceY, targetX, targetY });

  const strokeColor = hovered ? meta.color : BASE_COLOR;

  return (
    <>
      {/* Wide invisible path to make hovering easy to trigger */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "pointer" }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={hovered ? 2.5 : 1.5}
        strokeDasharray={kind === "sibling" ? "4 4" : undefined}
        style={{ transition: "stroke 0.15s ease, stroke-width 0.15s ease", pointerEvents: "none" }}
      />
      {hovered && (
        <EdgeLabelRenderer>
          <div
            className="relation-edge-label nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: meta.color,
              color: meta.color,
            }}
          >
            {meta.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
