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