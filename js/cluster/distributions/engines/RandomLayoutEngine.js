import BaseLayoutEngine from "./BaseLayoutEngine";
import RandomDistribution from "../RandomDistribution";

export default class RandomLayoutEngine extends BaseLayoutEngine {

    label() { return "Random"; }

    forLevel(levelIndex, scale) {
        return new RandomDistribution(scale, 3);
    }
}
