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
import 'cluster-graph-3d/dist/gui.css'
import 'cluster-graph-3d/gui'
import { useVanillaMount } from './useVanillaMount'
import type { Story } from '@ladle/react'

export default { title: 'Examples' }

type BasicArgs = {
  nodeCount: number
  edgeCount: number
  clusterEdgeBias: number
  crossEdgeMode: string
  crossEdgeColor: string
  crossEdgeMaxEdges: number
  crossEdgeOpacity: number
  crossEdgeFadeDuration: number
}

export const Basic: Story<BasicArgs> = ({
  nodeCount,
  edgeCount,
  clusterEdgeBias,
  crossEdgeMode,
  crossEdgeColor,
  crossEdgeMaxEdges,
  crossEdgeOpacity,
  crossEdgeFadeDuration,
}) => {
  const color = parseInt(crossEdgeColor.replace('#', ''), 16)

  const ref = useVanillaMount(
    (el) => {
      return new GraphView3D(el, {
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
              crossClusterEdges: {
                mode: crossEdgeMode as any,
                color,
                maxEdges: crossEdgeMaxEdges,
                opacity: crossEdgeOpacity,
                fadeDuration: crossEdgeFadeDuration,
              },
            },
          },
        ]),
      }).loadDatasource(
        new GeneratorDatasource({
          nodeCount,
          edgeCount,
          maxItemsPerNode: 50,
          clusterEdgeBias,
        })
      )
    },
    (graph) => (graph as any).destroy?.(),
    [nodeCount, edgeCount, clusterEdgeBias, crossEdgeMode, crossEdgeColor, crossEdgeMaxEdges, crossEdgeOpacity, crossEdgeFadeDuration]
  )

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: '100%', position: 'relative' }} >
        <graph-breadcrumb></graph-breadcrumb>
        <graph-searchbar placeholder="Search nodes" search-fields="name,id,group,industry" />
        <graph-node-list />
        <graph-color-gradient left-label="Negative" right-label="Positive" />
      </div>
    </>
  )
}

Basic.args = {
  nodeCount: 5000,
  edgeCount: 2000,
  clusterEdgeBias: 0.9,
  crossEdgeColor: '#88BBDD',
  crossEdgeMaxEdges: 30,
  crossEdgeOpacity: 0.6,
  crossEdgeFadeDuration: 200,
}

Basic.argTypes = {
  nodeCount: {
    control: { type: 'range', min: 500, max: 10000, step: 500 },
  },
  edgeCount: {
    control: { type: 'range', min: 100, max: 5000, step: 100 },
  },
  clusterEdgeBias: {
    control: { type: 'range', min: 0, max: 1, step: 0.05 },
  },
  crossEdgeMode: {
    options: ['hover', 'always', 'none'],
    control: { type: 'radio' },
    defaultValue: 'hover',
  },
  crossEdgeColor: {
    control: { type: 'text' },
  },
  crossEdgeMaxEdges: {
    control: { type: 'range', min: 5, max: 100, step: 5 },
  },
  crossEdgeOpacity: {
    control: { type: 'range', min: 0.05, max: 1, step: 0.05 },
  },
  crossEdgeFadeDuration: {
    control: { type: 'range', min: 0, max: 1000, step: 50 },
  },
}
