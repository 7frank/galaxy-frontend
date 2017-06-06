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
/******/ 	return __webpack_require__(__webpack_require__.s = 13);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseNode__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__ = __webpack_require__(3);
/**
 * Created by Frank on 30.05.2017.
 */








/**
 *
 * cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 * cluster.find("#other").setDistribution(_dist)
 * cluster.find("United States").applyClustering(...)
 */


//refactoring current cluster structure
class BaseCluster3D extends __WEBPACK_IMPORTED_MODULE_1__BaseNode__["a" /* default */] {

    //TODO implement these stubs in sub class
    //createEdgeContainer(){}


    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers) {
        super();
        this.addNodes(nodes);
        //by default the cluster is no leaf. TODO

        this.mClusters = {}


        //FIXME an additional dist schould be called for leaf elements ...  >1 else ...
        //xCluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        else this.updateCluster()


    }

    addNodes(nodes) {
        if (!this.mNodes) this.mNodes = []

        if (typeof nodes == "undefined") return

        if (_.isArray(nodes))
            this.mNodes = this.mNodes.concat(nodes)
        else
            this.mNodes.push(nodes)

    }

    getNodes() {
        return this.mNodes;
    }


    addAllSubClustersToContainer() {

        _.each(this.mClusters, (cluster) => this.add(cluster))

    }



    getChildClusterConstructor()
    {
        return this.constructor

    }

    /**
     * this method can be re-run to change the sub-clusters
     -which will result in deleting old clusters
     -adding new ones to the container

     */

    applyClustering(mClusteringSpeccsArray) {

        //e. g. result should be .. {china:instanceof BaseCluster3D}


        var entry = mClusteringSpeccsArray[0]


        this._clusterThis(entry)

        _.each(this.mClusters, function (mCluster, key) {

            var nextDepthSpeccsArray = [].concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length > 1)
                mCluster.applyClustering(nextDepthSpeccsArray);
            else
                mCluster.createParticlePointCloud(nextDepthSpeccsArray[0]);


        })

        this.updateCluster()


    }

    _clusterThis(entry) {
    var clazz=this.getChildClusterConstructor();
        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options)


        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        _.each(this.groupBy(entry.generator), function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz;//new BaseCluster3D()

                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else
                _clustersObj[key] = _cluster

        })


        _.extend(this.mClusters, _clustersObj)


        this.setDistributionHandler(entry.distribution)

    }


    groupBy(filterFunction) {
        var clazz=this.getChildClusterConstructor();

        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] =  new clazz;//new BaseCluster3D();

            container[key].addNodes(val)
        }

        for (el of this.mNodes)
            filterFunction(groupFunction, el)


        return container

    }


    /**
     *   TODO should be overridden for ClusterLeaf
     *
     *  used only to change distribution of current cluster
     *
     * @param distribution instanceof BaseDistribution
     */
    setDistributionHandler(distribution) {

        var values = Object.values(this.mClusters)
        //TODO translation,rotation,scale by using different per-node function

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution);
        else
        distribution.setNodes(this, function onStep(vecPosition, i) {
          //  let n = values[i];
          //  n.position.copy(vecPosition)
        }/*,()=> this.updateTest()*/  ); //FIXME


    }



    //TODO  re-calculate boundingsphere from time to time
    updateHull() {


    }

    createHull() {

        if (this.mHull&&this.mHull.geometry)
            this.mHull.geometry.dispose();
        if (this.mHull && this.mHull.material)
            this.mHull.material.dispose();

        if (this.mHull) this.remove(this.mHull)



        let boundingSphere = new THREE.Sphere;

        let boundingBox = new THREE.Box3;
       // boundingBox.setFromObject(this);
        boundingBox.setFromObject(this);

        //get center, radius
        let _center = boundingBox.getCenter();
        let radius = boundingBox.getSize().length() / 2;


        //TODO
        if (radius<40) radius=40


      //  boundingSphere.center.copy(_center);
        boundingSphere.radius = radius;


       // this.geometry.boundingBox = boundingBox;
        this.geometry.boundingSphere = boundingSphere;


        var geometry = new THREE.RingGeometry( boundingSphere.radius*0.01, boundingSphere.radius, 32 );
        var material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: false, transparent: true, opacity: 0.02});


        //  var geometry = new THREE.SphereGeometry(boundingSphere.radius, 16, 16);
      //  var material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.1});
        this.mHull=new THREE.Mesh(geometry,material)
      // this.mHull.position.copy(_center);

        this.geometry.boundingSphere=boundingSphere



        this.add(this.mHull);
        this.mHull.onBeforeRender=function(...args)
        {
            //billboard effect
            this.setRotationFromQuaternion( args[2].quaternion )

        }

        //  this.mHull.position.copy(boundingSphere.center)
        //  this.add(this.mHull);


    }


    isLeaf()
    {
       return typeof this.mLeaf !="undefined"
    }

    createParticlePointCloud(entry) {
        // console.log("reached leaf cluster", this)

        let leaf = new __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */](this.mNodes);
        this.mLeaf = leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution)

    }

