'use strict';

/**
 * SelectionManager. This class manages the selection process and the selection candidates.
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
var SelectionManager = function(magoManager) 
{
	if (!(this instanceof SelectionManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	//2020 01 24 추가
	this.magoManager = magoManager;

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

	this.selectionFbo = new FBO(this.magoManager.getGl(), this.magoManager.sceneState.drawingBufferWidth, this.magoManager.sceneState.drawingBufferHeight, {matchCanvasSize: true});
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
SelectionManager.prototype.setSelectedGeneral = function(selectedObject)
{
	this.currentGeneralObjectSelected = selectedObject;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getSelectedF4dBuilding = function()
{
	return this.currentBuildingSelected;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.setSelectedF4dBuilding = function(building)
{
	this.currentBuildingSelected = building;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getSelectedF4dObject = function()
{
	return this.currentReferenceSelected;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.setSelectedF4dObject = function(object)
{
	this.currentReferenceSelected = object;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getSelectedF4dNode = function()
{
	return this.currentNodeSelected;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.setSelectedF4dNode = function(node)
{
	this.currentNodeSelected = node;
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

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * 
 * @private
 */
SelectionManager.prototype.selectObjectByPixel = function(gl, mouseX, mouseY, bSelectObjects) 
{
	if (bSelectObjects === undefined)
	{ bSelectObjects = false; }

	this.magoManager.selectionFbo.bind(); // framebuffer for color selection.***
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	gl.disable(gl.CULL_FACE);
	
	// Read the picked pixel and find the object.*********************************************************
	var mosaicWidth = 1;
	var mosaicHeight = 1;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 4 x 3x3 pixel, total 9 pixels select.***
	var pixelX = mouseX - Math.floor(mosaicWidth/2);
	var pixelY = this.magoManager.sceneState.drawingBufferHeight - mouseY - Math.floor(mosaicHeight/2); // origin is bottom.***
	
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***

	// now, select the object.***
	// The center pixel of the selection is 12, 13, 14.***
	var centerPixel = Math.floor(totalPixelsCount/2);
	var idx = this.magoManager.selectionColor.decodeColor3(pixels[centerPixel*3], pixels[centerPixel*3+1], pixels[centerPixel*3+2]);
	
	// Provisionally.***
	if (bSelectObjects)
	{ this.selectObjects(idx); }
	else 
	{
		this.currentReferenceSelected = this.referencesMap[idx];
		this.currentOctreeSelected = this.octreesMap[idx];
		this.currentBuildingSelected = this.buildingsMap[idx];
		this.currentNodeSelected = this.nodesMap[idx];
	}
	
	var selectedObject = this.currentReferenceSelected;

	// Additionally check if selected an edge of topology.***
	var selNetworkEdges = this.getSelectionCandidatesFamily("networkEdges");
	if (selNetworkEdges)
	{
		var currEdgeSelected = selNetworkEdges.currentSelected;
		var i = 0;
		while (currEdgeSelected === undefined && i< totalPixelsCount)
		{
			var idx = this.magoManager.selectionColor.decodeColor3(pixels[i*3], pixels[i*3+1], pixels[i*3+2]);
			currEdgeSelected = selNetworkEdges.selectObject(idx);
			i++;
		}
	}
	
	// TEST: Check if selected a cuttingPlane.***
	var selGeneralObjects = this.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		var i = 0;
		while (currObjectSelected === undefined && i< totalPixelsCount)
		{
			var idx = this.selectionColor.decodeColor3(pixels[i*3], pixels[i*3+1], pixels[i*3+2]);
			currObjectSelected = selGeneralObjects.selectObject(idx);
			i++;
		}
	}
	
	// Check general objects.***
	if (selectedObject === undefined)
	{ selectedObject = this.selCandidatesMap[idx]; }
	this.setSelectedGeneral(this.selCandidatesMap[idx]);

	this.magoManager.selectionFbo.unbind();
	gl.enable(gl.CULL_FACE);
};