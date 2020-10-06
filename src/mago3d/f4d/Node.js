'use strict';

/**
 * This is the geometry container. Is the minimum independent project.
 * @class Node
 * @constructor
 */
var Node = function() 
{
	if (!(this instanceof Node)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * Parent (owner) of this node object. If undefined, this node is the root node.
	 * @type {Node}
	 * @default undefined
	 */
	this.parent;
	
	/**
	 * Children array. This array contains Node objects.
	 * @type {Array}
	 * @default Default length = 0.
	 */
	this.children = []; 
	
	/**
	 * An object that contains all referent data, geometry data, location data, etc.
	 * @type {Object}
	 * @default undefined.
	 */
	this.data; 
};

/**
 * Returns true if this node is a "reference" type node. "Reference" type nodes uses StaticModels geometry.
 * @returns {Boolean} true if this node is a "reference" type node.
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
 * get node state of rander
 * @return {boolean} return this node is ready to render
 */
Node.prototype.isReadyToRender = function()
{
	var geoLocDataManager = this.getNodeGeoLocDataManager();
	if (geoLocDataManager === undefined)
	{ return false; }
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	if (geoLocData === undefined)
	{ return false; }
	var geoCoords = geoLocData.getGeographicCoords();
	if (geoCoords === undefined)
	{ return false; } 
	
	if (geoCoords.longitude === undefined || geoCoords.latitude === undefined || geoCoords.altitude === undefined)
	{
		return false;
	}

	return true;
};

Node.prototype.getId = function() 
{
	if (!this.data) 
	{
		throw new Error('data is not ready.');
	}

	return this.data.nodeId + '#' + this.data.projectId;
};

/**
 * Deletes all datas and all datas of children.
 */
Node.prototype.deleteObjects = function(gl, vboMemoryManager) 
{
	this.parent = undefined;
	var data = this.data;
	if (data !== undefined)
	{
		// Check if this is a reference node.
		var isReference = this.isReferenceNode();
		
		// No delete neoBuilding if this node is a reference node.
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
		
		// Delete geoLocationDataManager, etc. TODO.
		
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
 * Calculates the geographicLocationData of the node.
 * @param {MagoManager} magoManager Main class object of Mago3D.
 * @returns {GeoLocationData} geoLoc The calculated geoLocationData of this node.
 */
Node.prototype.calculateGeoLocData = function(magoManager) 
{
	// This function creates the geoLocationData of "node".
	// Called from magomanager.tilesMultiFrustumCullingFinished(...), flyToBuilding(...)
	var nodeRoot = this.getRoot();

	if (nodeRoot.data.geoLocDataManager === undefined)
	{ nodeRoot.data.geoLocDataManager = new GeoLocationDataManager(); }
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		
	if (geoLoc === undefined)
	{ 
		geoLoc = geoLocDataManager.newGeoLocationData("deploymentLoc"); 
	}
	
	var geographicCoord;
	var rotationsDegree;
	
	if (this.data.geographicCoord === undefined)
	{
		var buildingSeed = this.data.buildingSeed;
		geographicCoord = buildingSeed.geographicCoord;
		rotationsDegree = buildingSeed.rotationsDegree;
	}
	else 
	{
		geographicCoord = this.data.geographicCoord;
		rotationsDegree = this.data.rotationsDegree;
	}
	
	if (rotationsDegree === undefined)
	{ rotationsDegree = new Point3D(0.0, 0.0, 0.0); }
	
	var longitude = geographicCoord.longitude;
	var latitude = geographicCoord.latitude;
	var altitude = geographicCoord.altitude;
	var heading = rotationsDegree.z;
	var pitch = rotationsDegree.x;
	var roll = rotationsDegree.y;
	ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, geoLoc, magoManager);

	this.correctGeoLocationDataByMappingType(geoLoc);
	/*
	// check if use "centerOfBoundingBoxAsOrigin".
	if (this.data.mapping_type === undefined)
	{ this.data.mapping_type= "origin"; }

	if (this.data.mapping_type.toLowerCase() === "boundingboxcenter")
	{
		var rootNode = this.getRoot();
		if (rootNode)
		{
			// now, calculate the root center of bbox.
			var buildingSeed = this.data.buildingSeed;
			var buildingSeedBBox = buildingSeed.bBox;
			this.pointSC = buildingSeedBBox.getCenterPoint(this.pointSC);
			ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
		}
	}
	else if (this.data.mapping_type.toLowerCase() === "boundingboxbottomcenter")
	{
		var rootNode = this.getRoot();
		if (rootNode)
		{
			// now, calculate the root center of bbox.
			var buildingSeed = this.data.buildingSeed;
			var buildingSeedBBox = buildingSeed.bBox;
			this.pointSC = buildingSeedBBox.getBottomCenterPoint(this.pointSC);
			ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
		}
	}
	
	*/
	return geoLoc;
};

/**
 * Calculates the geographicLocationData of the node.
 * @param {MagoManager} magoManager Main class object of Mago3D.
 * @returns {GeoLocationData} geoLoc The calculated geoLocationData of this node.
 */
Node.prototype.correctGeoLocationDataByMappingType = function(geoLoc) 
{
	if (this.data.mapping_type === undefined)
	{ 
		this.data.mapping_type= "origin"; 
		return;
	}

	// check if use "centerOfBoundingBoxAsOrigin".
	var buildingSeed = this.data.buildingSeed;
	if (buildingSeed === undefined)
	{ return; }

	var buildingSeedBBox = buildingSeed.bBox;
		
	if (this.data.mapping_type.toLowerCase() === "boundingboxcenter")
	{
		// now, calculate the root center of bbox.
		this.pointSC = buildingSeedBBox.getCenterPoint(this.pointSC);
	}
	else if (this.data.mapping_type.toLowerCase() === "boundingboxbottomcenter")
	{
		// now, calculate the root center of bbox.
		this.pointSC = buildingSeedBBox.getBottomCenterPoint(this.pointSC);
	}
	else
	{
		geoLoc.pivotPointTraslationLC = undefined;
		this.pointSC =new Point3D(0, 0, 0);
	}

	ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
};

Node.prototype.checkChangesHistoryMovements = function() 
{
	var moveHistoryMap = this.data.moveHistoryMap;
	if (moveHistoryMap === undefined)
	{ return; }
	
	var neoBuilding = this.data.neoBuilding;
	///for (var changeHistory of moveHistoryMap.values()) 
	
	for (var key in moveHistoryMap)
	{
		if (Object.prototype.hasOwnProperty.call(moveHistoryMap, key)) 
		{
			var changeHistory = moveHistoryMap[key];
			var objectIndexOrder = changeHistory.getObjectIndexOrder();
			var refObject = neoBuilding.getReferenceObject(objectIndexOrder);
			if (refObject === undefined)
			{ continue; }
			
			if (refObject.moveVector === undefined)
			{ refObject.moveVector = new Point3D(); }
			
			if (refObject.moveVectorRelToBuilding === undefined)
			{ refObject.moveVectorRelToBuilding = new Point3D(); }
			
			var moveVector = changeHistory.getReferenceObjectAditionalMovement();
			var moveVectorRelToBuilding = changeHistory.getReferenceObjectAditionalMovementRelToBuilding();
			refObject.moveVectorRelToBuilding.set(moveVectorRelToBuilding.x, moveVectorRelToBuilding.y, moveVectorRelToBuilding.z);
			refObject.moveVector.set(moveVector.x, moveVector.y, moveVector.z);
			
			// now check if the building was rotated.
			var rootNode = this.getRoot();
			if (rootNode === undefined)
			{ continue; }
			
			var geoLocdataManager = rootNode.getNodeGeoLocDataManager();
			var geoLoc = geoLocdataManager.getCurrentGeoLocationData();
			// if was rotated then recalculate the move vector.
			refObject.moveVector = geoLoc.tMatrix.rotatePoint3D(refObject.moveVectorRelToBuilding, refObject.moveVector); 
			
			// if was no rotated, then set the moveVector of the changeHistory.
			//refObject.moveVectorRelToBuilding.set(moveVectorRelToBuilding.x, moveVectorRelToBuilding.y, moveVectorRelToBuilding.z);	
		}
	}
};

/**
 * Checks if there are some objects that was changed the color.
 */
Node.prototype.checkChangesHistoryColors = function() 
{
	var data = this.data;
	
	if (data === undefined)
	{ return; }
	
	var colorChangedHistoryMap = data.colorChangedHistoryMap;
	
	if (colorChangedHistoryMap === undefined)
	{ return; }
	
	var node = this;
	
	for (var key in colorChangedHistoryMap)
	{
		if (Object.prototype.hasOwnProperty.call(colorChangedHistoryMap, key)) 
		{
			var changeHistory = colorChangedHistoryMap[key];
			if (changeHistory.objectId === null || changeHistory.objectId === undefined || changeHistory.objectId === "" )
			{
				if (changeHistory.property === null || changeHistory.property === undefined || changeHistory.property === "" )
				{
					// change color for all node.
					data.isColorChanged = true;
					if (data.aditionalColor === undefined)
					{ data.aditionalColor = new Color(); }
					
					data.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
				}
				else 
				{
					// there are properties.
					var nodesArray = [];
					node.extractNodes(nodesArray);
					var nodesCount = nodesArray.length;
					var aNode;
					for (var i=0; i<nodesCount; i++)
					{
						aNode = nodesArray[i];
						var propertyKey = changeHistory.propertyKey;
						var propertyValue = changeHistory.propertyValue;
						// 1rst, check if this has the same "key" and same "value".
						if (aNode.data.attributes[propertyKey] !== undefined && aNode.data.attributes[propertyKey].toString() === propertyValue)
						{
							data.isColorChanged = true;
							if (data.aditionalColor === undefined)
							{ data.aditionalColor = new Color(); }
							
							data.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
						}
					}
				}
			}
			else 
			{
				// change color for an object.
				var neoBuilding = node.data.neoBuilding;
				
				if (neoBuilding === undefined)
				{ return; }
				
				var objectId = changeHistory.objectId;
				var objectsArray = neoBuilding.getReferenceObjectsArrayByObjectId(objectId);
				if (objectsArray)
				{
					var objectsCount = objectsArray.length;
					for (var j=0; j<objectsCount; j++)
					{
						var object = objectsArray[j];
						if (object.aditionalColor === undefined)
						{ object.aditionalColor = new Color(); }
						
						object.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
					}
				}
			}	
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.renderContent = function(magoManager, shader, renderType, refMatrixIdxKey) 
{
	// This function renders the renderables that exists in "data".
	// renderType = 0 -> depth render.
	// renderType = 1 -> normal render.
	// renderType = 2 -> colorSelection render.
	// renderType = 3 -> shadowMesh render.
	//--------------------------------------------
	var data = this.data;
	if (data === undefined)
	{ return; }

	if (this.renderCondition && typeof this.renderCondition === 'function') 
	{
		this.renderCondition.call(this, data);
	}
	
	var attributes = data.attributes;
	
	if (attributes)
	{
		if (attributes.isVisible !== undefined && attributes.isVisible === false) 
		{
			return;
		}
		
		if (magoManager.currentProcess === CODE.magoCurrentProcess.DepthShadowRendering)
		{
			if (attributes.castShadow !== undefined && attributes.castShadow === false) 
			{
				return;
			}
		}
	}

	// Check if there are effects.
	if (renderType !== 2 && magoManager.currentProcess !== CODE.magoCurrentProcess.StencilSilhouetteRendering)
	{ var executedEffects = magoManager.effectsManager.executeEffects(data.nodeId, magoManager.getCurrentTime()); }
	
	// Check if we are under selected data structure.***
	var selectionManager = magoManager.selectionManager;
	if (selectionManager.isObjectSelected(this))
	{ selectionManager.parentSelected = true; }
	else 
	{ selectionManager.parentSelected = false; }
	
	var neoBuilding = data.neoBuilding;
	if (neoBuilding === undefined)
	{ return; }

	// Update visibleOctreesControler of the neoBuilding & the relativeCurrentCamera.
	// Note: currentVisibleOctreesControler & myCameraRelative are calculated on MagoManager.getRenderablesDetailedNeoBuildingAsimetricVersion(...).
	neoBuilding.currentVisibleOctreesControler = data.currentVisibleOctreesControler;
	neoBuilding.myCameraRelative = data.myCameraRelative;
	neoBuilding.isColorChanged = data.isColorChanged;
	neoBuilding.aditionalColor = data.aditionalColor;
	
	this.checkChangesHistoryColors();
	this.checkChangesHistoryMovements();

	// Check projectType.*
	var metaData = neoBuilding.metaData;
	var projectsType = metaData.projectDataType;
	//--------------------------------------------
	
	var rootNode = this.getRoot();
	var geoLocDataManager = rootNode.data.geoLocDataManager;

	// 1rst, determine the shader.
	var gl = magoManager.sceneState.gl;
	
	// check attributes of the project.
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
	
	
	// set the currentObjectsRendering.
	magoManager.renderer.currentObjectsRendering.curNode = this;
	
	var flipYTexCoord = false;
	if (data.attributes.flipYTexCoords !== undefined)
	{ flipYTexCoord = data.attributes.flipYTexCoords; }

	gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
	
	var currRenderingFase = magoManager.renderingFase;
	if (this.isReferenceNode())
	{ magoManager.renderingFase = -10; } // set a strange value to skip avoiding rendering fase of references objects.

	// Check the geoLocationDatasCount & check if is a ghost-trail-render (trail as ghost).
	// Check if is trail-render.*
	var isTrailRender = this.data.isTrailRender;
	if (isTrailRender !== undefined && isTrailRender === true)
	{
		magoManager.isTrailRender = true;
		gl.depthRange(0.1, 1); // reduce depthRange to minimize blending flickling.
		var geoLocDatasCount = geoLocDataManager.getGeoLocationDatasCount();
		//for(var i=geoLocDatasCount - 1; i>0; i--)
		for (var i=1; i<geoLocDatasCount; i++ )
		{
			var buildingGeoLocation = geoLocDataManager.getGeoLocationData(i);
			buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
						
			var externalAlpha = (geoLocDatasCount - i)/(geoLocDatasCount*7);
			gl.uniform1f(shader.externalAlpha_loc, externalAlpha);

			// If this node is a referenceNode type, then, must render all references avoiding the renderingFase.
			neoBuilding.currentLod = data.currentLod; // update currentLod.
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

	// magoManager.tempSettings.renderWithTopology === 0 -> render only Building.
	// magoManager.tempSettings.renderWithTopology === 1 -> render only Topology.
	// magoManager.tempSettings.renderWithTopology === 2 -> render both.

	// If this node is a referenceNode type, then, must render all references avoiding the renderingFase.
	gl.uniform1f(shader.externalAlpha_loc, 1.0);
	neoBuilding.currentLod = data.currentLod; // update currentLod.
	neoBuilding.render(magoManager, shader, renderType, refMatrixIdxKey, flipYTexCoord, data.currentLod);
	
	magoManager.renderingFase = currRenderingFase; // Return to current renderingFase.
	
	// Finally, if there are no animationData, then delete the trailEfect.
	if (this.data.animationData !== undefined && this.data.animationData.finished === true)
	{
		if (geoLocDataManager.getGeoLocationDatasCount() > 1)
		{ geoLocDataManager.popGeoLocationData(); }
		else
		{ 
			this.data.animationData = undefined;
		}
	}
	
	// Test.
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
		// Note: topology data is loaded (if exist) when loads the metaData in "prepareNeoBuildingsAsimetricVersion" in magoManager.
		if(magoManager.tempSettings.renderWithTopology === 1 || magoManager.tempSettings.renderWithTopology === 2)
		{
			// render the topology.
			if (renderType !== 0)
			{
				gl.uniform1i(shader.bApplySsao_loc, false); // no apply ssao.
				gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
				var network = neoBuilding.network;
				if (network)
				{
					network.render(magoManager, shader, renderType);
				}
				gl.uniform1i(shader.bApplySsao_loc, true); // apply ssao default.
			}
		}
	}
	*/
	
	if (executedEffects)
	{
		// must return all uniforms changed for effects.
		gl.uniform3fv(shader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
		
		if (renderType === 1)
		{
			gl.uniform4fv(shader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
		}
	}
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
 * @param {function} renderCondition
 */
Node.prototype.setRenderCondition = function(renderCondition) 
{
	if (!renderCondition || typeof renderCondition !== 'function') 
	{
		throw new Error('renderCondition is required.');
	}
	this.renderCondition = renderCondition;
};
/**
 * @return {function}
 */
Node.prototype.getRenderCondition = function() 
{
	return this.renderCondition;
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
		// 1rst, check if exist neoBuilding's metaData.
		var neoBuilding = data.neoBuilding;
		if (neoBuilding !== undefined && neoBuilding.metaData !== undefined)
		{
			var metaData = neoBuilding.metaData;
			data.bbox = new BoundingBox(); // Only create a node's bbox when exist neoBuilding's metaData.
			data.bbox.copyFrom(metaData.bbox);
			bbox = data.bbox;
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
	
	return bbox;
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
	var data = this.data;

	var mapping_type = data.mapping_type;
	
	if (mapping_type === undefined)
	{ mapping_type = "origin"; }

	var bboxAbsoluteCenterPosAux;
	var bboxCenterPoint = new Point3D(0, 0, 0);
	if (mapping_type.toLowerCase() === "origin")
	{
		if (!data.bbox) 
		{
			this.getBBox();
		}
		// this.data.bbox is the most important bbox.
		bboxCenterPoint = data.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
	}
	else if (mapping_type.toLowerCase() === "boundingboxcenter")
	{
		bboxCenterPoint.set(0, 0, 0);
	}
	else if (mapping_type.toLowerCase() === "boundingboxbottomcenter")
	{
		var bboxHeight = data.bbox.getZLength();
		bboxCenterPoint.set(0, 0, bboxHeight/2);
	}

	bboxAbsoluteCenterPosAux = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, bboxAbsoluteCenterPosAux);
	
	// Now, must applicate the additional translation vector. Additional translation is made when we translate the pivot point.
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
 * @returns {Boolean} applyOcclusionCulling
 */
Node.prototype.getBoundingSphereWC = function(resultBoundingSphere) 
{
	if (this.bboxAbsoluteCenterPos === undefined) 
	{ return resultBoundingSphere; }
	
	if (resultBoundingSphere === undefined)
	{ resultBoundingSphere = new BoundingSphere(); }
	
	var nodeRoot = this.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	
	var realBuildingPos = this.getBBoxCenterPositionWorldCoord(geoLoc);
	var radiusAprox;
	var bbox = this.getBBox();
	radiusAprox = bbox.getRadiusAprox(); 
	
	resultBoundingSphere.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
	resultBoundingSphere.setRadius(radiusAprox);
	
	return resultBoundingSphere;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns {Boolean} applyOcclusionCulling
 */
Node.prototype.getDistToCamera = function(cameraPosition, boundingSphere_Aux) 
{
	var data = this.data;

	var nodeRoot = this.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	
	// To calculate realBuildingPosition, we need this.data.bbox.
	// If this.data.bbox no exist, then calculate a provisional value.
	if (this.bboxAbsoluteCenterPos === undefined) 
	{
		if (data.mapping_type === undefined)
		{ data.mapping_type = "origin"; }
		
		var bboxCenterPoint = new Point3D(0, 0, 0);
		if (data.mapping_type.toLowerCase() === "origin")
		{
			if (!this.data.bbox) 
			{
				this.getBBox();
			}
			// this.data.bbox is the most important bbox.
			bboxCenterPoint = this.data.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
		}
		else if (data.mapping_type.toLowerCase() === "boundingboxcenter")
		{
			bboxCenterPoint.set(0, 0, 0);
		}
		else if (data.mapping_type.toLowerCase() === "boundingboxbottomcenter")
		{
			var bboxHeight = this.data.bbox.getZLength();
			bboxCenterPoint.set(0, 0, bboxHeight/2);
		}
		
		this.bboxAbsoluteCenterPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, this.bboxAbsoluteCenterPos);
	}
	
	var realBuildingPos = this.getBBoxCenterPositionWorldCoord(geoLoc);
	var radiusAprox;
	var bbox = this.getBBox();
	radiusAprox = bbox.getRadiusAprox(); 
	
	boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
	boundingSphere_Aux.setRadius(radiusAprox);
	
	// Special treatment for point-cloud data. 
	var neoBuilding = data.neoBuilding;
	var metaData = neoBuilding.metaData;
	var projectsType = metaData.projectDataType;
	if (projectsType && (projectsType === 4 || projectsType === 5))
	{
		// This is pointsCloud projectType.
		// Calculate the distance to camera with lowestOctrees.
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
	
	data.distToCam = cameraPosition.distToSphere(boundingSphere_Aux);

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
 * 현재 데이터가 위치한 정보 획득
 * @return {GeoLocationData}
 */
Node.prototype.getCurrentGeoLocationData = function() 
{
	if (!this.isReadyToRender() || !this.data || !this.data.geoLocDataManager) 
	{
		throw new Error('this node is not ready to use.');
	}
	var geoLoDataManager = this.getNodeGeoLocDataManager();
	return geoLoDataManager.getCurrentGeoLocationData();
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

	var currTime = magoManager.getCurrentTime();
	
	var nextLongitude;
	var nextLatitude;
	var nextAltitude;
	var nextHeading;
	var nextPitch;
	var nextRoll;

	// Check animationType.***
	var autoChangeRotation = animData.autoChangeRotation;
	if (autoChangeRotation === undefined)
	{ autoChangeRotation = false; }
	
	var animType = animData.animationType;
	if (animType === CODE.animationType.PATH)
	{
		// Test.***
		var nextPosLine = AnimationManager.getNextPosition(animData, currTime, magoManager);
		
		if (nextPosLine === undefined)
		{ 
			animData.finished = true;
			return true; 
		}
	
		var path = animData.path;
		var pathGeoLocDataManager = path.getGeoLocationDataManager();
		var pathGeoLocData = pathGeoLocDataManager.getCurrentGeoLocationData();
		
		// Now, calculate the geographic coords of the position.***
		var posLocal = nextPosLine.point;
		var dir = nextPosLine.direction;
		
		// calculate worldPos.***
		var tMat = pathGeoLocData.tMatrix;
		var posWC = tMat.transformPoint3D(posLocal, undefined);
		
		var geographicCoords = Globe.CartesianToGeographicWgs84(posWC.x, posWC.y, posWC.z, undefined);
		nextLatitude = geographicCoords.latitude;
		nextLongitude = geographicCoords.longitude;
		nextAltitude = geographicCoords.altitude;
		//var headingAngle;
		
		if (autoChangeRotation)
		{
			// now calculate heading, pitch & roll.***
			var yAxis = new Point2D(0, 1);
			var dir2d = new Point2D(dir.x, dir.y);
			dir2d.unitary();
			nextHeading = yAxis.angleDegToVector(dir2d);
			if (dir2d.x > 0.0)
			{
				nextHeading *= -1;
			}

			// pitch 랑  roll은 어떡하나요?
		}
		else 
		{
			nextHeading = animData.targetHeading;
			nextPitch = animData.targetPitch;
			nextRoll = animData.targetRoll;
		}
		
		this.changeLocationAndRotation(nextLatitude, nextLongitude, nextAltitude, nextHeading, nextPitch, nextRoll, magoManager);
		
		// finally update "lastTime".
		animData.lastTime = currTime;
		return finished;
	}

	//애니메이션 종료시 true 반환. 
	if (animData.finished)
	{ return true; }


	if (animData.startLongitude === undefined || animData.startLatitude === undefined || animData.startAltitude === undefined)
	{ return true; }
	
	// calculate the currentLocation and currentRotation.
	if (animData.lastTime === undefined)
	{ animData.lastTime = animData.birthTime; }
	
	var totalDeltaTime = (currTime - animData.birthTime)/1000.0; // in seconds.

	// calculate velocity.
	var velocityLon = (animData.targetLongitude - animData.startLongitude)/(animData.durationInSeconds);
	var velocityLat = (animData.targetLatitude - animData.startLatitude)/(animData.durationInSeconds);
	var velocityAlt = (animData.targetAltitude - animData.startAltitude)/(animData.durationInSeconds);

	var geoLocDatamanager = this.getNodeGeoLocDataManager();
	if (geoLocDatamanager === undefined)
	{
		return true;
	}
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	if (geoLocationData === undefined)
	{
		return true;
	}
	var geographicCoord = geoLocationData.geographicCoord;

	if (totalDeltaTime > animData.durationInSeconds)
	{
		nextLongitude = animData.targetLongitude;
		nextLatitude = animData.targetLatitude;
		nextAltitude = animData.targetAltitude;

		nextHeading = animData.targetHeading;
		nextPitch = animData.targetPitch;
		nextRoll = animData.targetRoll;
		
		// finish the process.
		finished = true;
		this.data.animationData.finished = true;
	}
	else
	{
		var ratio = totalDeltaTime/animData.durationInSeconds;
		var completeHeadingRatio = 0.3;
		if (ratio > completeHeadingRatio)
		{
			nextHeading = animData.targetHeading;
			nextPitch = animData.targetPitch;
			nextRoll = animData.targetRoll;
		}
		else 
		{
			var diffHeading = (animData.targetHeading - animData.startHeading);
			nextHeading = animData.startHeading + diffHeading * ratio / completeHeadingRatio;
			nextPitch = animData.startPitch;
			nextRoll = animData.startRoll;
		}

		// calculate by durationInSeconds.
		var targetLongitude = animData.targetLongitude;
		var targetLatitude = animData.targetLatitude;
		var targetAltitude = animData.targetAltitude;
		
		nextLongitude = animData.startLongitude + velocityLon * totalDeltaTime;
		nextLatitude = animData.startLatitude + velocityLat * totalDeltaTime;
		nextAltitude = animData.startAltitude + velocityAlt * totalDeltaTime;
		
		// finally update "lastTime".
		animData.lastTime = currTime;
		finished = false;
	}
	this.changeLocationAndRotation(nextLatitude, nextLongitude, nextAltitude, nextHeading, nextPitch, nextRoll, magoManager);
	
	return finished;
};

/**
 * 어떤 일을 하고 있습니까?
 */
 
Node.prototype.changeLocationAndRotationAnimated = function(latitude, longitude, elevation, heading, pitch, roll, magoManager, animationOption) 
{
	// Provisionally set a geoLocationData target.
	if (this.data.animationData === undefined)
	{ this.data.animationData = new AnimationData(); }
	
	var animData = this.data.animationData;
	animData.finished = false;
	
	// New for animation by path.***
	animData.animationType = animationOption.animationType;
	animData.path = animationOption.path;
	animData.linearVelocityInMetersSecond = animationOption.linearVelocityInMetersSecond;
	animData.autoChangeRotation = animationOption.autoChangeRotation;
	// End animation by path.***
	
	var geoLocDataManager = this.getNodeGeoLocDataManager();
	if (geoLocDataManager === undefined)
	{ return; }
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	if (geoLocData === undefined)
	{ return; }
	var prevGeoLocData = geoLocDataManager.getGeoLocationData(1);
	if (prevGeoLocData === undefined)
	{ prevGeoLocData = geoLocDataManager.getCurrentGeoLocationData(); }
	var geoCoords = geoLocData.getGeographicCoords();
	if (geoCoords === undefined)
	{ return; } 
	
	if (geoCoords.longitude === undefined || geoCoords.latitude === undefined || geoCoords.altitude === undefined)
	{
		return;
	}
	
	// Check if the target location is equal to the current location.***
	// 대상 정지 시 gps 신호가 고르지 않아 일정 길이 이하의 차이 일 시 움직이지 않는다.
	var lonDiff = geoCoords.longitude - longitude;
	var latDiff = geoCoords.latitude - latitude; 
	var altDiff = geoCoords.altitude - elevation;

	var geoDist = Math.sqrt(lonDiff*lonDiff + latDiff*latDiff);
	var errTolerance = 0.000065;//0.000056;	
	if (geoDist < errTolerance)
	{
		animData.finished = true;
		return;
	}
	animData.birthTime = magoManager.getCurrentTime();
	// start location.***
	animData.startLongitude = geoCoords.longitude;
	animData.startLatitude = geoCoords.latitude;
	animData.startAltitude = geoCoords.altitude;


	while (geoLocData.heading > 360) 
	{
		geoLocData.heading -= 360;
	}

	while (geoLocData.heading < -360) 
	{
		geoLocData.heading += 360;
	}

	animData.startHeading = geoLocData.heading;
	animData.startPitch = geoLocData.pitch;
	animData.startRoll = geoLocData.roll;
	
	// target location.
	animData.targetLongitude = longitude;
	animData.targetLatitude = latitude;
	animData.targetAltitude = elevation;
	
	// calculate rotation (heading & pitch).
	var currLongitude = geoCoords.longitude;
	var currLatitude = geoCoords.latitude;
	var currAltitude = geoCoords.altitude;

	// target rotation.
	animData.targetHeading = heading;
	animData.targetPitch = pitch;
	animData.targetRoll = roll;

	//geoLocData.heading = animData.targetHeading;
	//geoLocData.pitch = animData.targetPitch;
	//geoLocData.roll = animData.targetRoll;

	//Duration For compatibility with lower versions, lower version parameter is just duration(number).
	var isAnimOption = typeof animationOption === 'object' && isNaN(animationOption);
	var durationInSeconds = 3.0;
	if (isAnimOption)
	{
		if (animationOption.duration)
		{
			durationInSeconds = animationOption.duration;
		}
		if (animationOption.autoChangeRotation)
		{
			var nextPos = Globe.geographicToCartesianWgs84(animData.targetLongitude, animData.targetLatitude, animData.targetAltitude, undefined);
			var nextPoint3d = new Point3D(nextPos[0], nextPos[1], nextPos[2]);
			var relativeNextPos;
			relativeNextPos = prevGeoLocData.getTransformedRelativePositionNoApplyHeadingPitchRoll(nextPoint3d, relativeNextPos);

			relativeNextPos.unitary();
			var yAxis = new Point2D(0, 1);


			var relNextPos2D = new Point2D(relativeNextPos.x, relativeNextPos.y);
			relNextPos2D.unitary();
			
			
			var headingAngle = yAxis.angleDegToVector(relNextPos2D);
			if (relativeNextPos.x > 0)
			{
				headingAngle *= -1;
			}
			//if (headingAngle < 0) { headingAngle += 360; }

			//var diffAngle = headingAngle - animData.startHeading;
			if (headingAngle > 180)
			{ headingAngle -= 360; }
			else if (headingAngle < 180)
			{ headingAngle += 360; }
			
			// calculate heading (initially yAxis to north).
			var nextHeading = headingAngle;//Math.atan(-relativeNextPos.x/relativeNextPos.y)*180.0/Math.PI;
			var nextPosModule2d = Math.sqrt(relativeNextPos.x*relativeNextPos.x + relativeNextPos.y*relativeNextPos.y);
			var nextPitch = 0;//Math.atan(relativeNextPos.z/nextPosModule2d)*180.0/Math.PI;


			while (nextHeading > 360) 
			{
				nextHeading -= 360;
			}

			while (nextHeading < -360) 
			{
				nextHeading += 360;
			}

			var diffHeading = (nextHeading - animData.startHeading);
			if (diffHeading > 180) 
			{
				nextHeading -= 360;
			}
			else if (diffHeading < -180) 
			{
				nextHeading += 360;
			}

			if (geoDist < errTolerance*1.5 && relNextPos2D.y < 0.1)
			{
				nextHeading = animData.startHeading;
			}

			animData.targetHeading = nextHeading;
			animData.targetPitch = nextPitch;
			// roll is always zero.
			animData.targetRoll = roll;  
		}
		else 
		{
			while (heading > 360) 
			{
				heading -= 360;
			}

			while (heading < -360) 
			{
				heading += 360;
			}

			var diffHeading = (heading - animData.startHeading);
			if (diffHeading > 180) 
			{
				heading -= 360;
			}
			else if (diffHeading < -180) 
			{
				heading += 360;
			}
			animData.targetHeading = heading;
		}
	}
	else
	{
		durationInSeconds = animationOption;
	}

	//if (durationInSeconds === undefined)
	//{ durationInSeconds = 3.0; }
	animData.durationInSeconds = durationInSeconds;
	// linear velocity in m/s.
	//animData.linearVelocityInMetersSecond = 40.0;
				
	// angular velocity deg/s.
	//animData.headingAngDegSecondVelocity = 10.0;
	//animData.pitchAngDegSecondVelocity = 0.0;
	//animData.rollAngDegSecondVelocity = 0.0;
	// end setting geoLocDataTarget.--------------------------------------------------
	
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.nodeMoved = function(node) 
{
	// node was moved, so, check if is out of the smartTileOwner.
	// If node is out of the smartTileOwner, then, erase the node from the smartTileOwner, and then put the node in the corresponent smartTile.
	if (node === undefined)
	{ return; }
	
	var smartTileOwner = node.data.smartTileOwner;
	if (!smartTileOwner.intersectsNode(node))
	{
		smartTileOwner.eraseNode(node);
				
		// Now, put the node in the corresponent smartTile.
		var targetDepth = smartTileOwner.targetDepth;
		magoManager.smartTileManager.putNode(targetDepth, node, magoManager);
	}
};

/**
 * attribute height reference에 따라 높이를 보정
 * @param {MagoManager} magoManager
 */
Node.prototype.isNeedValidHeight = function(magoManager) 
{
	if (!magoManager.isCesiumGlobe()
	||	!this.data 
	|| !this.data.attributes 
	|| !this.data.attributes.heightReference 
	|| this.data.attributes.heightReference === HeightReference.NONE)
	{
		return false;
	}

	return true;
};

/**
 * 
 * TODO : ARGS CHANGE OBJECT
 * 어떤 일을 하고 있습니까?
 * 
 */
Node.prototype.changeLocationAndRotation = function(latitude, longitude, elevation, heading, pitch, roll, magoManager) 
{
	
	var nodeRoot;
	//nodeRoot = this.getRoot(); // original.
	nodeRoot = this.getClosestParentWithData("geoLocDataManager");
	// 126.60625627706231
	
	if (nodeRoot === undefined)
	{ return; }
	
	if (!nodeRoot.data.bbox)
	{
		return;
	}
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
		if (geoLocDatamanager === undefined)
		{ continue; }
		var geoLocationData;
		if (this.data.animationData !== undefined)
		{
			geoLocationData = geoLocDatamanager.newGeoLocationData();
		}
		else 
		{
			geoLocationData = geoLocDatamanager.getCurrentGeoLocationData(); // original.
		}
		if (geoLocationData === undefined)
		{ continue; }
	
		geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, magoManager);
		this.correctGeoLocationDataByMappingType(geoLocationData);
		
		if (geoLocationData === undefined)
		{ continue; }
	
		if (geoLocationData.geographicCoord === undefined)
		{ continue; } 
	
		// Change the geoCoords of the buildingSeed.
		var buildingSeed = aNode.data.buildingSeed;
		if (buildingSeed)
		{
			buildingSeed.geographicCoordOfBBox.longitude = longitude;
			buildingSeed.geographicCoordOfBBox.latitude = latitude;
		}

		
		// now, must change the keyMatrix of the references of the octrees of all buildings of this node.
		var neoBuilding = aNode.data.neoBuilding;
		if (neoBuilding.octree)
		{
			neoBuilding.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
		}
		neoBuilding.calculateBBoxCenterPositionWorldCoord(geoLocationData);
		nodeRoot.bboxAbsoluteCenterPos = undefined; // provisional.
		nodeRoot.bboxAbsoluteCenterPos = nodeRoot.calculateBBoxCenterPositionWorldCoord(geoLocationData); // provisional.
		
		aNode.bboxAbsoluteCenterPos = undefined; // provisional.
		aNode.bboxAbsoluteCenterPos = aNode.calculateBBoxCenterPositionWorldCoord(geoLocationData); // provisional.
		
		// Now, calculate the geoCoords of the bbox.
		if (nodeRoot.data.bbox.geographicCoord === undefined)
		{ nodeRoot.data.bbox.geographicCoord = new GeographicCoord(); }
		
		nodeRoot.data.bbox.geographicCoord.setLonLatAlt(longitude, latitude, elevation); // provisional. Must calculate the ... TODO:
		
		// aNode was moved, so, check if is out of the smartTileOwner.
		// If aNode is out of the smartTileOwner, then, erase the node from the smartTileOwner, and then put the node in the corresponent smartTile.
		var smartTileOwner = aNode.data.smartTileOwner;
		if (!smartTileOwner.intersectsNode(aNode))
		{
			smartTileOwner.eraseNode(aNode);
					
			// Now, put the node in the corresponent smartTile.
			var targetDepth = smartTileOwner.depth;
			magoManager.smartTileManager.putNode(targetDepth, aNode, magoManager);
		}
	}
};
/**
 * do intersect check With Polygon2D
 * @param {Polygon2D} polygon2D 
 * @return {boolean}
 */
Node.prototype.intersectionWithPolygon2D = function(polygon2D) 
{
	var bbox = this.data.bbox;
	var currentGeoLocationData = this.getCurrentGeoLocationData();
	var tMat = currentGeoLocationData.tMatrix;

	var bboxPolygon2D = bbox.getGeographicCoordPolygon2D(tMat);
	
	return polygon2D.intersectionWithPolygon2D(bboxPolygon2D);
};
/**
 * 높이 레퍼런스 설정에 따른 데이터 높이 계산 후 반환
 * @param {number} terrainHeight 
 * @return {number}
 */
Node.prototype.caculateHeightByReference = function(terrainHeight)
{
	var cp = this.getCurrentGeoLocationData().geographicCoord;
	var bx = this.getBBox();
	var height = 0;
	if (this.data.mapping_type === 'origin')
	{
		height = terrainHeight - bx.minZ;
	}
	else if (this.data.mapping_type === 'boundingboxcenter') 
	{
		var halfZlength = Math.abs(bx.maxZ - bx.minZ) / 2;
		height = terrainHeight + halfZlength;
	}

	if (this.data.attributes.heightReference === HeightReference.RELATIVE_TO_GROUND) 
	{
		height += this.data.originalHeight;// cp.altitude;
	}

	return height;
};
/**
 * 높이 레퍼런스 설정
 * @param {HeightReference} ref 
 * @param {MagoManager} magoManager
 * @emits
 */
Node.prototype.setHeightReference = function(ref, magoManager)
{
	this.data.attributes.heightReference = HeightReference.getNameSpace(ref);
	if (this.data.attributes.heightReference !== HeightReference.NONE)
	{
		if (this.isNeedValidHeight(magoManager)) { magoManager._needValidHeightNodeArray.push(this); }
	}
};

/**
 * 높이 레퍼런스 반환
 * @return {HeightReference}
 */
Node.prototype.getHeightReference = function()
{
	return this.data.attributes.heightReference;
};