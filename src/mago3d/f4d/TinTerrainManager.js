'use strict';

/**
 * @class TinTerrainManager
 */
var TinTerrainManager = function(options) 
{
	if (!(this instanceof TinTerrainManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.maxDepth = 17;
	this.currentVisibles_terrName_geoCoords_map = {}; // current visible terrains map[terrainPathName, geographicCoords].
	this.currentTerrainsMap = {}; // current terrains (that was created) map[terrainPathName, tinTerrain].
	
	this.visibleTilesArray = [];
	this.noVisibleTilesArray = [];

	this.visibleSeaTilesArray = [];
	this.noVisibleSeaTilesArray = [];
	
	// TinTerrainQuadTrees.
	this.tinTerrainsQuadTreeAsia; // Use if this imageryType = CODE.imageryType.CRS84.
	this.tinTerrainsQuadTreeAmerica; // Use if this imageryType = CODE.imageryType.CRS84.
	this.tinTerrainQuadTreeMercator; // Use if this imageryType = CODE.imageryType.WEB_MERCATOR.
	
	this.geoServURL = "http://192.168.10.57:9090/geoserver/gwc/service/wmts";
	
	// Elevation model or plain ellipsoid.
	// terrainType = 0 -> terrainPlainModel.
	// terrainType = 1 -> terrainElevationModel.
	// terrainType = 2 -> real time terrainElevationModel.
	this.terrainType = 1; 
	
	//CODE.imageryType = {
	//"UNKNOWN"      : 0,
	//"CRS84"        : 1,
	//"WEB_MERCATOR" : 2
	//};
	this.imageryType = CODE.imageryType.WEB_MERCATOR; // Test.***
	//this.imageryType = CODE.imageryType.CRS84; // Test.***

	this.imagerys = [];

	this.textureParsedTerrainMap = {};
	this.textureDecodedTerrainMap = {};
	this.textureIdCntMap = {};
	this.textureIdDeleteMap = {};
	this.bRenderSea = true;

	this.init();
	this.makeTinTerrainWithDEMIndex(); // provisional.
	
	//https://www.ngdc.noaa.gov/mgg/global/global.html here there are geotiff of land & ocean 1arc-minute. All earth. size : 21600 x 10800.
	
	if (options)
	{
		if (options.terrainType !== undefined)
		{ this.terrainType = options.terrainType; }

		if (options.createSea !== undefined)
		{ this.bRenderSea = options.createSea; }
	}
};

TinTerrainManager.prototype.getTerrainType = function()
{
	return this.terrainType;
};

TinTerrainManager.prototype.setMaxDepth = function(maxDepth)
{
	this.maxDepth = maxDepth;
};

TinTerrainManager.prototype.init = function()
{
	if (this.imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		this.tinTerrainQuadTreeMercator = new TinTerrain(undefined); // Main object.
		//1.4844222297453322
		//var latDeg = 1.4844222297453322 *180/Math.PI;
		//https://en.wikipedia.org/wiki/Web_Mercator_projection
		//https://en.wikipedia.org/wiki/Mercator_projection
		var webMercatorMaxLatRad = 2*Math.atan(Math.pow(Math.E, Math.PI)) - (Math.PI/2);
		var webMercatorMaxLatDeg = webMercatorMaxLatRad * 180/Math.PI; // = 85.0511287798...
		
		// All earth.
		var minLon = -180;
		var minLat = -90;
		var minAlt = 0;
		var maxLon = 180;
		var maxLat = 90;
		var maxAlt = 0;

		minLat = -webMercatorMaxLatDeg; 
		maxLat = webMercatorMaxLatDeg; 
		
		this.tinTerrainQuadTreeMercator.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
		this.tinTerrainQuadTreeMercator.setWebMercatorExtent(-1, -Math.PI, 1, Math.PI); // unitary extension.***
		this.tinTerrainQuadTreeMercator.X = 0;
		this.tinTerrainQuadTreeMercator.Y = 0;
		this.tinTerrainQuadTreeMercator.indexName = "RU";
		this.tinTerrainQuadTreeMercator.tinTerrainManager = this;
		
		// do imagery test.
		// set imagery initial geoExtent (in mercator coords).
		
		// Full extent. https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
	}
	else
	{
		// CRS84.
		this.tinTerrainsQuadTreeAsia = new TinTerrain(undefined); // Main object.
		this.tinTerrainsQuadTreeAmerica = new TinTerrain(undefined); // Main object.
		
		// Asia side.
		var minLon = 0;
		var minLat = -90;
		var minAlt = 0;
		var maxLon = 180;
		var maxLat = 90;
		var maxAlt = 0;
		
		this.tinTerrainsQuadTreeAsia.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
		this.tinTerrainsQuadTreeAsia.setWebMercatorExtent(0, -Math.PI, 1, Math.PI); // unitary extension.***
		this.tinTerrainsQuadTreeAsia.X = 1;
		this.tinTerrainsQuadTreeAsia.Y = 0;
		this.tinTerrainsQuadTreeAsia.indexName = "RU";
		this.tinTerrainsQuadTreeAsia.tinTerrainManager = this;
		
		// America side.
		minLon = -180;
		minLat = -90;
		minAlt = 0;
		maxLon = 0;
		maxLat = 90;
		maxAlt = 0;

		this.tinTerrainsQuadTreeAmerica.setGeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
		this.tinTerrainsQuadTreeAmerica.setWebMercatorExtent(-1, -Math.PI, 0, Math.PI); // unitary extension.***
		this.tinTerrainsQuadTreeAmerica.X = 0;
		this.tinTerrainsQuadTreeAmerica.Y = 0;
		this.tinTerrainsQuadTreeAmerica.indexName = "LU";
		this.tinTerrainsQuadTreeAmerica.tinTerrainManager = this;
		
		// do imagery test.
		// set imagery initial geoExtent (in mercator coords).
		
		// Full extent. https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
	}
	
	this.makeDistanceLimitByDepth();
};

TinTerrainManager.prototype.makeTinTerrainWithDEMIndex = function()
{
	// Provisional.
	// Makes a index of tiles that has DEM data in the server.
	this.tinTerrainWithDEMIndex = [];
	this.tinTerrainWithDEMIndex[0] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[1] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[2] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[3] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[4] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[5] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[6] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[7] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[8] = { minX: 213, minY: 94, maxX: 222, maxY: 105 };
	this.tinTerrainWithDEMIndex[9] = { minX: 425, minY: 189, maxX: 443, maxY: 211 };
	this.tinTerrainWithDEMIndex[10] = { minX: 852, minY: 376, maxX: 885, maxY: 423 };
	this.tinTerrainWithDEMIndex[11] = { minX: 1705, minY: 753, maxX: 1770, maxY: 844 };
	this.tinTerrainWithDEMIndex[12] = { minX: 3412, minY: 1506, maxX: 3539, maxY: 1689 };
	this.tinTerrainWithDEMIndex[13] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[14] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[15] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[16] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[17] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[18] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[19] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
	this.tinTerrainWithDEMIndex[20] = { minX: -1, minY: -1, maxX: -1, maxY: -1 };
};

TinTerrainManager.prototype.makeDistanceLimitByDepth = function()
{
	if (this.distLimitByDepth === undefined)
	{ this.distLimitByDepth = []; }
		
	// For each depth, there are a limit distance.***
	this.distLimitByDepth[0] = 50000000; 
	this.distLimitByDepth[1] = 10000000; 
	this.distLimitByDepth[2] = 2500000; 
	this.distLimitByDepth[3] = 1000000; 
	this.distLimitByDepth[4] = 500000; 
	this.distLimitByDepth[5] = 250000; 
	this.distLimitByDepth[6] = 50000; 
	this.distLimitByDepth[7] = 25000; 
	this.distLimitByDepth[8] = 10000; 
	this.distLimitByDepth[9] = 5000; 
	this.distLimitByDepth[10] = 4500; 
	this.distLimitByDepth[11] = 4000; 
	this.distLimitByDepth[12] = 3500; 
	this.distLimitByDepth[13] = 3000; 
	this.distLimitByDepth[14] = 2500; 
	this.distLimitByDepth[15] = 2000; 
	this.distLimitByDepth[16] = 1500; 
	this.distLimitByDepth[17] = 1000; 
	this.distLimitByDepth[18] = 600; 
	this.distLimitByDepth[19] = 400; 
	this.distLimitByDepth[20] = 200; 
	
	//this.distLimitByDepth[0] = 5;
	
	var distLimitByDepthCount = this.distLimitByDepth.length;
	for (var i=0; i<distLimitByDepthCount; i++)
	{
		this.distLimitByDepth[i] *= 0.65;
	}
	
};

TinTerrainManager.prototype.getTexCorrection = function(depth)
{
	if (this.texCorrection === undefined)
	{
		this.texCorrection = [];
		
		this.texCorrection[0] = 0.003;
		this.texCorrection[1] = 0.003;
		this.texCorrection[2] = 0.003;
		this.texCorrection[3] = 0.003;
		this.texCorrection[4] = 0.003;
		this.texCorrection[5] = 0.003;
		this.texCorrection[6] = 0.003;
		this.texCorrection[7] = 0.003;
		this.texCorrection[8] = 0.003;
		this.texCorrection[9] = 0.003;
		this.texCorrection[10] = 0.004;
		this.texCorrection[11] = 0.004;
		this.texCorrection[12] = 0.004;
		this.texCorrection[13] = 0.004;
		this.texCorrection[14] = 0.004;
		this.texCorrection[15] = 0.004;
		this.texCorrection[16] = 0.004;
		this.texCorrection[17] = 0.004;
		this.texCorrection[18] = 0.004;
		this.texCorrection[19] = 0.004;
		this.texCorrection[20] = 0.004;
		this.texCorrection[21] = 0.004;
		this.texCorrection[22] = 0.004;
	}
	
	return this.texCorrection[depth];
};

TinTerrainManager.prototype.doFrustumCulling = function(frustum, camPos, magoManager, maxDepth)
{
	if (maxDepth === undefined)
	{ maxDepth = this.maxDepth; }
	
	this.visibleTilesArray.length = 0;
	this.noVisibleTilesArray.length = 0;
	if (this.imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		this.tinTerrainQuadTreeMercator.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
	}
	else 
	{
		this.tinTerrainsQuadTreeAsia.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
		this.tinTerrainsQuadTreeAmerica.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, this.visibleTilesArray, this.noVisibleTilesArray);
	}
};

/**
 * Prepare tinTerrains.
 */
TinTerrainManager.prototype.prepareVisibleTinTerrains = function(magoManager) 
{
	var tinTerrain;
	
	// For the visible tinTerrains prepare its.
	// Preparing rule: First prepare the tinTerrain-owner if the owner is no prepared yet.
	var visiblesTilesCount = this.visibleTilesArray.length;
	if (this.terrainType === 0) // PlainTerrain.
	{
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			tinTerrain.prepareTinTerrainPlain(magoManager, this);
		}
	}
	else if (this.terrainType === 1)// ElevationTerrain.
	{
		var maxProcessCounter = 0;
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			if (!tinTerrain.prepareTinTerrain(magoManager, this))
			{ maxProcessCounter += 1; }
		
			//if (maxProcessCounter > 50)
			//{ break; }
		}
	}
	else if (this.terrainType === 2)// Real time ElevationTerrain.
	{
		var maxProcessCounter = 0;
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			if (!tinTerrain.prepareTinTerrainRealTimeElevation(magoManager, this))
			{ maxProcessCounter += 1; }
		
			if (maxProcessCounter > 10)
			{ break; }
		}
	}
	
	// 2nd, for all terrains that exist, if there are not in the visiblesMap, then delete its.
	// Deleting rule: If a tinTerrain has children, then delete first the children.
	var deletedCount = 0;
	var noVisiblesTilesCount = this.noVisibleTilesArray.length;
	for (var i=0; i<visiblesTilesCount; i++)
	{
		tinTerrain = this.noVisibleTilesArray[i];
		if (tinTerrain !== undefined)
		{
			if (tinTerrain.depth > 2)
			{
				tinTerrain.deleteTinTerrain(magoManager);
				deletedCount++;
			}
		}
		
		if (deletedCount > 5)
		{ break; }
	}
};

