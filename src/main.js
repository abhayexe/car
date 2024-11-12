import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';



// Canvas and Renderer
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pathTracer = new WebGLPathTracer(renderer);


// Scene and Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, -35);
camera.position.set(5, 5, 5);

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Skybox
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
skyGeometry.scale(-1, 1, 1);
const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('textures/buildings.png');
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.FrontSide });
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
// scene.add(sky);
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
// scene.environment = skyTexture;
// scene.background = skyTexture;
// pathTracer.setEnvironmentMap(skyTexture);

const areaLight1 = new THREE.RectAreaLight(0x38f5b6, 50, 5, 5);
areaLight1.position.set(10, 10, 10);
areaLight1.lookAt(0, 0, 0);
// scene.add(areaLight1);

RectAreaLightUniformsLib.init();

const rectLight1 = new THREE.RectAreaLight( 0xffff00, 5, 4, 10 );
rectLight1.position.set( - 5, 5.5, 5 );
rectLight1.lookAt(0, 0, 0); 
scene.add( rectLight1 );

const rectLight2 = new THREE.RectAreaLight( 0x00ffff, 5, 4, 10 );
rectLight2.position.set( 0, 5.5, -5 );
rectLight2.lookAt(0, 0, 0); 
scene.add( rectLight2 );

const rectLight3 = new THREE.RectAreaLight( 0xff00ff, 5, 4, 10 );
rectLight3.position.set( 5, 5.5, 5 );
rectLight3.lookAt(0, 0, 0); 
scene.add( rectLight3 );

scene.add( new RectAreaLightHelper( rectLight1 ) );
scene.add( new RectAreaLightHelper( rectLight2 ) );
scene.add( new RectAreaLightHelper( rectLight3 ) );

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, .2);
// scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
directionalLight.position.set(50, 200, 75);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(10096, 10096);
directionalLight.shadow.camera.near = 0;
directionalLight.shadow.camera.far = 300;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.bias = -0.01;
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.radius = 0;
// scene.add(directionalLight);

const axesHelper = new THREE.AxesHelper(50); // Size of the axes
// scene.add(axesHelper);
// Red: X-axis
// Green: Y-axis
// Blue: Z-axis
const gridHelper = new THREE.GridHelper(100, 10); // Size and divisions
// scene.add(gridHelper);
const polarGridHelper = new THREE.PolarGridHelper(50, 16, 8, 64);
// scene.add(polarGridHelper);
const cameraHelper = new THREE.CameraHelper(camera);
// scene.add(cameraHelper);
const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(lightHelper);

// Load GLTF Model
const loader = new GLTFLoader();
loader.load('models/gltf/chess.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // child.scale.setScalar(0.005);
      child.material.envMap = skyTexture;
      child.material.envMapIntensity = 0.4; // Adjust intensity as needed
      child.material.needsUpdate = true;
    }
  });
  // scene.add(model);
  pathTracer.setScene(scene, camera);
});

loader.load('models/gltf/maclaren8.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.position.set(0, 0, 0);
      child.scale.setScalar(2);
      child.material.envMap = skyTexture;
      child.material.envMapIntensity = 0; // Adjust intensity as needed
      child.material.needsUpdate = true;
      // child.rotation.z = Math.PI / 2;
      child.layers.enable(1);
    }
  });
  scene.add(model);
  pathTracer.setScene(scene, camera);
});

const geoFloor = new THREE.BoxGeometry( 2000, 0.1, 2000 );
const matStdFloor = new THREE.MeshStandardMaterial( { color: 0xbcbcbc, roughness: 0.1, metalness: 0 } );
const mshStdFloor = new THREE.Mesh( geoFloor, matStdFloor );
// scene.add( mshStdFloor );
let geometry, roughMirror;
geometry = new THREE.PlaneGeometry(100, 100);

roughMirror = new Reflector(geometry, {
  clipBias: 0.003,
  textureWidth: (window.innerWidth * window.devicePixelRatio) / 2, // Lower resolution
  textureHeight: (window.innerHeight * window.devicePixelRatio) / 2,
  color: 0x727272
});

// Position and rotation for horizontal placement
roughMirror.position.set(0, 0, 0);
roughMirror.rotation.x = -Math.PI / 2;

scene.add(roughMirror);





// Post-processing Setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3, // Strength
  0.1, // Radius
  0.35 // Threshold
);
composer.addPass(bloomPass);

// Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
  // pathTracer.renderSample();
}

animate();