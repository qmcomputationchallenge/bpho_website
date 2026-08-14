const e_0 = 8.854187817e-12;
const h = 6.62607015e-34;
const c = 299792458;
const m_e = 9.10938356e-31;
const e_charge = 1.602176634e-19;
const Z = 1;

const lambda_inf_to_1 = 8 * e_0 ** 2 * h ** 3 * c / (m_e * Z ** 2 * e_charge ** 4);
const lambda_inf_to_1_nm = lambda_inf_to_1 / 1e-9;

function lambda(m, n) {
    return lambda_inf_to_1_nm / (1 / m ** 2 - 1 / n ** 2);
}

function energy(lambda_nm) {
    return h * c / (lambda_nm * 1e-9) / e_charge;
}

const seriesConfig = [
    { name: 'Lyman', m: 1, n: [2, 3, 4, 5, 6], color: 'purple' },
    { name: 'Balmer', m: 2, n: [3, 4, 5, 6, 7, 8], color: 'red' },
    { name: 'Paschen', m: 3, n: [4, 5, 6, 7, 8, 9, 10], color: 'blue' },
    { name: 'Brackett', m: 4, n: [5, 6, 7, 8, 9, 10, 11, 12], color: 'green' },
    { name: 'Pfund', m: 5, n: [6, 7, 8, 9, 10, 11, 12, 13, 14], color: 'black' }
];

function generateEmissionSpectra() {
    const data = []
    const all_frequencies = [];
    const all_energies = [];
    for (const { name, m, n, color } of seriesConfig) {

        let xpoints = [];
        let ypoints = [];
        let xlines = [];
        let ylines = [];

        for (const n_i of n) {
            let wl = lambda(m, n_i);
            const ev = energy(wl);

            all_frequencies.push(wl);
            all_energies.push(ev);

            xlines.push(wl, wl, null);
            ylines.push(0, ev, null);
            xpoints.push(wl);
            ypoints.push(ev);
        }

        data.push({
            x: xlines,
            y: ylines,
            mode: 'lines',
            name: `${name} lines`,
            line: { color, width: 0.5, dash: 'dash' }
        });
        data.push({
            x: xpoints,
            y: ypoints,
            mode: 'markers',
            name: `${name} Points`,
            marker: { color, size: 6, symbol: 'x' }
        });

    }
    /*
        const dataPoints = []
        for (let i = 0; i < all_frequencies.length; i++) {
            dataPoints.push([all_frequencies[i], all_energies[i]]);
        }
    
        const result = regression.linear(dataPoints);
        const [a, b] = result.equation;
    
        const x_fit = [];
        for (let freq = 0; freq <= 3.5; freq += 0.001) {
            x_fit.push(freq);
        }
    
        const y_fit = [];
        for (const freq of x_fit) {
            y_fit.push(a * freq + b);
        }
            */
    return data;
}

let layout = {
    xaxis: { title: { text: 'Wavelength /nm' } },
    yaxis: { title: { text: 'Energy /eV' } },
    hovermode: "x",
    showlegend: true
};

Plotly.newPlot('spectra', generateEmissionSpectra(), layout);