

function getParticleShaderMaterial()
{
	var vertexShader=`
			
			attribute float size;
			attribute vec3 customColor;
			varying vec3 vColor;

			void main() {

				vColor = customColor;

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

				gl_Position = projectionMatrix * mvPosition;

			}
	`;
	
	
	var fragmentShader=`
			uniform vec3 color;
			uniform sampler2D texture;

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( color * vColor, 1.0 );

				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
			}
	`;
	
	
	 /*  var attributes = {

                size:        { type: 'f', value: null },
                customColor: { type: 'c', value: null },
                //destination:        { type: 'f', value: null },

            };*/

            var uniforms = {

                color:     { type: "c", value: new THREE.Color( 0xffffff ) },
                texture:   { type: "t", value:  new THREE.TextureLoader().load( "img/block.png" ) }

            };
	
	
	    var shaderMaterial = new THREE.ShaderMaterial( {

                uniforms:       uniforms,
               // attributes:     attributes,
                vertexShader:   vertexShader,
                fragmentShader: fragmentShader,

                //blending:       THREE.AdditiveBlending,
                //depthTest:      false,
                //transparent:    true

            });
	

	return 	shaderMaterial
	
}
	

	
	//{groupKeyName:"group_data",groupValueName:"group_data",nodeKey:'size'}
		function createParticleSystemForNodes(nodes,options)	
		{
			
				options=_.extend({groupKeyName:"isGroupNode",groupValueName:"nodes",nodeKey:'itemCount'},options)
			
			
			function getNodeParticleCount(node)
				{
					
					if (node[options.groupKeyName])
						return _.sumBy(node[options.groupValueName], options.nodeKey)
					else return node[options.nodeKey] ||0
						
				}
			
			
			//TODO demo purpose
			if (typeof options.npc=="function")
			getNodeParticleCount=options.npc
		

			var shaderMaterial=getParticleShaderMaterial()
			var particlesPerNode=nodes.map( (n) => getNodeParticleCount(n) )
			//console.log("particles per node:",particlesPerNode)
			 var particles =_.sum( particlesPerNode )
		

            var positions = new Float32Array( particles * 3 );
            var destination = new Float32Array( particles * 3 );
            var values_color = new Float32Array( particles * 3 );
            var values_size = new Float32Array( particles );
            var   geometry = new THREE.BufferGeometry();
			
			var v=0
            for (n in nodes) {
    
			let count=particlesPerNode[n]
				
				for (var i=0;i<count;i++)
				{
				
						
						var color=(typeof nodes[i].color=="number")?new THREE.Color(nodes[i].color):new THREE.Color(0xffff00);

					
						  
							values_size[ v ] = 2.5;
							values_color[ v * 3 + 0 ] = color.r*1.1+Math.random()*0.15;
							values_color[ v * 3 + 1 ] = color.g*1.1+Math.random()*0.15;
							values_color[ v * 3 + 2 ] = color.b*1.1+Math.random()*0.15;
							destination[ v * 3 + 0 ] = 1;
							destination[ v * 3 + 1 ] = 2;
							destination[ v * 3 + 2 ] = 5000;

							positions[ v * 3 + 0 ] = 1;
							positions[ v * 3 + 1 ] = 2;
							positions[ v * 3 + 2 ] = 5000;
							
				v++			
				}           
            }

            geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
            geometry.addAttribute( 'customColor', new THREE.BufferAttribute( values_color, 3 ) );
            geometry.addAttribute( 'size', new THREE.BufferAttribute( values_size, 1 ) );

           var  particleSystem = new THREE.Points( geometry, shaderMaterial );
            particleSystem.frustrumCulled=true;
            
		
		
		function updateColors()
			{
				
			
		
			
			
			var v=0
            for (n in nodes) {
			var node=nodes[n]
			let count=particlesPerNode[n]
			
	
				for (var i=0;i<count;i++)
				{
					var color=(typeof nodes[i].color=="number")?new THREE.Color(nodes[i].color):new THREE.Color(0xffff00);
				
							var rnd=Math.random()*0.1
							values_color[ v * 3 + 0 ] = color.r*1.1+rnd;
							values_color[ v * 3 + 1 ] = color.g*1.1+rnd;
							values_color[ v * 3 + 2 ] = color.b*1.1+rnd;
					
							
				v++			
				}           
            }
			

			var colors=geometry.attributes.customColor;colors.needsUpdate=true
				
			}
		

		//-----------------
		var increment=3	
		
			function updateDestinations(inc=5)
			{
				increment=inc; 
				
				/* for (var v = 0; v < nodes.length; v++) {
					 
				destination[ v * 3 + 0 ] =  nodes[v].x+Math.random()-0.5;
                destination[ v * 3 + 1 ] =  nodes[v].y+Math.random()-0.5;
                destination[ v * 3 + 2 ] =  nodes[v].z+Math.random()-0.5;
					 
				 }*/
				
			var v=0
            for (n in nodes) {
			var node=nodes[n]
			let count=particlesPerNode[n]
			
			var scale=5
			
				for (var i=0;i<count;i++)
				{
				
				let x=node.x+(Math.random()-0.5)*scale, y=node.y+(Math.random()-0.5)*scale, z= node.z+(Math.random()-0.5)*scale
				
				destination[ v * 3 + 0 ] =  x
                destination[ v * 3 + 1 ] =  y
                destination[ v * 3 + 2 ] =  z
					
							
				v++			
				}           
            }
				
				
				
			}
					
//------------------

var percentage=1

var particlesPlaced=0

var animationID;
/*
var fps = 1;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;
  
*/


function animate(time) {


  //  now = Date.now();
  // delta = now - then;
 
     
        if(particleSystem.parent){

	 //if (delta > interval)
     //  updateDestinations();


        var positions = geometry.attributes.position.array;
		 var customColors = geometry.attributes.customColor.array;
        //var currentColor = new THREE.Color();
        error=0.2;
        var a=false,b=false,c=false,fin=true;
        if(increment>0){
			
		var pct=particles/percentage;
		
        for(var v=0;v<pct;v++){
            a=false,b=false,c=false;
            //easing=Math.sin((0.55+(v%100)/100*0.4)*Math.PI);
			
			
			/*var color=new THREE.Color( nodes[v].color||0xffff00);
			
			customColors[ v * 3 + 0 ]=color.r
			customColors[ v * 3 + 1 ]=color.g
			customColors[ v * 3 + 2 ]=color.b
			*/
			
           var easing=0.2+(v%1000)/1000;
		   var inc_easing=increment*easing
            if(Math.abs(positions[ v * 3 + 0 ]-destination[ v * 3 + 0 ])>error)positions[ v * 3 + 0 ] += (destination[ v * 3 + 0 ]-positions[ v * 3 + 0 ])/inc_easing;
            else{
                positions[ v * 3 + 0 ]=destination[ v * 3 + 0 ];
                a=true;
            }
            if(Math.abs(positions[ v * 3 + 1 ]-destination[ v * 3 + 1 ])>error)positions[ v * 3 + 1 ] += (destination[ v * 3 + 1 ]-positions[ v * 3 + 1 ])/inc_easing;
            else{
                positions[ v * 3 + 1 ]=destination[ v * 3 + 1 ];
                b=true;
            }
            if(Math.abs(positions[ v * 3 + 2 ]-destination[ v * 3 + 2 ])>error)positions[ v * 3 + 2 ] += (destination[ v * 3 + 2 ]-positions[ v * 3 + 2 ])/inc_easing;
            else{
                positions[ v * 3 + 2 ]=destination[ v * 3 + 2 ];
                c=true;
            }
            if(a &&b &&c){
                particlesPlaced++;
            }else{fin=false;}
        }

        if(fin){

            increment=0;

            for(var v=0;v<particles;v++){
                positions[ v * 3 + 0 ]=destination[ v * 3 + 0 ];
                positions[ v * 3 + 1 ]=destination[ v * 3 + 1 ];
                positions[ v * 3 + 2 ]=destination[ v * 3 + 2 ];
            }

        }

            //animateOverlay(particlesPlaced/particles);

        }else{

           // animateOverlay(0);
        }

        geometry.attributes.position.needsUpdate = true;
		//geometry.attributes.customColor.needsUpdate = true;
		
        //animatePointSize(false);
	   }

     
	 animationID=	requestAnimationFrame(animate);

	//  then = now - (delta % interval);
	 
	}

		
			
            
			return {
						destination:destination,
						pointCloud:particleSystem,
						particleCount:particles,
						nodes:nodes,
						updateDestinations:updateDestinations,
						updateColors:updateColors,
						start:function(){
							if (!particleSystem) {
								
								console.error("already disposed")
								return
							}
						
							updateDestinations();
							 
							//for now just have a huge bounding volume
							particleSystem.geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3,50000);
						
							
							animationID=requestAnimationFrame(animate);

							},
						stop:function(){  cancelAnimationFrame(animationID) },
						remove:function(){
							this.stop()
							
								if (particleSystem.geometry)
								particleSystem.geometry.dispose();
								if (particleSystem.material)
									particleSystem.material.dispose(); 
								
								delete (particleSystem);

						

							if(particleSystem.parent)
							particleSystem.parent.remove(particleSystem)
							
						}
				}
			
		
			
		}
	