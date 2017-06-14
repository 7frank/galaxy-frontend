var clusters =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseNode__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__ = __webpack_require__(2);
/**
 * Created by Frank on 30.05.2017.
 */







/**
 * NOTE: possible future work flow/use case
 *  cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 *  cluster.find("#other").setDistribution(_dist)
 *  cluster.find("United States").applyClustering(...)
 */


class BaseCluster3D extends __WEBPACK_IMPORTED_MODULE_1__BaseNode__["a" /* default */] {

    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers) {
        super();

        this.addNodes(nodes);

        this.mClusters = {};
          //Cluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
       // else this.updateCluster()

    }

    /**
     * add one or many nodes to the cluster
     *
     * TODO could this be used to dynamically add nodes an re-run the clustering
     *
     */


    addNodes(nodes) {
        if (!this.mNodes) this.mNodes = [];

        if (typeof nodes == "undefined") return;

        if (_.isArray(nodes))
            this.mNodes = this.mNodes.concat(nodes);
        else
            this.mNodes.push(nodes)

    }


    /**
     * returns the nodes that where used to generate the current iteration of the cluster
     * if the cluster has sub-clusters the node represent the sum of all nodes of the sub-clusters as well
     */

    getNodes() {
        return this.mNodes;
    }


    /**
     * pushes the clusters to the mesh stack to render them
     *
     */

    addAllSubClustersToContainer() {

        _.each(this.mClusters, (cluster) => this.add(cluster))

    }


    /**
    *  used for recursive cluster generation if class is used for inheritance
    */

    getChildClusterConstructor() {
        return this.constructor

    }


    /**
     * free the given gclusters again
     *
     *
     *
     */

   static cleanUpClusters(clusters,self)
    {
        clusters.push(self)

        _.each(clusters,function(cluster) {

            if (cluster.tn) {
                cluster.tn.remove()
                delete (cluster.tn)
            }
            if (cluster.mTextNodes) {
                cluster.mTextNodes.remove()
                delete (cluster.mTextNodes)
            }


            if (cluster==self) return;//don't detach the current root element

            if (cluster.parent) {

                if (cluster.parent.mClusters && cluster.name)
            delete(cluster.parent.mClusters[cluster.name])
            cluster.parent.remove(cluster)
            }



        })





    }

    /**
     * free leaf elements
     *
     *
     */


    cleanUpLeafs()
    {
        _.each(this.getLeafs(),function(leaf){

            //TOO to leaf specific clean up

            //for now at least remove the particle cloud
            leaf.geometry.dispose()
            if (leaf.parent)
            leaf.parent.remove(leaf)
        })

    }


    /**
     * TODO we want to get the node positions relative to the current root? cluster
     *      after reclustering we can use these to update the new positions to match the old ones in world coords
     *
     */

    storeParentPositionInNodes(){

    var leafElements=this.getLeafs()
_.each(leafElements,function(leaf){
    let mNodes=leaf.mNodes
    _.each(mNodes,function(node){


        var c1 = new THREE.Vector3();
            c1.setFromMatrixPosition( leaf.matrixWorld );

        node._parentPosAbs=c1;

    })
})


    }

    restoreNodePositionFromExParent(){



        var leafElements=this.getLeafs()
        _.each(leafElements,function(leaf){
            let mNodes=leaf.mNodes
            _.each(mNodes,function(node){
                //get current parent pos
                let c1=node._parentPosAbs

                if (!c1) return;
                var c2 = new THREE.Vector3();
                c2.setFromMatrixPosition( leaf.matrixWorld );

                node._bubble.position.add(c1).sub(c2)
                _.extend(node,node._bubble.position)

            })
        })



    }



    /**
     * this method can be re-run to change the sub-clusters
     * -which will result in deleting old clusters
     * -adding new ones to the container
     * TODO this should re-build all child clusters if another ordering is provided
     *
     */

    applyClustering(mClusteringSpeccsArray) {


//FIXME currently only working in root
      //  this.storeParentPositionInNodes()

        //e. g. result should be .. {china:instanceof BaseCluster3D}

        if (mClusteringSpeccsArray.length == 1) {

            let prevClusters = this.findClusters("*");
            this.cleanUpLeafs();
            this.createParticlePointCloud(mClusteringSpeccsArray[0]);

            //clean up previous clusters


            BaseCluster3D.cleanUpClusters(prevClusters, this)

            return false;
        }


        var entry = mClusteringSpeccsArray[0];

        //store previous clusters
        let prevClusters = this.findClusters("*");

        //create new clusters
        this.doClusteringForOnlyThis(entry);



        _.each(this.mClusters, function (mCluster, key) {

            var nextDepthSpeccsArray = [].concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length > 1)
                mCluster.applyClustering(nextDepthSpeccsArray);
            else
                mCluster.createParticlePointCloud(nextDepthSpeccsArray[0]);


        })

        this.updateCluster()


        //clean up previous clusters
        BaseCluster3D.cleanUpClusters(prevClusters, this)

        //adjust positions if cluster gets re-clustered
       // this.restoreNodePositionFromExParent()
    }



    /**
     * based on the entry the clustering
     * the  visible child clusters are generated
     *
     */


    doClusteringForOnlyThis(entry) {
        var clazz = this.getChildClusterConstructor();
        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options);
        var that=this;

        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        _.each(this.groupBy(entry.generator), function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz;//new BaseCluster3D()
                _clustersObj[dMGN].name=dMGN
                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else {
                _cluster.name=key
                _clustersObj[key] = _cluster


            }
        })


        _.extend(this.mClusters, _clustersObj)


        this.setDistributionHandler(entry.distribution,function (){

            that.mClusterRule=entry
            that.trigger("complete")


        })

    }

    /**
     * the current cluster gets subdivided into smaller clusters
     * based on the result of the filterFunction
     * the resulting groups are used by @see doClusteringForOnlyThis to create the actual visible child clusters
     */
    groupBy(filterFunction) {
        var clazz = this.getChildClusterConstructor();

        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new clazz;//new BaseCluster3D();

            container[key].addNodes(val)
        }

        for (el of this.mNodes)
            filterFunction(groupFunction, el)


        return container

    }


    /**
     *
     *  used only to change distribution of current cluster
     *  there is a similar implementation for the ClusterLeafElement class
     * @param distribution instanceof BaseDistribution
     */
    setDistributionHandler(distribution,onComplete=function(){}) {

        var values = Object.values(this.mClusters)
        //TODO translation,rotation,scale by using different per-node function

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution,onComplete);
        else
            distribution.setNodes(this, function onStep(vecPosition, i) {
                //  let n = values[i];
                //  n.position.copy(vecPosition)
            },function(){   onComplete()   });


    }

    /**
     *
     *  current limenentation of the hull is a simle sphere with a border with the radius of the boundingSphere
     *  TODO  could be convex hull in sub class in which case override
     */

    adjustHullSize() {


        if (this.mHull && this.mHull.geometry)
            this.mHull.geometry.dispose();
        if (this.mHull && this.mHull.material)
            this.mHull.material.dispose();

        if (this.mHull) this.remove(this.mHull)

        this.geometry.dispose();
        this.geometry.boundingBox = null;
        this.geometry.boundingSphere = null;
        delete(this.geometry);

        let boundingSphere = new THREE.Sphere;

        let boundingBox = new THREE.Box3;
        boundingBox.setFromObject(this);

        //get center, radius
        let _center = boundingBox.getCenter();
        let radius = boundingBox.getSize().length() / 2;


        //TODO
        if (radius < 40) radius = 40

        boundingSphere.radius = radius;




        var geometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);
        var material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            transparent: true,
            opacity: 0.3,
            visible:false
        });


        var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
        //  var material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.1});


        this.mHull = new THREE.Mesh(geometry, material)
        // this.mHull.position.copy(_center);

        // this.geometry.boundingSphere=boundingSphere
        this.add(this.mHull);
        this.mHull.onBeforeRender = function (...args) {
            //billboard effect
            this.setRotationFromQuaternion(args[2].quaternion)

        }


        this.geometry = sphereGeometry;


    }


    /**
     *
     * if true the cluster is the leaf cluster and contains mLeaf attribute
     *
     * @returns {boolean}
     */


    isLeaf() {
        return typeof this.mLeaf != "undefined"
    }

    /**
     * create a inner particles for each leaf node element
     *
     *
     * @param entry
     */


    createParticlePointCloud(entry) {
        // console.log("reached leaf cluster", this)

        let leaf = new __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */](this.mNodes);
        this.mLeaf = leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution)

    }

    /**
    * updates hull and adds child clusters if necessary
    *
    *
     */
    updateCluster() {

        this.addAllSubClustersToContainer();

        this.adjustHullSize();

    }


    /**
     *  returns some infos of the children of the the cluster relative to each other
     *  TODO make use of it meanwhile @deprecated
     */

    getRelationInfo() {
        return __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].getClusterInfo(this.mClusters);

    }


    /**
     * creates edegse from nodes
     * the edges can be inner edges only from nodes within cluster to other nodes within
     * or external edges leading into nodes from other clusters
     */

    createEdgesForChildClusters() {

        return __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].createEdgesBetweenClustersFromMap(this.mClusters);

    }

    /**
     *
     *
     * @params defaultRadius if the radius is not yet determined the fefault value is used instead
     * @returns the radius of the cluster
     */
    getRadius(defaultRadius=100) {

        return this.geometry.boundingSphere ? this.geometry.boundingSphere.radius : defaultRadius;

    }


    /**
     * has to be called after initialisation to re-calculate dependent elements
     * like dot clouds and cluster boder and hull
     */
    onAfterClusteredAndDistributed() {

      _.each(_.reverse( this.findClusters("*")), function (cluster) {
            cluster.adjustHullSize();


        })


        this.adjustHullSize()
    }


    /**
     * returns an array of the actual ClusterLeafElements
     * that render the nodes itself
     */

    getLeafs() {
        var leafElements = [];

        this.traverse(function (item) {
            if (item instanceof __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */])
                leafElements.push(item)

        })
        return leafElements;
    }

    /**
     * return an array of all sub clusters of the current cluster
     *
     * TODO make use of the selector attribute like #china or #other
     *
     */
    findClusters(selector) {
        var clusters = []

        this.traverse(function (item) {
            if (item instanceof BaseCluster3D)
                clusters.push(item)
        })

        clusters.shift() //remove first elemn as it is "this"

        return clusters

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseCluster3D;


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */




class BaseDistribution
{
    constructor(scale=50,dimensions=1){

        //TODO have some kind of dynamic width function as alternative to the static scale value
        //this way it would be possible to have equal with child nodes for example
        let defaults={scale:()=> 50 ,dimensions:1}


        this.mDuration=2000 //FIXME longer duration does not render as intended

        this.dimensions=dimensions //TODO
        this.mScale=scale
    }


    setNodes(nodes,onNodePositionChange,onEnd) {
        if (nodes instanceof __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */]) {

            //TODO
         /*   if (nodes.isLeaf())
                nodes =nodes.mNodes
                else*/
                nodes = nodes.mClusters

        }
        else
        if (!_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


        var mDuration=this.mDuration

        //for canceling animation
        var mTimeout;

        let len= nodes.length|Object.keys(nodes).length


        var i=0,j=0,k=0;

        let _len;
        if (this.dimensions==1)
            _len=len;
        if (this.dimensions==2)
            _len= Math.sqrt(len);
        if (this.dimensions==3)
            _len=Math.pow(len,1/3);

        if (this.dimensions<3)  k=0.5*_len
        if (this.dimensions<2)  j=0.5*_len


        let step=1/_len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)

        var c=0;
        var that=this;
        var fixmeOnce=true;

        var tweens=[]

        _.each(nodes,function(n){

            if (i>_len){
                j++;
                i=0;
            }

            if (j>_len){
                k++;
                j=0;
            }


            var dist= that.distribute(n, i/_len-0.5,j/_len-0.5,k/_len-0.5);



           //  onNodePositionChange(dist.position,c)


            //------------------------
            //------------------------

            //animating from current position to new one
        var mc=c;
        let origPos=(n.position)?n.position:n



            let tween = new TWEEN.Tween(origPos)
                .to(dist.position,mDuration)
                .onUpdate(function () {

                    onNodePositionChange(origPos,mc)

                }).onComplete(function(){


                    //TODO instead of onEnd we shoudhave a timed function that gets called very 20 ms or so until onColplete is triggered by at least one node

                    if (fixmeOnce) {

                        _.each(tweens,function(tween){
                            TWEEN.remove(tween)

                        })

                        if (onEnd) onEnd()
                        fixmeOnce=false
                    }

                    cancelAnimationFrame(mTimeout)

                })
                .start();

            //------------------------
            //------------------------

            tweens.push(tween)
            //i+=step
            i++;
            c++;
        })



        requestAnimationFrame(animate);

        function animate(time) {


           // TWEEN.update(time);

            _.each(tweens,function(tween){
                tween.update(time)

            })


            mTimeout=    requestAnimationFrame(animate);

        }




    }

    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node,dx,dy,dz){

        return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseDistribution;




/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 02.06.2017.
 */



class EdgeUtil {

    /**
     *
     *
     */
    static getConnectedClusters(){

        //finds external nodes of a cluster

        //look up what cluster the node is in?


    }




    /*
    * takes a object containing BaseCluster3D as input and returns
    * a set of edges
    *
    * */

    static createEdgesBetweenClustersFromMap(clustersContainer){


       let info= EdgeUtil.getClusterInfo(clustersContainer)

        let clusterKeys= Object.keys(clustersContainer) ;


        var edgesArray=[];
       _.each(clusterKeys,function(key){

           let otherClusterKeys= Object.keys(info[key].clustersConnectedTo) ;

           _.each(otherClusterKeys,function(otherKey){

               let otherClusters= info[key].clustersConnectedTo;
               let edgesForCluster= info[key].edges;

               let linkStrength=Object.keys(edgesForCluster).length

               edgesArray.push({
                       source:clustersContainer[key],
                       target:otherClusters[otherKey],
                       link_strength:linkStrength
                   })


           });



       });

        return edgesArray;
    }

    /**

     * @param clustersContainer  ...  Map<name,cluster>
     * @returns an object containing certain infos about clusters (what clusters are connected, with which edges and nodes within the cluster)
     */
    static getClusterInfo(clustersContainer){

        //find connections between clusters from nodes contained

        var relevantEdgesPerCluster={}
            _.each(clustersContainer,function(cluster,id){
                relevantEdgesPerCluster[id]={}
                let nodes=cluster.getNodes()
                //get only relevant nodes per cluster that link to/from other clusters
                let edges=EdgeUtil.getEdgesForNodes(nodes,false,true)
                relevantEdgesPerCluster[id]=edges

            })



        function isNodeOfCluster(node,cluster)
        {
          return cluster.getNodes().indexOf(node)>=0

        }

        //just in case clusters can overlap
        //returns a map of the clusters that contain the node
        function lookUpClustersOfNode(node){

            var clustersForNode={};

            _.each(clustersContainer,function(cluster,id){

               if (  isNodeOfCluster(node,cluster))
                   clustersForNode[id] = cluster;
            });

            return clustersForNode;

        }

        var clustersContainerRelationInfo={};


        //get the clusters that connect to each other from the dges between them
        _.each(relevantEdgesPerCluster,function(clusterExternalEdges,clusterID){

            clustersContainerRelationInfo[clusterID]={
                clustersConnectedTo:{},
                edges:{},
                nodes:{}

            };

            //for each edge of the current cluster that connects to another cluster
            _.each(clusterExternalEdges,function(externalEdge){



                //we can ignore the node that is contained within the current cluster

               var testNode= isNodeOfCluster(externalEdge.source,clustersContainer[clusterID]);
               let otherNode=testNode?externalEdge.target:externalEdge.source;


               let clustersThatContainNode = lookUpClustersOfNode(otherNode);
                delete (clustersThatContainNode[clusterID]) //undo self reference

                _.extend(clustersContainerRelationInfo[clusterID].clustersConnectedTo,clustersThatContainNode);

                var keys=Object.keys(clustersThatContainNode)


                //have some additional infos
                _.each(keys,function(key){

                    //the edges that link to the specific cluster
                   if (!clustersContainerRelationInfo[clusterID].edges[key]) clustersContainerRelationInfo[clusterID].edges[key]=[]
                    clustersContainerRelationInfo[clusterID].edges[key].push(externalEdge)

                    //the nodes the edges connect to
                    if (!clustersContainerRelationInfo[clusterID].nodes[key]) clustersContainerRelationInfo[clusterID].nodes[key]=[]
                    clustersContainerRelationInfo[clusterID].nodes[key].push(externalEdge)

                })




                //all clusters the node links to

            })


        });

        return clustersContainerRelationInfo

    }

    /**
     *  returns all edges for >>contained<< nodes within clusters
     *  this would be suitable to do force-graph distribution on a cluster and all descendants
     */

    static getEdgesForNodes(nodes, bInternal = true, bExternal = false) {


//a node can be a cluster that represents a set of nodes
 //   if (nodes instanceof BaseCluster3D) nodes = nodes.mNodes

    if (!bInternal && !bExternal) return []
    //get relevant edges from

    //a.clusters.mClusters.mClusters["United States"][0].mNodes

    var edges = [];

    _.each(nodes, function (node, id) {

        //check if it is a container element
        if (node instanceof __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */]) {
            let _edges = EdgeUtil.getEdgesForNodes(node.mNodes, bInternal, bExternal)
            edges = edges.concat(_edges);
            edges = _.uniq(edges)
            return
        }

        _.each(node.edges, function (edge, id) {


            let srcContained = nodes.indexOf(edge.source) >= 0;
            let trgContained = nodes.indexOf(edge.target) >= 0;


            let isInternalNode = srcContained && trgContained;

            // console.log(srcContained,trgContained,isInternalNode)
            if (bInternal && isInternalNode || bExternal && !isInternalNode) {
                edges = edges.concat(node.edges);
                edges = _.uniq(edges)
            }

        })


    })


    return edges

}

}
/* harmony export (immutable) */ __webpack_exports__["a"] = EdgeUtil;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ZoomUtil__ = __webpack_require__(17);
/**
 * Created by Frank on 06.06.2017.
 */












