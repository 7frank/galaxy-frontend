import ForceGraphDistribution from "./distributions/ForceGraphDistribution";
import type BaseDistribution from "./distributions/BaseDistribution";
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
        distribution?: BaseDistribution,
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
        levels: (string | {
            key?: string
            distribution?: BaseDistribution
            hullOptions?: ClusterOptions
        })[]
    ): ClusterSpec[] {
        const specs: ClusterSpec[] = levels.map((levelRaw, i) => {
            const level = typeof levelRaw === 'string' ? { key: levelRaw } : levelRaw;
            const scale = DEFAULT_DISTRIBUTION_SCALES[i] ?? DEFAULT_DISTRIBUTION_SCALES[DEFAULT_DISTRIBUTION_SCALES.length - 1];
            const dist = level.distribution ?? new ForceGraphDistribution(scale, 3);
            if (level.key) {
                const defaultOptions: ClusterOptions = i === 0
                    ? { minClusterSize: 40, hull: BaseVolume, makeHullEffect: () => new NoneHullEffect() }
                    : { minClusterSize: 15, hull: ConvexVolume, makeHullEffect: () => new BasicHullEffect(), hullBorderMode: "hover" };
                return ClusteringUtils.clusterBy(level.key, dist, level.hullOptions ?? defaultOptions);
            }
            return {
                distribution: dist,
                options: level.hullOptions ?? {
                    hull: ConvexVolume,
                    makeHullEffect: () => new BasicHullEffect(),
                    hullBorderMode: "ambient"
                }
            };
        });

        return specs;
    }
}
