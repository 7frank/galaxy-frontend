import BaseLayoutEngine from "./BaseLayoutEngine";
import ForceGraphDistribution from "../ForceGraphDistribution";

export default class ForceLayoutEngine extends BaseLayoutEngine {

    constructor(dimensions = 3) {
        super();
        this.dimensions = dimensions;
    }

    label() { return this.dimensions === 3 ? "3D" : "Plane"; }

    forLevel(levelIndex, scale) {
        return new ForceGraphDistribution(scale, this.dimensions);
    }
}
