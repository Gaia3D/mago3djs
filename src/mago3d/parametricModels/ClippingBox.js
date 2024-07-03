'use strict';

/**
 * ClippingBox geometry.
 * @class ClippingBox
 */
var ClippingBox = function() 
{
	MagoRenderable.call(this);
	if (!(this instanceof ClippingBox)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.position;
	this.positiomHIGH;
	this.positionLOW;
	this.clippingPlanesArray;
	this.bActive = false;

	// vars to create the mesh if render.***
	this._pointsArrayToExtrude;
	this._extrudeQuantity;

	// vars for set uniforms.
	this.planesPositionsFloat32Array;
	this.planesNormalsFloat32Array;

	this.planesVec4Array; // no use this. OLD.***

};

ClippingBox.prototype = Object.create(MagoRenderable.prototype);
ClippingBox.prototype.constructor = ClippingBox;

ClippingBox.prototype.create_byExtrude = function(pointsArray, extrudeDirection, extrudeQuantity)
{
	// Must exist 4 points.***
	this._pointsArrayToExtrude = pointsArray;
	this._extrudeQuantity = extrudeQuantity;

	var pointsCount = pointsArray.length;
	var nextIdx = 0;
	if (this.clippingPlanesArray === undefined)
	{
		this.clippingPlanesArray = [];
	}

	// Lateral vertical plaves.***
	for (var i=0; i<pointsCount; i++)
	{
		var point1 = pointsArray[i];
		if (i === pointsCount - 1)
		{
			nextIdx = 0;
		}
		else 
		{
			nextIdx = i + 1;
		}

		var point2 = pointsArray[nextIdx];

		var point1_up = new Point3D(point1.x + extrudeDirection.x * extrudeQuantity, point1.y + extrudeDirection.y * extrudeQuantity, point1.z + extrudeDirection.z * extrudeQuantity);
		var point2_up = new Point3D(point2.x + extrudeDirection.x * extrudeQuantity, point2.y + extrudeDirection.y * extrudeQuantity, point2.z + extrudeDirection.z * extrudeQuantity);

		var clippingPlane = new ClippingPlane();
		clippingPlane._pointsArray = [point1, point2, point2_up, point1_up]; // optional. No used yet.

		// Now, calculate the normal for the plane.***
		var normal = Triangle.calculateNormal(point1, point2_up, point2,  undefined);

		clippingPlane.setPosition(point1.x, point1.y, point1.z);
		clippingPlane.setNormal(normal.x, normal.y, normal.z);
		this.clippingPlanesArray.push(clippingPlane);
	}

	// Now, top plane & base plane.***
	// Now, calculate the normal for the plane.***
	var pointOrigin = pointsArray[0];
	var point1_up = new Point3D(pointOrigin.x + extrudeDirection.x * extrudeQuantity, pointOrigin.y + extrudeDirection.y * extrudeQuantity, pointOrigin.z + extrudeDirection.z * extrudeQuantity);
	var clippingPlane = new ClippingPlane();
	var normal = new Point3D(0.0, 0.0, 1.0);
	clippingPlane.setPosition(point1_up.x, point1_up.y, point1_up.z);
	clippingPlane.setNormal(normal.x, normal.y, normal.z);
	this.clippingPlanesArray.push(clippingPlane);

	// base plane.
	var clippingPlane = new ClippingPlane();
	var normal = new Point3D(0.0, 0.0, -1.0);
	clippingPlane.setPosition(point1.x, point1.y, point1.z);
	clippingPlane.setNormal(normal.x, normal.y, normal.z);
	this.clippingPlanesArray.push(clippingPlane);
};

ClippingBox.prototype.getPlanesCount = function ()
{
	if (this.clippingPlanesArray)
	{
		return this.clippingPlanesArray.length;
	}

	return 0;
};

ClippingBox.prototype.getPlanesPositionsFloat32Array = function ()
{
	if (!this.planesPositionsFloat32Array)
	{
		var planesCount = this.clippingPlanesArray.length;
		this.planesPositionsFloat32Array = new Float32Array(planesCount * 3);
		for (var i=0; i<planesCount; i++)
		{
			var clippingPlane = this.clippingPlanesArray[i];
			this.planesPositionsFloat32Array[i*3] = clippingPlane.position.x;
			this.planesPositionsFloat32Array[i*3+1] = clippingPlane.position.y;
			this.planesPositionsFloat32Array[i*3+2] = clippingPlane.position.z;
		}
	}

	return this.planesPositionsFloat32Array;
};

ClippingBox.prototype.getPlanesNormalsFloat32Array = function ()
{
	if (!this.planesNormalsFloat32Array)
	{
		var planesCount = this.clippingPlanesArray.length;
		this.planesNormalsFloat32Array = new Float32Array(planesCount * 3);
		for (var i=0; i<planesCount; i++)
		{
			var clippingPlane = this.clippingPlanesArray[i];
			this.planesNormalsFloat32Array[i*3] = clippingPlane.normal.x;
			this.planesNormalsFloat32Array[i*3+1] = clippingPlane.normal.y;
			this.planesNormalsFloat32Array[i*3+2] = clippingPlane.normal.z;
		}
	}

	return this.planesNormalsFloat32Array;
};

ClippingBox.prototype.moved = function ()
{
	this.planesPositionsVec3Array = undefined;
	this.planesNormalsVec3Array = undefined;
	//this.planesVec4Array = undefined; // old. delete this.
};

/**
 * Makes the box mesh.
 * @param {Number} width
 * @param {Number} length
 * @param {Number} height 
 */
ClippingBox.prototype.makeMesh = function()
{
	if (!this._pointsArrayToExtrude)
	{
		return undefined;
	}

	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();

	var halfWidth = this.width * 0.5;
	var halLength = this.length * 0.5;
	var polyline = outerRing.newElement("POLYLINE");

	var pointsCount = this._pointsArrayToExtrude.length;
	for (var i=0; i<pointsCount; i++)
	{
		var point = this._pointsArrayToExtrude[i];
		polyline.newPoint2d(point.x, point.y);
	}

	//polyline.newPoint2d(-halfWidth, -halLength);
	//polyline.newPoint2d(halfWidth, -halLength);
	//polyline.newPoint2d(halfWidth, halLength);
	//polyline.newPoint2d(-halfWidth, halLength);

	//var rect = outerRing.newElement("RECTANGLE");
	//rect.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	//rect.setDimensions(this.width, this.length);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this._extrudeQuantity;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;

	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	
	// set attributes & options.
	this.setOneColor(0.2, 0.7, 0.8, 0.3);
	this.attributes.isMovable = true;
	this.attributes.isSelectable = true;
	this.attributes.name = "clippingBox";
	this.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (this.options === undefined)
	{ this.options = {}; }
	
	this.options.renderWireframe = true;
	this.options.renderShaded = true;
	this.options.depthMask = true;
	
	this.objectsArray.push(mesh);
	this.dirty = false;
	return mesh;
};