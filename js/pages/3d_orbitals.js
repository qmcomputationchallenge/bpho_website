//---------physical constants
const e_0 = 8.854187817e-12
const h = 6.62607015e-34
const q_e = 1.602176634e-19
const m_e = 9.10938356e-31
const u = 1.66053906660e-27
const pi = Math.PI

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


        //horrible blue tack solution i dont understand why it works but it does

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

let EXTENT;

function estimateMaxProb(Z, A, n, L, M, resolution) {
    const grid = new Float64Array(resolution);
    for (let i = 0; i < resolution; i++) {
        grid[i] = -EXTENT + 2 * EXTENT * i / (resolution - 1);
    }

    let maxProb = 0;
    for (let i = 0; i < resolution; i++) {
        let x = grid[i];
        for (let j = 0; j < resolution; j++) {
            let y = grid[j];
            for (let k = 0; k < resolution; k++) {
                let z = grid[k];
                const r = Math.sqrt(x * x + y * y + z * z);
                const azi = Math.atan2(y, x);
                const elev = r === 0 ? 0 : Math.asin(z / r);

                const wf = compute_wavefunction(r, azi, elev, Z, A, n, L, M);
                const prob = wf.probability;
                if (prob > maxProb) {
                    maxProb = prob;
                }
            }
        }
    }
    return maxProb;
}

function compute3DPointCloud(Z, A, n, L, M, targetPoints, maxTrials) {
    let maxProb = estimateMaxProb(Z, A, n, L, M, 20);
    const px = [];
    const py = [];
    const pz = [];
    const pAmp = [];
    let trials = 0;
    while (px.length < targetPoints && trials < maxTrials) {
        trials++;
        const x = Math.random() * 2 * EXTENT - EXTENT;
        const y = Math.random() * 2 * EXTENT - EXTENT;
        const z = Math.random() * 2 * EXTENT - EXTENT;

        const r = Math.sqrt(x * x + y * y + z * z);
        const azi = Math.atan2(y, x);
        const elev = r === 0 ? 0 : Math.asin(z / r);
        const wf = compute_wavefunction(r, azi, elev, Z, A, n, L, M);
        if (Math.random() < wf.probability / maxProb && wf.probability > 0) {
            px.push(x);
            py.push(y);
            pz.push(z);
            pAmp.push(wf.psi.re);
        }
    }
    for (let i = 0; i < px.length; i++) {
        if (Math.abs(pAmp[i]) > maxProb) {
            maxProb = Math.abs(pAmp[i]);
        }
    }

    for (let i = 0; i < px.length; i++) {
        pAmp[i] /= maxProb;
    }
    return { x: px, y: py, z: pz, amp: pAmp, trials };
}

function plot3dPointCloud(Z, A, n, L, M, targetPoints) {
    const maxTrials = Math.max(100000, targetPoints * 50);
    const pointCloud = compute3DPointCloud(Z, A, n, L, M, targetPoints, maxTrials);
    Plotly.react('orbital3dPlot', [
        {
            type: 'scatter3d', mode: 'markers',
            x: pointCloud.x, y: pointCloud.y, z: pointCloud.z,
            marker: {
                size: 1.6,
                color: pointCloud.amp,
                colorscale: 'RdBu',
                cmin: -1,
                cmax: 1,
                opacity: 0.85,
                colorbar: {
                    x: -0.1,
                }
            },
            hoverinfo: 'skip', showlegend: false
        }
    ], {
        title: `n=${n} L=${L} M=${M}`,
        scene: {
            xaxis: { title: 'x (Å)' },
            yaxis: { title: 'y (Å)' },
            zaxis: { title: 'z (Å)' },
            aspectmode: 'data'
        }
    });
    return pointCloud.x.length;
}

function updatePlots() {
    let start = performance.now();
    const n = parseInt(document.getElementById('nInput').value)
    const l = parseInt(document.getElementById('lInput').value)
    const m = parseInt(document.getElementById('mInput').value)
    const targetPoints = parseInt(document.getElementById('targetPoints').value)
    document.getElementById('targetPointsValue').textContent = targetPoints;
    EXTENT = Math.round(2 + 1.5 * n * n)

    const errors = validateQuantumNumbers(n, l, m);
    const errorDiv = document.getElementById('errors')

    if (errors.length > 0) {
        errorDiv.textContent = errors
        errorDiv.style.display = 'block'
        return;
    }
    errorDiv.style.display = 'none'

    const Z = 1
    const A = 1

    start = performance.now();
    const plottedPoints = plot3dPointCloud(Z, A, n, l, m, targetPoints);
    const end3D = performance.now();
    console.log(`3d : ${end3D - start}ms`);
    console.log(`plotted points: ${plottedPoints}`);
}

window.addEventListener('DOMContentLoaded', function () {


    document.getElementById('nInput').value = 1
    document.getElementById('lInput').value = 0
    document.getElementById('mInput').value = 0

    document.getElementById('nInput').addEventListener('change', updatePlots)
    document.getElementById('lInput').addEventListener('change', updatePlots)
    document.getElementById('mInput').addEventListener('change', updatePlots)
    document.getElementById('targetPoints').addEventListener('change', updatePlots)
    updatePlots();
})