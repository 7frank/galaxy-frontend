import { GraphView3D, ClusteringUtils, GeneratorDatasource } from 'cluster-graph-3d'
import 'cluster-graph-3d/dist/index.css'
import 'cluster-graph-3d/dist/gui.css'
import { useVanillaMount } from './useVanillaMount'

export default { title: 'Examples' }

export const Base = () => {
  const ref = useVanillaMount(
    (el) => {
      return new GraphView3D(el, {
        nodeTexture: `${import.meta.env.BASE_URL}dot7.png`,
        nodeDefaultScale: 50,
        showEdgeIndicator: true,
        speccs: ClusteringUtils.buildSpeccs(['group', 'industry']),
      }).loadDatasource(
        new GeneratorDatasource({ nodeCount: 5000, edgeCount: 2000, maxItemsPerNode: 50, clusterEdgeBias: 0.9 })
      )
    },
    (graph) => (graph as any).destroy?.()
  )

  return <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
