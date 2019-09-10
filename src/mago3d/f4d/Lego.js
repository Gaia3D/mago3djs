'use strict';

/**
 * F4D Lego 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @alias Lego
 * @class Lego
 * 
 * 아래 문서의 Table 2 (Overall Structure of LOD2 file) 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
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
 * F4D Lego 자료를 읽어서 가져온 ArrayBuffer를 파싱.
 * vertex index cache key를 생성하여 담는다.
 * LOADING_FINISHED 상태일때 실행.
 * 
 * @param {ArrayBuffer} dataArraybuffer 
 * @param {WebGLRenderingContext} gl not use
 * @param {MagoManager} magoManager 
 */
Lego.prototype.parseLegoData = function(buffer, magoManager, bytesReaded)
{
	if (this.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)	{ return; }
	
	var vboMemManager = magoManager.vboMemoryManager;
	
	if (bytesReaded === undefined)
	{ bytesReaded = 0; }

	//var stream = new DataStream(buffer, 0, DataStream.LITTLE_ENDIAN);
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;

	this.bbox = new BoundingBox();
	var bbox = this.bbox;
	var vboCacheKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();

	// BoundingBox.
	bytesReaded = bbox.readData(buffer, bytesReaded);
	//bbox.minX = stream.readFloat32();
	//bbox.minY = stream.readFloat32();
	//bbox.minZ = stream.readFloat32();
	//bbox.maxX = stream.readFloat32();
	//bbox.maxY = stream.readFloat32();
	//bbox.maxZ = stream.readFloat32();

	// VBO(Position Buffer) - x,y,z
	var numPositions = (new Int32Array(buffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	var byteSize = 4;
	var startBuff = bytesReaded;
	var endBuff = bytesReaded + byteSize * numPositions * 3;
	var posDataArray = new Float32Array(buffer.slice(startBuff, endBuff));
	vboCacheKey.setDataArrayPos(posDataArray, vboMemManager);
	bytesReaded = bytesReaded + byteSize * numPositions * 3; // updating data.
		
	//var numPositions = stream.readUint32();
	//var posDataArray = stream.readFloat32Array(numPositions * 3);
	//vboCacheKey.setDataArrayPos(posDataArray, vboMemManager);


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
	//var hasNormals = stream.readUint8();
	//if (hasNormals) 
	//{
	//	var numNormals = stream.readUint32();
	//	var norDataArray = stream.readInt8Array(numNormals * 3);
	//	vboCacheKey.setDataArrayNor(norDataArray, vboMemManager);
	//}

	// VBO(Color Buffer) - r,g,b,a
	var hasColors = (new Uint8Array(buffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	if (hasColors)
	{
		var numColors = (new Int32Array(buffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		byteSize = 1;
		startBuff = bytesReaded;
		endBuff = bytesReaded + byteSize * numColors * 4;
		var colDataArray = new Int8Array(buffer.slice(startBuff, endBuff));
		vboCacheKey.setDataArrayCol(colDataArray, vboMemManager);
		bytesReaded = bytesReaded + byteSize * numColors * 4; // updating data.
	}
	//var hasColors = stream.readUint8();
	//if (hasColors)
	//{
	//	var numColors = stream.readUint32();
	//	var colDataArray = stream.readUint8Array(numColors * 4);
	//	vboCacheKey.setDataArrayCol(colDataArray, vboMemManager);
	//}

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
	//this.hasTexCoords = stream.readUint8();
	//if (this.hasTexCoords)
	//{
	//	var dataType = stream.readUint16();
	//	var numCoords = stream.readUint32();
	//	var texCoordDataArray = stream.readFloat32Array(numCoords * 2);
	//	vboCacheKey.setDataArrayTexCoord(texCoordDataArray, vboMemManager);
	//}

	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	
	return bytesReaded;
};

/**
 * F4D Lego 자료를 gl에 렌더
 * 
 * @param {MagoManager} magoManager
 * @param {Number} renderType
 * @param {Boolean} renderTexture
 * @param {PostFxShader} shader 
 */
Lego.prototype.render = function(magoManager, renderType, renderTexture, shader)
{
	var rendered = false;
	var gl = magoManager.sceneState.gl;
	
	if (this.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return false;
	}
	gl.frontFace(gl.CCW);
	
	// renderType = 0 -> depth render.
	// renderType = 1 -> normal render.
	// renderType = 2 -> colorSelection render.
	//--------------------------------------------
	
	var vbo_vicky = this.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.

	var vertices_count = vbo_vicky.vertexCount;
	if (vertices_count === 0) 
	{
		return false;
	}

	if (renderType === 0 || renderType === 2) // depth or colorSelection.
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc);
		
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
		if (renderTexture)
		{
			if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			gl.uniform1i(shader.bUse1Color_loc, false);
			shader.disableVertexAttribArray(shader.texCoord2_loc);
		}

		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
		{ return false; }
	
		//if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
		//{ return false; }

		// TODO:
		//if (vbo_vicky.meshColorCacheKey !== undefined )
		//{
		//if(shader.color4_loc != -1)shader.enableVertexAttribArray(shader.color4_loc);
		//gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
		//gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
		//}
		
		if (renderTexture && vbo_vicky.vboBufferTCoord !== undefined)
		{
			// Provisionally flip tex coords here.
			if (magoManager.configInformation.geo_view_library === Constant.CESIUM)
			{ gl.uniform1i(shader.textureFlipYAxis_loc, false); }//.ppp
			else
			{ gl.uniform1i(shader.textureFlipYAxis_loc, true); }//.ppp
			//---------------------------------------------------------------------------
			
			shader.disableVertexAttribArray(shader.color4_loc); 
			
			if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
			{ return false; }
		}

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		
		
		rendered = true;
		shader.disableVertexAttribArray(shader.color4_loc);
	}
	
	return rendered;
};



















