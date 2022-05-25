'use strict';

/**
 * @class Voxelizer
 */
var Voxelizer = function(options) 
{
	if (!(this instanceof Voxelizer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.voxelXSize = 1024;
	this.voxelYSize = 1024;
	this.voxelZSize = 128;
	this.magoTexture3d;

	if (options !== undefined)
	{
		if (options.voxelXSize !== undefined)
		{
			this.voxelXSize = options.voxelXSize;
		}

		if (options.voxelYSize !== undefined)
		{
			this.voxelYSize = options.voxelYSize;
		}

		if (options.voxelZSize !== undefined)
		{
			this.voxelZSize = options.voxelZSize;
		}
	}
};

Voxelizer.prototype.makeMosaicTexture3DFromRealTexture3D = function (magoManager, realTex3d, resultMosaicTexture3d)
{
	// This function makes a mosaicTexture3D from a real texture3D.***
	var TEXTURE_MAX_SIZE = 16000;
	var gl = magoManager.getGl();
	var texWidth = realTex3d.texture3DXSize;
	var texHeight = realTex3d.texture3DYSize;
	var texNumSlices = realTex3d.texture3DZSize;

	if (!resultMosaicTexture3d)
	{
		var mosaicXCount = Math.floor( TEXTURE_MAX_SIZE/texWidth );
		var mosaicYCount = Math.floor( TEXTURE_MAX_SIZE/texHeight );

		// Now, must check if the (mosaicXCount X mosaicYCount) is lower than all subTextures needed(texNumSlices).***
		var totalSubTexCount = mosaicXCount * mosaicYCount;
		if (totalSubTexCount > texNumSlices)
		{
			// in this case, must adjust the "mosaicXCount" & "mosaicYCount" values, to save memory.***
			mosaicXCount = Math.ceil(Math.sqrt(texNumSlices));
			mosaicYCount = Math.ceil(texNumSlices / mosaicXCount);
		}

		var options = {
			texture3DXSize : texWidth,
			texture3DYSize : texHeight,
			texture3DZSize : texNumSlices,
			mosaicXCount   : mosaicXCount,
			mosaicYCount   : mosaicYCount

		};
		resultMosaicTexture3d = new MagoTexture3D(options);
		resultMosaicTexture3d.createTextures(gl);
	}

	// Now, need a FBO. The FBO texture size is : (mosaicXCount * texWidth) X (mosaicYCount * texHeight).***
	var fboTexSizeX = resultMosaicTexture3d.finalTextureXSize;
	var fboTexSizeY = resultMosaicTexture3d.finalTextureYSize;
	//var maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	// Check if the existent fbo width & height are coincident to "fboTexSizeX" & "fboTexSizeY". TODO :
	if (!this.fbo)
	{
		// Create a new framebuffer object.***
		var bufferWidth = fboTexSizeX;
		var bufferHeight = fboTexSizeY;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}

	// Now, bind fbo and render N times to fill all textures slices.***

	// 2n, make building depth over terrain depth.******************************************************************************************************
	var fbo = this.fbo;
	var extbuffers = fbo.extbuffers;
	var shader;
	
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.NONE, // gl_FragData[3]
		extbuffers.NONE, // gl_FragData[4]
		extbuffers.NONE, // gl_FragData[5]
		extbuffers.NONE, // gl_FragData[6]
		extbuffers.NONE, // gl_FragData[7]
	]);

	shader = magoManager.postFxShadersManager.getShader("copyTextureIntoMosaic");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();
	gl.uniform1i(shader.u_textureFlipYAxis_loc, false);

	// bind screenQuad positions.
	if (!this.screenQuad)
	{
		var posData = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]); // total screen.
		var webglposBuffer = FBO.createBuffer(gl, posData);

		this.screenQuad = {
			posBuffer: webglposBuffer
		};
	}
	FBO.bindAttribute(gl, this.screenQuad.posBuffer, shader.a_pos, 2);

	// Set the original Texture3D size.***
	gl.uniform1iv(shader.u_texSize_loc, [resultMosaicTexture3d.texture3DXSize, resultMosaicTexture3d.texture3DYSize, resultMosaicTexture3d.texture3DZSize]);

	// Set the mosaic texture3d size.***
	gl.uniform1iv(shader.u_mosaicTexSize_loc, [resultMosaicTexture3d.finalTextureXSize, resultMosaicTexture3d.finalTextureYSize, resultMosaicTexture3d.finalSlicesCount]);

	// Set the mosaic composition.***
	gl.uniform1iv(shader.u_mosaicSize_loc, [resultMosaicTexture3d.mosaicXCount, resultMosaicTexture3d.mosaicYCount, resultMosaicTexture3d.finalSlicesCount]);

	gl.disable(gl.DEPTH_TEST);

	var mosaicXCount = resultMosaicTexture3d.mosaicXCount;
	var mosaicYCount = resultMosaicTexture3d.mosaicYCount;
	var unitaryXRange = 1.0 / mosaicXCount;
	var unitaryYRange = 1.0 / mosaicYCount;

	var texCountForMosaicTexture = mosaicXCount * mosaicYCount;

	var finalSlicesCount = resultMosaicTexture3d.finalSlicesCount;
	for (var i=0; i<finalSlicesCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, resultMosaicTexture3d.getTexture( i ), 0);

		//gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  i*8);
		// for each mosaicTextureSlice, must render col * row times.***
		for (var c = 0; c<mosaicYCount; c++)
		{
			for (var r = 0; r<mosaicXCount; r++)
			{
				// calculate the coord of the screenQuad.***
				var minX = c * unitaryXRange;
				var minY = r * unitaryYRange;
				var maxX = minX + unitaryXRange;
				var maxY = minY + unitaryYRange;

				var posData = new Float32Array([minX, minY,   maxX, minY,   minX, maxY,   minX, maxY,   maxX, minY,   maxX, maxY]); // total screen.
				var texcoordData = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]);
				var webglposBuffer = FBO.createBuffer(gl, posData);
				var webgltexcoordBuffer = FBO.createBuffer(gl, texcoordData);
				FBO.bindAttribute(gl, webglposBuffer, shader.a_pos_loc, 2);
				FBO.bindAttribute(gl, webgltexcoordBuffer, shader.a_texcoord_loc, 2);

				// bind the texture.***
				var texIdx = (texCountForMosaicTexture * i) + r * mosaicXCount + c;
				var tex = realTex3d.getTexture(texIdx);
				gl.activeTexture(gl.TEXTURE0); 
				gl.bindTexture(gl.TEXTURE_2D, tex);

				// Draw screenQuad:
				gl.drawArrays(gl.TRIANGLES, 0, 6);
			}
		}
	}

	fbo.unbind();
	gl.enable(gl.DEPTH_TEST);
	

	return resultMosaicTexture3d;
};

