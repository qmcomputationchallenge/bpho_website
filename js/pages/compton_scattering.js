const h = 6.626e-34;
const m = 9.109e-31;
const c = 3e8;

const E = [50000, 100000, 150000, 200000, 500000, 1000000];

const theta = [];
for (let t = 0; t <= 180; t += 1) {
    theta.push(t);
}

function getDeltaWavelength(theta) {
    const t_rad = theta * Math.PI / 180;
    return (h / (m * c)) * (1 - Math.cos(t_rad));
}

function getFractionalWavelengthShift(theta, E) {
    const lambda0 = h * c / (E * 1.602e-19);
    return getDeltaWavelength(theta) / lambda0;
}

function getRecoilSpeed(theta, E) {
    const lambda = h * c / (E * 1.602e-19);
    return (c * Math.sqrt(1 - ((m * c ** 2) / ((E * 1.602e-19 - ((h * c) / (lambda + getDeltaWavelength(theta)))) + (m * c ** 2))) ** 2)) / c
}

function getRecoilAngle(theta, E) {
    const lambda = h * c / (E * 1.602e-19);
    const t = theta * Math.PI / 180;
    return (Math.atan((Math.sin(t)) / (1 + (h / (m * c * lambda)) * (1 - Math.cos(t)) - Math.cos(t))));
}


function generateData() {
    const data = [];
    for (const e of E) {
        const x = [];
        const y1 = [];
        for (const t of theta) {
            x.push(t);
            y1.push(getFractionalWavelengthShift(t, e));
        }
        data.push({
            x: x,
            y: y1,
            type: 'scatter',
            mode: 'lines',
            name: `E = ${e / 1000} keV`
        });
    }
    return data
};

function generateData2() {
    const data = [];
    const x = [];
    const y1 = [];
    for (const e of E) {
        const x = [];
        const y1 = [];
        for (const t of theta) {
            x.push(t);
            y1.push(getRecoilSpeed(t, e));
        }
        data.push({
            x: x,
            y: y1,
            type: 'scatter',
            mode: 'lines',
            name: `recoil speed (m/s) for E = ${e / 1000} keV`
        });
    }
    return data;
}

function generateData3() {
    const data = [];

    for (const e of E) {
        const x = [];
        const y1 = [];
        for (const t of theta) {
            x.push(t);
            y1.push(getRecoilAngle(t, e) * 180 / Math.PI);
        }
        data.push({
            x: x,
            y: y1,
            type: 'scatter',
            mode: 'lines',
            name: `Recoil Angle (degrees) for E = ${e / 1000} keV`
        });
    }
    return data;
}

let layout = {
    xaxis: { title: { text: 'Scattering Angle /degrees' } },
    yaxis: { title: { text: 'Fractional Wavelength Shift' } },
    hovermode: "x",
    showlegend: true
};

let layout2 = {
    xaxis: { title: { text: 'Scattering Angle /degrees' } },
    yaxis: { title: { text: 'Recoil Speed (m/s)' } },
    hovermode: "x",
    showlegend: true
};

let layout3 = {
    xaxis: { title: { text: 'Scattering Angle /degrees' } },
    yaxis: { title: { text: 'Recoil Angle (degrees)' } },
    hovermode: "x",
    showlegend: true
};


Plotly.newPlot('chart', generateData(), layout);
Plotly.newPlot('chart2', generateData2(), layout2);
Plotly.newPlot('chart3', generateData3(), layout3);