//TODO  can be convex hull in sub class in which case override
    updateCluster() {

        this.addAllSubClustersToContainer();

        //if (!this.mHull)
            this.createHull();
       // else
        //    this.updateHull();



    }


  //returns some infos of the children of the the cluster relative to each other
    getRelationInfo()
    {
        return __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].getClusterInfo(this.mClusters);

    }

    createEdgesForChildClusters(){

     return  __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].createEdgesBetweenClustersFromMap(this.mClusters);

    }


    getRadius(){

        return this.geometry.boundingSphere?this.geometry.boundingSphere.radius:null;

    }

    updateTest(){
        var clustersThatNeedHullUpdates=[]

        var leafsThatNeedHullUpdates=[]

        this.traverse(function(item){
            if (item instanceof BaseCluster3D)
                clustersThatNeedHullUpdates.push(item)

            if (item instanceof __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */])
                leafsThatNeedHullUpdates.push(item)

        })

        _.each( _.reverse(leafsThatNeedHullUpdates) ,function(cluster){
            cluster.updateHull();
        })


       _.each( _.reverse(clustersThatNeedHullUpdates) ,function(cluster){
           cluster.createHull();



       })


        this.createHull()

    }


    getLeafs()
    {
        var leafElements=[]

        this.traverse(function(item){
            if (item instanceof __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */])
                leafElements.push(item)

        })
      return leafElements;
    }

    //TODO see use case for potential implementation
    findClusters(selector)
    {
        var clusters=[]

        this.traverse(function(item){
            if (item instanceof BaseCluster3D)
                clusters.push(item)
        })

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
        this.dimensions=dimensions //TODO
        this.mScale=scale
    }


    setNodes(nodes,onNodePositionChange,onEnd)
    {
        if (nodes instanceof __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */])
            nodes=nodes.mClusters
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
                .to(dist.position,400)
                .onUpdate(function () {

                    onNodePositionChange(origPos,mc)

                }).onComplete(function(){


                    //TODO instead of onEnd we shoudhave a timed function that gets called very 20 ms or so until onColplete is triggered by at least one node
                    if (onEnd)onEnd()

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
/**
 * Created by Frank on 30.05.2017.
 */



class ClusterLeafElement extends THREE.Mesh
{
    constructor(nodes){
        super();


        //FIXME wrong positions
      //  this.appendNodes(nodes)

        this.mNodes=nodes;
        this.mParticles=this.createParticleCloud();

        this.add( this.mParticles.pointCloud)


    }

    appendNodes(nodes){

        var that=this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
               that.add(node._bubble)


        })


    }


    //TODO refactor
    setDistributionHandler(distribution)
    {

        var that=this;
        distribution.setNodes(this.mNodes,function onStep(vec,i){

            that.mParticles.updateNodePosition(i)




        });

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




    updateHull(){

        let pc=this.mParticles.pointCloud;
      //  pc.geometry.center()
return
        //FIXME not working as intended



        let box=new THREE.Box3;box.setFromObject(pc);
        pc.geometry.boundingBox=box;

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterLeafElement;




/***/ }),
/* 3 */
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
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
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


    }


    update()
    {
        super.update();



    }


    appendNodes(nodes){

        var that=this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
                that.add(node._bubble)


        })


    }




    //TODO
    updateTest(){
        super.updateTest();

      _.each(this.getLeafs(),function(leaf){

          leaf.parent._initDotParticles();

          leaf.parent.updateDotParticles()

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

     /*   if (this.mParticles) {
            this.mParticles.remove();
            delete(this.mParticles)
        }*/

        if (this.mParticles)  this.mParticles.start()


            if (this.isLeaf() && !this.mParticles) {

  var nodes=this.mLeaf.mNodes
            var demoOptions = {increment:1}

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount|5
                    //return 5
                }



            //TDODO refactor force-graph-utils
            console.log(nodes)
            var particles = createParticleSystemForNodes(nodes, demoOptions);
            this.add(particles.pointCloud);

            this.mParticles = particles;
        }

    }





}
/* harmony export (immutable) */ __webpack_exports__["a"] = Cluster3DExtended;


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

