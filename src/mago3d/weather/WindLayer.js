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
	
	this.windMapsArray = [];
	this.windMapTexture; // uv encoded wind map.***
	this.windMapJson;
	this.windMapFileName;
	this.windMapFolderPath;
	this.windData;
	
	this.currWindMap;
	this.currWindMapIdx = 0;
	
	this.screenTexture0;
	this.screenTexture1;
	this.screenTexWidth;
	this.screenTexHeight;
	
	this.geoExtent;
	this.layerAltitude = 6000.0;
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
	
	this.flipTexCoordsY_windMap = true;
	this.externalAlpha = 0.7;
	
	// Check if exist options.
	if (options !== undefined)
	{
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
		this.windFramebuffer = gl.createFramebuffer();
	}
	
	// shaders.***
	var vsSource = ShaderSource.draw_vert;
	var fsSource = ShaderSource.draw_frag;
	this.drawParticlesProgram = PostFxShader.createProgram(gl, vsSource, fsSource);

	vsSource = ShaderSource.quad_vert;
	fsSource = ShaderSource.screen_frag;
	this.screenFadeProgram = PostFxShader.createProgram(gl, vsSource, fsSource);
	
	vsSource = ShaderSource.quad_vert;
	fsSource = ShaderSource.update_frag;
	this.updateParticlesProgram = PostFxShader.createProgram(gl, vsSource, fsSource);
	this.updateParticlesProgram.u_visibleTilesRanges = gl.getUniformLocation(this.updateParticlesProgram.program, "u_visibleTilesRanges");
	
	// test for direct 3d drawing.***
	var vsSource = ShaderSource.draw_vert3D;
	var fsSource = ShaderSource.draw_frag3D;
	var shaderName = "drawWindParticles3d";
	var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
	var useLogarithmicDepth = magoManager.postFxShadersManager.getUseLogarithmicDepth();
	if (useLogarithmicDepth)
	{
		use_linearOrLogarithmicDepth = "USE_LOGARITHMIC_DEPTH";
	}
	fsSource = fsSource.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);

	this.drawParticles3DShader = magoManager.postFxShadersManager.createShaderProgram(gl, vsSource, fsSource, shaderName, magoManager);
	this.drawParticles3DShader.bUseLogarithmicDepth_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "bUseLogarithmicDepth");
	this.drawParticles3DShader.uFCoef_logDepth_loc = gl.getUniformLocation(this.drawParticles3DShader.program, "uFCoef_logDepth");

	this.drawParticlesProgram3D = this.drawParticles3DShader.program;
	
	//vsSource = ShaderSource.Test_QuadVS;
	//fsSource = ShaderSource.Test_QuadFS;
	//this.drawRegionProgram = PostFxShader.createProgram(gl, vsSource, fsSource);
	
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
	
	var particlesPositionTexturesCount = 70 ;//* 2;
	particlesPositionTexturesCount = 30 ;//* 2;
	particlesPositionTexturesCount = 10 ;// golfPark only one hole
	this.particlesPositionTexturesArray = [];
	for (var i=0; i<particlesPositionTexturesCount; i++)
	{
		var particlesPositionTexture = Texture.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
		this.particlesPositionTexturesArray.push(particlesPositionTexture);
	}

	var particleIndices = new Float32Array(this.numParticles);
	for (var i = 0; i < this.numParticles; i++) { particleIndices[i] = i; }
	this.particleIndexBuffer = FBO.createBuffer(gl, particleIndices);
};

