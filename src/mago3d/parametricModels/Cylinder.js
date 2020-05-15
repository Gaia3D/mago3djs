'use strict';

/**
 * Cylinder.
 * @class Cylinder
 * @constructor
 */
var Cylinder = function(radius, height, options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof Cylinder)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.radius = 10;
	this.height = 5;
	
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
	}
};
Cylinder.prototype = Object.create(MagoRenderable.prototype);
Cylinder.prototype.constructor = Cylinder;

/**
 * Makes the geometry mesh.
 */
Cylinder.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	var circle;
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	circle = outerRing.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(this.radius);
	
	var extrusionDist = this.height;
	var extrudeSegmentsCount = 1;
	var extrusionVector; // undefined.
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.objectsArray.push(mesh);
	this.dirty = false;
};































