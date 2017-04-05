


'use strict';

  
/**
 * 어떤 일을 하고 있습니까?
 * @class Vertex
 */
var Vertex = function() {
	if(!(this instanceof Vertex)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.point3d = new Point3D();
	this.normal;
	this.texCoord;
	this.color4;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Vertex.prototype.setPosition = function(x, y, z) {
	this.point3d.set(x, y, z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param r 변수
 * @param g 변수
 * @param b 변수
 */
Vertex.prototype.setColorRGB = function(r, g, b) {
	if(this.color4 == undefined) this.color4 = new Color();
	
	this.color4.setRGB(r, g, b);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param r 변수
 * @param g 변수
 * @param b 변수
 * @param alpha 변수
 */
Vertex.prototype.setColorRGBA = function(r, g, b, alpha) {
	if(this.color4 == undefined) this.color4 = new Color();
	
	this.color4.setRGBA(r, g, b, alpha);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param dir_x 변수
 * @param dir_y 변수
 * @param dir_z 변수
 * @param distance 변수
 */
Vertex.prototype.translate = function(dir_x, dir_y, dir_z, distance) {
	this.point3d.add(dir_x*distance, dir_y*distance, dir_z*distance);
};