'use strict';

/**
 * @class WindLayer
 */
var WindMapData = function(options) 
{
	this.windMapTexture; // uv encoded wind map.***
	this.windMapJson;
	this.windMapFileName;
	this.windMapFolderPath;

	
	this.windData = {};
	this.windData.uMin;
	this.windData.vMin;
	this.windData.uMax;
	this.windData.vMax;
	this.windData.height;
	this.windData.width;
};

/**
 * @class WindLayer
 */
var WindLayer = function(options) 
{
	// Based on https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f
	if (!(this instanceof WindLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.weatherStation;
	this.gl;
	
	this.windMapTexture; // uv encoded wind map.***
	this.windMapJson;
	this.windMapFileName;
	this.windMapJsonFileLoadState = CODE.fileLoadState.READY;
	this.windMapFolderPath;
	this.windData;
	this.windVelocityMap; // this is "this.windMapTexture" on cpu.
	
	this.currWindMap;
	this.currWindMapIdx = 0;
	
	this.screenTexture0; // old.***
	this.screenTexture1; // old.***
	this.screenTexWidth; // old.***
	this.screenTexHeight; // old.***
	
	this.geoExtent;
	this.layerAltitude = 6000.0; // old.***
	this.geoLocDataManager; // the geoLocdata of the center of the tile.

	// shader programs.***
	this.drawParticlesProgram; // render particles shader.***
	this.screenFadeProgram;
	this.updateParticlesProgram;
	this.drawRegionProgram; // no used yet.***
	
	this.quadBuffer;
	this.particlesPositionTexture0;
	this.particlesPositionTexture1;
	
	this.weatherEarth; // used only 2d wind render generation.
	
	// Test values.****************************************************************************
	this.fadeOpacity = 0.9999; // how fast the particle trails fade on each frame
	this.speedFactor = 0.04; // how fast the particles move
	this.dropRate = 0.003; // how often the particles move to a random place
	this.dropRateBump = 0.001; // drop rate increase relative to individual particle speed
	
	this.speedFactor = 0.1; // how fast the particles move
	this.dropRate = 0.003; // how often the particles move to a random place
	this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed
	// End test values.-----------------------------------------------------------------------
	
	this.numParticles = 65536/4;// / 4; // 65536 = 256 x 256.***
	this.particlesPositionTexturesCount = 20;
	this.pendentPointSize = 20000.0;
	
	this.flipTexCoordsY_windMap = true;
	this.externalAlpha = 0.7;
	
	// Check if exist options.
	if (options !== undefined)
	{
		// take all options.
		if (options.geoJsonFile)
		{
			this.windMapJson = options.geoJsonFile;
			this.windMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		}

		if (options.geoJsonFileFolderPath)
		{
			this.windMapFolderPath = options.geoJsonFileFolderPath;
		}

		if (options.speedFactor !== undefined)
		{ this.speedFactor = options.speedFactor; }
		
		if (options.dropRate !== undefined)
		{ this.dropRate = options.dropRate; }
	
		if (options.dropRateBump !== undefined)
		{ this.dropRateBump = options.dropRateBump; }
	
		if (options.numParticles !== undefined)
		{ this.numParticles = options.numParticles; }
	
		if (options.windMapFileName !== undefined)
		{ this.windMapFileName = options.windMapFileName; }
	
		if (options.windMapFolderPath !== undefined)
		{ this.windMapFolderPath = options.windMapFolderPath; }
	
		if (options.layerAltitude !== undefined)
		{ this.layerAltitude = options.layerAltitude; }

		if (options.particlesPositionTexturesCount !== undefined)
		{ this.particlesPositionTexturesCount = options.particlesPositionTexturesCount; }

		if (options.pendentPointSize !== undefined)
		{ this.pendentPointSize = options.pendentPointSize; }
	}
};

WindLayer.prototype.init = function(gl, magoManager)
{
	this.gl = gl;
	// screen textures.***
	/*
	this.screenTexWidth = screenTexWidth;
	this.screenTexHeight = screenTexHeight;
	
	if (screenTexWidth === undefined)
	{ this.screenTexWidth = 4096; }
	if (screenTexHeight === undefined)
	{ this.screenTexHeight = 4096; }
	
	var emptyPixels = new Uint8Array(this.screenTexWidth * this.screenTexHeight * 4);
	// screen textures to hold the drawn screen for the previous and the current frame
	this.screenTexture0 = Texture.createTexture(gl, gl.LINEAR, emptyPixels, this.screenTexWidth, this.screenTexHeight);
	this.screenTexture1 = Texture.createTexture(gl, gl.LINEAR, emptyPixels, this.screenTexWidth, this.screenTexHeight);
	*/
	
	// quad buffer.***
	if (this.quadBuffer === undefined)
	{
		var data = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]);
		this.quadBuffer = FBO.createBuffer(gl, data);
	}
	
	// frameBuffer.***
	if (this.windFramebuffer === undefined)
	{
		// Framebuffer used in updateParticlesPosition process.
		this.windFramebuffer = gl.createFramebuffer();
	}
	
	// shaders.***
	var vsSource = ShaderSource.draw_vert;
	var fsSource = ShaderSource.draw_frag;
	this.drawParticlesProgram = PostFxShader.createProgram(gl, vsSource, fsSource);

	vsSource = ShaderSource.quad_vert; // Very simple quad drawing vertex shader.
	fsSource = ShaderSource.screen_frag;
	this.screenFadeProgram = PostFxShader.createProgram(gl, vsSource, fsSource);
	
	// UPDATE FRAG.******************************************************************
	vsSource = ShaderSource.quad_vert; // Very simple quad drawing vertex shader.
	fsSource = ShaderSource.update_frag;
	this.updateParticlesProgram = PostFxShader.createProgram(gl, vsSource, fsSource);
	this.updateParticlesProgram.u_visibleTilesRanges = gl.getUniformLocation(this.updateParticlesProgram.program, "u_visibleTilesRanges");
	this.updateParticlesProgram.uTangentOfHalfFovy_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "tangentOfHalfFovy");
	this.updateParticlesProgram.uFar_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "far");
	this.updateParticlesProgram.uAspectRatio_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "aspectRatio");
	this.updateParticlesProgram.uModelViewMatInv_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "modelViewMatrixInv");
	this.updateParticlesProgram.uBuildingRotMatrix_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "buildingRotMatrix");
	this.updateParticlesProgram.buildingRotMatrixInv = gl.getUniformLocation(this.updateParticlesProgram.program, "buildingRotMatrixInv");
	this.updateParticlesProgram.uNearFarArray_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "uNearFarArray");
	gl.useProgram(this.updateParticlesProgram.program);
	this.updateParticlesProgram.u_particles_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "u_particles");
	this.updateParticlesProgram.u_wind_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "u_wind");
	this.updateParticlesProgram.u_windGlobeDepthTex_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "u_windGlobeDepthTex");
	this.updateParticlesProgram.u_windGlobeNormalTex_loc = gl.getUniformLocation(this.updateParticlesProgram.program, "u_windGlobeNormalTex");
	gl.uniform1i(this.updateParticlesProgram.u_particles_loc, 0);
	gl.uniform1i(this.updateParticlesProgram.u_wind_loc, 1);
	gl.uniform1i(this.updateParticlesProgram.u_windGlobeDepthTex, 2);
	gl.uniform1i(this.updateParticlesProgram.u_windGlobeNormalTex, 3);
	
	
	// RENDER 3D MODE PROGRAM.***************************************************************
	var vsSource = ShaderSource.draw_vert3D;
	var fsSource = ShaderSource.draw_frag3D;
	var shaderName = "drawWindParticles3d";
	var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	var useLogarithmicDepth = magoManager.postFxShadersManager.getUseLogarithmicDepth();
	if (useLogarithmicDepth)
	{
		use_linearOrLogarithmicDepth = "USE_LOGARITHMIC_DEPTH";
	}
	fsSource = fsSource.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	if (magoManager.postFxShadersManager.bUseMultiRenderTarget)
	{
		var use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}
	fsSource = fsSource.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);

	this.drawParticles3DShader = magoManager.postFxShadersManager.createShaderProgram(gl, vsSource, fsSource, shaderName, magoManager);
	this.drawParticles3DShader.bUseLogarithmicDepth_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "bUseLogarithmicDepth");
	this.drawParticles3DShader.uFCoef_logDepth_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "uFCoef_logDepth");
	this.drawParticles3DShader.uFrustumIdx_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "uFrustumIdx");
	//this.drawParticles3DShader.uModelViewProjectionMatrixRelToEye = gl.getUniformLocation(this.drawParticles3DShader.program, "ModelViewProjectionMatrixRelToEye");
	this.drawParticlesProgram3D = this.drawParticles3DShader.program;
	gl.useProgram(this.drawParticles3DShader.program);
	this.drawParticles3DShader.u_wind_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "u_wind");
	this.drawParticles3DShader.u_depthTex_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "u_depthTex"); // no used.
	gl.uniform1i(this.drawParticles3DShader.u_wind_loc, 0);
	gl.uniform1i(this.drawParticles3DShader.u_depthTex_loc, 1);

	
	// particles position textures.***
	var particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(this.numParticles));
	this.numParticles = particleRes * particleRes;
	
	var particleState = new Uint8Array(this.numParticles * 4);
	for (var i = 0; i < particleState.length; i++) 
	{
		particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
	}
	// textures to hold the particle state for the current and the next frame
	//this.particlesPositionTexture0 = Texture.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
	//this.particlesPositionTexture1 = Texture.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);

	this.particlesPositionTexturesArray = [];
	for (var i=0; i<this.particlesPositionTexturesCount; i++)
	{
		var particlesPositionTexture = Texture.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
		this.particlesPositionTexturesArray.push(particlesPositionTexture);
	}

	var particleIndices = new Float32Array(this.numParticles);
	for (var i = 0; i < this.numParticles; i++) { particleIndices[i] = i; }
	this.particleIndexBuffer = FBO.createBuffer(gl, particleIndices);
};