/**
 * extended cluster

 */

//refactoring current cluster structure
class Cluster3DExtended extends __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */] {



    constructor(nodes, clusteringHandlers) {
        super(nodes, clusteringHandlers);

    this.addListeners();

    //TODO have a "cluster-ready" event
    setTimeout( ()=> this.addNodeCaptions(),7000)
    //console.warn("TODO use events instead of arbitrary timeout to trigger for completion")

    }

    /**
     *   have a dynamic distance based on the size of the cluster
     *
     */
    zoomToCluster(defaultDistance=400)
    {


        var distance=this.getRadius(defaultDistance)*3

        __WEBPACK_IMPORTED_MODULE_3__ZoomUtil__["a" /* default */].moveToMesh(this,function onComplete(){  },distance)

    }


    /**
     * adds some listeners and actions
     *  - zoom via keyboard default hotkey "space"
     *  - show hide cluster border defaults to "mouseover"/"mouseout"
     *  - change ordering/distibution of child clusters defaults to "dblclick"
     */


    addListeners()
    {


        var curr=0
        function onClickFactory(res,speccs){


            return function clickAndSpeccHandler(){



                var _dist=speccs[curr++%speccs.length].distribution

                console.log("setting distribution function",_dist)
                res.setDistributionHandler(   _dist  )

                //FIXME add complete handler
                setTimeout(function()
                {

                    res.onAfterClusteredAndDistributed()

                },1000 )

            }
        }

        //FIXME find a way to not get click triggered if dblclick is triggered when both are bound to same element
        this.on("space",function(e) {
           // e.stopPropagation()

         this.zoomToCluster()

        })

        var diameter=null;
            this.on("s dblclick",function(e) {
            e.stopPropagation()


        if (!diameter)
            diameter=this.geometry.boundingSphere.radius*2
            console.log("clicky clicky",diameter)
            let speccsRoot=[
                {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__["a" /* default */](diameter,1)},
                {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__["a" /* default */](diameter*0.66,2)},
                {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__["a" /* default */](diameter*0.33,3)},
                {distribution: new __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__["a" /* default */](diameter*0.66,3)}
                ]


            var fn= onClickFactory(this, speccsRoot)

            fn()
        })

        this.on("mouseover mousemove",function(){

            if (  this.mHull)
            this.mHull.material.visible=true;
        })


        this.on("mouseout",function(){
            if (  this.mHull)
            this.mHull.material.visible=false;


        })



    }



