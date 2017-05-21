'use strict';

const THREE = require("three");
const OrbitControls = require('three-orbit-controls')(THREE);
const CSG = require('./csg.js');

const clock = new THREE.Clock();
let scene, renderer, camera, controls;

let cube;

let init = () => {

    //boilerplate
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x333333);
    document.querySelector("#container").appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        3000
    );
    scene.add(camera);
    camera.position.set(0, 0, 5);
    controls = new OrbitControls(camera);
    //le Cube
    buildCube();
}

let randomDirection = () => {
    let n = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
    n.normalize();
    return n;
}

let buildCube = () => {
    let csg = CSG.cube(3);

    let cuts = Math.random()*50 + 5;
    for (var i = 0; i < cuts; ++i) {
        let n = randomDirection();
        let mesh = CSG.plane(
            n.clone().multiplyScalar(Math.random()*0.25 + 1),
            n,
            10);

        csg = csg.subtract(mesh);
    }

    let geom = csg.toThree();

    let material = new THREE.MeshNormalMaterial();
    material.side = THREE.DoubleSide;
    cube = new THREE.Mesh(geom, material);
    scene.add(cube);
}

let render = () => {
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    cube.rotation.x += .001;
    cube.rotation.y += .001;
}

init();
render();

//helpers
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
