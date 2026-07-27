import BaseLayoutEngine from "./BaseLayoutEngine";
import RandomDistribution from "../RandomDistribution";

export default class RandomLayoutEngine extends BaseLayoutEngine {

    label(): string { return "Random"; }

    forLevel(_levelIndex: number, scale: number): RandomDistribution {
        return new RandomDistribution(scale, 3);
    }
}