    /**
     *
     *
     */
    update()
    {
        super.update();

        if (this.mTextNodes)
        this.mTextNodes.update();

    }




    appendNodes(nodes){

        var that=this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
                that.add(node._bubble)


        })


    }


    /**
     * has to be called after initialisation to re-calculate dependent elements
     * like dot clouds and cluster boder and hull
     */
    onAfterClusteredAndDistributed(){
        super.onAfterClusteredAndDistributed();

      _.each(this.getLeafs(),function(leaf){

         // leaf.parent._initDotParticles();

         // leaf.parent.updateDotParticles()

      })







    }


    updateDotParticles()
    {
        if (this.isLeaf())
            if (this.mParticles)
            {

                this.mParticles.start();

              //  this.mParticles.pointCloud.position.sub(this.position);
            }


    }

    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    _initDotParticles() {

        if (this.mParticles)  this.mParticles.start()


            if (this.isLeaf() && !this.mParticles) {

             var nodes=this.mLeaf.mNodes
            var demoOptions = {increment:1}

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount|5
                    //return 5
                }



            //TODO refactor force-graph-utils

            var particles = createParticleSystemForNodes(nodes, demoOptions);
            this.add(particles.pointCloud);

            this.mParticles = particles;
        }

    }


    /**
     * add some text to the sub-clusters providing informations
     *
     *
     *
     */


    addNodeCaptions(){


        function _getNodePosition(node) {

            var mVec3 = new THREE.Vector3();
            mVec3.setFromMatrixPosition( node.matrixWorld );


            return mVec3; //node.position.clone()
        }

        var nodes=Object.values(this.mClusters)

        //TODO remove global dependency in TextNodes
        let env=undefined

        //TODO make sure radius is dynamically changed when cluster radius changes

        let minDistance=this.getRadius()/3
        let maxDistance=minDistance*10

        if (!this.mTextNodes)
        this.mTextNodes = TextNodes(env, {
            maxVisibleCount: 50,
            maxDistance: maxDistance,//30000
            minDistance: minDistance, //3000
            getNodes: function () {

                return nodes

            },
            onNodeText: function (node) {

                if (node.name) return node.name;

                return node.id;

            },
            getCSSClasses: function () {
                return 'graph-country-caption'

            },
            getNodePosition: _getNodePosition,
            interactable: true,
            onAfterCreateTextField: function (node, el) {

                var newSize;
                if (node instanceof Cluster3DExtended)
                {
                    newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);


                }
                else
                newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                newSize = _.round(newSize / 12, 3) + "em";

                el.css("font-size", newSize);

                el.on("click", function () {
                    node.zoomToCluster();
                  //  doZoomToPos(_getNodePosition(node))
                })

            }
        })





    }


    getRoot(maxDepth=20)
    {
        var _root=this;
        while ( maxDepth--)
        {
           let r=_root.parent;
           if (r==null) return _root;
           if (! (r instanceof __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */])) return _root;
            _root=r;
        }


    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = Cluster3DExtended;


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgesContainer__ = __webpack_require__(15);
/**
 * Created by Frank on 30.05.2017.
 */





