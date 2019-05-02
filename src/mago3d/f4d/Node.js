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
		
		// Delete geoLocationDataManager, etc. TODO.***
		
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
Node.prototype.renderContent = function(magoManager, shader, renderType, refMatrixIdxKey) 
{
	// This function renders the neoBuilding if exist in "data".***
	// renderType = 0 -> depth render.***
	// renderType = 1 -> normal render.***
	// renderType = 2 -> colorSelection render.***
	//--------------------------------------------
	
	if (this.data === undefined)
	{ return; }
	
	var neoBuilding = this.data.neoBuilding;
	if (neoBuilding === undefined)
	{ return; }

	// Check projectType.*************************
	var metaData = neoBuilding.metaData;
	var projectsType = metaData.projectDataType;
	//--------------------------------------------
	
	var rootNode = this.getRoot();
	var geoLocDataManager = rootNode.data.geoLocDataManager;

	// 1rst, determine the shader.***
	var gl = magoManager.sceneState.gl;
	
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
	magoManager.renderer.currentObjectsRendering.curNode = this;
	
	var flipYTexCoord = false;
	if (this.data.attributes.flipYTexCoords !== undefined)
	{ flipYTexCoord = this.data.attributes.flipYTexCoords; }

	gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
	
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);

	// magoManager.tempSettings.renderWithTopology === 0 -> render only Building.***
	// magoManager.tempSettings.renderWithTopology === 1 -> render only Topology.***
	// magoManager.tempSettings.renderWithTopology === 2 -> render both.***
	
	neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord);
	
	// Test.***
	/*
	if (neoBuilding.network)
	{
		if(magoManager.tempSettings.renderWithTopology === 0 || magoManager.tempSettings.renderWithTopology === 2)
		{
			neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord);
		}
	}
	else{
		neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord);
	}
	
	if (neoBuilding.network)
	{
		// Note: topology data is loaded (if exist) when loads the metaData in "prepareNeoBuildingsAsimetricVersion" in magoManager.***
		if(magoManager.tempSettings.renderWithTopology === 1 || magoManager.tempSettings.renderWithTopology === 2)
		{
			// render the topology.***
			if (renderType !== 0)
			{
				gl.uniform1i(shader.bApplySsao_loc, false); // no apply ssao.***
				gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.***
				var network = neoBuilding.network;
				if (network)
				{
					network.render(magoManager, shader, renderType);
				}
				gl.uniform1i(shader.bApplySsao_loc, true); // apply ssao default.***
			}
		}
	}
	*/
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

/**
 * 어떤 일을 하고 있습니까?
 * @returns {boolean} applyOcclusionCulling
 */
Node.prototype.getDistToCamera = function(cameraPosition, boundingSphere_Aux) 
{
	var neoBuilding = this.data.neoBuilding;
	
	var nodeRoot = this.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	var realBuildingPos = this.getBBoxCenterPositionWorldCoord(geoLoc);
	
	boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
	boundingSphere_Aux.setRadius(neoBuilding.bbox.getRadiusAprox());
		
	var metaData = neoBuilding.metaData;
	var projectsType = metaData.projectDataType;
	if (projectsType && (projectsType === 4 || projectsType === 5))
	{
		// This is pointsCloud projectType.***
		// Calculate the distance to camera with lowestOctrees.***
		var octree = neoBuilding.octree;
		if (octree === undefined)
		{ return undefined; }
		
		var relativeCamPos;
		relativeCamPos = geoLoc.getTransformedRelativePosition(cameraPosition, relativeCamPos);
		//relativeCam = neoBuilding.getTransformedRelativeEyePositionToBuilding(cameraPosition.x, cameraPosition.y, cameraPosition.z, relativeCam);
		var octreesMaxSize = 120;
		neoBuilding.distToCam = octree.getMinDistToCameraInTree(relativeCamPos, boundingSphere_Aux, octreesMaxSize);
		boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
		boundingSphere_Aux.setRadius(neoBuilding.bbox.getRadiusAprox());
	}
	else 
	{
		// This is mesh projectType.***
		
		neoBuilding.distToCam = cameraPosition.distToSphere(boundingSphere_Aux);
	}

	return neoBuilding.distToCam;
};

/**
 */
