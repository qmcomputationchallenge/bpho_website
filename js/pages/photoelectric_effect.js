const elements = [
    ["Silver Ag", 4.3],
    ["Gold Au", 5.1],
    ["Copper Cu", 4.7],
    ["Tin Sn", 4.4],
    ["Aluminium Al", 4.3],
    ["Lead Pb", 4.3],
    ["Tungsten W", 4.5],
    ["Nickel Ni", 4.6],
    ["Sodium Na", 2.4],
];

const frequencies = [];
for (let f = 0; f <= 2.5; f += 0.01) {
    frequencies.push(f);
}

const h = 6.62607015e-34;
const e = 1.602176634e-19;

function stoppingPotential(frequency, workFunction) {
    return (h / e) * frequency - workFunction;
}

function generatePlotData() {
    const traces = [];
    for (const el of elements) {
        const element_name = el[0];
        const work_function = el[1];
        const x = [];
        const y = [];
        for (const frequency of frequencies) {
            const potential = stoppingPotential(frequency * 1e15, work_function);
            x.push(frequency);
            y.push(potential);
        }
        traces.push({
            x: x,
            y: y,
            mode: 'lines',
            name: element_name,
        });
    }
    return traces;
}

let layout = {
    xaxis: { title: { text: 'Frequency /Hz' } },
    yaxis: { title: { text: 'Stopping Potential /V' } },
    hovermode : "x",
    showlegend: true
};

Plotly.newPlot('plots', generatePlotData(), layout);
