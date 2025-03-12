import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// ** Create Intro Container **
const introContainer = d3.select("body")
    .append("div")
    .attr("id", "intro-container")
    .style("text-align", "center")
    .style("padding", "30px")
    .style("margin", "20px auto")
    .style("max-width", "700px")
    .style("background", "#f9f9f9")
    .style("border-radius", "12px")
    .style("box-shadow", "0 0 15px rgba(0, 0, 0, 0.1)");

// ** Add Title **
introContainer.append("h2")
    .text("How Vasopressors Affect Blood Loss in Surgery")
    .style("color", "#333")
    .style("font-size", "24px")
    .style("margin-bottom", "10px");

// ** Add Subtitle **
introContainer.append("p")
    .text("These anesthesia drugs impact vasoconstriction and influence surgical blood loss.")
    .style("color", "#555")
    .style("font-size", "16px")
    .style("margin-bottom", "20px");

// ** Define Drugs & Their Effects on Blood Loss **
const drugs = [
    { name: "Ephedrine (mg)", id: "intraop_eph", effect: 1.5, color: "#FF5733" },
    { name: "Phenylephrine (mcg)", id: "intraop_phe", effect: 0.5, color: "#33A1FF" },
    { name: "Epinephrine (mcg)", id: "intraop_epi", effect: 2.0, color: "#33FF77" }
];

// ** SVG Setup **
const width = 500, height = 300;
const svg = introContainer.append("svg")
    .attr("width", width)
    .attr("height", height);

// ** Create Circles for Each Drug **
const circles = svg.selectAll("circle")
    .data(drugs)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => (width / 4) + i * 150)
    .attr("cy", height / 2 - 20) // Moved up to create space below
    .attr("r", d => Math.abs(d.effect) * 6 + 10) // Base size based on effect
    .attr("fill", d => d.color)
    .attr("opacity", 0.7)
    .attr("class", "intro-circle")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", d => (Math.abs(d.effect) * 6 + 20)) // Expand on hover
            .attr("opacity", 1);

        showTooltip(event, `${d.name}: Reduces blood loss by ${Math.abs(d.effect * 10)} mL`);
    })
    .on("mouseout", function () {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("r", d => Math.abs(d.effect) * 6 + 10) // Return to normal size
            .attr("opacity", 0.7);

        hideTooltip();
    })
    .on("click", function () {
        d3.select(this)
            .transition()
            .duration(500)
            .attr("r", d => (Math.abs(d.effect) * 6 + 30)) // Click expands further
            .attr("opacity", 1);
    });

// ** Add Drug Labels with Smaller Font & More Spacing Below Circles **
svg.selectAll("text")
    .data(drugs)
    .enter()
    .append("text")
    .attr("x", (d, i) => (width / 4) + i * 150)
    .attr("y", height / 2 + 45) // More space below circles
    .text(d => d.name)
    .style("text-anchor", "middle")
    .style("font-size", "12px") // **Smaller Font Size**
    .style("fill", "#333")
    .style("font-weight", "bold");

// ** Tooltip for Hover Interaction **
const tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("box-shadow", "0 0 10px rgba(0, 0, 0, 0.1)")
    .style("display", "none");

function showTooltip(event, text) {
    tooltip.style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .style("display", "block")
        .text(text);
}

function hideTooltip() {
    tooltip.style("display", "none");
}
