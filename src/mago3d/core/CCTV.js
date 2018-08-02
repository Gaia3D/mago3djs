'use strict';

/**
 * 카메라
 * @class CCTV
 */
var CCTV = function() 
{
	if (!(this instanceof CCTV)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geographicCoords = new GeographicCoord();
	this.camera = new Camera();
	//this.frustumMesh;
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeyContainer.***
};

/**
 */
CCTV.prototype.getVbo = function(resultVboContainer)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	var frustumMesh;
	frustumMesh = this.makeFrustumGeometry(frustumMesh);
	resultVboContainer = frustumMesh.getVbo(resultVboContainer);
	return resultVboContainer;
};

/**
 */
CCTV.prototype.makeFrustumGeometry = function(resultMesh)
{
	// make a frustum mesh.***
	if(resultMesh === undefined)
		resultMesh = new Mesh();
	
	// 1rst, calculate the positions of 5 vertices.***
	var focusPosition = new Point3D(0.0, 0.0, 0.0);
	
	var frustum = this.camera.bigFrustum;
	var far = frustum.far;
	var halfFovyRad = frustum.fovyRad / 2.0;
	var halfFovxRad = frustum.fovRad / 2.0;
	
	var left = -far * Math.tan(halfFovxRad);
	var right = -left;
	var top = far * Math.tan(halfFovyRad);
	var bottom = -top;
	
	var farLeftDown = new Point3D(left, bottom, -far);
	var farRightDown = new Point3D(right, bottom, -far);
	var farRightTop = new Point3D(right, top, -far);
	var farLeftTop = new Point3D(left, top, -far);
	
	// now make vertices. 5 vertices in total.***
	var focusVertex = new Vertex(focusPosition);
	var farLeftDownVertex = new Vertex(farLeftDown);
	var farRightDownVertex = new Vertex(farRightDown);
	var farRightTopVertex = new Vertex(farRightTop);
	var farLeftTopVertex = new Vertex(farLeftTop);

	var face;
	
	// there are no near polygon.***
	// 1- far polygon.***
	var farSurface = resultMesh.newSurface();
	face = farSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(farLeftDownVertex);
	face.addVertex(farLeftTopVertex);
	face.addVertex(farRightTopVertex);
	face.addVertex(farRightDownVertex);
	
	// 2- top polygon.***
	var topSurface = resultMesh.newSurface();
	face = topSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farRightTopVertex);
	face.addVertex(farLeftTopVertex);
	
	// 3- left polygon.***
	var leftSurface = resultMesh.newSurface();
	face = leftSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farLeftTopVertex);
	face.addVertex(farLeftDownVertex);
	
	// 4- bottom polygon.***
	var bottomSurface = resultMesh.newSurface();
	face = bottomSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farLeftDownVertex);
	face.addVertex(farRightDownVertex);
	
	// 5- right polygon.***
	var rightSurface = resultMesh.newSurface();
	face = rightSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farRightDownVertex);
	face.addVertex(farRightTopVertex);
	
	return resultMesh;
};

// CCTVList.*********************************************************************************
/**
 * 카메라
 * @class CCTVList
 */
var CCTVList = function() 
{
	if (!(this instanceof CCTVList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.camerasList = [];
	
	
};

/**
 */
CCTVList.prototype.new_CCTV = function()
{
	var cctv = new CCTV();
	this.camerasList.push(cctv);
	return cctv;
};

/**
 */
CCTVList.prototype.getCCTV = function(idx)
{
	return this.camerasList[idx];
};

/**
 */
CCTVList.prototype.getCCTVCount = function()
{
	return this.camerasList.length;
};
































