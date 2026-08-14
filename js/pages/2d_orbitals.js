//---------physical constants
const e_0 = 8.854187817e-12
const h = 6.62607015e-34
const q_e = 1.602176634e-19
const m_e = 9.10938356e-31
const u = 1.66053906660e-27
const pi = Math.PI

const radius = []
for (let i = 0; i < 4; i += 0.001) {
    radius.push(i)
}

function factorial(n) {
    if (n === 0 || n === 1) {
        return 1;
    } else {
        return n * factorial(n - 1)
    }
}

function laguerre(x, n, L) {
    let result = 0

    for (let k = 0; k <= n - L - 1; k++) {
        let a1 = factorial(L + n)
        let a2 = factorial(2 * L + k + 1)
        let a3 = factorial(n - L - 1 - k)
        let a4 = factorial(k)
        result += (a1 * Math.pow(-x, k)) / (a2 * a3 * a4)
    }
    return result
}

function legendre(l, m, x) {

    if (m < 0 || m > l) return 0

    let pmm = 1.0

    if (m > 0) {
        const somx2 = Math.sqrt((1 - x) * (1 + x))
        let fact = 1;
        for (let i = 1; i <= m; i++) {
            pmm *= -fact * somx2
            fact += 2
        }
    }

    if (l === m) return pmm
    let pmmp1 = x * (2 * m + 1) * pmm
    if (l === m + 1) return pmmp1

    let pll = 0;
    for (let ll = m + 2; ll <= l; ll++) {
        pll =
            ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);

        pmm = pmmp1
        pmmp1 = pll
    }
    return pll
}
const radialConstantCache = {}
function getRadialConstants(n, L, Z, A) {
    const key = `${n}_${L}_${Z}_${A}`;
    if (radialConstantCache[key]) {
        return radialConstantCache[key];
    }

    const m_u = (m_e * A * u) / (m_e + A * u)

    let a_0 = (e_0 * h ** 2) / (pi * m_e * q_e ** 2)
    a_0 = a_0 * 1e10
    const a = (m_e * a_0) / (m_u * Z)

    let E = -((m_u * Z ** 2 * q_e ** 4) / (8 * e_0 ** 2 * h ** 2)) * (1 / n ** 2)
    E = E / q_e

    let r_mean = (3 * n ** 2 - L * (L + 1)) * a / 2
    let r2_mean = (n ** 2 * (5 * n ** 2 + 1 - 3 * L * (L + 1))) * a ** 2 / 2

    let w1 = Math.sqrt(factorial(n - L - 1))
    let w2 = Math.pow(2 / (a * n), 3 / 2)

    let normalisation = Math.sqrt(2 * n * factorial(n + L))

    const prefactor = (w1 * w2) / normalisation
    const result = { a_0, a, E, r_mean, r2_mean, prefactor }
    radialConstantCache[key] = result
    return result
}

function compute_radial(r, n, L, Z, A) {
    const c = getRadialConstants(n, L, Z, A)

    let x = (2 * r) / (c.a * n)

    let w3 = Math.pow(x, L) * Math.exp(-x / 2)
    let w4 = laguerre(x, n, L)

    let psi = (c.prefactor * w3 * w4)

    return { psi, E: c.E, r_mean: c.r_mean, r2_mean: c.r2_mean, a_0: c.a_0, a: c.a }
}
/*
function generateData() {
    const data = [];
    const x = [];
    const y1 = [];
    for (const r of radius) {
        x.push(r);
        y1.push(compute_radial(r, 4, 2, 6, 12).psi ** 2)
    }
    data.push({
        x: x,
        y: y1,
        type: 'scatter',
        mode: 'lines',
        name: `n = 4, L = 2`
    });
    return data
}

let layout = {
    title: `Radial Wavefunction for n=4, L=2`,
    xaxis: { title: 'Radius (Å)' },
    yaxis: { title: 'Radial Wavefunction' }
};

function updatePlot() {
    const data = generateData();
    Plotly.newPlot('plot', data, layout)
}
*/
function complexExp(x) {
    return {
        re: Math.cos(x),
        im: Math.sin(x)
    };
}

