'use strict';

/**
 * 프로젝트(ship, weather등)의 구성 요소
 * @class SearchCondition
 */
var ProjectLayer = function() {
	if(!(this instanceof ProjectLayer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// project id
	this.projectId = null;
	// block id
	this.blockId = null;
	// object id
	this.objectId = null;
	
};

ProjectLayer.prototype.getProjectId = function() {
	return this.projectId;
};
ProjectLayer.prototype.setProjectId = function(projectId) {
	this.projectId = projectId;
};

ProjectLayer.prototype.getBlockId = function() {
	return this.blockId;
};
ProjectLayer.prototype.setBlockId = function(blockId) {
	this.blockId = blockId;
};

ProjectLayer.prototype.getObjectId = function() {
	return this.objectId;
};
ProjectLayer.prototype.setObjectId = function(objectId) {
	this.objectId = objectId;
};