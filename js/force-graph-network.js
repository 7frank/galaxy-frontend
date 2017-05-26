//@see http://bl.ocks.org/GerHobbelt/3071239 for original 2d network implementation

//@author frank1147 https://gist.github.com/frank1147
 

 /**
 
 
 //TODO improve on hull rendering 
 
 */
 
function getGroup(n) { return n.group; }

// constructs the network to visualize
function network(data, prev, index, expand) {
  expand = expand || {};
  var gm = {},    // group map
      nm = {},    // node map
      lm = {},    // link map
      gn = {},    // previous group nodes
      gc = {},    // previous group centroids
      nodes = [], // output nodes
      links = []; // output links

  // process previous nodes for reuse or centroid calculation
  if (prev) {
    prev.nodes.forEach(function(n) {
      var i = index(n), o;
      if (n.size > 0) {
        gn[i] = n;
        n.size = 0;
      } else {
        o = gc[i] || (gc[i] = {x:0,y:0,count:0});
        o.x += n.x;
        o.y += n.y;
        o.count += 1;
      }
    });
  }

  // determine nodes
  for (var k=0; k<data.nodes.length; ++k) {
    var n = data.nodes[k],
        i = index(n),
        l = gm[i] || (gm[i]=gn[i]) || (gm[i]={group:i, size:0, nodes:[]});

    if (expand[i]) {
      // the node should be directly visible
      nm[n.id] = nodes.length;
      nodes.push(n);
      if (gn[i]) {
        // place new nodes at cluster location (plus jitter)
        n.x = gn[i].x + Math.random();
        n.y = gn[i].y + Math.random();
      }
    } else {
      // the node is part of a collapsed cluster
      if (l.size == 0) {
        // if new cluster, add to set and position at centroid of leaf nodes
        nm[i] = nodes.length;
        nodes.push(l);
        if (gc[i]) {
          l.x = gc[i].x / gc[i].count;
          l.y = gc[i].y / gc[i].count;
        }
      }
      l.nodes.push(n);
    }
  // always count group size as we also use it to tweak the force graph strengths/distances
    l.size += 1;
  n.group_data = l;
  
  /*
  Object.defineProperty(n, 'size', {
  get: function() { return this.group_data.size; },
  enumerable: true,
  configurable: true
	});
  */
  
  }

  for (i in gm) { gm[i].link_count = 0; }

  // determine links
  for (k=0; k<data.links.length; ++k) {

   var e = data.links[k];
   
 
   var  u = index(e.source),
        v = index(e.target);
		
  if (u != v) {
    gm[u].link_count++;
    gm[v].link_count++;
  }
  
    u = expand[u] ? nm[e.source.id] : nm[u];
    v = expand[v] ? nm[e.target.id] : nm[v];
    var i = (u<v ? u+"|"+v : v+"|"+u),
        l = lm[i] || (lm[i] = {source:u, target:v, size:0});
    l.size += 1;
  }
  for (i in lm) { links.push(lm[i]); }

  return {nodes: nodes, links: links};
}

//-------------------------------------
var generatedHulls={}
function updateHullsForExpandedGroups(allNodes,expand,scene,env)
{
	console.log("expand",expand)
	
	_.each(generatedHulls,function(hull,key){
		
		//TODO currently can't reuse previously generated convex hulls because original graph nodes are not used when updating
		
		//hull.frontside.visible=expand[key]
		//scene.add(hullParts.frontside)
		
	})
	
	var possibleNodes=allNodes.filter( (e) => !e.isGroupNode)
	
	_.each(expand,function(val,key){
		
	/*	if (generatedHulls[key])
		{
			//generatedHulls[key].frontside.visible=true
			return
		}*/
		
		
			//TODO remove some redundancy 
	var hullNodes=possibleNodes.filter( (e) => e.group==key);
	
	//if (hullNodes.length<4) return //QuickHull needs at least 4 nodes to compute hull
	
	hullParts=convexHullFromNodes(hullNodes);
	console.log("hullParts",hullParts)
	generatedHulls[key]=hullParts

	var usedSide=hullParts.backside//hullParts.frontside //hullParts.backside
	
	//TODO better usability
	env.domEvents.addEventListener(usedSide, "dblclick", function(e){	
		var grp=key
		
		console.log("collapse grp:",grp)
				env.expand[grp] = false;
				
				env.digest()
		
	}, false)	
	
	env.domEvents.addEventListener(usedSide, "mouseover", function(e){	
		
		e.target.material.opacity=0.1
		
	}, false)
		env.domEvents.addEventListener(usedSide, "mouseout", function(e){	
		
		e.target.material.opacity=0.03
		
	}, false)
	
	
	
	
	//scene.add(hullParts.backside)
	//scene.add(hullParts.frontside)
	scene.add(usedSide)

	
	})

}

function convexHullFromNodes(nodes){
	
	
	var vertices=nodes.map((e) => e._bubble.position )
	
		var meshMaterial =new THREE.MeshBasicMaterial({// new THREE.MeshLambertMaterial( {
					color: 0xffffff,
					opacity: 0.2,// 0.03,
					transparent: true,
					lights:false,
					wireframe:false,
					depthTest: false,
					depthWrite: false
				} );

	//mPoints=vertices
	//quickHull=new THREE.QuickHull().setFromPoints( points );
	//debugger
	
	//var meshGeometry = new THREE.ConvexBufferGeometry(vertices );
	var meshGeometry=new THREE.ConvexDynamicGeometry(vertices)
	

				backsideMesh = new THREE.Mesh( meshGeometry, meshMaterial );
				backsideMesh.material.side = THREE.BackSide; // back faces
				backsideMesh.renderOrder = 0;
			

				frontSideMesh = new THREE.Mesh( meshGeometry, meshMaterial.clone() );
				frontSideMesh.material.side = THREE.FrontSide; // front faces
				frontSideMesh.renderOrder = 1;
	

	//TODO add a switch to prevent updating if unnecessary
	//for example we could listen to the update method of the force layout
	
	frontSideMesh.onBeforeRender=function(){ this.geometry.verticesNeedUpdate=true }
	backsideMesh.onBeforeRender=function(){ this.geometry.verticesNeedUpdate=true }
	
			
				
	//add subdivisions for testing FIXME
	//debugger
	//var modifier=new THREE.SubdivisionModifier(2)
	//frontSideMesh.geometry=modifier.modify(frontSideMesh.geometry)
	
				
	
	return {frontside:frontSideMesh,backside:backsideMesh}
}



