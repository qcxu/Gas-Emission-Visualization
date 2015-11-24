var width_p = 250,
    height_p = 180,
    radius = Math.min(width_p, height_p) / 3;
var mode = "gdp";  
var data, original_data, gdp_data,
	gas_data_with_minor,
	sector_for_line,
	sector_name_list,
	gas_line_minor,
	sector_line,
	gas_min, gas_max, sector_min, sector_max,
	line_gas, line_sector, lineG_gas, lineG_sector;
var height_l = 200;
var width_l = 300;
var margin_l = 60;

var color_line = d3.scale.category10();
var color_line2 = d3.scale.category10();
var gas_list = ["total_ex", "CO_in", "minor", "F", "CH_in", "NO_in"];
// var color = d3.scale.ordinal()
// 	.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);
var color = d3.scale.category10();
color.domain(["total_ex", "CO_in", "minor", "F", "CH_in", "NO_in"]);
console.log(color("total_ex"));
var color1 = d3.scale.ordinal()
	.range(["#000000", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c"]);
	color1.domain(["energy", "ip", "agri", "waste", "lucf", "bunker"]);

var start_yr = 1990;
var end_yr = 2012;
var gas_list_minor = ["total_ex", "CO_in", "minor"];

var cty = "All Countries";

var legendRectSize = 6;
var legendSpacing = 4;




function changeMode(modeObj) {
	mode = modeObj;
	d3.select("#mapArea svg").remove();
	drawMap(mode);
	console.log("changed");
	draw_line_pie(cty);
}

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
	       	//console.log("data");	
			//console.log(data);	
			original_data = JSON.parse(JSON.stringify(data));
			d3.csv("data/gdp.csv", function(m) {
				return m;
			}, function(error, pop) {
				if (error != null) {
					alert("Error!");
				} else {
					//console.log("pop");	
					//console.log(pop);

					gdp_data = JSON.parse(JSON.stringify(data));
					gdp_data.forEach(function(d,i) {
						var idx = -1;
						var gas, sector
						for (var j=0;j<pop.length;j++) {
							if (pop[j]["Country"] == d.country) {
								idx = j;
								
							} 
						}
						// console.log("data " + d.country);
						
						if (idx == -1) {
							//console.log("not found: " + d.country);
							d.country="";
							return;
						} else if (pop[idx][d.year] != "") {
							for (var key in d.gas) {
									d.gas[key] = d.gas[key]/pop[idx][d.year]*10e10;
								}
								for (var key in d.sector) {
									d.sector[key] = d.sector[key]/pop[idx][d.year]*10e10;
								}
								
							} 

					});
					//console.log(data.length);
					gdp_data = gdp_data.filter(function(d) {
						return d.country != "";
					})
					//console.log("gdp data");
					//console.log(gdp_data);

					drawMap(mode);	
					draw_init_line_pie();

					var legend = d3.select("#line_gas").selectAll('.legend')
					  .data(gas_list)
					  .enter()
					  .append('g')
					  .attr('class', 'legend')
					  .attr('transform', function(d, i) {
					    var height = legendRectSize + legendSpacing;
					    var offset =  color.domain().length / 2;
					    var horz = 2 * legendRectSize+200;
					    var vert = i * height ;
					    return 'translate(' + horz + ',' + vert + ')';
					  });
					
					  legend.append('rect')
					  .attr('width', legendRectSize)
					  .attr('height', legendRectSize)
					  .style('fill', color)
					  .style('stroke', color);

					  legend.append('text')
					  .attr('x', legendRectSize + legendSpacing)
					  .attr('y', legendRectSize - legendSpacing)
					  .text(function(d) { 
					  	console.log(d);
					  	return d; });

				}
			});
		}
	}
); // Read data ends
			