/**
 * a set of node objects
 * the cluster itself also contains parts of the visual representation of the nodes
 * TODO in which case the clster might rather inherit from THREE.Points (point cloud) ?
 */





class ClusterNodeArray extends Array //List<Node>
{

    //FIXME
    /*push(el)
     {

     if (! el instanceof Node  ) throw new Error("ClusterNodeArray must only contain instanceof",Node)
     return super.apply(this,arguments)
     }*/


    groupBy( filterFunction){
        let container={}

        function groupFunction(key,val)
        {
            if (typeof container[key]=="undefined")   container[key]=new ClusterNodeArray();

            container[key].push(val)
        }

        for (el of this)
            filterFunction(groupFunction,el)


        return container

    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterNodeArray;




/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__NodeUtil__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(3);
/**
 * Created by Frank on 02.06.2017.
 */





/**
 * simple node implementation for interaction and basic visualisation
 *
 */
class BaseNode extends THREE.Mesh {

    constructor(...args) {

        BaseNode.initStatic()

        var material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            visible: true,
            opacity: 1,
            // opacity: env.useDebugSphere ? 1 : 0,
            transparent: true,
            alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

        });

        super(BaseNode.sphereGeometry, material);

      //  this.addDefaultListeners();


    }


    addDefaultListeners() {

        this.on("click", () =>
            __WEBPACK_IMPORTED_MODULE_0__NodeUtil__["a" /* default */].zoomToNode(this, function complete() {
            })
        );
    }


    static initStatic() {
        if (BaseNode._static_initialised_) return

        BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.emptyGeometry = new THREE.Geometry();
        BaseNode.emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        BaseNode.lastSelectedNode = null;

        //FIXME set camera and domElement not via env attribute ...
        // BaseNode.domEvents = new THREEx.DomEvents(/*camera, renderer.domElement*/)
        BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true


    }

    on(eventName, eventhandler) {
        BaseNode.domEvents.addEventListener(this, eventName, eventhandler, false);
        return this;
    }

    off(eventName, eventhandler) {
        BaseNode.domEvents.removeEventListener(this, eventName, eventhandler, false);
        return this;
    }

