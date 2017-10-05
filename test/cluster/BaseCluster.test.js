



import BaseCluster3D from "../../js/cluster/BaseCluster3D";
import * as jquery from "jquery";

describe("A BaseNode is a simple node", function() {
    var node
    var view= document.createElement("graph-view-3d")
    jquery("body").append(view)

    it("can be created", function() {
        node = new BaseCluster3D([],[],view);

        expect(node).toBeDefined();
    });


    it("can contain 'plain'-nodes", function() {
        //dummy nodes don't  do anything
        node.addNodes([{id:1},{id:2}])

        expect(node.mNodes).toBeDefined();

        expect(node.mNodes.length).toBe(2);

    });

});


