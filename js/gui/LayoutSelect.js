import "./ModeSelect.css";
import ForceLayoutEngine from "../cluster/distributions/engines/ForceLayoutEngine";
import DagreLayoutEngine from "../cluster/distributions/engines/DagreLayoutEngine";

const ENGINES = [
    new ForceLayoutEngine(3),
    new ForceLayoutEngine(2),
    new DagreLayoutEngine("LR"),
    new DagreLayoutEngine("TB"),
];


class LayoutSelect extends HTMLElement {

    setView(view) { this._view = view; return this; }

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
        const view = this._view;
        if (!view || !view._currentDatasource) return;

        const speccs = view.getSpeccs();
        if (!speccs) return;

        speccs.forEach((spec, i) => {
            const existingScale = spec.distribution ? spec.distribution.mScale : null;
            if (existingScale !== null) {
                spec.distribution = engine.forLevel(i, existingScale);
            }
        });

        view.loadDatasource(view._currentDatasource);

        this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
    }
}

customElements.define("layout-select", LayoutSelect);
