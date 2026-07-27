import Papa from "papaparse"
import Datasource from "./Datasource"

export default class CsvDatasource extends Datasource {

    constructor(nodesUrl, edgesUrl) {
        super()
        this.nodesUrl = nodesUrl
        this.edgesUrl = edgesUrl
    }

    load(onSuccess) {
        var nodes = []
        var links = []
        var invalidLinks = 0

        function streamCSV(url, onRow) {
            return new Promise(function (resolve, reject) {
                Papa.parse(url, {
                    download: true,
                    header: true,
                    dynamicTyping: true,
                    step: onRow,
                    complete: resolve,
                    error: reject
                })
            })
        }

        var nodesPromise = streamCSV(this.nodesUrl, function (row) {
            if (row.errors.length > 0) return
            var r = row.data[0]
            nodes.push({
                id: r.id,
                name: r.name,
                group: r.country,
                industry: r.industry,
                sent: r.sent,
                price: r.price,
                itemCount: r.itemCount,
                ticker: r.ticker,
                color: 0x00ff00
            })
        })

        var linksPromise = streamCSV(this.edgesUrl, function (row) {
            if (row.errors.length > 0) return
            var r = row.data[0]
            if (!r.SourceID || !r.TargetID) { invalidLinks++; return }
            links.push({ source: "" + r.SourceID, target: "" + r.TargetID, strength: r['Relationship Strenght'] })
        })

        Promise.all([nodesPromise, linksPromise]).then(function () {
            var nodesById = {}
            nodes.forEach(function (n) { nodesById["" + n.id] = n })

            var validLinks = links.filter(function (l) { return l.source && l.target })

            onSuccess({
                nodes: nodesById,
                links: validLinks.map(function (l) { return [l.source, l.target] }),
                expand: { "United States": true },
                hasCountryGroups: true
            })
        })
    }

}