class ClusterLeafElement extends THREE.Mesh
{
    constructor(nodes){
        super();




        this.mNodes=nodes;
        this.mParticles=this.createParticleCloud();

        this.add( this.mParticles.pointCloud)

        //FIXME wrong positions
        this.appendNodes(nodes)

        this.createEdgesFromNodes(nodes)

    }

    appendNodes(nodes){

        var that=this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
               that.add(node._bubble)


        })


    }



    createEdgesFromNodes(nodes){

       this.mEdgesContainer=new __WEBPACK_IMPORTED_MODULE_0__EdgesContainer__["a" /* default */]();

        this.mEdgesContainer.setFromNodes(nodes);


        this.add( this.mEdgesContainer)

    }



    //TODO refactor
    setDistributionHandler(distribution,onComplete=function(){})
    {

        var that=this;
        distribution.setNodes(this.mNodes,function onStep(vec,i){

            let n=that.mNodes[i];
            if (n._bubble) n._bubble.position.set(n.x,n.y,n.z);
            that.mParticles.updateNodePosition(i);


            //TODO this currently will get triggerd per node not per node set so we do have to alter the distribution class a bit
            that.mEdgesContainer.updateEdges();


        },onComplete);

    }

    createParticleCloud()
    {

        var elem = ParticleNodeGroup( this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        })


        return elem
    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterLeafElement;




/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 11.06.2017.
 */



class GraphData
{

    //constructor(nodes,edges){
    constructor(graphData){
            this.mGraphData=graphData
      /*  this.mNodeData=[];
        this.mEdgeData=[];

        this.addNodes(nodes);
        this.addEdges(nodes);*/

    }

    getClonedRawNodes()
    {
        var mNodes={}

            _.each(this.mGraphData.nodes,function(node,id){
                mNodes[id]=_.extend({x:0,y:0,z:0},node)


            })



        this.mDataNodeCopy=mNodes


        // Build graph with data
        var d3Nodes  = [];
        for (let nodeId in mNodes) { // Turn nodes into array
            const node =mNodes[nodeId] // _.extend({},mNodes);
            node._id = nodeId;
            d3Nodes.push(node);
        }
       return d3Nodes

    }

    getAlteredRawLinks(){
        var mDataNodeCopy= this.mDataNodeCopy
    var skipLines=100

        var links=this.mGraphData.links.filter((v,id)=> !(id%skipLines)   )

        //FIXME this sets src and dst to the graph data nodes but it should instead link to the cloned nodes so no interference occures
       var  d3Links  = links.map(link => {
            return {
                source: mDataNodeCopy[link[0]],
                target: mDataNodeCopy[link[1]]
            };
        })

    return d3Links



    }


  /*  addRawNodeData(nodes){
      if (_.isArray(nodes)) this.mNodeData=this.mNodeData.concat(nodes)

        return this;

    }

    addRawEdgeData(edges)
    {
        if (_.isArray(edges)) this.mEdgeData=this.mEdgeData.concat(edges)

        return this;
    }*/

    createClusterNodesAndEdges(env=globalEnv)
    {


   var d3Nodes= this.getClonedRawNodes();

    if (!d3Nodes.length) {
        return;
    } //if no data is present return for now


    var d3Links =this.getAlteredRawLinks();


//TODO
  /*  function countVisibleNodes(node) {

        env._nodeCounter.push(node)

    }*/

    // Add WebGL objects
    d3Nodes.forEach(node => {

        node = nodeMixin(env, node, {
         //   onDrawNode: countVisibleNodes
        })
        node._bubble.name = env.nameAccessor(node) || '';


        //TODO not highlighted group nodes should be rendered with separate point cloud
        if (node.isGroupNode) {

            //node.addClass("basic-sprite-collapsed")
            node.addClass("basic-ring")

            //node.on("mouseover",()=> node.addClass("basic-animated"))
            //node.on("mouseout",()=> node.removeClass("basic-animated"))
            node.on("mouseover", () => node.addClass("basic-ring-2"))
            node.on("mouseout", () => node.removeClass("basic-ring-2"))

        } else {

            //TODO specific renderings for node should be handled via class property at node data itself
            //NOTE: the default node/group nodes/links will be put inside a point  cloud for each so we woud need a point cloud for each 3d-class that generates a points object

            //node.addClass("basic-sphere")

            // nothing to begin with
            //node.addClass("basic-sprite")

        }

    });

    //-----------------------------------------------

    //init mesh for groupline
  /*  if (env.useLineGroup)
        initLineGroup(env,{
            opacity:0.01,
            color:0x49616C,
            transparent: true,
        })

    var linecount = 0;
    var skipLines = env.numSkipEdgesRendered + 1;
    if (skipLines < 1)
        skipLines = 1
    function shouldLineByVisible(link, id) {

        return !(linecount++ % skipLines)
    }
*/

        //TODO have more thatn one line mesh per rootcluster .. isntead have line meshes per sub-cluster
       var mLineGroup= this.initLineGroupHelper()

        //used to wrap per cluster functionality
        function linkMixinExt(link,options)
        {
            var env={mergedLineMesh:mLineGroup}

            return linkMixin(env,link,options)

        }




        //d3Links.forEach(link => {
    _.each(d3Links, (link, id) => {

         //TODO have a function within the custer itself that is called
        //determine by distance or something like that
        var bVisible = true;// shouldLineByVisible()

        linkMixinExt( link, {
            lineIsVisible: bVisible,
            color: 0xff0000,
            opacity: 1
        })


    });





    //----------------------


    //nodes are prepared by previous step ? TODO which one was that? for further altering
    extendGraphElements(d3Nodes, d3Links, env)


        return {nodes:d3Nodes,edges:d3Links}

}

