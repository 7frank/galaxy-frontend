import { useState } from 'react'
import {
  GraphView3D,
  ClusteringUtils,
  CircleDistribution,
  GridDistribution,
  CircleHullEffect,
  BasicHullEffect,
  ConvexVolume,
} from 'cluster-graph-3d'
import 'cluster-graph-3d/dist/index.css'
import WikidataBoardDatasource from './WikidataBoardDatasource'
import { useVanillaMount } from './useVanillaMount'

export default { title: 'Examples' }

export const BoardOverlap = () => {
  const [status, setStatus] = useState('Querying SPARQL endpoint…')
  const [progress, setProgress] = useState(20)
  const [loaded, setLoaded] = useState(false)

  const ref = useVanillaMount(
    (el) => {
      const graph = new GraphView3D(el, {
        nodeTexture: '/dot7.png',
        nodeDefaultScale: 10,
        showEdgeIndicator: true,
        speccs: ClusteringUtils.buildSpeccs([
          {
            key: 'group',
            distribution: new CircleDistribution(90000),
            hullOptions: { minClusterSize: 2 },
          },
          {
            key: 'industry',
            distribution: new GridDistribution(25000),
            hullOptions: {
              zoomDirection: [0, -1, 0],
              minClusterSize: 2,
              hull: ConvexVolume,
              makeHullEffect: () => new CircleHullEffect(),
              hullBorderMode: 'hover',
            },
          },
          {
            distribution: new CircleDistribution(6000),
            hullOptions: {
              zoomDirection: [0, -1, 0],
              hull: ConvexVolume,
              makeHullEffect: () => new BasicHullEffect(),
              hullBorderMode: 'ambient',
            },
          },
        ]),
      })

      setProgress(50)
      setStatus('Fetching board membership data…')

      graph.loadDatasource(new WikidataBoardDatasource({ limit: 400, minOverlap: 1 }))
      setProgress(80)

      graph.addEventListener('loaded', () => {
        setProgress(100)
        setStatus('Done')
        setTimeout(() => setLoaded(true), 300)
      })

      return graph
    },
    (graph) => (graph as any).destroy?.()
  )

  return (
    <>
      {!loaded && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0a12', color: 'white', fontFamily: 'sans-serif',
          fontSize: '1.1em', zIndex: 9999, gap: '1em',
        }}>
          <div>Loading board overlap data from Wikidata…</div>
          <div style={{ width: 280, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(to right, #4488ff, #88ccff)', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ opacity: 0.6, fontSize: '0.85em' }}>{status}</div>
        </div>
      )}
      <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }} />
      <graph-searchbar placeholder="Search companies" search-fields="name,industry,group,info" />
      <graph-node-list />
    </>
  )
}
