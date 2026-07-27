import TWEEN from "@tweenjs/tween.js"
import { AdditiveBlending } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
import { Color } from "three/src/math/Color.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Points } from "three/src/objects/Points.js";
import * as _ from "lodash";


/**
 * Creates a sub-particle system for a set of nodes.
 * This particle system is based on a point cloud which holds all the positions of the particles.
 * The particles visible in this implementation are small rectangular dots rendered within the vicinity of each node.
 * The number of particles per node is determined by the value of  - node[options.nodeKey] -
 * For the default case default this is - node.itemCount - where 'itemCount' is the an integer attribute for a node.
 *
 * The particles are meant to be partially independent of the node itself.
 * For example: If a graph is rendered and its node reaches a certain position in space, the animation for the particle system can be triggered for the whole set of nodes.
 * The result is a transition effect of many particles to their destination (each node) from an initial position.
 *
 *
 * @param {object} [nodes] - A set of nodes for  which the particles are created.
 *                  Use multiple particle systems for different clusters of nodes to prevent unnecessary calculations
 *                  to otherwise to the user invisible nodes.
 * @param {object} [options]  An object to override the default options.
 * @param {String} [options.groupKeyName]  @deprecated node[groupKeyName]  indicates whether the node is a group node or not.
 * @param {String} [options.groupValueName] @deprecated If the node is a group node - indicated by the 'groupKeyName' - node[groupValueName] will contain an array of grouped nodes.
 * @param {String} [options.nodeKey] The name of the node object key that determines the number of sub-particles rendered per node.
 * @param {function} [options.npc] @deprecated A function one may pass as an alternative way to retrieve the particle count of a node.
 * @param {Number} options.increment] @deprecated The increment value for the animation to the destination. Bigger values equals faster transition to destination.
 * @param {Number} [options.duration] The time in milliseconds the transition will take until finished.
 * @param {function} [options.easing] The easing function {@link TWEEN.Easing.*}. Can be used for example for bouncing effects of particles.
 * @param {Object} [options.position] The initial position of the particle in space.
 * @param {Number} [options.position.x] The initial position on the x-axis of the particle in space.
 * @param {Number} [options.position.y] The initial position on the y-axis of the particle in space.
 * @param {Number} [options.position.z] The initial position on the z-axis of the particle in space.
 *
 * @returns {{destination: Float32Array, pointCloud: Points, particleCount: number, nodes: *, updateDestinations: updateDestinations, updateColors: updateColors, start: start, stop: stop, update: animateParticles, remove: remove}}
 */



