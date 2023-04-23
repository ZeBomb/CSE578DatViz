/***********************
 * Global Variables
 *
 *
 ***********************/
const zbconfig = {
  bizlineChart: {
    width: document
      .getElementById("biz_line_chart")
      .getAttribute("viewBox")
      .split(" ")[2],
    height: document
      .getElementById("biz_line_chart")
      .getAttribute("viewBox")
      .split(" ")[3],
  },
  waterfallChart: {
    width: document
      .getElementById("waterfall_chart")
      .getAttribute("viewBox")
      .split(" ")[2],
    height: document
      .getElementById("waterfall_chart")
      .getAttribute("viewBox")
      .split(" ")[3],
  },
};
var zbBizLineGraphData = []; // used in bizLineChartData() to hold current linechart data ids
const bizlineChart = d3.select("#biz_line_chart");
const waterfallGraph = d3.select("#waterfall_chart");
var employers = [];
var employees = [];
var kDataTab2 = [];
var waterfallData = [];
lineGraphMarginTab2 = { top: 20, right: 20, bottom: 50, left: 70 };
var tab2Clusted = false;
var intab2 = true;

const tooltipTab2 = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("opacity", 0);

// const color = d3.scaleOrdinal(d3.schemeTableau10).domain([...keys, ...invKeys]);
// const keys = ["wages"];
// const invKeys = [
//   "food",
//   "recreation",
//   "rent_adjustment",
//   "shelter",
//   "education",
// ];
document.addEventListener("DOMContentLoaded", function () {
  /**
   * Calls page setup functions
   *
   */
  const lineGraphMargin = { top: 20, right: 20, bottom: 50, left: 70 };
  // Listen to slider
  sliderListen(lineGraphMargin);

  createBizLineCharts(lineGraphMargin);

  createWaterfall(lineGraphMargin);
});

