"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Pattern, Connection } from "@/lib/types";
import { USER_ACCENT } from "@/lib/types";
import { colorForPattern, labelForPattern } from "@/lib/palette";

// react-force-graph-2d pulls in canvas/DOM APIs — client only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[color:var(--text-muted)] text-[13px]">
      Loading graph…
    </div>
  ),
});

type GNode = {
  id: string;
  pattern: Pattern;
  // force-graph mutates these at runtime:
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
};
type GLink = { source: string; target: string };

export default function PatternGraph({
  patterns,
  connections,
  selectedId,
  onSelect,
  searchQuery,
  highlightIds,
}: {
  patterns: Pattern[];
  connections: Connection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  searchQuery: string;
  highlightIds: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, links, degree } = useMemo(() => {
    const nodes: GNode[] = patterns.map((p) => ({ id: p.id, pattern: p }));
    const ids = new Set(nodes.map((n) => n.id));
    const links: GLink[] = connections
      .filter((c) => ids.has(c.from) && ids.has(c.to))
      .map((c) => ({ source: c.from, target: c.to }));
    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    }
    return { nodes, links, degree };
  }, [patterns, connections]);

  // Center/zoom to fit once when data loads.
  useEffect(() => {
    if (!fgRef.current) return;
    const t = setTimeout(() => {
      fgRef.current?.zoomToFit(600, 80);
    }, 400);
    return () => clearTimeout(t);
  }, [nodes.length]);

  // Focus on a selected node. The force-graph mutates our `nodes` array
  // in place with x/y coordinates, so we read from it directly.
  useEffect(() => {
    if (!selectedId || !fgRef.current) return;
    const node = nodes.find((n) => n.id === selectedId);
    if (node && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(3, 600);
    }
  }, [selectedId, nodes]);

  const anyHighlight = highlightIds.size > 0 || !!searchQuery.trim();

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={{ nodes: nodes as any, links: links as any }}
        backgroundColor="#f7f7f7"
        cooldownTicks={120}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.32}
        linkColor={() => "rgba(0,0,0,0.08)"}
        linkWidth={0.6}
        linkDirectionalParticles={0}
        nodeRelSize={3}
        nodeLabel={(n: any) =>
          `<div style="font-family: system-ui; font-size: 12px; padding: 4px 8px; background: #1a1a1a; color: #fff; border-radius: 4px;">${escapeHtml(
            labelForPattern(n.pattern),
          )}</div>`
        }
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const p: Pattern = node.pattern;
          const deg = degree.get(node.id) ?? 0;
          const base = 2.2 + Math.sqrt(deg) * 1.4;
          const isSel = node.id === selectedId;
          const isHi = highlightIds.has(node.id);
          const dim = anyHighlight && !isHi && !isSel;

          const color = colorForPattern(p);
          ctx.globalAlpha = dim ? 0.15 : 1;

          // Node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, isSel ? base + 2 : base, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          if (isSel) {
            ctx.strokeStyle = USER_ACCENT;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Label when zoomed in, or when highlighted/selected
          if (globalScale > 1.6 || isSel || isHi) {
            const label = labelForPattern(p);
            const fontSize = Math.max(10 / globalScale, 3.5);
            ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
            ctx.fillStyle = "#1a1a1a";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(label, node.x + base + 3, node.y);
          }

          ctx.globalAlpha = 1;
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          const deg = degree.get(node.id) ?? 0;
          const base = 2.2 + Math.sqrt(deg) * 1.4;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, base + 3, 0, 2 * Math.PI);
          ctx.fill();
        }}
        onNodeClick={(node: any) => onSelect(node.id)}
        onBackgroundClick={() => onSelect(null)}
      />
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
