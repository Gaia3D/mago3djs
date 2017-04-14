'use strict';

/**
 * 카메라
 * @class Frustum
 */
var Frustum = function() {
	if(!(this instanceof Frustum)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.near = new Float32Array([0.1]);
	this.far = new Float32Array([1000.0]);
	this.fovyRad = new Float32Array([0.8037]);
	this.fovRad = new Float32Array([1.047]);
	this.aspectRatio = new Float32Array([1.3584]);
	
};