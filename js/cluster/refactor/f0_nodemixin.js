/**
 * Created by Frank on 16.07.2017.
 */

import {basicElementExtend, basicSpriteSize} from "./f0-basic-element-3d-classes"

import {highlightNodeElements,} from "./f1"

import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";

var sphereGeometry = new SphereGeometry(1, 3, 2);

var singleNodeMaterial = new MeshBasicMaterial({
    color: 0xffff00, wireframe: true, visible: false, opacity: 1, transparent: true,
    alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

});


/**
 *
 * TODO this should already have been replaced by {@link Node3D}
 **/

export default function nodeMixin(env, node) {

    if (!node)
       throw new Error("2nd param must be a valid node");



    if (node._mixin_)
        return node


    node._mixin = true;


    //TODO have a container as root element  instead of the mesh itself


    //the single material is only for the node counting. so it should be irrelevant for rendering itself
    node._bubble = new Mesh(sphereGeometry, singleNodeMaterial);

    var mMesh = node._bubble;


    var size = basicSpriteSize(env, node) / 5;
    //var size=node.size?node.size*0.66:1

    mMesh.scale.setScalar(size);


    basicElementExtend(env, node, mMesh);

    var self = _.extend(node, {
        highlight: function () {
            highlightNodeElements.apply(this)
        },
        unhighlight: function () {
            unhighlightNodeElements.apply(this)
        },

        zoom: function () {
            doOnClickNode(this)
        }

    });


    self.on("mousemove", function (e, f, g) {

        e.stopPropagation();
        //e.type,intersection,node)

        var node;

        if (e.intersect.object.node)
            node = e.intersect.object.node;
        else if (e.origDomEvent) node = e.origDomEvent;


        var info = "";
        if (node.name)
            info += " " + node.name;
        if (node.group)
            info += " " + node.group;
        if (node.info)
            info += " " + node.info;


        if (info.trim() != "") {
            if (env.toolTipElem) env.toolTipElem.innerHTML = "<span class='content'>" + info + "</span>";


            if (node.getParentCluster() && node.getParentCluster().getView())
                node.getParentCluster().getView().setTooltip(info)


        }


    });


    node._bubble.name = env.nameAccessor(node) || '';
    node.size = env.sizeAccessor(node) || undefined;


    return self

}
