/**
 * Created by Frank on 16.07.2017.
 */

//better node structure
//TODO not currently used

//TODO
var sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
var emptyGeometry = new THREE.Geometry();
var singleNodeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00, wireframe: true, visible: true, opacity: 0, transparent: true,
    alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

});

var lastSelectedNode;

function nodeMixin(env, node, options) {


    if (node._mixin_) return;
    node._mixin = true;


    options = _.extend({
        onDrawNode: function () {
        }
    }, options);
    // have a container as root element  instead of the mesh itself

    //material is invisible but it seems that raycaster works as intended
    //FIXME but the onBeforeRender and onAfterRender code won't get executed
    //NOTE the material is currently visible and the opacity ==0 but this still impacts performace
    // so currently the material is set invisible only every x frames in the animation loop

    /*
     var material = new THREE.MeshBasicMaterial({
     color: 0xffff00, wireframe: true, visible: true, opacity: env.useDebugSphere ? 1 : 0, transparent: true,
     alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

     });
     */

    /*
     var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,visible:true,opacity:1,transparent:true ,
     alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

     } );
     */


    if (!emptyGeometry.boundingSphere)
        emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);

    //the single material is only for the node counting. so it should be irrelevant for rendering itself
    node._bubble = new THREE.Mesh(sphereGeometry, singleNodeMaterial); //material );


    var mMesh = node._bubble;


    //the problem is that the onBeforeRender does not execute when the mesh or the material is invisible

    mMesh.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {

    };

    mMesh.onAfterRender = function (renderer, scene, camera, geometry, material, group) {
        options.onDrawNode.apply(this, [node])
    };


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
        }/*,

         expandGroup: function () {


         //setCollapsedSateOfChildNodesAndEdgesOfNode(this, true)
         //if (typeof self.link_count!="number") return

         var grp = this.group;
         if (typeof grp == "undefined") return; //silent fail
         if (env.expand[grp] == true) return; //already expanded

         env.expand[grp] = true;
         env.digest()


         },
         collapseGroup: function () {

         //setCollapsedSateOfChildNodesAndEdgesOfNode(this, false)

         var grp = this.group;
         if (typeof grp == "undefined") return; //silent fail
         if (env.expand[grp] == false) return; //already expanded

         env.expand[grp] = false;
         env.digest()


         }*/

    });


    //self.on("click mouseover mousemove ...")

    //if (env.useTooltip){


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
            var content = $("<span class='content'>").html(info);
            $(env.toolTipElem).html(content)


            if (node.getParentCluster() && node.getParentCluster().getView())
                node.getParentCluster().getView().setTooltip(info)


        }


    });

    /*
     self.on("mouseout", function (e) {
     e.stopPropagation();

     //	   $(env.toolTipElem).html("")
     })*/


//	}

    //add extra highlight for last clicked node


    /*self.on("click",function(e){

     if (lastSelectedNode)
     lastSelectedNode.removeClass("basic-selection")

     lastSelectedNode=e.target.node

     e.target.node.addClass("basic-selection")
     })*/


    //add group node expand behaviour
    /* @deprecated will be reimplemented on a per-cluster-basis
     if (self.isGroupNode)
     self.on("dblclick", function (e) {
     e.target.node.expandGroup()
     });
     else //add none group node collapse behaviour
     self.on("dblclick", function (e) {


     if (env.useGroupFeature)
     e.target.node.collapseGroup()

     });
     */


    return self

}
