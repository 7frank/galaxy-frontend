import { useEffect, useRef } from 'react'
import {
  GraphView3D,
  ClusteringUtils,
  GeneratorDatasource,
  ForceGraphDistribution,
  GPUForceGraphDistribution,
  BoxVolume,
  BoxHullEffect,
} from 'cluster-graph-3d'
import 'cluster-graph-3d/dist/index.css'
import 'cluster-graph-3d/dist/gui.css'
import type { Story } from '@ladle/react'

export default { title: 'Examples' }

const NODE_COUNT = 50_000
const EDGE_COUNT = 20_000
const initialEngineTicks = 0



function addLabel(el: HTMLDivElement, text: string) {
  const labelEl = document.createElement('div')
  labelEl.style.cssText =
    'position:absolute;top:8px;left:8px;color:#fff;font:13px monospace;pointer-events:none;background:rgba(0,0,0,.5);padding:4px 8px;border-radius:4px;z-index:10'
  labelEl.textContent = text
  el.appendChild(labelEl)
  return labelEl
}

export const ForceComparison: Story = () => {
  const cpuRef = useRef<HTMLDivElement>(null)
  const gpuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cpuRef.current || !gpuRef.current) return

    const cpuLabel = addLabel(cpuRef.current, 'CPU (d3-force-3d)')
    const gpuLabel = addLabel(gpuRef.current, 'GPU (WebGL GPGPU)')

    const leafHullOptions = {
      hull: BoxVolume,
      makeHullEffect: () => new BoxHullEffect(),
      hullBorderMode: 'ambient' as const,
    }

    const cpuGraph = new GraphView3D(cpuRef.current, {
      nodeDefaultScale: 10,
      speccs: ClusteringUtils.buildSpeccs([
        { key: 'group' },
        { key: 'industry' },
        { },
      ]),
    })
    cpuGraph.loadDatasource(
      new GeneratorDatasource({ nodeCount: NODE_COUNT, edgeCount: EDGE_COUNT, maxItemsPerNode: 50 })
    )

    const gpuDist = new GPUForceGraphDistribution(null as any, 900000, 3, 0)
    const gpuDist2 = new GPUForceGraphDistribution(null as any, 300000, 3, 0)
    const gpuGraph = new GraphView3D(gpuRef.current, {
      nodeDefaultScale: 10,
      speccs: ClusteringUtils.buildSpeccs([
        { distribution: gpuDist,key: 'group' },
         { distribution: gpuDist2,key: 'industry' },
        {  },
      ]),
    })
    gpuDist.renderer = (gpuGraph as any).mRenderer
    gpuGraph.loadDatasource(
      new GeneratorDatasource({ nodeCount: NODE_COUNT, edgeCount: EDGE_COUNT, maxItemsPerNode: 50 })
    )

    return () => {
      ;(cpuGraph as any).destroy?.()
      cpuRef.current?.removeChild(cpuLabel)
      ;(gpuGraph as any).destroy?.()
      gpuRef.current?.removeChild(gpuLabel)
    }
  }, [])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', gap: '4px', background: '#111' }}>
      <div ref={cpuRef} style={{ flex: 1, height: '100%', position: 'relative' }} />
      <div ref={gpuRef} style={{ flex: 1, height: '100%', position: 'relative' }} />
    </div>
  )
}
