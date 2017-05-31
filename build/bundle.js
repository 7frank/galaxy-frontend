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
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
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
    constructor(){
        this.dimensions=1 //TODO
    }


    setNodes(nodes,onNodePosition)
    {
        let len= nodes.length

        let _len;
        if (this.dimensions==1)
            _len=len;
        if (this.dimensions==1)
            _len= len/Math.sqrt(len);
        if (this.dimensions==1)
            _len= len/Math.pow(len,1/3);


        let step=1/_len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)
        var i=0;
        var c=0;
        for (n of nodes)
        {
            let _vec3=  this.distribute(n, i,0,0);

            //TODO set value in particle cloud
            onNodePosition(_vec3,c)

            i+=step
            c++;
        }


    }

    distribute(node,dx,dy,dz){
        //TODO this should be called to distribute the elements of the country layer when finished
        //TODO also it will be usefull to add rotation as well in th future

        return new THREE.Vector3(dx,dy,0)
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseDistribution;




/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterNodeArray__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ClusterLeafElement__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ClusterNodeElement__ = __webpack_require__(6);
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
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 30.05.2017.
 */



class ClusterLeafElement extends THREE.Object3D
{
    constructor(nodes){
        super();

        this.mNodes=nodes;
        this.mParticles=this.createParticleCloud();

        this.add( this.mParticles.pointCloud)


    }


    //TODO refactor
    setDistributionHandler(distribution)
    {

        var that=this;
        distribution.setNodes(this.mNodes,function(vec,i){
            var n= that.mNodes[i];

            n.x=vec.x;
            n.y=vec.y;
            n.z=vec.z;

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



}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterLeafElement;




/***/ }),
/* 3 */
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
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterFactory__ = __webpack_require__(1);
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
class BaseCluster3D extends THREE.Object3D {

    //TODO implement these stubs in sub class
    //createEdgeContainer(){}
    //createParticlesIfLeafNode(){}
    //createOrUpdateBoundingVolume(){} //can be convex hull in sub class

    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers) {
        super();
        this.addNodes(nodes);
        //by default the cluster is no leaf. TODO
        this.isLeaf=false;
        this.mClusters={}


        //xCluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length>0) {
            this.applyClustering(clusteringHandlers);

        }




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


    /**
     * this method can be re-run to change the sub-clusters
     -which will result in deleting old clusters
     -adding new ones to the container

     */

    applyClustering(clusteringHandlers) {

        //e. g. result should be .. {china:instanceof BaseCluster3D}



        this._clusterThis(clusteringHandlers[0])
        console.log("_clusterThis",Object.keys(this.mClusters),this.mClusters)
        this.doSubdivideIntoClustersNEW(this.mClusters, clusteringHandlers)

        this.addAllSubClustersToContainer();

    }

    _clusterThis(entry)
    {

        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options)


        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        _.each(this.groupBy(entry.generator), function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new BaseCluster3D()

                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else
                _clustersObj[key] = _cluster

        })


        _.extend(this.mClusters,_clustersObj)


    }


    doSubdivideIntoClustersNEW(mBaseCluster3DContainerObject, mSpeccsArray) {

        if (!mBaseCluster3DContainerObject) throw new Error("!!!")//mBaseCluster3DContainerObject = {root: this}

        var speccsArray=[].concat(mSpeccsArray)

        var entry = speccsArray.shift()

        var _nextGeneratorFunction = entry.generator
        var _nextDistributionHandler = entry.distribution

        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options)


        //....
        var clusters ={}

        _.each(mBaseCluster3DContainerObject, function (mBaseCluster, id) {

          //  console.log("sub-cluster",id,mBaseCluster)

            var _clustersObj = {};


            //post-process
            //merge clusters that don't match the criteria again
            _.each(mBaseCluster.groupBy(_nextGeneratorFunction), function (_cluster, key) {

                if (_cluster.getNodes().length < options.minClusterSize) {

                    var dMGN = options.defaultMergeGroupName
                    if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new BaseCluster3D()

                    _clustersObj[dMGN].addNodes(_cluster.getNodes())
                }
                else
                    _clustersObj[key] = _cluster

            })


            /*

             TODO position each node by using the distribution function
             TODO also when clustering in a different manner... how to handle already applied distribution? we want the nodes to move to the new cluster instead of simply pop up there
             if (_nextDistributionHandler)
             _nextDistributionHandler => foreach _clustersObj

             */

            //TODO we want a tree structure for the nodes to be rendered but we might already have such a structure from another
            // iteration so the nodes do have to be put into other groups dynamically
debugger
            if (speccsArray.length > 0) {


                // let res= ClusterFactory.doSubdivideIntoClusters(_clustersObj, speccsArray);

                _.each(_clustersObj,function(cl,key){

                    let res = new BaseCluster3D(cl.getNodes(), speccsArray)
                    res.setDistributionHandler(_nextDistributionHandler)

                    cl.mClusters[key]=res;

                    clusters[id] =  cl;// res

                })




            } else {

                //no more subdivisions for this branch

                //FIXME but we want to maintain the category each element is in. so we need an object instead of an array
                //TODO refactor


                /*  var res= _.map(_clustersObj,function(v,k){

                 let leaf=new ClusterLeafElement(v);
                 leaf.setDistributionHandler(_nextDistributionHandler)
                 return  leaf

                 })*/

               // var res = {}
                _.each(_clustersObj, function (v, k) {

                    v.isLeaf=true
                    console.log(k,"isLeaf",v.isLeaf)
                  //  let leaf = new ClusterLeafElement(v);
                  //  leaf.setDistributionHandler(_nextDistributionHandler)
                  //  res[k] = leaf

                    clusters[id]=v
                })


            }
        })


