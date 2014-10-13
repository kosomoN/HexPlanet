
function he_edge () {
	this.vertA = null;
	this.vertB = null;
	this.pair = null;
	this.face = null;
	this.next = null;
}

function he_face () {
	this.edge = null;
}

function he_vert (x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;

	this.edge = null;
}