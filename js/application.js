var scene = new THREE.Scene();
//var camera = new THREE.OrthographicCamera((window.innerWidth / window.innerHeight) * 2 / - 2, (window.innerWidth / window.innerHeight) * 2 / 2, 2 / 2, 2 / - 2, 1, 1000);
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer({ antialiasing: true }); 
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var stats = new Stats();
//stats.setMode(1);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '10px';
document.body.appendChild( stats.domElement );

var controls = new THREE.TrackballControls( camera, renderer.domElement );
controls.noPan = true;
controls.minDistance = 1.5;
controls.maxDistance = 3;
controls.rotateSpeed = 0.09;
controls.dynamicDampingFactor = 0.7;

var light = new THREE.DirectionalLight( 0xffffaa );
//scene.add(light);

var ambient = new THREE.AmbientLight( 0xffffff );
scene.add(ambient);


var halfe = new he_edge();
halfe.next = 1;

var geometry = new THREE.IcosahedronGeometry(1, 3);

var planet = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x123456 }));
//scene.add( planet );

var planetWire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true}));
scene.add( planetWire );


var profiling = Date.now();
for(var i  = 0; i < 10; i++) {
	var removeFace = geometry.faces[i * 79 + 17];
	for(var j = 0; j < geometry.faces.length; j++) {
		var face = geometry.faces[j];
		var vertexAEqual = (face.a == removeFace.a || face.b == removeFace.a || face.c == removeFace.a);
		var vertexBEqual = (face.a == removeFace.b || face.b == removeFace.b || face.c == removeFace.b);
		var vertexCEqual = (face.a == removeFace.c || face.b == removeFace.c || face.c == removeFace.c);

		//If two vertices are the same
		if(vertexAEqual && (vertexBEqual || vertexCEqual) || (vertexBEqual && vertexCEqual)) {
			geometry.faces.splice(geometry.faces.indexOf(removeFace), 1);
			geometry.faces.splice(geometry.faces.indexOf(face), 1);

			var secondAEqual = (face.a == removeFace.a || face.a == removeFace.b || face.a == removeFace.c);
			var secondBEqual = (face.b == removeFace.a || face.b == removeFace.b || face.b == removeFace.c);
			var secondCEqual = (face.c == removeFace.a || face.c == removeFace.b || face.c == removeFace.c);

			var vertex1 = -1;
			var vertex2 = -1;
			var vertex3 = -1;
			var vertex4 = -1;


			if(vertexAEqual) {
				vertex1 = removeFace.a;
			} else {
				vertex2 = removeFace.a;
			}

			if(vertexBEqual) {
				if(vertex1 == -1)
					vertex1 = removeFace.b;
				else
					vertex3 = removeFace.b;
			} else {
				vertex2 = removeFace.b;
			}

			if(vertexCEqual) {
				vertex3 = removeFace.c;
			} else {
				vertex2 = removeFace.b;
			}

			if(!secondAEqual)
				vertex4 = face.a;
			if(!secondBEqual)
				vertex4 = face.b;
			if(!secondCEqual)
				vertex4 = face.c;


			var face1 = new THREE.Face3(vertex2, vertex1, vertex4);
			var face2 = new THREE.Face3(vertex2, vertex3, vertex4);
			geometry.faces.push(face1);
			geometry.faces.push(face2);

			//Calculate normal to make sure the face is in the right direction
			var u = geometry.vertices[face1.b].clone().sub(geometry.vertices[face1.a]);
			var v = geometry.vertices[face1.c].clone().sub(geometry.vertices[face1.a]);

			var normal = new THREE.Vector3();
			normal.x = (u.y * v.z) - (u.z * v.y);
			normal.y = (u.z * v.x) - (u.x * v.z);
			normal.z = (u.x * v.y) - (u.y * v.x);

			//If it points outwards from the origin (angle between the face position and the normal)
			var dotProd = normal.normalize().dot(geometry.vertices[face1.a].clone().normalize());
			console.log(dotProd);
			if(dotProd < -0.5) {
				var p1 = face1.a;
				face1.a = face1.b;
				face1.b = p1;
			}




			//Calculate normal to make sure the face is in the right direction
			u = geometry.vertices[face2.b].clone().sub(geometry.vertices[face2.a]);
			v = geometry.vertices[face2.c].clone().sub(geometry.vertices[face2.a]);

			normal = new THREE.Vector3();
			normal.x = (u.y * v.z) - (u.z * v.y);
			normal.y = (u.z * v.x) - (u.z * v.z);
			normal.z = (u.x * v.y) - (u.z * v.x);

			//If it points outwards from the origin (angle between the face position and the normal)
			dotProd = normal.normalize().dot(geometry.vertices[face2.a].clone().normalize());
			console.log(dotProd);
			if(dotProd < -0.5) {
				var p1 = face2.a;
				face2.a = face.b;
				face2.b = p1;
			}

			break;
		}
	}
}
console.log("Removing of edges took " + (Date.now() - profiling) + " ms")


