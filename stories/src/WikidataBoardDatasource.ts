import { Datasource, type DatasourceCallback } from "cluster-graph-3d";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const QUERY = (limit: number) => `
SELECT ?company1 ?company1Label ?company2 ?company2Label
       ?person ?personLabel ?industry1 ?industry1Label ?country1 ?country1Label
WHERE {
  ?company1 wdt:P3320 ?person .
  ?company2 wdt:P3320 ?person .
  FILTER(?company1 != ?company2)
  FILTER(STR(?company1) < STR(?company2))
  ?company1 wdt:P31 wd:Q6881511 .
  ?company1 wdt:P452 ?industry1 .
  ?company1 wdt:P17 ?country1 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT ${limit}
`;

export default class WikidataBoardDatasource extends Datasource {

    constructor({ limit = 400, minOverlap = 1 } = {}) {
        super();
        this.limit = limit;
        this.minOverlap = minOverlap;
    }

    load(onSuccess: DatasourceCallback, onError?: (err: Error) => void) {
        const query = QUERY(this.limit);
        const url = SPARQL_ENDPOINT + "?format=json&query=" + encodeURIComponent(query);

        fetch(url, {
            headers: { "Accept": "application/sparql-results+json" }
        })
            .then(r => {
                if (!r.ok) throw new Error("SPARQL request failed: " + r.status);
                return r.json();
            })
            .then(data => {
                const result = this._parse(data.results.bindings);
                onSuccess(result);
            })
            .catch(err => {
                console.error("WikidataBoardDatasource error:", err);
                if (onError) onError(err);
            });
    }

    _parse(bindings) {
        const companies = new Map();
        const edgeShared = new Map();

        for (const row of bindings) {
            const id1 = row.company1.value.split("/").pop();
            const id2 = row.company2.value.split("/").pop();
            const name1 = row.company1Label?.value ?? id1;
            const name2 = row.company2Label?.value ?? id2;
            const personName = row.personLabel?.value ?? "?";
            const industry = row.industry1Label?.value ?? "Other";
            const country = row.country1Label?.value ?? "Unknown";

            if (!companies.has(id1)) {
                companies.set(id1, { id: id1, name: name1, industry, group: country, info: "", _shared: [] });
            }
            if (!companies.has(id2)) {
                companies.set(id2, { id: id2, name: name2, industry: row.industry1Label?.value ?? "Other", group: row.country1Label?.value ?? "Unknown", info: "", _shared: [] });
            }

            const edgeKey = id1 < id2 ? `${id1}__${id2}` : `${id2}__${id1}`;
            if (!edgeShared.has(edgeKey)) edgeShared.set(edgeKey, { id1, id2, persons: [] });
            const edge = edgeShared.get(edgeKey);
            if (!edge.persons.includes(personName)) edge.persons.push(personName);
        }

        const nodes = {};
        for (const [id, node] of companies) {
            const { _shared, ...rest } = node;
            nodes[id] = rest;
        }

        const links = [];
        for (const [, edge] of edgeShared) {
            if (edge.persons.length < this.minOverlap) continue;

            links.push([edge.id1, edge.id2]);

            const shared = edge.persons.join(", ");
            if (nodes[edge.id1]) nodes[edge.id1].info = (nodes[edge.id1].info ? nodes[edge.id1].info + "; " : "") + shared;
            if (nodes[edge.id2]) nodes[edge.id2].info = (nodes[edge.id2].info ? nodes[edge.id2].info + "; " : "") + shared;
        }

        const industries = [...new Set(Object.values(nodes).map(n => n.industry))].sort();
        const topExpand = industries[0] ? { [industries[0]]: true } : {};

        return { nodes, links, expand: topExpand, hasCountryGroups: false };
    }
}
