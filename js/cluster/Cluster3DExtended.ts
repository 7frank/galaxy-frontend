/**
 * Created by Frank on 06.06.2017.
 */

import _ from "lodash";
import BaseCluster3D from "./BaseCluster3D"
import BaseDistribution from "./distributions/BaseDistribution"
import ForceGraphDistribution from "./distributions/ForceGraphDistribution"
import ZoomUtil from "../utils/ZoomUtil"
import type { GraphNode } from "./particles/ParticleNodeGroup"
import type ClusterLeafElement from "./ClusterLeafElement"
import type View3D from "../view/View3D"
import { Object3D } from "three/src/core/Object3D.js";

export default class Cluster3DExtended extends BaseCluster3D {

    selected: boolean

    constructor(nodes: GraphNode[] | undefined, clusteringHandlers: Record<string, unknown>, view: View3D) {
        super(nodes, clusteringHandlers, view);
        this.selected = false;
        this.addListeners();
    }

    zoomToCluster(defaultDistance: number = 400): void {
        const distance = this.getRadius(defaultDistance) * 3;
        ZoomUtil.moveToCluster(this, { distance });
    }

    addListeners(): void {
        let curr = 0;

        function onClickFactory(res: Cluster3DExtended, speccs: Array<{ distribution: BaseDistribution }>) {
            return function clickAndSpeccHandler() {
                const _dist = speccs[curr++ % speccs.length].distribution;
                console.log("setting distribution function", _dist);
                res.setDistributionHandler(_dist, function onComplete() {
                    res.adjustHullSize();
                    if (res.isLeaf()) {
                        res.updateIfIsLeaf();
                    }
                });
            };
        }

        this.on("z dblclick", function (this: Cluster3DExtended, e: Event) {
            (e as any).stopPropagation();
            this.zoomToCluster();
        });

        let diameter: number | null = null;
        this.on("s", function (this: Cluster3DExtended, e: Event) {
            (e as any).stopPropagation();
            if (!diameter)
                diameter = (this.geometry as any).boundingSphere.radius * 2;
            console.log("clicky clicky", diameter);
            const speccsRoot = [
                { distribution: new BaseDistribution(diameter!, 1) },
                { distribution: new BaseDistribution(diameter! * 0.66, 2) },
                { distribution: new BaseDistribution(diameter! * 0.33, 3) },
                { distribution: new ForceGraphDistribution(diameter! * 0.66, 3) }
            ];
            onClickFactory(this, speccsRoot)();
        });

        this.on("a", function (this: Cluster3DExtended, e: Event) {
            (e as any).stopPropagation();
            if (!diameter)
                diameter = (this.geometry as any).boundingSphere.radius * 2;
            console.log("clicky clicky", diameter);
            const speccsRoot = [
                { distribution: new ForceGraphDistribution(diameter! * 0.66, 3) }
            ];
            onClickFactory(this, speccsRoot)();
        });

        this.on("mouseover", function (this: Cluster3DExtended, e: Event) {
            (e as any).stopPropagation();

            if (this.mHull) {
                if (this.mHull.mesh) (this.mHull.mesh as any).material.visible = this.mHull.canBeVisible();
                this.mHull.setActive();
            }

            const name = (this.name ? this.name : this.id);
            const parents = this.getParents();

            if (parents.length == 0) {
                this.getView().setTooltip("");
                return;
            }

            parents.shift();
            const root = parents.map((p: BaseCluster3D) => p.name ? p.name : p.id).join(" - ");
            this.getView().setTooltip(root + " " + name);
        });

        this.on("mouseout", function (this: Cluster3DExtended, e: Event) {
            (e as any).stopPropagation();
            if (this.mHull) {
                this.mHull.setInactive();
            }
            this.getView().setTooltip("");
        });

        this.on("t", function (this: Cluster3DExtended, e: Event) {
            (e as any).stopPropagation();
            this.toggleSelect();
        });
    }

    update(): void {
        super.update();
        if (this.isLeaf())
            if (this.mLeaf && this.getView())
                this.mLeaf.updateDots(this.getView().mTime);
    }

    appendNodes(nodes: GraphNode[]): void {
        const that = this;
        _.each(nodes, function (node: GraphNode & { _bubble?: Object3D }) {
            if (node && node._bubble)
                that.mExpandedGroup.add(node._bubble);
        });
    }

    isSelected(): boolean {
        return this.selected;
    }

    toggleSelect(): void {
        if (this.isSelected())
            this.unselectCluster();
        else
            this.selectCluster();
    }

    selectCluster(): void {
        if (this.isSelected()) return;

        const allLeafs = this.getRoot().getLeafs();
        const mLeafs = this.getLeafs();

        _.each(allLeafs, function (other: ClusterLeafElement) {
            const isChildOfCluster = mLeafs.indexOf(other) >= 0;
            if (other.parent) (other.parent as any).visible = isChildOfCluster;
        });

        this.selected = true;
    }

    unselectCluster(): void {
        if (!this.isSelected()) return;

        const allLeafs = this.getRoot().getLeafs();

        _.each(allLeafs, function (other: ClusterLeafElement) {
            if (other.parent) (other.parent as any).visible = true;
        });

        this.selected = false;
    }
}