    trigger(eventName, origDomEvent, intersect) {

        BaseNode.domEvents._notify(eventName, this, origDomEvent, intersect);
        return this;
    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseNode;


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterNodeArray__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ClusterLeafElement__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ClusterNodeElement__ = __webpack_require__(11);
/**
 * Created by Frank on 30.05.2017.
 */








//it's important that the clusters are dynamic
//so if we want to reorder elements with a set of new generator functions




class ClusterFactory{

    static doSubdivideIntoClusters(allNodesClustersObject, actionsArray)
    {

        var entry=actionsArray.shift()

        var _g=entry.generator
        var _dist=entry.distribution

        var options=_.extend({minClusterSize:10,defaultMergeGroupName:"other"},entry.options)


        //....
        var clusters={}

        _.each(allNodesClustersObject,function(nodeCluster, id) {

            var _clustersObj = {};


            //post-process
            //merge clusters that don'tmatch the criterian again
            _.each(nodeCluster.groupBy(_g), function (_cluster, key) {

                if (_cluster.length < options.minClusterSize) {

                    var dMGN = options.defaultMergeGroupName
                    if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new __WEBPACK_IMPORTED_MODULE_0__ClusterNodeArray__["a" /* default */]()

                    _clustersObj[dMGN] = _clustersObj[dMGN].concat(_cluster)
                }
                else
                    _clustersObj[key] = _cluster

            })


            /*

             TODO position each node by using the distribution function
             TODO also when clustering in a different manner... how to handle already applied distribution? we want the nodes to move to the new cluster instead of simply pop up there
             if (_dist)
             _dist => foreach _clustersObj

             */

            //TODO we want a tree structure for the nodes to be rendered but we might already have such a structure from another
            // iteration so the nodes do have to be put into other groups dynamically

            if (actionsArray.length > 0) {

                let res= ClusterFactory.doSubdivideIntoClusters(_clustersObj, actionsArray);

                // clusters[id] = res

                let nnn=new  __WEBPACK_IMPORTED_MODULE_2__ClusterNodeElement__["a" /* default */](res)
                nnn.setDistributionHandler(_dist)
                clusters[id]=nnn


            }else {

                //no more subdivisions for this branch

                //FIXME but we want to maintain the category each element is in. so we need an object instead of an array
                //TODO refactor


              /*  var res= _.map(_clustersObj,function(v,k){

                    let leaf=new ClusterLeafElement(v);
                    leaf.setDistributionHandler(_dist)
                    return  leaf

                })*/

                var res= {}
                    _.each(_clustersObj,function(v,k){

                    let leaf=new __WEBPACK_IMPORTED_MODULE_1__ClusterLeafElement__["a" /* default */](v);
                    leaf.setDistributionHandler(_dist)
                    res[k] =leaf

                })


                clusters[id] =  res;
            }
        })
        return clusters


    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterFactory;


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(3);
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
/* 9 */
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
/* harmony export (immutable) */ __webpack_exports__["a"] = RandomDistribution;



/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__ = __webpack_require__(4);
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

        this.addNodeCaptions()

    }

    //prevent multiple recursive  root clusters from being created by default
    getChildClusterConstructor()
    {
        return this.__proto__.constructor;

    }


    addNodeCaptions(){
        //TODO the root cluster manages the visibility of all of it's currently visible nodes
        //we do have a hierarchical structure that we can use to speed up the rendering a bit

        //TODO
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

        this.tn.update();

    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = RootCluster;


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 30.05.2017.
 */

//TODO this should be refactored to match the object structure better
// clusters.china.others => ClusterNodeArray.ClusterNodeElement.ClusterNodeLeaf

class ClusterNodeElement extends THREE.Object3D{
    constructor(children) {

        super()
        this.mClusters=children

        var that=this;
        var j=0;
        var clusterDistanceX=1050;
        var _len=Object.keys(this.mClusters).length
        _.each(this.mClusters,function(subObject,id) {


            // let _x=((j-(_len/2)))*clusterDistanceX

            var container=new THREE.Group()
            //   container.position.set(_x,0,0)


            //add sphere as hint for the cluster
            var geometry = new THREE.SphereGeometry(500, 8, 8 );
            var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,transparent:true,opacity:0.1} );
            var sphere = new THREE.Mesh( geometry, material );
            container.add( sphere );



            j++;

            var arr=Object.values(subObject)

            var nodeDistanceX=120;
            for (let i=0,len=arr.length;i<len;i++) {

                let el=arr[i];

                let _x=((i-(len/2)))*nodeDistanceX

                el.position.set(_x,-150,0)


                //add another sphere as hint for the leaf
                var geometry = new THREE.SphereGeometry(50, 16, 16 );
                var material = new THREE.MeshBasicMaterial( {color: 0xff0000,wireframe:true,transparent:true,opacity:0.1} );
                var sphere = new THREE.Mesh( geometry, material );
                el.add( sphere );



                container.add(el)


            }

            that.add(container)

        })

    }

    //TODO refactor
    setDistributionHandler(distribution)
    {

        var that=this;
        distribution.setNodes(this.children,function(vec,i){
            let n= that.children[i];

            n.position.copy(vec)

            // that.mParticles.updateNodePosition(i)

        });



    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterNodeElement;


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseNode__ = __webpack_require__(6);
/**
 * Created by Frank on 02.06.2017.
 */



class NodeUtil {

   static zoomToNode(nodeMesh, onEnd) {

       let mCamera= __WEBPACK_IMPORTED_MODULE_0__BaseNode__["a" /* default */].domEvents._camera
        var mTimeout;

        let minMaxDistance = 400;

        let vec3Start = mCamera.position;
        let vec3End = nodeMesh.position;


        //we want to have a fixed distance to a node when selecting
       let distVec = vec3End.clone().sub(vec3Start);
       let len = distVec.length();
        distVec.normalize()
        distVec.multiplyScalar(minMaxDistance) //apply fixed distance to the target

        let alteredVecEnd = vec3End.clone().sub(distVec)


        if (typeof onEnd != "function") onEnd = function () {
        };

        //change distance to target
       let tween = new TWEEN.Tween(vec3Start)
            .to(alteredVecEnd, 400)
           // .onUpdate(function (){})
           .onComplete(function(){

               onEnd()
               cancelAnimationFrame(mTimeout)

           })
            .start();

        //lookat target
       let tween2 = new TWEEN.Tween(globalEnv.controls.target)
            .to(vec3End, 400)
            //.onUpdate(function () {})
            .start();

        requestAnimationFrame(animate);

        function animate(time) {
        mTimeout=    requestAnimationFrame(animate);
            TWEEN.update(time);
        }

    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = NodeUtil;


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["getNodesFromCluster"] = getNodesFromCluster;
/* harmony export (immutable) */ __webpack_exports__["getEdgesForNodes"] = getEdgesForNodes;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ForceGraphDistribution__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ClusterNodeArray__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__ClusterFactory__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__ClusterLeafElement__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__Cluster3DExtended__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__RootCluster__ = __webpack_require__(10);
/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */
















//---------------------------
class GlobalNodesContainer {
    constructor(nodes) {
        this.mNodes = new __WEBPACK_IMPORTED_MODULE_3__ClusterNodeArray__["a" /* default */](...nodes)

        //TODO mClusters should work that way
        this.root = new THREE.Object3D()

    }


    applyClustering(arr) {
        let res = __WEBPACK_IMPORTED_MODULE_4__ClusterFactory__["a" /* default */].doSubdivideIntoClusters({root: this.mNodes}, arr)
        this.mClusters = res.root

        return this
    }


}
//---------------------------

class MyGlobalNodesContainer extends GlobalNodesContainer {
    constructor(nodes) {
        super(nodes)

        this.createSample(nodes)

    }

    /**
     * code below for sample clustering
     *
     * -allNodes
     * --sameCompany
     * ---sameIndustry
     *
     */

    /*
    createSample(nodes) {


        //TODO re-merge function to be able to undo grouping for sizes < 40 like in the default implementation

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //others migh be .. RandomDistribution
        let companyDistributionFunction = new BaseDistribution()
        let categoryDistributionFunction = new RandomDistribution()

        //if a distribution parameter is set, the generated cluster will use it to position the nodes depending on it
        // TODO is it of any use to be able to apply multiple distributions per cluster? like spherical,force-graph?
        //or is it better to create the force graph "by hand"
        this.applyClustering([
            {generator: countrySetGenerator, distribution: companyDistributionFunction, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: categoryDistributionFunction, options: {minClusterSize: 5}}

        ])


    }
*/

}
/* harmony export (immutable) */ __webpack_exports__["MyGlobalNodesContainer"] = MyGlobalNodesContainer;



//like cluster united states or united states+someindustry
function getNodesFromCluster(clusters) {
    let _clusters = _.map(clusters, (c) => c.mNodes);

    return _.concat([], ..._clusters)

}

//helper function should be part of utils probably
//get relevant edges for a given (sub)set of nodes
//by default it will return a set of edges that are limited to the subset itself (edges that leave the cluster are ignored)
/**
 * @deprecated
 */

function getEdgesForNodes(nodes, bInternal = true, bExternal = false) {

    if (nodes instanceof __WEBPACK_IMPORTED_MODULE_5__ClusterLeafElement__["a" /* default */]) nodes = nodes.mNodes

    if (!bInternal && !bExternal) return []
    //get relevant edges from
    //a.clusters.mClusters.mClusters["United States"][0].mNodes

    var edges = [];

    _.each(nodes, function (node, id) {

        //check if it is a container element
        if (node instanceof __WEBPACK_IMPORTED_MODULE_5__ClusterLeafElement__["a" /* default */]) {
            let _edges = getEdgesForNodes(node.mNodes, bInternal, bExternal)
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


//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------

/**
 * currently used for debugging purposes
 */
class MyMain {

    constructor() {


    }

    firstSample(){

        var a = new MyGlobalNodesContainer(globalNodes);
        globalEnv.scene.add(a.mClusters);
        a.mClusters.position.set(0, 1000, 0);

        this.clusters = a.mClusters.mClusters


    }


    getPossibleClusterSpeccsArray()
    {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](1000,2)
        let sample2 = new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](50,3)



        let companyDistributionFunction = new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](200,3)
        let categoryDistributionFunction = new __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__["a" /* default */](100)


        let forceFraphDistribution = new __WEBPACK_IMPORTED_MODULE_2__ForceGraphDistribution__["a" /* default */](100,3)

        let rand2 = new __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__["a" /* default */](200,2)
        let rand3 = new __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__["a" /* default */](300,3)



        return [
           // {generator: countrySetGenerator, distribution: companyDistributionFunction, options: {minClusterSize: 3}}
           // ,{generator: industrySetGenerator, distribution: categoryDistributionFunction, options: {minClusterSize: 5}}

             {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 3}}
             ,{generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 3}}

            ,{distribution: forceFraphDistribution}
            ,{distribution: rand2}
            ,{distribution: rand3}

      ]

    }

    betterSample()
    {
        let speccs=this.getPossibleClusterSpeccsArray();
//        var res= new BaseCluster3D(globalNodes,[speccs[0],speccs[1]]);
        var res= new __WEBPACK_IMPORTED_MODULE_8__RootCluster__["a" /* default */](globalNodes,[speccs[0],speccs[1]]);

        globalEnv.scene.add(res);
        res.position.set(0, 1000, 0);

        setTimeout(function()
        {
            //   res.updateCluster()
            res.updateTest()

        },1000 )


        this.clusters = res;

//random distribution on click


      function onClickFactory(res,speccs){
          var curr=0

         return function clickAndSpeccHandler(){



              var _dist=speccs[curr++%speccs.length].distribution

              console.log("setting distribution function",_dist)
              res.setDistributionHandler(   _dist  )

              //FIXME add complete handler
              setTimeout(function()
              {

                  res.updateTest()

              },1000 )



          }


      }


       let speccsRoot=[ {distribution: new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](2500,1)},{distribution: new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](1000,2)},{distribution: new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](800,3)}]
        res.on("click",onClickFactory(res,speccsRoot))

        _.each(res.mClusters,function(res){

            let speccsRoot=[ {distribution: new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](150,1)},{distribution: new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](100,2)},{distribution: new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */](50,3)},{distribution: new __WEBPACK_IMPORTED_MODULE_2__ForceGraphDistribution__["a" /* default */](100,3)}]
            res.on("click",onClickFactory(res,speccsRoot))



        })