///////////////////////////////////////////////////////////////////////
function drawMap(mode){
	if (mode == "gdp") {
		data = gdp_data;
	} else {
		data = original_data;
	}
	//Data for HeatMap
	var map_data = data.map(function(d) {
		var map_obj = {country: d.country, year: d.year, emission: d.gas.total_ex}
		return map_obj;
	});			

	var width = 750,
		height = 800;
	
	var projection = d3.geo.mercator()
		.scale((width + 1) / 2 / Math.PI)
		.translate([width / 2, height / 2])
			
	var filtered_map_data = map_data.filter(function(d){return d.year == '2012'});
	var fmd = {};
	for(var i in filtered_map_data){
		fmd[filtered_map_data[i].country] = +filtered_map_data[i].emission;
	}
	//array to find the max emission level that can be used in the range for mapping colors
	var ranges = []
	for(var i in filtered_map_data){
		ranges.push(+filtered_map_data[i].emission);
	};
	//function to fill the map with colors
	var heatmap = d3.scale.linear()
		.domain([d3.min(ranges),Math.log(d3.max(ranges))])
		.interpolate(d3.interpolateRgb)
		.range(["#ffffff","#073f07"])
	
	var svg = d3.select("#mapArea").append("svg")
		.attr("width", width-10)
		.attr("height", height-230);

	var path = d3.geo.path()
		.projection(projection);

	var g = svg.append("g");
			
	// load and display the World
	d3.json("data/world-110m2.json", function(error, topology) {
		//Load CountryCode-Name data 
		d3.json("data/CountryCode.json", function(error, data){
		
		var codes = {};
		for(var i in data){
			codes[+data[i].code] = data[i].name;
		}
			
		g.selectAll("path")
		  .data(topojson.feature(topology, topology.objects.countries).features)
		.enter()
		  .append("path")
		  .attr("d", path)
		  .attr("id", function(d){return d.id})
		  .style("fill", function(d) {return heatmap(Math.log(fmd[codes[d.id]])); })
		  .text(function(d){return d.id})
		  .on("click", function(d){draw_line_pie(codes[d.id])});
		});

	});	
	
}
/* Draw map function ends */

