import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const SpeedVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignetteIntensity: { value: 0.3 },
    vignetteRoundness: { value: 0.8 },
    speedFactor: { value: 0.0 }, // 0.0 (stopped) to 1.0 (terminal velocity)
    boostActive: { value: 0.0 }, // 1.0 when nitro boost pad is triggered
    time: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignetteIntensity;
    uniform float vignetteRoundness;
    uniform float speedFactor;
    uniform float boostActive;
    uniform float time;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 toCenter = uv - center;
      float dist = length(toCenter);

      vec3 color;
      float chroma = (speedFactor * 0.006 + boostActive * 0.014) * smoothstep(0.20, 0.75, dist);

      if (chroma > 0.0002) {
        vec2 rUv = clamp(uv + toCenter * chroma, 0.0, 1.0);
        vec2 bUv = clamp(uv - toCenter * chroma, 0.0, 1.0);
        float r = texture2D(tDiffuse, rUv).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, bUv).b;
        color = vec3(r, g, b);
      } else {
        color = texture2D(tDiffuse, uv).rgb;
      }

      // Speed vignette tunnel effect (darkens outer edges smoothly, pulsing during nitro)
      float targetIntensity = clamp(vignetteIntensity + speedFactor * 0.35 + boostActive * 0.35, 0.0, 0.85);
      float pulse = 1.0 + sin(time * 12.0) * (boostActive * 0.05);
      float vigFactor = smoothstep(0.25, 0.75, dist * pulse);
      color = mix(color, color * (1.0 - targetIntensity), vigFactor);

      // Cyan nitro edge ring effect during turbo boost
      if (boostActive > 0.01) {
        vec3 nitroColor = vec3(0.0, 0.94, 1.0);
        float edge = smoothstep(0.40, 0.80, dist) * boostActive * 0.35;
        color = mix(color, nitroColor, edge);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;

    this.initComposer();
  }

  initComposer() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.composer = new EffectComposer(this.renderer);

    // 1. Scene Render Pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2. Unreal Bloom Pass (selective glow for neon arches, headlights, ghost rider, boost pads)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.55, // strength
      0.38, // radius
      0.88  // threshold: ensures bright daytime sky & hills don't bloom, while high emissive neon glows cleanly
    );
    this.composer.addPass(this.bloomPass);

    // 3. Dynamic Speed Vignette & Chromatic Aberration ShaderPass
    this.vignettePass = new ShaderPass(SpeedVignetteShader);
    this.composer.addPass(this.vignettePass);

    // 4. Output Pass for correct sRGB tone mapping
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  update(dt, speedKmh, maxSpeedKmh, isBoosting, elapsedTime) {
    if (!this.enabled) return;

    const speedRatio = Math.min(1.0, Math.max(0.0, (speedKmh - 15) / Math.max(1, (maxSpeedKmh - 15))));
    const boostRatio = isBoosting ? 1.0 : 0.0;

    const uniforms = this.vignettePass.uniforms;
    uniforms.speedFactor.value = THREE.MathUtils.lerp(uniforms.speedFactor.value, speedRatio, dt * 6.0);
    uniforms.boostActive.value = THREE.MathUtils.lerp(uniforms.boostActive.value, boostRatio, dt * 8.0);
    uniforms.time.value = elapsedTime;

    // Dynamic bloom flare when nitro turbo boost is triggered
    const targetBloom = isBoosting ? 1.15 : 0.65;
    this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, targetBloom, dt * 5.0);
  }

  render() {
    if (this.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setSize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
      this.bloomPass.resolution.set(width, height);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
