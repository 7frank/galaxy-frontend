import _ from "lodash";
/**
 *
 * FIXME ok for the 2d parent child graph it would be best to create the edges by scratch
 * also this involves a second instance of a graph view
 * (1) top 10% companies(A) based on customer size
 * foreach sort customers by own customer size
 * =>take another 20% of them and link to parent (A)
 * =>
 * => exclude parents from next interation of possible customers
 */


/**
 *the goal of the following visualisation is to have a tree like structure from the data
 *
 * first order will be top 10% companies by customers
 *
 * TODO we'll have to rewrite the grouping code for that
 *
 **/

/**
 currently =>
 foreach nodes => put into one category


 now =>
 foreach nodes if nodes hasProperty =>

 node.name==category && remove from


 */


class TreeDataGenerator {

    //we do need the nodes at least from which well generate the new edges
    setNodes(nodes) {

        this.mNodes = sort(nodes, function (a, b) {

            if (a.children.length > b.children.length) return -1

            if (a.children.length == b.children.length) return 0


            if (a.children.length < b.children.length) return 1


        })


    }


    getEdges() {

        getXX(this.mNodes, 20)


    }


    getXX(nodes, pctOfNodes = 20) {

        let len = nodes.length


        let count = Math.ceil(len * pctOfNodes / 100)

        //this will be the root nodes
        //also the cluster will have the same name like the node
        let chunk = _.drop(nodes, count)


        let chunk2 = _.drop(nodes, count)


        //check for companies that have no children and one of each as parent

        _.each(chunk, function (node) {

            _.each(chunk2, function (node2) {

                if (node.linkedChildren.indexOf(node2))
                    console.error("impl")
                //     createEdge(node,node2)
                // remove node2 from chunk2


            })
        })


    }


}