Voxelizer.prototype.renderToMagoTexture3D = function (soundManager, magoTex3d, geoExtent, modelViewProjMatrix, renderablesArray)
{
	// Here rnders Ortographiclly.***
	// Note : the "magoTex3d" is a real texture3D, not a mosaic texture3d.***
	// ----------------------------------------------------------------------
	var magoManager = soundManager.magoManager;
	var gl = magoManager.getGl();

	if (!this.fboRealTex3d)
	{
		// Create a new framebuffer object.***
		var bufferWidth = magoTex3d.finalTextureXSize;
		var bufferHeight = magoTex3d.finalTextureYSize;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fboRealTex3d = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}
	
	var fbo = this.fboRealTex3d;
	var extbuffers = fbo.extbuffers;
	var shader;
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
		extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[4]
		extbuffers.COLOR_ATTACHMENT5_WEBGL, // gl_FragData[5]
		extbuffers.COLOR_ATTACHMENT6_WEBGL, // gl_FragData[6]
		extbuffers.COLOR_ATTACHMENT7_WEBGL, // gl_FragData[7]
	]);

	shader = magoManager.postFxShadersManager.getShader("renderOrthogonalToMagoTexture3D");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	gl.uniformMatrix4fv(shader.u_modelViewProjectionMatrix_loc, false, modelViewProjMatrix._floatArrays);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform4fv(shader.u_color4_loc, [1.0, 0.0, 0.0, 1.0]); //.***
	//gl.uniform2fv(shader.u_heightMap_MinMax_loc, [geoExtent.minGeographicCoord.altitude, geoExtent.maxGeographicCoord.altitude]);
	//gl.uniform2fv(shader.u_simulationTextureSize_loc, [magoTex3d.finalTextureXSize, magoTex3d.finalTextureYSize]);
	gl.uniform1iv(shader.u_texSize_loc, [magoTex3d.texture3DXSize, magoTex3d.texture3DYSize, magoTex3d.texture3DZSize]);
	gl.uniform1f(shader.u_airMaxPressure_loc, soundManager.airMaxPressure);
	gl.uniform1f(shader.u_currAirPressure_loc, 0.8);
	
	gl.disable(gl.CULL_FACE);
	gl.disable(gl.DEPTH_TEST);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null); 
	gl.frontFace(gl.CCW);

	var finalSlicesCount = magoTex3d.finalSlicesCount;
	var rendersCount = Math.ceil(finalSlicesCount / 8);
	for (var i=0; i<rendersCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 0 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 1 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 2 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 3 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 4 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 5 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 6 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, magoTex3d.getTexture( i*8 + 7 ), 0);

		gl.uniform1i(shader.u_lowestTex3DSliceIndex_loc,  i*8);

		var renderablesCount = renderablesArray.length;
		for (var j=0; j<renderablesCount; j++)
		{
			var renderable = renderablesArray[j];

			// check if the renderable is geographicCoord class.***
			if (renderable instanceof GeographicCoord)
			{
				renderable.renderPoint(magoManager, shader, gl);
			}
		}
	}

	for (var i=0; i<8; i++)
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL+i, gl.TEXTURE_2D, null, 0);
	}

	fbo.unbind();
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	this.fboRealTex3d.deleteObjects(gl);
	this.fboRealTex3d = undefined;
};

