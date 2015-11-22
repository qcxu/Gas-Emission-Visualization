d3.csv("data/Country_GHG_Emissions.csv",
	function(d) {
		return {
			country: d.Country,
			year: d.Year,
			gas: {
				total_ex: +d.Total_exclude,
				F: +d.Total_F,
				CO_in: +d.Total_CO2,
				CH_in: +d.Total_CH4,
				NO_in: +d.Total_N2O
			},
			sector: {
				energy: +d.Energy,
				ip: +d.Industrial_Processes,
				agri: +d.Agriculture,
				waste: +d.Waste,
				lucf: +d.LUCF,
				bunker: +d.Bunker_Fuels,	
			},
		};
  	},
   	
   	function(error, data) {
       	if (error != null) {
	    	alert("Error!");
       	}
       	else {
       	console.log("data");	
		console.log(data);
		console.log(data.length);	
		d3.csv("data/population.csv", function(m) {
			return m;
		},
			function(error, pop) {
				if (error != null) {
					alert("Error!");
				} else {
			console.log("pop");	
			console.log(pop);


			data.forEach(function(d,i) {
				var idx = -1;
				var gas, sector
				for (var i=0;i<pop.length;i++) {
					if (pop[i]["Country"] == d.country) {
						idx = i;
						for (var key in d.gas) {
							d.gas[key] = d.gas[key]/pop[i][d.year]*10e7;
						}
						for (var key in d.sector) {
							d.sector[key] = d.sector[key]/pop[i][d.year]*10e7;
						}
					} 
				}
				if (idx == -1) {
					console.log("not found: " + d.country);
					data.splice(i,1);
					return;
				}

			});
			console.log(data.length);
		}
	});
	}
});