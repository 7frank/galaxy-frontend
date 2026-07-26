import { useEffect, useRef } from 'react'
import { ClusterLeafElement, RandomDistribution, DomEventsAlt } from 'cluster-graph-3d'
import * as THREE from 'three'

export default { title: 'Examples' }

export const PointCloud = () => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const W = ref.current.clientWidth
    const H = ref.current.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    ref.current.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 1, 1000000)
    camera.position.set(0, 0, 5000)

    const nodes = Array.from({ length: 100 }, (_, i) => {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(10),
        new THREE.MeshBasicMaterial({ visible: false })
      )
      const node = {
        id: i, x: 0, y: 0, z: 0, color: 0x00aaff,
        edges: i > 0 ? [{ target: i - 1 }] : [],
        _bubble: bubble,
        get3DRoot() { return bubble },
      }
      return node
    })

    const domEvents = new DomEventsAlt(camera, renderer.domElement, scene)
    const leaf = new ClusterLeafElement(nodes, domEvents, { nodeTexture: '/dot7.png' })
    scene.add(leaf)

    const dist = new RandomDistribution(2000, 3)
    leaf.setDistributionHandler(dist, () => {
      const pc = (leaf as any).mNodeParticles.pointCloud
      pc.geometry.computeBoundingBox()
      const box = new THREE.BoxHelper(pc, 0xffff00)
      scene.add(box)
    })

    renderer.setAnimationLoop(() => renderer.render(scene, camera))

    return () => {
      renderer.setAnimationLoop(null)
      renderer.dispose()
      ref.current?.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