WindLayer.prototype.parseWindDataGeoJson = function(jsonData)
{
	// 1rst, check if json is old version (iSuSok ver).
	if (jsonData.lat)
	{
		// this is old version.
		this.windMapJson = jsonData;
		this.windMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		
		var jsonLonCount = this.windMapJson.lon.length;
		var jsonLatCount = this.windMapJson.lat.length;
		
		var jsonMinLon = this.windMapJson.lon[0];
		var jsonMaxLon = this.windMapJson.lon[jsonLonCount-1];
		
		var jsonMinLat = this.windMapJson.lat[jsonLatCount-1];
		var jsonMaxLat = this.windMapJson.lat[0];
		
		if (this.windMapJson.minLon)
		{
			jsonMinLon = this.windMapJson.minLon;
		}
		
		if (this.windMapJson.maxLon)
		{
			jsonMaxLon = this.windMapJson.maxLon;
		}
		
		if (this.windMapJson.minLat)
		{
			jsonMinLat = this.windMapJson.minLat;
		}
		
		if (this.windMapJson.maxLat)
		{
			jsonMaxLat = this.windMapJson.maxLat;
		}
		
		var jsonAlt_above_ground = 10.0;
		
		if (this.windMapJson.height_above_ground !== undefined)
		{ jsonAlt_above_ground = this.windMapJson.height_above_ground[0]; }
		
		if (this.windData === undefined)
		{
			this.windData = {};
		}
		this.windData.uMin = this.windMapJson.uMin;
		this.windData.vMin = this.windMapJson.vMin;
		this.windData.uMax = this.windMapJson.uMax;
		this.windData.vMax = this.windMapJson.vMax;
		this.windData.height = this.windMapJson.height;
		this.windData.width = this.windMapJson.width;
		this.windData.height_above_ground = this.windMapJson.height_above_ground[0];

		return true;
	}

	// Check if the json is geoJson.
	if (jsonData.type)
	{
		// This is the new version geoJson.
		this.windMapJson = jsonData;
		this.windMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;

		var jsonAlt_above_ground = 10.0;
		
		if (this.windMapJson.height_above_ground !== undefined)
		{ jsonAlt_above_ground = this.windMapJson.height_above_ground[0]; }
		
		if (this.windData === undefined)
		{
			this.windData = {};
		}
		this.windData.uMin = this.windMapJson.properties.value.r.min;
		this.windData.vMin = this.windMapJson.properties.value.g.min;
		this.windData.wMin = this.windMapJson.properties.value.b.min;
		this.windData.uMax = this.windMapJson.properties.value.r.max;
		this.windData.vMax = this.windMapJson.properties.value.g.max;
		this.windData.wMax = this.windMapJson.properties.value.b.max;
		this.windData.height = this.windMapJson.properties.image.width;
		this.windData.width = this.windMapJson.properties.image.height;

		this.windMapJson.minLon = this.windMapJson.bbox[0];
		this.windMapJson.minLat = this.windMapJson.bbox[1];
		this.windMapJson.minAlt = this.windMapJson.bbox[2];
		this.windMapJson.maxLon = this.windMapJson.bbox[3];
		this.windMapJson.maxLat = this.windMapJson.bbox[4];
		this.windMapJson.maxAlt = this.windMapJson.bbox[5];

		this.windData.height_above_ground = this.windMapJson.minAlt; // provisionally...

		return true;
	}

	return false;
};

