import { Vector3 } from "three/src/math/Vector3.js";
import { doOnClickNode } from "../cluster/refactor/f1";

function getView() {
    const app = document.querySelector("sample-cluster-application");
    return app && app.getCurrentView();
}

function clampToEdge(sx, sy, W, H, padding) {
    const cx = W / 2;
    const cy = H / 2;
    const dx = sx - cx;
    const dy = sy - cy;

    const minX = padding - cx;
    const maxX = W - padding - cx;
    const minY = padding - cy;
    const maxY = H - padding - cy;

    let tx = dx === 0 ? Infinity : (dx > 0 ? maxX : minX) / dx;
    let ty = dy === 0 ? Infinity : (dy > 0 ? maxY : minY) / dy;
    const t = Math.min(Math.abs(tx), Math.abs(ty));

    return {
        x: cx + dx * t,
        y: cy + dy * t,
    };
}

export function initEdgeIndicatorOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "edge-indicator-overlay";
    document.body.appendChild(overlay);

    let activeNode = null;
    let rafId = null;
    const indicators = new Map(); // key -> {el, arrow, label}

    function getOrCreate(key, isOutgoing, neighbour) {
        if (indicators.has(key)) return indicators.get(key);

        const color = isOutgoing ? "#99ff99" : "#ffb2b2";

        const el = document.createElement("div");
        el.className = "edge-indicator";
        el.style.setProperty("--arrow-color", color);

        const arrow = document.createElement("div");
        arrow.className = "edge-indicator-arrow";

        const label = document.createElement("div");
        label.className = "edge-indicator-label";
        label.textContent = neighbour.name || neighbour.id || "?";
        label.style.color = color;

        el.appendChild(arrow);
        el.appendChild(label);

        el.addEventListener("click", (e) => {
            e.stopPropagation();
            doOnClickNode(neighbour, false, null, true, true, true, true);
        });

        overlay.appendChild(el);
        const entry = { el, arrow, label };
        indicators.set(key, entry);
        return entry;
    }

    function clearAll() {
        indicators.forEach(({ el }) => el.remove());
        indicators.clear();
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

        const neighbours = (activeNode.edges || []).map((edge, i) => {
            const isOutgoing = edge.source === activeNode;
            const neighbour = isOutgoing ? edge.target : edge.source;
            return { node: neighbour, isOutgoing, key: i };
        }).filter(({ node }) => node && node._bubble);

        const activeKeys = new Set(neighbours.map(n => n.key));
        indicators.forEach((entry, key) => {
            if (!activeKeys.has(key)) { entry.el.remove(); indicators.delete(key); }
        });

        neighbours.forEach(({ node: neighbour, isOutgoing, key }) => {
            const worldPos = new Vector3();
            neighbour._bubble.getWorldPosition(worldPos);

            const projected = worldPos.clone().project(camera);
            const behindCamera = projected.z > 1;

            let sx = (projected.x * 0.5 + 0.5) * W;
            let sy = (-projected.y * 0.5 + 0.5) * H;

            if (behindCamera) {
                sx = W - sx;
                sy = H - sy;
            }

            const isOffscreen = behindCamera ||
                sx < padding || sx > W - padding ||
                sy < padding || sy > H - padding;

            const entry = getOrCreate(key, isOutgoing, neighbour);

            if (!isOffscreen) {
                entry.el.style.display = "none";
                return;
            }

            entry.el.style.display = "";

            const clamped = clampToEdge(sx, sy, W, H, padding);
            entry.el.style.left = clamped.x + "px";
            entry.el.style.top = clamped.y + "px";

            const dx = sx - W / 2;
            const dy = sy - H / 2;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            entry.el.style.setProperty("--arrow-angle", angle + "deg");
        });

        scheduleUpdate();
    }
}
