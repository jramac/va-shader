import * as THREE from 'three';
import { EffectComposer, MaskPass, RenderPass, ShaderPass } from 'three/examples/jsm/Addons.js';
import emissiveMaterial from './shader.js'
import original from './original.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight,{
    depthTexture: new THREE.DepthTexture(), // Čuva dubinsku informaciju
    depthBuffer: true
  });
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh( geometry, material );

const geometry2= new THREE.BoxGeometry(1,1,1);
const material2 = new THREE.MeshBasicMaterial({color: 0xff0000});
const cube2 = new THREE.Mesh( geometry2, material2 );

cube2.position.set(-2,0,-2);
scene.add( cube );


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2;

const composer =  new EffectComposer(renderer);
const renderPass = new RenderPass(scene,camera);
renderPass.renderToScreen = false; 
composer.addPass(renderPass);
//--------> light spill <---------
const shaderPass = new ShaderPass(original);
//composer.addPass(shaderPass);
scene.add( cube2 );



camera.position.z = 5;

function animate() {
    original.uniforms.tDepth.value = renderPass.depthTexture;
    requestAnimationFrame(animate)

    //controls.update();
    composer.render(scene,camera);

}
animate();
