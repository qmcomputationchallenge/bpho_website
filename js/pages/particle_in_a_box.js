const hbar = 1.0545718e-34;
const m = 9.10938356e-31;
const a = 2;

const x = [];
for (let i = 0; i <= a; i += 0.01) {
    x.push(i);
}

const n_values = [1, 2, 3, 4, 5];


function generateEnergyLevels(n) {
    return (hbar ** 2 * Math.PI ** 2 * n ** 2) / (2 * m * a ** 2) / (1.602176634e-19);
}

function generate_energy_vs_N() {
    const data = [];
    const x = [0];
    const y1 = [0];
    for (let n = 1; n <= 5; n++) {
        x.push(n);
        y1.push(generateEnergyLevels(n));
    }
    data.push({
        x: x,
        y: y1,
        type: 'scatter',
        mode: 'lines',
        name: 'Energy Levels'
    });
    return data;
}

let layout = {
    xaxis: { title: { text: 'Quantum Number n' } },
    yaxis: { title: { text: 'Energy Levels /eV' } },
    hovermode: "x",
    showlegend: true
};

function updateChart(chartID, generateData, layout) {
    const chart = document.getElementById(chartID);
    const newData = generateData();
    Plotly.react(chart, newData, layout);
}

Plotly.newPlot('energyvsN', generate_energy_vs_N(), layout);
//updateChart('energyvsN', generate_energy_vs_N, layout);

function generateProbabilityDensity(x, n) {
    if (x < 0 || x > a) {
        return 0;
    }
    return (2 / a) * Math.sin((n * Math.PI * x) / a) ** 2;
}

function generate_probability_box(nValues, xValues) {
    const data = [];
    for (const n of nValues) {
        const y1 = [];
        const label = `n = ${n}, E = ${generateEnergyLevels(n)} eV`;
        for (const xi of xValues) {
            y1.push(generateProbabilityDensity(xi, n));
        }
        data.push({
            x: xValues,
            y: y1,
            type: 'scatter',
            mode: 'lines',
            name: label
        });
    }
    return data;
}


function updateChart2() {
    Plotly.react("probabilityBox", generate_probability_box(n_values, x), layout2);
}

let layout2 = {
    xaxis: { title: { text: ' x /angstroms' } },
    yaxis: { title: { text: 'Probability Density' } },
    hovermode: "x",
    showlegend: true
};

Plotly.newPlot("probabilityBox", generate_probability_box(n_values, x), layout2);

