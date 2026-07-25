import BaseLayoutEngine from "./BaseLayoutEngine";
import ForceGraphDistribution from "../ForceGraphDistribution";
import type ClusterLeafElement from "../../ClusterLeafElement";
import type { GraphNode } from "../../particles/ParticleNodeGroup";

interface FlatNode extends GraphNode {
    vz?: number
    _bubble?: { position: { z: number } }
}

export default class FlatLayoutEngine extends BaseLayoutEngine {

    label(): string { return "Flat"; }

    get dimensions(): number { return 2; }

    forLevel(_levelIndex: number, scale: number): ForceGraphDistribution {
        return new ForceGraphDistribution(scale, 2);
    }

    applyToLeaf(leaf: ClusterLeafElement & { adjustHullSize?: () => void }, scale: number): void {
        leaf.mNodes && leaf.mNodes.forEach((node: FlatNode) => {
            node.z = 0;
            node.vz = 0;
            if (node._bubble) node._bubble.position.z = 0;
        });
        leaf.setDistributionHandler(new ForceGraphDistribution(scale, 2), () => {
            leaf.adjustHullSize && leaf.adjustHullSize();
        });
    }
}
