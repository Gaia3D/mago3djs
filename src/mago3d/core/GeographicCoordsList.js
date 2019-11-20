'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeographicCoordsList
 */
var GeographicCoordsList = function(geographicCoordsArray) 
{
	if (!(this instanceof GeographicCoordsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	if (geographicCoordsArray !== undefined)
	{ this.geographicCoordsArray = geographicCoordsArray; }
	else
	{ this.geographicCoordsArray = []; }
	this.vboKeysContainer;
	this.owner;
	this.id;
	
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
 * push single point
 * @param {GeographicCoord}
 */
GeographicCoordsList.prototype.addGeoCoordsArray = function(geographicPointsArray) 
{
	var geoCoordsCount = geographicPointsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		this.geographicCoordsArray.push(geographicPointsArray[i]);
		geographicPointsArray[i].owner = this;
	}
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
 * @returns {Number} the number of the points
 */
GeographicCoordsList.prototype.getGeoCoordsCount = function() 
{
	if (this.geographicCoordsArray === undefined)
	{ return 0; }
	
	return this.geographicCoordsArray.length;
};

/**
 * get single point
 * @param {Number} idx the index of target
 * @param {GeographicCoordSegment} resultGeoCoordSegment.
 */
GeographicCoordsList.prototype.getGeoCoordSegment = function(idx, resultGeoCoordSegment) 
{
	if (this.geographicCoordsArray === undefined)
	{ return resultGeoCoordSegment; }
	
	var geoCoordsCount = this.geographicCoordsArray.length;
	
	if (geoCoordsCount <= 1)
	{ return resultGeoCoordSegment; }
	
	if (idx > geoCoordsCount - 1)
	{ return resultGeoCoordSegment; }
	
	var nextIdx;
	
	if (idx === geoCoordsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	var geoCoord1 = this.getGeoCoord(idx);
	var geoCoord2 = this.getGeoCoord(nextIdx);
	
	if (resultGeoCoordSegment === undefined)
	{ resultGeoCoordSegment = new GeographicCoordSegment(); }
	
	resultGeoCoordSegment.strGeoCoord = geoCoord1;
	resultGeoCoordSegment.endGeoCoord = geoCoord2;
	
	return resultGeoCoordSegment;
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
		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		if (geoLoc === undefined)
		{
			geoCoord.makeDefaultGeoLocationData();
			geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		}
		
		var posAbs = geoLoc.position;
		
		resultPoints3dArray[i] = geoLocIn.getTransformedRelativePosition(posAbs, resultPoints3dArray[i]);
	}
	
	return resultPoints3dArray;
};

/**
 * This function returns points3dArray relative to the geoLocIn.
 * @param {GeoLocationData} geoLocIn the information about the axis of this GeographicCoord
 * @param resultPoint3dArray
 * 
 */
GeographicCoordsList.prototype.getPointsWorldCoord = function(resultPoints3dArray) 
{
	if (resultPoints3dArray === undefined)
	{ resultPoints3dArray = []; }
	
	var geoPointsCount = this.getGeoCoordsCount();
	
	for (var i=0; i<geoPointsCount; i++)
	{
		var geoCoord = this.getGeoCoord(i);
		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		if (geoLoc === undefined)
		{
			geoCoord.makeDefaultGeoLocationData();
			geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		}
		
		var posAbs = geoLoc.position;
		resultPoints3dArray[i] = posAbs;
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
GeographicCoordsList.prototype.test__makeThickLines = function(magoManager) 
{
	// 1rst, make lines.
	this.makeLines(magoManager);
	
	if (this.points3dList === undefined)
	{ return; }
	
	// now, make thickLines.
	var resultVboKeysContainer = Point3DList.getVboThickLines(magoManager, this.points3dList.pointsArray, undefined);
	
	this.points3dList.vboKeysContainer = resultVboKeysContainer;
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
	{ 
		this.points3dList = new Point3DList(); 
		var points3dArray = this.getPointsWorldCoord(undefined);
		this.points3dList.deleteVboKeysContainer(magoManager);
		this.points3dList.deletePoints3d();
		this.points3dList.addPoint3dArray(points3dArray);
	}
	/*
	var geoLoc = this.points3dList.getGeographicLocation();
	
	// Take the 1rst geographicCoord's geoLocation.
	var geoCoord = this.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	
	// If has no geoLocationData, then create it.***
	if (geoLocFirst === undefined)
	{ geoLocFirst = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocFirst, magoManager); }
	
	geoLoc.copyFrom(geoLocFirst);
	

	//var points3dArray = this.getPointsRelativeToGeoLocation(geoLoc, undefined);
	var points3dArray = this.getPointsWorldCoord(undefined);
	this.points3dList.deleteVboKeysContainer(magoManager);
	this.points3dList.deletePoints3d();
	this.points3dList.addPoint3dArray(points3dArray);
	*/
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
	
	var gl = magoManager.sceneState.gl;
	gl.uniform1i(shader.bPositionCompressed_loc, false);
	gl.uniform1i(shader.bUse1Color_loc, true);
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 1.0]); //.
	gl.uniform1f(shader.fixPointSize_loc, 5.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, true);
	
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
	gl.uniform1f(shader.fixPointSize_loc, 5.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, 1);
	
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









































