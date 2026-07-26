import { useEffect, useRef } from 'react'
import {
  GraphView3D,
  ClusteringUtils,
  GeneratorDatasource,
  CircleDistribution,
  GridDistribution,
  BoxHullEffect,
  BoxVolume,
} from 'cluster-graph-3d'
import 'cluster-graph-3d/dist/index.css'

export default { title: 'Examples' }

export const Basic = () => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const graph = new GraphView3D(ref.current, {
      nodeTexture: '/dot7.png',
      nodeDefaultScale: 10,
      showEdgeIndicator: true,
      speccs: ClusteringUtils.buildSpeccs([
        {
          key: 'group',
          distribution: new CircleDistribution(90000),
          hullOptions: { minClusterSize: 40 },
        },
        {
          key: 'industry',
          distribution: new GridDistribution(25000),
          hullOptions: {
            zoomDirection: [0, -1, 0],
            minClusterSize: 15,
            hullBorderMode: 'hover',
          },
        },
        {
          distribution: new GridDistribution(8000),
          hullOptions: {
            zoomDirection: [0, -1, 0],
            hull: BoxVolume,
            makeHullEffect: () => new BoxHullEffect(),
            hullBorderMode: 'ambient',
          },
        },
      ]),
    })
    graph.loadDatasource(
      new GeneratorDatasource({
        nodeCount: 5000,
        edgeCount: 2000,
        maxItemsPerNode: 50,
        clusterEdgeBias: 0.9,
      })
    )
    return () => (graph as any).destroy?.()
  }, [])

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }} />
      <graph-searchbar placeholder="Search nodes" search-fields="name,id,group,industry" />
      <graph-node-list />
    </>
  )
}
