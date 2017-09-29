/**
 * so what this currently does...
 * is it runs added methods at most once oer animation frame
 * and stops if the max computation time has passed
 * and waits for the next animation frame to continue
 * this way every method gets executed every now and then without totally blocking the renderer
 *
 * //TODO make it a singleton maybe .. currently it's only used in ForceGraphDistribution but if multiple instances are used they would have to manage cpu time between themselfs
 *
 */


export default class RoundRobin {

    /**
     *
     * @param maxMilliSecondsPerFrame determines the maximum amount of milli seconds functions are called within one requestAnimationFrame
     */
    constructor(maxMilliSecondsPerFrame = 100) {

        this.maxMilliSecondsPerFrame = maxMilliSecondsPerFrame;
        this.current = 0
        this.entries = []

        this.start();


    }

    start() {
        var that = this;
        requestAnimationFrame(function loop(time) {

            var startIndex = that.current

            function exec() {
                var fn = that.entries[that.current]
                if (typeof fn == "function")
                    fn()

                that.current++
                if (that.current >= that.entries.length) that.current = 0


                return startIndex != that.current
            }

            //TODO define a maximum time interval like 20ms that the queue runs until it waits for the next frame
            //also have a mechanism to prevent too fast animations for faster devices:-D

            while (exec()) {

                if (performance.now() - time > that.maxMilliSecondsPerFrame)
                    break;

            }

            requestAnimationFrame(loop);
        })
    }

    add(fn) {

        this.entries.push(fn)


    }


    remove(fn) {

        let index = this.entries.indexOf(fn);

        if (index > -1) {
            this.entries.splice(index, 1);
        }

    }


}