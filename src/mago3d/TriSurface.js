'use strict';

/**
 * 영역 박스
 * @class TriSurface
 */
var TriSurface = function() {
	if(!(this instanceof TriSurface)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.trianglesArray = [];
};

TriSurface.prototype.newTriangle = function() {
	var triangle = new Triangle();
	this.trianglesArray.push(triangle);
	return triangle;
};