Promise.all([
  // Kmeans data
  d3.csv("./Data/employer_salary_emp_count&p2.csv", (d) => {
    return {
      employerId: +d.employerId,
      week: +d.week,
      total_wages: +d.total_wages,
      participant_count: +d.participant_count,
      prevCount: +d.prevCount,
    };
  }),
  // Employee Data
  d3.csv("./Data/Employees.csv", function (data) {
    let coords = data["location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
    if (!employees[data["employerId"]]) {
      employees[data["employerId"]] = {};
    }
    if (!employees[data["employerId"]][data["Weeks"]]) {
      employees[data["employerId"]][data["Weeks"]] = [];
    }
    employees[data["employerId"]][data["Weeks"]].push({
      x: +coords[1],
      y: +coords[2],
    });
    return 0;
  }),
  //Employer Data
  d3.csv("./Data/Employers.csv", function (data) {
    let coords = data["location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
    employers.push({ x: +coords[1], y: +coords[2], id: +data["employerId"] });
    return 0;
  }),
]).then(([kData, blank1, blank2]) => {
  /**
   * Call All Data Functions here
   *
   */
  waterfallData = kData;
  console.log("Data read in");
  mapDataVisability();
  addMapDatatab2();
  addMapBizViewClick();
  d3.selectAll(".show-on-BizTab").style("visibility", "visible");

  /**
   * Structure k means data
   */
  const toProcess = kData.map((dictionary) => Object.values(dictionary));

  // Call K Means
  const k = 5;
  const maxIterations = 100;

  const result = kmeans(toProcess, k, maxIterations);

  kData.forEach((obj, index) => {
    obj.cluster = result.labels[index];
  });
  kDataTab2 = kData;
});
/***********************
 * Util
 *
 *
 ***********************/
function getSliderValue() {
  var slider = document.getElementById("weeks");
  // console.log("slider")
  // console.log(slider.value)
  // var sliderValue = slider.noUiSlider.get().replace("Week ", "");
  return +slider.value;
}

function mapDataVisability() {
  /**
   * This makes it so that the network map only shows on the relivent tab
   */
  // Sets up listeners for tab buttons
  // Show on tab 2
  document.addEventListener("tab2", (e) => {
    d3.selectAll(".show-on-BizTab").style("visibility", "visible");
  });
}

function sliderListen(margin) {
  const slider = document.getElementById("weeks");
  slider.addEventListener("change", (event) => {
    if (window.currentTab == 2) {
      console.log("slider changed");
      if (tab2Clusted) {
        showCluster();
      }
      if (zbBizLineGraphData.length > 0) {
        // Can only change if data exists

        /**
         * Refilter biz line chart data
         * */
        let currentIds = zbBizLineGraphData;

        let filteredData = waterfallData.filter((d) =>
          currentIds.includes(d.employerId)
        );

        //filter for week

        const currentWeek = getSliderValue();
        let filteredData2 = filteredData.filter((d) => d.week <= currentWeek);

        //Update line graph
        addLineBizView(filteredData2, margin);
        /**
         * Filter for waterfall graph
         */
        let employerId = zbBizLineGraphData[zbBizLineGraphData.length - 1];
        let filteredWater1 = allData.filter((d) => d.employerId === employerId);
        let filteredWater2 = filteredWater1.filter(
          (d) => d.week <= currentWeek
        );
        // Update waterfall graph
        addWaterfallData(margin, filteredWater2);
      }
    }
  });
}

/***********************
 * Cluster functions and non cluster switchs
 *
 *
 ***********************/
function showCluster() {
  tab2Clusted = true;
  // clear spidar
  d3.select("#clearBtnTab2").dispatch("click");
  d3.select(".legendTab2").remove(); // remove if there before

  tab2Clusted = true;
  const curWeek = getSliderValue();
  // console.log(curWeek)
  const filteredArray = kDataTab2.filter((obj) => obj.week === curWeek);
  // console.log("filteredArray kmeans")
  // console.log(filteredArray)
  // select all employer circles:
  // Select all circles with the class employer-circle-zb
  const clustercolorScale = d3
    .scaleOrdinal()
    .domain([...new Set(kDataTab2.map((d) => d.cluster))]) // unique cluster values
    .range(d3.schemeCategory10); // color palette

  d3.selectAll(".employer-circle-zb").each(function (d) {
    // Get the employerId from the circle's class
    const employerId = parseInt(
      this.getAttribute("class").match(/employerId(\d+)/)[1],
      10
    );
    // console.log(employerId)
    // Find the corresponding object in kDataTab2
    const employerData = filteredArray.find(
      (obj) => obj.employerId === employerId
    );
    // Set the circle's fill color based on its cluster
    if (employerData) {
      d3.select(this).style("fill", clustercolorScale(employerData.cluster));
    }
  });

  // add legend for clusters
  const clearBtnVisibility = "visible";
  if (!intab2) {
    clearBtnVisibility = "hidden";
  }

  // Add the legend
  const legend = d3
    .select("#map-container")
    .append("div")
    .attr("class", "legendTab2 show-on-BizTab")
    .style("position", "absolute")
    .style("bottom", "0px")
    .style("visibility", clearBtnVisibility)
    .style("left", "10px")
    .style("height", "50%")
    .style("max-height", "200px")
    .style("overflow-y", "auto");

  legend
    .selectAll(".legend-item")
    .data(clustercolorScale.domain())
    .join("div")
    .attr("class", "legend-item")
    .style("display", "flex")
    .style("align-items", "center")
    .style("flex-direction", "row")
    .style("margin-bottom", "4px")

    .html(
      (d) => `
      <div class="legend-color" style="background-color: ${clustercolorScale(
        d
      )}; width: 20px; height: 20px; margin-right: 8px;"></div>
      <div class="legend-label" style="margin-right: 10px; font-size: 12px;">Cluster ${d}</div>
    `
    );

  // update graphs to show just that cluster
}
function showIndividual() {
  tab2Clusted = false;
  console.log("show indv");
  d3.selectAll("circle.employer-circle-zb")
    .attr("r", 3)
    .attr("fill", "red")
    .style("fill", "red");

  d3.select(".legendTab2").remove();
}
/***********************
 * Map Functions
 *
 *
 ***********************/
function addMapDatatab2() {
  map = d3.select("#map");
  // Make Circles for buiz view.
  map
    .selectAll("circle")
    .data(employers)
    .enter()
    .append("circle")
    .attr("class", (d) => {
      return `employerId${d.id} show-on-BizTab employer-circle-zb`;
    })
    .attr("cx", (d) => {
      return mapXScale(d.x);
    })
    .attr("cy", (d) => mapYScale(d.y))
    .attr("r", 3)
    .attr("fill", "red")
    .style("visibility", "hidden") // Hid so it only shows on tab 2
    .on("click", (event, d) => {
      // reset other nodes
      d3.selectAll(".employer-circle-zb").attr("r", 3);
      d3.selectAll(".employeeLineTab2").attr("stroke-opacity", ".3");

      //change current node
      const circle = d3.select(event.currentTarget);
      if (circle.attr("fill") == "red") {
        circle.attr("fill", "green").attr("r", 7);
        drawEmployees(d.id);

        bizLineChartData(d.id, true, lineGraphMarginTab2);

        procesWaterData(lineGraphMarginTab2, d.id);
      } else {
        circle.attr("fill", "red").attr("r", 3);
        removeEmployee(d.id);
        bizLineChartData(d.id, false, lineGraphMarginTab2);
      }
    });

  // console.log("Circles made")
}

function addMapBizViewClick(lineGraphMargin) {
  /**
   *
   *  Function for adding dots and network to the biz view over the map.
   *  Adds clear selection button to biz view
   *  Adds toggle k- means to biz view
   */

  /**
   * Adding clear button
   */

  map = d3.select("#map");

  // map.style('position', 'relative');

  let button = d3
    .select("#clearBtnTab2")
    .html("Clear Selection")
    .attr("class", "btn show-on-BizTab")
    .style("font-size", "16px")
    .on("click", (event, d) => {
      map
        .selectAll("circle.show-on-BizTab")
        .filter((d, i, nodes) => d3.select(nodes[i]).attr("fill") !== "red")
        .each((d, i, nodes) => {
          d3.select(nodes[i]).dispatch("click");
        });
    });
}
function removeEmployee(d) {
  // Remove line and circle
  const toRemove = `.employees.employer${d}`;
  map.selectAll(toRemove).remove();
}

function drawEmployees(d) {
  // Add Employees

  const centerNode = d3.select(`circle.employerId${d}.show-on-BizTab`);
  console.log("draw employyes");
  console.log(employeesTab2);
  console.log(d);
  const week = getSliderValue();

  const filtered = employeesTab2[week][d];

  const employeeNode = map
    .append("g")
    .attr("class", `employees employer${d} show-on-BizTab`)
    .selectAll("circle")
    .data(filtered)
    .join("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", 3)
    .attr("fill", "blue");

  employeeNode.each(function (d) {
    // Add a line from the center node to each new circle
    d3.select(this.parentNode)
      .append("line")
      .attr("class", "line employeeLineTab2")
      .attr("x1", centerNode.attr("cx"))
      .attr("y1", centerNode.attr("cy"))
      .attr("x2", d3.select(this).attr("cx"))
      .attr("y2", d3.select(this).attr("cy"))
      .attr("stroke", "blue")
      // .attr("stroke-opacity" , "1")
      .attr("stroke-width", "2px");
  });

  map.selectAll("circle").raise(); // Make sure circles are above lines
}

/***********************
 * Line Chart Functions
 *
 *
 ***********************/
function createBizLineCharts(margin) {
  /*
        Creates base line graph and svg. Does not add data
    */

  // Define the width and height of the graph
  const { width, height } = zbconfig.bizlineChart;

  // Calculate the inner width and height of the graph
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create an SVG element for the graph
  // const svg = bizlineChart.append("svg").attr("width", width).attr("height", height);

  // Create a group element for the graph
  const lineGraph = bizlineChart
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("id", "lineGraph");

  // Define the scales for the x and y axes
  const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);

  const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

  // Create the x and y axes
  const xAxis = d3.axisBottom(x).tickValues([0, 1]).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y);

  // Add the x and y axes to the graph
  lineGraph
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  lineGraph.append("g").attr("class", "y-axis").call(yAxis);
  // Add the y-axis label
  lineGraph
    .append("text")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - innerHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Salaries Paid"); // update this based on the current selection

  // Add x-axis label
  lineGraph
    .append("text")
    .attr(
      "transform",
      "translate(" + innerWidth / 2 + " ," + (innerHeight + 40) + ")"
    )
    .style("text-anchor", "middle")
    .text("Week Number");

  // Add Title

  lineGraph
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", -20)
    .style("text-anchor", "middle")
    .text("Salaries Paid Per Business");
}