/* Draw initial pie and line chart starts */
function draw_init_line_pie() {
	// Preparation for line chart
	

	//console.log("all");
	//console.log(data);

	var gas_total = d3.nest()
			  .key(function(d) { return d.year;})
			  .rollup(function(d) { 
			   return {
			   		CO_in: d3.sum(d, function(g) {return g.gas.CO_in; }),
			   		total_ex: d3.sum(d, function(g) {return g.gas.total_ex; }),
			   		F: d3.sum(d, function(g) {return g.gas.F; }), 
			   		CH_in: d3.sum(d, function(g) {return g.gas.CH_in; }),
			   		NO_in: d3.sum(d, function(g) {return g.gas.NO_in; })
			   }
			  }).entries(data);
	console.log("gas total:");
	console.log(gas_total);

	var sector_total = d3.nest()
			  .key(function(d) { return d.year;})
			  .rollup(function(d) { 
			   return {	
			   		energy: d3.sum(d, function(g) {return g.sector.energy; }),
			   		ip: d3.sum(d, function(g) {return g.sector.ip; }),
			   		agri: d3.sum(d, function(g) {return g.sector.agri; }), 
			   		waste: d3.sum(d, function(g) {return g.sector.waste; }),
			   		lucf: d3.sum(d, function(g) {return g.sector.lucf; }),
			   		bunker: d3.sum(d, function(g) {return g.sector.bunker; })
			   }
			  }).entries(data);
	//console.log(sector_total);

	gas_data_with_minor = gas_total.map(function(d) {
		return {
			total_ex: d.values.total_ex,
			CO_in: d.values.CO_in,
			minor: d.values.CH_in + d.values.F + d.values.NO_in,
			year: d.key
		}
	})
	//console.log("gas_data_with_minor");
	//console.log(gas_data_with_minor);

	sector_for_line = sector_total.map(function(d) {
		return {
			energy: d.values.energy,
			ip: d.values.ip,
			agri: d.values.agri,
			waste: d.values.waste,
			lucf: d.values.lucf,
			bunker: d.values.bunker,
			year: d.key
		}
	})
	//console.log("sector_data");
	//console.log(sector_for_line);

	gas_min = d3.min(gas_data_with_minor, function(d) {return d3.min([d.CO_in, d.total_ex, d.minor])});;
	gas_max = d3.max(gas_data_with_minor, function(d) {return d3.max([d.CO_in, d.total_ex, d.minor])});

	sector_min = d3.min(sector_for_line, function(d) {return d3.min([d.energy, d.ip, d.agri, d.waste, d.lucf,
																		d.bunker])});;
	sector_max = d3.max(sector_for_line, function(d) {return d3.max([d.energy, d.ip, d.agri, d.waste, d.lucf,
																		d.bunker])});

	
	sector_name_list = d3.keys(sector_for_line[0]).filter(function(key) { return key !== "year"; });

	gas_line_minor  = gas_list_minor.map(function(type) {
	    return {
	      	type: type,
	      	values: gas_data_with_minor.map(function(d) {
	        	return {year: d.year, emission: +d[type]};
	      	})
	    };
	});

	sector_line  = sector_name_list.map(function(type) {
	    return {
	      	type: type,
	      	values: sector_for_line.map(function(d) {
	        	return {year: d.year, emission: +d[type]};
	      	})
	    };
	});

	//console.log("sector_line:");
	//console.log(sector_line);

	line_gas = generateAxis(gas_max, gas_min, "Gas Emission by Gas Type", "#line_gas");
	line_sector = generateAxis(sector_max, sector_min, "Gas Emission by Sector", "#line_sector");

	

	lineG_gas = d3.select("#line_gas").selectAll('.gas_line')
		.data(gas_line_minor)
		.enter()
		.append("g")
		.attr("class", "gas_line");

	lineG_gas.append("path")
		.attr("class", "line")
		.attr("id", function(d) {return d.type;})
		.attr("clip-path", "url(#clip)")
		.attr("fill","none")
		.attr("stroke", function(d) { return color(d.type); })
		.attr("stroke-width", 1.5)
		//.duration(750)
		.attr("d", function(d) {return line_gas.line(d.values);});

	lineG_sector = d3.select("#line_sector").selectAll('.sector_line')
		.data(sector_line)
		.enter()
		.append("g")
		.attr("class", "sector_line");

	lineG_sector.append("path")
		.attr("class", "line")
		.attr("id", function(d) {return d.type;})
		.attr("clip-path", "url(#clip)")
		.attr("fill","none")
		.attr("stroke", function(d) { return color1(d.type); })
		.attr("stroke-width", 1.5)
		//.duration(750)
		.attr("d", function(d) {return line_sector.line(d.values);});
} // Draw init pie and line chart ends
		
			
////////////////////////////////////////////////////////////////////////			
// Get a specific country
function draw_line_pie(country){
	/* Data Processing */
	cty = country;
	// Gas info nested by country

	// Map only gas info
	var gas_data = data.map(function(d) {
		var gas_obj = d.gas;
		gas_obj.country = d.country;
		gas_obj.year = d.year;
		return gas_obj;
	});
	//console.log(gas_data);

	// Map only sector info
	var sector_data = data.map(function(d) {
		var sector_obj = d.sector;
		sector_obj.country = d.country;
		sector_obj.year = d.year;
		return sector_obj;
	});

	var nested_gas_data = d3.nest()
		.key(function(d) {return d.country;})
   			.sortKeys(d3.ascending)
		.entries(gas_data);
	
    
	// Sector info nested by country
	var nested_sector_data = d3.nest()
		.key(function(d) {return d.country;})
   			.sortKeys(d3.ascending)
		.entries(sector_data);
	//console.log(nested_sector_data);

	var filtered_gas_data = nested_gas_data.filter(function(d) {return d.key == cty});
	var filtered_sector_data = nested_sector_data.filter(function(d) {return d.key == cty});
	//console.log("filtered_sector_data");
	//console.log(filtered_sector_data);
	
	//console.log(sector_data);
	var gas_name_list = d3.keys(gas_data[0]).filter(function(key) { return key !== "year" && key !== "country" && key != "total_ex"; });

	var gas_for_line = gas_name_list.map(function(type) {
		return {
			type: type,
			values: filtered_gas_data[0].values.map(function(d) {
				return {year: d.year, emission: +d[type]};
			})
		};
	});
	//console.log(gas_for_line);

	var gas_pie = gas_for_line.map(function(d) {
		return {
			type: d.type,
			value: d.values.filter(function(m) {return m.year == "2012";})[0].emission
			}
		})
	//console.log(gas_pie);

	//var sector_name_list = d3.keys(sector_data[0]).filter(function(key) { return key !== "year" && key !== "country"; });

	var sector_for_line = sector_name_list.map(function(type) {
		return {
			type: type,
			values: filtered_sector_data[0].values.map(function(d) {
				return {year: d.year, emission: +d[type]};
			})
		};
	});
	//console.log("sector_for_line");
	//console.log(sector_for_line);

	var sector_pie = sector_for_line.map(function(d) {
		return {
			type: d.type,
			value: d.values.filter(function(m) {return m.year == "2012";})[0].emission
			}
		})
	//console.log(sector_pie);

	
	/* Data Processing ends */
	/* Draw pie chart */
	var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.value; });

	var svg = d3.select("#pie_gas").append("svg")
		.attr("width", width_p)
		.attr("height", height_p)
	  .append("g")
		.attr("transform", "translate(" + width_p / 2 + "," + height_p / 2 + ")");

	var tool_tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-8, 0])
				.html(function() {
					var d = this.__data__;
					var html = "<table>" 
						+"<tr><th>Type:</th><td>"+d.type+"</td></tr>"
						+"<tr><th>Emission:</th><td>"+d.emission+"</td></tr>"
						+"</table>";
					return html;
				});
	svg.call(tool_tip);
		
	var g = svg.selectAll(".arc")
		  .data(pie(gas_pie))
		  .enter().append("g")
		  .attr("class", "arc")
		  .on("mouseover", tool_tip.show)
		  .on("mouseout", tool_tip.hide);

	g.append("path")
		  .attr("d", arc)
		  .style("fill", function(d) { 
		  	console.log(d);
		  	return color(d.data.type); });

	g.append("text")
		  .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		  .attr("dy", ".35em")
		  .style("text-anchor", "middle")
		  .text(function(d) { return Math.round(d.value * 100) / 100; });

	//sector pie chart

	var svg = d3.select("#pie_sector").append("svg")
		.attr("width", width_p)
		.attr("height", height_p)
	  .append("g")
		.attr("transform", "translate(" + width_p / 2 + "," + height_p / 2 + ")");
		
	var g = svg.selectAll(".arc")
		  .data(pie(sector_pie))
		  .enter().append("g")
		  .attr("class", "arc")
		  .on("mouseover", tool_tip.show)
		  .on("mouseout", tool_tip.hide);

	g.append("path")
		  .attr("d", arc)
		  .style("fill", function(d) { return color1(d.data.type); });

	g.append("text")
		  .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		  .attr("dy", ".35em")
		  .style("text-anchor", "middle");
		  //.text(function(d) { return Math.round(d.value * 100) / 100; });
	/* Draw pie charts ends */
	/* Draw line charts*/
	// Get minor gas data and others
	gas_data_with_minor = filtered_gas_data[0].values.map(function(d) {
		return {
			total_ex: d.total_ex,
			CO_in: d.CO_in,
			minor: d.CH_in + d.F + d.NO_in,
			year: d.year
		}
	})
	
	var sector_data_line = filtered_sector_data[0].values.map(function(d) {
		return {
			energy: d.energy,
			ip: d.ip,
			agri: d.agri,
			waste: d.waste,
			lucf: d.lucf,
			bunker: d.bunker,
			year: d.year
		}
	})
	//console.log("sector_data_line");
	//console.log(sector_data_line);

	gas_min = d3.min(gas_data_with_minor, function(d) {return d3.min([d.CO_in, d.total_ex, d.minor])});;
	gas_max = d3.max(gas_data_with_minor, function(d) {return d3.max([d.CO_in, d.total_ex, d.minor])});
	

	sector_min = d3.min(sector_data_line, function(d) {return d3.min([d.energy, d.ip, d.agri, d.waste, d.lucf,
																				d.bunker])});;
	sector_max = d3.max(sector_data_line, function(d) {return d3.max([d.energy, d.ip, d.agri, d.waste, d.lucf,
																				d.bunker])});
	//console.log("gas_min:" + sector_min);
	//console.log("gas_max:" + sector_max);

	// gas_list_minor = ["total_ex", "CO_in", "minor"];
	gas_line_minor  = gas_list_minor.map(function(type) {
	    return {
	      	type: type,
	      	values: gas_data_with_minor.map(function(d) {
	        	return {year: d.year, emission: +d[type]};
	      	})
	    };
	});	

	line_gas.y.domain([gas_max,gas_min]);
	line_sector.y.domain([sector_max, sector_min]);

	var svg = d3.select("#line_gas");
	lineG_gas.data(gas_line_minor)
		.select(".line")
		.transition()
		.duration(750)
		.attr("d", function(d) {return line_gas.line(d.values);});	
    svg.select(".y.axis") // change the y axis
        .transition()
        .duration(750)
        .call(line_gas.yAxis)
        .selectAll("text")
		.attr("font-size", 10);	

    //console.log("sector_data_line");
	//console.log(sector_data_line);
    var svg_sector = d3.select("#line_sector");
	lineG_sector.data(sector_for_line)
		.select(".line")
		.transition()
		.duration(750)
		.attr("d", function(d) {return line_sector.line(d.values);});	
    svg_sector.select(".y.axis") // change the y axis
        .transition()
        .duration(750)
        .call(line_sector.yAxis)
        .selectAll("text")
		.attr("font-size", 10);	
} // Draw pie and line charts end
			
