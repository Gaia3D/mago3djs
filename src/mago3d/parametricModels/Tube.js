'use strict';

/**
 * Tube.
 * @class Tube
 */
var Tube = function(interiorRadius, exteriorRadius, height, options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof Tube)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.intRadius = 10;
	this.extRadius = 20;
	this.height = 5;
	
	if (interiorRadius !== undefined)
	{ this.intRadius = interiorRadius; }
	
	if (exteriorRadius !== undefined)
	{ this.extRadius = exteriorRadius; }
	
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
Tube.prototype = Object.create(MagoRenderable.prototype);
Tube.prototype.constructor = Tube;

/**
 * Returns the bbox.
 */
Tube.prototype.getBoundingBox = function()
{
	if (this.bbox === undefined)
	{
		this.bbox = new BoundingBox();
		var maxRadius = this.extRadius;
		if (maxRadius < this.intRadius)
		{ maxRadius = this.intRadius; }
		
		this.bbox.set(-maxRadius, -maxRadius, 0.0, maxRadius, maxRadius, this.height);
	}
	return this.bbox;
};

/**
 * Makes the geometry mesh.
 */
Tube.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	var circle;
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	circle = outerRing.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(this.extRadius);
	
	// Now create interior ring.***
	var innerRing = profileAux.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(this.intRadius);
	
	var extrusionDist = this.height;
	var extrudeSegmentsCount = 1;
	var extrusionVector; // undefined.
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	
	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.objectsArray.push(mesh);
	this.dirty = false;
};