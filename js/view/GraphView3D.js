/**
 * Created by Frank on 13.06.2017.
 */



import View3D from "./View3D"


import RootCluster from "../cluster/RootCluster"
import GraphData from "../cluster/GraphData"


export default
class GraphView3D extends View3D
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

        let graphData = new GraphData(rawGraphData)


        let preparedData = graphData.createClusterNodesAndEdges()

        var res = new RootCluster(preparedData.nodes);

        parentEl3D.add(res);
        res.position.set(0, 0, 0);


        this.start()

        return res


    }


    setData(mGraphData)
    {
        this.initStatic();

        if (!this.mRootCluster)
        this.mRootCluster= this.initClusterForView(mGraphData,this.mScene)




    }



}


document.registerElement("graph-view-3d", GraphView3D);