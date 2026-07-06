import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import { depth, docs, edges } from "../lib/content";

interface Node extends SimulationNodeDatum {
  id: string;
  title: string;
  group: string;
  r: number;
}
type Link = SimulationLinkDatum<Node>;

interface Props {
  active: string;
  onSelect: (slug: string) => void;
}

export function Graph({ active, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 800 });
  const [, force] = useState(0); // re-render à chaque tick
  const [hover, setHover] = useState<string | null>(null);
  // Facteur d'espacement piloté à la molette (1 = disposition compacte).
  const [spacing, setSpacing] = useState(1.45);
  const dragging = useRef<Node | null>(null);
  // Déplacement de la vue (pan) en glissant le fond.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );

  // Nœuds & liens construits une seule fois (mutés par la simulation).
  const { nodes, links, sim } = useMemo(() => {
    const nodes: Node[] = docs.map((d) => ({
      id: d.slug,
      title: d.title,
      group: d.group,
      // Taille = importance : la racine (VisionForge) est la plus grosse,
      // puis la taille décroît avec la profondeur dans l'arborescence.
      r: Math.max(6, 20 - depth(d.slug) * 6),
    }));
    const links: Link[] = edges.map((e) => ({ ...e }));
    const sim = forceSimulation<Node>(nodes)
      .force(
        "link",
        forceLink<Node, Link>(links)
          .id((n) => n.id)
          .distance(70)
          .strength(0.35),
      )
      .force("charge", forceManyBody<Node>().strength(-230))
      .force("collide", forceCollide<Node>((n) => n.r + 14))
      .alphaDecay(0.045);
    return { nodes, links, sim: sim as Simulation<Node, Link> };
  }, []);

  // Boucle de simulation : re-render React à chaque tick.
  useEffect(() => {
    sim.on("tick", () => force((t) => t + 1));
    return () => {
      sim.on("tick", null);
      sim.stop();
    };
  }, [sim]);

  // Suivi de la taille du conteneur → recentre la simulation.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
      // Centre décalé vers la droite : le cœur du graphe reste dans la zone
      // dégagée (cliquable), et déborde derrière le texte à gauche.
      const cx = width >= 768 ? width * 0.8 : width / 2;
      sim.force("center", forceCenter(cx, height / 2));
      sim.alpha(0.6).restart();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [sim]);

  // Recentre / réveille la simulation quand le doc actif change.
  useEffect(() => {
    sim.alpha(0.4).restart();
  }, [active, sim]);

  // Molette sur le graphe : ajuste l'espacement entre les nœuds
  // (distance des liens, répulsion et rayon anti-collision).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Molette vers le haut → on écarte ; vers le bas → on resserre.
      setSpacing((s) =>
        Math.min(Math.max(s * Math.exp(-e.deltaY * 0.0012), 0.4), 3),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Réapplique les forces en fonction de l'espacement.
  useEffect(() => {
    const link = sim.force("link") as ReturnType<
      typeof forceLink<Node, Link>
    > | null;
    const charge = sim.force("charge") as ReturnType<
      typeof forceManyBody<Node>
    > | null;
    link?.distance(70 * spacing);
    charge?.strength(-230 * spacing);
    sim.force(
      "collide",
      forceCollide<Node>((n) => n.r + 14 * spacing),
    );
    sim.alpha(0.5).restart();
  }, [spacing, sim]);

  // Mode « focus » : n'afficher que la note active et ses voisines directes.
  const [focus, setFocus] = useState(false);

  const neighbors = useMemo(() => {
    const set = new Set<string>();
    for (const e of edges) {
      if (e.source === active) set.add(e.target);
      if (e.target === active) set.add(e.source);
    }
    return set;
  }, [active]);

  // Drag d'un nœud.
  const toLocal = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const onDown = (e: React.PointerEvent, n: Node) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = n;
    sim.alphaTarget(0.3).restart();
  };
  // Glisser le fond (et non un nœud) déplace la vue.
  const onSvgDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const n = dragging.current;
    if (n) {
      const p = toLocal(e);
      n.fx = p.x - pan.x;
      n.fy = p.y - pan.y;
      return;
    }
    const start = panRef.current;
    if (start) {
      setPan({
        x: start.x + (e.clientX - start.px),
        y: start.y + (e.clientY - start.py),
      });
    }
  };
  const onUp = () => {
    const n = dragging.current;
    if (n) {
      n.fx = null;
      n.fy = null;
    }
    dragging.current = null;
    panRef.current = null;
    sim.alphaTarget(0);
  };

  const linkId = (v: Link["source"]) =>
    typeof v === "object" ? (v as Node).id : String(v);

  // En mode focus : visible = note active + voisines directes.
  const visible = (id: string) =>
    !focus || id === active || neighbors.has(id);

  return (
    <div className="absolute inset-0" ref={wrapRef}>
      <svg
        width={size.w}
        height={size.h}
        className="block touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onSvgDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y})`}>
        <g>
          {links.map((l, i) => {
            const s = l.source as Node;
            const t = l.target as Node;
            if (!visible(linkId(l.source)) || !visible(linkId(l.target)))
              return null;
            const touched =
              linkId(l.source) === active ||
              linkId(l.target) === active ||
              linkId(l.source) === hover ||
              linkId(l.target) === hover;
            return (
              <line
                // biome-ignore lint/suspicious/noArrayIndexKey: liens stables
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                strokeWidth={touched ? 1.4 : 1}
                className={
                  touched
                    ? "stroke-accent/70 transition-[stroke]"
                    : "stroke-line transition-[stroke]"
                }
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            if (!visible(n.id)) return null;
            const isActive = n.id === active;
            const isNear = neighbors.has(n.id);
            const dim = active && !isActive && !isNear;
            const lit = isActive || isNear || hover === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
                className={`cursor-pointer transition-opacity ${dim ? "opacity-50" : ""}`}
                onPointerDown={(e) => onDown(e, n)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                onClick={() => onSelect(n.id)}
              >
                {isActive && (
                  <circle
                    r={n.r + 7}
                    className="animate-pulse fill-none stroke-accent/40"
                  />
                )}
                <circle
                  r={n.r}
                  strokeWidth={2}
                  className={`transition-[fill] duration-200 [stroke:rgb(var(--void))] ${
                    lit ? "fill-accent" : "fill-[rgb(var(--node))]"
                  }`}
                />
                <text
                  x={n.r + 7}
                  y={4}
                  className={`pointer-events-none font-sans text-[11.5px] transition-[fill] ${
                    lit ? "fill-ink" : "fill-ink-faint"
                  }`}
                >
                  {n.title}
                </text>
              </g>
            );
          })}
        </g>
        </g>
      </svg>

      <button
        type="button"
        onClick={() => setFocus((f) => !f)}
        aria-pressed={focus}
        title="N'afficher que les notes reliées à la note actuelle"
        className={`absolute bottom-11 right-3 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.72rem] backdrop-blur transition ${
          focus
            ? "border-accent/60 bg-accent/15 text-accent"
            : "border-line bg-panel/70 text-ink-dim hover:border-ink-faint hover:text-ink"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        Notes reliées
      </button>

      <div className="pointer-events-none absolute bottom-3 right-3 select-none rounded-full border border-line bg-panel/70 px-2.5 py-1 text-[0.7rem] text-ink-faint backdrop-blur">
        molette : espacement · glisser le fond : déplacer
      </div>
    </div>
  );
}
