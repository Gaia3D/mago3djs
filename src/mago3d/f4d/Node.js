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
	neoBuilding.isColorChanged = data.isColorChanged;
	neoBuilding.aditionalColor = data.aditionalColor;

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
	
	// Check the geoLocationDatasCount & check if is a ghost-trail-render (trail as ghost).***
	var currRenderingFase = magoManager.renderingFase;
	if (this.isReferenceNode())
	{ magoManager.renderingFase = -10; } // set a strange value to skip avoiding rendering fase of references objects.***
	
	// Check if is trail-render.*************************************************************************************************************
	var isTrailRender = this.data.isTrailRender;
	if (isTrailRender !== undefined && isTrailRender === true)
	{
		magoManager.isTrailRender = true;
		gl.depthRange(0.1, 1); // reduce depthRange to minimize blending flickling.***
		var geoLocDatasCount = geoLocDataManager.getGeoLocationDatasCount();
		//for(var i=geoLocDatasCount - 1; i>0; i--)
		if (geoLocDatasCount >= geoLocDataManager.geoLocationDataArrayMaxLengthAllowed - 1)
		{ var hola = 0; }
		for (var i=1; i<geoLocDatasCount; i++ )
		{
			var buildingGeoLocation = geoLocDataManager.getGeoLocationData(i);
			buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
						
			var externalAlpha = (geoLocDatasCount - i)/(geoLocDatasCount*7);
			gl.uniform1f(shader.externalAlpha_loc, externalAlpha);

			// If this node is a referenceNode type, then, must render all references avoiding the renderingFase.***
			neoBuilding.currentLod = data.currentLod; // update currentLod.***
			neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord, data.currentLod);

		}
		gl.depthRange(0, 1);
		magoManager.isTrailRender = false;
	}
	//--------------------------------------------------------------------------------------------------------------------
	var geoLocDataIdx;
	if (geoLocDataManager.getGeoLocationDatasCount() > 1)
	{ geoLocDataIdx = 1; }
	else
	{ geoLocDataIdx = 0; }
	var buildingGeoLocation = geoLocDataManager.getGeoLocationData(geoLocDataIdx);
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);

	// magoManager.tempSettings.renderWithTopology === 0 -> render only Building.***
	// magoManager.tempSettings.renderWithTopology === 1 -> render only Topology.***
	// magoManager.tempSettings.renderWithTopology === 2 -> render both.***

	// If this node is a referenceNode type, then, must render all references avoiding the renderingFase.***
	gl.uniform1f(shader.externalAlpha_loc, 1.0);
	neoBuilding.currentLod = data.currentLod; // update currentLod.***
	neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord, data.currentLod);
	
	magoManager.renderingFase = currRenderingFase; // Return to current renderingFase.***
	
	// Finally, if there are no animationData, then delete the trailEfect.***
	if (this.data.animationData !== undefined && this.data.animationData.finished === true)
	{
		if (geoLocDataManager.getGeoLocationDatasCount() > 1)
		{ geoLocDataManager.popGeoLocationData(); }
		else
		{ this.data.animationData = undefined; }
	}
	
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
Node.prototype.getBBox = function() 
{
	var bbox;
	var data = this.data;
	if (data.bbox === undefined)
	{
		// 1rst, check if exist neoBuilding's metaData.***
		var neoBuilding = data.neoBuilding;
		if (neoBuilding !== undefined && neoBuilding.metaData !== undefined)
		{
			var metaData = neoBuilding.metaData;
			data.bbox = new BoundingBox(); // Only create a node's bbox when exist neoBuilding's metaData.***
			data.bbox.copyFrom(metaData.bbox);
		}
		else if (data.buildingSeed !== undefined)
		{
			var buildingSeed = data.buildingSeed;
			bbox = buildingSeed.bbox;
		}
	}
	else 
	{
		bbox = data.bbox;
	}
	
	return data.bbox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
Node.prototype.getBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	var bboxAbsoluteCenterPos;
	if (this.bboxAbsoluteCenterPos === undefined)
	{
		bboxAbsoluteCenterPos = this.calculateBBoxCenterPositionWorldCoord(geoLoc);
	}
	else 
	{
		bboxAbsoluteCenterPos = this.bboxAbsoluteCenterPos;
	}
	
	return bboxAbsoluteCenterPos;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param texture 변수
 * @returns texId
 */
Node.prototype.calculateBBoxCenterPositionWorldCoord = function(geoLoc) 
{
	var bboxCenterPoint;
	var bboxAbsoluteCenterPosAux;
	if (this.data.bbox !== undefined)
	{
		// this.data.bbox is the most important bbox.***
		bboxCenterPoint = this.data.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	}
	else if (this.data.neoBuilding !== undefined)
	{
		bboxCenterPoint = this.data.neoBuilding.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	}
	else 
	{
		bboxCenterPoint = new Point3D();
	}

	bboxAbsoluteCenterPosAux = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, bboxAbsoluteCenterPosAux);
	
	// Now, must applicate the aditional translation vector. Aditional translation is made when we translate the pivot point.
	if (geoLoc.pivotPointTraslation)
	{
		var traslationVector;
		traslationVector = geoLoc.tMatrix.rotatePoint3D(geoLoc.pivotPointTraslation, traslationVector );
		bboxAbsoluteCenterPosAux.add(traslationVector.x, traslationVector.y, traslationVector.z);
	}
	
	return bboxAbsoluteCenterPosAux;
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
	
	// To calculate realBuildingPosition, we need this.data.bbox.***
	// If this.data.bbox no exist, then calculate a provisional value.***
	if (this.bboxAbsoluteCenterPos === undefined) 
	{
		if (this.data.bbox !== undefined)
		{
			// this.data.bbox is the most important bbox.***
			var bboxCenterPoint = this.data.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
			this.bboxAbsoluteCenterPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, this.bboxAbsoluteCenterPos);
		}
	}
	
	var realBuildingPos = this.getBBoxCenterPositionWorldCoord(geoLoc);
	var radiusAprox;
	var bbox = this.getBBox();
	radiusAprox = bbox.getRadiusAprox(); 
	
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
	
	var totalDeltaTime = (currTime - animData.birthTime)/1000.0; // in seconds.***

	var nextLongitude;
	var nextLatitude;
	var nextAltitude;
	
	// calculate velocity.***
	var velocityLon = (animData.targetLongitude - animData.startLongitude)/(animData.durationInSeconds);
	var velocityLat = (animData.targetLatitude - animData.startLatitude)/(animData.durationInSeconds);
	var velocityAlt = (animData.targetAltitude - animData.startAltitude)/(animData.durationInSeconds);

	var geoLocDatamanager = this.getNodeGeoLocDataManager();
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	var geographicCoord = geoLocationData.geographicCoord;

	if (totalDeltaTime > animData.durationInSeconds)
	{
		nextLongitude = animData.targetLongitude;
		nextLatitude = animData.targetLatitude;
		nextAltitude = animData.targetAltitude;
		
		// finish the process.***
		finished = true;
		this.data.animationData.finished = true;
	}
	else
	{
		// calculate by durationInSeconds.***
		var targetLongitude = animData.targetLongitude;
		var targetLatitude = animData.targetLatitude;
		var targetAltitude = animData.targetAltitude;
		
		nextLongitude = animData.startLongitude + velocityLon * totalDeltaTime;
		nextLatitude = animData.startLatitude + velocityLat * totalDeltaTime;
		nextAltitude = animData.startAltitude + velocityAlt * totalDeltaTime;
		
		// finally update "lastTime".***
		animData.lastTime = currTime;
		finished = false;
	}

	this.changeLocationAndRotation(nextLatitude, nextLongitude, nextAltitude, geoLocationData.heading, geoLocationData.pitch, geoLocationData.roll, magoManager);
	
	// Set camera position.****************************************
	var camera = magoManager.scene.camera;
	var position = camera.positionWC;

	var target = Cesium.Cartesian3.fromDegrees(nextLongitude, nextLatitude, nextAltitude);
	var range = Cesium.Cartesian3.distance(position, target);
	var hpr = new Cesium.HeadingPitchRange(camera.heading, camera.pitch, range);

	camera.lookAt(target, hpr);
	return finished;
};

