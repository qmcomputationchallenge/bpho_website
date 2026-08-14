const e_0 = 8.854187817e-12
const h = 6.62607015e-34 
const q_e = 1.602176634e-19
const m_e = 9.10938356e-31 
const u = 1.66053906660e-27 //in kg
const pi = Math.PI

const radius = [] // angstroms
for (let i = 0; i < 4; i += 0.001) {
    radius.push(i)
}
const Z = 6
const A = 12 
const n = 4 
const L = 2

function factorial(n) {
    if (n === 0 || n === 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
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

function compute_radial(r, n, L, Z, A) {
    const m_u = (m_e * A * u) / (m_e + A * u)

    let a_0 = (e_0 * h ** 2) / (pi * m_e * q_e ** 2)
    a_0 = a_0 * 1e10

    const a = (m_e * a_0) / (m_u * Z)

    let E = -((m_u * Z ** 2 * q_e ** 4) / (8 * e_0 ** 2 * h ** 2)) * (1 / n ** 2)
    E = E / q_e

    let r_mean = (3 * n ** 2 - L * (L + 1)) * a / 2
    let r2_mean = (n ** 2 * (5 * n ** 2 + 1 - 3 * L * (L + 1))) * a ** 2 / 2

    let x = (2 * r) / (a * n)

    let w1 = Math.sqrt(factorial(n - L - 1))
    let w2 = Math.pow(2 / (a * n), 3 / 2)
    let w3 = Math.pow(x, L) * Math.exp(-x / 2)
    let w4 = laguerre(x, n, L)


    let normalization = Math.sqrt(2 * n * factorial(n + L))


    let psi = (w1 * w2 * w3 * w4) / normalization


    return { psi, E, r_mean, r2_mean, a_0, a }

}

function generateData() {
    const data = [];
    const x = [];
    const y1 = [];
    for (const r of radius) {
        x.push(r);
        y1.push(compute_radial(r, n, L, Z, A).psi ** 2);
    }
    data.push({
        x: x,
        y: y1,
        type: 'scatter',
        mode: 'lines',
        name: `n = ${n}, L = ${L}`
    });
    return data
}

let layout = {
    title: `Radial Wavefunction for n=${n}, L=${L}`,
    xaxis: { title: 'Radius (Å)' },
    hovermode : "x",
    yaxis: { title: 'Radial Wavefunction' }
};


Plotly.newPlot('radialPlot', generateData(), layout);
