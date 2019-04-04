'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class CurrentObjectsRendering
 */
var CurrentObjectsRendering = function() 
{
	if (!(this instanceof CurrentObjectsRendering)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// General objects rendering, as currNode, currBuilding, currOctree, currRefObject.***
	this.curNode = undefined;
	this.curBuilding = undefined;
	this.curOctree = undefined;
	this.curObject = undefined;
};

// Renderer.***************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @class Renderer
 */
var Renderer = function() 
{
	if (!(this instanceof Renderer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.currentObjectsRendering = new CurrentObjectsRendering();
	this.renderNormals = true;
	this.renderTexture = true;

	this.vbo_vi_cacheKey_aux;
	this.byteColorAux = new ByteColor();

	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***

	this.currentTimeSC;
	this.dateSC;
	this.startTimeSC;
	this.simpObj_scratch;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
 
Renderer.prototype.renderVboContainer = function(gl, vboContainer, magoManager, shader, renderWireframe) 
{
	if (vboContainer === undefined)
	{ return; }
	
	var cacheKeys_count = vboContainer.vboCacheKeysArray.length;
	// Must applicate the transformMatrix of the reference object.***
	
	var indicesCount;

	for (var n=0; n<cacheKeys_count; n++) // Original.***
	{
		//var mesh_array = block.viArraysContainer._meshArrays[n];
		this.vbo_vi_cacheKey_aux = vboContainer.vboCacheKeysArray[n];
		
		if (!this.vbo_vi_cacheKey_aux.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		if (!this.vbo_vi_cacheKey_aux.bindDataNormal(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		if (!this.vbo_vi_cacheKey_aux.bindDataIndice(shader, magoManager.vboMemoryManager))
		{ return false; }

		/*
		if (shader.texCoord2_loc !== -1 && this.renderTexture) 
		{
			if (!this.vbo_vi_cacheKey_aux.isReadyTexCoords(gl, magoManager.vboMemoryManager))
			{ continue; }

			gl.enableVertexAttribArray(shader.texCoord2_loc);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshTexcoordsCacheKey);
			gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		}
		else 
		{
			if (shader.texCoord2_loc !== -1) { gl.disableVertexAttribArray(shader.texCoord2_loc); }
		}
		*/

		// Indices.***
		if (magoManager.isCameraMoving)
		{
			indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
		}
		else
		{
			indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
		}
		
		if (renderWireframe)
		{
			gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***

		}
		else 
		{
			gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
		}
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
 
Renderer.prototype.renderVbo = function(gl, shader, vboPosKey, vboNorKey, vboColKey, vboTexCoordKey, vboIdxKey) 
{
	if (vboPosKey !== shader.last_vboPos_binded)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		shader.last_vboPos_binded = vboKey.meshVertexCacheKey;
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Renderer.prototype.renderNodes = function(gl, visibleNodesArray, magoManager, shader, renderTexture, renderType, maxSizeToRender, refMatrixIdxKey) 
{
	var node;
	var rootNode;
	var geoLocDataManager;
	var neoBuilding;
	var minSize = 0.0;
	var lowestOctreesCount;
	var lowestOctree;
	var isInterior = false; // no used.***
	
	// set webgl options.
	gl.enable(gl.DEPTH_TEST);
	if (MagoConfig.getPolicy().geo_cull_face_enable === "true") 
	{
		gl.enable(gl.CULL_FACE);
	}
	else 
	{
		gl.disable(gl.CULL_FACE);
	}

	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	
	if (renderType === 2)
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
	}
	if (renderType === 0)
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		shader.disableVertexAttribArray(shader.normal3_loc);
		shader.disableVertexAttribArray(shader.color4_loc);
	}
	
	var flipYTexCoord = false;
	
	// do render.
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		node.renderContent(magoManager, shader, renderType, refMatrixIdxKey);
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderPCloud = function(gl, pCloud, magoManager, shader, ssao_idx, distToCam, lod) 
{
	// Note: "pCloud" is "Lego" class.***
	if (pCloud.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	gl.frontFace(gl.CCW);
	
	var vbo_vicky = pCloud.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
	var vertices_count = vbo_vicky.vertexCount;
	
	if (vertices_count === 0) 
	{ return; }
	
	shader.disableVertexAttribArray(shader.color4_loc);
	shader.disableVertexAttribArray(shader.normal3_loc); // provisionally has no normals.***
	shader.disableVertexAttribArray(shader.texCoord2_loc);

	if (ssao_idx === 0) // depth.***
	{
		// 1) Position.*********************************************
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		gl.drawArrays(gl.POINTS, 0, vertices_count);
	}
	else if (ssao_idx === 1) // ssao.***
	{
		if (magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
		{
			vertices_count = Math.floor(vertices_count/5);
			if (vertices_count === 0)
			{ return; } 
		}
		/*
		if (distToCam < 80)
		{
			// Render all points.***
		}
		else if (distToCam < 200)
		{
			vertices_count = Math.floor(vertices_count/8);
		}
		else if (distToCam < 400)
		{
			vertices_count = Math.floor(vertices_count/16);
		}
		else if (distToCam < 800)
		{
			vertices_count = Math.floor(vertices_count/32);
		}
		else if (distToCam < 1600)
		{
			vertices_count = Math.floor(vertices_count/64);
		}
		else
		{
			vertices_count = Math.floor(vertices_count/128);
		}
		*/
		
		
		
		if (distToCam < 100)
		{
			// Render all points.***
		}
		else if (distToCam < 200)
		{
			vertices_count = Math.floor(vertices_count/4);
		}
		else if (distToCam < 400)
		{
			vertices_count = Math.floor(vertices_count/8);
		}
		else if (distToCam < 800)
		{
			vertices_count = Math.floor(vertices_count/16);
		}
		else if (distToCam < 1600)
		{
			vertices_count = Math.floor(vertices_count/32);
		}
		else
		{
			vertices_count = Math.floor(vertices_count/64);
		}
		
		
		if (vertices_count <= 0)
		{ 
			return; 
		}

		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		gl.drawArrays(gl.POINTS, 0, vertices_count);
		
	}
	
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Renderer.prototype.renderNeoBuildingsPCloud = function(gl, visibleNodesArray, magoManager, shader, renderTexture, ssao_idx) 
{
	var node;
	var rootNode;
	var geoLocDataManager;
	var neoBuilding;
	var lowestOctreesCount;
	var lowestOctree;
	var lastExtureId;
	
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		
		rootNode = node.getRoot();
		geoLocDataManager = rootNode.data.geoLocDataManager;
		neoBuilding = node.data.neoBuilding;
		
		if (neoBuilding === undefined)
		{ continue; }
		
		if (neoBuilding.octree === undefined)
		{ continue; }

		var projectDataType = neoBuilding.metaData.projectDataType;
		
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		if (projectDataType !== undefined && projectDataType === 4)
		{
			// Old.***
			for (var j=0; j<lowestOctreesCount; j++) 
			{
				lowestOctree = allVisibles[j];

				if (lowestOctree.lego === undefined) 
				{
					lowestOctree.lego = new Lego();
					lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
					lowestOctree.lego.legoKey = lowestOctree.octreeKey + "_lego";
					continue;
				}
				
				if (lowestOctree.lego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
				{ continue; }

			
				// data compression.***
				var posCompressed = false;
				if (lowestOctree.lego.bPositionsCompressed !== undefined)
				{
					posCompressed = lowestOctree.lego.bPositionsCompressed;
				}
				gl.uniform1i(shader.bPositionCompressed_loc, posCompressed);
				
				// If data is compressed, then set uniforms.***
				//gl.uniform1i(shader.posDataByteSize_loc, 2);
				//gl.uniform1i(shader.texCoordByteSize_loc, 2);
				var bbox = lowestOctree.lego.bbox;
				gl.uniform3fv(shader.bboxSize_loc, [bbox.getXLength(), bbox.getYLength(), bbox.getZLength()]); //.***
				gl.uniform3fv(shader.minPosition_loc, [bbox.minX, bbox.minY, bbox.minZ]); //.***
				var lod = 2;
				var distToCam = lowestOctree.distToCamera;
				if (distToCam < 100)
				{ var hola = 0; }
				
				this.renderPCloud(gl, lowestOctree.lego, magoManager, shader, ssao_idx, distToCam, lod);

				gl.bindBuffer(gl.ARRAY_BUFFER, null);
			}
		}
		else if (projectDataType !== undefined && projectDataType === 5)
		{
			if (magoManager.myCameraRelative === undefined)
			{ magoManager.myCameraRelative = new Camera(); }

			var relativeCam = magoManager.myCameraRelative;
			relativeCam.frustum.copyParametersFrom(magoManager.myCameraSCX.bigFrustum);
			relativeCam = buildingGeoLocation.getTransformedRelativeCamera(magoManager.sceneState.camera, relativeCam);
			relativeCam.calculateFrustumsPlanes();
			var renderType = 1;// testing.***
			var bPrepareData = true;
			
			neoBuilding.octree.test__renderPCloud(magoManager, neoBuilding, renderType, shader, relativeCam, bPrepareData);
		}
	}
	
	shader.disableVertexAttribArrayAll();
};

Renderer.prototype.enableStencilBuffer = function(gl)
{
	// Active stencil if the object is selected.
	gl.enable(gl.STENCIL_TEST);
	
	gl.stencilFunc(gl.ALWAYS, 1, 1);
	// (stencil-fail: replace), (stencil-pass & depth-fail: replace), (stencil-pass & depth-pass: replace).***
	//gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
	gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
	gl.enable(gl.POLYGON_OFFSET_FILL);
};

Renderer.prototype.disableStencilBuffer = function(gl)
{
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
	gl.disable(gl.POLYGON_OFFSET_FILL);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param magoManager 변수
 * @param shader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderObject = function(gl, renderable, magoManager, shader, ssao_idx, bRenderLines, primitiveType)
{
	var vbo_vicks_container = renderable.getVboKeysContainer();
	
	if (vbo_vicks_container === undefined)
	{ return; }
	
	if (vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{ return; }
	

	if (bRenderLines === undefined)
	{ bRenderLines = false; }


	var vbosCount = vbo_vicks_container.getVbosCount();
	for (var i=0; i<vbosCount; i++)
	{
		// 1) Position.*********************************************
		var vbo_vicky = vbo_vicks_container.vboCacheKeysArray[i]; // there are only one.***

		var vertices_count = vbo_vicky.vertexCount;
		if (vertices_count === 0) 
		{ return; }

		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (ssao_idx === 1) // ssao.***
		{
			if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }

			if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
			{ return false; }
			
			// TexCoords todo:
		}
		
		if (bRenderLines === false)
		{
			if (vbo_vicky.indicesCount > 0)
			{
				if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
				{ return false; }

				gl.drawElements(gl.TRIANGLES, vbo_vicky.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
			}
			else 
			{
				gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
			}
		}
		else 
		{
			gl.drawArrays(gl.LINE_STRIP, 0, vertices_count);
			//gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		}
	}
};























