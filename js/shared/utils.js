function updateChart(chartID, generateData, layout) {
    const chart = document.getElementById(chartID);
    const newData = generateData();
    Plotly.newPlot(chart, newData, layout);
}