debugger
        _.extend(  this.mClusters,clusters)

        //return clusters

    }

    groupBy(filterFunction) {
        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new BaseCluster3D();

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
        distribution.setNodes(values, function (vecPosition, i) {
            let n = values[i];

            n.position.copy(vecPosition)


            // that.mParticles.updateNodePosition(i)

        });


    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseCluster3D;


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(0);
/**
 * Created by Frank on 30.05.2017.
 */




/**
 * a simple random distribution function
 *
 */

class RandomDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]
{
    constructor(radius=25)
    {
        super();
        this.maxDiameter=radius*2;
    }
    distribute(node,dx,dy){
        let min=this.maxDiameter/-2,max=this.maxDiameter/2
        return new THREE.Vector3(_.random(min,max),_.random(min,max),_.random(min,max))
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = RandomDistribution;



/***/ }),
/* 6 */
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
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["getNodesFromCluster"] = getNodesFromCluster;
/* harmony export (immutable) */ __webpack_exports__["getEdgesForNodes"] = getEdgesForNodes;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ClusterNodeArray__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ClusterFactory__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__ClusterLeafElement__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__BaseCluster3D__ = __webpack_require__(4);
/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */











//TODO
//the basic node
class Node extends THREE.Vector3 {

}

//----------------------------------------------------
//----------------------------------------------------
//----------------------------------------------------

/**
 * copy of current implementation
 * TODO rewrite to be able t use sub-clusters
 *
 *
 * @param allNodes object containing all keys and values of current clusters
 * @param options
 * @returns {{container: {}, groupIdList, update: update, updateCrossFade: updateCrossFade, attachTo: attachTo, detach: detach, updateBoundingSpheres: updateBoundingSpheres}}
 */