        //------------------------------




      return res


    }


    startForceGraphSampleOnSubsets(obj) {

        let clusters = this.clusters;


        if (typeof obj == "undefined")
            obj = "United States";


        let mNodes;
        var pcbs;
        //TODO refactor a cluster should already have the reference for its nodes
        if (typeof obj == "string") {
            mNodes = getNodesFromCluster(clusters[obj]);
            pcbs = _.map(clusters[obj], (c) => c.mParticles);


        }

        if (obj instanceof __WEBPACK_IMPORTED_MODULE_5__ClusterLeafElement__["a" /* default */]) {
            mNodes = obj.mNodes

            pcbs = [obj.mParticles]
        }


        let mEdges = getEdgesForNodes(mNodes, true, false);


        this.startSimulation2(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            // Update nodes position
            //TODO remove this when particle node groups work with picking and selecting
            d3Nodes.forEach(node => {

                const sphere = node._bubble;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });

        }, function () {

            _.each(pcbs, function (pcElem) {
                //updates the array buffer for the point cloud
                pcElem.update()

            })

        });

        //start the force graph simulation
        //TODO this has to be placed within another sub class

    }


//TODO apply changes so that it works with e.g.g c and c.china and c.china.others in the same way
// for that the objects and arrays currently used should be THREE.Object3D at least

    startForceGraphSampleOnContainers(obj = "China") {
        var foobar = _.map(this.clusters[obj], (v, k) => v)
        var clusters = this.clusters

        let mNodes = foobar;
        let XNodes;
        //TODO refactor a cluster should already have the reference for its nodes
        if (typeof obj == "string") {
            XNodes = getNodesFromCluster(clusters[obj]);

        }

        //todo not working this way
        let mEdges = getEdgesForNodes(XNodes, true, false);


        this.startSimulation2(mNodes, mEdges, function layoutTick(layout, clusterContainers, d3Links) {


            // Update nodes position

            //TODO remove this when particle node groups work with picking and selecting
            clusterContainers.forEach(node => {

                const sphere = node;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });


        });

        //start the force graph simulation
        //TODO this has to be placed within another sub class

    }


    //---------------------------------

    /**
     * a reduced simulation (for testing)
     *
     *
     * @param nodes
     * @param edges
     * @param onTick
     * @param onTICKComplete
     */
    startSimulation2(nodes, edges = [], onTick, onTICKComplete) {

        // Add force-directed layout
        let layout = d3_force.forceSimulation();

        //   console.log(... arguments)


        //FIXME containers need links
        layout
            .numDimensions(3)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return 20;

                })
                .links(edges))
            .force("collide", d3_force.forceCollide(60)
                .iterations(1))
            .force('charge', (node) => -300)
            .force('linkStrength', (link) => 1)


            .stop();

        layout.on("tick", function () {
            onTick(layout, nodes, edges)
            if (onTICKComplete) onTICKComplete()
        }).on('end', function () {
        }).restart();

    }

    // --------------------------------
    startSimulation(nodes, edges, onTICKComplete) {

        // Add force-directed layout
        let layout = d3_force.forceSimulation();


        let cntTicks = 0;
        const startTickTime = new Date();

        function layoutTick(layout, d3Nodes, d3Links) {

            //console.error("tick tack", new Date() - startTickTime)

            /*  if (cntTicks++ > env.maxConvergeFrames || (new Date()) - startTickTime > env.maxConvergeTime) {
             layout.alpha(0); //trigger end
             layout.stop(); // Stop ticking graph
             }
             */
            // Update nodes position

            //TODO remove this when particle node groups work with picking and selecting
            d3Nodes.forEach(node => {

                const sphere = node._bubble;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });

            // env.nodeClouds.update()

            //todo animationg this will currently not work
            /*	// Update links position
             d3Links.forEach(link => {

             link.setStartEnd(link.source, link.target)

             });

             */

            if (onTICKComplete)
                onTICKComplete()

        }


        layout
        //.numDimensions(env.numDimensions)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return 20;

                }).links(edges))
            .force("collide", d3_force.forceCollide(60).iterations(1))
            //.force('charge', d3_force.forceManyBody())
            .force('charge', function (node) {

                return -300

            })
            .force('linkStrength', function (link) {

                return 1

            })

            //.force('gravity',function(){ return 0})
            //.force('charge',function(){ return 0})

            //.force('center', d3_force.forceCenter())

            .stop();


        //
        // handleConvexHullFeature()

        /*   for (let i = 0; i < env.initialEngineTicks; i++) {
         layout.tick();
         } // Initial ticks before starting to render
         */


        //hide text overlay and show after layout finishes
        //   env.textNode.hide()


        layout.on("tick", function () {

            layoutTick(layout, nodes, edges)
        }).on('end', function () {

            /*
             // Run this when the layout has finished!
             console.log("rendering graph finished.. use 'ctrl+s' to download result ")

             //set link positions for final node/link positions
             d3Links.forEach(link => {

             link.setStartEnd(link.source, link.target)

             });


             //trigger coloring //TODO this should be done earlier
             $(".cloudNodeColorSelect").val("group").trigger("change")

             //set update the cloud to be able to use it for text positioning
             if (env.nodeClouds)
             env.nodeClouds.updateBoundingSpheres();

             //start the node particle effect
             setTimeout(function () {
             if (env.particles)
             //env.particles.updateDestinations()
             env.particles.start()

             }, 1000)

             //set the text labels to the correct positions

             env.updateTextWhenCameraIsMoving()
             env.textNode.fadeIn(200)

             //createCloudCenterSphereForGroupsByID()
             //globalEnv.particles.pointCloud.visible=false;setVisibleGroups(null,false);setVisibleGroups(["United States"],true);createCloudCenterSphereForGroups(["United States"])

             */

        }).restart();

        //
        //  initDotParticles()


    }


}
/* harmony export (immutable) */ __webpack_exports__["MyMain"] = MyMain;





	

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map