'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Sphere
 */
var Sphere = function() 
{
	if (!(this instanceof Sphere)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.r = 0.0;
	this.centerPoint = new Point3D();
	
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeyContainer.
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.setCenterPoint = function(x, y, z) 
{
	this.centerPoint.set(x, y, z);
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.setRadius = function(radius) 
{
	this.r = radius;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.deleteObjects = function() 
{
	this.r = undefined;
	this.centerPoint.deleteObjects();
	this.centerPoint = undefined;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.distToPoint3D = function(point3d) 
{
	return this.centerPoint.distToPoint(point3d) - this.r;
};

/**
 */
Sphere.prototype.getVbo = function(resultVboContainer, bTexCoords)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	var pMesh;

	// make vbo.
	pMesh = this.makePMesh(pMesh);
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	
	var surfIndepMesh = pMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	
	// now rotate in X axis.
	var rotMatAux = new Matrix4();
	rotMatAux.rotationAxisAngDeg(90.0, 1.0, 0.0, 0.0);
	surfIndepMesh.transformByMatrix4(rotMatAux);
	
	surfIndepMesh.setColor(0.0, 0.5, 0.9, 0.3);
	surfIndepMesh.calculateVerticesNormals();
	if (bTexCoords !== undefined && bTexCoords === true)
	{
		// calculate spherical texCoords.
		surfIndepMesh.calculateTexCoordsSpherical();
	}
	surfIndepMesh.getVbo(resultVboContainer);

	return resultVboContainer;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.makePMesh = function(resultPMesh) 
{
	if (resultPMesh === undefined)
	{ resultPMesh = new ParametricMesh(); }

	resultPMesh.profile = new Profile(); 
	var profileAux = resultPMesh.profile; 
	
	// Outer ring.**
	var outerRing = profileAux.newOuterRing();
	var polyLine, point3d, arc;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-this.r*0.01, -this.r); // 0
	point3d = polyLine.newPoint2d(-this.r*0.01, this.r); // 1
	
	var startAngDeg = 95.00;
	var endAngDeg = 265.00;
	arc = outerRing.newElement("ARC");
	this.sweepSense = 1;
	arc.setCenterPosition(0.0, 0.0);
	arc.setRadius(this.r);
	arc.setStartAngleDegree(startAngDeg);
	arc.setSweepAngleDegree(endAngDeg - startAngDeg);
	arc.numPointsFor360Deg = 48;
	
	// now revolve.
	var revolveAngDeg, revolveSegmentsCount, revolveSegment2d;
	revolveAngDeg = 360;
	revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(0, -1);
	var endPoint2d = new Point2D(0, 1);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	revolveSegmentsCount = 48;
	resultPMesh.revolve(profileAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d);
	/*
	var extrusionVector
	var extrudeSegmentsCount = 2;
	var extrusionDist = 15.0;
		resultPMesh.extrude(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector);
	*/
	
	return resultPMesh;
};










































