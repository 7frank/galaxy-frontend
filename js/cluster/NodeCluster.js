
/**
 * a set of node objects
 * the cluster itself also contains parts of the visual representation of the nodes
 * TODO in which case the clster might rather inherit from THREE.Points (point cloud) ?
 */





export default class NodeCluster extends Array //List<Node>
{

    //FIXME
    /*push(el)
     {

     if (! el instanceof Node  ) throw new Error("NodeCluster must only contain instanceof",Node)
     return super.apply(this,arguments)
     }*/


    groupBy( filterFunction){
        let container={}

        function groupFunction(key,val)
        {
            if (typeof container[key]=="undefined")   container[key]=new NodeCluster();

            container[key].push(val)
        }

        for (el of this)
            filterFunction(groupFunction,el)


        return container

    }

}

