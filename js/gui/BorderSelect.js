import "./ModeSelect.css";
import BaseBorderEffect from "../cluster/borders/BaseBorderEffect";
import OutlineBorderEffect from "../cluster/borders/OutlineBorderEffect";
import ToonBorderEffect from "../cluster/borders/ToonBorderEffect";

const EFFECTS = [
    { label: "None",    factory: () => new BaseBorderEffect() },
    { label: "Outline", factory: () => new OutlineBorderEffect() },
    { label: "Toon",    factory: () => new ToonBorderEffect() },
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
        if (!view) return;

        const entry = EFFECTS.find(e => e.label === label);
        if (!entry) return;

        if (view.mBorderEffect) {
            view.mBorderEffect.dispose();
        }

        view.setBorderEffect(entry.factory());

        if (view.mRootCluster && view.updateOutlineSelection) {
            view.updateOutlineSelection();
        }

        this.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
    }
}

customElements.define("border-select", BorderSelect);
