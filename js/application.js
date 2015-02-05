var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer({ antialiasing: true }); 
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '10px';
document.body.appendChild( stats.domElement );

window.addEventListener('resize', function() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

var controls = new THREE.TrackballControls( camera, renderer.domElement );
controls.noPan = true;
controls.minDistance = 1.1;
controls.maxDistance = 3;
controls.rotateSpeed = 0.09;
controls.dynamicDampingFactor = 0.7;

var light = new THREE.DirectionalLight( 0xffffaa );
scene.add(light);

var ambient = new THREE.AmbientLight( 0x888888 );
scene.add(ambient);


var halfe = new he_edge();
halfe.next = 1;

var geometry = new THREE.IcosahedronGeometry(1, 3);

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

	for(var j = (i + 1); j < he_edges.length; j++) {
		var edge2 = he_edges[j];
		if((edge.vertA === edge2.vertB && edge.vertB === edge2.vertA) || (edge.vertA === edge2.vertA && edge.vertB === edge2.vertB)) {
			edge.pair = edge2;
			edge2.pair = edge;
			break;
		}
	}

	if(edge.pair == null)
		console.log("Edge is missing a pair")
}
console.log("    Pair generation took " + (Date.now() - subProfiling) + " ms")

var profiling = Date.now();

var hexagonGeom = new THREE.Geometry();
//Generate terrain
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
