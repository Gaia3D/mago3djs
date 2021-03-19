'use strict';

/**
 * F4D Lego 클래스
 * 아래 문서의 Table 2 (Overall Structure of LOD2 file) 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Lego
 * @constructor
 * 
 * 
 */
var Lego = function() 
{
	if (!(this instanceof Lego)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * This class is the container which holds the VBO Cache Keys.
	 * @type {VBOVertexIdxCacheKeysContainer}
	 */
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();

	/**
	 * lego file load state. Default is 0(READY)
	 * "READY"            : 0,
	 * "LOADING_STARTED"  : 1,
	 * "LOADING_FINISHED" : 2,
	 * "PARSE_STARTED"    : 3,
	 * "PARSE_FINISHED"   : 4,
	 * "IN_QUEUE"         : 5,
	 * "LOAD_FAILED"      : 6
	 * @type {Number}
	 */
	this.fileLoadState = CODE.fileLoadState.READY;

	/**
	 * lego bounding box
	 * @type {BoundingBox}
	 */
	this.bbox;

	/**
	 * lego data array buffer. parse가 끝난 후 undefined.
	 * @type {ArrayBuffer}
	 */
	this.dataArrayBuffer;

	/**
	 * lego data color. not used
	 * @deprecated
	 * @type {Color}
	 */
	this.selColor4;

	/**
	 * 텍스쳐 coord 유무
	 * @type {Boolean}
	 */
	this.hasTexCoords;

	/**
	 * 텍스쳐
	 * @type {Texture}
	 */
	this.texture;

	/**
	 * 텍스쳐 이름
	 * @type {String}
	 */
	this.textureName;

	/**
	 * lego key
	 * @type {String}
	 */
	this.legoKey;
	this.xhr;
	
	/**
	 * not use
	 * @deprecated
	 * @type {String}
	 */
	this.renderableType; // triangles, lines, points, etc.

	/**
	 * 칼라값 유무
	 * @type {Boolean}
	 */
	this.hasColors;

	/**
	 * blendAlpha
	 * @type {Number}
	 */
	this.blendAlpha = 0.0;

	/**
	 * birthTime
	 * @type {Date}
	 */
	this.birthTime;

	/**
	 * not use
	 * @deprecated
	 * @type {Boolean}
	 */
	this.isAdult = false;
	
	this.dataArrayBuffer;
	
};

/**
 * F4D Lego 자료를 읽어서 가져온 ArrayBuffer를 파싱.
 * 
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {ArrayBuffer} dataArraybuffer 
 * @param {MagoManager} magoManager 
 */
Lego.prototype.parseArrayBuffer = function(dataArraybuffer, magoManager)
{
	this.parseLegoData(dataArraybuffer, magoManager);
};

/**
 * BlendAlpha 반환
 * 
 * @param {Date} currTime not use
 * @returns {Number} always return 1.0
 */
Lego.prototype.getBlendAlpha = function(currTime) 
{
	return 1.0;
	/*
	if(!this.isAdult)
	{
		if(this.birthTime === undefined)
			this.birthTime = currTime;
		var increAlpha = (currTime - this.birthTime)*0.0001;
		this.blendAlpha += increAlpha;
		
		if(this.blendAlpha >= 1.0)
		{
			this.isAdult = true;
		}
	}
	else
		return 1.0;
	
	return this.blendAlpha;
	*/
};

/**
 * render할 준비가 됬는지 체크
 * @returns {Boolean} this.fileLoadState가 CODE.fileLoadState.PARSE_FINISHED(4)이거나 this.texture, this.texture.texId가 존재할때 true 반환
 */
Lego.prototype.isReadyToRender = function()
{
	if (this.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }
	
	if (this.texture === undefined || this.texture.texId === undefined) // In the future, a skin can has no texture. TODO:
	{ return false; }
	
	return true;
};

/**
 * lego 초기화. gl에서 해당 lego 삭제
 * 
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VboManager} vboMemManager 
 */
Lego.prototype.deleteObjects = function(gl, vboMemManager)
{
	/*
	if(this.xhr !== undefined)// && this.fileLoadState === CODE.fileLoadState.LOADING_STARTED)
	{
		this.xhr.abort();
		this.xhr = undefined;
	}
	*/
	
	if (this.vbo_vicks_container !== undefined)
	{
		this.vbo_vicks_container.deleteGlObjects(gl, vboMemManager);
		this.vbo_vicks_container = undefined;
	}
	this.fileLoadState = undefined;
	this.dataArrayBuffer = undefined;
	if (this.selColor4 !== undefined)
	{
		this.selColor4.deleteObjects();
		this.selColor4 = undefined;
	}
	
	this.textureName = undefined;
	if (this.texture)
	{
		this.texture.deleteObjects(gl);
	}
	this.texture = undefined;
	if (this.bbox)
	{
		this.bbox.deleteObjects();
	}
	this.bbox = undefined;
};

/**
 * F4D Lego 자료(point cloude data)를 읽어서 가져온 ArrayBuffer를 파싱.
 * vertex index cache key를 생성하여 담는다.
 * LOADING_FINISHED 상태일때 실행.
 * normal, texCoord는 없음
 * 
 * @param {ArrayBuffer} dataArraybuffer 
 * @param {WebGLRenderingContext} gl not use
 * @param {MagoManager} magoManager 
 */
Lego.prototype.parsePointsCloudData = function(buffer, gl, magoManager)
{
	// Provisional.
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)	{ return; }
	var stream = new DataStream(buffer, 0, DataStream.LITTLE_ENDIAN);
	
	var verticesCount = stream.readInt32();
	
	var vboMemManager = magoManager.vboMemoryManager;
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	this.bbox = new BoundingBox();
	var bbox = this.bbox;
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

	// BoundingBox in float values.
	bbox.minX = stream.readFloat32();
	bbox.minY = stream.readFloat32();
	bbox.minZ = stream.readFloat32();
	bbox.maxX = stream.readFloat32();
	bbox.maxY = stream.readFloat32();
	bbox.maxZ = stream.readFloat32();
	
	// positionsBuffer.
	// read bPositionsCompressed. If this var is true -> positions is in uShort).
	this.bPositionsCompressed = stream.readInt8();
	var posByteSize = verticesCount * 3;
	var positionBuffer;
	
	
	if (this.bPositionsCompressed)
	{
		vboCacheKey.setDataArrayPos(stream.readUint16Array(verticesCount * 3), vboMemManager);
	}
	else 
	{
		vboCacheKey.setDataArrayPos(stream.readFloat32Array(verticesCount * 3), vboMemManager);
	}

	// normals.
	this.hasNormals = stream.readInt8();
	if (this.hasNormals)
	{
		// todo:
	}
	
	// colors.
	this.hasColors = stream.readInt8();
	if (this.hasColors)
	{
		var numColors = verticesCount;
		vboCacheKey.setDataArrayCol(stream.readUint8Array(numColors * 4), vboMemManager);
	}
	
	// texCoords.
	this.hasTexCoords = stream.readInt8();
	if (this.hasTexCoords)
	{
		// todo:
	}
	
	// indices.
	this.hasIndices = stream.readInt8();
	if (this.hasIndices)
	{
		// todo:
	}
	
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

/**
 * Parse F4D lego data from worker result.
 * vertex index cache key를 생성하여 담는다.
 * LOADING_FINISHED 상태일때 실행.
 * 
 * @param {object} resultFromWorker 
 * @param {MagoManager} magoManager 
 */
Lego.prototype._parseLegoDataResultFromWorker = function (resultFromWorker, magoManager)
{
	var vboMemManager = magoManager.vboMemoryManager;
	var settings = magoManager._settings;
	var keepVboPositionDataArrayBuffers = settings.keepVboPositionDataArrayBuffers;

	if (this.vbo_vicks_container === undefined)
	{ 
		this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer(); 
	}

	this.bbox = new BoundingBox();
	var bbox = this.bbox;
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
	
	// BoundingBox.
	var boxSize = resultFromWorker.bboxSize;
	bbox.set(boxSize[0], boxSize[1], boxSize[2], boxSize[3], boxSize[4], boxSize[5]);

	// VBO(Position Buffer) - x,y,z
	vboCacheKey.setDataArrayPos(resultFromWorker.posDataArray, vboMemManager);
	
	if (keepVboPositionDataArrayBuffers)
	{
		vboCacheKey.vboBufferPos.bKeepDataArray = true;
	}
		
	// VBO(Normal Buffer) - i,j,k
	var hasNormals = resultFromWorker.norDataArray;
	if (hasNormals)
	{
		vboCacheKey.setDataArrayNor(resultFromWorker.norDataArray, vboMemManager);
	}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = resultFromWorker.colDataArray;
	if (hasColors)
	{
		vboCacheKey.setDataArrayCol(resultFromWorker.colDataArray, vboMemManager);
	}

	// VBO(TextureCoord Buffer) - u,v
	this.hasTexCoords = (resultFromWorker.texCoordsArray !== undefined);
	if (this.hasTexCoords)
	{
		vboCacheKey.setDataArrayTexCoord(resultFromWorker.texCoordsArray, vboMemManager);
	}
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;

	// Test debug:
	this.parsedFromWorker = true;
};

/**
 * F4D Lego 자료를 읽어서 가져온 ArrayBuffer를 파싱.
 * vertex index cache key를 생성하여 담는다.
 * LOADING_FINISHED 상태일때 실행.
 * 
 * @param {ArrayBuffer} dataArraybuffer 
 * @param {WebGLRenderingContext} gl not use
 * @param {MagoManager} magoManager 
 */
Lego.prototype.parseLegoData = function (buffer, magoManager, bytesReaded)
{
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	// Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.*** Old.***
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED && this.fileLoadState !== CODE.fileLoadState.IN_PARSE_QUEUE)	{ return; }
	
	if (buffer === undefined)
	{ buffer = this.dataArrayBuffer; }

	if (buffer === undefined)
	{ return bytesReaded; }
	
	var vboMemManager = magoManager.vboMemoryManager;
	var settings = magoManager._settings;
	var keepVboPositionDataArrayBuffers = settings.keepVboPositionDataArrayBuffers;
	
	if (bytesReaded === undefined)
	{ bytesReaded = 0; }

	if (this.vbo_vicks_container === undefined)
	{ 
		this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer(); 
	}

	//var stream = new DataStream(buffer, 0, DataStream.LITTLE_ENDIAN);
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	this.bbox = new BoundingBox();
	var bbox = this.bbox;
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
	
	// BoundingBox.
	bytesReaded = bbox.readData(buffer, bytesReaded);

	// VBO(Position Buffer) - x,y,z
	var numPositions = (new Int32Array(buffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	var byteSize = 4;
	var startBuff = bytesReaded;
	var endBuff = bytesReaded + byteSize * numPositions * 3;
	var posDataArray = new Float32Array(buffer.slice(startBuff, endBuff));
	vboCacheKey.setDataArrayPos(posDataArray, vboMemManager);
	bytesReaded = bytesReaded + byteSize * numPositions * 3; // updating data.
	
	if (keepVboPositionDataArrayBuffers)
	{
		vboCacheKey.vboBufferPos.bKeepDataArray = true;
	}
		
	// VBO(Normal Buffer) - i,j,k
	var hasNormals = (new Uint8Array(buffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasNormals)
	{
		var numNormals = (new Int32Array(buffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 1;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numNormals * 3;
		var norDataArray = new Int8Array(buffer.slice(startBuff, endBuff));
		vboCacheKey.setDataArrayNor(norDataArray, vboMemManager);
		bytesReaded = bytesReaded + byteSize * numNormals * 3; // updating data.
	}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = (new Uint8Array(buffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasColors)
	{
		var numColors = (new Int32Array(buffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 1;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numColors * 4;
		var colDataArray = new Uint8Array(buffer.slice(startBuff, endBuff));
		vboCacheKey.setDataArrayCol(colDataArray, vboMemManager);
		bytesReaded = bytesReaded + byteSize * numColors * 4; // updating data.
	}

	// VBO(TextureCoord Buffer) - u,v
	this.hasTexCoords = (new Uint8Array(buffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (this.hasTexCoords)
	{
		var dataType = (new Uint16Array(buffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		var numCoords = (new Uint32Array(buffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 4;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numCoords * 2;
		var texCoordDataArray = new Float32Array(buffer.slice(startBuff, endBuff));
		vboCacheKey.setDataArrayTexCoord(texCoordDataArray, vboMemManager);
		bytesReaded = bytesReaded + byteSize * numCoords * 2; // updating data.
	}

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	
	return bytesReaded;
};

/**
 */
Lego.prototype.makeStencilShadowMesh = function(lightDirectionLC)
{
	if (this.vbo_vicks_container === undefined)
	{ return; }
	
	this.shadowMeshesArray = [];
	
	var vboKeysCount = this.vbo_vicks_container.getVbosCount();
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboCacheKey = this.vbo_vicks_container.getVboKey(i);
		var shadowMaesh = Mesh.fromVbo(vboCacheKey);
		if (shadowMaesh !== undefined)
		{ this.shadowMeshesArray.push(shadowMaesh); }
	}
	
	return;
};

/**
 * F4D Lego 자료를 gl에 렌더
 * 
 * @param {MagoManager} magoManager
 * @param {Number} renderType
 * @param {Boolean} renderTexture
 * @param {PostFxShader} shader 
 */
Lego.prototype.renderStencilShadowMeshes = function(magoManager, renderType, renderTexture, shader, owner)
{
	
};

/**
 * F4D Lego 자료를 gl에 렌더
 * 
 * @param {MagoManager} magoManager
 * @param {Number} renderType
 * @param {Boolean} renderTexture
 * @param {PostFxShader} shader 
 */
Lego.prototype.render = function(magoManager, renderType, renderTexture, shader, owner)
{
	var rendered = false;
	var gl = magoManager.sceneState.gl;

	if (owner === undefined)
		{ return; }
	
	if (this.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return false;
	}
	
	// renderType = 0 -> depth render.
	// renderType = 1 -> normal render.
	// renderType = 2 -> colorSelection render.
	// renderType = 3 -> shadowMesh render.
	//--------------------------------------------
	if (renderType === 3)
	{
		var processCounterManager = magoManager.processCounterManager;
		if (this.shadowMeshesArray !== undefined)
		{
			// render the shadowMeshes.
			// render the shadowMeshes.
			
			var glPrimitive;
			var isSelected = false;
			var shadowMeshesCount = this.shadowMeshesArray.length;
			for (var i=0; i<shadowMeshesCount; i++)
			{
				var shadowMesh = this.shadowMeshesArray[i];
				shadowMesh.renderAsChild(magoManager, shader, renderType, glPrimitive, isSelected);
			}
		}
		else if (processCounterManager.shadowMeshesMadeCount === 0)
		{
			// make the shadow meshes.
			// Calculate sunDirLC.
			var nodeOwner = owner.nodeOwner;
			var geoLocDataManager = nodeOwner.data.geoLocDataManager;
			var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
			var sunSystem = magoManager.sceneState.sunSystem;
			var sunDirWC = sunSystem.getSunDirWC();
			var sunDirLC = geoLocData.getRotatedRelativeVector(sunDirWC, sunDirLC);
			this.makeStencilShadowMesh(sunDirLC);
			
			processCounterManager.shadowMeshesMadeCount ++;
		}

		return;
	}
	
	var vbo_vicky = this.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.

	var vertices_count = vbo_vicky.vertexCount;
	if (vertices_count === 0) 
	{
		return false;
	}

	if (renderType === 0 ) // depth or colorSelection.
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.enableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc);
		gl.uniform1i(shader.bHasTexture_loc , false); // textures like png with alpha component.***
		
		// 1) Position.
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		// 2) Normal.
		if(shader.normal3_loc >= 0) // check if shader has normal attributte.***
		{
			// There are depth renders that needs normal or not.
			// General depth render needs normals if MRT, but sunDepthOfView-shader no has normal attributtes.
			if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }
		}

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		rendered = true;
		
	}
	if (renderType === 2) // depth or colorSelection.
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc);
		gl.uniform1i(shader.bHasTexture_loc , false); // textures like png with alpha component.***
		
		// 1) Position.
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		rendered = true;
		
	}
	else if (renderType === 1) // color.
	{
		// Test external alpha.
		if (magoManager.isTrailRender === undefined || magoManager.isTrailRender === false) // check if mago is not rendering special effects.
		{
			var blendAlpha = this.getBlendAlpha(magoManager.currTime);
			gl.uniform1f(shader.externalAlpha_loc, blendAlpha);
		}
		// End test.---
	
		// 4) Texcoord.
		// Check if hasTexCoords.***

		if (renderTexture && vbo_vicky.vboBufferTCoord)
		{
			if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.texCoord2_loc);
			vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager);
			
			if (owner.isColorChanged || !vbo_vicky.vboBufferCol)
			{ 
				gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
				//return false; 
			}
			else 
			{
				gl.uniform1i(shader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.
			}
			
		}

		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
		{ return false; }
	
		if (renderTexture && vbo_vicky.vboBufferTCoord !== undefined)
		{
			shader.disableVertexAttribArray(shader.color4_loc); 
			
			if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
			{ return false; }
		}

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		
		// some stadistics.
		magoManager.sceneState.trianglesRenderedCount += vertices_count/3;
		
		
		rendered = true;
		shader.disableVertexAttribArray(shader.color4_loc);
	}
	
	return rendered;
};



















