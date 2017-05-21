'use strict';

const THREE = require("three");

function Clipper(mesh) {
    this.planes = [];
    for (var i = 0; i < mesh.faces.length; ++i) {
        this.planes.push(mesh.faces[i].toPlane());
    }
}

Clipper.prototype.flip = function() {
    for (var i = 0; i < this.planes.length; ++i) {
        this.planes[i].negate();
    }
    return this;
}

function Polygon(vertices) {
    this.vertices = vertices;
}

Polygon.prototype.flip = function() {
    this.vertices = this.vertices.reverse();
    return this;
}

Polygon.prototype.toPlane = function() {
    let a = this.vertices[0];
    let b = this.vertices[1];
    let c = this.vertices[2];

    let plane = new THREE.Plane();
    plane.setFromCoplanarPoints(a, b, c);

    return plane;
}

Polygon.prototype.clip = function(clipper) {
    var p = this;
    for (var i = 0; i < clipper.planes.length; ++i) {
        p = p.clipToPlane(clipper.planes[i]);
    }
    return p;
}

Polygon.prototype.clipToPlane = function(plane) {
    let front = [];

    for (var i = 0; i < this.vertices.length; ++i) {
        let a = this.vertices[i];
        let b = this.vertices[(i+1) % this.vertices.length];

        let fa = plane.distanceToPoint(a) > 0;
        let fb = plane.distanceToPoint(b) > 0;

        if (fa) {
            front.push(a);
        }
        if (fa != fb) {
            front.push(plane.intersectLine(new THREE.Line3(a, b)));
        }
    }

    return new Polygon(front);
}

function Mesh(faces) {
    this.faces = faces;
}

Mesh.prototype.subtract = function(mesh) {
    let a = new Clipper(mesh).flip();
    let b = new Clipper(this).flip();

    let front = [];

    for (var i = 0; i < this.faces.length; ++i) {
        let p = this.faces[i].clip(a);
        if (p.vertices.length > 0) {
            front.push(p);
        }
    }

    for (var i = 0; i < mesh.faces.length; ++i) {
        let p = mesh.faces[i].clip(b);
        if (p.vertices.length > 0) {
            front.push(p);
        }
    }

    return new Mesh(front);
}

Mesh.prototype.toThree = function() {
    var geometry = new THREE.Geometry();

    var k = 0;
    for (var i = 0; i < this.faces.length; ++i) {
        let f = this.faces[i];
        // each face is potentially a convex polygon, so decompose into triangles
        for (var j = 2; j < f.vertices.length; ++j) {
            geometry.vertices.push(f.vertices[0])
            geometry.vertices.push(f.vertices[j-1])
            geometry.vertices.push(f.vertices[j]);
            geometry.faces.push( new THREE.Face3(k, k+1, k+2) );
            k += 3;
        }
    }

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();
    geometry.computeFlatVertexNormals();

    return geometry;
}

function cube(size) {
    let s = size*0.5;
    let vertices = [
        new THREE.Vector3(-s,-s,-s),
        new THREE.Vector3( s,-s,-s),
        new THREE.Vector3(-s, s,-s),
        new THREE.Vector3( s, s,-s),
        new THREE.Vector3(-s,-s, s),
        new THREE.Vector3( s,-s, s),
        new THREE.Vector3(-s, s, s),
        new THREE.Vector3( s, s, s)
    ];

    let faces = [
        new Polygon([vertices[0], vertices[4], vertices[6], vertices[2]]),
        new Polygon([vertices[1], vertices[3], vertices[7], vertices[5]]),
        new Polygon([vertices[0], vertices[1], vertices[5], vertices[4]]),
        new Polygon([vertices[2], vertices[6], vertices[7], vertices[3]]),
        new Polygon([vertices[0], vertices[2], vertices[3], vertices[1]]),
        new Polygon([vertices[4], vertices[5], vertices[7], vertices[6]])
    ];

    return new Mesh(faces);
}

function plane(p, n, size) {
    n = n.normalize().negate();
    let m = new THREE.Vector3(0, 0, 1);

    let a = n.clone().cross(m);
    let b = a.clone().cross(n);

    a = a.multiplyScalar(size);
    b = b.multiplyScalar(size);

    return new Mesh([
        new Polygon([
            p.clone().sub(a).sub(b),
            p.clone().add(a).sub(b),
            p.clone().add(a).add(b),
            p.clone().sub(a).add(b)
        ])
    ]);
}

exports.cube = cube;
exports.plane = plane;
exports.Polygon = Polygon;
exports.Mesh = Mesh;
