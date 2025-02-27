// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svgLine = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_RENAME = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("aircraft_incidents.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        d.year = new Date(d.Event_Date).getFullYear();
        d.accident_id = d.Accident_Number;
        d.flight_phase = d.Broad_Phase_of_Flight;
    });

    // console.log(data);

    const categories1 = d3.rollup(data,
        v => d3.rollup(v,
            values => values.length, // Aggregation: count incidents in each year
            d => d.year // Group by year
        ),
        
        d => d.flight_phase // Group by flight phase
    );

    // const excludeCategories = new Set(["", "Unknown", "Other", "Go-around"]); // Categories to remove
    
    const categories = new Map(
        Array.from(categories1).filter(([key]) => !["", "UNKNOWN", "OTHER", "GO-AROUND", "MANEUVERING"].includes(key))
    );

    // console.log(categories); 

    // 3.a: SET SCALES FOR CHART 1
    const totalYears = Array.from(categories.values())
        .flatMap(yearMap => Array.from(yearMap.keys()));
   
    const allYears = d3.range(d3.min(totalYears), d3.max(totalYears) + 1);
    
    // console.log(allYears);

    const yearCounts = Array.from(categories.values())
        .map(categoryMap =>
            Array.from(categoryMap.values())
    );

    const maxCount = d3.max(yearCounts, yearValues => d3.max(yearValues));
   
    // console.log(yearCounts);
    // console.log(maxCount);

    // Define xScale for years using d3.scaleLinear
    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears)) // Use the flat list of years to find min and max
        .range([0, width]);

     // Define yScale based on the max count of incidents
        // Y SCALE
    const yScale = d3.scaleLinear()
        .domain([0, maxCount + 1]) // Add some padding
        .range([height, 0]);
    
    // Define colorScale using d3.scaleOrdinal with categories as the domain
    const colorScale = d3.scaleOrdinal() // discrete input values
        .domain(Array.from(categories.keys())) // Use the keys of the main Map (category names)
        .range(d3.schemeCategory10); // pre-determined scale of colors

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))  // Using year for x position
        .y(d => yScale(d.count)); // Using count for y position

    // 4.a: PLOT DATA FOR CHART 1
    const lineData = Array.from(categories.entries()).map(([category, yearMap]) => {
        const values = allYears.map(year => ({
            year: year,
            count: yearMap.get(year) || 0  // Fill missing years with 0
        }));
        return { category, values };
    });
    // console.log("Line Data:", lineData);
    
    svgLine.selectAll("path")
        .data(lineData)
        .enter()
        .append("path")
        .attr("d", d => line(d.values)) // Use the new continuous data
        .style("stroke", d => colorScale(d.category))
        .style("fill", "none")
        .style("stroke-width", 2);

    // 5.a: ADD AXES FOR CHART 1
    // x-axis
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.format("d"))); // Format the x-axis as years

    // y-axis
    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // 6.a: ADD LABELS FOR CHART 1
    // // title
    // svgLine.append("text")
    //     .attr("class", "title")
    //     .attr("x", width / 2)
    //     .attr("y", -margin.top / 2)
    //     .attr("text-anchor", "middle")
    //     .text("Phases of Aircraft Incidents Over Time")
    //     .style("font-size", "16px")
    //     .style("font-weight", "bold");
    
    // x-axis
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    // y-axis
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Number of Accidents");
    
    // legend
    const legend = svgLine.selectAll(".legend")
        .data(Array.from(categories.entries()))  
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width - 120}, ${i * 15 - 20})`); // Reduce spacing

    // color squares
    legend.append("rect")
        .attr("x", 5)  // Move closer to the text
        .attr("width", 8)  // Reduce size
        .attr("height", 8)  
        .style("fill", d => colorScale(d[0]));

    // text & closer spacing
    legend.append("text")
        .attr("x", 20)  // Reduce gap between square and text
        .attr("y", 7)   // Center text better
        .attr("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .style("font-size", "10px")  // Reduce font size
        .text(d => d[0]);

    // 7.a: ADD INTERACTIVITY FOR CHART 1
    

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2


});