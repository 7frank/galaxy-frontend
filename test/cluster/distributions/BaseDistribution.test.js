


import BaseDistribution from "../../../js/cluster/distributions/BaseDistribution";


describe("A BaseDistribution distributes nodes in a equal distance pattern", function() {

    beforeEach(function(){
        jasmine.addCustomEqualityTester(function floatEquality(a, b) {

            if (a === +a && b === +b && (a !== (a|0) || b !== (b|0))) { // if float
                return(a / b)%1 < 10e-2;
            }
        });
    });


    var distribution

    var nodes=[{x:0,y:0,z:0},{x:0,y:0,z:0},{x:0,y:0,z:0}]
    var scale=100

    it("can be created to distribute nodes in 1d space", function() {
        distribution = new BaseDistribution(scale,1)

        expect(distribution).toBeDefined();
    });


    it("it distributes some sample nodes", function(done) {

        distribution.setNodes(nodes, function onNodePositionChange(){},function onStepComplete(){},function onEnd(){

            console.info(nodes)

            expect(nodes[0]).toEqual(jasmine.objectContaining({x: -50, y: 0, z: 0}));
            expect(nodes[1]).toEqual(jasmine.objectContaining({x: 0, y: 0, z: 0}));
            expect(nodes[2]).toEqual(jasmine.objectContaining({x: 50, y: 0, z: 0}));

            done()
        })

    });

});


