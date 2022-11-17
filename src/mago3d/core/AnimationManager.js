'use strict';

/**
 * AnimationManager
 * @class AnimationManager
 */
var AnimationManager = function() 
{
	if (!(this instanceof AnimationManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// Nodes animation. Executed if the node is visible.
	this.nodesMap;	
	
	// General animations array. Executed every time.
	this.objectsMap;
};

/**
 * put the node which will move
 * @param {Node} node
 */
AnimationManager.prototype.putNode = function(node) 
{
	if (this.nodesMap === undefined)
	{ this.nodesMap = {}; }
	
	var nodeId = node.data.nodeId;
	this.nodesMap[nodeId] = node;
};

/**
 * put the node which will move
 * @param {Node} node
 */
AnimationManager.prototype.putObject = function(object) 
{
	if (this.objectsMap === undefined)
	{ this.objectsMap = {}; }
	
	var objectId = object.id;
	this.objectsMap[objectId] = object;
};

/**
 * Check whether this node already moved or not
 * @param {MagoManager} magoManager
 */
AnimationManager.prototype.checkAnimation = function(magoManager) 
{
	if (this.nodesMap !== undefined)
	{
		var node;
		for (var key in this.nodesMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.nodesMap, key))
			{
				node = this.nodesMap[key];
				if (node.finishedAnimation(magoManager))
				{
					delete this.nodesMap[key];
					
					magoManager.emit(MagoManager.EVENT_TYPE.ANIMATIONEND, {
						type      : MagoManager.EVENT_TYPE.ANIMATIONEND,
						f4d       : node,
						timestamp : new Date()
					});
				}
				else 
				{
					magoManager.emit(MagoManager.EVENT_TYPE.ANIMATIONING, {
						type      : MagoManager.EVENT_TYPE.ANIMATIONING,
						f4d       : node,
						timestamp : new Date()
					});
				}
			}
		}
	}
	
	// Now, for general objects.***
	if (this.objectsMap !== undefined)
	{
		var object;
		for (var key in this.objectsMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.objectsMap, key))
			{
				object = this.objectsMap[key];
				if (object.finishedAnimation(magoManager))
				{
					delete this.objectsMap[key];
				}
			}
		}
	}
};

/**
 * This function returns the next position & rotation, depending the animationData type.
 */
AnimationManager.getNextPosition = function(animationData, currTime, magoManager) 
{
	if (animationData === undefined)
	{ return true; }

	// Check animationType.***
	var animType = animationData.animationType;
	if (animType === CODE.animationType.PATH)
	{
		return AnimationManager.getNextPositionByPath(animationData, currTime, magoManager);
	}
};

/**
 * This function returns the next position & rotation, for the path-animationData type.
 */
AnimationManager.getNextPositionByPath = function (animationData, currTime, magoManager) 
{
	if (animationData === undefined)
	{ return true; }

	var path = animationData.path;
	if (path === undefined)
	{ return true; }
	
	// Test for bSplineCubic3D path.***
	if (animationData.linearVelocityInMetersSecond === undefined)
	{ animationData.linearVelocityInMetersSecond = 20; } // 20m/s.***
	
	var speed = animationData.linearVelocityInMetersSecond;
	var increTimeSec = (currTime - animationData.birthTime)/1000;
	
	var linearPos = speed*increTimeSec;
	
	if (Path3D.prototype.isPrototypeOf(path))
	{
		var tangentLine = path.getTangent(linearPos, undefined, magoManager);
		
		return tangentLine;
	}
	else if (BSplineCubic3D.prototype.isPrototypeOf(path))
	{
		// If exist animationData.durationInSeconds, then use it.***
		// If no exist animationDuration, check if exist linearVelocity.***
		if (animationData.totalLinearLength === undefined)
		{ 
			if (path.knotPoints3dList === undefined)
			{
				var controlPointArmLength = 0.3;
				path.makeControlPoints(controlPointArmLength, magoManager);
			}
			animationData.totalLinearLength = BSplineCubic3D.getLength(path, interpolationsCount); 
		}

		if (animationData.linearVelocityInMetersSecond !== undefined)
		{
			animationData.durationInSeconds = animationData.totalLinearLength / animationData.linearVelocityInMetersSecond;
		}

		if (animationData.durationInSeconds)
		{
			if (animationData.currentLinearPos && animationData.currentLinearPos >= animationData.totalLinearLength)
			{ return undefined; }
			
			var interpolationsCount = 20;
			
			
			var totalLinearLength = animationData.totalLinearLength;
			var percentualTime = increTimeSec/animationData.durationInSeconds;
			linearPos = totalLinearLength*percentualTime;
			animationData.currentLinearPos = linearPos;
			if (linearPos > totalLinearLength)
			{ linearPos = totalLinearLength; }
		}
		return BSplineCubic3D.getTangent(path, linearPos, undefined, magoManager);
	}
};

