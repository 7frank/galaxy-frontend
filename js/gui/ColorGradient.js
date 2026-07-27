import { cycleGradient, getCurrentGradient, getAvailGradients, addGradient } from "../cluster/utils/ColorUtils";

const template = `
<style>
  :host {
    display: flex;
    align-items: center;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 32px;
    padding: 0 8px;
    box-sizing: border-box;
    pointer-events: none;
    z-index: 10;
  }
  .label {
    font-size: 12px;
    font-family: 'benchnine', sans-serif;
    color: rgba(255,255,255,0.6);
    white-space: nowrap;
    pointer-events: none;
  }
  .bar {
    flex: 1;
    height: 12px;
    margin: 0 8px;
    border-radius: 4px;
    cursor: pointer;
    pointer-events: all;
  }
</style>
<span class="label left-label"></span>
<div class="bar"></div>
<span class="label right-label"></span>
`;

class GraphColorGradient extends HTMLElement {
    constructor(...args) {
        super(...args);
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = template;
        this._bar = this.shadowRoot.querySelector('.bar');
        this._leftLabel = this.shadowRoot.querySelector('.left-label');
        this._rightLabel = this.shadowRoot.querySelector('.right-label');
    }

    static get observedAttributes() {
        return ['left-label', 'right-label', 'colors', 'src', 'gradients'];
    }

    connectedCallback() {
        this._leftLabel.textContent = this.getAttribute('left-label') ?? 'Negative';
        this._rightLabel.textContent = this.getAttribute('right-label') ?? 'Positive';

        this._applyExtraGradients();
        this._applyCurrentGradient();
        this._updateBarTitle();

        this._bar.addEventListener('click', () => {
            const next = cycleGradient();
            this._renderGradient(next);
            this._updateBarTitle();
            this._dispatch(next);
        });
    }

    attributeChangedCallback(name, _old, val) {
        if (!this.isConnected) return;
        if (name === 'left-label') this._leftLabel.textContent = val ?? 'Negative';
        if (name === 'right-label') this._rightLabel.textContent = val ?? 'Positive';
        if (name === 'gradients') { this._applyExtraGradients(); this._updateBarTitle(); }
        if (name === 'colors' || name === 'src') this._applyCurrentGradient();
    }

    _applyExtraGradients() {
        const attr = this.getAttribute('gradients');
        if (!attr) return;
        try {
            const entries = JSON.parse(attr);
            entries.forEach(({ name, colors, src }) => {
                if (src) {
                    addGradient(name ?? src, src);
                } else if (colors) {
                    addGradient(name ?? 'Custom', colors.map(c =>
                        typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c
                    ));
                }
            });
        } catch (e) {
            console.warn('graph-color-gradient: invalid gradients attribute', e);
        }
    }

    _updateBarTitle() {
        const gradients = getAvailGradients();
        const current = getCurrentGradient();
        const currentIdx = gradients.findIndex(g => g.colors === current);
        const currentName = currentIdx >= 0 ? gradients[currentIdx].name : 'Custom';
        const names = gradients.map(g => g.name).join(', ');
        this._bar.title = `${currentName} (click to cycle: ${names})`;
    }

    _applyCurrentGradient() {
        const src = this.getAttribute('src');
        if (src) {
            this._renderSrc(src);
        } else {
            const colors = this._parseColorsAttr() ?? getCurrentGradient();
            this._renderGradient(colors);
        }
    }

    _parseColorsAttr() {
        const attr = this.getAttribute('colors');
        if (!attr) return null;
        try {
            const parsed = JSON.parse(attr);
            if (Array.isArray(parsed)) return parsed.map(c =>
                typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c
            );
        } catch (_) {}
        return attr.split(',').map(s => {
            const t = s.trim();
            return t.startsWith('#') ? parseInt(t.slice(1), 16) : parseInt(t, 16);
        });
    }

    _renderGradient(colors) {
        const stops = colors.map(c => '#' + c.toString(16).padStart(6, '0'));
        this._bar.style.backgroundImage = `linear-gradient(to right, ${stops.join(',')})`;
    }

    _renderSrc(src) {
        this._bar.style.backgroundImage = `url(${src})`;
        this._bar.style.backgroundSize = '100% 100%';
    }

    _dispatch(colors) {
        const evt = new CustomEvent('gradient-change', { detail: colors, bubbles: true, composed: true });
        this.dispatchEvent(evt);
        window.dispatchEvent(new CustomEvent('gradient-change', { detail: colors }));
    }

    setColors(colors) {
        this._renderGradient(colors);
        this._dispatch(colors);
    }
}

if (!customElements.get('graph-color-gradient'))
    customElements.define('graph-color-gradient', GraphColorGradient);