WindLayer.prototype.prepareWindLayer = function ()
{
	// Check if the winsMapTexture is loaded.
	if (this.gl === undefined)
	{
		this.gl = this.windVolume.weatherStation.magoManager.getGl();
	}

	if (this.windMapTexture === undefined)
	{
		this.windMapTexture = new Texture();
		this.windMapTexture.texId = this.gl.createTexture();
	}
	
	if (this.windMapTexture.fileLoadState === CODE.fileLoadState.READY)
	{
		if (!this.windMapFileName)
		{
			// Find the png file name inside of the geoJson.***
			if (!this.windMapJson)
			{ return false; }

			this.windMapFileName = this.windMapJson.properties.image.uri;
			//var imageFullName = this.windMapJson.properties.image.uri;
			//var splitted = imageFullName.split('.');
			//this.windMapFileName = splitted[0];
		}

		var windMapTexturePath;

		if (!this.windMapFolderPath || this.windMapFolderPath.length === 0)
		{
			// 서버에서 serviceUri를 생성할 경우 2022.07.21 정연화 수정
			windMapTexturePath = this.windMapJson.properties.image.serviceUri;
		}
		else
		{
			// 서버에서 serviceUri를 생성하지 않은 경우 (더블 슬러시 문제 해결) 2022.07.21 정연화 수정
			windMapTexturePath = this.windMapFolderPath + "/" + this.windMapFileName;
		}

		ReaderWriter.loadImage(this.gl, windMapTexturePath, this.windMapTexture);
		return false;
	}
	
	if (this.windMapJsonFileLoadState === undefined || this.windMapJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this.windMapJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		var windMapJsonPath = this.windMapFolderPath + "/" + this.windMapFileName + ".json";
		loadWithXhr(windMapJsonPath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that.windMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that.windMapJson = res;
			//that.parseWindDataGeoJson(res); // old.***
		});
		return false;
	}
	
	return true;
};

WindLayer.prototype.getGeographicExtent = function()
{
	if (!this.geoExtent)
	{
		// make it.
		var minLon; 
		var minLat; 
		var minAlt; 
		var maxLon;
		var maxLat;
		var maxAlt;

		if (this.windMapJson.minLon) 
		{
			minLon = this.windMapJson.minLon;
		}
		
		if (this.windMapJson.maxLon)
		{
			maxLon = this.windMapJson.maxLon;
		}
		
		if (this.windMapJson.minLat)
		{
			minLat = this.windMapJson.minLat;
		}
		
		if (this.windMapJson.maxLat)
		{
			maxLat = this.windMapJson.maxLat;
		}
		
		var minAlt = 10.0;
		
		if (this.windMapJson.height_above_ground !== undefined)
		{ minAlt = this.windMapJson.height_above_ground[0]; }

		maxAlt = minAlt;
		
		this.geoExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
	}

	return this.geoExtent;
};

WindLayer.prototype.isReadyToRender = function()
{
	// The windMap is ready to render if loaded windMapTexture & windMapJson.
	if ( this.windMapTexture !== undefined && this.windMapTexture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	{
		if (this.windMapJsonFileLoadState !== undefined && this.windMapJsonFileLoadState === CODE.fileLoadState.LOADING_FINISHED)
		{ return true; }
	}
	
	return false;
};

WindLayer.prototype.createEarthRegion = function(minLon, minLat, maxLon, maxLat, altitude, magoManager)
{
	if (minLon === undefined)
	{ minLon = -180; }
	
	if (minLat === undefined)
	{ minLat = -90; }
	
	if (maxLon === undefined)
	{ maxLon = 180; }
	
	if (maxLat === undefined)
	{ maxLat = 90; }
	
	if (altitude === undefined)
	{ altitude = 0; }

	this.weatherEarth = new TinTerrain();
	this.weatherEarth.geographicExtent = new GeographicExtent();
	this.weatherEarth.geographicExtent.minGeographicCoord = new GeographicCoord();
	this.weatherEarth.geographicExtent.maxGeographicCoord = new GeographicCoord();
	
	this.weatherEarth.geographicExtent.minGeographicCoord.setLonLatAlt(minLon, minLat, altitude);
	this.weatherEarth.geographicExtent.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, altitude);
	
	this.weatherEarth.centerX = new Float64Array([0.0]);
	this.weatherEarth.centerY = new Float64Array([0.0]);
	this.weatherEarth.centerZ = new Float64Array([0.0]);

	var lonSegments = 72;
	var latSegments = 36;
	if (altitude === undefined)
	{ altitude = 16000.0; }
	this.weatherEarth.makeMeshVirtuallyCRS84(lonSegments, latSegments, altitude);
	
	// This is a earth made by only 1 tile, so the centerPosition is (0, 0, 0).
	this.weatherEarth.centerX[0] = 0;
	this.weatherEarth.centerX[1] = 0;
	this.weatherEarth.centerX[2] = 0;
	this.weatherEarth.makeVbo(magoManager.vboMemoryManager);
	
};

WindLayer.prototype.getVelocityVector2d = function(pixelX, pixelY, resultPoint2d, magoManager)
{
	// Note: to call this function MUST BE BINDED the windTexture.
	//-------------------------------------------------------------
	// Now, bind windTexture and read the pixel(pixelX, pixelY).
	// Read the picked pixel and find the object.*********************************************************
	var texWidth = this.windMapTexture.imageWidth;
	var texHeight = this.windMapTexture.imageHeight;
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }

	if (!this.windVelocityMap)
	{
		var gl = magoManager.getGl();

		if (this.framebuffer === undefined)
		{ this.framebuffer = gl.createFramebuffer(); }

		// bind framebuffer.
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		// attach the WINDMAP texture to the framebuffer.
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.windMapTexture.texId, 0);
		var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
		if (canRead)
		{
			var totalPixelsCount = texWidth*texHeight;
			this.windVelocityMap = new Uint8Array(4 * totalPixelsCount); // 1 pixels select.***
			gl.readPixels(0, 0, texWidth, texHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.windVelocityMap);
		}
		// Unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	var idx = pixelY * texWidth + pixelX;
	var red = this.windVelocityMap[idx*4]/255.0;
	var green = this.windVelocityMap[idx*4+1]/255.0;
	var blue = this.windVelocityMap[idx*4+2]/255.0;

	// Now, considering the maxWindU, minWindU, maxWindV & minWindV, calculate the wind speed.
	var uMin = this.windData.uMin;
	var vMin = this.windData.vMin;
	var uMax = this.windData.uMax;
	var vMax = this.windData.vMax;
	//vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(windMapTexCoord));
	// mix(v1, v2, a) = v1 * (1 - a) + v2 * a
	
	var velU = uMin * (1.0 - red) + uMax * red;
	var velV = vMin * (1.0 - green) + vMax * green;
	
	if (resultPoint2d === undefined)
	{ resultPoint2d = new Point2D(); }
	
	resultPoint2d.set(velU, velV);
	return resultPoint2d;
};

