'use strict';

/**
 * Cone.
 * @class Cone
 * @constructor
 */
var Cone = function(radius, height, options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof Cone)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.radius = 10;
    this.height = 5;
	this.baseType = 1; // 0= NONE. 1= PLANE. 2= SPHERICAL.
	this.originPosition;
	
	if (radius !== undefined)
	{ this.radius = radius; }
	
	if (height !== undefined)
	{ this.height = height; }
	
	this.dirty = true;
	this.mesh;
	this.bbox;
	
	/**
	 * The geographic location of the factory.
	 * @type {GeoLocationDataManager}
	 * @default undefined
	 */
	this.geoLocDataManager;
	this.color4;
	
	if (options !== undefined)
	{
		var color = options.color;
		if (color)
		{
			this.color4 = new Color();
			this.color4.setRGBA(color.r, color.g, color.b, color.a);
		}
		var selectedColor = options.selectedColor;
		if (selectedColor)
		{
			this.selectedColor4 = new Color();
			this.selectedColor4.setRGBA(selectedColor.r, selectedColor.g, selectedColor.b, selectedColor.a);
		}

		var baseType = options.baseType;
		if(baseType)
		{
			this.baseType = baseType;
		}
	}
};
Cone.prototype = Object.create(MagoRenderable.prototype);
Cone.prototype.constructor = Cone;

/**
 * Makes the geometry mesh.
 */
Cone.prototype.makeMesh = function()
{
	//                              Y
	//                              ^
	//                              |
	//                              +
	//                             /|
	//                           /  |
	//                         /    |
	//                       /      |
	//                     /        |
	//                   +----------+-----------> X
	//                             (0,0)
	// Cone, initially cenetered in the base.

	var profile2dAux = new Profile2D();
	
	// Outer ring.**
	var outerRing = profile2dAux.newOuterRing();

	var height = this.height;
	var radius = this.radius;

	var polyline = outerRing.newElement("POLYLINE");
	polyline.newPoint2d(0.0, height);            
	polyline.newPoint2d(-radius, 0.0); 
	
	if(this.baseType === 1)
	{
		// Base plane.
		polyline.newPoint2d(0.0, 0.0); 
	}
	else if(this.baseType === 2)
	{
		// Base spherical.
		var sphericalRadius = Math.sqrt(height*height + radius*radius);
		var sweeptAngRad = Math.acos(height/sphericalRadius);
		var sweeptAngDeg = sweeptAngRad * 180.0/Math.PI;

		var rightArc = outerRing.newElement("ARC");
		rightArc.setCenterPosition(0.0, height);
		rightArc.setRadius(sphericalRadius); 
		rightArc.setStartPoint(-radius, 0.0);
		rightArc.setSweepAngleDegree(sweeptAngDeg);
	}

	var revolveAngDeg = 360;
	var revolveSegmentsCount = 12;
	var revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(0, 0);
	var endPoint2d = new Point2D(0, 1);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	var mesh = Modeler.getRevolvedMesh(profile2dAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.mesh = mesh.getCopySurfaceIndependentMesh(mesh);
	this.objectsArray.push(this.mesh);
	this.dirty = false;
};