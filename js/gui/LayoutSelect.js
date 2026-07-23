import "./ModeSelect.css";
import ForceLayoutEngine from "../cluster/distributions/engines/ForceLayoutEngine";
import FlatLayoutEngine from "../cluster/distributions/engines/FlatLayoutEngine";
import SphericalLayoutEngine from "../cluster/distributions/engines/SphericalLayoutEngine";
import RandomLayoutEngine from "../cluster/distributions/engines/RandomLayoutEngine";

const ENGINES = [
    new ForceLayoutEngine(3),
    new ForceLayoutEngine(2),
    new FlatLayoutEngine(),
    new SphericalLayoutEngine(),
    new RandomLayoutEngine(),
];


class LayoutSelect extends HTMLElement {

    connectedCallback() {
        this.innerHTML = `<label>Layout:</label>`;

        ENGINES.forEach((engine, i) => {
            const btn = document.createElement("span");
            btn.textContent = engine.label();
            if (i === 0) btn.classList.add("selected");
            btn.addEventListener("click", () => this._select(btn, engine));
            this.appendChild(btn);
        });
    }

    _select(btn, engine) {
        const app = document.querySelector("sample-cluster-application");
        const view = app && app.getCurrentView();
        if (!view || !view.mRootCluster) return;

        const is2D = engine.dimensions !== undefined && engine.dimensions < 3;

        const scramble = (children, scale) => {
            children.forEach(child => {
                const rx = (Math.random() - 0.5) * scale * 0.1;
                const ry = (Math.random() - 0.5) * scale * 0.1;
                const rz = is2D ? 0 : (Math.random() - 0.5) * scale * 0.1;
                const pos = child.position;
                pos.x = rx; pos.y = ry; pos.z = rz;
                pos.vx = 0; pos.vy = 0; pos.vz = 0;
                child.position.set(rx, ry, rz);
            });
        };

        const applyToCluster = (cluster) => {
            const children = Object.values(cluster.mClusters || {});
            if (!children.length) return;

            const rule = cluster.mClusterRule;
            const dist = rule && rule.distribution;
            const scale = dist ? dist.mScale : (cluster.getDepth() === 0 ? 40000 : 15000);
            const depth = cluster.getDepth();

            scramble(children, scale);
            console.log(`[LayoutSelect] ${engine.label()} — ${children.length} children at depth ${depth}, scale ${scale}`);
            cluster.setDistributionHandler(engine.forLevel(depth, scale));
        };

        applyToCluster(view.mRootCluster);
        view.mRootCluster.findClusters("*").forEach(applyToCluster);

        if (engine.applyToLeaf) {
            view.mRootCluster.getLeafs().forEach(leaf => {
                const leafDist = leaf.mClusterRule && leaf.mClusterRule.distribution;
                const leafScale = leafDist ? leafDist.mScale : 8000;
                engine.applyToLeaf(leaf, leafScale);
            });
        } else if (is2D) {
            view.mRootCluster.getLeafs().forEach(leaf => {
                (leaf.mNodes || []).forEach(node => {
                    if (node._bubble) { node._bubble.position.z = 0; node.z = 0; }
                    node.z = 0;
                });
                leaf.adjustHullSize && leaf.adjustHullSize();
            });
        }

        this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
    }
}

customElements.define("layout-select", LayoutSelect);
