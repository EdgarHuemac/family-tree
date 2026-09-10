import { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import PersonNode from "./PersonNode.jsx";
import RelationEdge from "./RelationEdge.jsx";
import { layoutGraph } from "../lib/layout.js";

const nodeTypes = { person: PersonNode };
const edgeTypes = { relation: RelationEdge };

export default function FamilyTree({ tree, onOpenEdit, onOpenMenu, onPaneClick }) {
  const { nodes, edges } = useMemo(() => {
    const rawNodes = tree.people.map((person) => ({
      id: person.id,
      type: "person",
      data: { person, onOpenEdit, onOpenMenu },
      position: { x: 0, y: 0 },
    }));

    const rawEdges = tree.relations.map((r, i) => {
      if (r.type === "parent-child") {
        return {
          id: `pc-${r.parent}-${r.child}-${i}`,
          source: r.parent,
          target: r.child,
          type: "relation",
          data: { kind: "parent-child" },
        };
      }
      const prefix = r.type === "spouse" ? "sp" : "sib";
      return {
        id: `${prefix}-${r.a}-${r.b}-${i}`,
        source: r.a,
        target: r.b,
        type: "relation",
        data: { kind: r.type },
      };
    });

    return { nodes: layoutGraph(rawNodes, rawEdges), edges: rawEdges };
  }, [tree, onOpenEdit, onOpenMenu]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={onPaneClick}
      onNodeDragStart={onPaneClick}
      fitView
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e5e5ea" gap={24} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