WindLayer.prototype.prepareWindLayer = function()
{
	// Check if the winsMapTexture is loaded.
	if (this.windMapTexture === undefined)
	{
		this.windMapTexture = new Texture();
		this.windMapTexture.texId = this.gl.createTexture();
	}
	
	if (this.windMapTexture.fileLoadState === CODE.fileLoadState.READY)
	{
		var windMapTexturePath = this.windMapFolderPath + "/" + this.windMapFileName + ".png";
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
			that.windMapJson = res;
			that.windMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			
			var jsonLonCount = that.windMapJson.lon.length;
			var jsonLatCount = that.windMapJson.lat.length;
			
			var jsonMinLon = that.windMapJson.lon[0];
			var jsonMaxLon = that.windMapJson.lon[jsonLonCount-1];
			
			var jsonMinLat = that.windMapJson.lat[jsonLatCount-1];
			var jsonMaxLat = that.windMapJson.lat[0];
			
			if (that.windMapJson.minLon)
			{
				jsonMinLon = that.windMapJson.minLon;
			}
			
			if (that.windMapJson.maxLon)
			{
				jsonMaxLon = that.windMapJson.maxLon;
			}
			
			if (that.windMapJson.minLat)
			{
				jsonMinLat = that.windMapJson.minLat;
			}
			
			if (that.windMapJson.maxLat)
			{
				jsonMaxLat = that.windMapJson.maxLat;
			}
			
			var lonOffSet = 0.0;
			var jsonAlt_above_ground = 10.0;
			
			if (that.windMapJson.height_above_ground !== undefined)
			{ jsonAlt_above_ground = that.windMapJson.height_above_ground[0]; }
			
			var lonRange = jsonMaxLon - jsonMinLon;
			/*
			var minLon = 360 - jsonMaxLon + lonRange + lonOffSet; 
			var minLat = jsonMinLat; 
			var minAlt = jsonAlt_above_ground; 
			var maxLon = 360 - jsonMinLon + lonRange - lonOffSet;
			var maxLat = jsonMaxLat;
			var maxAlt = jsonAlt_above_ground;
			*/
			
			var minLon = jsonMinLon; 
			var minLat = jsonMinLat; 
			var minAlt = jsonAlt_above_ground; 
			var maxLon = jsonMaxLon;
			var maxLat = jsonMaxLat;
			var maxAlt = jsonAlt_above_ground;
			
			that.geoExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
			
			if (that.windData === undefined)
			{
				that.windData = {};
			}
			that.windData.uMin = that.windMapJson.uMin;
			that.windData.vMin = that.windMapJson.vMin;
			that.windData.uMax = that.windMapJson.uMax;
			that.windData.vMax = that.windMapJson.vMax;
			that.windData.height = that.windMapJson.height;
			that.windData.width = that.windMapJson.width;
			that.windData.height_above_ground = that.windMapJson.height_above_ground[0];
			
			// calculate the geoLocationData.
			that.geoLocDataManager = new GeoLocationDataManager();
			var geoLocData = that.geoLocDataManager.newGeoLocationData("centerOfTile");
			var altitude = that.layerAltitude;
			ManagerUtils.calculateGeoLocationData((jsonMinLon + jsonMaxLon)/2, (jsonMinLat + jsonMaxLat)/2, altitude, 0, 0, 0, geoLocData);


		});
		return false;
	}
	
	return true;
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
	var mosaicWidth = 1;
	var mosaicHeight = 1;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 1 pixels select.***

	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	var gl = magoManager.getGl();
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	
	
	var red = pixels[0]/255.0;
	var green = pixels[1]/255.0;
	
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

