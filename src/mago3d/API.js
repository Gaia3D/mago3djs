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
