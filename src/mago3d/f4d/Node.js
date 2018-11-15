'use strict';

/**
 * @class Node
 */
var Node = function() 
{
	if (!(this instanceof Node)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// parent.
	this.parent;
	
	// children array.
	this.children = []; 
	
	// data.
	this.data; // {}.
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.deleteObjects = function(gl, vboMemoryManager) 
{
	this.parent = undefined;
	if (this.data)
	{
		if (this.data.neoBuilding)
		{
			this.data.neoBuilding.deleteObjects(gl, vboMemoryManager);
			this.data.neoBuilding = undefined;
		}
		
		if (this.data.geographicCoord)
		{
			this.data.geographicCoord.deleteObjects();
			this.data.geographicCoord = undefined;
		}
		
		if (this.data.rotationsDegree)
		{
			this.data.rotationsDegree.deleteObjects();
			this.data.rotationsDegree = undefined;
		}
		
		if (this.data.bbox)
		{
			this.data.bbox.deleteObjects();
			this.data.bbox = undefined;
		}
		
		this.data = undefined;
	}
	
	if (this.children)
	{
		var childrenCount = this.children.length;
		for (var i=0; i<childrenCount; i++)
		{
			this.children[i].deleteObjects(gl, vboMemoryManager);
			this.children[i] = undefined;
		}
		this.children = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.renderContent = function(magoManager, renderType, refMatrixIdxKey) 
{
	// This function renders the neoBuilding if exist in "data".***
	// renderType = 0 -> depth render.***
	// renderType = 1 -> normal render.***
	// renderType = 2 -> colorSelection render.***
	//--------------------------------------------
	
	if(this.data === undefined)
		return;
	
	var neoBuilding = this.data.neoBuilding;
	if(neoBuilding === undefined)
		return;
	
	var rootNode = this.getRoot();
	var geoLocDataManager = rootNode.data.geoLocDataManager;

	// 1rst, determine the shader.***
	var gl = magoManager.sceneState.gl;
	var metaData = neoBuilding.metaData;
	var projectType = metaData.projectDataType;
	if(projectType === undefined)
		projectType = "";
	
	var currProgram = gl.getParameter(gl.CURRENT_PROGRAM);
	var shaderName = neoBuilding.getShaderName(neoBuilding.currentLod, projectType, renderType);
	var shader = magoManager.postFxShadersManager.getShader(shaderName);
	
	if(shader === undefined)
		return;
	
	if(shader.program !== currProgram)
	{
		// bind the shader program.***
		gl.useProgram(shader.program);
	}
	
	// check attributes of the project.************************************************
	var project = magoManager.hierarchyManager.getNodesMap(this.data.projectId);
	if (project.attributes !== undefined && project.attributes.specularLighting !== undefined && shader.bApplySpecularLighting_loc !== undefined)
	{
		var applySpecLighting = project.attributes.specularLighting;
		if (applySpecLighting)
		{ gl.uniform1i(shader.bApplySpecularLighting_loc, true); }
		else
		{ gl.uniform1i(shader.bApplySpecularLighting_loc, false); }
	}
	// end check attributes of the project.----------------------------------------
	
	// set the currentObjectsRendering.***
	magoManager.renderer.currentObjectsRendering["node"] = this;
	
	var flipYTexCoord = false;
	if (this.data.attributes.flipYTexCoords !== undefined)
		flipYTexCoord = this.data.attributes.flipYTexCoords;

	gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
	
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
	gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
	
	neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.addChildren = function(children) 
{
	children.setParent(this);
	this.children.push(children);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.setParent = function(parent) 
{
	this.parent = parent;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.getRoot = function() 
{
	if (this.parent === undefined)
	{ return this; }
	else
	{
		return this.parent.getRoot();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.getClosestParentWithData = function(dataName) 
{
	if (this.data && this.data[dataName])
	{
		return this;
	}
	else 
	{
		if (this.parent)
		{ return this.parent.getClosestParentWithData(dataName); }
		else { return undefined; }
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.extractNodesByDataName = function(nodesArray, dataname) 
{
	// this function extracts nodes that has a data named dataname, including children.
	if (this.data[dataname])
	{
		nodesArray.push(this);
	}
	
	var childrenCount = this.children.length;
	for (var i=0; i<childrenCount; i++)
	{
		this.children[i].extractNodesByDataName(nodesArray, dataname);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.extractNodes = function(nodesArray) 
{
	// this function extracts nodes that has a data named dataname, including children.
	nodesArray.push(this);
	
	var childrenCount = this.children.length;
	for (var i=0; i<childrenCount; i++)
	{
		this.children[i].extractNodes(nodesArray);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
Node.prototype.getBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	if (this.bboxAbsoluteCenterPos === undefined)
	{
		this.calculateBBoxCenterPositionWorldCoord(geoLoc);
	}
	
	return this.bboxAbsoluteCenterPos;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
Node.prototype.calculateBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	var bboxCenterPoint;
	bboxCenterPoint = this.data.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	this.bboxAbsoluteCenterPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, this.bboxAbsoluteCenterPos);
	
	// Now, must applicate the aditional translation vector. Aditional translation is made when we translate the pivot point.
	if (geoLoc.pivotPointTraslation)
	{
		var traslationVector;
		traslationVector = geoLoc.tMatrix.rotatePoint3D(geoLoc.pivotPointTraslation, traslationVector );
		this.bboxAbsoluteCenterPos.add(traslationVector.x, traslationVector.y, traslationVector.z);
	}
};
