function bizLineChartData(newEmployerId, addPoint, margin) {
  /*
    UPdates linechart data to either remove line or add line.
    Calls addLineBizView to make changes to the graph.
    */

  if (addPoint) {
    zbBizLineGraphData.push(newEmployerId);
    // console.log(zbBizLineGraphData);
    let currentIds = zbBizLineGraphData;

    let filteredData = waterfallData.filter((d) =>
      currentIds.includes(d.employerId)
    );
    // console.log("filteredData")
    // console.log(filteredData)
    //filter for week

    const currentWeek = getSliderValue();

    let filteredData2 = filteredData.filter((d) => d.week <= currentWeek);
    //console.log(filteredData2)
    // const newLineData =
    addLineBizView(filteredData2, margin);
  } else {
    // remove point from data
    zbBizLineGraphData.pop(newEmployerId);
    // console.log(" After removeal")
    // console.log(zbBizLineGraphData)

    if (zbBizLineGraphData.length > 0) {
      let filteredData = waterfallData.filter((d) =>
        zbBizLineGraphData.includes(d.employerId)
      );

      //filter for week
      const currentWeek = getSliderValue();
      let filteredData2 = filteredData.filter((d) => d.week <= currentWeek);
      console.log(filteredData2);
      addLineBizView(filteredData2, margin);
    } else {
      emptyLineBizView(); // No data, clear line chart
      // Also clear waterfall chart
      d3.selectAll(".waterfallData").remove();
      d3.select("#waterFallTitle").text("None Selected");
      d3.select(".lineLegendTab2").remove();
    }
  }
  // });
}
function emptyLineBizView() {
  var lineGraph = bizlineChart.select(` g`);
  lineGraph.selectAll(".dataLine").remove();
  lineGraph.selectAll(".dataCircle").remove();
}
function addLineBizView(data, margin) {
  d3.selectAll(".lineLegendTab2").remove();
  /*
    Takes data and updates the graph and axis as needed.
    For the Business view line graph.
    */
  const { width, height } = zbconfig.bizlineChart;

  // Calculate the inner width and height of the graph
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  var lineGraph = bizlineChart.select(` g`);

  // Create axis variables
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.week))
    .range([0, innerWidth]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.total_wages)])

    .range([innerHeight, 0]);

  // transition axis to fit current data
  const xAxis = d3.axisBottom(x).ticks(d3.extent(data, (d) => d.week)[1]);
  const yAxis = d3.axisLeft(y);

  lineGraph
    .select(".x-axis")
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .call(xAxis);

  lineGraph
    .select(".y-axis")
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .call(yAxis);
  const tooltip = d3.select(".tooltip");

  const dataGrouped = d3.group(data, (d) => d.employerId);
  console.log("dataGrouped");
  console.log(dataGrouped);

  const line = d3
    .line()
    .x((d) => x(d.week))
    .y((d) => y(d.total_wages));

  const employerIdsKeys = Array.from(dataGrouped.keys());

  const linecolorScale = d3
    .scaleOrdinal()
    .domain([d3.extent(employerIdsKeys)]) // unique cluster values
    .range(d3.schemeCategory10); // color palette

  lineGraph
    .selectAll(".dataLine")
    .data(dataGrouped)
    .join("path")
    .attr("class", "dataLine")
    .attr("fill", "none")
    .attr("stroke", (d) => linecolorScale(d[0]))
    .attr("stroke-width", 4)
    .on("mouseover", (event, d) => {
      // Show the tooltip
      tooltip.style("opacity", 1);
      console.log("tooltip");
      console.log(d);

      // Update the tooltip conten
      tooltip
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`)
        .html(`Business: ${d[0]}`);
    })
    .on("mousemove", function (event, d) {
      d3.select(".tooltip")
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");
    })
    .on("mouseout", () => {
      d3.select(".tooltip").style("opacity", 0);
    })
    .transition()
    .duration(500)
    .ease(d3.easeLinear)
    .attr("d", function (d) {
      return line(d[1]); // pass the nested array of data points to the line function
    });

  lineGraph
    .selectAll(".dataCircle")
    .data(data)
    .join("circle")
    .attr("class", "dataCircle")
    .attr("cx", (d) => x(d.week))
    .attr("cy", (d) => y(d.total_wages))
    .attr("r", 4)
    .attr("fill", "black")
    .on("mouseover", (event, d) => {
      // Show the tooltip
      tooltip.style("opacity", 1);

      // Update the tooltip conten
      tooltip
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`)
        .html(`Salaries Paid: ${d.total_wages.toFixed(2)}`);
    })
    .on("mousemove", function (event, d) {
      d3.select(".tooltip")
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");
    })
    .on("mouseout", () => {
      d3.select(".tooltip").style("opacity", 0);
    })
    .transition()
    .duration(500)
    .ease(d3.easeLinear);

  // Update line graph
  // Remove old one
  // Create a separate SVG element for the legend
  const legend = lineGraph
    .append("g")
    .attr(
      "transform",
      `translate(${innerWidth - 10 * margin.right},${margin.top})`
    );

  // Create the legend items based on the color scale and the unique employer IDs
  d3.select(".lineLegendTab2").remove();
  const legendItems = legend
    .selectAll(".legendItem")
    .data(employerIdsKeys)
    .join("g")
    .attr("class", "legendItem lineLegendTab2")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  // Add the legend color square
  legendItems
    .append("rect")
    .attr("class", "lineLegendTab2")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", (d) => linecolorScale(d));

  // Add the legend label
  legendItems
    .append("text")
    .attr("x", 15)
    .attr("y", 10)
    .text((d) => `Business ${d}`)
    .attr("alignment-baseline", "middle");
}
/***********************
 * Biz View Functions: Waterfall Chart
 *
 *
 ***********************/
