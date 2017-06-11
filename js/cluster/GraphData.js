/**
 * Created by Frank on 11.06.2017.
 */



export default
class GraphData
{

    //constructor(nodes,edges){
    constructor(graphData){
            this.mGraphData=graphData
      /*  this.mNodeData=[];
        this.mEdgeData=[];

        this.addNodes(nodes);
        this.addEdges(nodes);*/

    }

    getRawNodes()
    {

        // Build graph with data
        var d3Nodes  = [];
        for (let nodeId in this.mGraphData.nodes) { // Turn nodes into array
            const node = _.extend({},this.mGraphData.nodes[nodeId]);
            node._id = nodeId;
            d3Nodes.push(node);
        }
       return d3Nodes

    }

    getRawLinks(){

        var d3Links  = this.mGraphData.links.map(link => {
            return {
                source: link[0],
                target: link[1]
            };
        });

        //FIXME this sets src and dst to the graph data nodes but it should instead link to the cloned nodes so no interference occures
       var  d3Links  = this.mGraphData.links.map(link => {
            return {
                source: this.mGraphData.nodes[link[0]],
                target: this.mGraphData.nodes[link[1]]
            };
        })

    return d3Links



    }


  /*  addRawNodeData(nodes){
      if (_.isArray(nodes)) this.mNodeData=this.mNodeData.concat(nodes)

        return this;

    }

    addRawEdgeData(edges)
    {
        if (_.isArray(edges)) this.mEdgeData=this.mEdgeData.concat(edges)

        return this;
    }*/

    create(env=globalEnv)
    {


   var d3Nodes= this.getRawNodes();

    if (!d3Nodes.length) {
        return;
    } //if no data is present return for now


    var d3Links =this.getRawLinks();


//TODO
  /*  function countVisibleNodes(node) {

        env._nodeCounter.push(node)

    }*/

    // Add WebGL objects
    d3Nodes.forEach(node => {

        node = nodeMixin(env, node, {
         //   onDrawNode: countVisibleNodes
        })
        node._bubble.name = env.nameAccessor(node) || '';


        //TODO not highlighted group nodes should be rendered with separate point cloud
        if (node.isGroupNode) {

            //node.addClass("basic-sprite-collapsed")
            node.addClass("basic-ring")

            //node.on("mouseover",()=> node.addClass("basic-animated"))
            //node.on("mouseout",()=> node.removeClass("basic-animated"))
            node.on("mouseover", () => node.addClass("basic-ring-2"))
            node.on("mouseout", () => node.removeClass("basic-ring-2"))

        } else {

            //TODO specific renderings for node should be handled via class property at node data itself
            //NOTE: the default node/group nodes/links will be put inside a point  cloud for each so we woud need a point cloud for each 3d-class that generates a points object

            //node.addClass("basic-sphere")

            // nothing to begin with
            //node.addClass("basic-sprite")

        }

    });

    //-----------------------------------------------

    //init mesh for groupline
  /*  if (env.useLineGroup)
        initLineGroup(env,{
            opacity:0.01,
            color:0x49616C,
            transparent: true,
        })

    var linecount = 0;
    var skipLines = env.numSkipEdgesRendered + 1;
    if (skipLines < 1)
        skipLines = 1
    function shouldLineByVisible(link, id) {

        return !(linecount++ % skipLines)
    }
*/
    //d3Links.forEach(link => {
    _.each(d3Links, (link, id) => {

         //TODO have a function within the custer itself that is called
        //determine by distance or something like that
        var bVisible = true;// shouldLineByVisible()

        linkMixin(env, link, {
            lineIsVisible: bVisible,
            color: 0xff0000,
            opacity: 1
        })


    });





    //----------------------


    //nodes are prepared by previous step ? TODO which one was that? for further altering
    extendGraphElements(d3Nodes, d3Links, env)


        return {nodes:d3Nodes,edges:d3Links}

}

    //--------------------------------------------



}