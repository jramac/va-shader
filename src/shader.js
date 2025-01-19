import * as THREE from 'three';
const emissiveMaterial = new THREE.ShaderMaterial({
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
    `,
    side: THREE.DoubleSide,
});
export default emissiveMaterial;