WindLayer.prototype.getTrajectory = function(startGeoCoord, resultGeoCoordsArray, magoManager, options)
{
	// Obtain the velocity in this geoCoord.
	var minLonRad = this.geoExtent.getMinLongitudeRad();
	var minLatRad = this.geoExtent.getMinLatitudeRad();
	var maxLonRad = this.geoExtent.getMaxLongitudeRad();
	var maxLatRad = this.geoExtent.getMaxLatitudeRad();
	var minAlt = this.geoExtent.getMinAltitude();
	var maxAlt = this.geoExtent.getMaxAltitude();
	var lonRadRange = maxLonRad - minLonRad;
	var latRadRange = maxLatRad - minLatRad;
	var radToDeg = 180/Math.PI;
	var altitude = startGeoCoord.altitude;
	
	// speeds.
	var uMin = this.windData.uMin;
	var vMin = this.windData.vMin;
	var uMax = this.windData.uMax;
	var vMax = this.windData.vMax;

	var windSpeedMin = new Point2D(uMin, vMin);
	var windSpeedMax = new Point2D(uMax, vMax);

	// 1rst, create random points on the layer domain.
	
	var gl = magoManager.getGl();

	// Now, bind framebuffer of the windMapTexture.
	var windTexWidth = this.windMapTexture.imageWidth;
	var windTexHeight = this.windMapTexture.imageHeight;
	
	if (this.framebuffer === undefined)
	{ this.framebuffer = gl.createFramebuffer(); }
	
	// bind framebuffer.
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	// attach the texture to the framebuffer.
	gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.windMapTexture.texId, 0);
	var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
	if (canRead)
	{ 
		// 1rst, check if the geoCoord is inside of this windLayer range.
		if (!this.geoExtent.intersects2dWithGeoCoord(startGeoCoord))
		{ return resultGeoCoordsArray; }
	
		//var geoCoord = new GeographicCoord(126.40310387701689, 33.34144078912163, altitude);
		if (resultGeoCoordsArray === undefined)
		{ resultGeoCoordsArray = []; }
	
		if (!startGeoCoord.attributes)
		{ startGeoCoord.attributes = {}; }
			
		startGeoCoord.attributes.windSpeed = 0;
		resultGeoCoordsArray.push(startGeoCoord); // push the 1rst geoCoord.

		// Calculate the texCoord of the "geoCoord".
		var currLon = startGeoCoord.getLongitudeRad();
		var currLat = startGeoCoord.getLatitudeRad();
		
		var texWidth = this.windMapTexture.imageWidth;
		var texHeight = this.windMapTexture.imageHeight;
		
		var speedFactor = 2.0*0.0000001;
		var numPoints = 20;
		
		if (options)
		{
			if (options.speedFactor !== undefined)
			{ speedFactor = options.speedFactor; }
			
			if (options.numPoints !== undefined)
			{ numPoints = options.numPoints; }
		}
		
		// Create a lineString with numPoints.***
		for (var i=0; i<numPoints; i++)
		{
			var pixelX = Math.floor((currLon - minLonRad)/lonRadRange*texWidth);
			var pixelY = Math.floor((currLat - minLatRad)/latRadRange*texHeight);
			var velocity2d = this.getVelocityVector2d(pixelX, pixelY, undefined, magoManager); 
			var speed = velocity2d.getModul() / windSpeedMax.getModul();
			
			// calculate currLon & currLat.
			var distortion = Math.cos((minLatRad + currLat * latRadRange ));
			var offset = new Point2D(velocity2d.x / distortion*speedFactor, velocity2d.y*speedFactor);
			currLon += offset.x;
			currLat += offset.y;
			
			var currGeoCoord = new GeographicCoord(currLon*radToDeg, currLat*radToDeg, altitude);
			if (!currGeoCoord.attributes)
			{ currGeoCoord.attributes = {}; }
			
			currGeoCoord.attributes.windSpeed = speed;
			
			if (!this.geoExtent.intersects2dWithGeoCoord(currGeoCoord))
			{ return resultGeoCoordsArray; }
		
			resultGeoCoordsArray.push(currGeoCoord);
		}
	}
	
	// Unbind the framebuffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	return resultGeoCoordsArray;
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

	var windDisplayPlane = this.windDisplayPlane;
	
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
	
	// set modelViewProjectionMatrix.
	var mvpMat = magoManager.sceneState.modelViewProjMatrix;
	gl.uniformMatrix4fv(shader.ModelViewProjectionMatrix, false, mvpMat._floatArrays);
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
	
	var geoLocData = this.windDisplayPlane.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader);

	//FBO.bindAttribute(gl, this.particleIndexBuffer, shader.a_index, 1);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.particleIndexBuffer);
	gl.vertexAttribPointer(shader.a_index, 1, gl.FLOAT, false, 0, 0);
	gl.uniform1i(shader.u_colorScale, true);

	gl.uniform1i(shader.u_wind, 0);
	gl.uniform1i(shader.u_particles, 1);
	
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
	
	var minLonRad = this.geoExtent.getMinLongitudeRad();
	var minLatRad = this.geoExtent.getMinLatitudeRad();
	var maxLonRad = this.geoExtent.getMaxLongitudeRad();
	var maxLatRad = this.geoExtent.getMaxLatitudeRad();
	var minAlt = this.geoExtent.getMinAltitude();
	var maxAlt = this.geoExtent.getMaxAltitude();
	
	gl.uniform3fv(shader.u_geoCoordRadiansMax, [maxLonRad, maxLatRad, maxAlt]);
	gl.uniform3fv(shader.u_geoCoordRadiansMin, [minLonRad, minLatRad, minAlt]);
	
	gl.uniform3fv(shader.u_camPosWC, [camPos.x, camPos.y, camPos.z]);
	gl.uniform1f(shader.pendentPointSize, 20000.0);
	//gl.uniform1f(shader.pendentPointSize, 5000.0); // for all jeju island.
	//gl.uniform1f(shader.pendentPointSize, 3000.0); // jeju airport.
	//gl.uniform1f(shader.pendentPointSize, 1000.0); // jeju airport.
	//gl.uniform1f(shader.pendentPointSize, 80.0); // golfPark 1 hole.
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

WindLayer.prototype.renderWindScreen = function()
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
	//if (this.counterAux === undefined)
	//{ this.counterAux = 0; }
	
	//this.counterAux += 1;
	
	//if (this.counterAux < 8)
	//{ return; }

	//if (this.counterAux < 2)
	//{ return; }
	
	//this.counterAux = 0;
	
	var gl = magoManager.getGl();
	var layersToUpdateCount = 6;
	layersToUpdateCount = 1;
	var particlesPositionTexture = this.particlesPositionTexturesArray[this.particlesPositionTexturesArray.length-1];
	FBO.bindTexture(gl, particlesPositionTexture, 1);
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
	var camera = magoManager.sceneState.camera;
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
	
	var minLonRad = this.geoExtent.getMinLongitudeRad();
	var minLatRad = this.geoExtent.getMinLatitudeRad();
	var maxLonRad = this.geoExtent.getMaxLongitudeRad();
	var maxLatRad = this.geoExtent.getMaxLatitudeRad();
	
	gl.uniform3fv(program.u_geoCoordRadiansMax, [maxLonRad, maxLatRad, 16000.0]);
	gl.uniform3fv(program.u_geoCoordRadiansMin, [minLonRad, minLatRad, 0.0]);
	
	var visiblesCount = visibleTilesRanges.length/4;
	if (visiblesCount > 16)
	{ visiblesCount = 16; }
	var visibleTilesRangesFloat32 = new Float32Array(visibleTilesRanges);
	gl.uniform4fv(program.u_visibleTilesRanges, visibleTilesRangesFloat32);
	gl.uniform1i(program.u_visibleTilesRangesCount, visiblesCount);
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

