var profiling = Date.now();
//Relaxation, move evert vertex to the center the polygons (Lloyd's algorithm)
relax(10);

console.log("Relaxation took " + (Date.now() - profiling) + " ms")

function relax(times) {
	for(var k = 0; k < times; k++) {
		for(var i = 0; i < geometry.vertices.length; i++) {
			var amountOfTriangles = 0;
			var averageX = 0;
			var averageY = 0;
			var averageZ = 0;

			for(var j = 0; j < geometry.faces.length; j++) {
				var face = geometry.faces[j];
				if(face.a == i || face.b == i || face.c == i) {
					amountOfTriangles++;
					var v1 = geometry.vertices[face.a];
					var v2 = geometry.vertices[face.b];
					var v3 = geometry.vertices[face.c];

					//Divide by three later on
					averageX += (v1.x + v2.x + v3.x);
					averageY += (v1.y + v2.y + v3.y);
					averageZ += (v1.z + v2.z + v3.z);
				}
			}

			averageX /= 3;
			averageY /= 3;
			averageZ /= 3;

			averageX /= amountOfTriangles;
			averageY /= amountOfTriangles;
			averageZ /= amountOfTriangles;

			//Keep distance from sphere center (0, 0, 0)
			geometry.vertices[i].set(averageX, averageY, averageZ).setLength(1);
		}
	}
}

var profiling = Date.now();

var he_vertices = [];
var he_faces = [];
var he_edges = [];


var subProfiling = Date.now();
//Add vertices
for(var i = 0; i < geometry.vertices.length; i++) { var v = geometry.vertices[i]; he_vertices.push(new he_vert(v.x, v.y, v.z));}
console.log("    Vertex generation took " + (Date.now() - subProfiling) + " ms")

var subProfiling = Date.now();
for(var i = 0; i < geometry.faces.length; i++) {
	var face = geometry.faces[i];

	var heFace = new he_face();
	he_faces.push(heFace);

	var edge1 = new he_edge();
	edge1.vertA = he_vertices[face.a];
	edge1.vertB = he_vertices[face.b];
	edge1.face = heFace;
	he_edges.push(edge1);

	heFace.edge = edge1;

	var edge2 = new he_edge();
	edge2.vertA = he_vertices[face.b];
	edge2.vertB = he_vertices[face.c];
	edge2.face = heFace;
	he_edges.push(edge2);

	var edge3 = new he_edge();
	edge3.vertA = he_vertices[face.c];
	edge3.vertB = he_vertices[face.a];
	edge3.face = heFace;
	he_edges.push(edge3);

	edge1.next = edge2;
	edge2.next = edge3;
	edge3.next = edge1;

	if(he_vertices[face.a].edge == null) {
		he_vertices[face.a].edge = edge1;
	}

	if(he_vertices[face.b].edge == null) {
		he_vertices[face.b].edge = edge2;
	}

	if(he_vertices[face.c].edge == null) {
		he_vertices[face.c].edge = edge3;
	}
}
console.log("    Edge generation took " + (Date.now() - subProfiling) + " ms")

