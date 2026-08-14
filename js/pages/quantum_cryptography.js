const RANGE = 90;

function classicalMismatch(theta, phi) {
    theta = theta * Math.PI / 180;
    phi = phi * Math.PI / 180;
    return 1 - Math.cos(theta) ** 2 * Math.cos(phi) ** 2 - Math.sin(theta) ** 2 * Math.sin(phi) ** 2;
}

function quantumMismatch(theta, phi) {
    theta = theta * Math.PI / 180;
    phi = phi * Math.PI / 180;
    return Math.sin(phi - theta) ** 2;
}

function buildMismatchSurface() {
    const thetaValues = [];
    const phiValues = [];
    const z = [];
    const step = 1;

    for (let t = -RANGE; t <= RANGE; t += step) {
        thetaValues.push(t);
    }
    for (let p = -RANGE; p <= RANGE; p += step) {
        phiValues.push(p);
    }

    for (let i = 0; i < phiValues.length; i += 1) {
        const row = [];
        for (let j = 0; j < thetaValues.length; j += 1) {
            row.push(classicalMismatch(thetaValues[j], phiValues[i]));
        }
        z.push(row);
    }

    const data = [{
        x: thetaValues,
        y: phiValues,
        z,
        type: 'surface',
        colorscale: 'Viridis',
        cmin: 0,
        cmax: 1,
        contours: {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: '#42f462',
                project: { z: true }
            }
        }
    },
    {
        x: [0],
        y: [0],
        z: [classicalMismatch(0, 0)],
        type: 'scatter3d',
        mode: 'markers',
        marker: {
            color: 'red',
            size: 5
        },
        name: 'marker'
    }];

    const layout = {
        title: 'classical mismatch',
        scene: {
            xaxis: { title: 'θ (degrees)', range: [-90, 90] },
            yaxis: { title: 'φ (degrees)', range: [-90, 90] },
            zaxis: { title: 'mismatch', range: [0, 1] },
            title: { text: "classical" }
        },
    };

    Plotly.newPlot('classical', data, layout, { responsive: true });
}

function buildMismatchSurface2() {
    const thetaValues = [];
    const phiValues = [];
    const z = [];
    const step = 1;

    for (let t = -RANGE; t <= RANGE; t += step) {
        thetaValues.push(t);
    }
    for (let p = -RANGE; p <= RANGE; p += step) {
        phiValues.push(p);
    }

    for (let i = 0; i < phiValues.length; i += 1) {
        const row = [];
        for (let j = 0; j < thetaValues.length; j += 1) {
            row.push(quantumMismatch(thetaValues[j], phiValues[i]));
        }
        z.push(row);
    }

    const data = [{
        x: thetaValues,
        y: phiValues,
        z,
        type: 'surface',
        colorscale: 'Viridis',
        cmin: 0,
        cmax: 1,
        contours: {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: '#42f462',
                project: { z: true }
            }
        }
    },
    {
        x: [0],
        y: [0],
        z: [quantumMismatch(0, 0)],
        type: 'scatter3d',
        mode: 'markers',
        marker: {
            color: 'red',
            size: 5
        },
        name: 'marker'
    }];

    const layout = {
        title: 'quantum mismatch',
        scene: {
            xaxis: { title: 'θ (degrees)', range: [-90, 90] },
            yaxis: { title: 'φ (degrees)', range: [-90, 90] },
            zaxis: { title: 'mismatch', range: [0, 1] },
            title: { text: 'quantum' }
        },
    };

    Plotly.newPlot('quantum', data, layout, { responsive: true });
}

function buildMismatchSurface3() {
    const thetaValues = [];
    const phiValues = [];
    const z = [];
    const step = 1;

    for (let t = -RANGE; t <= RANGE; t += step) {
        thetaValues.push(t);
    }
    for (let p = -RANGE; p <= RANGE; p += step) {
        phiValues.push(p);
    }

    for (let i = 0; i < phiValues.length; i += 1) {
        const row = [];
        for (let j = 0; j < thetaValues.length; j += 1) {
            row.push(quantumMismatch(thetaValues[j], phiValues[i]) - classicalMismatch(thetaValues[j], phiValues[i]));
        }
        z.push(row);
    }

    const data = [{
        x: thetaValues,
        y: phiValues,
        z,
        type: 'surface',
        colorscale: 'Viridis',
        cmin: -1,
        cmax: 1,
        contours: {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: '#42f462',
                project: { z: true }
            }
        }
    },
    {
        x: [0],
        y: [0],
        z: [quantumMismatch(0, 0) - classicalMismatch(0, 0)],
        type: 'scatter3d',
        mode: 'markers',
        marker: {
            color: 'red',
            size: 5
        },
        name: 'marker'
    }];


    const layout = {
        title: 'difference',
        scene: {
            xaxis: { title: 'θ (degrees)', range: [-90, 90] },
            yaxis: { title: 'φ (degrees)', range: [-90, 90] },
            zaxis: { title: 'mismatch', range: [-1, 1] },
            title: { text: 'difference' },
        },
    };

    Plotly.newPlot('difference', data, layout, { responsive: true });
}


buildMismatchSurface();
buildMismatchSurface2();
buildMismatchSurface3();

const thetaSlider = document.getElementById('theta');
const phiSlider = document.getElementById('phi');
const thetaVal = document.getElementById('thetaVal');
const phiVal = document.getElementById('phiVal');

function update() {
    const theta = parseFloat(thetaSlider.value);
    const phi = parseFloat(phiSlider.value);
    thetaVal.textContent = theta;
    phiVal.textContent = phi;

    const classical = classicalMismatch(theta, phi);
    const quantum = quantumMismatch(theta, phi);
    const difference = quantum - classical;

    document.getElementById('classicalVal').textContent = classical.toFixed(4);
    document.getElementById('quantumVal').textContent = quantum.toFixed(4);
    document.getElementById('differenceVal').textContent = difference.toFixed(4);

    Plotly.restyle('difference', { x: [[theta]], y: [[phi]], z: [[difference]] }, [1]);
    Plotly.restyle('classical', { x: [[theta]], y: [[phi]], z: [[classical]] }, [1]);
    Plotly.restyle('quantum', { x: [[theta]], y: [[phi]], z: [[quantum]] }, [1]);
}

document.getElementById('theta').addEventListener('input', update);
document.getElementById('phi').addEventListener('input', update);

update();