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
Node.prototype.isReferenceNode = function() 
{
	var isReference = false;
	if (this.data !== undefined)
	{
		var attributes = this.data.attributes;
		if (attributes !== undefined)
		{
			if (attributes.isReference !== undefined)
			{ isReference = attributes.isReference; }
		}
	}
	
	return isReference;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.deleteObjects = function(gl, vboMemoryManager) 
{
	this.parent = undefined;
	var data = this.data;
	if (data !== undefined)
	{
		// Check if this is a reference node.***
		var isReference = this.isReferenceNode();
		
		// No delete neoBuilding if this node is a reference node.***
		if (isReference)
		{ return; }

		if (data.neoBuilding)
		{
			data.neoBuilding.deleteObjects(gl, vboMemoryManager);
			data.neoBuilding = undefined;
		}
		
		if (data.geographicCoord)
		{
			data.geographicCoord.deleteObjects();
			data.geographicCoord = undefined;
		}
		
		if (data.rotationsDegree)
		{
			data.rotationsDegree.deleteObjects();
			data.rotationsDegree = undefined;
		}
		
		if (data.bbox)
		{
			data.bbox.deleteObjects();
			data.bbox = undefined;
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
	var data = this.data;
	if (data === undefined)
	{ return; }
	
	var neoBuilding = this.data.neoBuilding;
	if (neoBuilding === undefined)
	{ return; }

	// Update visibleOctreesControler of the neoBuilding & the relativeCurrentCamera.***
	// Note: currentVisibleOctreesControler & myCameraRelative are calculated on MagoManager.getRenderablesDetailedNeoBuildingAsimetricVersion(...).***
	neoBuilding.currentVisibleOctreesControler = data.currentVisibleOctreesControler;
	neoBuilding.myCameraRelative = data.myCameraRelative;

	// Check projectType.*************************
	var metaData = neoBuilding.metaData;
	var projectsType = metaData.projectDataType;
	//--------------------------------------------
	
	var rootNode = this.getRoot();
	var geoLocDataManager = rootNode.data.geoLocDataManager;

	// 1rst, determine the shader.***
	var gl = magoManager.sceneState.gl;
	
	// check attributes of the project.************************************************
	var project = magoManager.hierarchyManager.getNodesMap(data.projectId);
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
	if (data.attributes.flipYTexCoords !== undefined)
	{ flipYTexCoord = data.attributes.flipYTexCoords; }

	gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
	
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);

	// magoManager.tempSettings.renderWithTopology === 0 -> render only Building.***
	// magoManager.tempSettings.renderWithTopology === 1 -> render only Topology.***
	// magoManager.tempSettings.renderWithTopology === 2 -> render both.***

	// If this node is a referenceNode type, then, must render all references avoiding the renderingFase.***
	var currRenderingFase = magoManager.renderingFase;
	if (this.isReferenceNode())
	{ magoManager.renderingFase = -10; } // set a strange value to skip avoiding rendering fase of references objects.***
	
	neoBuilding.currentLod = data.currentLod; // update currentLod.***
	neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord, data.currentLod);
	
	magoManager.renderingFase = currRenderingFase;
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
	var data = this.data;
	var neoBuilding = data.neoBuilding;
	
	var nodeRoot = this.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	var realBuildingPos = this.getBBoxCenterPositionWorldCoord(geoLoc);
	var radiusAprox;
	if (neoBuilding !== undefined)
	{ radiusAprox = neoBuilding.bbox.getRadiusAprox(); }
	else
	{ radiusAprox = data.bbox.getRadiusAprox(); }
	
	boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
	boundingSphere_Aux.setRadius(radiusAprox);
		
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
		data.distToCam = octree.getMinDistToCameraInTree(relativeCamPos, boundingSphere_Aux, octreesMaxSize);
		boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
		boundingSphere_Aux.setRadius(neoBuilding.bbox.getRadiusAprox());
	}
	else 
	{
		// This is mesh projectType.***
		data.distToCam = cameraPosition.distToSphere(boundingSphere_Aux);
	}

	return data.distToCam;
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
Node.prototype.finishedAnimation = function(magoManager) 
{
	var finished = false;
	var animData = this.data.animationData;
	
	if (animData === undefined)
	{ return true; }
	
	// calculate the currentLocation and currentRotation.***
	var currTime = magoManager.getCurrentTime();
	if (animData.lastTime === undefined)
	{ animData.lastTime = animData.birthTime; }
	
	var deltaTime = (currTime - animData.lastTime)/1000.0; // in seconds.***
	var totalDeltaTime = (currTime - animData.birthTime)/1000.0; // in seconds.***
	var factor = deltaTime/animData.durationInSeconds;
	factor *= 100.0;
	
	var nextLongitude;
	var nextLatitude;
	var nextAltitude;
	
	var geoLocDatamanager = this.getNodeGeoLocDataManager();
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	
	if (totalDeltaTime > animData.durationInSeconds)
	{
		nextLongitude = animData.targetLongitude;
		nextLatitude = animData.targetLatitude;
		nextAltitude = animData.targetAltitude;
		
		// finish the process.***
		finished = true;
	}
	else
	{
		// calculate by durationInSeconds.***
		var currLongitude = geoLocationData.geographicCoord.longitude;
		var currLatitude = geoLocationData.geographicCoord.latitude;
		var currAltitude = geoLocationData.geographicCoord.altitude;
		
		var targetLongitude = animData.targetLongitude;
		var targetLatitude = animData.targetLatitude;
		var targetAltitude = animData.targetAltitude;
		
		var dir = new Point3D(); // use point3d with geographic coordinates.***
		dir.set(targetLongitude - currLongitude, targetLatitude - currLatitude, targetAltitude - currAltitude);
		dir.unitary();
		
		nextLongitude = currLongitude + dir.x * factor;
		nextLatitude = currLatitude + dir.y * factor;
		nextAltitude = currAltitude + dir.z * factor;
		
		// finally update "lastTime".***
		animData.lastTime = currTime;
		finished = false;
	}
	
	this.changeLocationAndRotation(nextLatitude, nextLongitude, nextAltitude, geoLocationData.heading, geoLocationData.pitch, geoLocationData.roll, magoManager);
	
	return finished;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.changeLocationAndRotationAnimated = function(latitude, longitude, elevation, heading, pitch, roll, magoManager, durationInSeconds) 
{
	// Provisionally set a geoLocationData target.************************************
	if (this.data.animationData === undefined)
	{ this.data.animationData = new AnimationData(); }
	
	var animData = this.data.animationData;
	
	animData.birthTime = magoManager.getCurrentTime();
	
	if (durationInSeconds === undefined)
	{ durationInSeconds = 3.0; }
	
	animData.durationInSeconds = durationInSeconds;
	
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
		if (!smartTileOwner.intersectsNode(aNode))
		{
			smartTileOwner.eraseNode(aNode);
					
			// Now, put the node in the corresponent smartTile.***
			var targetDepth = smartTileOwner.targetDepth;
			magoManager.smartTileManager.putNode(targetDepth, aNode, magoManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
/*
Node.prototype.test__octreeModelRefAndIndices_changed = function() 
{
	var data = this.data;
	
	if(data === undefined)
		return false;
	
	var neoBuilding = data.neoBuilding;
	if(neoBuilding === undefined)
		return false;
	
	var octree = neoBuilding.octree;
	if(octree === undefined)
		return true;
	
	var modelRefMotherAndIndices = octree.neoReferencesMotherAndIndices;
	if(modelRefMotherAndIndices === undefined)
		return true;
	
	if(modelRefMotherAndIndices.neoRefsIndices.length === 0 || modelRefMotherAndIndices.motherNeoRefsList.length === 0)
		return true;
	
	return false;
};
*/















