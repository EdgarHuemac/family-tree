import dagre from "dagre";

export const NODE_WIDTH = 176;
export const NODE_HEIGHT = 56;

// Lays out nodes top-down: parents above children, siblings side by side.
export function layoutGraph(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 96, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => {
    // Parent-child edges define the vertical hierarchy (minlen 1: child is
    // always at least one rank below). Spouse/sibling edges use minlen 0 so
    // dagre is free to keep those pairs on the same rank instead of forcing
    // one below the other.
    const kind = e.data?.kind;
    const minlen = kind === "spouse" || kind === "sibling" ? 0 : 1;
    g.setEdge(e.source, e.target, { minlen });
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}
