var filteredData = [];
var data = [];
let filters = {
  participant_id: 1,
};
const config = {
  lineChart: {
    width: 500,
    height: 500,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  stackedBarChart: {
    width: 500,
    height: 500,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
};
const lineChart = d3.select("#line-chart");
const stackedBarChart = d3.select("#stacked-bar-chart");

const stack = d3
  .stack()
  .keys(["food_expense", "shelter", "rent_adjustment", "education"])
  .order(d3.stackOrderNone)
  .offset(d3.stackOffsetNone);

function initialize(newdata) {
  data = newdata;
  initializeLineChart();
  initializeStackedBarChart();
  filterData();
  updateLineChart();
  // updateStackedBarChart();
}

function initializeLineChart() {
  const { width, height, margin } = config.lineChart;
  lineChart
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

function initializeStackedBarChart() {
  const { width, height, margin } = config.stackedBarChart;
  stackedBarChart
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

function updateLineChart() {
  const { width, height, margin } = config.lineChart;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(filteredData, (d) => d.weeks))
    .range([0, width - margin.left - margin.right]);
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(filteredData, (d) => d.savings))
    .range([height - margin.top - margin.bottom, 0]);

  const line = d3
    .line()
    .x((d) => xScale(d.weeks))
    .y((d) => yScale(d.savings));

  const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    const g = lineChart.select("g");

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(xAxis);

    g.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    g.append("path")
        .datum(filteredData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);


}

function filterData() {
  filteredData = data.filter((d) => d.participant_id == filters.participant_id);
}

const fetchData = async () => {
  const data = await d3.csv("data.csv");
  return data;
};

fetchData().then((data) => initialize(data));
