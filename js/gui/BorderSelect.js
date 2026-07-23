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

        let attached = 0;
        const allClusters = view.mRootCluster.findClusters("*");
        console.log('[BorderSelect] all clusters:', allClusters.length, allClusters.map(c => ({ name: c.name, hull: c.mHull?.constructor?.name, mesh: !!c.mHull?.mesh, isConvex: c.mHull instanceof ConvexVolume })));
        allClusters.forEach(cluster => {
            if (!cluster.mHull || !(cluster.mHull instanceof ConvexVolume) || !cluster.mHull.mesh) return;

            if (cluster._hullEffect) {
                cluster._hullEffect.onDetach(cluster.mHull.mesh);
            }

            const mode = cluster._hullMode || (cluster._hullEffect && cluster._hullEffect.mMode) || "hover";
            if (!cluster._hullMode) cluster._hullMode = mode;
            const effect = entry.makeEffect(mode, composer);
            cluster._hullEffect = effect;
            effect.onAttach(cluster.mHull.mesh);
            attached++;
            console.log('[BorderSelect] attached', label, 'mode=', mode, 'mesh=', cluster.mHull.mesh, 'composer=', composer);
        });
        console.log('[BorderSelect] total attached:', attached, 'composer:', composer, 'view.mBorderEffect:', view.mBorderEffect);

        if (composer) view.setBorderEffect(composer);
        console.log('[BorderSelect] after setBorderEffect, view.mBorderEffect:', view.mBorderEffect);

        this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
    }
}

customElements.define("border-select", BorderSelect);
