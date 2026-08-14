const C = 1
const t_max = 200; // in picoseconds
const m = 28.96e-3 / 6.022e23;
const M = 10 * m;
const r = 0.16; //nm
const R = 10 * r;
const T = 100; // celsius
const k_B = 1.380649e-23;
const v = Math.sqrt(3 * k_B * (T + 273) / m) / 1000
const V = Math.sqrt(3 * k_B * (T + 373) / M) / 1000
const Kn = 15;

const dt = 0.01 * Kn * r / v
const t_steps = Math.round(t_max / dt);

let NUMBER_OF_PARTICLES = parseInt(document.getElementById('particleCount').value);
let animationId = null;
const VIEW_SIZE = 20;


function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function vecScale(v, s) {
    return { x: v.x * s, y: v.y * s };
}

function vecAdd(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}

function vecSub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}


function collision(p1, p2) {
    let d = distance(p1.position, p2.position);
    let normal = {
        x: (p1.position.x - p2.position.x) / d,
        y: (p1.position.y - p2.position.y) / d
    };
    let totalMass = p1.mass + p2.mass;

    let v_com = {
        x: (p1.mass * p1.velocity.x + p2.mass * p2.velocity.x) / totalMass,
        y: (p1.mass * p1.velocity.y + p2.mass * p2.velocity.y) / totalMass
    };

    let v1_frame = vecSub(p1.velocity, v_com);
    let v2_frame = vecSub(p2.velocity, v_com);

    let v1_frame_n = dot(v1_frame, normal);
    let v2_frame_n = dot(v2_frame, normal);

    let v1_frame_n_after = -v1_frame_n;
    let v2_frame_n_after = -v2_frame_n;

    let v1_frame_after = vecAdd(vecSub(v1_frame, vecScale(normal, v1_frame_n)), vecScale(normal, v1_frame_n_after));
    let v2_frame_after = vecAdd(vecSub(v2_frame, vecScale(normal, v2_frame_n)), vecScale(normal, v2_frame_n_after));

    p1.velocity = vecAdd(v1_frame_after, v_com);
    p2.velocity = vecAdd(v2_frame_after, v_com);
}

function generate_step(x, y) {
    const direction = Math.random() * 2 * Math.PI;
    const newx = x + Math.cos(direction);
    const newy = y + Math.sin(direction);
    return { newx, newy };
}

class Particle {
    constructor(x, y) {
        this.position = { x: x, y: y };
        this.velocity = { x: 0, y: 0 };

        this.radius = 0.3;
        this.mass = 1;
        this.hasCollided = false;

        this.path = new Float64Array((t_steps + 1) * 2);
        this.length = 1;
        this.path[0] = x;
        this.path[1] = y;
    }

    pushPoints(x, y) {
        const idx = this.length * 2;
        this.path[idx] = x;
        this.path[idx + 1] = y;
        this.length++;
    }

    getPoint(idx) {
        return { x: this.path[idx * 2], y: this.path[idx * 2 + 1] };
    }

    randomWalk() {
        const idx = (this.length - 1);
        const currentPos = this.getPoint(idx);
        const { newx, newy } = generate_step(currentPos.x, currentPos.y);

        this.position = { x: newx, y: newy };
        this.pushPoints(newx, newy);
        this.velocity = { x: newx - currentPos.x, y: newy - currentPos.y };
    }

    nextStep() {
        this.position = { x: this.position.x + this.velocity.x, y: this.position.y + this.velocity.y };
        this.pushPoints(this.position.x, this.position.y);
    }

    collisionStep(otherParticle) {
        let { newx, newy } = generate_step(this.position.x, this.position.y);
        while (distance({ x: newx, y: newy }, otherParticle.position) < this.radius + otherParticle.radius) {
            ({ newx, newy } = generate_step(this.position.x, this.position.y));
        }

        this.pushPoints(newx, newy);
        this.velocity = { x: newx - this.position.x, y: newy - this.position.y };
        this.position = { x: newx, y: newy };
    }

    getXs() {
        const xs = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            xs[i] = this.path[i * 2];
        }
        return xs;
    }

    getYs() {
        const ys = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            ys[i] = this.path[i * 2 + 1];
        }
        return ys;
    }
}

class bigParticle extends Particle {
    constructor(x, y) {
        super(x, y);
        this.radius = 1;
        this.mass = 2;
    }