function complexScale(z, a) {
    return {
        re: a * z.re,
        im: a * z.im
    };
}

const sphNormCache = {}
function sphNorm(L, M) {
    const key = `${L}_${M}`;
    if (sphNormCache[key]) {
        return sphNormCache[key];
    }
    const norm = Math.pow(-1, M) * Math.sqrt(
        ((2 * L + 1) * factorial(L - M)) /
        (4 * Math.PI * factorial(L + M))
    )
    sphNormCache[key] = norm;
    return norm;
}

function spharm(azi, elev, L, M) {

    const theta = pi / 2 - elev
    const P = legendre(L, Math.abs(M), Math.cos(theta))
    let Y = P

    if (M < 0) {
        const MM = Math.abs(M)
        Y *= Math.pow(-1, MM) * factorial(L - MM) /
            factorial(L + MM)
    }

    const norm = sphNorm(L, M)
    const phase = complexExp(M * azi)

    return complexScale(phase, Y * norm)
}

function compute_wavefunction(r, azi, elev, Z, A, n, L, M, plane = 'xy') {
    const radial = compute_radial(r, n, L, Z, A)
    let angular;

    if (M === 0) {
        angular = spharm(azi, elev, L, 0)

    } else if (M < 0) {
        const y1 = spharm(azi, elev, L, Math.abs(M))
        const y2 = spharm(azi, elev, L, M);

        const sign = M % 2 === 0 ? 1 : -1


        //horrible blue tack solution i dont have the energy to understand why it works but it does

        if (plane === 'yz') {
            angular = {
                re: y1.re + sign * y2.re,
                im: y1.im - sign * y2.im
            };
        } else {
            angular = {
                re: y1.re + sign * y2.re,
                im: y1.im + sign * y2.im
            }
        };

    } else {

        const y1 = spharm(azi, elev, L, M)
        const y2 = spharm(azi, elev, L, -M)

        const sign = M % 2 === 0 ? 1 : -1

        if (plane === 'yz') {
            angular = {
                re: y1.re + sign * y2.re,
                im: y1.im - sign * y2.im
            };
        } else {
            angular = {
                re: y1.re + sign * y2.re,
                im: y1.im + sign * y2.im
            }
        };
    }

    const psi = {
        re: radial.psi * angular.re,
        im: radial.psi * angular.im
    };

    const phase = Math.atan2(psi.im, psi.re);

    const probability =
        psi.re * psi.re +
        psi.im * psi.im;

    return {
        psi,
        probability,
        phase,
        E: radial.E,
        r_mean: radial.r_mean,
        r2_mean: radial.r2_mean,
        a_0: radial.a_0
    };
}


let GRID_SIZE = document.getElementById('quality').value * 100;
let EXTENT;
const grid = {
    x: null,
    y: null,
    r: null,
    azi: null,
    elev: null
};

function initialiseGrid(plane = 'xy', displacement = 0) {

    grid.x = new Float64Array(GRID_SIZE);
    grid.y = new Float64Array(GRID_SIZE);
    grid.z = new Float64Array(GRID_SIZE);
    grid.r = new Array(GRID_SIZE);
    grid.azi = new Array(GRID_SIZE);
    grid.elev = new Array(GRID_SIZE);

    for (let i = 0; i < GRID_SIZE; i++) {
        grid.x[i] = -EXTENT + 2 * EXTENT * i / (GRID_SIZE - 1);
        grid.y[i] = -EXTENT + 2 * EXTENT * i / (GRID_SIZE - 1);
        grid.z[i] = -EXTENT + 2 * EXTENT * i / (GRID_SIZE - 1);
    }

    for (let j = 0; j < GRID_SIZE; j++) {

        grid.r[j] = new Float64Array(GRID_SIZE);
        grid.azi[j] = new Float64Array(GRID_SIZE);
        grid.elev[j] = new Float64Array(GRID_SIZE);
        for (let i = 0; i < GRID_SIZE; i++) {

            let x = grid.x[i]
            let y = grid.y[j]
            let z = grid.z[j]

            if (plane === 'xy') {
                x = grid.x[i]
                y = grid.y[j]
                z = displacement
            } else if (plane === 'xz') {
                x = grid.x[i]
                y = displacement
                z = grid.y[j]
            } else if (plane === 'yz') {
                x = displacement
                y = grid.x[i]
                z = grid.y[j]
            }
            const r = Math.sqrt(x * x + y * y + z * z);
            const azi = Math.atan2(y, x);
            const elev = r === 0 ? 0 : Math.asin(z / r);

            grid.r[j][i] = r;
            grid.azi[j][i] = azi;
            grid.elev[j][i] = elev;
        }
    }
}

