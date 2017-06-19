/**
 * Created by Frank on 30.05.2017.
 */


THREE.EllipsoidGeometry = function ( width, height, depth, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {

    THREE.SphereGeometry.call( this, width * 0.5, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength );

    var matrix = new THREE.Matrix4().makeScale( 1.0, height/width, depth/width );

    this.applyMatrix( matrix );

    //this.boundingSphere.applyMatrix4( matrix );

};

THREE.EllipsoidGeometry.prototype = Object.create( THREE.Geometry.prototype );


import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
import EdgeUtil from "./EdgeUtil"


/**
 * NOTE: possible future work flow/use case
 *  cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 *  cluster.find("#other").setDistribution(_dist)
 *  cluster.find("United States").applyClustering(...)
 */


export default
class BaseCluster3D extends BaseNode {

    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers,view) {
        super(view);
       // this.setView(view)
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

    static cleanUpClusters(clusters, self) {
        clusters.push(self)

        _.each(clusters, function (cluster) {

            if (cluster.tn) {
                cluster.tn.remove()
                delete (cluster.tn)
            }
            if (cluster.mTextNodes) {
                cluster.mTextNodes.remove()
                delete (cluster.mTextNodes)
            }


            if (cluster == self) return;//don't detach the current root element

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


    cleanUpLeafs() {
        _.each(this.getLeafs(), function (leaf) {

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

    storeParentPositionInNodes() {

        var leafElements = this.getLeafs()
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes
            _.each(mNodes, function (node) {


                var c1 = new THREE.Vector3();
                c1.setFromMatrixPosition(leaf.matrixWorld);

                node._parentPosAbs = c1;

            })
        })


    }

    restoreNodePositionFromExParent() {


        var leafElements = this.getLeafs()
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes
            _.each(mNodes, function (node) {
                //get current parent pos
                let c1 = node._parentPosAbs

                if (!c1) return;
                var c2 = new THREE.Vector3();
                c2.setFromMatrixPosition(leaf.matrixWorld);

                node._bubble.position.add(c1).sub(c2)
                _.extend(node, node._bubble.position)

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
        var options = _.extend({
            minClusterSize: 10,
            defaultMergeGroupName: "other"

        }, entry.options);
        var that = this;

        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        let elements = this.groupBy(entry.generator)
        _.each(elements, function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz(undefined,undefined,that.getView());//new BaseCluster3D()
                _clustersObj[dMGN].name = dMGN
                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else {
                _cluster.name = key
                _clustersObj[key] = _cluster


            }
        })


        _.extend(this.mClusters, _clustersObj)


        this.setDistributionHandler(entry.distribution, function () {

            that.mClusterRule = entry
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
        var that=this;
        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new clazz(undefined,undefined,that.getView());//new BaseCluster3D();

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
    setDistributionHandler(distribution, onComplete = function () {
    }) {
        var that = this
        var values = Object.values(this.mClusters)
        //TODO translation,rotation,scale by using different per-node function

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution, onComplete);
        else
            distribution.setNodes(this,
                function onNodePositionChanged(vecPosition, i) {
                },
                function onStep() {

                    updateLeafsEdges(that)

                }, function () {
                    onComplete()
                });


        //FIXME redundant updating multiple edges and potentially leafs
        function updateLeafsEdges(cluster) {
            let leafs = cluster.getLeafs()

            _.each(leafs, function (leaf) {
                leaf.updateEdges();
            })

        }

    }


    getDefaultHullMaterial()
    {

     return  new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            transparent: true,
            opacity: 0.1,
            visible: false
        });

    }


    getEllipsoidHull(boundingBox) {

        let _center = boundingBox.getCenter();
        let _size= boundingBox.getSize()

        var sphereGeometry=new THREE.EllipsoidGeometry(_size.x,_size.y,_size.z)

        let hull = new THREE.Mesh(sphereGeometry,this.getDefaultHullMaterial())

        return hull

    }

    getBoxHull(boundingBox) {

            let _center = boundingBox.getCenter();
            let _size= boundingBox.getSize()

            var box=new THREE.BoxGeometry(_size.x,_size.y,_size.z)

        var geo = new THREE.EdgesGeometry( box ); // or WireframeGeometry( geometry )

        var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2,opacity:0.1,transparent:true } );

        var wireframe = new THREE.LineSegments( geo, mat );

       return wireframe



    }




    getRingHull(boundingSphere)
    {

        let ringGeometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);


        ringGeometry.boundingSphere=boundingSphere



       let hull = new THREE.Mesh(ringGeometry,this.getDefaultHullMaterial())


        hull.onBeforeRender = function( renderer, scene, camera, geometry, material, group ) {
            //billboard effect
            this.setRotationFromQuaternion(camera.quaternion)
            //     console.warn(camera.quaternion.x,camera.quaternion.y)

        }

        return hull
    }

    /**
     *
     *  current limenentation of the hull is a simle sphere with a border with the radius of the boundingSphere
     *  TODO  could be convex hull in sub class, in which case the method still needs to be overridden
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
        let _size= boundingBox.getSize()
        let radius =_size.length() / 2;


        //TODO
        if (radius < 40) radius = 40

        boundingSphere.radius = radius;

//TODO refactor into separate package the hull should be set by the user creating the specific cluster implementation as option per sub-cluster
   //... like if cluster nodes > x return HullImpl

        //this.mHull=this.getRingHull(boundingSphere)
       // this.mHull=this.getEllipsoidHull(boundingBox)
          this.mHull=this.getBoxHull(boundingBox)
        this.mHull.material.visible=false//set hull default to invisible

        this.add(this.mHull);




        var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
        var sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });

        sphereGeometry.boundingSphere=boundingSphere

       // this.material = sphereMaterial;
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

        let leaf = new ClusterLeafElement(this.mNodes);
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
        return EdgeUtil.getClusterInfo(this.mClusters);

    }


    /**
     * creates edegse from nodes
     * the edges can be inner edges only from nodes within cluster to other nodes within
     * or external edges leading into nodes from other clusters
     */

    createEdgesForChildClusters() {

        return EdgeUtil.createEdgesBetweenClustersFromMap(this.mClusters);

    }

    /**
     *
     *
     * @params defaultRadius if the radius is not yet determined the fefault value is used instead
     * @returns the radius of the cluster
     */
    getRadius(defaultRadius = 100) {

        return this.geometry.boundingSphere ? this.geometry.boundingSphere.radius : defaultRadius;

    }


    /**
     * has to be called after initialisation to re-calculate dependent elements
     * like dot clouds and cluster boder and hull
     */
    onAfterClusteredAndDistributed() {

        _.each(_.reverse(this.findClusters("*")), function (cluster) {
            cluster.adjustHullSize();


        })


        this.adjustHullSize()
    }


    /**
     * returns an array of the actual ClusterLeafElements
     * that render the nodes itself
     *
     * TODO add clear function and remove cached elements
     */

    getLeafs() {
        if (this._LeafsCached) this._LeafsCached


        var leafElements =this._LeafsCached= [];

        this.traverse(function (item) {
            if (item instanceof ClusterLeafElement)
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



    getDOMElement(){


        var view3d= this.getView()
        if (!view3d||  !view3d.domElement)
        {
            console.warn("attach graph to a view before using dom specific functions")
            return null;
        }

        return view3d.domElement

    }


    /**
     *
     *
     *
     *
     */
    getDOMEvents(){


        var view3d= this.getView()
        if (!view3d||  !view3d.mDomEvents)
        {
            console.warn("attach graph to a view before using dom specific functions")
            return null;
        }

        return view3d.mDomEvents

    }



    /**
     * tries to get the view3d element, which the cluster is rendered within
     * @returns a View3D if attached to the view before, else null
     */
    getView()
    {
      //  var rootCluster=this.getRoot()
       // if (!rootCluster.mParentView) return null
     return this.mParentView
    }

    /**
     * sets the view element for the root
     * the view must be a View3D (extends HTMLElement)
     *
     */
    setView(view3d)
    {
       // var rootCluster=this.getRoot()

       this.mParentView=view3d;
     return this
    }

    /**
     *
     *
     *
     * returns the root element of the cluster
     */


    getRoot(maxDepth=20)
    {
        var _root=this;
        while ( maxDepth--)
        {
            let r=_root.parent;
            if (r==null) return _root;
            if (! (r instanceof BaseCluster3D)) return _root;
            _root=r;
        }


    }




}