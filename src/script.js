import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'

import { CustomPass } from './shader/postProcessing/customPass.js'

import noiseVertex from './shader/distortion/vertex.glsl'
import noiseFragment from './shader/distortion/fragment.glsl'
import WaterTexture from './post-processing/WaterTexture.js'

import renderTargetVertex from './shader/renderTarget/vertex.glsl'
import renderTargetFragment from './shader/renderTarget/fragment.glsl'

import gsap from 'gsap'

// Fluid
const waterTexture = new WaterTexture();

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const mainScene = new THREE.Scene()
const scene1 = new THREE.Scene()
const scene2 = new THREE.Scene()

/**
 * Test mesh
 */
// Geometry
const textureGeometry = new THREE.PlaneGeometry(2.5, 2.5, 128, 128)

// Material
const material1 = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms:{
        uTime: new THREE.Uniform(0),
        uResolution: new THREE.Uniform(new THREE.Vector4()),
        uColor1: new THREE.Uniform(new THREE.Color('rgb(100%, 95%, 24%)')),
        uColor2: new THREE.Uniform(new THREE.Color('rgb(82%, 82%, 100%)')),
        uColor3: new THREE.Uniform(new THREE.Color('rgb(100%, 15%, 65%)')),
        uColor4: new THREE.Uniform(new THREE.Color('rgb(0%, 76%, 100%)')),
    },
    vertexShader: noiseVertex,
    fragmentShader: noiseFragment
})
material1.needsUpdate = true;

const material2 = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms:{
        uTime: new THREE.Uniform(0),
        uResolution: new THREE.Uniform(new THREE.Vector4()),
        uColor1: new THREE.Uniform(new THREE.Color('rgb(100%, 29%, 20%)')),
        uColor2: new THREE.Uniform(new THREE.Color('rgb(100%, 67%, 90%)')),
        uColor3: new THREE.Uniform(new THREE.Color('rgb(64%, 18%, 100%)')),
        uColor4: new THREE.Uniform(new THREE.Color('rgb(96%, 100%, 48%)')),
    },
    vertexShader: noiseVertex,
    fragmentShader: noiseFragment
})
material2.needsUpdate = true;

// Mesh
const mesh1 = new THREE.Mesh(textureGeometry, material1)
scene1.add(mesh1)

const mesh2 = new THREE.Mesh(textureGeometry, material2)
scene2.add(mesh2)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const imageAspect = 1;

let a1
let a2

if(sizes.height/sizes.width > imageAspect){
    a1 = (sizes.width/sizes.height) * imageAspect
    a2 = 1
} else {
    a1 = 1
    a2 = (sizes.height/sizes.width) * imageAspect
}

material1.uniforms.uResolution.value.x = sizes.width
material1.uniforms.uResolution.value.y = sizes.height
material1.uniforms.uResolution.value.z = a1
material1.uniforms.uResolution.value.w = a2

material2.uniforms.uResolution.value.x = sizes.width
material2.uniforms.uResolution.value.y = sizes.height
material2.uniforms.uResolution.value.z = a1
material2.uniforms.uResolution.value.w = a2

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    const imageAspect = 1;

    let a1
    let a2

    if(sizes.height/sizes.width > imageAspect){
        a1 = (sizes.width/sizes.height) * imageAspect
        a2 = 1
    } else {
        a1 = 1
        a2 = (sizes.height/sizes.width) * imageAspect
    }

    material1.uniforms.uResolution.value.x = sizes.width
    material1.uniforms.uResolution.value.y = sizes.height
    material1.uniforms.uResolution.value.z = a1
    material1.uniforms.uResolution.value.w = a2
    
    material2.uniforms.uResolution.value.x = sizes.width
    material2.uniforms.uResolution.value.y = sizes.height
    material2.uniforms.uResolution.value.z = a1
    material2.uniforms.uResolution.value.w = a2

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const mainCamera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, .1, 10)
mainCamera.position.set(0, 0, 2)
mainScene.add(mainCamera)

const camera1 = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, .1, 10)
camera1.position.set(0, 0, 2)
scene1.add(camera1)

const camera2 = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, .1, 10)
camera2.position.set(0, 0, 2)
scene2.add(camera2)

const scene1Pass = new RenderPass(scene1, camera1);
const scene2Pass = new RenderPass(scene2, camera2);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Render Target
 */
const fovY = mainCamera.getFilmHeight() / mainCamera.getFocalLength()

const renderTarget1 = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
    samples: window.devicePixelRatio === 1 ? 2 : 0,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false
})

const renderTarget2 = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
    samples: window.devicePixelRatio === 1 ? 2 : 0,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false
})

const renderPlaneGeometry = new THREE.PlaneGeometry(2, 2)
const renderPlaneMaterial = new THREE.ShaderMaterial({
    vertexShader: renderTargetVertex,
    fragmentShader: renderTargetFragment,
    uniforms: {
        uFromTexture: new THREE.Uniform(),
        uToTexture: new THREE.Uniform(),
        uImageSize: new THREE.Uniform(new THREE.Vector2(sizes.width, sizes.height)),
        uPlaneSize: new THREE.Uniform(new THREE.Vector2(fovY * mainCamera.aspect, fovY)),
        uTransition: new THREE.Uniform(0)
    },
})
renderPlaneMaterial.needsUpdate = true;

const renderPlane = new THREE.Mesh(renderPlaneGeometry, renderPlaneMaterial)

renderPlane.renderOrder = -1;
mainScene.add(renderPlane)

let currentPass;

function swapTexture(to) {
    let textureMap = {
        scene1: renderTarget1.texture,
        scene2: renderTarget2.texture
    }

    if (!currentPass) {
        currentPass = textureMap['scene1']
        renderPlaneMaterial.uniforms.uFromTexture.value = currentPass
        renderPlaneMaterial.uniforms.uTransition.value = 0
        return
    }

    if (currentPass === to) return
    currentPass = to

    renderPlaneMaterial.uniforms.uToTexture.value = textureMap[to]
    gsap.to(renderPlaneMaterial.uniforms.uTransition, {
        value: 1,
        duration: 1,
        onComplete: () => {
            renderPlaneMaterial.uniforms.uFromTexture.value = textureMap[to]
            renderPlaneMaterial.uniforms.uTransition.value = 0
        }
    })
}

swapTexture()

let button1 = document.getElementById('scene1')
let button2 = document.getElementById('scene2')

button1.addEventListener('click', () => {
    swapTexture('scene1')
})
button2.addEventListener('click', () => {
    swapTexture('scene2')
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    material1.uniforms.uTime.value = elapsedTime
    material2.uniforms.uTime.value = elapsedTime

    // Render
    renderer.setRenderTarget(renderTarget1)
    renderer.render(scene1, camera1)
    renderer.setRenderTarget(renderTarget2)
    renderer.render(scene2, camera2)
    renderer.setRenderTarget(null)
    renderer.render(mainScene, mainCamera);
    // composer1.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()