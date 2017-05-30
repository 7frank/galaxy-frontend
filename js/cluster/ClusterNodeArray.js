
/**
 * a set of node objects
 * the cluster itself also contains parts of the visual representation of the nodes
 * TODO in which case the clster might rather inherit from THREE.Points (point cloud) ?
 */





export default class ClusterNodeArray extends Array //List<Node>
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

