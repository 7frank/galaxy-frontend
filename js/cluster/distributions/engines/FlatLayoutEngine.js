import BaseLayoutEngine from "./BaseLayoutEngine";
import ForceGraphDistribution from "../ForceGraphDistribution";

export default class FlatLayoutEngine extends BaseLayoutEngine {

    label() { return "Flat"; }

    get dimensions() { return 2; }

    forLevel(levelIndex, scale) {
        return new ForceGraphDistribution(scale, 2);
    }

    applyToLeaf(leaf, scale) {
        leaf.mNodes && leaf.mNodes.forEach(node => {
            node.z = 0;
            node.vz = 0;
            if (node._bubble) node._bubble.position.z = 0;
        });
        leaf.setDistributionHandler(new ForceGraphDistribution(scale, 2), () => {
            leaf.adjustHullSize && leaf.adjustHullSize();
        });
    }
}
