

//calculates a distance bwetween countries by the given metric
// test implementation uses phycical distances which is not applicable for the client (no charged fees :-))
function CountryDistanceMetric(){
	
	var countryDistances={}
	
	return new Promise(function(ok,fail){
		
		Papa.parse("assets/distances.csv", {
					download: true,
					//worker: true,
					//header: true,
					dynamicTyping: true,
					step: function(row) {
						
						var entry=row.data[0]
						
						if (row.errors.length>0|| entry.length!=3) return
						

						var e1=entry[0].trim()
						var e2=entry[1].trim()
					countryDistances[e1+e2]=entry[2]	
					countryDistances[e2+e1]=entry[2]	
					},
					complete: function() {
					
					ok({getDistance:function(c1,c2,_default=1000)
					{
						var d=countryDistances[c1+c2]
						return d||_default
						},distances:countryDistances})
					
					}
				});
		
	
	})
	
}