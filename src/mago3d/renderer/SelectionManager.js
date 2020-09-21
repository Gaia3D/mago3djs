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
	
	
	// Default f4d objectsMap. // Deprecated.
	this.referencesMap = {}; // Deprecated.
	this.octreesMap = {}; // Deprecated.
	this.buildingsMap = {}; // Deprecated.
	this.nodesMap = {}; // Deprecated.

	this.provisionalF4dArray = [];
	this.provisionalF4dObjectArray = [];
	this.provisionalNativeArray = [];
	
	this.currentReferenceSelected; // Deprecated.
	this.currentOctreeSelected; // Deprecated.
	this.currentBuildingSelected; // Deprecated.
	this.currentNodeSelected; // Deprecated.
	this.currentGeneralObjectSelected;
	
	this.currentReferenceSelectedArray = [];
	this.currentOctreeSelectedArray = [];
	this.currentBuildingSelectedArray = [];
	this.currentNodeSelectedArray = [];
	this.currentGeneralObjectSelectedArray = [];
	
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
SelectionManager.prototype.getSelectedGeneralArray = function()
{
	return this.currentGeneralObjectSelectedArray;
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
	if (this.currentNodeSelected)
	{
		return this.currentNodeSelected.data.neoBuilding;
	}
	return undefined;
};

