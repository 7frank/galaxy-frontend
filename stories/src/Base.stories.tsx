import { useEffect, useRef } from 'react'
import { GraphView3D, ClusteringUtils, GeneratorDatasource } from 'cluster-graph-3d'
import 'cluster-graph-3d/dist/index.css'

export default { title: 'Examples' }

export const Base = () => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const graph = new GraphView3D(ref.current, {
      nodeTexture: '/dot7.png',
      nodeDefaultScale: 50,
      speccs: ClusteringUtils.buildSpeccs(['group', 'industry']),
    })
    graph.edgeIndicator(true)
    graph.loadDatasource(
      new GeneratorDatasource({ nodeCount: 5000, edgeCount: 2000, maxItemsPerNode: 50, clusterEdgeBias: 0.9 })
    )
    graph.maximise()
    return () => (graph as any).destroy?.()
  }, [])

  return <div ref={ref} style={{ width: '100vw', height: '100vh' }} />
}
