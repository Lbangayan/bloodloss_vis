import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Set up SVG container
const width = 700, height = 300;
const svg = d3.select("#blood-vessel")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "black");

// Function to generate blood cells
function createBloodCell() {
    svg.append("circle")
        .attr("cx", -20)
        .attr("cy", Math.random() * height)
        .attr("r", Math.random() * 5 + 5)  // Random size (5-10px)
        .attr("fill", "red")
        .transition()
        .duration(getFlowSpeed())
        .ease(d3.easeLinear)
        .attr("cx", width + 20)
        .remove();
}

// Function to determine speed based on drug dosage
function getFlowSpeed() {
    let baseSpeed = 3000;  // Default speed (ms)

    // Adjust based on drug effects
    const ephDose = Number(localStorage.getItem("intraop_eph") || 50);
    const pheDose = Number(localStorage.getItem("intraop_phe") || 50);
    const epiDose = Number(localStorage.getItem("intraop_epi") || 50);

    const totalEffect = (ephDose * 0.1) + (pheDose * 0.05) + (epiDose * 0.15);

    return Math.max(1000, baseSpeed - totalEffect * 10);  // Faster if drugs increase pressure
}

// Create blood flow every 300ms
setInterval(createBloodCell, 300);
