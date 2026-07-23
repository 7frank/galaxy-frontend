import "./ModeSelect.css";
import CsvDatasource from "../data/CsvDatasource";
import GeneratorDatasource from "../data/GeneratorDatasource";

const SOURCES = [
    { label: "CSV",    make: () => new CsvDatasource("assets/realDataNodesv5_ticker.csv", "assets/realDataLinksv5.csv") },
    { label: "1k",     make: () => new GeneratorDatasource({ nodeCount: 1000,  edgeCount: 2000 }) },
    { label: "5k",     make: () => new GeneratorDatasource({ nodeCount: 5000,  edgeCount: 10000 }) },
    { label: "10k",    make: () => new GeneratorDatasource({ nodeCount: 10000, edgeCount: 20000 }) },
    { label: "20k",    make: () => new GeneratorDatasource({ nodeCount: 20000, edgeCount: 40000 }) },
    { label: "50k",    make: () => new GeneratorDatasource({ nodeCount: 50000, edgeCount: 100000 }) },
];

class DataSourceSelect extends HTMLElement {

    connectedCallback() {
        this.innerHTML = `<label>Data:</label>`;

        SOURCES.forEach(({ label }, i) => {
            const btn = document.createElement("span");
            btn.textContent = label;
            if (i === 0) btn.classList.add("selected");
            btn.addEventListener("click", () => this._select(btn, label));
            this.appendChild(btn);
        });
    }

    _select(btn, label) {
        const app = document.querySelector("sample-cluster-application");
        const view = app && app.getCurrentView();
        if (!view) return;

        const entry = SOURCES.find(s => s.label === label);
        if (!entry) return;

        const ds = entry.make();
        if (ds.nodeCount !== undefined)
            console.log(`[DataSource] ${label}: ${ds.nodeCount} nodes, ${ds.edgeCount} edges`);
        view.loadDatasource(ds);

        this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
    }
}

customElements.define("datasource-select", DataSourceSelect);