    //--------------------------------------------


    /**
     * TODO refactor line group into stand alone class to be used per-cluster
     *
     *
     *
     */
   initLineGroupHelper( options) {


       var line_geom = new THREE.Geometry();
       var lineMaterial
       var mergedLineMesh





    var defaults = {
        opacity: 0.01,
        transparent: true,
        //lineIsVisible:true, // if disabled the line won't be shown on the scene
        color: 0xffffff
    }

    options = _.extend(defaults, options)

    lineMaterial = new THREE.MeshBasicMaterial({
        color: options.color,
        transparent: options.transparent,
        opacity: options.opacity,
        depthTest: false,
        depthWrite: false
    });


    mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);

    mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);



  return mergedLineMesh


}





}
/* harmony export (immutable) */ __webpack_exports__["a"] = GraphData;


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__ = __webpack_require__(3);
/**
 * Created by Frank on 06.06.2017.
 */


//TODO refactor RootCluster


/**
 *
 *  a RootCluster is a root node that contains additional rendering infos over multiple nodes
 * for example: it handles node captions (text nodes)
 */

class RootCluster extends __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__["a" /* default */] {

    constructor(...args)
    {
        super(...args)

        this.addGlobalNodeCaptions()


        //TODO have an actual event triggered for when sub-clusters are distributed to adjust elements
        setTimeout(()=> this.onAfterClusteredAndDistributed(),1000)


    }


    /**
     * @override
     * prevent multiple recursive  root clusters from being created by default
     */

    getChildClusterConstructor()
    {
        return __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__["a" /* default */];

    }


    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */


    addGlobalNodeCaptions(){

        //TODO remove global dependency
        let env=undefined

        if (!this.tn)
            this.tn = TextNodes(env, {
                maxVisibleCount: 10,
                onNodeText: function (node) {

                    if (node.name)
                        return node.name

                    return node.id

                },
                getNodes: () => this.mNodes
            })


    }



    update(){
        super.update()

        if (this.tn)
        this.tn.update();

    }




    applyClustering(mClusteringSpeccsArray) {

        this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray)

        this.restoreNodePositionFromExParent()
    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = RootCluster;


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 02.06.2017.
 */









/*
* TODO the forceGraphDistribution should work like a normal force graph
* but optimally is could use a initial distribution from another dist function with no animation enabled
*
* */



class ForceGraphDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]
{
    constructor(scale=50,dimensions=1){
        super(scale,dimensions);

    }
    /**
     * a reduced simulation (for testing)
     * TODO add edges and rest of original src
     * @param nodes
     * @param edges
     * @param onTick
     * @param onTICKComplete
     */
    startSimulation(nodes, edges = [], onTick, onTICKComplete) {

        // Add force-directed layout
        let layout = d3_force.forceSimulation();

        //   console.log(... arguments)

        var scale=this.mScale


        //FIXME containers need links
        layout
            .numDimensions(this.dimensions)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return scale/50;

                })
                .links(edges))
            .force("collide", d3_force.forceCollide(scale/10)
                .iterations(1))
            .force('charge', (node) => -scale/50)
            .force('linkStrength', (link) => 1)


            .stop();

        layout.on("tick", function () {
            onTick(layout, nodes, edges)
            if (onTICKComplete) onTICKComplete()
        }).on('end', function () {
        }).restart();

    }




    //TODO nodes + setNodes should provide an instanceof BaseCluster3D as default or an array of node primitives
    //in both cases we can determine the edges from it

    setNodes(nodes,onNodePositionChange) {


        if (!nodes instanceof __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__["a" /* default */] && !_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


        let mEdges = []

        var mNodes = [];
        //in case nodes are instance of BaseNode3D
        if (nodes instanceof __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__["a" /* default */]) {

            mNodes = Object.values(nodes.mClusters).map(function (n) {
                n.position.copy(new THREE.Vector3(0, 0, 0));
                return n.position;
            });


            mEdges = nodes.createEdgesForChildClusters();

        }
        else
        if (_.isArray(nodes)) {
        mNodes = nodes.map(function (n) {

            //mEdges   = EdgeUtil.getEdgesForNodes(nodes, true, false);
            mEdges = mEdges.concat(n.edges);

            _.extend(n,{x:0,y:0,z:0});
            return n;

        });

    }


        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            // Update nodes position
            //TODO remove this when particle node groups work with picking and selecting
          /*  d3Nodes.forEach(node => {

                const sphere = node._bubble;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });*/

          _.each(d3Nodes,onNodePositionChange)


        }, function () {

         /*   _.each(pcbs, function (pcElem) {
                //updates the array buffer for the point cloud
                pcElem.update()

            })*/

        });


    }

    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node,dx,dy,dz){

        return {position:new THREE.Vector3(0,0,0)}

      //  return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};

     }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ForceGraphDistribution;




/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

/**
 * a set of node objects
 * the cluster itself doesn't contain any visual representation of the nodes
 * Note: currently not used and partial functionality implemented in GraphData
 */





class ClusterNodeArray extends Array //List<Node>
{

    constructor(...args){
    super(...args)
        // TODO extend every loaded  node data in a similar way like it is done
        // currently by the default implementation


    }





}
/* unused harmony export default */




