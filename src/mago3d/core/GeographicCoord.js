'use strict';

/**
 * This class represents the coordinate as geographic coordinate system
 * @class GeographicCoord
 */
var GeographicCoord = function(lon, lat, alt) 
{
	if (!(this instanceof GeographicCoord)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.longitude;
	this.latitude;
	this.altitude;
	
	if (lon !== undefined)
	{ this.longitude = lon; }
	
	if (lat !== undefined)
	{ this.latitude = lat; }
	
	if (alt !== undefined)
	{ this.altitude = alt; }

	this.absolutePoint; // x, y, z of the coordinate in wgs84.
	this.vboKeysContainer;
	this.geoLocDataManager;
	this.owner;
};

/**
 * Clear the value of this instance from the vbo key container and geoLocDataManager 
 * @param {VBOMemoryManager}vboMemManager
 */
GeographicCoord.prototype.deleteObjects = function(vboMemManager) 
{
	this.longitude = undefined;
	this.latitude = undefined;
	this.altitude = undefined;
	
	if (this.absolutePoint !== undefined)
	{
		this.absolutePoint.deleteObjects();
		this.absolutePoint = undefined;
	}
	
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
	}
	
	if (this.geoLocDataManager !== undefined)
	{
		this.geoLocDataManager.deleteObjects();
	}
	
	this.owner = undefined;
};

/**
 * Change this GeographicCoord point to Point3D point
 * @param {Point3D} resultPoint3D
 */
GeographicCoord.prototype.getWgs84Point3D = function(resultPoint3d) 
{
	var cartesianAux = Globe.geographicToCartesianWgs84(this.longitude, this.latitude, this.altitude, undefined);
	
	if (resultPoint3d === undefined)
	{ resultPoint3d = new Point3D(); }
	
	resultPoint3d.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
	return resultPoint3d;
};

/**
 * Change this GeographicCoord point to Point2D point using Mercator projection
 * @param {Point2D} resultPoint2d
 */
GeographicCoord.prototype.getMercatorProjection = function(resultPoint2d) 
{
	return Globe.geographicToMercatorProjection(this.longitude, this.latitude, resultPoint2d);
};

/**
 * get the GeoLocationDataManager of this feature
 */
GeographicCoord.prototype.getGeoLocationDataManager = function() 
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	
	return this.geoLocDataManager ;
};

/**
 * Copy the value of the other GeographicCoord feature
 * @param {GeographicCoord} geographicCoord
 */
GeographicCoord.prototype.copyFrom = function(geographicCoord) 
{
	this.longitude = geographicCoord.longitude;
	this.latitude = geographicCoord.latitude;
	this.altitude = geographicCoord.altitude;
};

/**
 * Set lon,lat,alt at this feature
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.setLonLatAlt = function(longitude, latitude, altitude) 
{
	if (longitude !== undefined)
	{ this.longitude = longitude; }
	if (latitude !== undefined)
	{ this.latitude = latitude; }
	if (altitude !== undefined)
	{ this.altitude = altitude; }
};

/**
 * get the middle point between two GeopraphicCoord features
 * @param {GeographicCoord} geographicCoordA
 * @param {GeographicCoord} geographicCoordB
 * @param {GeographicCoord} resultGeographicCoord
 * @return {GeographicCoord}
 */
GeographicCoord.getMidPoint = function(geographicCoordA, geographicCoordB, resultGeographicCoord) 
{
	var midLat = ( geographicCoordA.latitude + geographicCoordB.latitude) / 2.0;
	var midLon = ( geographicCoordA.longitude + geographicCoordB.longitude) / 2.0;
	var midAlt = ( geographicCoordA.altitude + geographicCoordB.altitude) / 2.0;
	
	if (resultGeographicCoord === undefined)
	{ resultGeographicCoord = new GeographicCoord(midLon, midLat, midAlt); }
	else 
	{
		resultGeographicCoord.setLonLatAlt(midLon, midLat, midAlt);
	}
	
	return resultGeographicCoord;
};

/**
 * make the vbo data of this feature
 * @param {VBOMemoryManager} vboMemManager
 */
 
