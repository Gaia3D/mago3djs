'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarker
 *
 */
var ObjectMarker = function() {
	if(!(this instanceof ObjectMarker)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.geoLocationData = new GeoLocationData();
	this.issue_id;
	//
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
var ObjectMarkerManager = function() {
	if(!(this instanceof ObjectMarkerManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.objectMarkerArray = [];

};

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarkerManager
 *
 */
ObjectMarkerManager.prototype.newObjectMarker = function()
{
	var objMarker = new ObjectMarker();
	this.objectMarkerArray.push(objMarker);
	return objMarker;
}