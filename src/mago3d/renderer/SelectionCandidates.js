'use strict';

/**
 * SelectionCandidates
 * 
 * @alias SelectionCandidates
 * @class SelectionCandidates
 */
var SelectionCandidates = function() 
{
	if (!(this instanceof SelectionCandidates)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.referencesMap = {};
	this.octreesMap = {};
	this.buildingsMap = {};
	this.nodesMap = {};
	
	this.currentReferenceSelected;
	this.currentOctreeSelected;
	this.currentBuildingSelected;
	this.currentNodeSelected;
};

/**
 * SelectionCandidates
 * 
 * @alias SelectionCandidates
 * @class SelectionCandidates
 */
SelectionCandidates.prototype.setCandidates = function(idxKey, reference, octree, building, node)
{
	if (reference)
	{
		this.referencesMap[idxKey] = reference;
	}
	
	if (octree)
	{
		this.octreesMap[idxKey] = octree;
	}
	
	if (building)
	{
		this.buildingsMap[idxKey] = building;
	}
	
	if (node)
	{
		this.nodesMap[idxKey] = node;
	}
};

/**
 * SelectionCandidates
 * 
 * @alias SelectionCandidates
 * @class SelectionCandidates
 */
SelectionCandidates.prototype.clearCandidates = function()
{
	this.referencesMap = {};
	this.octreesMap = {};
	this.buildingsMap = {};
	this.nodesMap = {};
};

/**
 * SelectionCandidates
 * 
 * @alias SelectionCandidates
 * @class SelectionCandidates
 */
SelectionCandidates.prototype.selectObjects = function(idxKey)
{
	this.currentReferenceSelected = this.referencesMap[idxKey];
	this.currentOctreeSelected = this.octreesMap[idxKey];
	this.currentBuildingSelected = this.buildingsMap[idxKey];
	this.currentNodeSelected = this.nodesMap[idxKey];
};

/**
 * SelectionCandidates
 * 
 * @alias SelectionCandidates
 * @class SelectionCandidates
 */
SelectionCandidates.prototype.clearCurrents = function(idxKey)
{
	this.currentReferenceSelected = undefined;
	this.currentOctreeSelected = undefined;
	this.currentBuildingSelected = undefined;
	this.currentNodeSelected = undefined;
};