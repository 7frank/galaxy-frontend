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


        let preparedData = graphData.createClusterNodesAndEdges(this)

        var res = new RootCluster(preparedData.nodes);



        parentEl3D.add(res);
        res.position.set(0, 0, 0);
        res.applyClustering(speccs)
        //IMPORTANT: must attach after clustering is applied becaouse "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this)

        $(this).on("before-render",function(){
            //TODO who is responsible for the updating itself to cluster or the view?
            res.update()
        })


        this.start()

        return res


    }


    setData(mGraphData)
    {
        this.initStatic();

        if (!this.mRootCluster)
        this.mRootCluster= this.initClusterForView(mGraphData,this.mScene)




    }

    maximise() {

        super.maximise()

        let root = this.mRootCluster
        if (root.mParentView && root.mGlobalTextNodesContainer) {

            root.mGlobalTextNodesContainer.height(root.mParentView.clientHeight)
            root.mGlobalTextNodesContainer.width(root.mParentView.clientWidth)
            console.log("maximised", root.mGlobalTextNodesContainer)
        }
    }

    undoMaximise(){
            super.undoMaximise()


            let root=this.mRootCluster
            if (root.mParentView && root.mGlobalTextNodesContainer) {

                root.mGlobalTextNodesContainer.height(root.mParentView.clientHeight)
                root.mGlobalTextNodesContainer.width(root.mParentView.clientWidth)
            }


    }


}

customElements.define("graph-view-3d", GraphView3D);
