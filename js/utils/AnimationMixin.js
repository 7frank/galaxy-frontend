
export default
function AnimationMixin(origObject){
        if (!origObject instanceof THREE.Material) throw new Error("must be THREE.Material")


        origObject.animate= function( options={}, mDuration=400,onComplete) {
            var mTimeout;
            var that=this
            let tween = new TWEEN.Tween(this)
                .to(options, mDuration)
                .onComplete(function () {

                cancelAnimationFrame(mTimeout)
                if (typeof onComplete == "function")
                    onComplete()
            })
                .start();

            mTimeout = requestAnimationFrame(animate);

            function animate(time) {
                tween.update(time)
                mTimeout = requestAnimationFrame(animate);

            }

            return this;
        }

        return origObject

    }


