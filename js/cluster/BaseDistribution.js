/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */


export default  class BaseDistribution
{
    constructor(){
        this.dimensions=1 //TODO
    }


    setNodes(nodes,onNodePosition)
    {
        let len= nodes.length

        let _len;
        if (this.dimensions==1)
            _len=len;
        if (this.dimensions==1)
            _len= len/Math.sqrt(len);
        if (this.dimensions==1)
            _len= len/Math.pow(len,1/3);


        let step=1/_len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)
        var i=0;
        var c=0;
        for (n of nodes)
        {
            let _vec3=  this.distribute(n, i,0,0);

            //TODO set value in particle cloud
            onNodePosition(_vec3,c)

            i+=step
            c++;
        }


    }

    distribute(node,dx,dy,dz){
        //TODO this should be called to distribute the elements of the country layer when finished
        //TODO also it will be usefull to add rotation as well in th future

        return new THREE.Vector3(dx,dy,0)
    }
}

