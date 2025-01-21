import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light source (the "sun")
const lightSourceGeometry = new THREE.SphereGeometry(1, 32, 32);
const lightSourceMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const lightSource = new THREE.Mesh(lightSourceGeometry, lightSourceMaterial);
lightSource.position.set(0, 1, -5);
scene.add(lightSource);

// A cube that gets illuminated
const emissiveMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff, // Base color
    //emissive: 0xffffff, // Yellow glow
    //emissiveIntensity: 0.2, // Adjust brightness
});
const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
const cube = new THREE.Mesh(cubeGeometry, emissiveMaterial);
cube.position.set(0, 0, 0);
scene.add(cube);

// Add a directional light
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0, 5, 0);
//scene.add(light);

camera.position.z = 5;
camera.position.y = 7;
camera.lookAt(cube.position)

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;


const GodRaysDepthMaskShader = new THREE.ShaderMaterial({
    uniforms: {

		tInput: {
			value: null
		}

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

		 vUv = uv;
		 gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

	 }`,

	fragmentShader: /* glsl */`

		varying vec2 vUv;

		uniform sampler2D tInput;

		void main() {

			gl_FragColor = vec4( 1.0 ) - texture2D( tInput, vUv );

		}`
});

const GodRaysShader = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: null },
        lightPosition: { value: new THREE.Vector2(0.5, 0.5) }, // Light source in screen space
        density: { value: 0.9 },
        weight: { value: 0.5 },
        decay: { value: 0.95 },
        exposure: { value: 0.6 }
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: /* glsl */`
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform vec2 lightPosition;
        uniform float density;
        uniform float weight;
        uniform float decay;
        uniform float exposure;

        float rand(vec2 co){
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 texCoord = vUv;
            vec2 deltaTexCoord = (rand(vUv.yx)*0.3 + ((texCoord - lightPosition) * density)) / 40.0;
            vec4 color = texture2D(tDiffuse, texCoord);
            float illuminationDecay = 1.0;

            for (int i = 0; i < 40; i++) {
                texCoord -= deltaTexCoord;
                vec4 sampleColor = texture2D(tDiffuse, texCoord);
                sampleColor *= illuminationDecay * weight;
                color += sampleColor;
                illuminationDecay *= decay;
            }
            gl_FragColor = color * exposure;
        }`
});

const spill = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: null }, // Render target texture
        time: { value: 0.0 },      // Animation time
        uScale: { value: 1.0 }     // Scale factor
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;  // Rendered scene texture
        uniform float time;          // Time for animation
        varying vec2 vUv;            // UV coordinates
        uniform float uScale;        // Uniform for scaling the texture

        float rand(vec2 co){
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 c = texture2D(tDiffuse, vUv);

            vec2 toCenter = vec2(0.5,0.8)-vUv;

            vec4 original = c;

            c += texture2D(tDiffuse, vUv + toCenter*0.1);

            vec4 color = vec4(0.0);

            float total = 0.0;
            for(float i = 0.; i < 40.; i++){
                float lerp = (i + rand(vec2(vUv)))/40.;
                float weight = cos(lerp*3.1415926/2.);
                vec4 mysample = texture2D(tDiffuse,vUv + toCenter*lerp*0.6);
                mysample.rgb *= mysample.a;
                color += mysample*weight;
                total += weight;
            }
            color.a = 1.0;
            color.rgb /= 4.;

            vec4 finalColor = 1. - (1.-color)*(1.-original);
            gl_FragColor = finalColor;
        }
    `
});

function updateLightPosition() {
    const lightScreenPosition = new THREE.Vector3();
    lightSource.position.clone().project(camera);
    godRaysPass.uniforms.lightPosition.value.set(
        (lightScreenPosition.x + 1) / 2, // Convert from [-1,1] to [0,1]
        (lightScreenPosition.y + 1) / 2
    );
}

const composer = new EffectComposer(renderer);

// Render scene normally
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const lightSpill = new ShaderPass(spill);
composer.addPass(lightSpill);

// Apply the depth mask shader
const depthMaskPass = new ShaderPass(GodRaysDepthMaskShader);
//composer.addPass(depthMaskPass);

const godRaysPass = new ShaderPass(GodRaysShader);
//composer.addPass(godRaysPass);

// Add a bloom effect to enhance brightness
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.6, // Strength
    0.4, // Radius
    0.85 // Threshold
);
//composer.addPass(bloomPass);

// -------GRID HELPER--------

// const gridHelper = new THREE.GridHelper(10, 10); // Size: 10, Divisions: 10
// scene.add(gridHelper);

// -------/GRID HELPER--------
function animate() {
    requestAnimationFrame(animate);
    updateLightPosition();
    controls.update();
    composer.render();
}
animate();
