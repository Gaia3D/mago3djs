'use strict';

/**
 * @class WindLayer
 */
var WindLayer = function() 
{
	// Based on https://blog.mapbox.com/how-i-built-a-wind-map-with-webgl-b63022b5537f
	if (!(this instanceof WindLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.weatherStation;
	this.gl;
	
	this.windMapTexture; // uv encoded wind map.***
	
	this.screenTexture0;
	this.screenTexture1;
	this.screenTexWidth;
	this.screenTexHeight;
	
	// shader programs.***
	this.drawParticlesProgram; // render particles shader.***
	this.screenFadeProgram;
	this.updateParticlesProgram;
	this.drawRegionProgram; // no used yet.***
	
	this.quadBuffer;
	this.particlesPositionTexture0;
	this.particlesPositionTexture1;
	
	this.weatherEarth;
	
	this.fadeOpacity = 0.98; // how fast the particle trails fade on each frame
	this.speedFactor = 0.25; // how fast the particles move
	this.dropRate = 0.003; // how often the particles move to a random place
	this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed
	
	// Test values.****************************************************************************
	this.fadeOpacity = 0.995; // how fast the particle trails fade on each frame
	this.speedFactor = 0.10; // how fast the particles move
	this.dropRate = 0.003; // how often the particles move to a random place
	this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed
	// End test values.-----------------------------------------------------------------------
	
	this.numParticles;
	
	this.flipTexCoordsY_windMap = true;
};

WindLayer.prototype.init = function(gl, filePath_inServer, screenTexWidth, screenTexHeight)
{
	this.gl = gl;
	
	// provisionally load a default windMapTexture.***
	var geometryDataPath = this.weatherStation.provisional_geometryDataPath;
	if (filePath_inServer === undefined)
	{ filePath_inServer = geometryDataPath +"/volumRenderingTest/images/wind/2016112000.png"; }
	this.loadWindMapTexture(filePath_inServer);
	
	// screen textures.***
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
	this.drawParticlesProgram = Shader.createProgram(gl, vsSource, fsSource);
	
	vsSource = ShaderSource.quad_vert;
	fsSource = ShaderSource.screen_frag;
	this.screenFadeProgram = Shader.createProgram(gl, vsSource, fsSource);
	
	vsSource = ShaderSource.quad_vert;
	fsSource = ShaderSource.update_frag;
	this.updateParticlesProgram = Shader.createProgram(gl, vsSource, fsSource);
	
	//vsSource = ShaderSource.Test_QuadVS;
	//fsSource = ShaderSource.Test_QuadFS;
	//this.drawRegionProgram = Shader.createProgram(gl, vsSource, fsSource);
	
	// particles position textures.***
	this.numParticles = 65536;
	var particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(this.numParticles));
	this.numParticles = particleRes * particleRes;
	
	var particleState = new Uint8Array(this.numParticles * 4);
	for (var i = 0; i < particleState.length; i++) 
	{
		particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
	}
	// textures to hold the particle state for the current and the next frame
	this.particlesPositionTexture0 = Texture.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);
	this.particlesPositionTexture1 = Texture.createTexture(gl, gl.NEAREST, particleState, particleRes, particleRes);

	var particleIndices = new Float32Array(this.numParticles);
	for (var i = 0; i < this.numParticles; i++) { particleIndices[i] = i; }
	this.particleIndexBuffer = FBO.createBuffer(gl, particleIndices);
};

