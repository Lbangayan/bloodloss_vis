import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Load Data
d3.json("health_data").then(data => {
    console.log("Loaded Data:", data);

    if (!data || data.length === 0) {
        console.error("⚠️ No data loaded");
        return;
    }

    // Define drug categories
    const drugs = ["Ephedrine", "Phenylephrine", "Epinephrine"];

    // Remove outliers using the 95th percentile
    const bloodLossValues = data.map(d => +d.intraop_ebl).filter(v => v > 0);
    const threshold = d3.quantile(bloodLossValues, 0.95);
    console.log("Outlier threshold:", threshold);

    // Process Data: Group by Surgery Duration and Drug Type
    let timeBins = { "Ephedrine": {}, "Phenylephrine": {}, "Epinephrine": {} };

    data.forEach(d => {
        let duration = Math.round((d.caseend - d.casestart) / 60) || 0; // Convert to hours
        let bloodLoss = +d.intraop_ebl;

        if (duration > 0 && bloodLoss <= threshold) { // Remove extreme outliers
            let primaryDrug = getPrimaryDrug(d);
            if (!timeBins[primaryDrug][duration]) {
                timeBins[primaryDrug][duration] = { count: 0, totalLoss: 0 };
            }
            timeBins[primaryDrug][duration].count++;
            timeBins[primaryDrug][duration].totalLoss += bloodLoss;
        }
    });

    // Convert grouped data into an array
    let processedData = drugs.map(drug => ({
        drug: drug,
        values: smoothData(
            Object.keys(timeBins[drug]).map(duration => ({
                duration: +duration,
                avgBloodLoss: timeBins[drug][duration].totalLoss / timeBins[drug][duration].count
            })).sort((a, b) => a.duration - b.duration)
        )
    }));

    // Create separate charts for each drug
    processedData.forEach(drugData => {
        createBrushableLineChart(drugData);
    });
}).catch(error => console.error("❌ Error loading data:", error));

// 📌 **Determine Primary Drug Used**
function getPrimaryDrug(d) {
    const drugValues = { "Ephedrine": d.intraop_eph, "Phenylephrine": d.intraop_phe, "Epinephrine": d.intraop_epi };
    return Object.keys(drugValues).reduce((a, b) => (drugValues[a] > drugValues[b] ? a : b));
}

// 📉 **Apply Moving Average Smoothing (to balance trends)**
function smoothData(data, windowSize = 5) {
    return data.map((d, i, arr) => {
        const start = Math.max(0, i - windowSize + 1);
        const subset = arr.slice(start, i + 1);
        return {
            duration: d.duration,
            avgBloodLoss: d3.mean(subset, v => v.avgBloodLoss)
        };
    });
}

// 🎨 **Color Scale for Drug Types**
const colorScale = d3.scaleOrdinal()
    .domain(["Ephedrine", "Phenylephrine", "Epinephrine"])
    .range(["#ff6666", "#66b3ff", "#99ff99"]);  // Red, Blue, Green

// 📈 **Brushable Line Chart**
function createBrushableLineChart(drugData) {
    const width = 700, height = 300, margin = { top: 50, right: 50, bottom: 50, left: 80 };

    // Create individual container for each chart
    const container = d3.select("#charts-container")
        .append("div")
        .attr("class", "chart-container");

    container.append("h2")
        .text(`${drugData.drug} - Blood Loss Over Time`)
        .style("text-align", "center")
        .style("margin-bottom", "10px");

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#f8f8f8");

    // Define a **clipPath** to prevent line overflow
    svg.append("defs").append("clipPath")
        .attr("id", `clip-${drugData.drug}`)
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(drugData.values, d => d.duration)])
        .range([margin.left, width - margin.right]);

    const yMax = d3.max(drugData.values, d => d.avgBloodLoss);
    const yScale = d3.scaleLinear()
        .domain([0, yMax]) // FIXED Y-AXIS TO AVOID OVERSHOOTING
        .range([height - margin.bottom, margin.top]);

    // Axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(10));

    const yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.duration))
        .y(d => yScale(d.avgBloodLoss))
        .curve(d3.curveMonotoneX);

    // Create path for animation **inside the clipPath**
    let path = svg.append("g")
        .attr("clip-path", `url(#clip-${drugData.drug})`) // Apply clipping here
        .append("path")
        .attr("fill", "none")
        .attr("stroke", colorScale(drugData.drug))
        .attr("stroke-width", 2);

    let totalDataPoints = drugData.values.length;
    let batchSize = 5; // Slower rendering (5 points per batch)
    let index = 0;

    function drawStep() {
        if (index < totalDataPoints) {
            let batchEnd = Math.min(index + batchSize, totalDataPoints);
            path.datum(drugData.values.slice(0, batchEnd))
                .attr("d", line);

            index += batchSize;
            setTimeout(drawStep, 150); // Slower rendering speed
        }
    }
    drawStep();  // Start drawing

    // 📌 **Brush for Zooming (Only X-axis Zooms)**
    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed({ selection }) {
        if (!selection) return;

        const [x0, x1] = selection.map(xScale.invert);
        xScale.domain([x0, x1]);  // Update X-axis, but Y-axis remains fixed

        xAxis.transition()
            .duration(500)
            .call(d3.axisBottom(xScale).ticks(5));

        path.transition()
            .duration(500)
            .attr("d", line(drugData.values));

        svg.select(".brush").call(brush.move, null);
    }

    // 📌 **Double-click to Reset Zoom**
    svg.on("dblclick", function () {
        xScale.domain([0, d3.max(drugData.values, d => d.duration)]);
        xAxis.transition().duration(500).call(d3.axisBottom(xScale).ticks(10));
        path.transition().duration(500).attr("d", line(drugData.values));
    });
}
