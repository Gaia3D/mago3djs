'use strict';

/**
 * 카메라
 * @class Camera
 */
var Camera = function() {
	if(!(this instanceof Camera)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.position = new Point3D();
	this.direction = new Point3D();
	this.up = new Point3D();
	this.frustum = new Frustum();

};
