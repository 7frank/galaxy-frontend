/**
 * Created by Frank on 16.07.2017.
 */

/**
 NOTE: set initialEngineTicks to a appropriate value to speed up bigger graphs


 FIXME put arrows nodemixin and linkmixin into separate classes, curent implementations work but are in no way useable for other developers


 TODO scale arrow depending on  group link size
 TODO expanding nodes will result in still showing group tooltips
 probably remove group nodes from raycaster or something like that

 TODO ?when using hull feature? sometimes nodes cannot be clicked .. probably due to hull back or front preventing events from triggering on nodes
 TODO search filter for hidden nodes.. expand before zoom

 */

//import "f2-zoom.js"



//current selected node
var previousNodeClicked = [];
var previousNodeDblClicked;

//------------------------------------------------
//Feature 1

var previousNodes;

function highlightNodeElements(bShowOtherNodes = false, bShowEdgeArrows = true) {


    //TODO
    /*if (previousNodes&& previousNodes!=this)
     {
     unhighlightNodeElements.apply(previousNodes)
     previousNodes=this

     }*/

    //console.log("highlighting nodes:" + (this.children.length + this.parents.length))

    this.showHighlight();


    if (bShowOtherNodes) {
        for (childNode of this.children)
            childNode.showHighlight()

        for (parentNode of this.parents)
            parentNode.showHighlight()
    }

    //console.log("highlighting edges:" + (this.edges.length))


    for (edge of this.edges)
        edge.showHighlight()

    if (bShowEdgeArrows)
        for (edge of this.edges) {
            var color = edge.source == this ? 0x99ff99 : 0xffb2b2;


            addArrow(edge, color)
        }
}

function unhighlightNodeElements() {
    //console.log("unhighlighting nodes:" + (this.children.length + this.parents.length))

    this.hideHighlight();

    for (childNode of this.children)
        childNode.hideHighlight()

    for (parentNode of this.parents)
        parentNode.hideHighlight()

    //console.log("unhighlighting edges:" + (this.edges.length))

    for (edge of this.edges)
        edge.hideHighlight()

    for (edge of this.edges)
        removeArrow(edge)

}

function highlightEdgeElements() {

    this.showHighlight();
    this.source.showHighlight();
    this.target.showHighlight();


    var color = 0x666666;
    addArrow(this, color)


}

function unhighlightEdgeElements() {

    this.hideHighlight();
    this.source.hideHighlight();
    this.target.hideHighlight();

    removeArrow(this)

}

function extendElement(elements, attrName, options, env) {

    var mDomEvents = env.domEvents;

    function _TODO(typeName) {
        return function () {
            console.warn("implement handler for", typeName);
            console.log(this, arguments)
        }
    }

    var defaults = {
        mousemove: _TODO("mousemove"),
        mouseleave: _TODO("mouseleave"),
        click: _TODO("click"),
        dblclick: _TODO("dblclick")
    };
    options = $.extend(true, {}, defaults, options);


    for (el of elements) {


        if (el._line && env.useLineGroup) {
            el.showHighlight = function () {
            };
            el.hideHighlight = function () {
            };

            continue

        }
        var mesh = el[attrName];


        mDomEvents.addEventListener(mesh, 'click', options.click, false);
        mDomEvents.addEventListener(mesh, 'dblclick', options.dblclick, false);

        mDomEvents.addEventListener(mesh, 'mouseover', function (e) {
            options.mousemove.apply(e.target.node || e.target.edge)
        }, false);
        mDomEvents.addEventListener(mesh, 'mouseout', function (e) {
            options.mouseleave.apply(e.target.node || e.target.edge)
        }, false);


        el.showHighlight = function () {

            if (this.isHighlighted) return;
            this.isHighlighted = true;

            if (attrName == "_bubble" && this["_bubble"] == null) console.error("FIXME ");

            if (this._bubble) {
                this.addClass("node-highlighted")

            }

            if (this._line) {
                var mesh = this[attrName];
                mesh.material.visible = false

            }

            if (this.text) {
                this.text.addClass("node-caption-highlighted")
            }


        };


        el.hideHighlight = function () {


            if (!this.isHighlighted) return;
            this.isHighlighted = false;

            if (this._bubble) {
                this.removeClass("node-highlighted")

            }

            if (this._line) {
                var mesh = this[attrName];
                mesh.material.visible = true

            }

            if (this.text) {
                this.text.removeClass("node-caption-highlighted")
            }


        }

    }

}


