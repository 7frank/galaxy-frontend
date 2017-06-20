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

        var res = new RootCluster(preparedData.nodes,undefined,this);


//-- count visible nodes
   //TODO check if this interferes with the nodeMixin and the default implementation
      var visibleNodes=[];
        _.each(preparedData.nodes,function(node){
            node.get3DRoot().onBeforeRender=function(){
                visibleNodes.push(node);
            }
        })
//--

        parentEl3D.add(res);
        res.position.set(0, 0, 0);
        res.applyClustering(speccs)
        //IMPORTANT: must attach after clustering is applied becaouse "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this)

        var that=this
        var _____skipFrames=0

        $(that).on("before-render",function(){





           // res.update()


            if (that.isMaximised()) {

                   _____skipFrames++
                //     _.each(preparedData.nodes,(n) => n._bubble.material.visible = (_____skipFrames % 20) ? false : true)
             let prev_vis=preparedData.nodes[0]._bubble.material.visible
                let _vis= (_____skipFrames % 20) ? false : true
                preparedData.nodes[0]._bubble.material.visible = _vis

                if (prev_vis)
                {
                GUI.updateFromVisibleNodes(visibleNodes)
                $(that).trigger("visible-nodes-changed") //TODO inverse control via listening
                }
            }
            visibleNodes=[] //reset count

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
