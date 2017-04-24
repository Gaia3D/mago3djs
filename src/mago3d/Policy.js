'use strict';

/**
 * Policy
 * @class API
 */
var Policy = function() {
	if(!(this instanceof Policy)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// mago3d 활성화/비활성화 여부
	this.magoEnable = true;

	// outfitting 표시 여부
	this.showOutFitting = false;
	// boundingBox 표시/비표시
	this.showBoundingBox = false;
	// 그림자 표시/비표시
	this.showShadow = false;
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

	// 0 = block mode, 1 = object mode
	this.mouseMoveMode = 0;

	// provisional.***
	this.colorChangedObjectId;
};

Policy.prototype.getMagoEnable = function() {
	return this.magoEnable;
};
Policy.prototype.setMagoEnable = function(magoEnable) {
	this.magoEnable = magoEnable;
};

Policy.prototype.getShowOutFitting = function() {
	return this.showOutFitting;
};
Policy.prototype.setShowOutFitting = function(showOutFitting) {
	this.showOutFitting = showOutFitting;
};

Policy.prototype.getShowBoundingBox = function() {
	return this.showBoundingBox;
};
Policy.prototype.setShowBoundingBox = function(showBoundingBox) {
	this.showBoundingBox = showBoundingBox;
};

Policy.prototype.getShowShadow = function() {
	return this.showShadow;
};
Policy.prototype.setShowShadow = function(showShadow) {
	this.showShadow = showShadow;
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

Policy.prototype.getMouseMoveMode = function() {
	return this.mouseMoveMode;
};
Policy.prototype.setMouseMoveMode = function(mouseMoveMode) {
	this.mouseMoveMode = mouseMoveMode;
};
