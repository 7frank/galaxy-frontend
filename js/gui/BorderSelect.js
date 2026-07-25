import "./ModeSelect.css";
import NoneHullEffect from "../cluster/hull/effects/NoneHullEffect";
import BasicHullEffect from "../cluster/hull/effects/BasicHullEffect";
import BoxHullEffect from "../cluster/hull/effects/BoxHullEffect";
import ConvexVolume from "../cluster/hull/ConvexVolume";

const EFFECTS = [
    { label: "None",    makeEffect: () => new NoneHullEffect(),  makeComposer: () => null },
    { label: "Outline", makeEffect: null, makeComposer: null, lazy: true },
    { label: "Basic",   makeEffect: () => new BasicHullEffect(), makeComposer: () => null },
    { label: "Box",     makeEffect: () => new BoxHullEffect(),   makeComposer: () => null },
];

class BorderSelect extends HTMLElement {

    connectedCallback() {
        this.innerHTML = `<label>Border:</label>`;

        EFFECTS.forEach(({ label }, i) => {
            const btn = document.createElement("span");
            btn.textContent = label;
            if (i === 1) btn.classList.add("selected");
            btn.addEventListener("click", () => this._select(btn, label));
            this.appendChild(btn);
        });
    }

    _select(btn, label) {
        const app = document.querySelector("sample-cluster-application");
        const view = app && app.getCurrentView();
        if (!view || !view.mRootCluster) return;

        const entry = EFFECTS.find(e => e.label === label);
        if (!entry) return;

        const apply = (makeEffect, makeComposer) => {
            if (view.mBorderEffect) {
                view.mBorderEffect.dispose();
                view.mBorderEffect = null;
            }
            const composer = makeComposer(view);
            view.mRootCluster.findClusters("*").forEach(cluster => {
                if (!cluster.mHull || !(cluster.mHull instanceof ConvexVolume) || !cluster.mHull.mesh) return;
                if (cluster._hullEffect) cluster._hullEffect.onDetach(cluster.mHull.mesh);
                const mode = cluster._hullMode || (cluster._hullEffect && cluster._hullEffect.mMode) || "hover";
                if (!cluster._hullMode) cluster._hullMode = mode;
                const effect = makeEffect(mode, composer);
                cluster._hullEffect = effect;
                effect.onAttach(cluster.mHull.mesh);
            });
            if (composer) view.setBorderEffect(composer);
            this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
            btn.classList.add("selected");
        };

        if (entry.lazy) {
            import("../cluster/hull/effects/OutlineHullEffect.js").then(({ default: OutlineHullEffect, OutlineComposer }) => {
                apply(
                    (mode, c) => new OutlineHullEffect(mode, c),
                    (v) => { const c = new OutlineComposer(); c.init(v.mRenderer, v.mScene, v.mCamera); return c; }
                );
            });
        } else {
            apply(entry.makeEffect, entry.makeComposer);
        }
    }
}

customElements.define("border-select", BorderSelect);
