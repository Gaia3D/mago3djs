'use strict';

/**
 * API
 * @class API
 */
var API = function(apiName) {
	if(!(this instanceof API)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// api 이름
	this.apiName = apiName;
	// block id
	this.blockId = null;
	
	// fullship = 0, deploy = 1
	this.renderMode = 0;
	// 위도
	this.latitude = 0;
	// 경도
	this.longitude = 0;
	// 높이
	this.height = 0;
	// 색깔
	this.color = 0;
	// structs = MSP, outfitting = MOP
	this.blockType = null;
	// outfitting 표시/비표시
	this.showOutFitting = false;
	// boundingBox 표시/비표시
	this.showBoundingBox = false;
	// frustum culling 가시 거리(M단위)
	this.frustumFarDistance = 0;
	// highlighting
	this.highLightedBuildings = [];
	// color
	this.colorBuildings = [];
	// show/hide
	this.hideBuildings = [];
	
};

API.prototype.getAPIName = function() {
	return this.apiName;
};

API.prototype.getBlockId = function() {
	return this.blockId;
};
API.prototype.setBlockId = function(blockId) {
	this.blockId = blockId;
};

API.prototype.getRenderMode = function() {
	return this.renderMode;
};
API.prototype.setRenderMode = function(renderMode) {
	this.renderMode = renderMode;
};

API.prototype.getLatitude = function() {
	return this.latitude;
};
API.prototype.setLatitude = function(latitude) {
	this.latitude = latitude;
};

API.prototype.getLongitude = function() {
	return this.longitude;
};
API.prototype.setLongitude = function(longitude) {
	this.longitude = longitude;
};

API.prototype.getHeight = function() {
	return this.height;
};
API.prototype.setHeight = function(height) {
	this.height = height;
};

API.prototype.getColor = function() {
	return this.color;
};
API.prototype.setColor = function(color) {
	this.color = color;
};

API.prototype.getBlockType = function() {
	return this.blockType;
};
API.prototype.setBlockType = function(blockType) {
	this.blockType = blockType;
};

API.prototype.getShowOutFitting = function() {
	return this.showOutFitting;
};
API.prototype.setShowOutFitting = function(showOutFitting) {
	this.showOutFitting = showOutFitting;
};

API.prototype.getShowBoundingBox = function() {
	return this.showBoundingBox;
};
API.prototype.setShowBoundingBox = function(showBoundingBox) {
	this.showBoundingBox = showBoundingBox;
};

API.prototype.getFrustumFarDistance = function() {
	return this.frustumFarDistance;
};
API.prototype.setFrustumFarDistance = function(frustumFarDistance) {
	this.frustumFarDistance = frustumFarDistance;
};

API.prototype.getHighLightedBuildings = function() {
	return this.highLightedBuildings;
};
API.prototype.setHighLightedBuildings = function(highLightedBuildings) {
	this.highLightedBuildings = highLightedBuildings;
};

API.prototype.getColorBuildings = function() {
	return this.colorBuildings;
};
API.prototype.setColorBuildings = function(colorBuildings) {
	this.colorBuildings = colorBuildings;
};

API.prototype.getHideBuildings = function() {
	return this.hideBuildings;
};
API.prototype.setHideBuildings = function(hideBuildings) {
	this.hideBuildings = hideBuildings;
};

