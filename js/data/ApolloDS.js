import ApolloClient, {createBatchingNetworkInterface} from 'apollo-client';
import gql from 'graphql-tag';

export default
class ApolloDS {

    constructor(url) {


        this.connect(url)

    }

    connect(url="http://localhost:8088/graphql") {

        this.client = new ApolloClient({
            networkInterface: createBatchingNetworkInterface({
                uri: url,
                batchInterval: 10,
                opts: {
                    credentials: 'same-origin',
                },
            }),
        });





    }


    /*   example `
                 query TodoApp {
                   todos {
                     id
                     text
                     completed
                   }
                 }
             `
    */


    query(qry,onResult) {



        this.client.query({
            query: gql(qry),
        })
            .then(data => onResult(data))
            .catch(error => console.error(error));


    }


}