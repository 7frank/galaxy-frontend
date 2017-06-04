/**
 * Created by Frank on 02.06.2017.
 */

import BaseCluster3D from "./BaseCluster3D"

export default
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
        if (node instanceof BaseCluster3D) {
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