function computeDensityMap(
    Z,
    A,
    n,
    L,
    M,
    plane = 'xy'
) {
    const density = [];
    let maxVal = 0;

    for (let j = 0; j < GRID_SIZE; j++) {
        density[j] = new Float64Array(GRID_SIZE);
        for (let i = 0; i < GRID_SIZE; i++) {
            const wf =
                compute_wavefunction(
                    grid.r[j][i],
                    grid.azi[j][i],
                    grid.elev[j][i],
                    Z,
                    A,
                    n,
                    L,
                    M,
                    plane
                );
            const p = wf.probability
            density[j][i] = p
            if (p > maxVal) { maxVal = p }
        }
    }
    for (let j = 0; j < GRID_SIZE; j++) {
        for (let i = 0; i < GRID_SIZE; i++) {
            density[j][i] /= maxVal
        }
    }
    return density
}

function computeOrbitalAndDensityMaps(
    Z,
    A,
    n,
    L,
    M,
    plane = 'xy'
) {
    const orbital = [];
    const density = [];
    let maxAbs = 0;
    let maxVal = 0;

    for (let j = 0; j < GRID_SIZE; j++) {
        orbital[j] = new Float64Array(GRID_SIZE);
        density[j] = new Float64Array(GRID_SIZE);

        for (let i = 0; i < GRID_SIZE; i++) {
            const wf = compute_wavefunction(
                grid.r[j][i],
                grid.azi[j][i],
                grid.elev[j][i],
                Z,
                A,
                n,
                L,
                M,
                plane
            );

            const realPart = wf.psi.re;
            const probability = wf.probability;

            orbital[j][i] = realPart;
            density[j][i] = probability;

            const absValue = Math.abs(realPart);
            if (absValue > maxAbs) {
                maxAbs = absValue;
            }
            if (probability > maxVal) {
                maxVal = probability;
            }
        }
    }

    for (let j = 0; j < GRID_SIZE; j++) {
        for (let i = 0; i < GRID_SIZE; i++) {
            orbital[j][i] /= maxAbs;
            density[j][i] /= maxVal;
        }
    }

    return { orbital, density };
}

function computeOrbitalMap(
    Z,
    A,
    n,
    L,
    M,
    plane = 'xy'
) {
    const orbital = [];
    let maxAbs = 0;

    for (let j = 0; j < GRID_SIZE; j++) {
        orbital[j] = new Float64Array(GRID_SIZE);

        for (let i = 0; i < GRID_SIZE; i++) {
            const wf =
                compute_wavefunction(
                    grid.r[j][i],
                    grid.azi[j][i],
                    grid.elev[j][i],
                    Z,
                    A,
                    n,
                    L,
                    M,
                    plane
                );
            const value = wf.psi.re
            orbital[j][i] = value
            maxAbs = Math.max(maxAbs, Math.abs(value));
        }
    }

    for (let j = 0; j < GRID_SIZE; j++) {
        for (let i = 0; i < GRID_SIZE; i++) {
            orbital[j][i] /= maxAbs
        }
    }
    return orbital
}
function plotOrbital(
    Z,
    A,
    n,
    L,
    M,
    plane = 'xy'
) {

    const orbital =
        computeOrbitalMap(
            Z,
            A,
            n,
            L,
            M,
            plane
        );

    Plotly.react(
        'orbitalPlot',
        [{
            z: orbital,
            x: grid.x,
            y: grid.y,
            type: 'heatmap',

            colorscale: 'RdBu',

            zmid: 0
        }],
        {
            title:
                `n=${n} L=${L} M=${M}`,

            width: 600,
            height: 600,

            xaxis: {
                title: 'x (Å)'
            },

            yaxis: {
                title: 'y (Å)',
                scaleanchor: 'x',
                scaleratio: 1
            }
        }
    );
}

