/**
 *
 * The following code declares a scheduler that provides some basic cpu load management.
 * It can be used to throttle performance intensive computations or  visual effects.
 *
 * The goal is, to have an upper limit of available time per time slice to execute methods.
 * For that, the scheduler uses animation frames to synchronise with the refresh rate of the browser.
 * This prevents unnecessary function execution as well as some basic throttling and
 * every method gets at least executed every now and then without others totally blocking the browser / WebGL-renderer.
 * For slower devices less animation frames should be fired, because the rendering of a frame takes longer.
 * Therefor the scheduler executes less functions per frame.
 *
 * Note:
 *      - You can use this to decrease the performance impact of functions executed within this context,
 *          but this might result in a different user experience for slower devices compared to faster ones,
 *          where each previously added function gets called - at most - once per frame.
 *
 *      - Don't use this for timing-dependent computations as user experience may differ.
 *
 */

export default class AnimationFrameBasedScheduler {

    /**
     *
     * @param maxMilliSecondsPerFrame determines the maximum amount of milliseconds pass,
     *          while functions are called within one animation frame. {@link window.requestAnimationFrame}
     *        The scheduler tries to execute each method in the queue at most once per frame,
     *          but if the execution time exceeds 'maxMilliSecondsPerFrame' further computations
     *          are delayed until the next animation frame is triggered.
     */

    constructor(maxMilliSecondsPerFrame = 100) {

        this.maxMilliSecondsPerFrame = maxMilliSecondsPerFrame;
        this.current = 0;
        this.entries = [];

        this.start();

    }


    /**
     * Starts the scheduler. Methods added by using {@link add} will be called per animation frame.
     *
     * @private
     *
     */

    start() {
        var that = this;
        requestAnimationFrame(function loop(time) {

            var startIndex = that.current;


            //select and execute the next entry in the set of managed functions that ought to be called.
            function exec() {
                var fn = that.entries[that.current];
                if (typeof fn == "function")
                    fn();

                that.current++;
                if (that.current >= that.entries.length) that.current = 0;


                return startIndex != that.current
            }

            //execute functions until the scheduler exceeds its frame time limit
            while (exec()) {

                if (performance.now() - time > that.maxMilliSecondsPerFrame)
                    break;

            }

            //wait for the next animation frame and continue looping through entries.
            requestAnimationFrame(loop);
        })
    }

    /**
     * Add a function that the scheduler should call - at most - once per frame.
     *
     * @param fn instanceof function
     * @returns {AnimationFrameBasedScheduler}
     */

    add(fn) {
        this.entries.push(fn)

        return this;
    }


    /**
     * Remove a function previously added using {@link add}
     *
     * @param fn ... the function that shall be removed.
     * @returns {AnimationFrameBasedScheduler}
     */

    remove(fn) {

        let index = this.entries.indexOf(fn);

        if (index > -1) {
            this.entries.splice(index, 1);
        }

        return this;
    }


}