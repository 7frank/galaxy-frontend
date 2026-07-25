export default class AnimationFrameBasedScheduler {

    maxMilliSecondsPerFrame: number
    current: number
    entries: Array<() => void>

    constructor(maxMilliSecondsPerFrame: number = 100) {
        this.maxMilliSecondsPerFrame = maxMilliSecondsPerFrame;
        this.current = 0;
        this.entries = [];
        this.start();
    }

    private start(): void {
        const that = this;
        requestAnimationFrame(function loop(time: number) {
            const startIndex = that.current;

            function exec(): boolean {
                const fn = that.entries[that.current];
                if (typeof fn == "function")
                    fn();

                that.current++;
                if (that.current >= that.entries.length) that.current = 0;

                return startIndex != that.current;
            }

            while (exec()) {
                if (performance.now() - time > that.maxMilliSecondsPerFrame)
                    break;
            }

            requestAnimationFrame(loop);
        });
    }

    add(fn: () => void): this {
        this.entries.push(fn);
        return this;
    }

    remove(fn: () => void): this {
        const index = this.entries.indexOf(fn);
        if (index > -1) {
            this.entries.splice(index, 1);
        }
        return this;
    }
}
