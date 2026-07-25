import ForceGraphDistribution from "./distributions/ForceGraphDistribution";
import ConvexVolume from "./hull/ConvexVolume";
import BaseVolume from "./hull/BaseVolume";
import BasicHullEffect from "./hull/effects/BasicHullEffect";
import NoneHullEffect from "./hull/effects/NoneHullEffect";
import type { ClusterSpec, ClusterOptions } from "./BaseCluster3D";
import type { GraphNode } from "./particles/ParticleNodeGroup";

const DEFAULT_DISTRIBUTION_SCALES = [40000, 15000, 8000, 4000, 2000];

export class ClusteringUtils {

    static clusterBy(
        key: string,
        distribution?: InstanceType<typeof ForceGraphDistribution>,
        options?: ClusterOptions
    ): ClusterSpec {
        return {
            generator: (groupFn: (key: string, node: GraphNode) => void, node: GraphNode) => {
                groupFn((node as unknown as Record<string, string>)[key], node);
            },
            distribution: distribution ?? new ForceGraphDistribution(15000, 3),
            options
        };
    }

    static buildSpeccs(
        keys: string[],
        options: {
            distributions?: InstanceType<typeof ForceGraphDistribution>[]
            hullOptions?: ClusterOptions
        } = {}
    ): ClusterSpec[] {
        const { distributions, hullOptions } = options;

        const specs: ClusterSpec[] = keys.map((key, i) => {
            const scale = DEFAULT_DISTRIBUTION_SCALES[i] ?? DEFAULT_DISTRIBUTION_SCALES[DEFAULT_DISTRIBUTION_SCALES.length - 1];
            const dist = distributions?.[i] ?? new ForceGraphDistribution(scale, 3);
            const defaultOptions: ClusterOptions = i === 0
                ? { minClusterSize: 40, hull: BaseVolume, makeHullEffect: () => new NoneHullEffect() }
                : { minClusterSize: 15, hull: ConvexVolume, makeHullEffect: () => new BasicHullEffect(), hullBorderMode: "hover" };
            return ClusteringUtils.clusterBy(key, dist, hullOptions ?? defaultOptions);
        });

        const leafScale = DEFAULT_DISTRIBUTION_SCALES[keys.length] ?? DEFAULT_DISTRIBUTION_SCALES[DEFAULT_DISTRIBUTION_SCALES.length - 1];
        const leafDist = distributions?.[keys.length] ?? new ForceGraphDistribution(leafScale, 3);
        specs.push({
            distribution: leafDist,
            options: hullOptions ?? {
                hull: ConvexVolume,
                makeHullEffect: () => new BasicHullEffect(),
                hullBorderMode: "ambient"
            }
        });

        return specs;
    }
}