/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.getSelectedF4dBuildingArray = function()
{
	var buildingArray = [];
	var nodeArray = this.getSelectedF4dNodeArray();

	for (var i=0, len=nodeArray.length;i<len;i++) 
	{
		var node = nodeArray[i];
		buildingArray.push(node.data.neoBuilding);
	}

	return buildingArray;
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
SelectionManager.prototype.getSelectedF4dObjectArray = function()
{
	return this.currentReferenceSelectedArray;
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
SelectionManager.prototype.getSelectedF4dNodeArray = function()
{
	return this.currentNodeSelectedArray;
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

	if (this.currentGeneralObjectSelectedArray.indexOf(object) > -1)
	{ return true; }

	if (this.currentNodeSelectedArray.indexOf(object) > -1)
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

	this.currentReferenceSelectedArray = [];
	this.currentOctreeSelectedArray = [];
	this.currentBuildingSelectedArray = [];
	this.currentNodeSelectedArray = [];
	this.currentGeneralObjectSelectedArray = [];
	this.magoManager.isCameraMoved = true;
};
/**
 * SelectionManager
 * 
 * @alias SelectionManager
 * @class SelectionManager
 */
SelectionManager.prototype.clearProvisionals = function()
{
	this.provisionalF4dArray = [];
	this.provisionalF4dObjectArray = [];
	this.provisionalNativeArray = [];
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
 * @deprecated
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
	this.currentReferenceSelected = this.referencesMap[idx];
	this.currentOctreeSelected = this.octreesMap[idx];
	this.currentBuildingSelected = this.buildingsMap[idx];
	this.currentNodeSelected = this.nodesMap[idx];
	
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

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * 
 * @private
 */
SelectionManager.prototype.selectProvisionalObjectByPixel = function(gl, mouseX, mouseY) 
{
	this.clearProvisionals();
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
	
	// Provisionally.**
	if (this.nodesMap[idx])
	{
		this.provisionalF4dArray.push(this.nodesMap[idx]);
	}

	if (this.referencesMap[idx] && this.nodesMap[idx])
	{
		//this.provisionalF4dArray.push(this.nodesMap[idx]);
		this.provisionalF4dObjectArray.push(this.referencesMap[idx]);
	}

	if (this.selCandidatesMap[idx])
	{
		this.provisionalNativeArray.push(this.selCandidatesMap[idx]);
	}

	// TEST: Check if selected a cuttingPlane.***
	/*
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
	*/

	this.magoManager.selectionFbo.unbind();
	gl.enable(gl.CULL_FACE);
};

/**
 * 
 * @param {string} type required.
 * @param {function} filter option.
 */
SelectionManager.prototype.filterProvisional = function(type, filter)
{
	var targetProvisional = {};
	switch (type)
	{
	case DataType.F4D : {
		targetProvisional[type] = this.provisionalF4dArray;
		break;
	}
	case DataType.OBJECT : {
		targetProvisional[DataType.F4D] = this.provisionalF4dArray;
		targetProvisional[type] = this.provisionalF4dObjectArray;
		break;
	}
	case DataType.NATIVE : {
		targetProvisional[type] = this.provisionalNativeArray;
		break;
	}
	}

	var provisionalLength = 0;
	for (var i in targetProvisional)
	{
		if (targetProvisional.hasOwnProperty(i))
		{
			provisionalLength += targetProvisional[i].length;
		}
	}

	if (provisionalLength === 0)
	{
		return;
	}

	filter = filter ? filter : function(){ return true; };
	var result = {};
	for (var i in targetProvisional)
	{
		if (targetProvisional.hasOwnProperty(i))
		{
			var provisional = targetProvisional[i];
			
			for (var j=0, len=provisional.length;j<len;j++)
			{
				var realFilter = filter;
				if (type === DataType.OBJECT && i === DataType.F4D)
				{
					realFilter = function(){ return true; };
				}
				if (realFilter.call(this, provisional[j]))
				{
					if (!result[i]) { result[i] = []; }
					result[i].push(provisional[j]);
				}
			}
		}
	}
	
	return result;
};

/**
 * 
 * @param {string} type required.
 * @param {function} filter option.
 */
SelectionManager.prototype.provisionalToCurrent = function(type, filter) 
{
	var validProvision = this.filterProvisional(type, filter);

	this.clearCurrents();
	if (isEmpty(validProvision)){ return; }

	for (var i in validProvision)
	{
		if (validProvision.hasOwnProperty(i))
		{
			var variableName = getVariableName(i);
			this[variableName.currentMember] = validProvision[i];
			this[variableName.auxMember] = validProvision[i][0];
		}
	}

	this.clearProvisionals();

	function getVariableName(t)
	{
		switch (t)
		{
		case DataType.F4D : {
			return {
				currentMember : 'currentNodeSelectedArray',
				auxMember     : 'currentNodeSelected',
			};
		}
		case DataType.OBJECT : {
			return {
				currentMember : 'currentReferenceSelectedArray',
				auxMember     : 'currentReferenceSelected',
			};
		}
		case DataType.NATIVE : {
			return {
				currentMember : 'currentGeneralObjectSelectedArray',
				auxMember     : 'currentGeneralObjectSelected',
			};
		}
		}
	}
};

/**
 * select object by polygon 2d
 * @param {Polygon2D} polygon2D polygon2d for find object
 * @param {string} type find type
 * @return {Array<object>}
 */
SelectionManager.prototype.selectionByPolygon2D = function(polygon2D, type) {
	this.clearCurrents();
	var frustumVolumeControl = this.magoManager.frustumVolumeControl;
	
	var selectedArray = frustumVolumeControl.selectionByPolygon2D(polygon2D, type);

	if(type === DataType.F4D) {
		this.currentNodeSelectedArray = selectedArray;
		this.currentNodeSelected = selectedArray[0];
	} else if(type === DataType.NATIVE) {
		this.currentGeneralObjectSelectedArray = selectedArray;
		this.currentGeneralObjectSelected = selectedArray[0];
	}

	return selectedArray;
}

/**
 * native 객체 개별 삭제
 * @param {MagoRenderable} native 
 */
SelectionManager.prototype.removeNative = function(native)
{
	var arr = this.getSelectedGeneralArray();

	this.currentGeneralObjectSelectedArray = arr.filter(function(model) {
		return model !== native;
	});
	this.currentGeneralObjectSelected = this.currentGeneralObjectSelectedArray[0];
}