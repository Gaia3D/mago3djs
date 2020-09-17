'use strict';

/**
 * ClippingPlane geometry.
 * @class ClippingPlane
 */
var ClippingPlane = function(options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof ClippingPlane)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.plane; // the plane equation.***
	this.geoLocDataManager = new GeoLocationDataManager();

	if(!options)
	options = {};

	// vars to render the plane as a rectangle.
	this._width = 50.0;
	this._length = 50.0;

};

ClippingPlane.prototype = Object.create(MagoRenderable.prototype);
ClippingPlane.prototype.constructor = ClippingPlane;

ClippingPlane.prototype.makeMesh = function()
{
	// make a simple rectangle3d. Create 4 vertices.***
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	var geoCoord = geoLocData.geographicCoord;

	// create 4 geographicCoords, with "geoCoord" as center.***
	

	var pos0 = new Point3D();
	var vtx0 = new Vertex(pos0);


};