GeographicCoord.prototype.prepareData = function(vboMemManager) 
{
	if (this.vboKeysContainer === undefined)
	{ this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	if (this.vboKeysContainer.getVbosCount() === 0)
	{
		var vboKey = this.vboKeysContainer.newVBOVertexIdxCacheKey();
		
		// Position.
		var pos = new Float32Array([0.0, 0.0, 0.0]);
		vboKey.setDataArrayPos(pos, vboMemManager);
	}
	
	return true;
};

/**
 * Render this feature
 */
GeographicCoord.prototype.renderPoint = function(magoManager, shader, gl, renderType) 
{
	if (!this.prepareData(magoManager.vboMemoryManager))
	{ return false; }
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
	
	if (renderType === 2)
	{
		var selectionManager = magoManager.selectionManager;
		var selectionColor = magoManager.selectionColor;

		var selColor = selectionColor.getAvailableColor(undefined); 
		var idxKey = selectionColor.decodeColor3(selColor.r, selColor.g, selColor.b);

		selectionManager.setCandidateGeneral(idxKey, this);
		gl.uniform4fv(shader.oneColor4_loc, [selColor.r/255.0, selColor.g/255.0, selColor.b/255.0, 1.0]);
	}
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);
	
	
};


//*
//*
//*
/**
 * 어떤 일을 하고 있습니까?
 * @class GeographicCoordsList
 */
var GeographicCoordsList = function() 
{
	if (!(this instanceof GeographicCoordsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geographicCoordsArray = [];
	this.vboKeysContainer;
	this.owner;
	
	// Aux vars.
	this.points3dList; // used to render.
};

/**
 * push single point
 * @param {GeographicCoord}
 */
GeographicCoordsList.prototype.addGeoCoord = function(geographicPoint) 
{
	this.geographicCoordsArray.push(geographicPoint);
	geographicPoint.owner = this;
};

/**
 * get single point
 * @param {Number} idx the index of target
 */
GeographicCoordsList.prototype.getGeoCoord = function(idx) 
{
	if (this.geographicCoordsArray === undefined)
	{ return undefined; }
	
	return this.geographicCoordsArray[idx];
};

/**
 * Get the number of the point in this list
 * @return {Number} the number of the points
 */
GeographicCoordsList.prototype.getGeoCoordsCount = function() 
{
	if (this.geographicCoordsArray === undefined)
	{ return 0; }
	
	return this.geographicCoordsArray.length;
};

/**
 * This function returns points3dArray relative to the geoLocIn.
 * @param {GeoLocationData} geoLocIn the information about the axis of this GeographicCoord
 * @param resultPoint3dArray
 * 
 */
GeographicCoordsList.prototype.getPointsRelativeToGeoLocation = function(geoLocIn, resultPoints3dArray) 
{

	if (resultPoints3dArray === undefined)
	{ resultPoints3dArray = []; }
	
	var geoPointsCount = this.getGeoCoordsCount();
	
	for (var i=0; i<geoPointsCount; i++)
	{
		var geoCoord = this.getGeoCoord(i);
		var geoLoc = geoCoord.geoLocDataManager.getCurrentGeoLocationData();
		var posAbs = geoLoc.position;
		
		resultPoints3dArray[i] = geoLocIn.getTransformedRelativePosition(posAbs, resultPoints3dArray[i]);
	}
	
	return resultPoints3dArray;
};

/**
 * Clear the data in this instance and delete the vbo info of this instance
 */
GeographicCoordsList.prototype.deleteObjects = function(vboMemManager) 
{
	if (this.geographicCoordsArray !== undefined)
	{
		var geoPointsCount = this.getGeoCoordsCount();
		
		for (var i=0; i<geoPointsCount; i++)
		{
			this.geographicCoordsArray[i].deleteGlObjects(vboMemManager);
			this.geographicCoordsArray[i] = undefined;
		}
		this.geographicCoordsArray = undefined;
	}
	
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager);
		this.vboKeysContainer = undefined;
	}
	
	this.owner = undefined;
};

/**
 * Make Lines making the first point as the origin for the other points. Change the points to the GeographicCoords.
 */
GeographicCoordsList.prototype.makeLines = function(magoManager) 
{
	if (this.geographicCoordsArray === undefined || this.geographicCoordsArray.length === 0)
	{ return false; }
	
	// To render lines, use Point3DList class object.
	if (this.points3dList === undefined)
	{ this.points3dList = new Point3DList(); }
	
	var geoLoc = this.points3dList.getGeographicLocation();
	
	// Take the 1rst geographicCoord's geoLocation.
	var geoCoord = this.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);
	
	var points3dArray = this.getPointsRelativeToGeoLocation(geoLoc, undefined);
	this.points3dList.deleteVboKeysContainer(magoManager);
	this.points3dList.deletePoints3d();
	this.points3dList.addPoint3dArray(points3dArray);
	
};

