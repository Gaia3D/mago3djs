'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarker
 *
 */
var ObjectMarker = function() 
{
	if (!(this instanceof ObjectMarker)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.geoLocationData = new GeoLocationData();
	this.issue_id = null;
	this.issue_type = null;
	//this.latitude = 0;
	//this.longitude = 0;
	//this.height = 0;
};

ObjectMarker.prototype.copyFrom = function(objMarker) 
{
	if (objMarker === undefined) { return; }
		
	if (objMarker.geoLocationData) 
	{
		this.geoLocationData.copyFrom(objMarker.geoLocationData);
	}
	
	this.issue_id = objMarker.issue_id;
	this.issue_type = objMarker.issue_type;
};

ObjectMarker.prototype.render = function(shader, renderType, magoManager) 
{
	var objMarkerGeoLocation = this.geoLocationData;
	gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
	gl.uniform3fv(currentShader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
	gl.uniform3fv(currentShader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