function generateAxis(max, min, yText, lineFor) {
	var svg = d3.select(lineFor)
	.attr("width", width_l)
	.attr("height", height_l);

	var x = d3.scale.linear()
			.domain([start_yr,end_yr])
			.range([margin_l,width_l-margin_l]);

	// Life expectancy values all fall between 70 and 90.
	var y = d3.scale.linear()
			.range([margin_l,height_l-margin_l]);

	y.domain([max,min]);

	// Add axes.  First the X axis and label.
	var xAxis = d3.svg.axis().orient("bottom").scale(x).ticks(5).tickFormat(d3.format("d"));
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0,"+(height_l-margin_l)+")")
		.call(xAxis)
		.selectAll("text")
		.attr("font-size", 10)
		// .attr("y", 0)
		// .attr("x", 9)
		// .attr("dy", ".35em")
		.attr("transform", "rotate(-45)")
		.style("text-anchor", "end");

	svg.append("text")
		.attr("class", "axis-label")
		.attr("y", height_l-10)
		.attr("x",0 + (width_l / 2))
		.style("text-anchor", "middle")
		.text("Year");

	// Now the Y axis and label.
	var yAxis = d3.svg.axis().orient("left").scale(y).ticks(5);
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate("+margin_l+",0)")
		.call(yAxis)
		.selectAll("text")
		.attr("font-size", 10);

	svg.append("text")
		.attr("transform", "rotate(90)")
		.attr("class", "axis-label")
		.attr("y", -5)
		.attr("x",0 + (height_l / 2))
		.style("text-anchor", "middle")
		.text(yText);

	// Now a clipping plain for the main axes
	// Add the clip path.
	svg.append("clipPath")
		  .attr("id", "clip")
		.append("rect")
			  .attr("x", margin_l)
			  .attr("y", margin_l)
			  .attr("width", width_l-2*margin_l)
			  .attr("height", height_l-2*margin_l);

	// Render line chart for gas
	line = d3.svg.line()
			//.interpolate("linear")
			.x(function(d) {return x(d.year);})
			.y(function(d) {return y(d.emission);});
	return {
		yAxis: yAxis,
		y: y,
		line: line
	};

	
}			


		

			