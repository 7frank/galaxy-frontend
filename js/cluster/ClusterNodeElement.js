/**
 * Created by Frank on 30.05.2017.
 */

//TODO this should be refactored to match the object structure better
// clusters.china.others => ClusterNodeArray.ClusterNodeElement.ClusterNodeLeaf

export default class ClusterNodeElement extends THREE.Object3D{
    constructor(children) {

        super()
        this.mClusters=children

        var that=this;
        var j=0;
        var clusterDistanceX=1050;
        var _len=Object.keys(this.mClusters).length
        _.each(this.mClusters,function(subObject,id) {


            // let _x=((j-(_len/2)))*clusterDistanceX

            var container=new THREE.Group()
            //   container.position.set(_x,0,0)


            //add sphere as hint for the cluster
            var geometry = new THREE.SphereGeometry(500, 8, 8 );
            var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,transparent:true,opacity:0.1} );
            var sphere = new THREE.Mesh( geometry, material );
            container.add( sphere );



            j++;

            var arr=Object.values(subObject)

            var nodeDistanceX=120;
            for (let i=0,len=arr.length;i<len;i++) {

                let el=arr[i];

                let _x=((i-(len/2)))*nodeDistanceX

                el.position.set(_x,-150,0)


                //add another sphere as hint for the leaf
                var geometry = new THREE.SphereGeometry(50, 16, 16 );
                var material = new THREE.MeshBasicMaterial( {color: 0xff0000,wireframe:true,transparent:true,opacity:0.1} );
                var sphere = new THREE.Mesh( geometry, material );
                el.add( sphere );



                container.add(el)


            }

            that.add(container)

        })

    }

    //TODO refactor
    setDistributionHandler(distribution)
    {

        var that=this;
        distribution.setNodes(this.children,function(vec,i){
            let n= that.children[i];

            n.position.copy(vec)

            // that.mParticles.updateNodePosition(i)

        });



    }


}