/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */








    class DefaultDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]
    {
    constructor(scale=1,dimensions=3){

        super(scale,dimensions)

    }



        setNodes(nodes,onNodePositionChange,onEnd) {
            if (nodes instanceof __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */]) {

                //TODO
                /*   if (nodes.isLeaf())
                 nodes =nodes.mNodes
                 else*/
                nodes = nodes.mClusters

            }
            else
            if (!_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


            //for canceling animation
            var mTimeout;

            let len= nodes.length|Object.keys(nodes).length


            var i=0,j=0,k=0;

            let _len;
            if (this.dimensions==1)
                _len=len;
            if (this.dimensions==2)
                _len= Math.sqrt(len);
            if (this.dimensions==3)
                _len=Math.pow(len,1/3);

            if (this.dimensions<3)  k=0.5*_len
            if (this.dimensions<2)  j=0.5*_len


            let step=1/_len

            //1d/2d/3d helpers
            //for (let i=0;i<=1;i+=step)

            var c=0;
            var that=this;
            var fixmeOnce=true;
            _.each(nodes,function(n){

                if (i>_len){
                    j++;
                    i=0;
                }

                if (j>_len){
                    k++;
                    j=0;
                }


                var dist= that.distribute(n, i/_len-0.5,j/_len-0.5,k/_len-0.5);



                //  onNodePositionChange(dist.position,c)


                //------------------------
                //------------------------

                //animating from current position to new one
                var mc=c;
                let origPos=(n.position)?n.position:n



                let tween = new TWEEN.Tween(origPos)
                    .to(dist.position,1)
                    .onUpdate(function () {



                    }).onComplete(function(){

                        onNodePositionChange(dist.position,mc)
                        //TODO instead of onEnd we shoudhave a timed function that gets called very 20 ms or so until onColplete is triggered by at least one node

                        if (fixmeOnce) {
                            if (onEnd) onEnd()
                            fixmeOnce=false
                        }

                        cancelAnimationFrame(mTimeout)

                    })
                    .start();

                //------------------------
                //------------------------


                //i+=step
                i++;
                c++;
            })



            requestAnimationFrame(animate);

            function animate(time) {
                mTimeout=    requestAnimationFrame(animate);
                TWEEN.update(time);
            }


        }


//TODO this is quite redundant we want the same work flow but not at idle copy costs if possible
    distribute(node,dx,dy,dz) {


        var mesh = (node._bubble) ? node._bubble : node;
        var absPos;
        if (mesh) {
            absPos = new THREE.Vector3();
            absPos.setFromMatrixPosition(mesh.matrixWorld);

        //TODO this is only working for specific cases currently
            if (mesh instanceof __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */])
            absPos.sub(mesh.getRoot().position)
             else
            absPos.sub(mesh.parent.parent.getRoot().position)

        }
        else {

        absPos={};  //if above fails, we interpret the node as a yet rendered node with  potential initial x,y,z

            (typeof node.x!="undefined")?absPos.x=node.x:0;
            (typeof node.y!="undefined")?absPos.y=node.x:0;
            (typeof node.z!="undefined")?absPos.z=node.x:0;

            }
        return {position:new THREE.Vector3(absPos.x,absPos.y,absPos.z).multiplyScalar(this.mScale)};
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = DefaultDistribution;




/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/**
 * Created by Frank on 30.05.2017.
 */




/**
 * a simple random distribution function
 *
 */

class RandomDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]
{
    constructor(...args)
    {
        super(...args);
        this.maxDiameter=this.mScale*2;
    }
    distribute(node,dx,dy){
        let min=this.maxDiameter/-2,max=this.maxDiameter/2

        let x=_.random(min,max);
        let y=this.dimensions>1?_.random(min,max):0;
        let z=this.dimensions>1?_.random(min,max):0;


        return {
            position:new THREE.Vector3(x,y,z)
        }
    }
}
/* unused harmony export default */



/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/**
 * Created by Frank on 06.06.2017.
 */







class SphericalDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */] {


    constructor(scale=50,dimensions=1){
        super(scale,2) //only 2d

    }


    /**
     *  implementation of the equirectangular projection
     * @param mVec2 - a THREE.Vector2 that has been transformed into normalised coordinates
     *
     */
    project2dNormalisedToSphere(mVec2, radius) {

    var longitude = mVec2.x * Math.PI
    var latitude = mVec2.y * Math.PI / 2

    var x = radius * Math.cos(latitude) * Math.cos(longitude)
    var y = radius * Math.cos(latitude) * Math.sin(longitude)
    var z = radius * Math.sin(latitude)

    return new THREE.Vector3(y, z, x) //?different coordinate system in skybox?

}


    distribute(node,dx,dy,dz){
       let mv3= this.project2dNormalisedToSphere(new THREE.Vector2(2*dx,2*dy),this.mScale/2)
        return {position:mv3};
    }




}
/* unused harmony export default */




/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__View3D__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__ = __webpack_require__(5);
/**
 * Created by Frank on 13.06.2017.
 */










class GraphView3D extends __WEBPACK_IMPORTED_MODULE_0__View3D__["a" /* default */]
{

    constructor(...args)
    {
        super(...args)

        this.mRootCluster=null

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


    initClusterForView(rawGraphData,parentEl3D) {


        if (!rawGraphData) return

        let speccs = this.getSpeccs();

        let graphData = new __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__["a" /* default */](rawGraphData)


        let preparedData = graphData.createClusterNodesAndEdges()

        var res = new __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__["a" /* default */](preparedData.nodes);

        parentEl3D.add(res);
        res.position.set(0, 0, 0);
        res.applyClustering(speccs)




        this.start()

        return res


    }


    setData(mGraphData)
    {
       // this.initStatic();

        if (!this.mRootCluster)
        this.mRootCluster= this.initClusterForView(mGraphData,this.mScene)




    }

    attachedCallback(){

    this.initStatic();

    }
}
/* unused harmony export default */



document.registerElement("graph-view-3d", GraphView3D);

/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 08.06.2017.
 */

class BaseEdge {

    constructor(start,end) {

        this.mStart=start;
        this.mEnd=end;

   /*     this.mStart = new THREE.Vector3();
        if (start) this.mStart.copy(start);


        this.mEnd = new THREE.Vector3();
        if (end) this.mEnd.copy(end);
    */

    }

    getStart() {
        return this.mStart;

    }

