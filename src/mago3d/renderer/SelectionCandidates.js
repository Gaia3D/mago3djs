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

	this.referencesMap = new Map();
	this.octreesMap = new Map();
	this.buildingsMap = new Map();
	
	this.currentReferenceSelected;
	this.currentOctreeSelected;
	this.currentBuildingSelected;
};

SelectionCandidates.prototype.setCandidates = function(idxKey, reference, octree, building)
{
	if (reference)
	{
		this.referencesMap.set(idxKey, reference);
	}
	
	if (octree)
	{
		this.octreesMap.set(idxKey, octree);
	}
	
	if (building)
	{
		this.buildingsMap.set(idxKey, building);
	}
};

SelectionCandidates.prototype.clearCandidates = function()
{
	this.referencesMap.clear();
	this.octreesMap.clear();
	this.buildingsMap.clear();
};

SelectionCandidates.prototype.selectObjects = function(idxKey)
{
	this.currentReferenceSelected = this.referencesMap.get(idxKey);
	this.currentOctreeSelected = this.octreesMap.get(idxKey);
	this.currentBuildingSelected = this.buildingsMap.get(idxKey);
};