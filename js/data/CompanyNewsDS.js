import Datasource from "./Datasource"

export default class CompanyNewsDS extends Datasource {

    constructor(url) {
        super(url);




    }


    onNewsReceived(callback) {
        //TODO work in progress .. we might not need such convenience functions
        this.mSocket.on('read news', callback)

    }


}