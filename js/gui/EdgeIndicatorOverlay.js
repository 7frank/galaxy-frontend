import { Vector3 } from "three/src/math/Vector3.js";
import { doOnClickNode } from "../cluster/GraphElementExtension";
import "./EdgeIndicatorOverlay.css";

const SECTOR_COUNT = 24;
const SECTOR_DEG = 360 / SECTOR_COUNT;

let _viewOverride = null;

function getView() {
    if (_viewOverride) return _viewOverride;
    const app = document.querySelector("sample-cluster-application");
    return app && app.getCurrentView();
}

function clampToEdge(sx, sy, W, H, padding) {
    const cx = W / 2;
    const cy = H / 2;
    const dx = sx - cx;
    const dy = sy - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const minX = padding - cx;
    const maxX = W - padding - cx;
    const minY = padding - cy;
    const maxY = H - padding - cy;
    const tx = dx === 0 ? Infinity : (dx > 0 ? maxX : minX) / dx;
    const ty = dy === 0 ? Infinity : (dy > 0 ? maxY : minY) / dy;
    const t = Math.min(Math.abs(tx), Math.abs(ty));
    return { x: cx + dx * t, y: cy + dy * t };
}

function angleToSector(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return Math.floor(normalized / SECTOR_DEG) % SECTOR_COUNT;
}

export function initEdgeIndicatorOverlay(view = null) {
    if (view) _viewOverride = view;
    const overlay = document.createElement("div");
    overlay.className = "edge-indicator-overlay";
    document.body.appendChild(overlay);

    let activeNode = null;
    let rafId = null;
    const indicators = new Map(); // sectorKey -> {el, nodes}

    function clearAll() {
        indicators.forEach(({ el }) => el.remove());
        indicators.clear();
        overlay.innerHTML = "";
    }

    window.addEventListener("node-clicked", ({ detail: node }) => {
        activeNode = node;
        clearAll();
        cancelAnimationFrame(rafId);
        rafId = null;
        if (node) scheduleUpdate();
    });

    function scheduleUpdate() {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(update);
    }

    function update() {
        if (!activeNode) return;
        const view = getView();
        if (!view || !view.mCamera) return;

        const camera = view.mCamera;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const padding = 52;

        // project all neighbours
        const projected = (activeNode.edges || []).map((edge) => {
            const isOutgoing = edge.source === activeNode;
            const neighbour = isOutgoing ? edge.target : edge.source;
            if (!neighbour || !neighbour._bubble) return null;

            const worldPos = new Vector3();
            neighbour._bubble.getWorldPosition(worldPos);
            const proj = worldPos.clone().project(camera);
            const behindCamera = proj.z > 1;

            let sx = (proj.x * 0.5 + 0.5) * W;
            let sy = (-proj.y * 0.5 + 0.5) * H;
            if (behindCamera) { sx = W - sx; sy = H - sy; }

            const offscreen = behindCamera || sx < padding || sx > W - padding || sy < padding || sy > H - padding;
            const angle = Math.atan2(sy - H / 2, sx - W / 2) * 180 / Math.PI;
            const sector = angleToSector(angle);
            const clamped = clampToEdge(sx, sy, W, H, padding);

            return { neighbour, isOutgoing, offscreen, angle, sector, clamped, sx, sy };
        }).filter(Boolean);

        // bucket by sector
        const buckets = new Map();
        projected.forEach(item => {
            if (!buckets.has(item.sector)) buckets.set(item.sector, []);
            buckets.get(item.sector).push(item);
        });

        // remove stale indicators
        const activeSectors = new Set(buckets.keys());
        indicators.forEach((entry, key) => {
            if (!activeSectors.has(key)) { entry.el.remove(); indicators.delete(key); }
        });

        buckets.forEach((items, sector) => {
            const anyOffscreen = items.some(i => i.offscreen);
            const primary = items[0];
            const rest = items.slice(1);
            const isOutgoing = primary.isOutgoing;
            const color = isOutgoing ? "#99ff99" : "#ffb2b2";

            let entry = indicators.get(sector);
            if (!entry) {
                const el = document.createElement("div");
                el.className = "edge-indicator";

                const arrow = document.createElement("div");
                arrow.className = "edge-indicator-arrow";

                const label = document.createElement("div");
                label.className = "edge-indicator-label";

                const list = document.createElement("div");
                list.className = "edge-indicator-list";

                el.appendChild(arrow);
                el.appendChild(label);
                el.appendChild(list);

                el.addEventListener("mousedown", (e) => { e.stopPropagation(); e.preventDefault(); });
                el.addEventListener("mouseup",   (e) => { e.stopPropagation(); e.preventDefault(); });
                el.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const current = indicators.get(sector);
                    if (current && current.primaryNode) doOnClickNode(current.primaryNode);
                });

                overlay.appendChild(el);
                entry = { el, arrow, label, list, primaryNode: null, listKey: "" };
                indicators.set(sector, entry);
            }

            // update position & style
            entry.primaryNode = primary.neighbour;
            const { el, arrow, label, list } = entry;
            const pos = anyOffscreen ? primary.clamped : { x: primary.sx, y: primary.sy };
            el.style.left = pos.x + "px";
            el.style.top  = pos.y + "px";
            el.classList.toggle("near-bottom", pos.y > H * 0.6);
            el.style.setProperty("--arrow-color", color);
            el.style.setProperty("--arrow-angle", primary.angle + "deg");
            el.style.opacity = "1";
            arrow.style.opacity = anyOffscreen ? "1" : "0.3";

            label.style.color = color;
            label.textContent = primary.neighbour.name || primary.neighbour.id || "?";
            if (rest.length > 0) label.textContent += ` +${rest.length}`;
            list.style.display = rest.length === 0 ? "none" : "flex";

            // only rebuild list when contents changed
            const listKey = items.map(i => i.neighbour.id || i.neighbour.name).join(",");
            if (entry.listKey !== listKey) {
                entry.listKey = listKey;
                list.innerHTML = "";
                items.forEach(item => {
                    const row = document.createElement("div");
                    row.className = "edge-indicator-list-item";
                    row.textContent = item.neighbour.name || item.neighbour.id || "?";
                    row.style.color = item.isOutgoing ? "#99ff99" : "#ffb2b2";
                    row.addEventListener("mousedown", (e) => { e.stopPropagation(); e.preventDefault(); });
                    row.addEventListener("click", (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        doOnClickNode(item.neighbour);
                    });
                    list.appendChild(row);
                });
            }
        });

        scheduleUpdate();
    }
}
