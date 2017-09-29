/**
 * what we want is a simple baisc abstraction layer to retrieve data .. nothing fancy just some structure for different services and probably topics
 *
 *
 *
 */

import io from 'socket.io-client'

export default class Datasource {

    constructor(serviceURL) {

        //TODO add some listeners to retrieve data about current stock prices and news

        // Connect to our node/websockets server
        var socket = this.mSocket = io.connect(serviceURL);


    }


}