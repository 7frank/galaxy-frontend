function people_relation_strength(comID) 
	{
		document.getElementById('news_detail').style.display='none';
		document.getElementById('people_relation_strength').style.display='block';
		/*var req = Inint_AJAX();
		var str = Math.random();
		var str_url = "./assets/ajax/people/people_relation_strength.php?clearmemory="+str;
			req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								document.getElementById('people_relation_strength').innerHTML=req.responseText;
								document.getElementById('people_relation_strength').style.display='block';
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);*/
	}

function people_relation_strength_close() 
	{
		document.getElementById('people_relation_strength').style.display='none';
	}