//helper to being able to handle click events
//isSelected == false will prevent the actual node selection and only will trigger the zoom+highlight parts
function doOnClickNode(currNodeClicked, stack = false, onAnimationEnd, isSelected = true, doHighlighNeighbours = true, doHighlighEdges = true, doZoomIn = true) {

    if (previousNodeClicked.indexOf(currNodeClicked) < 0)
    //if (previousNodeClicked!=currNodeClicked)
    {
        //node selected
        highlightNodeElements.apply(currNodeClicked, [doHighlighNeighbours, doHighlighEdges]);


        if (doZoomIn)
            doZoomToMesh(currNodeClicked._bubble, onAnimationEnd);


        if (isSelected) {
            //GUI.updateNodeInfo(currNodeClicked)

            currNodeClicked.addClass("basic-selection");


            //if (previousNodeClicked)
            if (!stack)
                if (previousNodeClicked.length > 0)
                    for (p of previousNodeClicked) {
                        p.removeClass("basic-selection");
                        unhighlightNodeElements.apply(p)
                    }

            if (!stack)
                previousNodeClicked = [currNodeClicked];
            else
                previousNodeClicked.push(currNodeClicked)

        }


    }
    else {
        //GUI.updateNodeInfo(currNodeClicked,false)
        //node unselected
        unhighlightNodeElements.apply(currNodeClicked);

        //previousNodeClicked=[]
        previousNodeClicked.splice(currNodeClicked);

        currNodeClicked.removeClass("basic-selection")

    }

}

/*

 as long as node is current selection => mouse enter return mouse leave return

 if clicked and not current selection trigger mouse leave on last

 */
//inject additional functionality
function extendGraphElements(d3Nodes, d3Links, env) {

    addGraphHierarchy(d3Nodes, d3Links);


    extendElement(d3Nodes, "_bubble", {
        mousemove: function (e) {

            if (previousNodeClicked.indexOf(this) >= 0)return;
            //if (previousNodeClicked==this) return

            highlightNodeElements.apply(this, [true, true])

            //	GUI.updateNodeInfo(this,false)

        },
        mouseleave: function () {

            //if (previousNodeClicked==this) return
            if (previousNodeClicked.indexOf(this) >= 0)return;


            //if (previousNodeClicked!=this)
            unhighlightNodeElements.apply(this)


        },
        click: function (e) {
            var currNodeClicked = e.target.node;
            e.stopPropagation();

            //if (previousNodeClicked &&previousNodeClicked!=currNodeClicked) 	unhighlightNodeElements.apply(previousNodeClicked)
            if (previousNodeClicked.length > 0 && previousNodeClicked.indexOf(currNodeClicked) < 0)
                for (p of previousNodeClicked)
                    unhighlightNodeElements.apply(p)

            doOnClickNode(currNodeClicked, e.origDomEvent.ctrlKey);

            return false;
        },
        dblclick: function (e) {
            e.stopPropagation();
            //setCollapsedSateOfChildNodesAndEdgesOfNode(e.target.node)
            var currNodeDblClicked = e.target.node;

            GUI.updateNodeInfo(currNodeDblClicked, currNodeDblClicked != previousNodeDblClicked);

            if (previousNodeDblClicked == currNodeDblClicked)
                previousNodeDblClicked = null;
            else
                previousNodeDblClicked = currNodeDblClicked;
            //unhighlightNodeElements.apply(e.target.node)
            return false;
        }
    }, env);


    //FIXME extending attrName sometimes false

    extendElement(d3Links, "_line", {
        click: function (e) {

        },
        mousemove: highlightEdgeElements,
        mouseleave: unhighlightEdgeElements

    }, env)

}

/**
 * build a helper structure for parent child relation
 * TODO how to handle/exclude recursive structures
 */

function addGraphHierarchy(d3Nodes, d3Links) {
    /*
     node:
     group:1
     id:"2"
     shape:"sphere" | "cube"
     _bubble: instanceof THREE.Mesh //SphereGeometry
     _id:"2"


     link:
     source:"1"
     target:"3"
     _line:	 instanceof THREE.Mesh //LineGeometry
     */

    //prepare nodes
    for (let node of d3Nodes) {

        if (!node.edges)
            node.edges = [];
        if (!node.children)
            node.children = [];
        if (!node.parents)
            node.parents = [];

        node._bubble.node = node

    }

    for (let item of d3Links) {

        item._line.edge = item;

        //add edge list to nodes
        if (item.source.edges.indexOf(item) < 0)
            item.source.edges.push(item);
        if (item.target.edges.indexOf(item) < 0)
            item.target.edges.push(item);

        //add target of current link to children list of source
        if (item.source.children.indexOf(item.target) < 0)
            item.source.children.push(item.target);

        //add source of current link to parent list of target
        if (item.target.parents.indexOf(item.source) < 0)
            item.target.parents.push(item.source);
    }

}