/**
 * Render lines
 */
GeographicCoordsList.prototype.renderLines = function(magoManager, shader, renderType, bLoop, bEnableDepth) 
{
	if (this.geographicCoordsArray === undefined)
	{ return false; }
	
	if (this.points3dList === undefined)
	{ return false; }
	
	var shader = magoManager.postFxShadersManager.getShader("pointsCloud");
	shader.useProgram();
	shader.disableVertexAttribArrayAll();
	shader.resetLastBuffersBinded();
	shader.enableVertexAttribArray(shader.position3_loc);
	shader.bindUniformGenerals();
	
	this.points3dList.renderLines(magoManager, shader, renderType, bLoop, bEnableDepth);
	
	shader.disableVertexAttribArrayAll();
};

/**
 * Rendering this feature
 * @param magoManager
 * @param shader
 * @param renderType
 * @param bEnableDepth
 * 
 */
GeographicCoordsList.prototype.renderPoints = function(magoManager, shader, renderType, bEnableDepth) 
{
	if (this.geographicCoordsArray === undefined)
	{ return false; }
	
	var gl = magoManager.sceneState.gl;
	
	//var vertexAttribsCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	//for(var i = 0; i<vertexAttribsCount; i++)
	//	gl.disableVertexAttribArray(i);

	var shader = magoManager.postFxShadersManager.getShader("pointsCloud");
	shader.useProgram();
	
	shader.disableVertexAttribArrayAll();
	shader.resetLastBuffersBinded();

	shader.enableVertexAttribArray(shader.position3_loc);
	
	shader.bindUniformGenerals();
	
	gl.uniform1i(shader.bPositionCompressed_loc, false);
	gl.uniform1i(shader.bUse1Color_loc, true);
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 1.0]); //.
	gl.uniform1f(shader.fixPointSize_loc, 15.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, true);
	
	if (bEnableDepth === undefined)
	{ bEnableDepth = true; }
	
	if (bEnableDepth)
	{ gl.enable(gl.DEPTH_TEST); }
	else
	{ gl.disable(gl.DEPTH_TEST); }

	// Render pClouds.
	var geoCoord;
	var geoCoordsCount = this.geographicCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		geoCoord.renderPoint(magoManager, shader, gl, renderType);
	}
	
	// Check if exist selectedGeoCoord.
	var currSelected = magoManager.selectionManager.getSelectedGeneral();
	if (currSelected !== undefined && currSelected.constructor.name === "GeographicCoord")
	{
		gl.uniform4fv(shader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.
		gl.uniform1f(shader.fixPointSize_loc, 10.0);
		currSelected.renderPoint(magoManager, shader, gl, renderType);
	}
	
	shader.disableVertexAttribArrayAll();
	gl.enable(gl.DEPTH_TEST);
	
	// Write coords.
	var canvas = magoManager.getObjectLabel();
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.font = "13px Arial";

	var gl = magoManager.sceneState.gl;
	var worldPosition;
	var screenCoord;
	for (var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		worldPosition = geoLoc.position;
		screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, magoManager);
		screenCoord.x += 15;
		screenCoord.y -= 15;
		//var geoCoords = geoLoc.geographicCoord;
		if (screenCoord.x >= 0 && screenCoord.y >= 0)
		{
			var word = "lon: " + geoCoord.longitude.toFixed(5) + ", lat: " + geoCoord.latitude.toFixed(5);
			ctx.strokeText(word, screenCoord.x, screenCoord.y);
			ctx.fillText(word, screenCoord.x, screenCoord.y);
		}
	}
	ctx.restore();
	
};

/**
 * Change Point3D features from WGS84 Points
 * @param resultPoint3DArray the target
 */
GeographicCoordsList.prototype.getWgs84Points3D = function(resultPoint3DArray) 
{
	if (resultPoint3DArray === undefined)
	{ resultPoint3DArray = []; }
	
	var geoCoord;
	var geoCoordsCount = this.geographicCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		var wgs84Point3d = geoCoord.getWgs84Point3D(undefined);
		resultPoint3DArray.push(wgs84Point3d);
	}
	
	return resultPoint3DArray;
};













































