// CONSTANTS FOR BOTH
const k_b = 1.380649e-23;
const h = 6.62607015e-34;
const c = 299792458;
const b = 2.897771955e-3;
const R = 8.314462618;

const elements = [
    ["Gold Au", 170, 0.2855],
    ["Aluminium Al", 428, 0.7188],
    ["Copper Cu", 343.5, 0.5769], 
    ["Iron Fe", 470, 0.7893], 
    ["Titanium Ti", 420, 0.7054], 
    ["Silicon Si", 645, 1.0832], 
    ["Carbon C", 2230, 3.7451]
];

let temperatures = [];
for (let T = 10; T <= 1000; T += 1) {
    temperatures.push(T);
}

function heat_capacity(T, ve) {
    const x = h * ve / (k_b * T);
    return 3*R * (x ** 2 * Math.exp(x)) / ((Math.exp(x) - 1) ** 2);
}

function generateHeatCapacity() {
    const data = [];
    for (const el of elements) {
        const ve = el[2];
        const x = [];
        const y = [];
        for (const T of temperatures) {
            x.push(T);
            y.push(heat_capacity(T, ve * 1e13));
        }
        data.push({
            x: x,
            y: y,
            mode: 'lines',
            name: el[0],
            line: {}
        });
    }
    return data;
}

let layoutHeatCapacity = {
    xaxis: { title: { text: 'T /K' } },
    yaxis: { title: { text: 'Molar Heat Capacity /Jmol⁻¹K⁻¹' } },
    hovermode : "x",
    showlegend: true
};

let y = [];
for (const T of temperatures) {
    y.push(3*R);
}

var constant = {
    x: temperatures,
    y: y,
    mode: 'lines',
    name: 'Dulong-Petit Law',
    line: { dash: 'dash', color: 'black' }
}
data = generateHeatCapacity();
data.push(constant);
Plotly.newPlot('heatCapacity', data, layoutHeatCapacity); 

// CODE FOR THE NEXT GRAPH =======================================

temperatures = [3000, 4000, 5000, 6000, 7000, 8000];
let wavelengths = [];
for (let wl = 10; wl <= 2500; wl += 1) {
    wavelengths.push(wl);
}

let layoutEinstein = {
    xaxis: { title: { text: 'Wavelength /nm' } },
    yaxis: { title: { text: 'Irradiance /Wm⁻²/nm x10^4' } },
    hovermode : "x",
    showlegend: true
};

function rayleigh(wavelength, temperature) {
    return ((2*c*k_b*temperature)/wavelength**4) / 1e-4;
}

function planck(wavelength, temperature) {
    const lambda = wavelength * 1e-9;
    return ((2* h* c**2 )/(lambda ** 5))*(1/(Math.exp((h* c)/(lambda* k_b* temperature))-1))/1e-4;
}

function generate_spectra() {
    const data = [];

    for (const temp of temperatures) {
        const x = [];
        const y = [];
        for (const wl of wavelengths) {
            x.push(wl);
            y.push(planck(wl, temp));
        }
        data.push({
            x: x,
            y: y,
            mode: 'lines',
            name: `T = ${temp} K`,
            line: { color: `hsl(${(temp - 3000) / 5000 * 240}, 100%, 50%)` }
        });
    }
    return data;
}

function generate_rayleigh() {
    const x = [];
    const y = [];
    for (const wl of wavelengths) {
        const y_i = rayleigh(wl * 1e-9, 5000);
        if (y_i < 1.5e18) {
            x.push(wl);
            y.push(y_i);
        }
    }
    return {
        x: x,
        y: y,
        mode: 'lines',
        name: 'Rayleigh-Jeans Law',
        hovermode : "x",
        line: { dash: 'dash', color: 'black' }
    };
}

data = generate_spectra();
data.push(generate_rayleigh());

for (const T of temperatures) {
    const lambda_max = b / T * 1e9;
    data.push({
        x: [lambda_max],
        y: [planck(lambda_max, T)],
        mode: 'markers',
        name: `T = ${T}`,
        marker: { color: `hsl(${(T - 3000) / 5000 * 240}, 100%, 50%)`, size: 7, symbol: 'x'},
        type: 'scatter'
    });
}

Plotly.newPlot('spectra', data, layoutEinstein); 

