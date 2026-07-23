import _ from "lodash";
/**
 * Created by Frank on 16.07.2017.
 */




//better node structure
//TODO not currently used remove?

//TODO ...


export default class Node3D extends Base3DElement {

    constructor(...args) {
        super(...args);


        var lastSelectedNode;


        //----------------------------
        //TODO by useing BaseNode we simply can have it use the before-render event
        /*  options = _.extend({
              onDrawNode: function () {
              }
          }, options);
  */

        this.createInvisibleAvatar();


        var size = basicSpriteSize(env, node) / 5;
        //var size=node.size?node.size*0.66:1

        this.scale.setScalar(size);


        //TODO the tooltip should be bound to a sub-class
        /* self.on("mousemove", function (e, f, g) {

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
                 var content = $("<span class='content'>").html(info);
                 $(env.toolTipElem).html(content)


                 if (node.getParentCluster() && node.getParentCluster().getView())
                     node.getParentCluster().getView().setTooltip(info)


             }


         });
 */

    }


    //create some element that events are bound to
    // the element itself is almost? invisible specific visible 3d structures are attached using "addClass"
    createInvisibleAvatar() {

        var sphereGeometry = new THREE.SphereGeometry(1, 3, 2);


        //have only one material instance for the invis element
        var singleNodeMaterial = Node3D.nodeMaterialSingleton ? Node3D.nodeMaterialSingleton : Node3D.nodeMaterialSingleton = new THREE.MeshBasicMaterial({
            color: 0xffff00, wireframe: true, visible: true, opacity: 0, transparent: true,
            alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

        });


        //the single material is only for the node counting. so it should be irrelevant for rendering itself
        //TODO alternativly we might be able to count elements in an other way
        this.geometry = sphereGeometry;
        this.material = singleNodeMaterial;


    }

//FIXME make it work the same way the clusters work, by having custom events
    //TODO 2 actually we could use the BaseNode class with some refactoring
    onAfterRender(renderer, scene, camera, geometry, material, group) {
        options.onDrawNode.apply(this, [this])
    }


    highlight() {

        highlightNodeElements.apply(this)

    }

    unhighlight() {

        unhighlightNodeElements.apply(this)

    }

    zoom() {


        doOnClickNode(this)
    }


}





