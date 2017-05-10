'use strict';

/**
 * API
 * @class API
 * @param apiName api이름
 */
var API = function(apiName) {
	if(!(this instanceof API)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// mago3d 활성화/비활성화 여부
	this.magoEnable = true;
	
	// api 이름
	this.apiName = apiName;
	// project id
	this.projectId = null;
	// block id
	this.blockId = null;
	// blockIds
	this.blockIds = null;
	// objectIds
	this.objectIds = null;
	
	// fullship = 0, deploy = 1
	this.renderMode = 0;
	// 위도
	this.latitude = 0;
	// 경도
	this.longitude = 0;
	// 높이
	this.elevation = 0;
	// heading
	this.heading = 0;
	// pitch
	this.pitch = 0;
	// roll
	this.roll = 0;
	
	// 색깔
	this.color = 0;
	// structs = MSP, outfitting = MOP
	this.blockType = null;
	// outfitting 표시/비표시
	this.showOutFitting = false;
	// boundingBox 표시/비표시
	this.showBoundingBox = false;
	// 그림자 표시/비표시
	this.showShadow = false;
	// frustum culling 가시 거리(M단위)
	this.frustumFarDistance = 0;
//	// highlighting
//	this.highLightedBuildings = [];
//	// color
//	this.colorBuildings = [];
//	// show/hide
//	this.hideBuildings = [];
	
	// 0 = block mode, 1 = object mode
	this.mouseMoveMode = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns magoEnable
 */
API.prototype.getMagoEnable = function() {
	return this.magoEnable;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setMagoEnable = function(magoEnable) {
	this.magoEnable = magoEnable;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns apiName
 */
API.prototype.getAPIName = function() {
	return this.apiName;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns projectId
 */
API.prototype.getProjectId = function() {
	return this.projectId;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setProjectId = function(projectId) {
	this.projectId = projectId;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns blockId
 */
API.prototype.getBlockId = function() {
	return this.blockId;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setBlockId = function(blockId) {
	this.blockId = blockId;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns blockIds
 */
API.prototype.getBlockIds = function() {
	return this.blockIds;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setBlockIds = function(blockIds) {
	this.blockIds = blockIds;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns objectIds
 */
API.prototype.getObjectIds = function() {
	return this.objectIds;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setObjectIds = function(objectIds) {
	this.objectIds = objectIds;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns renderMode
 */
API.prototype.getRenderMode = function() {
	return this.renderMode;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setRenderMode = function(renderMode) {
	this.renderMode = renderMode;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns latitude
 */
API.prototype.getLatitude = function() {
	return this.latitude;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setLatitude = function(latitude) {
	this.latitude = latitude;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns longitude
 */
API.prototype.getLongitude = function() {
	return this.longitude;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setLongitude = function(longitude) {
	this.longitude = longitude;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns elevation
 */
API.prototype.getElevation = function() {
	return this.elevation;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setElevation = function(elevation) {
	this.elevation = elevation;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns heading
 */
API.prototype.getHeading = function() {
	return this.heading;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setHeading = function(heading) {
	this.heading = heading;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns pitch
 */
API.prototype.getPitch = function() {
	return this.pitch;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setPitch = function(pitch) {
	this.pitch = pitch;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns roll
 */
API.prototype.getRoll = function() {
	return this.roll;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setRoll = function(roll) {
	this.roll = roll;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns color
 */
API.prototype.getColor = function() {
	return this.color;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setColor = function(color) {
	this.color = color;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns blockType
 */
API.prototype.getBlockType = function() {
	return this.blockType;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setBlockType = function(blockType) {
	this.blockType = blockType;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns showOutFitting
 */
API.prototype.getShowOutFitting = function() {
	return this.showOutFitting;
};

/**
 * 어떤 일을 하고 있습니까?
 */
API.prototype.setShowOutFitting = function(showOutFitting) {
	this.showOutFitting = showOutFitting;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns showBoundingBox
 */
API.prototype.getShowBoundingBox = function() {
	return this.showBoundingBox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param showBoundingBox
 */
API.prototype.setShowBoundingBox = function(showBoundingBox) {
	this.showBoundingBox = showBoundingBox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns showShadow
 */
API.prototype.getShowShadow = function() {
	return this.showShadow;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param showShadow
 */
API.prototype.setShowShadow = function(showShadow) {
	this.showShadow = showShadow;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns frustumFarDistance
 */
API.prototype.getFrustumFarDistance = function() {
	return this.frustumFarDistance;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustumFarDistance
 */
API.prototype.setFrustumFarDistance = function(frustumFarDistance) {
	this.frustumFarDistance = frustumFarDistance;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns mouseMoveMode
 */
API.prototype.getMouseMoveMode = function() {
	return this.mouseMoveMode;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param mouseMoveMode
 */
API.prototype.setMouseMoveMode = function(mouseMoveMode) {
	this.mouseMoveMode = mouseMoveMode;
};
