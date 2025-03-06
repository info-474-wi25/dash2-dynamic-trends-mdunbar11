// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svgLine = d3.select("#lineChart1")
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

// 2.a: LOAD CSV DATA
d3.csv("aircraft_incidents.csv").then(data => {
    // 2.b: TRANSFORM DATA
    data.forEach(d => {
        d.year = new Date(d.Event_Date).getFullYear();
        d.accident_id = d.Accident_Number;
        d.flight_phase = d.Broad_Phase_of_Flight;
    });

    const categories1 = d3.rollup(data,
        v => d3.rollup(v, values => values.length, d => d.year),
        d => d.flight_phase
    );

    const categories = new Map(
        Array.from(categories1).filter(([key]) => 
            !["", "UNKNOWN", "OTHER", "GO-AROUND", "MANEUVERING"].includes(key)
        )
    );

    const totalYears = Array.from(categories.values()).flatMap(yearMap => Array.from(yearMap.keys()));
    const allYears = d3.range(d3.min(totalYears), d3.max(totalYears) + 1);
    const yearCounts = Array.from(categories.values()).map(categoryMap => Array.from(categoryMap.values()));
    const maxCount = d3.max(yearCounts, yearValues => d3.max(yearValues));

    // Define Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, maxCount + 1])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(categories.keys()))
        .range(d3.schemeCategory10);

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));

    const lineData = Array.from(categories.entries()).map(([category, yearMap]) => {
        const values = allYears.map(year => ({
            year: year,
            count: yearMap.get(year) || 0
        }));
        return { category, values };
    });

    // Draw Lines
    svgLine.selectAll("path.data-line")
        .data(lineData)
        .enter()
        .append("path")
        .attr("class", "data-line")
        .attr("d", d => line(d.values))
        .style("stroke", d => colorScale(d.category))
        .style("fill", "none")
        .style("stroke-width", 2);

    // Add Axes
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // Add Labels
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Number of Accidents");

    // Legend
    const legend = svgLine.selectAll(".legend")
        .data(Array.from(categories.entries()))
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width - 120}, ${i * 15 - 20})`);

    legend.append("rect")
        .attr("x", 5)
        .attr("width", 8)
        .attr("height", 8)
        .style("fill", d => colorScale(d[0]));

    legend.append("text")
        .attr("x", 20)
        .attr("y", 7)
        .attr("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .style("font-size", "10px")
        .text(d => d[0]);

    // Tooltip
    const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "6px")
    .style("border-radius", "5px")
    .style("font-size", "12px");

    // Bind data points to each category's line
    const points = svgLine.selectAll(".data-points")
    .data(lineData)
    .enter()
    .append("g")
    .attr("class", "data-points")
    .each(function (d) {
        d3.select(this)
            .selectAll("circle")
            .data(d.values)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.count))
            .attr("r", 5)
            .style("fill", colorScale(d.category))
            .style("opacity", 0) // Invisible by default
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .html(
                        `<strong>Year:</strong> ${d.year} <br>
                        <strong>Accidents:</strong> ${d.count}`
                    )
                    .style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");

                d3.select(this).transition().duration(200).style("opacity", 1);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this).transition().duration(200).style("opacity", 0);
            });
        });

    // Update Chart Function
    function updateChart(selectedCategories) {
        // Filter the data for selected categories
        var filteredData = lineData.filter(d => selectedCategories.includes(d.category));
    
        // console.log("Filtered Data:", filteredData); // Debugging
    
        // Bind data to existing lines
        var lines = svgLine.selectAll("path.data-line")
            .data(filteredData, d => d.category); // Use category as key
    
        // Remove lines that are no longer selected
        lines.exit().remove();

        // Remove existing marks
        svgLine.selectAll(".data-point").remove(); // Remove previous tooltip circles
    
        // Update existing lines
        lines
            .attr("d", d => line(d.values))
            .style("stroke", d => colorScale(d.category));
    
        // Append new lines for categories that were just selected
        lines.enter()
            .append("path")
            .attr("class", "data-line")
            .attr("d", d => line(d.values))
            .style("stroke", d => colorScale(d.category))
            .style("fill", "none")
            .style("stroke-width", 2);

        // Recreate tooltip marks
        // Tooltip
        const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "6px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

        // Bind data points to each category's line
        const points = svgLine.selectAll(".data-points")
        .data(selectedCategories)
        .enter()
        .append("g")
        .attr("class", "data-points")
        .each(function (d) {
            d3.select(this)
                .selectAll("circle")
                .data(d.values)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.count))
                .attr("r", 5)
                .style("fill", colorScale(d.category))
                .style("opacity", 0) // Invisible by default
                .on("mouseover", function (event, d) {
                    tooltip.style("visibility", "visible")
                        .html(
                            `<strong>Year:</strong> ${d.year} <br>
                            <strong>Accidents:</strong> ${d.count}`
                        )
                        .style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");

                    d3.select(this).transition().duration(200).style("opacity", 1);
                })
                .on("mousemove", function (event) {
                    tooltip.style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                    d3.select(this).transition().duration(200).style("opacity", 0);
                });
        });
    }

    // Checkbox Event Listener
    d3.selectAll("#checkboxSelect input[type='checkbox']").on("change", function() {
        var selectedCategories = d3.selectAll("#checkboxSelect input:checked")
            .nodes()
            .map(d => d.value);
        updateChart(selectedCategories);
    });
});