import BaseLayoutEngine from "./BaseLayoutEngine";
import DagreDistribution from "../DagreDistribution";

export default class DagreLayoutEngine extends BaseLayoutEngine {

    rankdir: string

    constructor(rankdir: string = "LR") {
        super();
        this.rankdir = rankdir;
    }

    label(): string { return `Dagre ${this.rankdir}`; }

    forLevel(_levelIndex: number, scale: number): DagreDistribution {
        return new DagreDistribution(scale, this.rankdir);
    }
}