    getEnd() {
        return this.mEnd;
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseEdge;


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgeUtil__ = __webpack_require__(2);
/**
 * Created by Frank on 02.06.2017.
 */




/**
 * simple node implementation for interaction and basic visualisation
 *
 */
class BaseNode extends THREE.Mesh {

    /**
     * there are 3 types of events handled for a node
     * (1) mouse events via THREEx.domEvents
     * (2) keyboard hotkeys that are bound to "keyup" via jQuery.hotkeys
     * (3) any other custom event
     * NOTE: customise in sub class as needed
     */


    getRegisteredCustomEvents()
    {
        return ['before-render']

    }

    isCustomEvent(eventName)
    {
        return this.getRegisteredCustomEvents().indexOf(eventName)>=0
    }

    isMouseEvent(eventName)
    {
        return  THREEx.DomEvents.eventNames.indexOf(eventName) >= 0
    }



    //------------------------------------------------
    onCustomEvent(eventName,eventhandler)
    {
        this.mCustomEvents.on(eventName,eventhandler.bind(this))
    }

    offCustomEvent(eventName,eventhandler)
    {
        this.mCustomEvents.off(eventName,eventhandler)
    }


    triggerCustomEvent(eventName, origDomEvent, intersect)
    {
        this.mCustomEvents.trigger(eventName, origDomEvent, intersect)
    }
    //------------------------------------------------


    // we need a single window keyup listener that listens for keyevents and forwards/triggers
    // them on the current element similar to how the mouse events do
    //Note: the current implementation only triggers keypresses every 300 ms
    onKey(eventName, eventhandler) {
        let handler=_.throttle(eventhandler.bind(this),300)

        this.mKeyboardEvents.bind(eventName,handler ,'keydown');

    }
    //TODO wont work with debounced handler
    offKey(eventName, eventhandler)
    {
        this.mKeyboardEvents.unbind(eventName, eventhandler);
       // $(window).off(eventName, eventhandler);

    }

    triggerKey(eventName, origDomEvent, intersect)
    {
        this.mKeyboardEvents.trigger(eventName,  origDomEvent, intersect);
       // $(window).trigger(eventName, origDomEvent, intersect);
    }

    /**
     * gets called on the node that the mouse is hovering over
     *
     */
    resolveKeyEvent(event){


        this.mKeyboardEvents.handleKeyEvent(event)

     }


    //------------------------------------------------
    on(eventName, eventhandler) {


        for (let eName of eventName.split(" ")) {

            if (this. isCustomEvent(eName))
                this.onCustomEvent(eName,eventhandler);
            else
            if (this.isMouseEvent(eName))
                BaseNode.domEvents.addEventListener(this, eName, eventhandler.bind(this), false);
            else
                this.onKey(eName, eventhandler)

        };

        return this;
    }

    off(eventName, eventhandler) {

        for (let eName of eventName.split(" "))


        for (let eName of eventName.split(" ")) {

            if (this. isCustomEvent(eName))
                this.offCustomEvent(eName,eventhandler);
            else
            if (this.isMouseEvent(eName))
                BaseNode.domEvents.removeEventListener(this, eName, eventhandler, false);
            else
                this.offKey(eName, eventhandler)

        };

        return this;




    }

    trigger(eventName, origDomEvent, intersect) {





        for (let eName of eventName.split(" ")) {



            if (this. isCustomEvent(eName))
                this.triggerCustomEvent(eName, origDomEvent, intersect);
            else
            if (this.isMouseEvent(eName))
                BaseNode.domEvents._notify(eName, this, origDomEvent, intersect);
            else
                this.triggerKey(eName,origDomEvent, intersect)

        };

        return this;


    }




    //---------------end of event definition part----------------------

    constructor(...args) {

        BaseNode.initStatic()

        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            // wireframe: true,
            visible: true,
            opacity: 0.01,
            side: THREE.BackSide,
            // opacity: env.useDebugSphere ? 1 : 0,
            transparent: true,
            alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

        });


        super(BaseNode.sphereGeometry, material);

        this.mCustomEvents=$({})


        this.addDefaultHandlers();

        //custom events container

        //keyboard events container
        // TODO to be able to use event bubbling we'd need to append the html elements to the one of the parent cluster
        this.mKeyboardEvents= new Mousetrap(document.createElement("span"));


    }




    addDefaultHandlers() {

        //FIXME something is off with ordering an nesting .. preventing the correct node to be used
        //store the current cluster/node
        this.on("mouseover", function (e) {
            BaseNode.lastHoveredNode = e.target
           // e.stopPropagation()

        })
        this.on("mouseout", function (e) {
          //  BaseNode.lastHoveredNode =null;
          //  e.stopPropagation()

        })


        // adding before-render event

        function onBeforeRender(){
            this.trigger("before-render")

        }

        Object.defineProperty(this, "onBeforeRender", {
            enumerable: false,
            configurable: false,
            get: function() { return onBeforeRender.bind(this); }.bind(this),
            set: function(newValue) {

                console.warn("onBeforeRender cannot be overridden use .on('before-render',function(){}) instead")


            }

        });
        //------------------

        // adding before-render event default handler
        this.on("before-render",function(){
            this.update()

        })


    }


    static initStatic() {
        if (BaseNode._static_initialised_) return

        //BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.sphereGeometry = new THREE.SphereGeometry(10, 10, 5);
        BaseNode.emptyGeometry = new THREE.Geometry();
        BaseNode.emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        BaseNode.lastSelectedNode = null;

        BaseNode.lastHoveredNode = null;

        //FIXME set camera and domElement not via env attribute ...
        // BaseNode.domEvents = new THREEx.DomEvents(/*camera, renderer.domElement*/)
        BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true



        //have one gloabal listener for all nodes and let them
        $(window).on("keydown", function (e) {
            if (!BaseNode.lastHoveredNode) return

            BaseNode.lastHoveredNode.resolveKeyEvent(e)

        });



    }


    /**
     * update stub, override in descending class
     *
     *
     */
    update(){}

}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseNode;


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseEdge__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(2);
/**
 * Created by Frank on 08.06.2017.
 */





class EdgesContainer extends THREE.Object3D {
    constructor(...args) {
        super(...args);
        this.initLineMesh();
    }

    addEdge(_edge) {

        //        let newEdge = new BaseEdge(_edge.mStart,_edge.mEnd);
        let newEdge = new __WEBPACK_IMPORTED_MODULE_0__BaseEdge__["a" /* default */]( _edge.source._bubble.position, _edge.target._bubble.position);

        this.mEdges.geometry.vertices.push(newEdge.getStart());
        this.mEdges.geometry.vertices.push(newEdge.getEnd());


        return newEdge;
    }

    updateEdges() {

        this.mEdges.geometry.verticesNeedUpdate = true;

    }

    setFromNodes(nodes) {


        let edges = __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__["a" /* default */].getEdgesForNodes(nodes, false, true);


        for (let edge of edges)
            this.addEdge(edge)


        this.updateEdges();


    }


    initLineMesh() {

        var line_geom = new THREE.Geometry();
        var lineMaterial
        var mergedLineMesh

        function initLineGroup(options) {


            defaults = {
                opacity: 0.01,
                transparent: true,
                //lineIsVisible:true, // if disabled the line won't be shown on the scene
                color: 0xffffff
            }

            options = _.extend(defaults, options)

            lineMaterial = new THREE.MeshBasicMaterial({
                color: options.color,
                transparent: options.transparent,
                opacity: options.opacity,
                depthTest: false,
                depthWrite: false
            });


            mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);


            //TODO compute boundingbox to prevent flicker when edges are partially off screen
            //   mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);


            return mergedLineMesh;
        }


        this.mEdges = initLineGroup({
            opacity: 0.5,
            color: 0x49616C,
            transparent: true,
        })

        this.add(this.mEdges)


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = EdgesContainer;



/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_DefaultDistribution__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__distributions_RandomDistribution__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__distributions_SphericalDistribution__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__ClusterNodeArray__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__ClusterLeafElement__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__Cluster3DExtended__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__RootCluster__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__GraphData__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__view_GraphView3D__ = __webpack_require__(12);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Cluster3DExtended", function() { return __WEBPACK_IMPORTED_MODULE_8__Cluster3DExtended__["a"]; });
/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */





















//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------




/**
 * currently used for debugging purposes
 */
class MyMain {

    constructor() {


        this.setupViews()

        //  this.clusters = this.init();


    }