var subProfiling = Date.now();
//Create pairs
for(var i = 0; i < he_edges.length; i++) {
	var edge = he_edges[i];

	for(var j = 0; j < he_edges.length; j++) {
		var edge2 = he_edges[j];
		if(i !== j) {
			if((edge.vertA === edge2.vertB && edge.vertB === edge2.vertA) || (edge.vertA === edge2.vertA && edge.vertB === edge2.vertB)) {
				edge.pair = edge2;
				edge2.pair = edge;
				break;
			}
		}

		if(j == he_edges.length - 1) {
			console.log("No pair!!");
		}
	}
}
console.log("    Pair generation took " + (Date.now() - subProfiling) + " ms")

console.log("Half-edge generation took " + (Date.now() - profiling) + " ms")

var profiling = Date.now();

var hexagonGeom = new THREE.Geometry();

noise.seed(Math.random());

for(var i = 0; i < he_vertices.length; i++) {
	var he_vertex = he_vertices[i];
	var edge = he_vertex.edge;
	var firstEdge = edge;

	var noiseValue = noise.simplex3(he_vertex.x, he_vertex.y, he_vertex.z);

	var color;

	var r = 1 - Math.abs(noiseValue) / 4;

	if(noiseValue > 0)
		color = new THREE.Color(0.3 * r, 0.5 * r, 0.2 * r);
	else
		color = new THREE.Color(0.2 * r, 0.3 * r, 0.7 * r);

	//Used for triangulation
	var firstFaceVertex = -1;
	var lastFaceVertex = -1;

	do {
		var x = edge.vertA.x;
		var y = edge.vertA.y;
		var z = edge.vertA.z;

		edge = edge.next;

		x += edge.vertA.x;
		y += edge.vertA.y;
		z += edge.vertA.z;

		edge = edge.next;

		x += edge.vertA.x;
		y += edge.vertA.y;
		z += edge.vertA.z;

		x /= 3;
		y /= 3;
		z /= 3;

		var vertexIndex = -1;
		//Add if it doesnt exist
		for(var j = 0; j < hexagonGeom.vertices.length; j++) {
			var v = hexagonGeom.vertices[j];
			if(v.x == x && v.y == y && v.z == z) {
				vertexIndex = j;
				break;
			}

		}

		if(vertexIndex == -1) {
			hexagonGeom.vertices.push(new THREE.Vector3(x, y, z));
			vertexIndex = hexagonGeom.vertices.length - 1;
		}

		if(firstFaceVertex == -1)
			firstFaceVertex = vertexIndex;
		else if(lastFaceVertex != -1) {
			var newFace = new THREE.Face3(firstFaceVertex, lastFaceVertex, vertexIndex, new THREE.Vector3(he_vertex.x, he_vertex.y, he_vertex.z).normalize());
			newFace.color = color;
			hexagonGeom.faces.push(newFace);
		}

		lastFaceVertex = vertexIndex;

		edge = edge.pair;
	} while(edge !== firstEdge);
}

hexagonGeom.verticesNeedUpdate = true;
var hexagons = new THREE.Mesh(hexagonGeom, new THREE.MeshLambertMaterial({ vertexColors: THREE.FaceColors }));

scene.add( hexagons );

console.log("Hexagon mesh creation took " + (Date.now() - profiling) + " ms")

camera.position.z = 2;

function render() { 
	var time = Date.now() * 0.0004;

	controls.update();

	light.position.set( Math.sin(time) * 3, 0, Math.cos(time) * 3, 0 ).normalize();

	requestAnimationFrame(render); 
	
	renderer.render(scene, camera); 

	stats.update();
} render();
