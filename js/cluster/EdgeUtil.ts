/**
 * Created by Frank on 02.06.2017.
 */

import BaseCluster3D from "./BaseCluster3D"
import _ from "lodash";
import type { GraphNode } from "./particles/ParticleNodeGroup";

export type EdgeNode = GraphNode & { edges?: ClusterEdge[] }

export interface ClusterEdge {
    source: BaseCluster3D | EdgeNode
    target: BaseCluster3D | EdgeNode
    link_strength?: number
    isSrcInternalNode?: boolean
    isTrgInternalNode?: boolean
}

export interface ClusterRelationInfo {
    clustersConnectedTo: Record<string, BaseCluster3D>
    edges: Record<string, ClusterEdge[]>
    nodes: Record<string, ClusterEdge[]>
}

export default class EdgeUtil {

    static getConnectedClusters(): void {
        // stub: finds external nodes of a cluster
    }

    static createEdgesBetweenClustersFromMap(clustersContainer: Record<string, InstanceType<typeof BaseCluster3D>>): ClusterEdge[] {
        const info = EdgeUtil.getClusterInfo(clustersContainer);
        const clusterKeys = Object.keys(clustersContainer);
        const edgesArray: ClusterEdge[] = [];

        _.each(clusterKeys, function (key: string) {
            const otherClusterKeys = Object.keys(info[key].clustersConnectedTo);

            _.each(otherClusterKeys, function (otherKey: string) {
                const otherClusters = info[key].clustersConnectedTo;
                const edgesForCluster = info[key].edges;
                const linkStrength = _.sum(_.map(edgesForCluster, (el: ClusterEdge[]) => el.length));

                edgesArray.push({
                    source: clustersContainer[key],
                    target: otherClusters[otherKey],
                    link_strength: linkStrength
                });
            });
        });

        return edgesArray;
    }

    static getClusterInfo(clustersContainer: Record<string, InstanceType<typeof BaseCluster3D>>): Record<string, ClusterRelationInfo> {
        const relevantEdgesPerCluster: Record<string, ClusterEdge[]> = {};

        _.each(clustersContainer, function (cluster: BaseCluster3D, id: string) {
            relevantEdgesPerCluster[id] = [];
            const nodes = cluster.getNodes();
            const edges = EdgeUtil.getEdgesForNodes(nodes, false, true, true);
            relevantEdgesPerCluster[id] = edges;
        });

        function isNodeOfCluster(node: BaseCluster3D | EdgeNode, cluster: BaseCluster3D): boolean {
            return cluster.getNodes().indexOf(node as EdgeNode) >= 0;
        }

        function lookUpClustersOfNode(node: BaseCluster3D | EdgeNode): Record<string, BaseCluster3D> {
            const clustersForNode: Record<string, BaseCluster3D> = {};
            _.each(clustersContainer, function (cluster: BaseCluster3D, id: string) {
                if (isNodeOfCluster(node, cluster))
                    clustersForNode[id] = cluster;
            });
            return clustersForNode;
        }

        const clustersContainerRelationInfo: Record<string, ClusterRelationInfo> = {};

        _.each(relevantEdgesPerCluster, function (clusterExternalEdges: ClusterEdge[], clusterID: string) {
            clustersContainerRelationInfo[clusterID] = {
                clustersConnectedTo: {},
                edges: {},
                nodes: {}
            };

            _.each(clusterExternalEdges, function (externalEdge: ClusterEdge) {
                const testNode = isNodeOfCluster(externalEdge.source, clustersContainer[clusterID]);
                const otherNode = testNode ? externalEdge.target : externalEdge.source;

                const clustersThatContainNode = lookUpClustersOfNode(otherNode);
                delete clustersThatContainNode[clusterID];

                Object.assign(clustersContainerRelationInfo[clusterID].clustersConnectedTo, clustersThatContainNode);

                const keys = Object.keys(clustersThatContainNode);

                _.each(keys, function (key: string) {
                    if (!clustersContainerRelationInfo[clusterID].edges[key])
                        clustersContainerRelationInfo[clusterID].edges[key] = [];
                    clustersContainerRelationInfo[clusterID].edges[key].push(externalEdge);

                    if (!clustersContainerRelationInfo[clusterID].nodes[key])
                        clustersContainerRelationInfo[clusterID].nodes[key] = [];
                    clustersContainerRelationInfo[clusterID].nodes[key].push(externalEdge);
                });
            });
        });

        return clustersContainerRelationInfo;
    }

    static getEdgesForNodes(
        nodes: Array<EdgeNode | BaseCluster3D>,
        bInternal: boolean = true,
        bOutgoing: boolean = false,
        bIngoing: boolean = false
    ): ClusterEdge[] {
        if (!bInternal && !bOutgoing && !bIngoing) return [];

        let edges: ClusterEdge[] = [];

        _.each(nodes, function (node: EdgeNode | BaseCluster3D) {
            if (node instanceof BaseCluster3D) {
                const _edges = EdgeUtil.getEdgesForNodes(node.mNodes, bInternal, bOutgoing, bIngoing);
                edges = edges.concat(_edges);
                edges = _.uniq(edges);
                return;
            }

            _.each((node as EdgeNode).edges, function (edge: ClusterEdge) {
                const srcContained = nodes.indexOf(edge.source) >= 0;
                const trgContained = nodes.indexOf(edge.target) >= 0;

                const isInternalNode = srcContained && trgContained;
                const isOutgoing = !isInternalNode && srcContained;
                const isIngoing = !isInternalNode && trgContained;

                function pushit(e: ClusterEdge) {
                    e.isSrcInternalNode = srcContained;
                    e.isTrgInternalNode = trgContained;
                    edges.push(e);
                }

                if (bInternal && bOutgoing && bIngoing)
                    pushit(edge);
                else if (bInternal && isInternalNode || bOutgoing && isOutgoing || bIngoing && isIngoing)
                    pushit(edge);
            });
        });

        return edges;
    }
}
