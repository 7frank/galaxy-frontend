/**
 **    use for group of nodes that share some similarities (nCountry <= company)
 *    this approach does not allow for adding removing nodes as of yet
 */
export default function ParticleNodeGroup(nodes, options,domEvents) {

    options = _.extend({

        nodeDefaultSize: 10,
        nodeDefaultScale: 1,
        nodeTexture: "img/dot7.png",
        baseColor: 0xFFFFFF
    }, options)


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

    function updateNode(i) {
        updateNodePosition(i)
        updateNodeColor(i)
        updateNodeSize(i)

    }

    function updateNodePosition(i) {
        //updates the current nodes properties

        var positions = geometry.attributes.position.array;

        positions[i * 3] = nodes[i].x
        positions[i * 3 + 1] = nodes[i].y
        positions[i * 3 + 2] = nodes[i].z

        geometry.attributes.position.needsUpdate = true;

    }

    function updateNodeColor(i) {
        var colors = geometry.attributes.customColor.array;

        var color = (typeof nodes[i].color == "number") ? new THREE.Color(nodes[i].color) : new THREE.Color(0xffffff);

        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        geometry.attributes.customColor.needsUpdate = true;
    }

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
        on:  function(eventName, eventhandler) {

        for (let eName of eventName.split(" ")) {

           domEvents.addEventListener(particleSystem, eName,function(e) {

               let index=e.intersect.index;

               let node=  nodes[index];

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
 * this is a custom implementation for the raytracer of the point cloud
 * NOTE: currently it is not used because the nodes are handled partially as empty meshes
 * so the default threex.domEvents library can be used instead of the current work around
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