function createWaterfall(margin) {
  /**
   * Creates waterfall chart axis/ text, does not add data
   */

  const { width, height } = zbconfig.bizlineChart;

  // Calculate the inner width and height of the graph
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create an SVG element for the graph
  const graph = waterfallGraph
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("id", "waterfallGraph");

  // Create a group element for the graph

  // Define the scales for the x and y axes
  const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);

  const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

  // Create the x and y axes
  const xAxis = d3.axisBottom(x).tickValues([0, 1]).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y);

  // Add the x and y axes to the graph
  graph
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  graph.append("g").attr("class", "y-axis").call(yAxis);

  // Add all labels:

  // Add the y-axis label
  graph
    .append("text")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - innerHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Employee Count"); // update this based on the current selection

  // Add x-axis label
  graph
    .append("text")
    .attr(
      "transform",
      "translate(" + innerWidth / 2 + " ," + (innerHeight + 40) + ")"
    )
    .style("text-anchor", "middle")
    .text("Week Number");

  // Add Title

  // graph
  //   .append("text")
  //   .attr("class", "waterfallTitle")
  //   .attr("x", innerWidth / 2)
  //   .attr("y", -20)
  //   .style("text-anchor", "middle")
  //   .text("Employee Count Over Time");
}

function procesWaterData(margin, employerId) {
  // filter for employer id
  let filteredData = waterfallData.filter((d) => d.employerId === employerId);

  //filter for week
  const currentWeek = getSliderValue();
  let filteredData2 = filteredData.filter((d) => d.week <= currentWeek);
  console.log(filteredData2);
  //Add data to graph
  addWaterfallData(margin, filteredData2);
}