WindLayer.prototype.loadWindMapTexture = function(filePath)
{
	var gl = this.gl;
	this.windMapTexture = new Texture();
	this.windMapTexture.texId = gl.createTexture();
	ReaderWriter.loadImage(gl, filePath, this.windMapTexture);
	
	// load windaData json.***
	// todo:
	if (this.windData === undefined)
	{
		this.windData = {};
		/*
		this.windData.uMin = -21.32;
		this.windData.vMin = -21.57;
		this.windData.uMax = 26.8;
		this.windData.vMax = 21.42;
		this.windData.height = 180;
		this.windData.width = 360;
		*/
		
		this.windData.uMin = -27.0;
		this.windData.vMin = -21.57;
		this.windData.uMax = 26.8;
		this.windData.vMax = 28.42;
		this.windData.height = 1152;
		this.windData.width = 1536;
	}
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
	this.weatherEarth.makeMeshVirtually(lonSegments, latSegments, altitude);
	this.weatherEarth.makeVbo(magoManager.vboMemoryManager);
	
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
		
		// Test.**************************************************************************************************************
		var sceneState = magoManager.sceneState;
		var mvInv = sceneState.modelViewMatrixInv;
		var mvInv_loc = gl.getUniformLocation(shaderProgram, "modelViewMatrixInv");
		gl.uniformMatrix4fv(mvInv_loc, false, mvInv._floatArrays);
		var encodedCameraPositionMCHigh_loc = gl.getUniformLocation(shaderProgram, "encodedCameraPositionMCHigh");
		var encodedCameraPositionMCLow_loc = gl.getUniformLocation(shaderProgram, "encodedCameraPositionMCLow");
		gl.uniform3fv(encodedCameraPositionMCHigh_loc, sceneState.encodedCamPosHigh);
		gl.uniform3fv(encodedCameraPositionMCLow_loc, sceneState.encodedCamPosLow);
		
		var camera = magoManager.myCameraSCX;
		var frustum = camera.bigFrustum;
		var tanHalfFovy_loc = gl.getUniformLocation(shaderProgram, "tanHalfFovy");
		gl.uniform1f(tanHalfFovy_loc, frustum.tangentOfHalfFovy[0]);
		var far_loc = gl.getUniformLocation(shaderProgram, "far");
		gl.uniform1f(far_loc, frustum.far[0]);
		var aspectRatio_loc = gl.getUniformLocation(shaderProgram, "aspectRatio");
		gl.uniform1f(aspectRatio_loc, frustum.aspectRatio[0]);

		var diffuseTexWidth_loc = gl.getUniformLocation(shaderProgram, "diffuseTexWidth");
		var diffuseTexHeight_loc = gl.getUniformLocation(shaderProgram, "diffuseTexHeight");
		gl.uniform1f(diffuseTexWidth_loc, this.screenTexWidth);  
		gl.uniform1f(diffuseTexHeight_loc, this.screenTexHeight);
		
		// whole earth.***
		var maxLon_loc = gl.getUniformLocation(shaderProgram, "maxLon");
		var minLon_loc = gl.getUniformLocation(shaderProgram, "minLon");
		var maxLat_loc = gl.getUniformLocation(shaderProgram, "maxLat");
		var minLat_loc = gl.getUniformLocation(shaderProgram, "minLat");
		gl.uniform1f(maxLon_loc, 180.0);
		gl.uniform1f(minLon_loc, -180.0);
		gl.uniform1f(maxLat_loc, 90.0);
		gl.uniform1f(minLat_loc, -90.0);
		// End test.----------------------------------------------------------------------------------------------------------

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.screenTexture0);  
		//gl.bindTexture(gl.TEXTURE_2D, this.windMapTexture.texId);  
		//gl.bindTexture(gl.TEXTURE_2D, this.particleStateTexture0);  

		var vbo = this.weatherEarth.vboKeyContainer.vboCacheKeysArray[0];
		
		if (!vbo.isReadyTexCoords(gl, magoManager.vboMemoryManager))
		{ return; }
		if (!vbo.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ return; }
		if (!vbo.isReadyFaces(gl, magoManager.vboMemoryManager)) 
		{ return; }
	
		gl.enable(gl.BLEND);
		
		// Positions.***
		gl.enableVertexAttribArray(currentShader.position3_loc);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo.meshVertexCacheKey);
		gl.vertexAttribPointer(currentShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		
		// TexCoords.***
		gl.enableVertexAttribArray(currentShader.texCoord2_loc);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo.meshTexcoordsCacheKey);
		gl.vertexAttribPointer(currentShader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		
		// indices.***
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo.meshFacesCacheKey);
		gl.drawElements(gl.TRIANGLES, vbo.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
			
		//gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.disable(gl.BLEND);
		
	}
	
	//FBO.bindTexture(gl, this.windMapTexture.texId, 0);
	//FBO.bindTexture(gl, this.particlesPositionTexture0, 1);
	//this.renderWindScreen();	
	//this.updateParticlesPositions();
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

WindLayer.prototype.updateParticlesPositions = function() 
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

































