import * as THREE from "three";
import * as _ from "lodash";
import * as $ from "jquery"

/**
 * A factory to generate the 2.5D text feature.
 * Text nodes get rendered from a finite subset of given nodes depending on parameters like 'minDistance' and 'maxDistance'
 *
 * @param env ... A configuration object.
 *
 *  For the method to work env  needs to contain the following params:
 *
 * @param env.renderer.domElement ... a  <canvas></canvas> element with a valid 3D context
 *                                      (the container where the 3D scene/geometries are rendered to)
 *
 * @param env.currentNodesVisible ... an array containing the currently visible cluster nodes.
 *                                      Updating the array and calling the 'update'-method will invalidate obsolete text-nodes
 *                                      and create new ones.
 *
 * @param textNode ... A HTML-element that functions as container, which is used as overlay holding the text elements
 *                      for the nodes with the attribute 'pointer-events' set to 'none'
 *                      so all events get passed to the 3D scene for further processing.
 *                      By default textNOde should be an instance of {@link ClusterTextOverlay}
 *
 * @param  camera ... The camera that represents the position/viewport of the user observing the {@link RootCluster}
 *
 * @param options .. see below for details
 *
 * @returns {{update: simpleUpdate, remove: remove}}
 *
 */


export default function TextNodesFactory(env, options) {
    var domEl = env.renderer.domElement

    options = _.extend({
        interactable: false, //determines if the text element for the node can be clicked/selected or not
        minVisibleCount: 0, //the minimum amount of items. If the depth test fails at least this amount of the 'env.currentNodesVisible'-array is drawn (if they are in viewport of the camera)
        maxVisibleCount: 10, //the maximum amount of rendered text labels
        maxDistance: 700, //the maximum distance between the node and the observer/camera to be accepted as a valid visible node
        minDistance: 10, //the minimum distance between the node and the observer/camera to be accepted as a valid visible node
        getNodes: function () {
            //the default implementation to retrieve the set of nodes for the text labels
            //override to implement any other
            return env.currentNodesVisible ? env.currentNodesVisible : nodes

        },
        getCSSClasses: function () {
            //the css class which gets applied to the text label
            return 'node-caption'

        },
        getNodePosition: function (node) {
            //should return a THREE.Vector3 represention the source nodes poistion in 3d space

            var vector = new THREE.Vector3();
            vector.setFromMatrixPosition(node._bubble.matrixWorld);
            return vector;

            //return node._bubble.position
        },
        onAfterCreateTextField: function (node, el) {
        }, //gets called after a text label is generated to be able to make adjustments
        onNodeText: function (node) {
            return node.id //returns the text shown by the text label
        }
    }, options)

    //--------------------------------
    //create text node

    var lastNodeID,
        lastNode;

    function createTextNode(node) {

        if (typeof node.text != "undefined")
            return node.text

        var _id = options.onNodeText(node)

        lastNodeID = _id
        lastNode = node;

        node.text = $("<span>").hide().addClass(options.getCSSClasses())
            .addClass("noselect").on("mousewheel", e => e.preventDefault())
            .attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false)
            .html(_id).css({
                position: "absolute"
            });

        if (options.interactable)
            node.text.css({
                "pointer-events": "all"
            });
        else
            node.text.css({
                "pointer-events": "none"
            });

        options.onAfterCreateTextField(node, node.text);

        //TODO make the container variable
        env.textNode.append(node.text);
        return node.text;
    }

    //--------------------------------
    //update text nodes


    /*
    //@deprecated
    function getScreenPos2(p, domEl) {

        var vector = p.clone();

        vector.project(env.camera);

        vector.x = (vector.x + 1) / 2 * domEl.offsetWidth + domEl.offsetLeft;
        vector.y = -(vector.y - 1) / 2 * domEl.offsetHeight + domEl.offsetTop;

        return vector;
    }
    */

    /**
     *
     * @param p ... an instanceof {@link THREE.Vector3} representing the position of the node/element in 3D space.
     * @param camera ... an instanceof {@link THREE.Camera} representing the position and viewport of the user/observer.
     * @param viewOffsetWidthBy2  .. the relative screen offset of the container (view) divided by two
     * @param viewOffsetHeightBy2 .. the relative screen offset of the container (view)divided by two
     */
    function getScreenPos(p, camera, viewOffsetWidthBy2, viewOffsetHeightBy2, viewOffsetX, viewOffsetY) {

        var vector = p.clone();

        vector.project(camera);

        vector.x = (vector.x + 1) * viewOffsetWidthBy2 + viewOffsetX
        vector.y = -(vector.y - 1) * viewOffsetHeightBy2 + viewOffsetY

        return vector;
    }

    //--------------------------------
    //test if the node matches certain criteria to be part of the current visible set of text-nodes
    function testIfRelevantNode(node) {

        var point1 = env.camera.position;
        var point2 = options.getNodePosition(node);
        var distance = point1.distanceTo(point2);
        //var scaling=1
        //var size=500/distance*10*scaling

        //calc angle to discard nodes that are to far at the sides of the screen or possible behind the camera
        let dir1 = new THREE.Vector3().copy(point2).sub(point1)
        let dir2 = env.camera.getWorldDirection()
        var angle = dir1.angleTo(dir2)


        //TODO is size still relevant somehow?
        var size = 12


        let _minDistance = typeof options.minDistance == "function" ? options.minDistance(node) : options.minDistance
        let _maxDistance = typeof options.maxDistance == "function" ? options.maxDistance(node) : options.maxDistance

        //return the result of the comparision
        //angle  90° == pi/4 => 45° fov for text nodes to each side
        if (size < 10 || size > 80 || angle > Math.PI / 4 || distance > _maxDistance || distance < _minDistance)
            return {
                distance, angle,
                addNodeToSet: false,
                node
            };
        else
            return {
                distance, angle,
                addNodeToSet: true,
                node
            };

    }

    //--------------------------------


    var previousVisibleNodes = []

    var maxVisibleTextNodes = options.maxVisibleCount


    /**
     * Compares the next batch of visible nodes to the previously nodes visible (one frame earlier) and updates their position/visibility according to the configuration.
     *
     * @param nodeInfosCurrentBatch ... a set of node infos each containing a reference (node) to the original node element.
     */
    function compareAndHidePreviousBatch(nodeInfosCurrentBatch) {


        if (previousVisibleNodes.length == 0 && nodeInfosCurrentBatch.length == 0) return;


        // vars to safe some ms later on
        var camera = env.camera;

        var dw = domEl.offsetWidth / 2;
        var dh = domEl.offsetHeight / 2;

        var dl = domEl.offsetLeft;
        var dt = domEl.offsetTop;


        //updates the positions of the text labels matching it's 3d node counterparts positions
        function updatePos(node, distance = 0) {

            if (typeof node.text == "undefined")
                return;

            var pos = options.getNodePosition(node);
            //	var coords = getScreenPos(pos, domEl);

            var coords = getScreenPos(pos, camera, dw, dh, dl, dt);

            //TODO this offset stuff might need some parameters in the options section
            var centered = coords.x - node.text.width() / 2;
            var adjustedTop = coords.y - 500 / distance * 10

            /*	node.text.css({
                    top: adjustedTop,
                    left: centered
                })*/

            node.text.get(0).style.transform = 'translate(' + _.round(centered - dw, 2) + 'px, ' + _.round(adjustedTop, 2) + 'px)';


        }

        //contains the new node array that will be the previous nodes to run tests against in the next iteration
        var newPreviousVisibleNodes = []

        for (var preNode of previousVisibleNodes) {

            //hide prevNode, if the current batch does not contain the prevNode

            var mPos = nodeInfosCurrentBatch.findIndex((i) => i.node == preNode)
            if (mPos < 0) //not element of next iteration
            {

                if (typeof preNode.text != "undefined") {

                    preNode.text.stop().hide()
                    preNode.text.remove();
                    delete (preNode.text)

                    //FIXME elements wont disappear the way they are supposed to

                    /*
                    preNode.text._marked_for_deletion_=true


                    preNode.text.stop().fadeOut(100
                , function() { $(this).remove(); delete(preNode.text) ;preNode.text=undefined  }
                    );

                    if (typeof preNode.text!="undefined")
                {
                    updatePos(preNode)
                    newPreviousVisibleNodes.push(preNode) //re-add the previous node that needs to be rendered/handled until it is deleted
                    // preNode.text=null
                    }
                     */

                }

            }

        }

        var nodesCurrentBatch = nodeInfosCurrentBatch.map((v) => v.node);

        previousVisibleNodes = newPreviousVisibleNodes.concat(nodesCurrentBatch)

        for (var nodeInfo of nodeInfosCurrentBatch) {
            if (nodeInfo.node.text && !nodeInfo.node.text._marked_for_deletion_)

            //if (!nodeInfo.node.text.is( ":animated"))
            //nodeInfo.node.text.stop().fadeIn(100);
                nodeInfo.node.text.show()

            updatePos(nodeInfo.node, nodeInfo.distance);
        }


    }

    //--------------------------------
    /**
     *  Update function that determines relevant text labels (based on visibility of the 3D-element associated) and positions them on next to the 3D-elements.
     */

    function simpleUpdate() {

        //let's take the result set of the last renderer loop as a start
        //the data is ordered in approximate descending distance from farthest to closest
        var mNodes = options.getNodes();
        // console.error("textnodes",mNodes.length)
        var maxVisibleTextNodes = options.maxVisibleCount;


        //next let's find the closest x nodes that match the criterias to be displayed
        var nodesCurrentBatch = [];

        for (var i = mNodes.length - 1; i >= 0 && maxVisibleTextNodes > nodesCurrentBatch.length; i--) {

            let node = mNodes[i];

            var res = testIfRelevantNode(node);
            if (res.addNodeToSet)
                nodesCurrentBatch.push(res);

            /*  let _maxDistance=typeof options.maxDistance=="function"?options.maxDistance(node):options.maxDistance


              if (res.distance > _maxDistance * 1.5)
                  break; //shorten the search for large graphs
            */

        }


        //TODO keep track of potential nodes that where discarded due to distance but should be readded due to minVisibleCount

        //------------------------------------------
        //now that we should have an array containing only relevant nodes, let's create and (compare+ update) nodes
        //ok node is relevant, so first of all check if node text element needs to be created

        nodesCurrentBatch = _.uniq(nodesCurrentBatch)

        if (nodesCurrentBatch.length > 0)
            for (var nodeInfo of nodesCurrentBatch)
                if (typeof nodeInfo.node.text == "undefined")
                    createTextNode(nodeInfo.node); //.stop().fadeIn(150)


        //second compare and hide/show nodes
        compareAndHidePreviousBatch(nodesCurrentBatch);


    }

    return {
        update: simpleUpdate,
        remove: function () {
            compareAndHidePreviousBatch([])
        }
    }
}
