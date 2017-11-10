import * as THREE from "three";
import * as _ from "lodash";

/**
 * The ParticleNodeGroup handles the rendering of a set of graph-nodes via a {@see THREE.Points} point cloud.
 * Use for group of nodes that share some similarities (country, company, ...)
 *
 * NOTE: This approach does not allow for adding removing nodes as of yet.
 *
 * @param nodes .. a set of nodes to be rendered
 * @param options ..configuration object
 * @param domEvents ... in instance of {@see  cluster.utils.DomEventsAlt}
 * @returns {{nodes: *, pointCloud: Points, update: update, updateNode: updateNode, updateNodePosition: updateNodePosition, updateNodeColor: updateNodeColor, updateNodeSize: updateNodeSize, on: on, remove: remove}}
 */
export default function ParticleNodeGroup(nodes, options, domEvents) {

    options = _.extend({
        nodeDefaultSize: 10, //by default the node size is set to 10 units
        nodeDefaultScale: 1, // a scaling factor for the size
        nodeTexture: "img/dot7.png", // the texture/image that will be used as the default node representation
        baseColor: 0xFFFFFF  // the default color of the node
    }, options)


    /**
     * Uses a shader material to render the node.
     *
     * @returns {ShaderMaterial}
     */
    function getParticleShaderMaterial2() {
        var vertexShader = `
									
									attribute float size;
									attribute vec3 customColor;
									varying vec3 vColor;

									void main() {

										vColor = customColor;

										vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

										gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

										gl_Position = projectionMatrix * mvPosition;

									}
							`;

        var fragmentShader = `
									uniform float opacity;
									uniform vec3 color;
									uniform sampler2D texture;

									varying vec3 vColor;

									void main() {

										gl_FragColor = vec4( color * vColor, opacity );

										gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
									}
							`;

        var uniforms = {

            color: {
                type: "c",
                value: new THREE.Color(options.baseColor)
            },
            opacity: {
                type: "f",
                value: 1.0
            },
            texture: {
                type: "t",
                value: new THREE.TextureLoader().load(options.nodeTexture)
            }

        };

        var shaderMaterial = new THREE.ShaderMaterial({

            uniforms: uniforms,
            // attributes:     attributes,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,

            //blending: THREE.AdditiveBlending,
            blending: THREE.NormalBlending,

            depthTest: true,
            depthWrite: false,
            transparent: true
        });

        return shaderMaterial
    }

    var shaderMaterial = getParticleShaderMaterial2()

    var nCount = nodes.length

    var positions = new Float32Array(nCount * 3);

    var values_color = new Float32Array(nCount * 3);
    var values_size = new Float32Array(nCount);
    var geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(values_color, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(values_size, 1));

    var particleSystem = new THREE.Points(geometry, shaderMaterial);

    //TODO we might be able to remove the meshes and enable the raycasting in here again

    //prevent raycasting nodes// this actually does not give the intended effect and we added invisible meshes instead
    //particleSystem.raycast=function(){}

    //added to be able to retrieve the original node from the point within the raycaster code
    particleSystem.srcNodes = nodes
    particleSystem.frustrumCulled = true;

    //for now just have a huge bounding volume //TODO recalc sphere every now and then
    particleSystem.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);

    for (let i = 0; i < nCount; i++)
        updateNode(i)


    /**
     * For convenience.
     *
     */
    function updateNode(i) {
        updateNodePosition(i)
        updateNodeColor(i)
        updateNodeSize(i)

    }


    /**
     * This method is called to update the position data (position) of the point cloud buffer geometry,
     * based on the 'x,y,z'-coordinates of the node.
     *
     * @param i .. the i-th node to update
     */
    function updateNodePosition(i) {
        //updates the current nodes properties

        var positions = geometry.attributes.position.array;

        positions[i * 3] = nodes[i].x
        positions[i * 3 + 1] = nodes[i].y
        positions[i * 3 + 2] = nodes[i].z

        geometry.attributes.position.needsUpdate = true;

    }


    /**
     * This method is called to update the color data (customColor) of the point cloud buffer geometry
     * based on the 'color'-attribute of the node.
     *
     * @param i .. the i-th node to update
     */
    function updateNodeColor(i) {
        var colors = geometry.attributes.customColor.array;

        var color = (typeof nodes[i].color == "number") ? new THREE.Color(nodes[i].color) : new THREE.Color(0xffffff);

        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        geometry.attributes.customColor.needsUpdate = true;
    }

    /**
     * This method is called to update the size data (size) of the point cloud buffer geometry
     * based on the 'size'-attribute of the node.
     *
     * @param i .. the i-th node to update
     */

    function updateNodeSize(i) {
        var sizes = geometry.attributes.size.array;
        if (typeof nodes[i].size == "number")
            sizes[i] = nodes[i].size * options.nodeDefaultScale;
        else
            sizes[i] = options.nodeDefaultSize * options.nodeDefaultScale

        geometry.attributes.size.needsUpdate = true;

    }


    return {
        nodes: nodes,
        pointCloud: particleSystem,
        update: function () {

            //update node attrs
            for (let i = 0; i < nCount; i++)
                updateNode(i)

        },
        updateNode: updateNode,
        updateNodePosition: updateNodePosition,
        updateNodeColor: updateNodeColor,
        updateNodeSize: updateNodeSize,
        on: function (eventName, eventhandler) {

            for (let eName of eventName.split(" ")) {

                domEvents.addEventListener(particleSystem, eName, function (e) {

                    if (!e.intersect) {
                        //TODO find out if it is a bug within DomEventsAlt selection that is set =null
                        console.warn("could not resolve intersection ")
                        return
                    }

                    let index = e.intersect.index;
                    let node = nodes[index];
                    eventhandler.bind(node)(arguments)

                }, false);

            }


        },
        remove: function () {

            if (particleSystem.geometry)
                particleSystem.geometry.dispose();
            if (particleSystem.material)
                particleSystem.material.dispose();


            if (particleSystem.parent)
                particleSystem.parent.remove(particleSystem)

            particleSystem = null

        }
    }

}