function addWaterfallData(margin, data) {
  /**
   * Clears old data and adds new data to waterfall chart on tab 3
   */

  // clear out old data
  d3.selectAll(".waterfallData").remove();

  //Update name
  d3.select("#waterFallTitle").text(data[0].employerId);
  const { width, height } = zbconfig.bizlineChart;

  // Calculate the inner width and height of the graph
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const graph = waterfallGraph.select(` g`);
  // Rename:
  // d3.selectAll(".waterfallTitle").remove();

  // graph
  //   .append("text")
  //   .attr("class", "waterfallTitle")
  //   .attr("x", innerWidth / 2)
  //   .attr("y", -20)
  //   .style("text-anchor", "middle")
  //   .text(`Employee Count Over Time For Business ${data[0].employerId}`);

  // Create axis variables
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.week))
    .range([0, innerWidth])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.participant_count)])
    .range([innerHeight, 0]);

  // transition axis to fit current data
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  graph
    .select(".x-axis")
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .call(xAxis);

  graph
    .select(".y-axis")
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .call(yAxis);

  const path = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(d3.curveLinear);

  function makeLine(d) {
    return [
      { x: x(d.week), y: y(d.prevCount) },
      { x: x(d.week), y: y(d.participant_count) },
    ];
  }
  function makeLine2(d) {
    return [
      { x: x(d.week), y: y(d.participant_count) },
      {
        x: x(d.week) + x.bandwidth() + x.bandwidth() * 0.1,
        y: y(d.participant_count),
      },
    ];
  }

  const tooltip = d3.select(".tooltip");

  graph
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "waterfallData")
    .attr("x", (d) => x(d.week))
    .attr("y", (d) => y(Math.max(d.participant_count, d.prevCount)))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.abs(y(d.participant_count) - y(d.prevCount)))
    .attr("fill", (d) => (d.participant_count > d.prevCount ? "green" : "red"))
    .each(function (d) {
      // Append path element to each rect
      d3.select(this.parentNode)
        .append("path")
        .datum(makeLine(d))
        .attr("d", path)
        .attr("class", "waterfallData")
        .style("stroke", "black")
        .style("stroke-width", 2);

      d3.select(this.parentNode)
        .append("path")
        .datum(makeLine2(d))
        .attr("d", path)
        .attr("class", "waterfallData")
        .style("stroke", "black")
        .style("stroke-width", 1);
    })
    .on("mouseover", (event, d) => {
      // Show the tooltip
      tooltip.style("opacity", 1);

      // Update the tooltip conten
      tooltip
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`)
        .html(`Employee Count: ${d.participant_count}`);
    })
    .on("mousemove", function (event, d) {
      d3.select(".tooltip")
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");
    })
    .on("mouseout", () => {
      d3.select(".tooltip").style("opacity", 0);
    });
}

/**
 * Page Listeners
 */

document.addEventListener("cluster-change", (e) => {
  if (window.currentTab == 2) {
    if (e.detail === "individual") {
      showIndividual();
    } else {
      showCluster();
    }
  }
});
