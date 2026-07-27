import NodeElement, { type NodeElementData } from "./NodeElement"
import { extendGraphElements } from "./GraphElementExtension"
import type { ArrowEdge } from "./edges/ArrowEdge"
import type View3D from "../view/View3D"
import _ from "lodash";

interface RawGraphData {
    nodes: Record<string, NodeElementData>
    links: [string, string][]
}

export default class GraphData {

    private mGraphData: RawGraphData
    private mNodeElements: Record<string, NodeElement> = {}

    constructor(graphData: unknown) {
        this.mGraphData = graphData as RawGraphData;
    }

    private buildNodes(view: View3D): NodeElement[] {
        const env = {
            nameAccessor: (n: NodeElementData) => (n.name as string | undefined) ?? '',
            colorAccessor: (n: NodeElementData) => (n.color as number | undefined) ?? 0xffffff,
            valAccessor: (n: NodeElementData) => (n.val as number | undefined) ?? 0,
            sizeAccessor: (n: NodeElementData) => (n.itemCount as number | undefined) ?? 0,
            nodeRelSize: 4,
            domEvents: view.mDomEvents
        };

        const elements: Record<string, NodeElement> = {};

        _.each(this.mGraphData.nodes, (data, id) => {
            const node = new NodeElement(view, env, data);
            node._id = id;
            node.x = 0; node.y = 0; node.z = 0;
            const { id: _id, ...rest } = data as NodeElementData & { id?: unknown };
            for (const key of Object.keys(rest)) {
                if (!(key in node)) (node as unknown as Record<string, unknown>)[key] = (rest as Record<string, unknown>)[key];
            }
            elements[id] = node;
        });

        this.mNodeElements = elements;
        return Object.values(elements);
    }

    private buildLinks(): ArrowEdge[] {
        return this.mGraphData.links
            .map(link => ({
                source: this.mNodeElements[link[0]] as unknown as ArrowEdge['source'],
                target: this.mNodeElements[link[1]] as unknown as ArrowEdge['target']
            }))
            .filter(l => l.source && l.target);
    }

    createClusterNodesAndEdges(view: View3D): { nodes: NodeElement[]; edges: ArrowEdge[] } | undefined {
        const nodes = this.buildNodes(view);
        if (!nodes.length) return undefined;

        const edges = this.buildLinks();

        extendGraphElements(nodes as unknown as Parameters<typeof extendGraphElements>[0], edges, {
            nameAccessor: (n) => (n as unknown as NodeElement).name ?? '',
            colorAccessor: (n) => (n as unknown as NodeElement).color ?? 0xffffff,
            valAccessor: (n) => (n as unknown as NodeElement).size ?? 0,
            sizeAccessor: (n) => (n as unknown as NodeElement).size ?? 0,
            nodeRelSize: 4,
            domEvents: view.mDomEvents,
            selectionManager: (view as unknown as { selectionManager?: import("./NodeSelectionManager").default }).selectionManager
        });

        return { nodes, edges };
    }
}
