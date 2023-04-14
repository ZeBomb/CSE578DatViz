var data = [];
let filters = {
  participant_id: 1,
};
const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 50,
};
const config = {
  lineChart: {
    width: 500,
    height: 500,
  },
  stackedBarChart: {
    width: 500,
    height: 500,
  },
};
const lineChart = d3.select("#line-chart");
const stackedBarChart = d3.select("#stacked-bar-chart");
const keys = ["food_expense", "shelter", "rent_adjustment", "education"];
const stack = d3
  .stack()
  .keys(keys)
  .order(d3.stackOrderNone)
  .offset(d3.stackOffsetNone);

function initialize(newdata) {
  data = newdata;
  initializeLineChart();
  initializeStackedBarChart();
  updateLineChart();
  updateStackedBarChart();
}

function initializeLineChart() {
  const { width, height } = config.lineChart;
  lineChart.attr("width", width).attr("height", height);
  lineChart
    .append("g")
    .attr("id", "line-chart-x-axis")
    .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
    .attr("opacity", 0);
  lineChart
    .append("g")
    .attr("id", "line-chart-y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .attr("opacity", 0);
}

function initializeStackedBarChart() {
  const { width, height } = config.stackedBarChart;
  stackedBarChart.attr("width", width).attr("height", height);
  stackedBarChart
    .append("g")
    .attr("id", "stacked-bar-chart-x-axis")
    .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
    .attr("opacity", 0);
  stackedBarChart
    .append("g")
    .attr("id", "stacked-bar-chart-y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .attr("opacity", 0);
}

function updateLineChart() {
  console.log("updateLineChart");
  const t = d3.transition().duration(1000);
  const { width, height } = config.lineChart;
  const filteredData = data.filter(
    (d) => d.participant_id == filters.participant_id
  );

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(filteredData, (d) => d.weeks))
    .range([margin.left, width - margin.right - margin.left])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.savings)])
    .range([height - margin.top - margin.bottom, margin.top])
    .nice();

  const line = d3
    .line()
    .x((d) => xScale(d.weeks))
    .y((d) => yScale(d.savings));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  lineChart
    .select("#line-chart-x-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(xAxis);

  lineChart
    .select("#line-chart-y-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(yAxis);

  lineChart
    .selectAll(".line")
    .data([filteredData])
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 2)
          .attr("opacity", 0)
          .attr("d", line)
          .attr("stroke-dasharray", width * 3)
          .attr("stroke-dashoffset", width * 3)
          .call((enter) =>
            enter.transition(t).attr("opacity", 1).attr("stroke-dashoffset", 0)
          ),
      (update) => update
        .attr("stroke-dasharray", width * 3)
        .attr("stroke-dashoffset", width * 3)
        .call((update) =>
          update
            .transition(t)
            .attr("d", line)
            .attr("stroke-dashoffset", 0)
      ),
      (exit) => exit.remove()
    );
}

function updateStackedBarChart() {
  console.log("updateStackedBarChart");
  const t = d3.transition().duration(1000);
  const { width, height } = config.stackedBarChart;
  const filteredData = data.filter(
    (d) => d.participant_id == filters.participant_id
  );
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const xScale = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.weeks))
    .range([margin.left, width - margin.right - margin.left])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(
        filteredData,
        (d) => d.food_expense + d.shelter + d.rent_adjustment + d.education
      ),
    ])
    .range([height - margin.top - margin.bottom, margin.top])
    .nice();

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  stackedBarChart
    .select("#stacked-bar-chart-x-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(xAxis);

  stackedBarChart
    .select("#stacked-bar-chart-y-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(yAxis);

  const series = d3
    .stack()
    .keys(keys)
    .value((d, key) => d[key])(filteredData);

  stackedBarChart
    .selectAll(".series")
    .data(series)
    .join(
      (enter) =>
        enter
          .append("g")
          .attr("class", "series")
          .attr("fill", (d) => color(d.key))
          .call((enter) =>
            enter
              .selectAll(".bar")
              .data((d) => d)
              .join("rect")
              .attr("class", "bar")
              .attr("x", (d) => xScale(d.data.weeks))
              .attr("y", yScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .call((enter) =>
                enter
                  .transition(t)
                  .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
                  .attr("y", (d) => yScale(d[1]))
              )
          ),
      (update) =>
        update
          .attr("fill", (d) => color(d.key))
          .call((update) =>
            update
              .selectAll(".bar")
              .data((d) => d)
              .join("rect")
              .attr("class", "bar")
              .attr("x", (d) => xScale(d.data.weeks))
              .attr("y", yScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .call((update) =>
                update
                  .transition(t)
                  .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
                  .attr("y", (d) => yScale(d[1]))
            )
          ),
      (exit) => exit.transition(t).remove()
    );
}

d3.csv("data.csv", (d) => {
  return {
    participant_id: +d.participant_id,
    weeks: +d.weeks,
    food_expense: +d.food_expense,
    shelter: +d.shelter,
    rent_adjustment: +d.rent_adjustment,
    education: +d.education,
    savings: +d.savings,
  };
}).then(initialize);