WindLayer.prototype.getAltitude = function()
{
	if (!this.windMapJson)
	{ return undefined; }

	return this.windMapJson.bbox[2];
};

WindLayer.prototype.deleteObjects = function(magoManager)
{
	if (this.windMapTexture)
	{
		var gl = magoManager.getGl();
		this.windMapTexture.deleteObjects(gl);
	}
	this.windMapTexture = undefined; // uv encoded wind map.***
	delete this.windMapJson;
	this.windMapFileName = undefined;
	this.windMapJsonFileLoadState = undefined;
	this.windMapFolderPath = undefined;
	this.windData = undefined;
	
	this.currWindMap = undefined;
	this.currWindMapIdx = undefined;
	
	if (this.geoExtent)
	{
		this.geoExtent.deleteObjects();
	}
	this.geoExtent = undefined;

	if (this.geoLocDataManager)
	{
		this.geoLocDataManager.deleteObjects();
	}
	this.geoLocDataManager = undefined;
	
	this.flipTexCoordsY_windMap = undefined;
	this.externalAlpha = undefined;

	if (this.windVelocityMap)
	{
		delete this.windVelocityMap;
	}
	this.windVelocityMap = undefined;
};

WindLayer.prototype.getVelocityVector3d = function (pixelX, pixelY, resultPoint3d, magoManager)
{
	// Note: to call this function MUST BE BINDED the windTexture.
	if (this.windMapTexture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		if (resultPoint3d === undefined)
		{ resultPoint3d = new Point3D(); }

		return resultPoint3d;
	}

	//-------------------------------------------------------------
	// Now, bind windTexture and read the pixel(pixelX, pixelY).
	// Read the picked pixel and find the object.*********************************************************
	var texWidth = this.windMapTexture.imageWidth;
	var texHeight = this.windMapTexture.imageHeight;
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }

	if (!this.windVelocityMap)
	{
		var gl = magoManager.getGl();

		if (this.windVolume.framebuffer === undefined)
		{ this.windVolume.framebuffer = gl.createFramebuffer(); }

		// bind framebuffer.
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.windVolume.framebuffer);
		// attach the WINDMAP texture to the framebuffer.
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.windMapTexture.texId, 0);
		var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
		if (canRead)
		{
			var totalPixelsCount = texWidth*texHeight;
			this.windVelocityMap = new Uint8Array(4 * totalPixelsCount); // 1 pixels select.***
			gl.readPixels(0, 0, texWidth, texHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.windVelocityMap);
		}
		else
		{
			if (resultPoint3d === undefined)
			{ resultPoint3d = new Point3D(); }
			return resultPoint3d;
		}
		// Unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	var idx = pixelY * texWidth + pixelX;
	var red = this.windVelocityMap[idx*4]/255.0;
	var green = this.windVelocityMap[idx*4+1]/255.0;
	var blue = this.windVelocityMap[idx*4+2]/255.0;

	// Now, considering the maxWindU, minWindU, maxWindV & minWindV, calculate the wind speed.
	/*
	windMapJson:
		bbox: (6) [126.9863972315756, 37.42705219737738, 437.5, 127.03205659741529, 37.46344961762591, 437.5]
		geometry: {type: "Polygon", coordinates: Array(1)}
		properties:
			altitude: "437.5"
			image: {width: "400", height: "400", uri: "wind_87.png"}
			value:
				b: {min: -0.2973000109195709, max: 0.23829999566078186}
				g: {min: -0.16840000450611115, max: 0.13519999384880066}
				r: {min: -1.9733999967575073, max: -1.4122999906539917}
	*/
	var speedValues = this.windMapJson.properties.value;
	var uMin = speedValues.r.min;
	var vMin = speedValues.g.min;
	var wMin = speedValues.b.min;
	var uMax = speedValues.r.max;
	var vMax = speedValues.g.max;
	var wMax = speedValues.b.max;

	//vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(windMapTexCoord));
	// mix(v1, v2, a) = v1 * (1 - a) + v2 * a
	
	var velU = uMin * (1.0 - red) + uMax * red;
	var velV = vMin * (1.0 - green) + vMax * green;
	var velW = wMin * (1.0 - blue) + wMax * blue;
	
	if (resultPoint3d === undefined)
	{ resultPoint3d = new Point3D(); }
	
	resultPoint3d.set(velU, velV, velW);
	return resultPoint3d;
};

WindLayer.prototype.getVelocityVector2d_biLinearInterpolation = function(s, t, resultPoint2d, magoManager)
{
	
	/*
	vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture2D(u_wind, vc).rg;
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_wind, vc + px).rg;
	return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
	*/

	var texWidth = this.windMapTexture.imageWidth;
	var texHeight = this.windMapTexture.imageHeight;
	var pixelX = Math.floor(s*(texWidth));
	var pixelY = Math.floor(t*(texHeight));
	
	var st = s*texWidth;
	var tt = t*texHeight;
	var fx = Math.ceil(((st < 1.0) ? st : (st % Math.floor(st))) * 10000)/10000;
	var fy = Math.ceil(((tt < 1.0) ? tt : (tt % Math.floor(tt))) * 10000)/10000;
	

	//var vel = this.getVelocityVector2d(pixelX, pixelY, undefined, magoManager); // unique code if no interpolation.

	var pixelXPlus = pixelX+1 < texWidth ? pixelX+1 : pixelX;
	var pixelYPlus = pixelY+1 < texHeight ? pixelY+1 : pixelY;
	var vel_tl = this.getVelocityVector2d(pixelX, pixelY, undefined, magoManager);
	var vel_tr = this.getVelocityVector2d(pixelXPlus, pixelY, undefined, magoManager);
	var vel_bl = this.getVelocityVector2d(pixelX, pixelYPlus, undefined, magoManager);
	var vel_br = this.getVelocityVector2d(pixelXPlus, pixelYPlus, undefined, magoManager);
	
	var vel_t = Point2D.mix(vel_tl, vel_tr, fx, undefined);
	var vel_b = Point2D.mix(vel_bl, vel_br, fx, undefined);

	if (!resultPoint2d)
	{ resultPoint2d = new Point2D(); }

	resultPoint2d = Point2D.mix(vel_t, vel_b, fy, resultPoint2d);
	
	return resultPoint2d;
};

