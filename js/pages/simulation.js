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

const h = 6.62607015e-34;
const h_ev = 4.135667696e-15;
const e = 1.602176634e-19;
const c = 2.99792458e8;

function stoppingPotential(frequency, workFunction) {
    return (h / e) * frequency - workFunction;
}

function frequency_from_wavelength(wavelengthNm) {
    return c / (wavelengthNm * 1e-9);
}

function photonEnergyEV(wavelengthNm) {
    return h_ev * frequency_from_wavelength(wavelengthNm);
}

function stoppingVoltage(wavelengthNm, workFunction) {
    return stoppingPotential(frequency_from_wavelength(wavelengthNm), workFunction);
}
function wavelengthToRGB(wavelength) {
    let r, g, b;
    if (wavelength >= 380 && wavelength < 440) {
        r = -(wavelength - 440) / (440 - 380);
        g = 0;
        b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
        r = 0;
        g = (wavelength - 440) / (490 - 440);
        b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
        r = 0;
        g = 1;
        b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1;
        b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
        r = 1;
        g = -(wavelength - 645) / (645 - 580);
        b = 0;
    } else if (wavelength >= 645 && wavelength <= 780) {
        r = 1;
        g = 0;
        b = 0;
    } else {
        r = 0.95;
        g = 0.95;
        b = 0.95;
    }

    return {r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255)};
}

state = {
    voltage: 0,
    wavelength: 400,
    intensity: 50,
    colour: {r: 255, g: 0, b: 0},
    workFunction: 4.3
}

const materials = document.getElementById("material")
for (const el of elements) {
    const option = document.createElement("option")
    option.value = el[1]
    option.textContent = el[0]
    materials.appendChild(option)
}

document.getElementById("voltage").addEventListener("input", function (event) {
    state.voltage = +event.target.value
    updateValues()
})
document.getElementById("wavelength").addEventListener("input", function (event) {
    state.wavelength = +event.target.value
    updateValues()
})
document.getElementById("intensity").addEventListener("input", function (event) {
    state.intensity = +event.target.value
    updateValues()
})
document.getElementById("material").addEventListener("change", function (event) {
    state.workFunction = +event.target.value
    updateValues()
})

function updateValues() {
    document.getElementById("voltageVal").textContent = state.voltage + " V"
    document.getElementById("wavelengthVal").textContent = state.wavelength + " nm"
    document.getElementById("intensityVal").textContent = state.intensity + "%"

    document.getElementById("photonEnergy").textContent = photonEnergyEV(state.wavelength).toFixed(2)
    stoppingV = stoppingVoltage(state.wavelength, state.workFunction)
    if (stoppingV < 0) {
        document.getElementById("stoppingVoltage").textContent = "N/A"
    } else {
        document.getElementById("stoppingVoltage").textContent = stoppingV.toFixed(2)
    }
    document.getElementById("workFunction").textContent = state.workFunction

    state.colour = wavelengthToRGB(state.wavelength)
}

updateValues()


const canvas = document.getElementById("sim");
const ctx = canvas.getContext('2d');
const CW = canvas.width, CH = canvas.height;
const cathodeX = 260, anodeX = 760, plateTop = 90, plateBottom = 340;
const lampX = 70, lampY = (plateTop + plateBottom) / 2;

let electrons = [];
let frame = 0;

function drawPlate(x) {
    ctx.save();
    ctx.fillStyle = 'rgba(151, 151, 151, 0.5)';
    ctx.fillRect(x - 7, plateTop, 14, plateBottom - plateTop);
    ctx.restore();
}

function drawLamp() {
    const rgb = state.colour;
    ctx.save();
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
    ctx.beginPath(); ctx.arc(lampX, lampY, 9, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${0}, ${0}, ${0}, 0.8)`;
    ctx.beginPath(); ctx.arc(lampX, lampY, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

function drawElectrons() {
    ctx.save();
    for (const el of electrons) {
        ctx.fillStyle = el.turned ? 'rgba(255,123,114,0.85)' : 'rgba(95,212,224,0.95)';
        ctx.shadowColor = el.turned ? '#ff7b72' : '#5fd4e0';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function spawnElectron() {
    ke = photonEnergyEV(state.wavelength) - state.workFunction;
    if (ke <= 0) { return }
    const u = Math.random();
    electrons.push({
        x: cathodeX + 4,
        y: Math.random() * (plateBottom - plateTop - 6) + plateTop + 3,
        u: u,
        v: undefined,
        t: 0,
        turned: false
    });

}

let currentEvents = []
let simtime = 0
const sampleWindow = 1

function stepElectrons(dt) {
    const ke = photonEnergyEV(state.wavelength) - state.workFunction;
    const voltage = state.voltage;
    const d = anodeX - cathodeX;

    const speedScale = 100;
    const accelScale = (speedScale ** 2) / (2 * d);
    const a = accelScale * voltage;

    const next = []
    for (const el of electrons) {
        const eEnergy = ke * el.u;
        if (el.v === undefined) {
            el.v = speedScale * Math.sqrt(eEnergy);
        }

        el.v += a * dt;
        el.x += el.v * dt;
        el.t += dt;

        if (el.v <= 0) {
            el.turned = true
        } else {
            el.turned = false
        }

        if (el.x >= anodeX - 6) {
            currentEvents.push(simtime)
            continue;
        }
        if (el.x <= cathodeX + 2 && el.v <= 0) continue;
        if (el.t > 600) continue;
        next.push(el);
    }
    electrons = next;
}

function updateCurrent(dt) {
    simtime += dt
    while (currentEvents.length > 0 && currentEvents[0] < simtime - sampleWindow) {
        currentEvents.shift()
    }
    document.getElementById("current").textContent = ((currentEvents.length / sampleWindow) * e * 1e18).toFixed(2)
}
function drawBeam() {
    ctx.save();
    ctx.fillStyle = `rgba(${state.colour.r}, ${state.colour.g}, ${state.colour.b}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(lampX, lampY);           
    ctx.lineTo(cathodeX - 7, plateTop);      
    ctx.lineTo(cathodeX - 7, plateBottom);   
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawStage() {
    ctx.clearRect(0, 0, CW, CH);
    drawLamp();
    drawBeam();
    drawPlate(cathodeX);
    drawPlate(anodeX);
    drawElectrons();
}



function tick(timestamp) {
    frame++;
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    const ke = photonEnergyEV(state.wavelength) - state.workFunction;
    if (ke > 0) {
        const rate = Math.max(1, Math.round(25 - state.intensity * 0.2));
        const count = 1 + Math.floor(state.intensity / 45);
        if (frame % rate === 0) {
            for (let i = 0; i < count; i++) spawnElectron();
        }
    }
    stepElectrons(dt);
    updateCurrent(dt);
    drawStage();
    requestAnimationFrame(tick);
}

updateValues();
let lastTime = null;
requestAnimationFrame(tick);