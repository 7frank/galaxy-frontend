/**
 * Base class for graph data sources.
 *
 * Subclasses must implement load(onSuccess).
 * onSuccess receives: { nodes, links, expand, hasCountryGroups }
 *
 * nodes: object keyed by id, each value: { id, name, group, industry, sent, price, itemCount, ticker, color }
 * links: array of [sourceId, targetId]
 * expand: object of group names to pre-expand, e.g. { "United States": true }
 * hasCountryGroups: boolean
 */
export default class Datasource {

    load(onSuccess) {
        throw new Error("Datasource.load() must be implemented by subclass")
    }

}
