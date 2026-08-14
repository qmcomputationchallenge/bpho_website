const TWO_PI = Math.PI * 2;
const COLOURS = [
    '#E63946', '#457B9D', '#2A9D8F', '#E9C46A', '#F4A261',
    '#6A4C93', '#F77F00', '#06D6A0', '#118AB2', '#EF476F',
    '#B5838D', '#4CC9F0', '#80B918', '#FF6B6B', '#A8DADC',
    '#FFD166', '#118AB2', '#06D6A0', '#073B4C', '#FF9F1C'];

class Particle {
    constructor(steps) {
        this.path = new Float64Array((steps + 1) * 2);
        this.length = 1;
        this.colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
    }

    randomWalk() {
        const path = this.path;
        const idx = (this.length - 1) * 2;
        const x = path[idx];
        const y = path[idx + 1];
        const direction = Math.random() * TWO_PI;
        path[idx + 2] = x + Math.cos(direction);
        path[idx + 3] = y + Math.sin(direction);
        this.length++;
    }

    getXs() {
        const xs = new Array(this.length);
        for (let i = 0; i < this.length; i++) xs[i] = this.path[i * 2];
        return xs;
    }

    getYs() {
        const ys = new Array(this.length);
        for (let i = 0; i < this.length; i++) ys[i] = this.path[i * 2 + 1];
        return ys;
    }
}

function generateParticles(n, steps) {
    const particles = new Array(n);
    for (let i = 0; i < n; i++) {
        const p = new Particle(steps);
        for (let j = 0; j < steps; j++) {
            p.randomWalk();
        }
        particles[i] = p;
    }
    return particles;
}

function generateData(particles) {
    const data = new Array(particles.length);

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        data[i] = {
            x: p.getXs(),
            y: p.getYs(),
            mode: 'lines',
            line: { color: p.colour, width: 2 },
        }
    }
    return data;
}
let particles = generateParticles(document.getElementById('particleCount').value, document.getElementById('stepCountInput').value);
let data = generateData(particles);

let layout = {
    xaxis: { range: [-50, 50] },
    yaxis: { range: [-50, 50] },
    showlegend: false
};

Plotly.newPlot('randomWalk', data, layout);

function restart() {
    particles = generateParticles(document.getElementById('particleCount').value, document.getElementById('stepCountInput').value);
    data = generateData(particles);

    Plotly.newPlot('randomWalk', data, layout);
}


