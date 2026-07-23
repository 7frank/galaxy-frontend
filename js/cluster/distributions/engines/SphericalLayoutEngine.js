import BaseLayoutEngine from "./BaseLayoutEngine";
import SphericalDistribution from "../SphericalDistribution";

export default class SphericalLayoutEngine extends BaseLayoutEngine {

    label() { return "Spherical"; }

    forLevel(levelIndex, scale) {
        return new SphericalDistribution(scale);
    }
}