TinTerrainManager.prototype.getAltitudes = function(geoCoordsArray, resultGeoCoordsArray) 
{
	var geoCoordsCount = geoCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		
		//this.visibleTilesArray
	}
};

TinTerrainManager.prototype.render = function(magoManager, bDepth, renderType, shader) 
{
	var gl = magoManager.sceneState.gl;
	var currentShader;
	if (shader)
	{ currentShader = shader; }
	else
	{ currentShader = magoManager.postFxShadersManager.getShader("tinTerrain"); }
	var shaderProgram = currentShader.program;
	
	currentShader.resetLastBuffersBinded();
	
	gl.useProgram(shaderProgram);
	currentShader.enableVertexAttribArray(currentShader.position3_loc);
	if (bDepth)
	{ currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); }
	else
	{ currentShader.enableVertexAttribArray(currentShader.texCoord2_loc); }
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	//gl.disableVertexAttribArray(currentShader.color4_loc);
	
	currentShader.bindUniformGenerals();
	
	magoManager.test__makingTerrainByAltitudesImage = 0;
	
	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i); 
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	if (this.identityMat === undefined)
	{ this.identityMat = new Matrix4(); }
	
	gl.uniform1i(currentShader.bIsMakingDepth_loc, bDepth); //.
	if (renderType === 1)
	{
		var tex = magoManager.texturesStore.getTextureAux1x1(); // provisional.
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, tex.texId);
	
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
		
		gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture. Initially set as texture color type.***
		gl.uniform4fv(currentShader.oneColor4_loc, [0.5, 0.5, 0.5, 1.0]);
		gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, this.identityMat._floatArrays);
		
		gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
		
		var bApplyShadow = false;
		if (magoManager.sceneState.sunSystem !== undefined && magoManager.sceneState.applySunShadows)
		{ bApplyShadow = true; }
		gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
		
		if (bApplyShadow)
		{
			// Set sunMatrix uniform.***
			var sunSystem = magoManager.sceneState.sunSystem;
			var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
			var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
			var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
			var sunDirWC = sunSystem.getSunDirWC();
			var sunLight = sunSystem.getLight(0);
			if (sunLight.tMatrix!== undefined)
			{
				gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
				gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
				gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
				gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
				gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
				gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
				gl.uniform1i(currentShader.sunIdx_loc, 1);
			}
			
			gl.activeTexture(gl.TEXTURE0); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(0);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}
			
			gl.activeTexture(gl.TEXTURE1); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(1);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}
			
		}

		
		var flipTexCoordY = true;

		if (magoManager.isCesiumGlobe())
		{ flipTexCoordY = false; }

		gl.uniform1i(currentShader.textureFlipYAxis_loc, flipTexCoordY); // false for cesium, true for magoWorld.
		gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
		
		//gl.enable(gl.POLYGON_OFFSET_FILL);
		//gl.polygonOffset(1, 3);
		
		gl.activeTexture(gl.TEXTURE2); // difusseTex.
	}
	else if (renderType === 2)
	{
		gl.uniform1i(currentShader.bApplySpecularLighting_loc, false);
	}
	
	var sceneState = magoManager.sceneState;
	var bApplyShadow = sceneState.applySunShadows;
	var renderWireframe = false;
	var tinTerrain;
	var visiblesTilesCount = this.visibleTilesArray.length;
	
	// check if apply sun shadow.
	var light0 = sceneState.sunSystem.getLight(0);
	var light0MaxDistToCam = light0.maxDistToCam;
	var light0BSphere = light0.bSphere;
	if (light0BSphere === undefined)
	{ bApplyShadow = false; } // cant apply shadow anyway.
	
	var succesfullyRenderedTilesArray = [];
	
	if (bApplyShadow)
	{
		var light0Radius = light0BSphere.getRadius();
		var light0CenterPoint = light0BSphere.getCenterPoint();
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			
			if (tinTerrain === undefined)
			{ continue; }
		
			var sphereExtent = tinTerrain.sphereExtent;
			var distToLight0 = light0CenterPoint.distToPoint(sphereExtent.centerPoint)+sphereExtent.r;
			if (distToLight0 < light0Radius*5.0)
			{
				gl.uniform1i(currentShader.sunIdx_loc, 0);
			}
			else
			{
				gl.uniform1i(currentShader.sunIdx_loc, 1);
			}
			tinTerrain.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray);
		}
	}
	else
	{
		for (var i=0; i<visiblesTilesCount; i++)
		{
			tinTerrain = this.visibleTilesArray[i];
			
			if (tinTerrain === undefined)
			{ continue; }
		
			tinTerrain.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray);
		}
	}
	
	// Render the sea.
	var currSelObject = magoManager.selectionManager.getSelectedGeneral();
	if (currSelObject instanceof(TinTerrain))
	{
		currSelObject.renderSea(currentShader, magoManager, bDepth, renderType);
	}
	/*
	if (renderType === 1)
	{
		gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
		gl.enable(gl.BLEND);
		gl.disable(gl.CULL_FACE);
		var seaTilesCount = succesfullyRenderedTilesArray.length;
		for (var i=0; i<seaTilesCount; i++)
		{
			tinTerrain = succesfullyRenderedTilesArray[i];
			
			if (tinTerrain === undefined)
			{ continue; }
		
			tinTerrain.renderSea(currentShader, magoManager, bDepth, renderType);
		}
		gl.disable(gl.BLEND);
		gl.enable(gl.CULL_FACE);
	}
	*/

	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); 
	currentShader.disableVertexAttribArray(currentShader.position3_loc); 
	currentShader.disableVertexAttribArray(currentShader.normal3_loc); 
	currentShader.disableVertexAttribArray(currentShader.color4_loc); 
	gl.useProgram(null);
};
/**
 * 텍스처 등록 갯수 관리
 * @param {number} textureId
 */
