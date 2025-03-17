import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Create form container
const formContainer = d3.select("body").append("div").attr("class", "form-container");
const form = formContainer.append("form");

// Define anesthesia drug names
const drugNames = ['intraop_eph', 'intraop_phe', 'intraop_epi'];
const drugSliders = {};

// Create slider container
const sliderContainer = formContainer.append("div").attr("class", "slider-container");

drugNames.forEach(drug => {
    const drugDiv = sliderContainer.append("div").attr("class", "slider-group");
    drugDiv.append("label").text(`${drug} (mg): `);
    drugSliders[drug] = drugDiv.append("input")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", 100)
        .attr("step", 1)
        .attr("value", 50);
});

d3.json('health_data').then(data => {
    window.data = data;
    updateVisualization();
}).catch(error => {
    console.error('Error loading the data:', error);
});

function estimateBloodLoss() {
    let estimatedBloodLoss = 300;
    const drugWeights = { "intraop_eph": 1.5, "intraop_phe": 0.2, "intraop_epi": 2.0 };
    drugNames.forEach(drug => {
        const drugDose = Number(drugSliders[drug].property("value"));
        estimatedBloodLoss += drugDose * drugWeights[drug];
    });
    return estimatedBloodLoss;
}

function createBloodLossHistogram(parentDiv, data, estimatedBloodLoss) {
    const width = 600, height = 400, margin = { top: 20, right: 150, bottom: 40, left: 60 };
    parentDiv.select("svg").remove();

    const validData = data.filter(d => d.intraop_ebl !== undefined && !isNaN(d.intraop_ebl));
    const maxBloodLoss = d3.max(validData, d => d.intraop_ebl);
    const binWidth = 100;
    const thresholds = d3.range(0, maxBloodLoss + binWidth, binWidth);

    const binGenerator = d3.histogram()
        .domain([0, maxBloodLoss])
        .thresholds(thresholds)
        .value(d => d.intraop_ebl);

    const bins = binGenerator(validData);

    const xScale = d3.scaleLinear().domain([0, 1500]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([height - margin.bottom, margin.top]);

    const svg = parentDiv.append("svg").attr("width", width).attr("height", height);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickFormat(d => `${d} mL`));

    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yScale));

    let selectedPatients = 0;
    let selectedBloodLoss = [];

    const updateSelectionDisplay = () => {
        const meanBloodLoss = selectedBloodLoss.length > 0 ? (selectedBloodLoss.reduce((a, b) => a + b, 0) / selectedBloodLoss.length).toFixed(1) : 0;
        d3.select("#selected-count").text(`Selected Patients: ${selectedPatients}`);
        d3.select("#mean-blood-loss").text(`Mean Blood Loss: ${meanBloodLoss} mL`);
    };

    const bars = svg.selectAll("rect").data(bins).enter().append("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => Math.max(1, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("height", d => height - margin.bottom - yScale(d.length))
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .on("click", function(event, d) {
            const bar = d3.select(this);
            const isSelected = bar.classed("selected");
            bar.classed("selected", !isSelected).attr("fill", isSelected ? "steelblue" : "orange");
            if (isSelected) {
                selectedPatients -= d.length;
                selectedBloodLoss = selectedBloodLoss.filter(val => !d.includes(val));
            } else {
                selectedPatients += d.length;
                selectedBloodLoss = selectedBloodLoss.concat(d.map(val => val.intraop_ebl));
            }
            updateSelectionDisplay();
        });

    if (!isNaN(estimatedBloodLoss)) {
        svg.append("line")
            .attr("x1", xScale(estimatedBloodLoss))
            .attr("x2", xScale(estimatedBloodLoss))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("stroke", "red")
            .attr("stroke-dasharray", "4 4")
            .attr("stroke-width", 2);

        svg.append("text")
            .attr("x", xScale(estimatedBloodLoss) + 5)
            .attr("y", margin.top + 10)
            .attr("fill", "red")
            .style("font-size", "12px")
            .text(`Predicted Blood Loss: ${estimatedBloodLoss.toFixed(1)} mL`);
    }

    parentDiv.append("div").attr("id", "selected-count").style("margin-left", "20px").style("font-size", "16px").text("Selected Patients: 0");
    parentDiv.append("div").attr("id", "mean-blood-loss").style("margin-left", "20px").style("font-size", "16px").text("Mean Blood Loss: 0 mL");
}

function updateVisualization() {
    d3.select("#charts-container").remove();
    const estimatedBloodLoss = estimateBloodLoss();
    const chartsContainer = d3.select("body").append("div").attr("id", "charts-container").attr("class", "chart-container");
    createBloodLossHistogram(chartsContainer, window.data, estimatedBloodLoss);
}

Object.values(drugSliders).forEach(slider => {
    slider.on("input", updateVisualization);
});

updateVisualization();
