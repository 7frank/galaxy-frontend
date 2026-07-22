import ApolloDS from "./ApolloDS"
import Datasource from "./Datasource"

const DEFAULT_URL = "http://localhost:8088/graphql"

const DEFAULT_QUERY = `
  query GraphData {
    nodes {
      id
      name
      country
      industry
      ticker
      sentiment
      price
      itemCount
    }
    edges {
      source
      target
      strength
    }
  }
`

export default class GraphQLDatasource extends Datasource {

    constructor(url = DEFAULT_URL, query = DEFAULT_QUERY) {
        super()
        this.client = new ApolloDS(url)
        this.query = query
    }

    load(onSuccess) {
        this.client.query(this.query, function (response) {
            var data = response.data

            var nodesById = {}
            data.nodes.forEach(function (r) {
                nodesById["" + r.id] = {
                    id: "" + r.id,
                    name: r.name,
                    group: r.country,
                    industry: r.industry,
                    ticker: r.ticker,
                    sent: r.sentiment,
                    price: r.price,
                    itemCount: r.itemCount,
                    color: 0x0000ff
                }
            })

            var links = []
            data.edges.forEach(function (edge) {
                if (!edge.source || !edge.target) return
                links.push(["" + edge.source, "" + edge.target])
            })

            onSuccess({
                nodes: nodesById,
                links: links,
                expand: { "United States": true },
                hasCountryGroups: true
            })
        })
    }

}
