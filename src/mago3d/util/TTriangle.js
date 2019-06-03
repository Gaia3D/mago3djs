'use strict';
/**
 * 어떤 일을 하고 있습니까?
 * @class TTriangle
 */
var TTriangle = function() 
{
	if (!(this instanceof TTriangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mVertex1;
	this.mVertex2;
	this.mVertex3;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vtx1 변수
 * @param vtx2 변수
 * @param vtx3 변수
 */
TTriangle.prototype.setVertices = function(vtx1, vtx2, vtx3) 
{
	this.mVertex1 = vtx1;
	this.mVertex2 = vtx2;
	this.mVertex3 = vtx3;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTriangle.prototype.invert = function() 
{
	var vertexAux = this.mVertex2;
	this.mVertex2 = this.mVertex3;
	this.mVertex3 = vertexAux;
};