WindLayer.prototype.getVelocityVector3d_biLinearInterpolation = function (s, t, resultPoint3d, magoManager)
{
	/*
	vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture2D(u_wind, vc).rg;
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_wind, vc + px).rg;
	return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
	*/

	////magoManager.windPngTex = this.windMapTexture.texId; // delete this test code line!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	var texWidth = this.windMapTexture.imageWidth;
	var texHeight = this.windMapTexture.imageHeight;
	var pixelX = Math.floor(s*(texWidth));
	var pixelY = Math.floor(t*(texHeight));
	
	var st = s*texWidth;
	var tt = t*texHeight;
	var fx = Math.ceil(((st < 1.0) ? st : (st % Math.floor(st))) * 10000)/10000;
	var fy = Math.ceil(((tt < 1.0) ? tt : (tt % Math.floor(tt))) * 10000)/10000;

	var pixelXPlus = pixelX+1 < texWidth ? pixelX+1 : pixelX;
	var pixelYPlus = pixelY+1 < texHeight ? pixelY+1 : pixelY;
	var vel_tl = this.getVelocityVector3d(pixelX, pixelY, undefined, magoManager);
	var vel_tr = this.getVelocityVector3d(pixelXPlus, pixelY, undefined, magoManager);
	var vel_bl = this.getVelocityVector3d(pixelX, pixelYPlus, undefined, magoManager);
	var vel_br = this.getVelocityVector3d(pixelXPlus, pixelYPlus, undefined, magoManager);

	//if(!vel_tl || !vel_tr || !vel_bl || !vel_br)
	//{
	//	return undefined;
	//}
	
	var vel_t = Point3D.mix(vel_tl, vel_tr, fx, undefined);
	var vel_b = Point3D.mix(vel_bl, vel_br, fx, undefined);

	if (!resultPoint3d)
	{ resultPoint3d = new Point3D(); }

	resultPoint3d = Point3D.mix(vel_t, vel_b, fy, resultPoint3d);
	
	return resultPoint3d;
};

WindLayer.prototype.getTrajectoryInLocalCoordinates = function(startGeoCoord, magoManager, options)
{
	// Obtain the velocity in this geoCoord.
	var geoExtent = this.getGeographicExtent();

	// 1rst, check if the geoCoord is inside of this windLayer range.
	if (!geoExtent.intersects2dWithGeoCoord(startGeoCoord))
	{ return undefined; }

	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	var minAlt = geoExtent.getMinAltitude();
	var maxAlt = geoExtent.getMaxAltitude();
	var lonRadRange = maxLonRad - minLonRad;
	var latRadRange = maxLatRad - minLatRad;

	// Calculate the texCoord of the "geoCoord".
	var currLon = startGeoCoord.getLongitudeRad();
	var currLat = startGeoCoord.getLatitudeRad();
	var currAlt = 0.0;
	
	var texWidth = this.windMapTexture.imageWidth;
	var texHeight = this.windMapTexture.imageHeight;

	// Test to calculate speedFactor by globeRadius.**********************************************************
	var midLat = geoExtent.getCenterLatitude();
	var radius = Globe.radiusAtLatitudeDeg(midLat);
	var distortion = Math.cos(midLat * Math.PI/180);
	var meterToLon = 1.0 / (radius * distortion);
	var meterToLat = 1.0 / radius;

	var xSpeedFactor = 1.0;
	var ySpeedFactor = 1.0;
	var zSpeedFactor = 1.0;
	//---------------------------------------------------------------------------------------------------
	
	var numPoints = 20;
	
	if (options)
	{
		//if (options.speedFactor !== undefined)
		//{ speedFactor = options.speedFactor; }
		
		if (options.numPoints !== undefined)
		{ numPoints = options.numPoints; }
	}

	var resultPointsLCArray = []; 

	var pointLC = new Point3D();
	resultPointsLCArray.push(pointLC); // push the 1rst pointLC.

	var curXinMeters = 0.0;
	var curYinMeters = 0.0;
	var curZinMeters = 0.0;
	var offsetXinMeters;
	var offsetYinMeters;
	var offsetZinMeters;
	
	// Create a lineString with numPoints.***
	for (var i=0; i<numPoints; i++)
	{
		var s = (currLon - minLonRad)/lonRadRange;
		var t = (currLat - minLatRad)/latRadRange;
		var r = (currAlt - minAlt)/(maxAlt - minAlt);

		var velocity2d = this.getVelocityVector3d_biLinearInterpolation(s, t, undefined, magoManager); 
		
		// calculate currLon & currLat.
		var distortion = Math.cos((minLatRad + currLat * latRadRange ));

		offsetXinMeters = velocity2d.x / distortion * xSpeedFactor;
		offsetYinMeters = velocity2d.y * ySpeedFactor;
		offsetZinMeters = velocity2d.z * zSpeedFactor;

		curXinMeters += offsetXinMeters;
		curYinMeters += offsetYinMeters;
		curZinMeters += offsetZinMeters;

		var pointLC = new Point3D(curXinMeters, curYinMeters, curZinMeters);
		resultPointsLCArray.push(pointLC); // push the 1rst pointLC.

		// Now, calculate geoCoord for next point.
		currLon += offsetXinMeters * meterToLon;
		currLat += offsetYinMeters * meterToLat;

		if (Math.abs(velocity2d.x) + Math.abs(velocity2d.y) < 0.02)
		{
			return resultPointsLCArray;
		}
	}
	
	
	return resultPointsLCArray;
};

WindLayer.prototype.getWindPlaneFBO = function(magoManager)
{
	if (!this.windPlaneFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0];
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.windPlaneFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.windPlaneFBO;
};

WindLayer.prototype.renderWindPlaneDepth = function (magoManager)
{
	// This function renders the wind-layer depth texture.
	// Provisionally wind-layer is a rectangle3d.
	// renderDepth of the "this.windDisplayPlane".
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();

	var windPlaneFBO = this.getWindPlaneFBO(magoManager);
	var extbuffers = magoManager.extbuffers;

	this.windPlaneFBO.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.windPlaneFBO.colorBuffersArray[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.windPlaneFBO.colorBuffersArray[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.windPlaneFBO.colorBuffersArray[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.windPlaneFBO.colorBuffersArray[3], 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	  ]);

	if (magoManager.currentFrustumIdx === 2)
	{
		gl.clearColor(0, 0, 0, 1);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}


	// Now, render the windPlane.
	if (!this.visibleObjControler)
	{
		this.visibleObjControler = new VisibleObjectsController();
	}

	if (this.windDisplayPlane)
	{ this.visibleObjControler.currentVisibleNativeObjects.opaquesArray[0] = this.windDisplayPlane; }

	var renderType = 1;
	magoManager.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControler);

	// Test:
	magoManager.windPlaneDepthTex = this.windPlaneFBO.colorBuffersArray[1];
	magoManager.windPlaneNormalTex = this.windPlaneFBO.colorBuffersArray[2];
	magoManager.windPngTex = this.windMapTexture.texId;

	// Return to main framebuffer.************************
	magoManager.bindMainFramebuffer();
	// unbind mago colorTextures:
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
	]);
};

