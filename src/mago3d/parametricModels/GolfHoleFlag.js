'use strict';

/**
 * GolfHoleFlag.
 * @class GolfHoleFlag
 */
var GolfHoleFlag = function(radius, height, options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof GolfHoleFlag)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.radius = 1.0;
	this.height = 5;
	
	if (radius !== undefined)
	{ this.radius = radius; }
	
	if (height !== undefined)
	{ this.height = height; }

	this.baseRadius = 4.0*this.radius;
	
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
	}
	
};
GolfHoleFlag.prototype = Object.create(MagoRenderable.prototype);
GolfHoleFlag.prototype.constructor = GolfHoleFlag;

/**
 * Makes the geometry mesh.
 */
GolfHoleFlag.prototype.makeMesh = function()
{
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }

	// Create the base of the flag.**************************************************
	var baseHeight = this.height * 0.01;
	var options = {
		color: new Color(1.0, 1.0, 0.0, 1.0)
	};
	var base = new Cylinder(this.baseRadius, baseHeight, options);
	this.objectsArray.push(base);
	
	// Create the flag flagpole.**************************************************
	var options = {
		color: new Color(0.9, 0.9, 0.95, 1.0)
	};
	var flagpole = new Cylinder(this.radius, this.height, options);
	this.objectsArray.push(flagpole);
	
	// Create the triangle flag.**************************************************
	var profile2dAux = new Profile2D();
	
	// Outer ring.**
	var outerRing = profile2dAux.newOuterRing();
 
	var flagHeight = 2;
	var flagWidth = 10.0;

	var polyline = outerRing.newElement("POLYLINE");
	
	polyline.newPoint2d(-flagHeight/2, 0);    
	polyline.newPoint2d(flagHeight/2, 0);    
	polyline.newPoint2d(0, flagWidth);

	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	var extrudeDist = 0.1;
	var mesh = Modeler.getExtrudedMesh(profile2dAux, extrudeDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, mesh);
	mesh.setOneColor(1.0, 0.1, 0.1, 1.0);
	mesh.rotate(90.0, 0.0, 1.0, 0.0);
	mesh.translate(0.0, 0.0, this.height - flagHeight/2);
	
	
	this.objectsArray.push(mesh);
	
	this.dirty = false;
};






