    nextStep() {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        this.pushPoints(this.position.x, this.position.y);
    }
}

function isColliding(p1, p2) {
    return distance(p1.position, p2.position) < p1.radius + p2.radius;
}


function runSimulation() {

    //CREATE PARTICLES
    let bigP = new bigParticle(0, 0);
    let particles = new Array(NUMBER_OF_PARTICLES);

    for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
        let x = Math.random() * VIEW_SIZE - VIEW_SIZE / 2;
        let y = Math.random() * VIEW_SIZE - VIEW_SIZE / 2;

        while (distance({ x: x, y: y }, bigP.position) < bigP.radius + 0.5) {
            x = Math.random() * VIEW_SIZE - VIEW_SIZE / 2;
            y = Math.random() * VIEW_SIZE - VIEW_SIZE / 2;
        }

        let particle = new Particle(x, y);
        particles[i] = particle;
    }


    // MAIN LOOP HERE

    let t = 0
    let t_t = 0

    for (let i = 0; i < t_steps; i++) {
        //document.getElementById('stepCount').textContent = i;
        for (const particle of particles) {
            if (isColliding(particle, bigP)) {
                console.log("collision detected at step", i, "with particle", particle);
                collision(particle, bigP);
                particle.collisionStep(bigP);
                particle.hasCollided = true;
            }
        }

        for (const particle of particles) {
            if (!particle.hasCollided) {
                particle.randomWalk();
            } else {
                particle.hasCollided = false;
            }
        }

        bigP.nextStep();
    }

    function generateMore() {
        const data = []
        for (const particle of particles) {
            let x = particle.getXs()
            let y = particle.getYs()
            data.push({
                x: x,
                y: y,
                mode: 'lines',
                name: 'path',
                line: { width: 2 }
            })
        }
        return data
    }
    let layout = {
        xaxis: {
            title: { text: 'X Position' },
            range: [-VIEW_SIZE, VIEW_SIZE]
        },
        yaxis: {
            title: { text: 'Y Position' },
            range: [-VIEW_SIZE, VIEW_SIZE]
        },
        showlegend: true
    }



    return {
        particles: particles,
        bigP: bigP,
        layout: layout
    }
}

// animating blelow ==================================
function playAnimation(simulation) {

    const markerX = new Array(NUMBER_OF_PARTICLES);
    const markerY = new Array(NUMBER_OF_PARTICLES);
    const { particles, bigP, layout } = simulation;

    for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
        const p = particles[i].getPoint(0);
        markerX[i] = p.x;
        markerY[i] = p.y;
    }

    const bigPt = bigP.getPoint(0);
    //Plotly.purge('brownianMotion');
    Plotly.newPlot('brownianMotion', [
        {
            x: markerX,
            y: markerY,
            mode: 'markers',
            name: 'Particles',
            marker: {
                size: particles[0].radius * 20,
                color: 'rgba(0, 0, 0, 0)',
                line: { color: 'red', width: 2 }
            }
        },
        {
            x: [bigPt.x],
            y: [bigPt.y],
            mode: 'markers',
            name: 'big particle',
            marker: {
                size: bigP.radius * 20,
                color: 'rgba(0, 255, 0, 0.2)',
                line: { color: 'green', width: 3 }
            }
        },
        {
            x: [bigPt.x],
            y: [bigPt.y],
            mode: 'lines',
            name: 'big particle path',
            line: { width: 3, color: 'green' }
        }
    ], layout)


    let step = 0;

    function frame() {
        if (step >= t_steps) return;

        for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
            const p = particles[i].getPoint(step);
            markerX[i] = p.x;
            markerY[i] = p.y;
        }

        const bigPt = bigP.getPoint(step);

        Plotly.restyle('brownianMotion', {
            x: [markerX, [bigPt.x]],
            y: [markerY, [bigPt.y]]
        }, [0, 1]);

        Plotly.extendTraces('brownianMotion', {
            x: [[bigPt.x]],
            y: [[bigPt.y]]
        }, [2]);
        console.log("frame", step);
        step++;

        animationId = requestAnimationFrame(frame);
    }
    animationId = requestAnimationFrame(frame);
}


sim = runSimulation();
playAnimation(sim);

function restart() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    NUMBER_OF_PARTICLES = parseInt(document.getElementById('particleCount').value);
    sim = runSimulation();
    playAnimation(sim);
}