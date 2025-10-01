// Basic setup for Three.js and Cannon.js physics for the bike racing game

let scene, camera, renderer;
let world, bikeBody, groundBody;
let bikeMesh, groundMesh;
let speed = 0;
let score = 0;
let level = 1;
let coinsCollected = 0;
let isAccelerating = false;
let isBraking = false;
let controlsEnabled = false;

const ACCELERATION = 0.05;
const BRAKE_DECELERATION = 0.1;
const MAX_SPEED = 2;
const TURN_SPEED = 0.03;

const coinMeshes = [];
const coins = [];

const obstacles = [];
const ramps = [];

const clock = new THREE.Clock();

const loader = new THREE.TextureLoader();

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let backgroundMusic, engineSound;

init();
animate();

function init() {
    // Three.js scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Cannon.js physics world
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Ground
    const groundShape = new CANNON.Plane();
    groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    scene.add(groundMesh);

    // Bike
    const bikeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.3, 1));
    bikeBody = new CANNON.Body({ mass: 5 });
    bikeBody.addShape(bikeShape);
    bikeBody.position.set(0, 1, 0);
    bikeBody.angularDamping = 0.5;
    world.addBody(bikeBody);

    const bikeGeometry = new THREE.BoxGeometry(1, 0.6, 2);
    const bikeMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    bikeMesh = new THREE.Mesh(bikeGeometry, bikeMaterial);
    scene.add(bikeMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Coins
    createCoins();

    // Obstacles and ramps
    createObstaclesAndRamps();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    document.getElementById('accelerate').addEventListener('touchstart', () => { isAccelerating = true; }, false);
    document.getElementById('accelerate').addEventListener('touchend', () => { isAccelerating = false; }, false);
    document.getElementById('brake').addEventListener('touchstart', () => { isBraking = true; }, false);
    document.getElementById('brake').addEventListener('touchend', () => { isBraking = false; }, false);

    // Keyboard fallback controls
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);

    // Device orientation for tilt controls
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, true);
        controlsEnabled = true;
    }

    // Start background music
    loadAudio();

    // Show main menu
    showMenu();
}

function createCoins() {
    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
    const coinMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });

    for (let i = 0; i < 20; i++) {
        const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
        coinMesh.position.set(Math.random() * 50 - 25, 0.5, -i * 10 - 10);
        coinMesh.rotation.x = Math.PI / 2;
        scene.add(coinMesh);
        coinMeshes.push(coinMesh);

        // For collision detection
        coins.push({
            mesh: coinMesh,
            collected: false,
            radius: 0.5
        });
    }
}

function createObstaclesAndRamps() {
    // Simple obstacles as boxes
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

    for (let i = 0; i < 10; i++) {
        const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacleMesh.position.set(Math.random() * 20 - 10, 0.5, -i * 15 - 20);
        scene.add(obstacleMesh);
        obstacles.push(obstacleMesh);
    }

    // Simple ramps as inclined planes
    const rampGeometry = new THREE.BoxGeometry(3, 0.5, 5);
    const rampMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });

    for (let i = 0; i < 5; i++) {
        const rampMesh = new THREE.Mesh(rampGeometry, rampMaterial);
        rampMesh.position.set(Math.random() * 20 - 10, 0.25, -i * 30 - 40);
        rampMesh.rotation.x = -Math.PI / 6;
        scene.add(rampMesh);
        ramps.push(rampMesh);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let tiltX = 0;

function handleOrientation(event) {
    // gamma is the left-to-right tilt in degrees, range [-90,90]
    tiltX = event.gamma ? THREE.MathUtils.clamp(event.gamma / 45, -1, 1) : 0;
}

function onKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            isAccelerating = true;
            break;
        case 'ArrowDown':
            isBraking = true;
            break;
        case 'ArrowLeft':
            tiltX = -1;
            break;
        case 'ArrowRight':
            tiltX = 1;
            break;
    }
}

function onKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp':
            isAccelerating = false;
            break;
        case 'ArrowDown':
            isBraking = false;
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            tiltX = 0;
            break;
    }
}

function updatePhysics(delta) {
    // Update speed
    if (isAccelerating) {
        speed += ACCELERATION;
    } else if (isBraking) {
        speed -= BRAKE_DECELERATION;
    } else {
        speed -= ACCELERATION / 2; // natural deceleration
    }
    speed = THREE.MathUtils.clamp(speed, 0, MAX_SPEED);

    // Update bike velocity forward
    const forward = new CANNON.Vec3(0, 0, -1);
    bikeBody.velocity.x = forward.x * speed * 10;
    bikeBody.velocity.z = forward.z * speed * 10;

    // Steering with tiltX
    bikeBody.angularVelocity.y = -tiltX * TURN_SPEED * 10;

    // Step physics world
    world.step(delta);

    // Sync bike mesh with physics body
    bikeMesh.position.copy(bikeBody.position);
    bikeMesh.quaternion.copy(bikeBody.quaternion);
}

function updateCamera() {
    // Camera follows bike from behind and above
    const relativeCameraOffset = new THREE.Vector3(0, 5, -10);
    const cameraOffset = relativeCameraOffset.applyQuaternion(bikeMesh.quaternion).add(bikeMesh.position);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(bikeMesh.position);
}

function checkCoinCollection() {
    coins.forEach(coin => {
        if (!coin.collected) {
            const dist = coin.mesh.position.distanceTo(bikeMesh.position);
            if (dist < coin.radius + 1) {
                coin.collected = true;
                scene.remove(coin.mesh);
                coinsCollected++;
                score += 10;
                updateHUD();
            }
        }
    });
}

function updateHUD() {
    document.getElementById('speed').textContent = `Speed: ${(speed * 50).toFixed(0)} km/h`;
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('level').textContent = `Level: ${level}`;
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (controlsEnabled) {
        updatePhysics(delta);
        updateCamera();
        checkCoinCollection();
    }

    renderer.render(scene, camera);
}

function loadAudio() {
    // Background music
    const bgAudio = new Audio('assets/audio/background-music.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.3;
    bgAudio.play().catch(() => { /* Autoplay might be blocked */ });

    // Engine sound placeholder
    // For simplicity, not implemented here
}

function showMenu() {
    const menu = document.getElementById('menu');
    menu.classList.remove('hidden');

    document.getElementById('start-game').addEventListener('click', () => {
        menu.classList.add('hidden');
        controlsEnabled = true;
    });

    // TODO: Implement bike selection and leaderboard
}