/**
 *
 * This is a custom implementation for the ray-tracer of the point cloud
 * NOTE: currently it is not used because the nodes are handled partially as empty meshes
 * so the default THREEx.DomEvents library can be used
 *
 * @deprecated
 *
 * @param pointclouds
 * @param camera
 * @returns {{raycast: raycast, on}}
 */


function createParticleNodeGroupIntersectionHelper(pointclouds, camera) {

    if (!pointclouds)
        throw new Error("needs THREE.Points array")
    if (!camera)
        throw new Error("needs THREE.Camera object")

    var mouse = new THREE.Vector2();

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    var lastClick = 0;

    function onDocumentMouseClick() {

        lastClick = Date.now()

    }

    document.addEventListener('click', onDocumentMouseClick, false);

    var lastDblClick = 0;

    function onDocumentMouseDblClick() {

        lastDblClick = Date.now()

    }

    document.addEventListener('click', onDocumentMouseDblClick, false);

    //-----------------------------
    var threshold = 20;

    var raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = threshold;

    var eventList = $({})
    var lastIntersectedNode;

    function raycast() {
        raycaster.setFromCamera(mouse, camera);
        var intersections = raycaster.intersectObjects(pointclouds);
        var intersection = (intersections.length) > 0 ? intersections[0] : null;
        if (intersection !== null) {

            var intersectedNode = intersection.object.srcNodes[intersection.index]

            eventList.trigger("mouseover", [intersection, intersectedNode, intersections])

            if (lastIntersectedNode && lastIntersectedNode != intersectedNode)
                eventList.trigger("mouseout", [intersection, lastIntersectedNode, intersections])

            if (Date.now() - lastClick < 50)
                eventList.trigger("click", [intersection, intersectedNode, intersections])

            if (Date.now() - lastDblClick < 50)
                eventList.trigger("dblclick", [intersection, intersectedNode, intersections])

            lastIntersectedNode = intersectedNode
        } else if (lastIntersectedNode)
            eventList.trigger("mouseout", [intersection, lastIntersectedNode, intersections])

    }

    return {
        raycast,
        on: eventList.on.bind(eventList)
    }
}
