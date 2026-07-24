import { Vector3 } from "three/src/math/Vector3.js";
import { doOnClickNode } from "../cluster/refactor/f1";

function getView() {
    const app = document.querySelector("sample-cluster-application");
    return app && app.getCurrentView();
}

export function initEdgeIndicatorOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "edge-indicator-overlay";
    document.body.appendChild(overlay);

    let activeNode = null;
    let rafId = null;

    window.addEventListener("node-clicked", ({ detail: node }) => {
        activeNode = node;
        overlay.innerHTML = "";
        if (!node) {
            cancelAnimationFrame(rafId);
            rafId = null;
            return;
        }
        scheduleUpdate();
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
        const padding = 48;

        const neighbours = (activeNode.edges || []).map(edge => {
            const isOutgoing = edge.source === activeNode;
            const neighbour = isOutgoing ? edge.target : edge.source;
            return { node: neighbour, isOutgoing };
        }).filter(({ node }) => node && node._bubble);

        // rebuild indicators
        overlay.innerHTML = "";

        neighbours.forEach(({ node: neighbour, isOutgoing }) => {
            const worldPos = new Vector3();
            neighbour._bubble.getWorldPosition(worldPos);

            const projected = worldPos.clone().project(camera);
            const sx = (projected.x * 0.5 + 0.5) * W;
            const sy = (-projected.y * 0.5 + 0.5) * H;
            const behindCamera = projected.z > 1;

            const isOffscreen = behindCamera ||
                sx < padding || sx > W - padding ||
                sy < padding || sy > H - padding;

            if (!isOffscreen) return;

            // clamp to screen edge
            let cx = Math.max(padding, Math.min(W - padding, sx));
            let cy = Math.max(padding, Math.min(H - padding, sy));

            if (behindCamera) {
                cx = W - sx < W / 2 ? padding : W - padding;
                cy = H - sy < H / 2 ? padding : H - padding;
            }

            // angle from center to target (for arrow rotation)
            const dx = sx - W / 2;
            const dy = sy - H / 2;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            const color = isOutgoing ? "#99ff99" : "#ffb2b2";

            const el = document.createElement("div");
            el.className = "edge-indicator";
            el.style.left = cx + "px";
            el.style.top = cy + "px";
            el.style.setProperty("--arrow-color", color);
            el.style.setProperty("--arrow-angle", angle + "deg");

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
        });

        scheduleUpdate();
    }
}
