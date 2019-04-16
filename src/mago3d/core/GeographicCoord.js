'use strict';

/**
 * 어떤 일을 하고 있습니까?
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

	this.absolutePoint; // x, y, z of the coordinate in wgs84.***
	this.vboKeysContainer;
	this.geoLocDataManager;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.deleteObjects = function(vboMemManager) 
{
	this.longitude = undefined;
	this.latitude = undefined;
	this.altitude = undefined;
	
	if(this.absolutePoint !== undefined)
	{
		this.absolutePoint.deleteObjects();
		this.absolutePoint = undefined;
	}
	
	if(this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.getGeoLocationDataManager = function() 
{
	if(this.geoLocDataManager === undefined)
		this.geoLocDataManager = new GeoLocationDataManager();
	
	return this.geoLocDataManager ;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.copyFrom = function(geographicCoord) 
{
	this.longitude = geographicCoord.longitude;
	this.latitude = geographicCoord.latitude;
	this.altitude = geographicCoord.altitude;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.setLonLatAlt = function(longitude, latitude, altitude) 
{
	if(longitude !== undefined)
		this.longitude = longitude;
	if(latitude !== undefined)
		this.latitude = latitude;
	if(altitude !== undefined)
		this.altitude = altitude;
};

/**
 * 어떤 일을 하고 있습니까?
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
 * 어떤 일을 하고 있습니까?
 */
 
GeographicCoord.prototype.prepareData = function(vboMemManager) 
{
	if(this.vboKeysContainer === undefined)
		this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();
	
	if(this.vboKeysContainer.getVbosCount() === 0)
	{
		var vboKey = this.vboKeysContainer.newVBOVertexIdxCacheKey();
		
		// Position.***
		var pos = new Float32Array([0.0, 0.0, 0.0]);
		vboKey.setDataArrayPos(pos, vboMemManager);
	}
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
GeographicCoord.prototype.renderPoint = function(magoManager, shader, gl) 
{
	if(!this.prepareData(magoManager.vboMemoryManager))
		return false;
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
	gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.***
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);
};


//*******************************************************************************************
//*******************************************************************************************
//*******************************************************************************************
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
};

/**
 * 어떤 일을 하고 있습니까?
 */
GeographicCoordsList.prototype.addGeoCoord = function(geographicPoint) 
{
	this.geographicCoordsArray.push(geographicPoint);
};

/**
 * 어떤 일을 하고 있습니까?
 */
GeographicCoordsList.prototype.getGeoCoord = function(idx) 
{
	if(this.geographicCoordsArray === undefined)
		return undefined;
	
	return this.geographicCoordsArray[idx];
};

/**
 * 어떤 일을 하고 있습니까?
 */
GeographicCoordsList.prototype.getGeoCoordsCount = function() 
{
	if(this.geographicCoordsArray === undefined)
		return 0;
	
	return this.geographicCoordsArray.length;
};

/**
 * 어떤 일을 하고 있습니까?
 */
GeographicCoordsList.prototype.getPointsRelativeToGeoLocation = function(geoLocIn, resultPoints3dArray) 
{
	// This function returns points3dArray relative to the geoLocIn.***
	if(resultPoints3dArray === undefined)
		resultPoints3dArray = [];
	
	var geoPointsCount = this.getPointsCount();
	
	for(var i=0; i<geoPointsCount; i++)
	{
		var geoCoord = this.getPoint(i);
		var geoLoc = geoCoord.geoLocDataManager.getCurrentGeoLocationData();
		var posAbs = geoLoc.position;
		
		var posRel;
		posRel = geoLocIn.getTransformedRelativePosition(posAbs, posRel);
		resultPoints3dArray[i] = posRel;
	}
	
	return resultPoints3dArray;
};

/**
 * 어떤 일을 하고 있습니까?
 */
GeographicCoordsList.prototype.renderPoints = function(magoManager, shader) 
{
	if(this.geographicCoordsArray === undefined)
		return false;
	
	if(this.vboKeysContainer === undefined)
	{
		this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();
	}
	
	var gl = magoManager.sceneState.gl;
	var shader = magoManager.postFxShadersManager.getShader("pointsCloud");
	shader.useProgram();
	
	shader.resetLastBuffersBinded();

	shader.enableVertexAttribArray(shader.position3_loc);
	shader.disableVertexAttribArray(shader.color4_loc);
	shader.disableVertexAttribArray(shader.normal3_loc); // provisionally has no normals.***
	shader.disableVertexAttribArray(shader.texCoord2_loc); // provisionally has no texCoords.***
	
	shader.bindUniformGenerals();
	
	gl.uniform1i(shader.bPositionCompressed_loc, false);
	gl.uniform1i(shader.bUse1Color_loc, true);
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 1.0]); //.***
	gl.uniform1f(shader.fixPointSize_loc, 5.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, true);

	// Render pClouds.***
	var geoCoord;
	var geoCoordsCount = this.geographicCoordsArray.length;
	for(var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		geoCoord.renderPoint(magoManager, shader, gl);
	}
	
	shader.disableVertexAttribArrayAll();
};









