Voxelizer.prototype.voxelizeByDepthTexture = function (magoManager, depthTex, texWidth, texHeight, texNumSlices, resultDepthTex3D)
{
	// In this case, use the depth texture to make the magoTexture3D.***
	// 1rst, create the texture3d.***
	// Note : the webgl max texture size is 16000 x 16000, so, must find the mosaicX, mosaicY.***
	// So : texWidth x mosaicXCount <= 16000 && texHeight x mosaicYCount <= 16000.
	//
	//       Sample of a slice of the mosaic texture.***
	//
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_15  |   tex_16  |   tex_17  |   tex_18  |   tex_19  |        
	//      |           |           |           |           |           |     
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_10  |   tex_11  |   tex_12  |   tex_13  |   tex_14  |         
	//      |           |           |           |           |           |     
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_5   |   tex_6   |   tex_7   |   tex_8   |   tex_9   |          
	//      |           |           |           |           |           |     
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   |   tex_4   |           
	//      |           |           |           |           |           |  
	//      +-----------+-----------+-----------+-----------+-----------+   
	//
	
	var TEXTURE_MAX_SIZE = 16000;
	var gl = magoManager.getGl();
	if (!resultDepthTex3D)
	{
		var mosaicXCount = Math.floor( TEXTURE_MAX_SIZE/texWidth );
		var mosaicYCount = Math.floor( TEXTURE_MAX_SIZE/texHeight );

		// Now, must check if the (mosaicXCount X mosaicYCount) is lower than all subTextures needed(texNumSlices).***
		var totalSubTexCount = mosaicXCount * mosaicYCount;
		if (totalSubTexCount > texNumSlices)
		{
			// in this case, must adjust the "mosaicXCount" & "mosaicYCount" values, to save memory.***
			mosaicXCount = Math.ceil(Math.sqrt(texNumSlices));
			mosaicYCount = Math.ceil(texNumSlices / mosaicXCount);
		}

		var options = {
			texture3DXSize : texWidth,
			texture3DYSize : texHeight,
			texture3DZSize : texNumSlices,
			mosaicXCount   : mosaicXCount,
			mosaicYCount   : mosaicYCount

		};
		resultDepthTex3D = new MagoTexture3D(options);
		resultDepthTex3D.createTextures(gl);
	}

	// Now, need a FBO. The FBO texture size is : (mosaicXCount * texWidth) X (mosaicYCount * texHeight).***
	var fboTexSizeX = resultDepthTex3D.finalTextureXSize;
	var fboTexSizeY = resultDepthTex3D.finalTextureYSize;
	//var maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	if (!this.fbo)
	{
		// Create a new framebuffer object.***
		var bufferWidth = fboTexSizeX;
		var bufferHeight = fboTexSizeY;
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

		this.fbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 8}); 
	}

	// Now, bind fbo and render N times to fill all textures slices.***

	// 2n, make building depth over terrain depth.******************************************************************************************************
	var fbo = this.fbo;
	var extbuffers = fbo.extbuffers;
	var shader;
	
	fbo.bind();
	gl.viewport(0, 0, fbo.width[0], fbo.height[0]);
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
		extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[4]
		extbuffers.COLOR_ATTACHMENT5_WEBGL, // gl_FragData[5]
		extbuffers.COLOR_ATTACHMENT6_WEBGL, // gl_FragData[6]
		extbuffers.COLOR_ATTACHMENT7_WEBGL, // gl_FragData[7]
	]);

	shader = magoManager.postFxShadersManager.getShader("voxelize");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();
	gl.uniform1i(shader.u_textureFlipYAxis_loc, false);

	// bind the depth texture:
	gl.activeTexture(gl.TEXTURE0); 
	gl.bindTexture(gl.TEXTURE_2D, depthTex.texId);

	// bind screenQuad positions.
	if (!this.screenQuad)
	{
		var posData = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]); // total screen.
		var webglposBuffer = FBO.createBuffer(gl, posData);

		this.screenQuad = {
			posBuffer: webglposBuffer
		};
	}
	FBO.bindAttribute(gl, this.screenQuad.posBuffer, shader.a_pos, 2);

	// Set the original Texture3D size.***
	gl.uniform1iv(shader.u_texSize_loc, [resultDepthTex3D.texture3DXSize, resultDepthTex3D.texture3DYSize, resultDepthTex3D.texture3DZSize]);

	// Set the mosaic texture3d size.***
	gl.uniform1iv(shader.u_mosaicTexSize_loc, [resultDepthTex3D.finalTextureXSize, resultDepthTex3D.finalTextureYSize, resultDepthTex3D.finalSlicesCount]);

	// Set the mosaic composition.***
	gl.uniform1iv(shader.u_mosaicSize_loc, [resultDepthTex3D.mosaicXCount, resultDepthTex3D.mosaicYCount, resultDepthTex3D.finalSlicesCount]);

	gl.disable(gl.DEPTH_TEST);

	var finalSlicesCount = resultDepthTex3D.finalSlicesCount;
	var rendersCount = Math.ceil(finalSlicesCount / 8);
	for (var i=0; i<rendersCount; i++)
	{
		// Bind the 8 output textures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 0 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 1 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 2 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 3 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 4 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 5 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT6_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 6 ), 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT7_WEBGL, gl.TEXTURE_2D, resultDepthTex3D.getTexture( i*8 + 7 ), 0);

		gl.uniform1i(shader.u_lowestMosaicSliceIndex_loc,  i*8);

		// Draw screenQuad:
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	for (var i=0; i<8; i++)
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL+i, gl.TEXTURE_2D, null, 0);
	}

	fbo.unbind();
	gl.enable(gl.DEPTH_TEST);
	

	return resultDepthTex3D;
};