import Datasource from "./Datasource";

const GROUPS = [
    "United States", "Germany", "China", "United Kingdom", "Japan",
    "France", "India", "Brazil", "Canada", "Australia"
];

const INDUSTRIES = [
    "Technology", "Finance", "Healthcare", "Energy", "Consumer Goods",
    "Industrials", "Materials", "Utilities", "Real Estate", "Telecommunications"
];

const FIRST = ["Alpha", "Beta", "Gamma", "Delta", "Sigma", "Apex", "Nova", "Vega", "Orion", "Nexus",
    "Prime", "Core", "Titan", "Atlas", "Zenith", "Crest", "Forte", "Lumen", "Pulse", "Quasar"];
const LAST = ["Corp", "Industries", "Group", "Holdings", "Systems", "Solutions", "Technologies",
    "Partners", "Ventures", "Capital", "Labs", "Works", "Dynamics", "Global", "International"];

export default class GeneratorDatasource extends Datasource {

    constructor({ nodeCount = 100, edgeCount = 150, seed = 42, maxItemsPerNode = 20, clusterEdgeBias = 0 } = {}) {
        super();
        this.nodeCount = nodeCount;
        this.edgeCount = edgeCount;
        this.seed = seed;
        this.maxItemsPerNode = maxItemsPerNode;
        this.clusterEdgeBias = clusterEdgeBias;
    }

    _rng(s) {
        let x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    }

    load(onSuccess) {
        const { nodeCount, edgeCount } = this;
        let s = this.seed;
        const rnd = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

        const nodes = {};
        for (let i = 0; i < nodeCount; i++) {
            const id = "" + (i + 1);
            const first = FIRST[Math.floor(rnd() * FIRST.length)];
            const last = LAST[Math.floor(rnd() * LAST.length)];
            nodes[id] = {
                id,
                name: `${first} ${last}`,
                group: GROUPS[Math.floor(rnd() * GROUPS.length)],
                industry: INDUSTRIES[Math.floor(rnd() * INDUSTRIES.length)],
                sent: +(rnd() * 2 - 1).toFixed(3),
                price: +(rnd() * 1000).toFixed(2),
                itemCount: Math.floor(rnd() * this.maxItemsPerNode) + 1,
                ticker: first.slice(0, 3).toUpperCase() + (Math.floor(rnd() * 9) + 1),
                color: 0x00ff00
            };
        }

        const nodeList = Object.values(nodes);
        const byGroup = {};
        nodeList.forEach(n => { (byGroup[n.group] = byGroup[n.group] || []).push(n.id); });
        const groupKeys = Object.keys(byGroup);

        const links = [];
        const nodeIds = Object.keys(nodes);
        const edgeSet = new Set();
        let attempts = 0;
        while (links.length < edgeCount && attempts < edgeCount * 10) {
            attempts++;
            let a, b;
            if (this.clusterEdgeBias > 0 && rnd() < this.clusterEdgeBias) {
                const group = byGroup[groupKeys[Math.floor(rnd() * groupKeys.length)]];
                if (group.length < 2) continue;
                a = group[Math.floor(rnd() * group.length)];
                b = group[Math.floor(rnd() * group.length)];
            } else {
                a = nodeIds[Math.floor(rnd() * nodeIds.length)];
                b = nodeIds[Math.floor(rnd() * nodeIds.length)];
            }
            if (a === b) continue;
            const key = a < b ? `${a}:${b}` : `${b}:${a}`;
            if (edgeSet.has(key)) continue;
            edgeSet.add(key);
            links.push([a, b]);
        }

        onSuccess({
            nodes,
            links,
            expand: { [GROUPS[0]]: true },
            hasCountryGroups: true
        });
    }
}
