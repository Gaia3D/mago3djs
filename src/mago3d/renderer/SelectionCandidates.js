'use strict';

/**
 * SelectionCandidateFamily
 * 
 * @alias SelectionCandidateFamily
 * @class SelectionCandidateFamily
 */
var SelectionCandidateFamily = function() 
{
	if (!(this instanceof SelectionCandidateFamily)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.familyTypeName;
	this.candidatesMap = {};
	this.currentSelected;
};

/**
 */
SelectionCandidateFamily.prototype.setCandidate = function(idxKey, candidate)
{
	if (idxKey !== undefined && candidate)
	{
		this.candidatesMap[idxKey] = candidate;
	}
};

/**
 * SelectionCandidateFamily
 */
SelectionCandidateFamily.prototype.clearCandidate = function()
{
	this.candidatesMap = {};
	this.currentSelected = undefined;
};

/**
 * SelectionCandidateFamily
 */
SelectionCandidateFamily.prototype.clearCurrentSelected = function()
{
	this.currentSelected = undefined;
};

/**
 * SelectionCandidateFamily
 */
SelectionCandidateFamily.prototype.selectObject = function(idxKey)
{
	this.currentSelected = this.candidatesMap[idxKey];
	return this.currentSelected;
};

//********************************************************************************

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
var SelectionManager = function() 
{
	if (!(this instanceof SelectionManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// Default f4d objectsMap.***
	this.referencesMap = {};
	this.octreesMap = {};
	this.buildingsMap = {};
	this.nodesMap = {};
	
	this.currentReferenceSelected;
	this.currentOctreeSelected;
	this.currentBuildingSelected;
	this.currentNodeSelected;
	
	// Custom candidates.***
	this.selCandidatesFamilyMap = {};
	
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.newCandidatesFamily = function(candidatesFamilyTypeName)
{
	var selCandidate = new SelectionCandidateFamily();
	selCandidate.familyTypeName = candidatesFamilyTypeName;
	this.selCandidatesFamilyMap[candidatesFamilyTypeName] = selCandidate;
	return selCandidate;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getSelectionCandidatesFamily = function(familyName)
{
	return this.selCandidatesFamilyMap[familyName];
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.setCandidateCustom = function(idxKey, familyName, object)
{
	var selCandidatesFamily = this.getSelectionCandidatesFamily(familyName);
	if (selCandidatesFamily)
	{
		selCandidatesFamily.setCandidate(idxKey, object);
	}
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.setCandidates = function(idxKey, reference, octree, building, node)
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
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.clearCandidates = function()
{
	this.referencesMap = {};
	this.octreesMap = {};
	this.buildingsMap = {};
	this.nodesMap = {};
	
	for (var key in this.selCandidatesFamilyMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.selCandidatesFamilyMap, key))
		{
			var selCandidateFamily = this.selCandidatesFamilyMap[key];
			selCandidateFamily.clearCandidate();
		}

	}
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.selectObjects = function(idxKey)
{
	this.currentReferenceSelected = this.referencesMap[idxKey];
	this.currentOctreeSelected = this.octreesMap[idxKey];
	this.currentBuildingSelected = this.buildingsMap[idxKey];
	this.currentNodeSelected = this.nodesMap[idxKey];
	
	for (var key in this.selCandidatesFamilyMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.selCandidatesFamilyMap, key))
		{
			var selCandidateFamily = this.selCandidatesFamilyMap[key];
			selCandidateFamily.selectObject(idxKey);
		}
	}
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.clearCurrents = function(idxKey)
{
	this.currentReferenceSelected = undefined;
	this.currentOctreeSelected = undefined;
	this.currentBuildingSelected = undefined;
	this.currentNodeSelected = undefined;
	
	for (var key in this.selCandidatesFamilyMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.selCandidatesFamilyMap, key))
		{
			var selCandidateFamily = this.selCandidatesFamilyMap[key];
			selCandidateFamily.clearCurrentSelected();
		}
	}
};