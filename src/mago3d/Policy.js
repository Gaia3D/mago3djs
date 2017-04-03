'use strict';

/**
 * Policy
 * @class API
 */
var Policy = function() {
	if(!(this instanceof Policy)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// outfitting 표시 여부
	this.showOutFitting = false;
	// far frustum 거리
	this.frustumFarSquaredDistance = 5000000;
	// highlighting
	this.highLightedBuildings = [];
	// color
	this.colorBuildings = [];
	// color
	this.color = [];
	// show/hide
	this.hideBuildings = [];
};

Policy.prototype.getShowOutFitting = function() {
	return this.showOutFitting;
};
Policy.prototype.setShowOutFitting = function(showOutFitting) {
	this.showOutFitting = showOutFitting;
};

Policy.prototype.getFrustumFarSquaredDistance = function() {
	return this.frustumFarSquaredDistance;
};
Policy.prototype.setFrustumFarSquaredDistance = function(frustumFarSquaredDistance) {
	this.frustumFarSquaredDistance = frustumFarSquaredDistance;
};

Policy.prototype.getHighLightedBuildings = function() {
	return this.highLightedBuildings;
};
Policy.prototype.setHighLightedBuildings = function(highLightedBuildings) {
	this.highLightedBuildings = highLightedBuildings;
};

Policy.prototype.getColorBuildings = function() {
	return this.colorBuildings;
};
Policy.prototype.setColorBuildings = function(colorBuildings) {
	this.colorBuildings = colorBuildings;
};

Policy.prototype.getColor = function() {
	return this.color;
};
Policy.prototype.setColor = function(color) {
	this.color = color;
};

Policy.prototype.getHideBuildings = function() {
	return this.hideBuildings;
};
Policy.prototype.setHideBuildings = function(hideBuildings) {
	this.hideBuildings = hideBuildings;
};