AnimationManager.prototype._TEST_SAMPLECODE_nodeAnimation = function (magoManager) 
{
	// this is a sample code to animate an object(f4d) by a path.***
	//--------------------------------------------------------------------------------
	//var projectId = "AutonomousBus";
	//var dataKey = "AutonomousBus_0"; // Do a test.***
	//var projectId = "3ds.json";
	//var dataKey = "GyeomjaeJeongSeon_del";
	//var node = magoManager.hierarchyManager.getNodeByDataKey(projectId, dataKey);
	//--------------------------------------------------------------------------------

	var selectedNode = magoManager.selectionManager.getSelectedF4dNode();
	var node = selectedNode;

	var projectId = node.data.projectId;
	var dataKey = node.data.nodeId; 
	
	node.data.isTrailRender = true; // test.***

	var geoLocDataManager = node.getNodeGeoLocDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var geoCoords = geoLocData.getGeographicCoords();
	var currLon = geoCoords.longitude;
	var currLat = geoCoords.latitude;
	var currAlt = geoCoords.altitude;
	var latitude;
	var longitude;
	var elevation;
	var heading = 45;
	var pitch = 45;
	var roll = undefined; 
	
	// Test 2: moving by a path.***
	var bSplineCubic3d = magoManager.modeler.bSplineCubic3d;
	var geographicCoordsArray = bSplineCubic3d.geoCoordsList.geographicCoordsArray;
	//var path3d = new Path3D(geographicCoordsArray);
	var path3d = bSplineCubic3d;

	if (bSplineCubic3d !== undefined) 
	{
		// do animation by path.***
		// You can use one of the next options: ***************
		// 1) durationInSeconds            : 15
		// 2) linearVelocityInMetersSecond : 50
		//-----------------------------------------------------
		var animationOption = {
			animationType                : CODE.animationType.PATH,
			path                         : path3d,
			linearVelocityInMetersSecond : 50,
			autoChangeRotation           : true
		};
		magoManager.changeLocationAndRotation(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, animationOption);
	}
	

	/*
	// Another test: Change color by projectId & objectId.***
	var api = new API();
	api.apiName = "changeColor";
	api.setProjectId("AutonomousBus");
	api.setDataKey("AutonomousBus_0");
	api.setObjectIds("13");
	api.setColor("220,150,20");
	this.callAPI(api);
	
	// Another test: BSplineCubic3d.***
	var bSplineCubic3d = this.modeler.bSplineCubic3d;
	if (bSplineCubic3d !== undefined)
	{
		if (bSplineCubic3d.geoCoordsList === undefined)
		{ bSplineCubic3d.geoCoordsList = new GeographicCoordsList(); }
		
		var maxLengthDegree = 0.001;
		Path3D.insertPointsOnLargeSegments(bSplineCubic3d.geoCoordsList.geographicCoordsArray, maxLengthDegree, this);
		
		var coordsCount = bSplineCubic3d.geoCoordsList.geographicCoordsArray.length;
		for (var i=0; i<coordsCount; i++)
		{
			var geoCoord = bSplineCubic3d.geoCoordsList.geographicCoordsArray[i];
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
		}
		
		var geoCoordsList = bSplineCubic3d.getGeographicCoordsList();
		geoCoordsList.makeLines(this);
	
		// Make the controlPoints.***
		var controlPointArmLength = 0.2;
		bSplineCubic3d.makeControlPoints(controlPointArmLength, this);
		bSplineCubic3d.makeInterpolatedPoints();
	}
	*/
};













































