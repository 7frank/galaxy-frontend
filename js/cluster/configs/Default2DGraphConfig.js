import Default3DGraphConfig from "./Default3DGraphConfig";
import ForceGraphDistribution from "../distributions/ForceGraphDistribution";
import BaseVolume from "../hull/BaseVolume";
import ClusterMeshEdges from "../edges/ClusterMeshEdges";
import FlatVolume from "../hull/FlatVolume";


import * as THREE from "three";
import * as $ from "jquery"


export default class Default2DGraphConfig extends Default3DGraphConfig {


    constructor(target, backgroundColor = 0xFFFFFF) {

        super(target, backgroundColor)


    }


    setControls() {

        //TODO instead of setting true and false we should create new controls by cloning the current with default options
        let view = this.getView();


        view.mControls.target.set(new THREE.Vector3(0, 0, 0));
        view.mControls.noRotate = true;
        view.mControls.reset();


    }


    //TODO refactor to support multiple classes instead of add remove darker
    setDomElements() {
        $(".my-accordion,.searchbar-container input, mode-select span,company-info,.graph-node-info,#sig_menu").addClass(this.mCssClass)
        //  $("cluster-text-overlay").removeClass(    this.mCssClass)

    }


    /**
     * this is a plane 2d configuration for the graph
     */

    getSpeccs() {


        //the function that is called to create the  country groups
        function countrySetGenerator(groupFunction, node) {
            // the group function takes 2 arguments
            // the first is the value that will determine the key of the group
            //in this case node.group contains country names
            //the second argument is the node itself that is passed into the group created
            groupFunction(node.group, node)
        }

        //same goes for the industy clusters that are sub-clusters of the country clusters in this example
        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }


        //there are several distribution classes defined
        //these handle how the current cluster positions it's sub-clusters when rendering
        //basically a distribution function does have 2 parameters
        // the first is the maximum size in x/y/z direction the elements within can be placed
        // the second defined the dimensions 1/2/3 that get used for the element placement


        let countryDistribution = new ForceGraphDistribution(60000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new ForceGraphDistribution(10000, 2);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new ForceGraphDistribution(5000, 2);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        //   let rootHull = this.isDebug() ? BoxVolume : BaseVolume;


        return [

            {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {
                    minClusterSize: 40,
                    hull: BaseVolume,// rootHull,
                    edges: ClusterMeshEdges,
                    colors: {
                        edge: [0x000000, 0.8],
                        hull: [0x6A5ACD, 0.8] //TODO maxOpacity for convexHull is a bit bugged.. initially its set correct but due to transfer it is changed again on hover

                    }
                }
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                events: {
                    click: function () {
                        this.toggleCollapse()

                        console.log("toggled country?", this.name)
                    }
                },
                options: {
                    minClusterSize: 15,
                    hull: FlatVolume,//ConvexVolume,
                    edges: ClusterMeshEdges,
                    expanded: function () {
                        // return true
                        return this.name == "United States"
                    }
                }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {
                distribution: nodesWithinIndustryDistribution,
                events: {
                    click: function () {
                        this.toggleCollapse()
                        console.log("toggled leaf", this.name)
                    },
                    mouseover: function () {

                        //  this.bClusterEdgesVisible= true

                    },
                    mouseout: function () {

                        //  this.bClusterEdgesVisible= false
                    }
                },
                options: {
                    hull: FlatVolume,

                    expanded: function () {

                        let par = this.getParentCluster()
                        if (!par) return false

                        return /*par.getParentCluster().name == "United States" &&*/ this.name == "Healthcare"// false //true// return false//

                    }
                }
            }

        ]

    }
}