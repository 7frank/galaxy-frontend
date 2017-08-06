/**
 * a simple factory to generate options to build different clusters
 *
 *
 */

import BaseDistribution from "./distributions/BaseDistribution"
import BaseVolume from "./hull/BaseVolume"

/**
 * TODO as of yet not a factory
 *
 *
 */


class ClusterSpeccFacade {

    constructor() {

        this.events= {};
        this.options={};
    }


    on(eventName, handler) {

        if ( this.events[eventName] )  throw new Error("currently only one handler per event");

        this.events[eventName] = handler
        return this;
    }

    setHullVolume(clazz){

        if (! clazz == BaseVolume || !BaseVolume.isPrototypeOf(clazz)) throw new TypeError();

        this.options.hull = clazz
        return this;
    }



    setDistribution(distribution){

        if (! distribution instanceof BaseDistribution) throw new TypeError();

        this.distribution=distribution;

        return this;
    }



    setGenerator(generatorFunction,minClusterSize)
    {
        if (typeof generatorFunction!="function") throw new TypeError("must be a function")


        this.generator=distribution;

        if (typeof minClusterSize =="number")
            this.options.generator=distribution;


    }


    setExpanded(){
        this.expanded=true;

        return this;
    }
    setCollapsed(){
        this.expanded=false;
        return this;
    }

    setExpandedFunction(fn){
        if (typeof fn!="function") throw new TypeError("must be a function")

        this.expanded=fn;

        return this;
    }



}