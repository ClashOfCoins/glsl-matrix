import * as PIXI from 'pixi.js';

const vert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;
uniform float uScale;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord * uScale;

}`;

const frag = `
varying vec2 vTextureCoord;
uniform vec4 uBackgroundColor;
uniform vec4 uRainColor;
uniform float uCount;
uniform vec2 uTextureSize;
uniform float uTime;
uniform float uTrail;
uniform float uSpeed;

uniform sampler2D uSampler;

float random(vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233))) * 43758.5453123);
}

float text(vec2 uv) {
    float tileSize = 16.;
    vec2 dim = tileSize / uTextureSize;

    vec2 fragCoord = uv * uTextureSize;
    vec2 localUV = mod(fragCoord.xy, tileSize) * dim;
    vec2 block = fragCoord * dim - localUV;

    localUV += floor((random(block / uTextureSize) + uTime * 0.1) * tileSize);
    localUV *= dim;

    return texture2D(uSampler, localUV).r;
}


float rain(vec2 uv) {
    vec2 fragCoord = uv * uTextureSize;

    fragCoord -= mod(fragCoord, 16.);

    float offset = sin(fragCoord.x * 10.);
    float y = fract(-uv.y + offset + uSpeed * uTime);

    float trailFactor = 1. / (y * uTrail);

    return clamp(0., 1., trailFactor);
}


void main(void)
{
    vec2 uv = vTextureCoord;

    float rainFactor = rain(uv);
    float textFactor = text(uv);

    gl_FragColor = mix(uBackgroundColor, uRainColor, rainFactor * textFactor);
}
`;

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
});
document.body.appendChild(app.view);

const texture = PIXI.Texture.from('captureFont.png');
texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;

const material = new PIXI.MeshMaterial(texture, {
  program: PIXI.Program.from(vert, frag),
  uniforms: {
    uTextureSize: [256, 128],
    uRainColor: [0.95, 1, 0.95, 1],
    uBackgroundColor: [0, 0.25, 0.05, 1],
    uTime: 0,
    uScale: 2,
    uTrail: 3 + 4 * Math.random(),
    uSpeed: 0.5 + Math.random(),
  },
});

const geometry = new PIXI.Geometry()
  .addAttribute('aVertexPosition', [-1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1])
  .addAttribute('aTextureCoord', [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);

const mesh = new PIXI.Mesh(geometry, material);
mesh.position.set(app.view.width / 2, app.view.height / 2);
mesh.scale.set(200);

app.stage.addChild(mesh);

app.ticker.add((delta) => {
  material.uniforms.uTime = performance.now() * 0.001;
});
