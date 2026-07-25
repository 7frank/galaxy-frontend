/**
 * Created by Frank on 06.06.2017.
 */
import Cluster3DExtended from "./Cluster3DExtended"
import type { ClusterSpec } from "./BaseCluster3D"

import ClusterTextOverlay from "./text/ClusterTextOverlay"
import DefaultColorScheme from "./utils/DefaultColorScheme"

import {computeCompanyNodeColor, computeGroupNodeColorHelper} from "./utils/ColorUtils"
import _ from "lodash";
import type View3D from "../view/View3D";
import type { GraphNode } from "./particles/ParticleNodeGroup";

/**
 *
 *  a RootCluster is a root node that contains additional rendering infos over multiple nodes
 * for example: it handles node captions (text nodes)
 */

export default class RootCluster extends Cluster3DExtended {

    declare mParentView: View3D
    mTextOverlay: InstanceType<typeof ClusterTextOverlay>
    mColorScheme: InstanceType<typeof DefaultColorScheme> | undefined
    mLock: boolean | undefined
    declare useClusterText: boolean

    constructor(nodes: GraphNode[] | undefined, clusteringHandlers: ClusterSpec[] | undefined, view: View3D) {
        super(nodes, clusteringHandlers, view)

        this.useClusterText = true;

        this.on("hull-updated", function (this: RootCluster) {
            this.findClusters("*").forEach(function (cluster: Cluster3DExtended & { useLOD?: boolean }) {
                cluster.useLOD = true
            })
        })

        this.addColorHandler()
    }

    addListeners(): void {

        super.addListeners();

        this.on("u", (e: Event & { stopPropagation: () => void }) => {
            e.stopPropagation();
            this.useClusterText = !this.useClusterText;
            console.log("useClusterText", this.useClusterText)
        });
    }


    addColorScheme(cs: InstanceType<typeof DefaultColorScheme>): void {

        if (!(cs instanceof DefaultColorScheme)) {
            console.warn("set proper color scheme")
        }

        this.mColorScheme = cs
    }


    addColorHandler(): void {

        var nodes = this.mNodes;
        var that = this

        function getCountryNamesFromNodes(nodes: Array<GraphNode & { group?: string }>) {
            var res: Record<string, boolean> = {}
            _.each(nodes, (n) => { if (n.group) res[n.group] = true })
            return Object.keys(res)
        }

        function updateParticles(leaf: { mParticles?: { updateColors: () => void } } | null) {
            if (leaf && leaf.mParticles) {
                leaf.mParticles.updateColors();
            } else {
                setTimeout(() => updateParticles(leaf), 100)
            }
        }

        var countryNames: string[] | null = null;

        window.addEventListener("node-color-change", function (e: Event) {
            const ce = e as CustomEvent<string>;
            var val = ce.detail;

            if (!countryNames) countryNames = getCountryNamesFromNodes(nodes)

            var helper = computeGroupNodeColorHelper(countryNames)

            if (val == "group")
                nodes.forEach(function (v: GraphNode & { group?: string }) {
                    v.color = helper.getColor(v.group)
                });
            else
                nodes.forEach(function (v: GraphNode & { sent?: string }) {
                    v.color = computeCompanyNodeColor(parseInt(v.sent ?? "0"), val)
                })

            _.each(that.getLeafs(), function (leaf: { mNodeParticles?: { update: () => void }; mParticles?: { updateColors: () => void } }) {
                leaf.mNodeParticles.update()
                updateParticles(leaf)
            })
        })
    }


    /**
     * @override
     * prevent multiple recursive root clusters from being created by default
     */
    getChildClusterConstructor(): typeof Cluster3DExtended {
        return Cluster3DExtended;
    }


    /**
     * attaches the root cluster to a specific View3D element
     */
    attachToView3D(view3D: View3D): void {
        this.mParentView = view3D
    }


    resetTextOverlay(): void {
        if (this.mTextOverlay) this.mTextOverlay.el.remove()

        this.mTextOverlay = new ClusterTextOverlay();
        this.mTextOverlay.init(this.mParentView);

        this.mParentView.el.appendChild(this.mTextOverlay.el)
    }


    isLocked(): boolean {
        return this.mLock == true
    }

    setLock(bLocked: boolean = true): boolean {
        return this.mLock = bLocked
    }


    applyClustering(mClusteringSpeccsArray: ClusterSpec[], overrideExpand: boolean = false): boolean | undefined {
        const result = super.applyClustering(mClusteringSpeccsArray, overrideExpand)
        this.resetTextOverlay()
        return result
    }
}