TinTerrainManager.prototype.addTextureId = function(textureId) 
{
	if (!this.textureIdCntMap[textureId]) 
	{
		this.textureIdCntMap[textureId] = 0;
	}
	this.textureIdCntMap[textureId] += 1;
};
/**
 * 텍스처 제거 목록 등록
 * @param {number} textureId
 */
TinTerrainManager.prototype.addDeleteTextureId = function(textureId) 
{
	if (!this.textureIdDeleteMap[textureId]) 
	{
		this.textureIdDeleteMap[textureId] = 0;
	}
	this.textureIdDeleteMap[textureId] += 1;
};
/**
 * 텍스처 제거 맵에 등록된 텍스처를 제거
 * @param {Texture} texture
 */
TinTerrainManager.prototype.eraseTexture = function(texture, magoManager)
{
	var gl = magoManager.sceneState.gl;
	
	var id = texture.imagery._id;
	texture.deleteObjects(gl);
	this.addDeleteTextureId(id);

	this.clearMap(id);
};
/**
 * 텍스처 제거 맵에 등록된 텍스처를 제거
 * @param {Texture} texture
 */
TinTerrainManager.prototype.clearMap = function(id)
{
	if (this.textureIdDeleteMap[id] === this.textureIdCntMap[id]) 
	{
		delete this.textureIdDeleteMap[id];
		delete this.textureIdCntMap[id];
	}
};