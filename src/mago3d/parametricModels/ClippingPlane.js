'use strict';

/**
 * ClippingPlane geometry.
 * @class ClippingPlane
 */
var ClippingPlane = function(options) 
{
	
	if (!(this instanceof ClippingPlane)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.plane; // the plane equation.***

	if(!options)
	options = {};

	this.color4 = defaultValue(options.color, new Color(1,1,1,1));

	options.renderWireframe = true;
	MagoRenderable.call(this, options);

	if(options.position)
	{
		var position = options.position;
		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;
		this.setGeographicPosition(new GeographicCoord(position.longitude, position.latitude, position.altitude), heading, pitch, roll);
	}

	//this.color4 = defaultValue(options.color, new Color(1,1,1,1));
    //this.selectedColor4 = defaultValue(options.selectedColor, new Color(1,1,0,1));

	//this.attributes.isVisible = defaultValue(options.isVisible, true);
	this.attributes.isMovable = defaultValue(options.isMovable, true);
	this.attributes.movementInAxisZ = true;
    //this.attributes.isSelectable = defaultValue(options.isSelectable, true);

	//if(!this.options)
    //this.options = {};

    //this.options.renderWireframe = defaultValue(options.renderWireframe, true);
    //this.options.renderShaded = defaultValue(options.renderShaded, true);
	//this.options.depthMask = defaultValue(options.depthMask, true);

	// vars to render the plane as a rectangle.
	this._width = 50.0;
	this._length = 50.0;

};

ClippingPlane.prototype = Object.create(MagoRenderable.prototype);
ClippingPlane.prototype.constructor = ClippingPlane;

ClippingPlane.prototype.makeMesh = function()
{
	if(!this.dirty) return;

	// make a simple rectangle3d. Create 4 vertices.***
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	var geoCoord = geoLocData.geographicCoord;
	var lon = geoCoord.longitude;
	var lat = geoCoord.latitude;
	var alt = geoCoord.altitude;

	// create 4 geographicCoords, with "geoCoord" as center.***
	var increLonDeg = 0.001;
	var increLatDeg = 0.001;

	var geoCoordLD = new GeographicCoord(lon - increLonDeg, lat - increLatDeg, alt);
	var geoCoordRD = new GeographicCoord(lon + increLonDeg, lat - increLatDeg, alt);
	var geoCoordRU = new GeographicCoord(lon + increLonDeg, lat + increLatDeg, alt);
	var geoCoordLU = new GeographicCoord(lon - increLonDeg, lat + increLatDeg, alt);

	var pos0 = ManagerUtils.geographicCoordToWorldPoint(geoCoordLD.longitude, geoCoordLD.latitude, geoCoordLD.altitude, undefined);
	var pos1 = ManagerUtils.geographicCoordToWorldPoint(geoCoordRD.longitude, geoCoordRD.latitude, geoCoordRD.altitude, undefined);
	var pos2 = ManagerUtils.geographicCoordToWorldPoint(geoCoordRU.longitude, geoCoordRU.latitude, geoCoordRU.altitude, undefined);
	var pos3 = ManagerUtils.geographicCoordToWorldPoint(geoCoordLU.longitude, geoCoordLU.latitude, geoCoordLU.altitude, undefined);

	var pointLCArray = geoLocData.worldCoordToLocalCoord([pos0, pos1, pos2, pos3], undefined);

	var vtxProfile = new VtxProfile();
	vtxProfile.makeByPoints3DArray(pointLCArray, undefined);
	
	var planeMesh = new Mesh();
	var surface = planeMesh.newSurface();
	var convexFacesIndicesData = undefined;
	surface = VtxProfilesList.getTransversalSurface(vtxProfile, convexFacesIndicesData, surface);
	surface.calculateVerticesNormals();
	this.objectsArray.push(planeMesh);

	this.setDirty(false);
};