WindLayer.prototype.getModelViewProjectionRelToEye = function(magoManager)
{
	if (!this.modelViewProjectionRelToEye)
	{
		var sceneState = magoManager.sceneState;
		var camera = sceneState.camera;
		var frustum0 = camera.frustum;
		var farSky = 100000000.0;
		var projectionMatrixSky = new Matrix4();
		projectionMatrixSky._floatArrays = glMatrix.mat4.perspective(projectionMatrixSky._floatArrays, frustum0.fovyRad[0], frustum0.aspectRatio[0], frustum0.near[0], farSky);
		
		// modelViewRelToEye.***
		var modelViewRelToEyeMatrix = sceneState.modelViewRelToEyeMatrix;
		
		// modelViewProjectionRelToEye.***
		this.modelViewProjectionRelToEye = new Matrix4();
		this.modelViewProjectionRelToEye._floatArrays = glMatrix.mat4.multiply(this.modelViewProjectionRelToEye._floatArrays, projectionMatrixSky._floatArrays, modelViewRelToEyeMatrix._floatArrays);
	}

	return this.modelViewProjectionRelToEye;
};

WindLayer.prototype.renderMode3D = function(magoManager)
{
	if (!this.isReadyToRender())
	{ 
		this.prepareWindLayer();
		return; 
	}

	if (this.windDisplayPlane === undefined)
	{ return; }

	if (magoManager.currentFrustumIdx > 2)
	{ return; }

	
	
	// test to render in 3d directly.***
	// No need weatherEarth.***
	var camPos = magoManager.sceneState.camera.position;
	var gl = this.gl;
	var shader = this.drawParticles3DShader;
	var program = shader.program;
	gl.useProgram(program);
	this.drawParticles3DShader.bindUniformGenerals();
	gl.enableVertexAttribArray(shader.a_index);

	// Set if use logarithmic depth.
	gl.uniform1i(shader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(shader.uFCoef_logDepth_loc, magoManager.sceneState.fCoef_logDepth[0]);
	
	// set uModelViewProjectionMatrixRelToEye.
	// create a unique projection-perspective matrix.
	//var mvpRelToEye = this.getModelViewProjectionRelToEye(magoManager);
	//gl.uniformMatrix4fv(shader.uModelViewProjectionMatrixRelToEye, false, mvpRelToEye._floatArrays);

	gl.uniform1i(shader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	
	var geoLocData = this.windDisplayPlane.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader); // binds : buildingRotMat + buildingPosHIGH + buildingPosLOW.

	//FBO.bindAttribute(gl, this.particleIndexBuffer, shader.a_index, 1);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.particleIndexBuffer);
	gl.vertexAttribPointer(shader.a_index, 1, gl.FLOAT, false, 0, 0);
	gl.uniform1i(shader.u_colorScale, true);

	gl.uniform1i(shader.u_wind, 0);
	gl.uniform1i(shader.u_particles, 1);
	gl.uniform1i(shader.u_particles_next, 2); // no used.
	
	FBO.bindTexture(gl, this.windMapTexture.texId, 0);
	
	var uMin = this.windData.uMin;
	var vMin = this.windData.vMin;
	var uMax = this.windData.uMax;
	var vMax = this.windData.vMax;
	
	if (this.weatherStation.windData && this.weatherStation.windData.uMin)
	{
		uMin = this.weatherStation.windData.uMin;
		vMin = this.weatherStation.windData.vMin;
		uMax = this.weatherStation.windData.uMax;
		vMax = this.weatherStation.windData.vMax;
	}
	
	gl.uniform1f(shader.u_particles_res, this.particleStateResolution);
	gl.uniform2f(shader.u_wind_min, uMin, vMin);
	gl.uniform2f(shader.u_wind_max, uMax, vMax);
	gl.uniform1i(shader.u_flipTexCoordY_windMap, this.flipTexCoordsY_windMap);
	
	// Layer altitude (no used in small wind maps).********************************************************
	//var geoLocData = this.weatherStation.geoLocDataManager.getCurrentGeoLocationData();
	//var layerAltitude = geoLocData.geographicCoord.altitude;
	//gl.uniform1f(shader.u_layerAltitude, layerAltitude);
	//-----------------------------------------------------------------------------------------------------
	var geoExtent = this.getGeographicExtent();
	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	var minAlt = geoExtent.getMinAltitude();
	var maxAlt = geoExtent.getMaxAltitude();
	
	gl.uniform3fv(shader.u_geoCoordRadiansMax, [maxLonRad, maxLatRad, maxAlt]);
	gl.uniform3fv(shader.u_geoCoordRadiansMin, [minLonRad, minLatRad, minAlt]);
	
	gl.uniform3fv(shader.u_camPosWC, [camPos.x, camPos.y, camPos.z]);
	//gl.uniform1f(shader.pendentPointSize, 20000.0);
	//gl.uniform1f(shader.pendentPointSize, 5000.0); // for all jeju island.
	//gl.uniform1f(shader.pendentPointSize, 3000.0); // jeju airport.
	//gl.uniform1f(shader.pendentPointSize, 1000.0); // jeju airport.
	//gl.uniform1f(shader.pendentPointSize, 80.0); // golfPark 1 hole.
	gl.uniform1f(shader.pendentPointSize, this.pendentPointSize); 
	gl.uniform1f(shader.u_externAlpha, this.externalAlpha);
	
	gl.enable(gl.BLEND);
	
	var count = this.particlesPositionTexturesArray.length;
	for (var i = count-1; i>= 0; i--)
	{
		// Calculate the tail transparency alpha.
		var alpha = 1/count * (i+1);
		if (i === 0)
		{
			alpha = 0.1;
		}
		else 
		{
			alpha = 1/count * (i+1);
		}
		
		gl.uniform1f(shader.u_tailAlpha, alpha);
		FBO.bindTexture(gl, this.particlesPositionTexturesArray[i], 1);
		gl.drawArrays(gl.POINTS, 0, this.numParticles);
	}
	gl.disable(gl.BLEND);

};

WindLayer.prototype.render = function(magoManager)
{
	var gl = this.gl;
	
	if (this.weatherEarth)
	{
		// render the quad.***
		var currentShader = magoManager.postFxShadersManager.getShader("testQuad"); 
		var shaderProgram = currentShader.program;
		
		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(currentShader.texCoord2_loc);
		gl.enableVertexAttribArray(currentShader.position3_loc);
		
		currentShader.bindUniformGenerals();
		
		currentShader.resetLastBuffersBinded();

		this.flipTexCoordsY_windMap = true;
		if (this.wwwMat === undefined)
		{
			this.wwwMat = new Matrix4();
			this.wwwMat.rotationAxisAngDeg(90.0, 1.0, 0.0, 0.0);
			this.flipTexCoordsY_windMap = false;
		}
		
		if (magoManager.configInformation.geo_view_library === Constant.WORLDWIND)
		{ gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, this.wwwMat._floatArrays); }
		else
		{ gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, [1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1]); }
		
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, [0, 0, 0]);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, [0, 0, 0]);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.screenTexture0);  
		//gl.bindTexture(gl.TEXTURE_2D, this.windMapTexture.texId);  
		//gl.bindTexture(gl.TEXTURE_2D, this.particleStateTexture0);  

		var vbo = this.weatherEarth.vboKeyContainer.vboCacheKeysArray[0];
	
		if (!vbo.bindDataTexCoord(currentShader, magoManager.vboMemoryManager))
		{ return; }
		if (!vbo.bindDataPosition(currentShader, magoManager.vboMemoryManager))
		{ return; }
		if (!vbo.bindDataIndice(currentShader, magoManager.vboMemoryManager)) 
		{ return; }
	
		gl.enable(gl.BLEND);
		gl.drawElements(gl.TRIANGLES, vbo.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
		gl.disable(gl.BLEND);
		
	}
};