/*
 function createParticleSystemsForClusters(allNodes, options) {

 options = _.extend({
 // minGroupSize: 40
 }, options)

 var groupContainer = {}
 var groupIDs =Object.keys( allNodes)


 for (var id of groupIDs) {
 var nodes = allNodes[id]

 var elem = ParticleNodeGroup(nodes, {
 nodeDefaultSize: 10,
 nodeDefaultScale: 10,
 nodeTexture: "img/dot7.png"
 })

 groupContainer["" + id] = {
 nodes: nodes,
 particles: elem,
 id: id
 }

 }

 function update() {

 _.each(groupContainer, function (el) {
 el.particles.update()
 })

 }

 function updateCrossFade() {

 _.each(groupContainer, function (el) {
 el.particles.updateCrossFade()
 })

 }

 function attachTo(object3d) {

 for (id of groupIDs) {

 object3d.add(groupContainer[id].particles.pointCloud)

 }

 }

 function detach() {

 for (id of groupIDs) {
 var pc = groupContainer[id].particles.pointCloud
 if (pc.parent)
 pc.parent.remove(pc)

 }

 }

 function updateBoundingSpheres() {

 for (id of groupIDs) {
 //var pc = groupContainer[id].particles.pointCloud.geometry.computeBoundingSphere()
 var pc = groupContainer[id].particles.pointCloud;

 var centerPos=getCenterOfMass(pc)

 pc.geometry.computeBoundingSphere()
 pc.geometry.boundingSphere.center.copy(centerPos)


 }

 }

 return {
 container: groupContainer,
 groupIdList: groupIDs,
 update,
 updateCrossFade,
 attachTo,
 detach,
 updateBoundingSpheres
 }

 }

 */
//----------------------------------------------------
//----------------------------------------------------
//----------------------------------------------------


//---------------------------
//TODO stub
class ForceGraphDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */] {
    setEdges(edges) {
        this.mEdges = edges
    }

}
//---------------------------
//TODO stub
class SphericalDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */] {
}


//---------------------------
class GlobalNodesContainer {
    constructor(nodes) {
        this.mNodes = new __WEBPACK_IMPORTED_MODULE_2__ClusterNodeArray__["a" /* default */](...nodes)

        //TODO mClusters should work that way
        this.root = new THREE.Object3D()

    }


    applyClustering(arr) {
        let res = __WEBPACK_IMPORTED_MODULE_3__ClusterFactory__["a" /* default */].doSubdivideIntoClusters({root: this.mNodes}, arr)
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
    createSample(nodes) {


        //TODO re-merge function to be able to undo grouping for sizes < 40 like in the default implementation

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //others migh be .. RandomDistribution
        let companyDistributionFunction = new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]()
        let categoryDistributionFunction = new __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__["a" /* default */]()

        //if a distribution parameter is set, the generated cluster will use it to position the nodes depending on it
        // TODO is it of any use to be able to apply multiple distributions per cluster? like spherical,force-graph?
        //or is it better to create the force graph "by hand"
        this.applyClustering([
            {generator: countrySetGenerator, distribution: companyDistributionFunction, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: categoryDistributionFunction, options: {minClusterSize: 5}}

        ])


    }


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
function getEdgesForNodes(nodes, bInternal = true, bExternal = false) {

    if (nodes instanceof __WEBPACK_IMPORTED_MODULE_4__ClusterLeafElement__["a" /* default */]) nodes = nodes.mNodes

    if (!bInternal && !bExternal) return []
    //get relevant edges from
    //a.clusters.mClusters.mClusters["United States"][0].mNodes

    var edges = [];

    _.each(nodes, function (node, id) {

        //check if it is a container element
        if (node instanceof __WEBPACK_IMPORTED_MODULE_4__ClusterLeafElement__["a" /* default */]) {
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
        var a = new MyGlobalNodesContainer(globalNodes);
        globalEnv.scene.add(a.mClusters);
        a.mClusters.position.set(0, 1000, 0);

        this.clusters = a.mClusters.mClusters




    }

    getClusterSpeccsArray()
    {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }


        let companyDistributionFunction = new __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]()
        let categoryDistributionFunction = new __WEBPACK_IMPORTED_MODULE_1__RandomDistribution__["a" /* default */]()


      return [
            {generator: countrySetGenerator, distribution: companyDistributionFunction, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: categoryDistributionFunction, options: {minClusterSize: 5}}
        ]

    }

    betterSample()
    {
        let speccs=this.getClusterSpeccsArray();
        var res= new __WEBPACK_IMPORTED_MODULE_5__BaseCluster3D__["a" /* default */](globalNodes,speccs);

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

        if (obj instanceof __WEBPACK_IMPORTED_MODULE_4__ClusterLeafElement__["a" /* default */]) {
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