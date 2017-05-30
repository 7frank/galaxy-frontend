/**
 * Created by Frank on 30.05.2017.
 */

import NodeCluster from "./NodeCluster"

import ClusterLeafElement from "./ClusterLeafElement"
import ClusterNodeElement from "./ClusterNodeElement"



//it's important that the clusters are dynamic
//so if we want to reorder elements with a set of new generator functions




export default
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
                    if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new NodeCluster()

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

                let nnn=new  ClusterNodeElement(res)
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

                    let leaf=new ClusterLeafElement(v);
                    leaf.setDistributionHandler(_dist)
                    res[k] =leaf

                })
        console.log(res)

                clusters[id] =  res;
            }
        })
        return clusters


    }

}