WindLayer.prototype.renderWindScreen = function ()
{
	var gl = this.gl;
	// draw the screen into a temporary framebuffer to retain it as the background on the next frame
	FBO.bindFramebuffer(gl, this.windFramebuffer, this.screenTexture0);
	
	gl.viewport(0, 0, this.screenTexWidth, this.screenTexHeight);

	this.drawFadeScreen(this.screenTexture1, this.fadeOpacity);
	this.renderParticles();
	
	// save the current screen as the background for the next frame
	var aux = this.screenTexture1;
	this.screenTexture1 = this.screenTexture0;
	this.screenTexture0 = aux;
	
};

WindLayer.prototype.drawFadeScreen = function(texture, opacity) 
{
	// here apply transparency to the particles tail.***
	var gl = this.gl;
	var program = this.screenFadeProgram;
	gl.useProgram(program.program);

	FBO.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);
	FBO.bindTexture(gl, texture, 2);
	gl.uniform1i(program.u_screen, 2);
	gl.uniform1f(program.u_opacity, opacity);

	gl.drawArrays(gl.TRIANGLES, 0, 6);
};

WindLayer.prototype.renderParticles = function() 
{
	var gl = this.gl;
	var program = this.drawParticlesProgram;
	gl.useProgram(program.program);

	FBO.bindAttribute(gl, this.particleIndexBuffer, program.a_index, 1);
	gl.uniform1i(program.u_colorScale, true);

	gl.uniform1i(program.u_wind, 0);
	gl.uniform1i(program.u_particles, 1);
	
	gl.uniform1f(program.u_particles_res, this.particleStateResolution);
	gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
	gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);
	gl.uniform1i(program.u_flipTexCoordY_windMap, this.flipTexCoordsY_windMap);

	gl.drawArrays(gl.POINTS, 0, this.numParticles);
};

WindLayer.prototype.updateParticlesPositions = function(magoManager) 
{
	if (!this.windPlaneFBO) // the "windPlaneFBO" is created in renderMode3D.
	{ return; }
	
	var gl = magoManager.getGl();
	var layersToUpdateCount = 6;
	layersToUpdateCount = 1;

	var particlesPositionTexture = this.particlesPositionTexturesArray[this.particlesPositionTexturesArray.length-1];
	FBO.bindTexture(gl, particlesPositionTexture, 1);
	FBO.bindTexture(gl, this.windPlaneFBO.colorBuffersArray[1], 2);
	FBO.bindTexture(gl, this.windPlaneFBO.colorBuffersArray[2], 3);
	
	var interpolFactor = 1.0/(layersToUpdateCount); // original.
	for (var i=0; i<layersToUpdateCount; i++)
	{
		//var interpolation = interpolFactor * (1+i); // original.
		var interpolation = interpolFactor * (1+i);
		this.updateParticlesPositionsForInterpolation(magoManager, interpolation);
	}
};