export default function NodesParticleSystem(nodes, options) {


    /**
     * Creates a shader material which is used to render the particle system via {@link Points} point cloud.
     *
     * @returns {ShaderMaterial}
     */
    function getParticleShaderMaterial() {
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
			uniform vec3 color;
			uniform sampler2D pointTexture;

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( color * vColor, 1.0 );

				gl_FragColor = gl_FragColor * texture( pointTexture, gl_PointCoord );
			}
	`;


        /*  var attributes = {

                   size:        { type: 'f', value: null },
                   customColor: { type: 'c', value: null },
                   //destination:        { type: 'f', value: null },

               };*/

        var uniforms = {

            color: {type: "c", value: new Color(0xffffff)},
            pointTexture: {type: "t", value: new TextureLoader().load(options.blockTexture || "img/block.png")}

        };


        var shaderMaterial = new ShaderMaterial({

            uniforms: uniforms,
            // attributes:     attributes,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,

            //blending:       AdditiveBlending,
            //depthTest:      false,
            //transparent:    true

        });


        return shaderMaterial

    }

    /**
     * The default options for the {@link NodesParticleSystem} .
     */

    options = _.extend({
        groupKeyName: "isGroupNode",
        groupValueName: "nodes",
        nodeKey: 'itemCount',
       // increment: 5,
        duration: 1000,
        easing: TWEEN.Easing.Linear.None,
        position: {x: 0, y: 50000, z: 50000},
        blockTexture: "img/block.png"
    }, options);

    /**
     * A method to calculate the particle count of a node.
     *
     * @param {Object} [node] The node object to retrieve the particle count from.
     */
    function getNodeParticleCount(node) {

        if (node[options.groupKeyName])
            return _.sumBy(node[options.groupValueName], options.nodeKey);
        else return node[options.nodeKey] || 0

    }

    //Override default - node particle count - function with an optional one.
    if (typeof options.npc == "function")
        getNodeParticleCount = options.npc;


    var shaderMaterial = getParticleShaderMaterial();
    var particlesPerNode = nodes.map((n) => getNodeParticleCount(n));
    //console.log("particles per node:",particlesPerNode)
    var particles = _.sum(particlesPerNode);


    var positions = new Float32Array(particles * 3);
    var destination = new Float32Array(particles * 3);
    var values_color = new Float32Array(particles * 3);
    var values_size = new Float32Array(particles);
    var geometry = new BufferGeometry();

    var v = 0;
    for (var n in nodes) {

        let count = particlesPerNode[n];

        for (var i = 0; i < count; i++) {


            var color = (typeof n.color == "number") ? new Color(n.color) : new Color(0xffff00);


            values_size[v] = 2.5;
            values_color[v * 3 + 0] = color.r * 1.1 + Math.random() * 0.15;
            values_color[v * 3 + 1] = color.g * 1.1 + Math.random() * 0.15;
            values_color[v * 3 + 2] = color.b * 1.1 + Math.random() * 0.15;
            destination[v * 3 + 0] = 1;
            destination[v * 3 + 1] = 2;
            destination[v * 3 + 2] = 5000;

            positions[v * 3 + 0] = options.position.x;
            positions[v * 3 + 1] = options.position.y;
            positions[v * 3 + 2] = options.position.z;

            v++
        }
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new BufferAttribute(values_color, 3));
    geometry.setAttribute('size', new BufferAttribute(values_size, 1));

    var particleSystem = new Points(geometry, shaderMaterial);

    //override raycaster
    particleSystem.raycast = function () {
    };


    particleSystem.frustrumCulled = true;


    /**
     * Updates the color property  of the float array 'customColor' of the point cloud geometry.
     * based on the color value of the nodes.
     *
     */
    function updateColors() {


        var v = 0;
        for (var n in nodes) {
            var node = nodes[n];
            let count = particlesPerNode[n];


            for (var i = 0; i < count; i++) {
                var color = (typeof node.color == "number") ? new Color(node.color) : new Color(0xffff00);

                var rnd = Math.random() * 0.1;
                values_color[v * 3 + 0] = color.r * 1.1 + rnd;
                values_color[v * 3 + 1] = color.g * 1.1 + rnd;
                values_color[v * 3 + 2] = color.b * 1.1 + rnd;


                v++
            }
        }


        var colors = geometry.attributes.customColor;
        colors.needsUpdate = true

    }


    //-----------------

    //var increment = options.increment;


    /**
     * copies x,y,z attributes of the node into the array buffer of the geometry
     *
     */
    function updateDestinations(/*inc = 1*/) {
     //increment = inc;


        var v = 0;
        for (var n in nodes) {
            var node = nodes[n];
            let count = particlesPerNode[n];

            var scale = node.size / 2 | 1;


            for (var i = 0; i < count; i++) {

                let x = node.x + (Math.random() - 0.5) * scale, y = node.y + (Math.random() - 0.5) * scale,
                    z = node.z + (Math.random() - 0.5) * scale;

                destination[v * 3 + 0] = x;
                destination[v * 3 + 1] = y;
                destination[v * 3 + 2] = z;


                v++
            }
        }


    }

//------------------

    var percentage = 1;
    var particlesPlaced = 0;
    var tween;
    var start_time;


    /**
     * Creates the tween. Will stop a previous created tween.
     *
     * @param {number} [duration] Duration of the animation in miliseconds.
     * @param {function} [easing] An easing function. {@link TWEEN.Easing.*}
     * @param {function} [onComplete] Callback for when the tween finishes.
     * @returns {TWEEN.Tween}
     */
    function createTween(duration = 1000, easing, onComplete = function () {
    }) {

        start_time = Date.now();

        var positions = geometry.attributes.position.array;

        // console.log("createParticleTween",positions,destination,duration,Date.now())

        if (tween) tween.stop();

        tween = new TWEEN.Tween(positions)
            .to(destination, duration);

        if (typeof easing == "function")
            tween.easing(easing);

        tween.onUpdate(function () {
            //   console.log("updateParticleTween",positions,destination,Date.now())
            geometry.attributes.position.needsUpdate = true;

        }).onComplete(() => {
            isRunning = false;
            onComplete()
        });


        return tween
    }


    var isRunning = false;


    /**
     * Updates the position of the current active tween based on the first parameter 'mTime'
     * @param {number} [mTime] The value passed to the callback function of {@link window.requestAnimationFrame}.
     */
    function animateParticles(mTime) {

        if (!mTime) {

            console.warn("update function needs time from animation loop  see View3D::getView().mTime");
            return
        }


        if (!isRunning) return;

        if (tween && isRunning)
            tween.update(mTime)

    }


    return {
        destination: destination,
        pointCloud: particleSystem,
        particleCount: particles,
        nodes: nodes,
        updateDestinations: updateDestinations,
        updateColors: updateColors,
        start: function () {

            if (!particleSystem) {

                console.error("already disposed");
                return
            }

            isRunning = true;
            updateDestinations();

            let tween = createTween(options.duration, options.easing, function () {
                particleSystem.geometry.computeBoundingSphere()

            });

            tween.start();

            //for now just have a huge bounding volume that keeps the particle system visible
            particleSystem.geometry.boundingSphere = new Sphere(new Vector3, 50000);


        },
        stop: function () {
            isRunning = false;

        },
        update: animateParticles,
        remove: function () {
            this.stop();

            if (particleSystem.geometry)
                particleSystem.geometry.dispose();
            if (particleSystem.material)
                particleSystem.material.dispose();


            if (particleSystem.parent)
                particleSystem.parent.remove(particleSystem);


            particleSystem = null;

        }
    }


}
	