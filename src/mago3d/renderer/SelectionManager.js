'use strict';

/**
 * SelectionManager. This class manages the selection process and the selection candidates.
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

	// General candidates. 
	this.selCandidatesMap = {};
	this.currentGeneralObjectSelected;
	
	// Default f4d objectsMap. // Deprecated.
	this.referencesMap = {}; // Deprecated.
	this.octreesMap = {}; // Deprecated.
	this.buildingsMap = {}; // Deprecated.
	this.nodesMap = {}; // Deprecated.
	
	this.currentReferenceSelected; // Deprecated.
	this.currentOctreeSelected; // Deprecated.
	this.currentBuildingSelected; // Deprecated.
	this.currentNodeSelected; // Deprecated.
	
	// Custom candidates.
	this.selCandidatesFamilyMap = {};

	// Parameter that indicates that we are rendering selected data structure.
	this.parentSelected = false;
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
 * SelectionManager. Recomended. Use this for all selection process.
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.setCandidateGeneral = function(idxKey, candidateObject)
{
	this.selCandidatesMap[idxKey] = candidateObject;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getCandidateGeneral = function(idxKey)
{
	return this.selCandidatesMap[idxKey];
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getSelectedGeneral = function()
{
	return this.currentGeneralObjectSelected;
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
	
	// General selection candidates map.
	this.selCandidatesMap = {};
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
	
	this.currentGeneralObjectSelected = this.selCandidatesMap[idxKey];

	//임시로 추가한 코드, 다시 구상해야함.
	if (this.currentGeneralObjectSelected && this.currentGeneralObjectSelected.testCall && typeof this.currentGeneralObjectSelected.testCall === 'function') 
	{
		this.currentGeneralObjectSelected.testCall.call(this.currentGeneralObjectSelected);
	}
};

/**
 * SelectionManager
 */
SelectionManager.prototype.isObjectSelected = function(object)
{
	if (object === undefined)
	{ return false; }
	
	if (this.currentReferenceSelected === object)
	{ return true; }
	
	if (this.currentBuildingSelected === object)
	{ return true; }
	
	if (this.currentNodeSelected === object)
	{ return true; }
	
	if (this.currentGeneralObjectSelected === object)
	{ return true; }
	
	return false;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.clearCurrents = function()
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
	
	//임시로 추가한 코드, 다시 구상해야함.
	if (this.currentGeneralObjectSelected && this.currentGeneralObjectSelected.endCall && typeof this.currentGeneralObjectSelected.endCall === 'function') 
	{
		this.currentGeneralObjectSelected.endCall.call(this.currentGeneralObjectSelected);
	}

	this.currentGeneralObjectSelected = undefined;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.TEST__CurrGeneralObjSel = function()
{
	if (this.currentGeneralObjectSelected)
	{ return true; }
	else
	{ return false; }
};
