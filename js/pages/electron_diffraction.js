const e = 1.602176634e-19;
const h = 6.62607015e-34;
const m = 9.10938356e-31;
const c = 299792458;
const d1 = 0.123e-9;
const d2 = 0.213e-9;
const MAX_N = 22
const d_values = [d1, d2];
const tube_radius = 0.065;  // tube radius 
let n_values = []
for (let i = 1; i < MAX_N; i++) {
    n_values.push(i)
}

const V = [];
for (let v = 1000; v <= 5000; v += 100) {
    V.push(v);
}

function generateMaxN(V) {
    let n = (2 * d1 * Math.sqrt(2 * m * e * V)) / (h);
    return Math.floor(n);
}
function generateRingGeometry(V, d, n) {
    wavelength = h / Math.sqrt(2 * m * e * V);
    phi = Math.asin(n * wavelength / (2 * d));
    ring_radius = tube_radius * Math.sin(2 * phi);
    return ring_radius;
}

function generateRingData(V, n = 1) {
    const data = [];
    for (const d of d_values) {
        const x = [];
        const y = [];
        for (const v of V) {
            const ring_radius = generateRingGeometry(v, d, n);
            x.push(v/1000);
            y.push(ring_radius * 1000);
        } data.push({
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            name: `d = ${d} m`
        });
    } return data;
}
function generateRingData2(V, d){
    const data = [];
    for (const n of n_values) {
        const x = [];
        const y = [];
        for (const v of V) {
            const ring_radius = generateRingGeometry(v, d, n)
            x.push(v/1000)
            y.push(ring_radius * 1000)
        } data.push({
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            name: `n = ${n}`
        })
    } return data

}
let layout3 = {
    xaxis: { title: { text: 'Voltage /kV' } },
    yaxis: { title: { text: 'Ring Radius /mm' } },
    hovermode: "x",
    showlegend: true
};

Plotly.newPlot('plot', generateRingData(V), layout3);
Plotly.newPlot('plot2', generateRingData2(V, d1), layout3)

function generateVsin() {
    const data = [];
    const x = [];
    const y1 = [];

    for (const v of V) {
        x.push((1 * h) / (2 * d1 * Math.sqrt(2 * m * e * v)));
        y1.push(1 / Math.sqrt(v));

    }

    data.push({
        x: x,
        y: y1,
        type: 'scatter',
        mode: 'lines',
        name: ' 1/sqrt(V) vs sin phi/2'
    });
    return data;
}

let layout2 = {
    xaxis: { title: { text: 'sin phi/2' } },
    yaxis: { title: { text: '1/sqrt(V)' } },
    showlegend: true
};

data = generateVsin();

Plotly.newPlot('V_vs_sin_phi', generateVsin(), layout2);

function generaterRings(v, d, n_val) {
    const data = [];
    const theta = [];
    for (let t = 0; t <= 360; t += 2) {
        theta.push(2 * Math.PI * t / 180);
    }

    for (const n of n_val) {
        const x = [];
        const y = [];
        for (const t of theta) {
            const ring_radius = generateRingGeometry(v, d, n);
            x.push(ring_radius * 1000 * Math.cos(t));
            y.push(ring_radius * 1000 * Math.sin(t));
        }
        data.push({
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            name: `n = ${n}`
        });
    }
    return data;
}

layout4 = {
    xaxis: { title: { text: 'x /mm' } },
    yaxis: { title: { text: 'y /mm' } },
    showlegend: true,
    title:{text: "d = 0.123 nm, V = 3 kV"},
    xaxis: { scaleanchor: "y", scaleratio: 1 }
};

Plotly.newPlot('rings', generaterRings(3000, d1, n_values), layout4);
/*
function generateMaxNVoltage() {
    const data = [];
    const x = [];
    const y1 = [];

    for (const v of V) {
        x.push(v);
        y1.push(generateMaxN(v));
    }

    data.push({
        x: x,
        y: y1,
        type: 'scatter',
        mode: 'lines',
        name: 'Max N'
    });
    return data;
}

let layout = {
    xaxis: { title: { text: 'Voltage /V' } },
    yaxis: { title: { text: 'Max N' } },
    showlegend: true
};

Plotly.newPlot('maxN_vs_V', generateMaxNVoltage(), layout);
*/