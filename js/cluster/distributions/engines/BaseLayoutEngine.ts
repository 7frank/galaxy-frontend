import BaseDistribution from "../BaseDistribution";

export default class BaseLayoutEngine {

    label(): string { return "Base"; }

    forLevel(_levelIndex: number, _scale: number, _dimensions?: number): BaseDistribution {
        throw new Error("forLevel() must be implemented");
    }
}
