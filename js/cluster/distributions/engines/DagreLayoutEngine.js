import BaseLayoutEngine from "./BaseLayoutEngine";
import DagreDistribution from "../DagreDistribution";

export default class DagreLayoutEngine extends BaseLayoutEngine {

    constructor(rankdir = "LR") {
        super();
        this.rankdir = rankdir;
    }

    label() { return `Dagre ${this.rankdir}`; }

    forLevel(levelIndex, scale) {
        return new DagreDistribution(scale, this.rankdir);
    }
}
