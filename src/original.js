import * as THREE from 'three';
const original = new THREE.ShaderMaterial({
    uniforms: {
        tDepth: { value: null }, // Render target texture
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDepth; // Depth mapa
        varying vec2 vUv;

        void main() {
            float depth = texture2D(tDepth, vUv).r; // Učitavanje dubine
            float rayIntensity = smoothstep(0.1, 0.5, depth); // Manja vrednost = objekat bliži

            gl_FragColor = vec4(vec3(rayIntensity), 1.0); // Blokiranje zraka gde je dubina manja
        }
    `,
    side: THREE.DoubleSide,
});
export default original;