Node.prototype.getNodeGeoLocDataManager = function() 
{
	var closestRootNode = this.getClosestParentWithData("geoLocDataManager");
	
	if (closestRootNode === undefined)
	{ return undefined; }

	if (closestRootNode.data === undefined)
	{ return undefined; }
	
	var rootNodeGeoLocDataManager = closestRootNode.data.geoLocDataManager;
	return rootNodeGeoLocDataManager;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.checkAnimation = function(magoManager) 
{
	var animData = this.data.animationData;
	
	if(animData === undefined)
		return;
	
	// calculate the currentLocation and currentRotation.***
	var currTime = magoManager.getCurrentTime();
	if(animData.lastTime === undefined)
		animData.lastTime = animData.birthTime;
	
	var deltaTime = (currTime - animData.lastTime)/1000.0; // in seconds.***
	//var remainTime = animData.durationInSeconds
	
	// calculate by durationInSeconds.***
	var geoLocDatamanager = this.getNodeGeoLocDataManager();
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
		
	var currLongitude = geoLocationData.longitude;
	var currLatitude = geoLocationData.latitude;
	var currAltitude = geoLocationData.altitude;
	
	var targetLongitude = animData.targetLongitude;
	var targetLatitude = animData.targetLatitude;
	var targetAltitude = animData.targetAltitude;
	
	
	
	//var nextLongitude = 
	
	
	// finally update "lastTime".***
	animData.lastTime = currTime;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.changeLocationAndRotationAnimated = function(latitude, longitude, elevation, heading, pitch, roll, magoManager) 
{
	// Provisionally set a geoLocationData target.************************************
	if(this.data.animationData === undefined)
		this.data.animationData = new AnimationData();
	
	var animData = this.data.animationData;
	
	animData.birthTime = magoManager.getCurrentTime();
	animData.durationInSeconds = 3.0;
	
	// target location.***
	animData.targetLongitude = longitude;
	animData.targetLatitude = latitude;
	animData.targetAltitude = elevation;
	
	// target rotation.***
	animData.targetHeading = heading;
	animData.targetPitch = pitch;
	animData.targetRoll = roll;
	
	// linear velocity in m/s.***
	animData.linearVelocityInMetersSecond = 40.0;
	
	// angular velocity deg/s.***
	animData.headingAngDegSecondVelocity = 10.0;
	animData.pitchAngDegSecondVelocity = 0.0;
	animData.rollAngDegSecondVelocity = 0.0;
	// end setting geoLocDataTarget.--------------------------------------------------
	
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.changeLocationAndRotation = function(latitude, longitude, elevation, heading, pitch, roll, magoManager) 
{
	
	var nodeRoot;
	//nodeRoot = this.getRoot(); // original.***
	nodeRoot = this.getClosestParentWithData("geoLocDataManager");
	
	if (nodeRoot === undefined)
	{ return; }
	
	// now, extract all buildings of the nodeRoot.
	var nodesArray = [];
	nodeRoot.extractNodesByDataName(nodesArray, "neoBuilding");
	
			nodeRoot.data.geographicCoord.longitude = longitude; 
			nodeRoot.data.geographicCoord.latitude = latitude; 
			nodeRoot.data.geographicCoord.altitude = elevation;
	
	var aNode;
	var buildingSelected;
	var nodesCount = nodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		aNode = nodesArray[i];
		var geoLocDatamanager = aNode.getNodeGeoLocDataManager();
		var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
		geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, magoManager);
		if (geoLocationData === undefined)
		{ continue; }
	
				// Change the geoCoords of the buildingSeed.***
				var buildingSeed = aNode.data.buildingSeed;
				buildingSeed.geographicCoordOfBBox.longitude = longitude;
				buildingSeed.geographicCoordOfBBox.latitude = latitude;

		// now, must change the keyMatrix of the references of the octrees of all buildings of this node.***
		var neoBuilding = aNode.data.neoBuilding;
		if (neoBuilding.octree)
		{
			neoBuilding.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
		}
		neoBuilding.calculateBBoxCenterPositionWorldCoord(geoLocationData);
		nodeRoot.bboxAbsoluteCenterPos = undefined; // provisional.***
		nodeRoot.calculateBBoxCenterPositionWorldCoord(geoLocationData); // provisional.***
		
		aNode.bboxAbsoluteCenterPos = undefined; // provisional.***
		aNode.calculateBBoxCenterPositionWorldCoord(geoLocationData); // provisional.***
		
				// aNode was moved, so, check if is out of the smartTileOwner.***
				// If aNode is out of the smartTileOwner, then, erase the node from the smartTileOwner, and then put the node in the corresponent smartTile.***
				var smartTileOwner = aNode.data.smartTileOwner;
				if(!smartTileOwner.intersectsNode(aNode))
				{
					smartTileOwner.eraseNode(aNode);
					
					// Now, put the node in the corresponent smartTile.***
					var targetDepth = smartTileOwner.targetDepth;
					magoManager.smartTileManager.putNode(targetDepth, aNode, magoManager);
				}
	}
};
















