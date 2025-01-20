import * as THREE from 'three';
import { EffectComposer, RectAreaLightHelper, RectAreaLightUniformsLib, RenderPass, ShaderPass } from 'three/examples/jsm/Addons.js';
import shader from './shader.js'
import { GodRaysFakeSunShader } from 'three/examples/jsm/shaders/GodRaysShader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshNormalMaterial();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const composer =  new EffectComposer(renderer);
const renderPass = new RenderPass(scene,camera);
composer.addPass(renderPass);
//--------> light spill <---------
const godraysFakeSunShader = GodRaysFakeSunShader;

const godraysFakeSunUniforms = {
    bgColor: 0x000005,
    sunColor: 0x110005 
};

const materialGodraysFakeSun = new THREE.ShaderMaterial( {

    uniforms: godraysFakeSunUniforms,
    vertexShader: godraysFakeSunShader.vertexShader,
    fragmentShader: godraysFakeSunShader.fragmentShader

} );

const cube = new THREE.Mesh( geometry, materialGodraysFakeSun );
scene.add( cube );

const shaderPass = new ShaderPass(godraysFakeSunShader);
//composer.addPass(shaderPass);




camera.position.z = 5;

function animate() {
    
    cube.rotation.x += 0.001;
    requestAnimationFrame(animate)
    composer.render(scene,camera);

}
 animate();