function plotDensity(
    Z,
    A,
    n,
    L,
    M,
    plane = 'xy'
) {
    const density =
        computeDensityMap(
            Z,
            A,
            n,
            L,
            M,
            plane
        );

    Plotly.react(
        'densityPlot',
        [{
            z: density,
            x: grid.x,
            y: grid.y,
            type: 'heatmap',
            colorscale: 'Viridis',

        }],
        {
            title:
                `n=${n} L=${L} M=${M}`,

            width: 600,
            height: 600,

            xaxis: {
                title: 'x (Å)'
            },

            yaxis: {
                title: 'y (Å)',
                scaleanchor: 'x',
                scaleratio: 1
            }
        }
    );
}

function updateGrid(n, plane = 'xy') {
    EXTENT = Math.round(2 + 1.5 * n * n)
    initialiseGrid(plane, 0)
}

function validateQuantumNumbers(n, l, m) {
    const errors = [];
    if (n < 1 || n > 14) {
        errors.push("error: n must be between 1 and 14")
    }
    if (l < 0 || l >= n) {
        errors.push(`error: l out of range (0 to ${n - 1})`)
    }
    if (Math.abs(m) > l) {
        errors.push(`error: m out of range (${-l} to ${l})`)
    }

    return errors
}

function plotBoth(Z, A, n, l, m, plane = 'xy') {
    const maps = computeOrbitalAndDensityMaps(Z, A, n, l, m, plane)
    Plotly.react(
        'orbitalPlot',
        [{
            z: maps.orbital,
            x: grid.x,
            y: grid.y,
            type: 'heatmap',

            colorscale: 'RdBu',

            zmid: 0
        }],
        {
            title:
                `n=${n} L=${l} M=${m}`,

            width: 600,
            height: 600,

            xaxis: {
                title: 'x (Å)'
            },

            yaxis: {
                title: 'y (Å)',
                scaleanchor: 'x',
                scaleratio: 1
            }
        }
    );

    Plotly.react(
        'densityPlot',
        [{
            z: maps.density,
            x: grid.x,
            y: grid.y,
            type: 'heatmap',
            colorscale: 'Viridis',

        }],
        {
            title:
                `n=${n} L=${l} M=${m}`,

            width: 600,
            height: 600,

            xaxis: {
                title: 'x (Å)'
            },

            yaxis: {
                title: 'y (Å)',
                scaleanchor: 'x',
                scaleratio: 1
            }
        }
    );
}

function updatePlots() {
    let start = performance.now();
    const n = parseInt(document.getElementById('nInput').value)
    const l = parseInt(document.getElementById('lInput').value)
    const m = parseInt(document.getElementById('mInput').value)
    const plane = document.getElementById('planeSelect').value
    const errors = validateQuantumNumbers(n, l, m);
    const errorDiv = document.getElementById('errors')

    GRID_SIZE = document.getElementById('quality').value * 100;
    if (errors.length > 0) {
        errorDiv.textContent = errors
        errorDiv.style.display = 'block'
        return;
    }
    errorDiv.style.display = 'none'

    updateGrid(n, plane);

    const Z = 1
    const A = 1
    plotBoth(Z, A, n, l, m, plane);
    const end2D = performance.now();
    console.log(`2d : ${end2D - start}ms`);
}

window.addEventListener('DOMContentLoaded', function () {

    document.getElementById('nInput').value = 1
    document.getElementById('lInput').value = 0
    document.getElementById('mInput').value = 0

    document.getElementById('planeSelect').addEventListener('change', updatePlots)
    document.getElementById('nInput').addEventListener('change', updatePlots)
    document.getElementById('lInput').addEventListener('change', updatePlots)
    document.getElementById('mInput').addEventListener('change', updatePlots)
    document.getElementById('quality').addEventListener('change', function (event) {
        GRID_SIZE = event.target.value * 100;
        document.getElementById('qualityValue').textContent = event.target.value;
        updatePlots();
    });
    updatePlots();
})