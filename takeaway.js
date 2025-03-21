import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Create form container
const formContainer = d3.select("body").append("div").attr("class", "form-container");
const form = formContainer.append("form");

// Define anesthesia drug names with actual names
const drugNames = [
    { id: "intraop_eph", name: "Ephedrine (mg)" },
    { id: "intraop_phe", name: "Phenylephrine (mcg)" },
    { id: "intraop_epi", name: "Epinephrine (mcg)" }
];

const drugSliders = {};

// Create slider container
const sliderContainer = formContainer.append("div").attr("class", "slider-container");

// Create sliders for each drug with clear labels
drugNames.forEach(drug => {
    const drugDiv = sliderContainer.append("div").attr("class", "slider-group");

    drugDiv.append("label").text(`${drug.name}: `); // Use actual drug name
    drugSliders[drug.id] = drugDiv.append("input")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", 100)  // Adjust based on drug dosage range
        .attr("step", 1)
        .attr("value", 50);  // Default value
});

// Load data
d3.json('../health_data').then(data => {
    console.log('Loaded Data:', data);
    if (!data || data.length === 0) {
        console.error('No data loaded or data is empty');
        return;
    }

    window.data = data;
    updateVisualization();  // Render initial visualization
}).catch(error => {
    console.error('Error loading the data', error);
});

// Function to estimate blood loss based on anesthesia drugs
function estimateBloodLoss() {
    let estimatedBloodLoss = 300;  // Base blood loss in mL

    // Assign weights to each drug's impact on blood loss
    const drugWeights = {
        "intraop_eph": 1.5,
        "intraop_phe": 0.2,
        "intraop_epi": 2.0
    };

    drugNames.forEach(drug => {
        const drugDose = Number(drugSliders[drug.id].property("value"));
        estimatedBloodLoss += drugDose * drugWeights[drug.id];  // Weighted impact on blood loss
    });

    return estimatedBloodLoss;
}

// Function to create histogram for blood loss
function createBloodLossHistogram(parentDiv, data, estimatedBloodLoss) {
    const width = 600, height = 400, margin = { top: 20, right: 20, bottom: 40, left: 60 };

    // Remove old histogram before updating
    parentDiv.select("svg").remove();

    // Get maximum blood loss value in the dataset
    const maxBloodLoss = d3.max(data, d => d.intraop_ebl);

    // ** Set bin width to 100 mL explicitly **
    const binWidth = 100;
    const thresholds = d3.range(0, maxBloodLoss + binWidth, binWidth); // Bin edges

    // Generate histogram bins
    const binGenerator = d3.histogram()
        .domain([0, maxBloodLoss])  // Set range for blood loss
        .thresholds(thresholds)  // **Use 100 mL bins**
        .value(d => d.intraop_ebl);

    const bins = binGenerator(data);

    // Define scales
    const xScale = d3.scaleLinear()
        .domain([0, 1500])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    // Create an SVG element inside the container
    const svg = parentDiv.append("svg")
        .attr("class", "histogram")
        .attr("width", width)
        .attr("height", height);

    // X-Axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale)
            .ticks(Math.min(10, maxBloodLoss / binWidth))  // Reduce tick labels
            .tickFormat(d => `${d} mL`));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Blood Loss (mL)");

    // Y-Axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left - 50)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Patients");

    // Add histogram bars
    svg.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => Math.max(1, xScale(d.x1) - xScale(d.x0) - 1))  // Ensure visible bars
        .attr("height", d => height - margin.bottom - yScale(d.length))
        .attr("fill", "steelblue")
        .attr("opacity", 0.7);

    // ** Add Estimated Blood Loss as a Vertical Line **
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
}

// Function to update visualization on slider change
function updateVisualization() {
    d3.select("#charts-container").remove();

    // Compute estimated blood loss based on slider input
    const estimatedBloodLoss = estimateBloodLoss();

    // Create new chart container
    const chartsContainer = d3.select("body").append("div").attr("id", "charts-container").attr("class", "chart-container");

    // Generate the histogram with updated estimate
    createBloodLossHistogram(chartsContainer, window.data, estimatedBloodLoss);
}

// Attach event listeners to all sliders
Object.values(drugSliders).forEach(slider => {
    slider.on("input", updateVisualization);
});

// Initial rendering
updateVisualization();

// Add final insights and explanation to the page
function addFinalInsights() {
    const insightsContainer = d3.select("body").append("div").attr("class", "insights-container");

    // Add "What to Learn" section
    insightsContainer.append("h2").text("What is One Thing Everyone Should Learn from Our Project?");
    insightsContainer.append("p").text(
        "One thing everyone should learn from our project is that you shouldn’t focus on what drugs you were administered prior to surgery in terms of blood loss; therefore, you need to focus on factors like lowering your hypertension and stress as much as possible and consider your age and sex. Another thing is that not all drugs that are vasoconstrictors eliminate blood loss; you are still at risk to possibly go under a decent amount of blood loss. So, choose the right surgeon."
    );

    // Add "Why Our Project Succeeds" section
    insightsContainer.append("h2").text("Why Does Our Project Succeed at Explaining It?");
    insightsContainer.append("p").text(
        "Our project succeeds at explaining it because we specifically show the impact of each individual drug over time, and when all the drugs are combined together into one system, our takeaway visualization shows which one also has the biggest impact on the blood loss of the patient regardless of time."
    );
}

// Call the function to add final insights
addFinalInsights();