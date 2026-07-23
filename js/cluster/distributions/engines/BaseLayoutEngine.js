export default class BaseLayoutEngine {

    label() { return "Base"; }

    forLevel(levelIndex, scale, dimensions) {
        throw new Error("forLevel() must be implemented");
    }
}
