/**
 * Created by Frank on 06.06.2017.
 */


//TODO refactor RootCluster
import Cluster3DExtended from "./Cluster3DExtended"

/**
 *
 *  a RootCluster is a root node that contains additional rendering infos over multiple nodes
 * for example: it handles node captions (text nodes)
 */

export default
class RootCluster extends Cluster3DExtended {

    constructor(...args)
    {
        super(...args)

        this.addGlobalNodeCaptions()


        //TODO have an actual event triggered for when sub-clusters are distributed to adjust elements
        setTimeout(()=> this.onAfterClusteredAndDistributed(),1000)


    }


    /**
     * @override
     * prevent multiple recursive  root clusters from being created by default
     */

    getChildClusterConstructor()
    {
        return Cluster3DExtended;

    }


    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */


    addGlobalNodeCaptions(){

        //TODO remove global dependency
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

        if (this.tn)
        this.tn.update();

    }




    applyClustering(mClusteringSpeccsArray) {

        this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray)

        this.restoreNodePositionFromExParent()
    }



}