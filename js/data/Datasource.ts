export interface DatasourceNode {
    id: string
    name?: string
    color?: number
    [key: string]: unknown
}

export interface DatasourceResult {
    nodes: Record<string, DatasourceNode>
    links: [string, string][]
    expand?: Record<string, boolean>
    hasCountryGroups?: boolean
}

export type DatasourceCallback = (data: DatasourceResult) => void

export default class Datasource {
    load(onSuccess: DatasourceCallback): void {
        throw new Error("Datasource.load() must be implemented by subclass")
    }
}