/**
 * 어떤 일을 하고 있습니까?
 */
 
Node.prototype.changeLocationAndRotationAnimated = function(latitude, longitude, elevation, heading, pitch, roll, magoManager, animationOption) 
{
	// Provisionally set a geoLocationData target.************************************
	if (this.data.animationData === undefined)
	{ this.data.animationData = new AnimationData(); }
	
	var animData = this.data.animationData;
	animData.finished = false;
	
	animData.birthTime = magoManager.getCurrentTime();
	

	//Duration For compatibility with lower versions, lower version parameter is just duratiuon(number).
	var isAnimOption = typeof animationOption === 'object' && isNaN(animationOption);
	var durationInSeconds = 3.0;
	if(isAnimOption)
	{
		if(animationOption.duration)
		{
			durationInSeconds = animationOption.duration;
		}
	}
	else
	{
		durationInSeconds = animationOption;
	}

	//if (durationInSeconds === undefined)
	//{ durationInSeconds = 3.0; }
	
	animData.durationInSeconds = durationInSeconds;
	
	var geoLocDataManager = this.getNodeGeoLocDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var geoCoords = geoLocData.getGeographicCoords();
	
	// start location.***
	animData.startLongitude = geoCoords.longitude;
	animData.startLatitude = geoCoords.latitude;
	animData.startAltitude = geoCoords.altitude;
	
	// target location.***
	animData.targetLongitude = longitude;
	animData.targetLatitude = latitude;
	animData.targetAltitude = elevation;
	
	// calculate rotation (heading & pitch).***
	var currLongitude = geoCoords.longitude;
	var currLatitude = geoCoords.latitude;
	var currAltitude = geoCoords.altitude;

	// target rotation.***
	animData.targetHeading = heading;
	animData.targetPitch = pitch;
	animData.targetRoll = roll;

	geoLocData.heading = animData.targetHeading;
	geoLocData.pitch = animData.targetPitch;
	geoLocData.roll = animData.targetRoll;

	if(isAnimOption && animationOption.autoChangeRotation)
	{
		var nextPos = Globe.geographicToCartesianWgs84(animData.targetLongitude, animData.targetLatitude, animData.targetAltitude, undefined);
		var nextPoint3d = new Point3D(nextPos[0], nextPos[1], nextPos[2]);
		var relativeNextPos;
		relativeNextPos = geoLocData.getTransformedRelativePositionNoApplyHeadingPitchRoll(nextPoint3d, relativeNextPos);
		
		// calculate heading (initially yAxis to north).***
		var nextHeading = Math.atan(-relativeNextPos.x/relativeNextPos.y)*180.0/Math.PI;
		var nextPosModule2d = Math.sqrt(relativeNextPos.x*relativeNextPos.x + relativeNextPos.y*relativeNextPos.y);
		var nextPitch = Math.atan(relativeNextPos.z/nextPosModule2d)*180.0/Math.PI;
		
		geoLocData.heading = nextHeading;
		geoLocData.pitch = nextPitch;
		geoLocData.roll = animData.targetRoll;
	}
	// linear velocity in m/s.***
	//animData.linearVelocityInMetersSecond = 40.0;
				
	// angular velocity deg/s.***
	//animData.headingAngDegSecondVelocity = 10.0;
	//animData.pitchAngDegSecondVelocity = 0.0;
	//animData.rollAngDegSecondVelocity = 0.0;
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
		var geoLocationData;
		if (this.data.animationData !== undefined)
		{
			geoLocationData = geoLocDatamanager.newGeoLocationData();
		}
		else 
		{
			geoLocationData = geoLocDatamanager.getCurrentGeoLocationData(); // original.***
		}
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