WindLayer.prototype.updateParticlesPositionsForInterpolation = function(magoManager, interpolation) 
{
	var gl = this.gl;
	var currentParticlesPositionTexture = this.particlesPositionTexturesArray.shift();
	
	// do frustumCullling smartTiles.
	var sceneState = magoManager.sceneState;
	var camera = sceneState.camera;
	var camPos = camera.position;
	//var camAltitude = camera.getCameraElevation();
	var resultIntersectedTilesNamesMap = {};
	var frustumVolume = magoManager.myCameraSCX.bigFrustum;
	var maxDepth = 6;
	resultIntersectedTilesNamesMap = SmartTile.getFrustumIntersectedTilesNames(frustumVolume, maxDepth, camPos, magoManager, resultIntersectedTilesNamesMap);
	
	/*
	var visiblesFixDepthTilesNamesMap = {};
	for (var key in resultIntersectedTilesNamesMap)
	{
		if (Object.prototype.hasOwnProperty.call(resultIntersectedTilesNamesMap, key))
		{
			var splittedStrings = key.split('\\');
			var currDepth = parseInt(splittedStrings[0]);
			var geoExtent = resultIntersectedTilesNamesMap[key];
			SmartTile.getTilesNamesByTargetDepth(maxDepth, currDepth, geoExtent.minGeographicCoord, geoExtent.maxGeographicCoord, visiblesFixDepthTilesNamesMap);
		}
	}
	*/
	
	// now, make visibleTilesRangesVector.
	var visibleTilesRanges = [];
	for (var key in resultIntersectedTilesNamesMap)
	{
		if (Object.prototype.hasOwnProperty.call(resultIntersectedTilesNamesMap, key))
		{
			// calculate normalized rectangle. Origin in left-down.
			var splittedStrings = key.split('\\');
			var currDepth = parseInt(splittedStrings[0]);
			//var insertCount = Math.floor(maxDepth/(currDepth+1));
			//if (insertCount === 0)
			//{ insertCount = 1; }
			
			var geoExtent = resultIntersectedTilesNamesMap[key];
			var minX = (geoExtent.minGeographicCoord.longitude + 180)/360;
			var minY = (geoExtent.minGeographicCoord.latitude + 90)/180;
			var maxX = (geoExtent.maxGeographicCoord.longitude + 180)/360;
			var maxY = (geoExtent.maxGeographicCoord.latitude + 90)/180;
			
			//for (var i=0; i<insertCount; i++)
			//{
			visibleTilesRanges.push(minX);
			visibleTilesRanges.push(minY);
			visibleTilesRanges.push(maxX);
			visibleTilesRanges.push(maxY);
			//}
		}
	}
	
	if (!this.windData)
	{ return; }
	
	FBO.bindFramebuffer(gl, this.windFramebuffer, currentParticlesPositionTexture);
	gl.viewport(0, 0, this.particleStateResolution, this.particleStateResolution);

	var program = this.updateParticlesProgram;
	gl.useProgram(program.program);

	FBO.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);
	

	gl.uniform1i(program.u_wind, 0);
	gl.uniform1i(program.u_particles, 1);
	var randomSeed = Math.random();
	gl.uniform1f(program.u_rand_seed, randomSeed);
	gl.uniform2f(program.u_wind_res, this.windData.width, this.windData.height);
	gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
	gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);
	gl.uniform1f(program.u_speed_factor, this.speedFactor);
	gl.uniform1f(program.u_interpolation, interpolation);
	gl.uniform1f(program.u_drop_rate, this.dropRate);
	gl.uniform1f(program.u_drop_rate_bump, this.dropRateBump);
	gl.uniform1i(program.u_flipTexCoordY_windMap, this.flipTexCoordsY_windMap);
	gl.uniform2fv(program.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);

	if (!this.flipTexCoordsY_windMap)
	{
		var hola = 0;
	}
	var geoExtent = this.getGeographicExtent();
	var minLonRad = geoExtent.getMinLongitudeRad();
	var minLatRad = geoExtent.getMinLatitudeRad();
	var maxLonRad = geoExtent.getMaxLongitudeRad();
	var maxLatRad = geoExtent.getMaxLatitudeRad();
	
	gl.uniform3fv(program.u_geoCoordRadiansMax, [maxLonRad, maxLatRad, 16000.0]);
	gl.uniform3fv(program.u_geoCoordRadiansMin, [minLonRad, minLatRad, 0.0]);
	
	var visiblesCount = visibleTilesRanges.length/4;
	if (visiblesCount > 16)
	{ visiblesCount = 16; }
	var visibleTilesRangesFloat32 = new Float32Array(visibleTilesRanges);
	gl.uniform4fv(program.u_visibleTilesRanges, visibleTilesRangesFloat32);
	gl.uniform1i(program.u_visibleTilesRangesCount, visiblesCount);

	// new uniforms:
	// set modelViewProjectionMatrix.***************************************************************************************
	var mvpMat = sceneState.modelViewProjRelToEyeMatrix;
	gl.uniformMatrix4fv(program.ModelViewProjectionMatrixRelToEye, false, mvpMat._floatArrays);
	
	var geoLocData = this.windDisplayPlane.geoLocDataManager.getCurrentGeoLocationData();
	//geoLocData.bindGeoLocationUniforms(gl, program); // binds : buildingRotMat + buildingPosHIGH + buildingPosLOW.

	gl.uniformMatrix4fv(program.uBuildingRotMatrix_loc, false, geoLocData.rotMatrix._floatArrays);
	gl.uniform3fv(program.buildingPosHIGH, [geoLocData.positionHIGH[0], geoLocData.positionHIGH[1], geoLocData.positionHIGH[2]]);
	gl.uniform3fv(program.buildingPosLOW, [geoLocData.positionLOW[0], geoLocData.positionLOW[1], geoLocData.positionLOW[2]]);

	gl.uniform3fv(program.encodedCameraPositionMCHigh, sceneState.encodedCamPosHigh);
	gl.uniform3fv(program.encodedCameraPositionMCLow, sceneState.encodedCamPosLow);

	gl.uniform1f(program.uTangentOfHalfFovy_loc, camera.frustum.tangentOfHalfFovy[0]);
	gl.uniform1f(program.uFar_loc, camera.frustum.far[0]);
	gl.uniform1f(program.uAspectRatio_loc, camera.frustum.aspectRatio[0]);
	var mvMatInv = sceneState.getModelViewMatrixInv();
	gl.uniformMatrix4fv(program.uModelViewMatInv_loc, false, mvMatInv._floatArrays);
	  
	// Now, the "rotMatrixInv".
	var rotMatInv = geoLocData.getRotMatrixInv();
	gl.uniformMatrix4fv(program.buildingRotMatrixInv, false, rotMatInv._floatArrays);
	// end new uniforms.----------------------------------------------------------------------------------------------------

	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	this.particlesPositionTexturesArray.push(currentParticlesPositionTexture);
	
	FBO.bindFramebuffer(gl, null);
};

WindLayer.prototype.updateParticlesPositions2dMode = function() 
{
	var gl = this.gl;
	FBO.bindFramebuffer(gl, this.windFramebuffer, this.particlesPositionTexture1);
	gl.viewport(0, 0, this.particleStateResolution, this.particleStateResolution);

	var program = this.updateParticlesProgram;
	gl.useProgram(program.program);

	FBO.bindAttribute(gl, this.quadBuffer, program.a_pos, 2);

	gl.uniform1i(program.u_wind, 0);
	gl.uniform1i(program.u_particles, 1);
	var randomSeed = Math.random();
	gl.uniform1f(program.u_rand_seed, randomSeed);
	gl.uniform2f(program.u_wind_res, this.windData.width, this.windData.height);
	gl.uniform2f(program.u_wind_min, this.windData.uMin, this.windData.vMin);
	gl.uniform2f(program.u_wind_max, this.windData.uMax, this.windData.vMax);
	gl.uniform1f(program.u_speed_factor, this.speedFactor);
	gl.uniform1f(program.u_drop_rate, this.dropRate);
	gl.uniform1f(program.u_drop_rate_bump, this.dropRateBump);
	gl.uniform1i(program.u_flipTexCoordY_windMap, this.flipTexCoordsY_windMap);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// swap the particle state textures so the new one becomes the current one
	var temp = this.particlesPositionTexture0;
	this.particlesPositionTexture0 = this.particlesPositionTexture1;
	this.particlesPositionTexture1 = temp;
	
	FBO.bindFramebuffer(gl, null);
};

































