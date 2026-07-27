import BaseLayoutEngine from "./BaseLayoutEngine";
import ForceGraphDistribution from "../ForceGraphDistribution";

export default class ForceLayoutEngine extends BaseLayoutEngine {

    dimensions: number

    constructor(dimensions: number = 3) {
        super();
        this.dimensions = dimensions;
    }

    label(): string { return this.dimensions === 3 ? "3D" : "Plane"; }

    forLevel(_levelIndex: number, scale: number): ForceGraphDistribution {
        return new ForceGraphDistribution(scale, this.dimensions);
    }
}
