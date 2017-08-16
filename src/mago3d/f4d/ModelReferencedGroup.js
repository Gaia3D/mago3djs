

'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ModelReferencedGroup
 */
var ModelReferencedGroup = function() 
{
	if (!(this instanceof ModelReferencedGroup)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.modelIdx; // there are only one model.
	this.referencesIdxArray = []; // all references has the same model.
};


/**
 * 어떤 일을 하고 있습니까?
 * @class ModelReferencedGroupsList
 */
var ModelReferencedGroupsList = function() 
{
	if (!(this instanceof ModelReferencedGroupsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.modelReferencedGroupsMap = [];
	this.modelReferencedGroupsArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
ModelReferencedGroupsList.prototype.getModelReferencedGroup = function(modelIdx) 
{
	var modelReferencedGroup = this.modelReferencedGroupsMap[modelIdx];
	
	if (modelReferencedGroup == undefined)
	{
		modelReferencedGroup = new ModelReferencedGroup();
		modelReferencedGroup.modelIdx = modelIdx;
		this.modelReferencedGroupsMap[modelIdx] = modelReferencedGroup;
	}
	
	return modelReferencedGroup;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
ModelReferencedGroupsList.prototype.makeModelReferencedGroupsArray = function() 
{
	this.modelReferencedGroupsArray.length = 0;
	
	var modelRefGroupsCount = this.modelReferencedGroupsMap.length;
	for (var i=0; i<modelRefGroupsCount; i++)
	{
		if (this.modelReferencedGroupsMap[i] != undefined)
		{ this.modelReferencedGroupsArray.push(this.modelReferencedGroupsMap[i]); }
	}
	this.modelReferencedGroupsMap.length = 0;
	
};