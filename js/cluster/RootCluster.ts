/**
 * Created by Frank on 06.06.2017.
 */
import Cluster3DExtended from "./Cluster3DExtended"

import ClusterTextOverlay from "./text/ClusterTextOverlay"
import DefaultColorScheme from "./utils/DefaultColorScheme"

import {computeCompanyNodeColor, computeGroupNodeColorHelper} from "./refactor/SpecificDataUtils"
import _ from "lodash";
import type View3D from "../view/View3D";

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

    constructor(...args: any[]) {
        super(...args)

        this.useClusterText = true;

        this.on("hull-updated", function (this: RootCluster) {
            this.findClusters("*").forEach(function (cluster: any) {
                cluster.useLOD = true
            })
        })

        this.addColorHandler()
    }

    addListeners(): void {

        super.addListeners();

        this.on("u", (e: any) => {
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

        function getCountryNamesFromNodes(nodes: any[]) {
            var res: Record<string, boolean> = {}
            _.each(nodes, (n) => res[n.group] = true)
            return Object.keys(res)
        }

        function updateParticles(leaf: any) {
            if (leaf && leaf.mParticles) {
                leaf.mParticles.updateColors();
            } else {
                setTimeout(() => updateParticles(leaf), 100)
            }
        }

        var countryNames: string[] | null = null;

        window.addEventListener("node-color-change", function (e: any) {
            var val = e.detail;

            if (!countryNames) countryNames = getCountryNamesFromNodes(nodes)

            var helper = computeGroupNodeColorHelper(countryNames)

            if (val == "group")
                nodes.forEach(function (v: any) {
                    v.color = helper.getColor(v.group)
                });
            else
                nodes.forEach(function (v: any) {
                    v.color = computeCompanyNodeColor(parseInt(v.sent), val)
                })

            _.each(that.getLeafs(), function (leaf: any) {
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


    applyClustering(mClusteringSpeccsArray: any, overrideExpand: boolean = false): any {
        super.applyClustering(mClusteringSpeccsArray, overrideExpand)
        this.resetTextOverlay()
    }
}
