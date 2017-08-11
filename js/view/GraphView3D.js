/**
 * Created by Frank on 13.06.2017.
 */



import View3D from "./View3D"


import RootCluster from "../cluster/RootCluster"
import GraphData from "../cluster/GraphData"

import skyDomeImage from "./coordinates.png"

import Hexasphere from "hexasphere.js"


import "../gui/GraphHUD"

import {GUI} from "../cluster/refactor/SpecificDataUtils"



export default
class GraphView3D extends View3D
{

    constructor(...args)
    {
        super(...args);

        this.mRootCluster=null;






    }



    connectedCallback(){
        super.connectedCallback();

    }

    setSpeccs(speccs)
    {
        this.mSpeccs=speccs;
        return this
    }

    getSpeccs()
    {

        return this.mSpeccs
    }



createSkyDome()
{



    var material = new THREE.MeshBasicMaterial();


    let scene=this.mScene;

    var ambientLight = new THREE.AmbientLight(0xFFFFFF,1.5);
    scene.add(ambientLight);
   /* var dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 10000, 0);
    dirLight.intensity = 1;
    scene.add(dirLight);
*/
   /* var pointLight = new THREE.PointLight( 0xffffff, 100, 1000000000 );
    pointLight.position.set( 0, 0, 20000 );
    scene.add(pointLight);
*/
  /*  var geometry = new THREE.SphereGeometry(300000, 60, 40);
    var material = new THREE.MeshBasicMaterial();

   material.map = THREE.ImageUtils.loadTexture(skyDomeImage);
    material.side = THREE.BackSide;
    material.opacity=0.05;
    material.transparent=true;
    var skydome = new THREE.Mesh(geometry, material);

    this.mSkyDome=skydome


*/
 //   scene.add(skydome);


    //--------------------------------
    var meshMaterials = [];
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x7cfc00, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x397d02, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x77ee00, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x61b329, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x83f52c, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x83f52c, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x4cbb17, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x00ee00, transparent: true}));
    meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x00aa11, transparent: true}));

    var oceanMaterial = []
    oceanMaterial.push(new THREE.MeshPhongMaterial({color: 0x0f2342, transparent: true}));
    oceanMaterial.push(new THREE.MeshPhongMaterial({color: 0x0f1e38, transparent: true}));


    var radius = 300000;        // Radius used to calculate position of tiles
    var subDivisions = 3;   // Divide each edge of the icosohedron into this many segments
    var tileSize = 0.9;    // Add padding (1.0 = no padding; 0.1 = mostly padding)


    function isLand(){

        return _.random(0,1)

    }

    var hexaGroup=new THREE.Group();

    var hexasphere = new Hexasphere(radius, subDivisions, tileSize);
    for(var i = 0; i< hexasphere.tiles.length; i++){
        var t = hexasphere.tiles[i];
        var latLon = t.getLatLon(hexasphere.radius);

        var geometry = new THREE.Geometry();

        for(var j = 0; j< t.boundary.length; j++){
            var bp = t.boundary[j];
            geometry.vertices.push(new THREE.Vector3(bp.x, bp.y, bp.z));
        }
        geometry.faces.push(new THREE.Face3(0,1,2));
        geometry.faces.push(new THREE.Face3(0,2,3));
        geometry.faces.push(new THREE.Face3(0,3,4));
        if(geometry.vertices.length > 5){
            geometry.faces.push(new THREE.Face3(0,4,5));
        }

        if(isLand(latLon.lat, latLon.lon)){
            material = meshMaterials[Math.floor(Math.random() * meshMaterials.length)]
        } else {
            material = oceanMaterial[Math.floor(Math.random() * oceanMaterial.length)]
        }

        material.opacity = 0.3;

        material.side = THREE.BackSide;

        var mesh = new THREE.Mesh(geometry, material.clone());
        hexaGroup.add(mesh);
        hexasphere.tiles[i].mesh = mesh;

    }
    scene.add(hexaGroup);
    this.mSkyDome=hexaGroup



}



    initClusterForView(rawGraphData,parentEl3D) {


        if (!rawGraphData) return;

        let speccs = this.getSpeccs();

        let graphData = new GraphData(rawGraphData);


        let preparedData = graphData.createClusterNodesAndEdges(this);

        var res = new RootCluster(preparedData.nodes,undefined,this);


//-- count visible nodes
   //TODO check if this interferes with the nodeMixin and the default implementation
      var visibleNodes=[];
    /*    _.each(preparedData.nodes,function(node){
            node.get3DRoot().onBeforeRender=function(){
                visibleNodes.push(node);
            }
        });*/




//--

        parentEl3D.add(res);
        res.position.set(0, 0, 0);

        //FIXME workflow below ..
        //IMPORTANT: must attach after clustering is applied because "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this);
        res.applyClustering(speccs);



        var visibleLeafs=[];
        _.each( res.getLeafs() ,function(leaf){
            leaf.onBeforeRender=function(){
                visibleLeafs.push(leaf);
            }
        });






        var that=this;
        var _____skipFrames=0;

        $(that).on("before-render",function(){


            if (that.isMaximised()) {

                   _____skipFrames++;
                //     _.each(preparedData.nodes,(n) => n._bubble.material.visible = (_____skipFrames % 20) ? false : true)
             let prev_vis=preparedData.nodes[0]._bubble.material.visible;
                let _vis= (_____skipFrames % 20) ? false : true;
                preparedData.nodes[0]._bubble.material.visible = _vis;

                if (prev_vis)
                {
              let vl=  _.flatten(visibleLeafs.map( leaf => leaf.mNodes ) )
                    GUI.updateFromVisibleNodes(vl);
                   // GUI.updateFromVisibleNodes(visibleNodes);
                 //   that.mVisibleNodes=[].concat(visibleNodes)
                //$(that).trigger("visible-nodes-changed") //TODO inverse control via listening
                  //  that.mRootCluster.updateRootTextNodes(visibleNodes);

                }
            }
            visibleNodes=[] //reset count
            visibleLeafs=[]

        });


        this.start();

        return res


    }


    setData(mGraphData)
    {
        this.initStatic();


        //this.createSkyDome();


        if (!this.mRootCluster)
        this.mRootCluster= this.initClusterForView(mGraphData,this.mScene);

        $(this).trigger("loaded")



    }

    loadDataSet(ds){

      var that = this;

        ds(null,function onSuccess(mGraphData)
        {
            console.log("data loaded");
            that.setData(mGraphData);

            $(".cloudNodeColorSelect").val("group").trigger("change")

        });

    return this
    }


    maximise() {

        var  root = this.mRootCluster;

        super.maximise();

            if (root && root.mParentView && root.mTextOverlay) {

                root.mTextOverlay.height(root.mParentView.clientHeight);
                root.mTextOverlay.width(root.mParentView.clientWidth);
                console.log("maximised")
            }




    }

    undoMaximise(){
            super.undoMaximise();


            let root=this.mRootCluster;
            if (root&& root.mParentView && root.mTextOverlay) {

                root.mTextOverlay.height(root.mParentView.clientHeight);
                root.mTextOverlay.width(root.mParentView.clientWidth)
            }


    }


}

customElements.define("graph-view-3d", GraphView3D);
