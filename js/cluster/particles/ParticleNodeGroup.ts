import { NormalBlending } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
import { Color } from "three/src/math/Color.js";
import { Matrix4 } from "three/src/math/Matrix4.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Points } from "three/src/objects/Points.js";
import type DomEventsAlt from "../utils/DomEventsAlt";
import dot7Image from "../../../img/dot7.png";

export interface GraphNode {
    x: number
    y: number
    z: number
    color?: number
    size?: number
}

export interface BubbleNode extends GraphNode {
    _bubble?: {
        position: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void }
        matrixWorld: Matrix4
        parent?: { parent?: { getRoot?: () => { position: Vector3 } } }
    }
}

export interface ParticleNodeGroupOptions {
    nodeDefaultSize?: number
    nodeDefaultScale?: number
    nodeTexture?: string
    blockTexture?: string
    baseColor?: number
}

export interface ParticleNodeGroupInstance {
    nodes: GraphNode[]
    pointCloud: Points
    update: () => void
    updateNode: (i: number) => void
    updateNodePosition: (i: number) => void
    updateNodeColor: (i: number) => void
    updateNodeSize: (i: number) => void
    on: (eventName: string, eventhandler: Function) => void
    remove: () => void
}

/**
 * The ParticleNodeGroup handles the rendering of a set of graph-nodes via a {@link Points} point cloud.
 * Use for group of nodes that share some similarities (country, company, ...)
 *
 * NOTE: This approach does not allow for adding removing nodes as of yet.
 *
 * @param nodes .. a set of nodes to be rendered
 * @param options ..configuration object
 * @param domEvents ... in instance of {@link  cluster.utils.DomEventsAlt}
 * @returns {{nodes: *, pointCloud: Points, update: update, updateNode: updateNode, updateNodePosition: updateNodePosition, updateNodeColor: updateNodeColor, updateNodeSize: updateNodeSize, on: on, remove: remove}}
 */
export default function ParticleNodeGroup(nodes: GraphNode[], options: ParticleNodeGroupOptions = {}, domEvents: InstanceType<typeof DomEventsAlt> | null): ParticleNodeGroupInstance {

    const resolvedOptions = Object.assign({
        nodeDefaultSize: 10,
        nodeDefaultScale: 1,
        nodeTexture: dot7Image,
        baseColor: 0xFFFFFF
    }, options)


    /**
     * Uses a shader material to render the node.
     *
     * @returns {ShaderMaterial}
     */
    function getParticleShaderMaterial2(): ShaderMaterial {
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
								uniform sampler2D pointTexture;

								varying vec3 vColor;

								void main() {

									gl_FragColor = vec4( color * vColor, opacity );

									gl_FragColor = gl_FragColor * texture( pointTexture, gl_PointCoord );
								}
						`;

        var uniforms = {

            color: {
                type: "c",
                value: new Color(resolvedOptions.baseColor)
            },
            opacity: {
                type: "f",
                value: 1.0
            },
            pointTexture: {
                type: "t",
                value: new TextureLoader().load(resolvedOptions.nodeTexture!, undefined, undefined, () => {
                    console.error(`ParticleNodeGroup: failed to load texture "${resolvedOptions.nodeTexture}"`)
                })
            }

        };

        var shaderMaterial = new ShaderMaterial({

            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,

            blending: NormalBlending,

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
    var geometry = new BufferGeometry();

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new BufferAttribute(values_color, 3));
    geometry.setAttribute('size', new BufferAttribute(values_size, 1));

    var particleSystem = new Points(geometry, shaderMaterial);

    particleSystem.userData.srcNodes = nodes
    ;(particleSystem as Points & { frustrumCulled?: boolean }).frustrumCulled = true;

    particleSystem.geometry.boundingSphere = new Sphere(new Vector3(), 50000);

    for (let i = 0; i < nCount; i++)
        updateNode(i)


    function updateNode(i: number) {
        updateNodePosition(i)
        updateNodeColor(i)
        updateNodeSize(i)
    }

    function updateNodePosition(i: number) {
        var positions = geometry.attributes.position.array as Float32Array;

        positions[i * 3] = nodes[i].x
        positions[i * 3 + 1] = nodes[i].y
        positions[i * 3 + 2] = nodes[i].z

        geometry.attributes.position.needsUpdate = true;
    }

    function updateNodeColor(i: number) {
        var colors = geometry.attributes.customColor.array as Float32Array;

        var color = (typeof nodes[i].color == "number") ? new Color(nodes[i].color) : new Color(0xffffff);

        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        geometry.attributes.customColor.needsUpdate = true;
    }

    function updateNodeSize(i: number) {
        var sizes = geometry.attributes.size.array as Float32Array;
        if (typeof nodes[i].size == "number")
            sizes[i] = nodes[i].size! * resolvedOptions.nodeDefaultScale!;
        else
            sizes[i] = resolvedOptions.nodeDefaultSize! * resolvedOptions.nodeDefaultScale!

        geometry.attributes.size.needsUpdate = true;
    }


    return {
        nodes: nodes,
        pointCloud: particleSystem,
        update: function () {
            for (let i = 0; i < nCount; i++)
                updateNode(i)
        },
        updateNode: updateNode,
        updateNodePosition: updateNodePosition,
        updateNodeColor: updateNodeColor,
        updateNodeSize: updateNodeSize,
        on: function (eventName: string, eventhandler: Function) {

            for (let eName of eventName.split(" ")) {

                domEvents.addEventListener(particleSystem, eName, function (e: { intersect?: { index: number } }) {

                    if (!e.intersect) {
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
                (particleSystem.material as ShaderMaterial).dispose();

            if (particleSystem.parent)
                particleSystem.parent.remove(particleSystem)

        }
    }

}
