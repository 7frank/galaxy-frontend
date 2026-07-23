import "./ModeSelect.css";
import NoneHullEffect from "../cluster/hull/effects/NoneHullEffect";
import ToonHullEffect from "../cluster/hull/effects/ToonHullEffect";
import OutlineHullEffect, { OutlineComposer } from "../cluster/hull/effects/OutlineHullEffect";
import ConvexVolume from "../cluster/hull/ConvexVolume";

const EFFECTS = [
    { label: "None",    makeEffect: () => new NoneHullEffect(),                        makeComposer: () => null },
    { label: "Outline", makeEffect: (mode, c) => new OutlineHullEffect(mode, c),       makeComposer: (v) => { const c = new OutlineComposer(); c.init(v.mRenderer, v.mScene, v.mCamera); return c; } },
    { label: "Toon",    makeEffect: () => new ToonHullEffect(),                        makeComposer: () => null },
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

        if (view.mBorderEffect) {
            view.mBorderEffect.dispose();
            view.mBorderEffect = null;
        }

        const composer = entry.makeComposer(view);

        view.mRootCluster.findClusters("*").forEach(cluster => {
            if (!cluster.mHull || !(cluster.mHull instanceof ConvexVolume) || !cluster.mHull.mesh) return;

            if (cluster._hullEffect) {
                cluster._hullEffect.onDetach(cluster.mHull.mesh);
            }

            const mode = (cluster.getClusterOptions && cluster.getClusterOptions().hullBorderMode) || "hover";
            const effect = entry.makeEffect(mode, composer);
            cluster._hullEffect = effect;
            effect.onAttach(cluster.mHull.mesh);
        });

        if (composer) view.setBorderEffect(composer);

        this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
    }
}

customElements.define("border-select", BorderSelect);