    setupViews() {

        var container = $("<div>")
            .css({display:"flex",position: "absolute", top: "10em", left: "20em", width: "60em"})
            .appendTo("body")

        let thumbCSS = {
            height: 300,
            width: 400,
            display: "flex",
            border: "1px solid rgba(128, 128, 128, 0.5)",
            margin:"0.2em"
        }

        var that=this

        var speccs=[].concat(this.getPossibleClusterSpeccsArray());//FIXME speccs does have 4 elements 0,1,3?
        function loadData() {

            if (!that.mGraphData) {
                console.warn("data not loaded")
                return ;
            }

            let mSpeccs=[speccs[0], speccs[1], speccs[3]]

            this.setSpeccs(mSpeccs).setData(that.mGraphData)
        }


        let mGraphView1 = document.createElement("graph-view-3d")

        $(mGraphView1)
            .css(thumbCSS)



        $(mGraphView1).on("click",loadData )


        let mGraphView2 = document.createElement("graph-view-3d")
        $(mGraphView2)
            .css(thumbCSS)

        $(mGraphView2).on("click",loadData )


        //$(this).on("data-changed",function(){})



        container.append(mGraphView1, mGraphView2)


    }

    getPossibleClusterSpeccsArray() {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](40000, 2) //1000
        let sample2 = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](5000, 2)//200
        let sample3 = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](100, 3)//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 15}},

            , {distribution: sample3}


        ]

    }

    getForceSpeccs() {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__["a" /* default */](40000, 3) //1000
        let sample2 = new __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__["a" /* default */](5000, 3)//200
        let sample3 = new __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__["a" /* default */](100, 3)//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 15}}
            , {distribution: sample3}


        ]

    }


    setGraphData(graphData) {
        this.mGraphData = graphData;
       // this.init(mGraphData);

        //TODO
        //$(this).trigger("data-changed")

    }



    runSample1() {
        console.log("runSample1")
        let speccs = this.getPossibleClusterSpeccsArray();

        this.clusters.applyClustering([speccs[0], speccs[1], speccs[2]])


    }


    runSample2() {
        console.log("runSample2")
        let speccs = this.getForceSpeccs();

        this.clusters.applyClustering(speccs);
    }

    runSample3() {
        console.log("runSample3")
        let defaultEntry = {distribution: new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](4000, 2)}

        this.clusters.applyClustering([defaultEntry])


    }

    runSample4() {
        console.log("runSample4")
        let defaultEntry = {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_DefaultDistribution__["a" /* default */]()}

        this.clusters.applyClustering([defaultEntry])


    }


}
/* harmony export (immutable) */ __webpack_exports__["MyMain"] = MyMain;





	

/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 08.06.2017.
 */

//TODO refactor existing samples
class ZoomUtil
{


    static moveToMesh(mesh,onEnd,minMaxDistance=400) {

        var mTimeout;

    var vec3Start = mCamera.position


    var vec3End = new THREE.Vector3();
    vec3End.setFromMatrixPosition( mesh.matrixWorld );

    //	var vec3End = mesh.position //e.target.position


    //we want to have a fixed distance to a node when selecting
    var distVec = vec3End.clone().sub(vec3Start)
    var len = distVec.length()
    distVec.normalize()
    distVec.multiplyScalar(minMaxDistance) //apply fixed distance to the target

    var alteredVecEnd = vec3End.clone().sub(distVec)


    if (typeof onEnd!="function") onEnd=function(){}
    //change distance to target
    var tween = new TWEEN.Tween(vec3Start)
        .to(alteredVecEnd, 400)
        .onUpdate(function () {

        }).onComplete(function(){  onEnd.bind(this)();  cancelAnimationFrame(mTimeout)  })
        .start();

    //lookat target
    var tween2 = new TWEEN.Tween(globalEnv.controls.target)
        .to(vec3End, 400)
        .onUpdate(function () {

        })
        .start();

    requestAnimationFrame(animate);

        function animate(time) {
            mTimeout=    requestAnimationFrame(animate);
            TWEEN.update(time);
        }

}


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ZoomUtil;


/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 13.06.2017.
 */


//a view class to be able to use multiple views and switch between them
//limit fps
//see shadertoy for usage as thumbnail and such


class View3D extends HTMLElement
{

    constructor(...args){
    super(...args)



       this.initStatic()




    }


    resizeCanvas() {
    if (this.mRenderer) {
        this.mRenderer.setSize(this.clientWidth, this.clientHeight);
        this.mCamera.aspect = this.clientWidth /this.clientHeight;
        this.mCamera.updateProjectionMatrix();
    }
}


   /* get scene() {
        return ""+ this.mScene
    }
    set scene(scene) {
        this.mScene=scene
    }
*/
    setCaption(text)
    {
        this.mCaption.html("").append(text)
        return this
    }


    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

    if (this._inited_static_) return;
 var that=this

        this.mFPS=30;
        this.minFPS=0;
        this.maxFPS=144;


        this.mLastFrameTime=-1


        this.mCaption=$("<span>View3D</span>").css({
            "pointer-events":"none",
            position:"relative",top:0,left:0,zIndex:1})

        $(this).append(   this.mCaption)

        // Add nav info section


        //createTooltip()

        // Setup camera
        this.mCamera = new THREE.PerspectiveCamera();
        this.mCamera.far = 100000;


        // Setup scene

        this.mScene = new THREE.Scene();



        this.mCamera.lookAt(this.mScene.position);

        this.mCamera.position.z = 5000;



        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.mRenderer.setClearColor( 0x111111 );
        this.mRenderer.setPixelRatio( window.devicePixelRatio );

        this.appendChild(this.mRenderer.domElement);


 /*    //FIXME binding events will interfere with controls
    $(this.mRenderer.domElement).on("mouseover",function(){
            that.setActive()
        })
        $(this.mRenderer.domElement).on("mouseout",function(){
            that.setInactive()
        })
        */



        $(this.mRenderer.domElement).css({    position: "absolute",width:"100%",height:"100%"})


        //init domEnvents
        this.mDomEvents = new THREEx.DomEvents(this.mCamera, this.mRenderer.domElement)

        // Add camera interaction


        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);
        this.mControls.rotateSpeed = 0.3
        window.oooView=  this



        this.resizeCanvas()

        this.mControls.addEventListener("change", (...args)=> $(this).trigger("change",...args)  )

        this._inited_static_=true

    return this

    }

         // Kick-off renderer
    animate() {


var that=this;
      function animate(time) {

          that.mControls.update();

          if (that.mFPS==0) return;

          let nextTime=that.mLastFrameTime + (1000 / that.mFPS);
          if (nextTime > time) {

              that.mFrameId = requestAnimationFrame(animate);
              return;
          }

      //    console.log("animate",time)

          that.mLastFrameTime = time




          $(that).trigger("before-frame")
          $(that).trigger("animate")

          that.mRenderer.render(that.mScene, that.mCamera);


          that.mFrameId = requestAnimationFrame(animate);
      }

        animate(-1)

    }


    add(object3D)
    {
        this.mScene.add(object3D)

    }

    setActive()
    {

        //fullscreen
        $(this).addClass("view-3d-maximised")

        //fps
        this.mFPS=this.maxFPS

        this.resizeCanvas()
    }

    setInactive()
    {
        $(this).removeClass("view-3d-maximised")
        this.mFPS=this.minFPS

        this.resizeCanvas()
    }


    start(){

    this.stop()

     this.animate()


    }

    stop(){
        window.cancelAnimationFrame( this.mFrameId)
    }

    resume(){

       this.start()

    }


    show(){
        this.resume()


    }

    hide() {
        this.stop()
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = View3D;




document.registerElement("view-3d", View3D);

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map