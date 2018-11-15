'use strict';

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
	
	this.currentObjectsRendering = {};
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
Renderer.prototype.renderRenderables = function(gl, renderables, magoManager, shader, renderTexture, ssao_idx, maxSizeToRender, refMatrixIdxKey) 
{
	var node;
	var neoBuilding;
	var lod;
	var renderablesCount = renderables.length;
	for (var i=0; i<renderablesCount; i++)
	{
		node = renderables[i];
		neoBuilding = node.data.neoBuilding;
		lod = neoBuilding.currentLod;
		
		if (lod === 0)
		{
			
		}
	}
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
		if (!this.vbo_vi_cacheKey_aux.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ continue; }
	
		if (!this.vbo_vi_cacheKey_aux.isReadyNormals(gl, magoManager.vboMemoryManager))
		{ 
			// disable normals.***
			
		}
		
		if (!this.vbo_vi_cacheKey_aux.isReadyFaces(gl, magoManager.vboMemoryManager))
		{ 
			// disable indices.***
			
		}
		
		// Positions.***
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		//gl.vertexAttribPointer(shader.attribLocationCacheObj["position"], 3, gl.FLOAT, false,0,0);

		// Normals.***
		if (shader.normal3_loc !== -1 && this.renderNormals) 
		{
			gl.enableVertexAttribArray(shader.normal3_loc); 
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshNormalCacheKey);
			gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);
		}
		else 
		{
			gl.disableVertexAttribArray(shader.normal3_loc); 
		}

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

		// Indices.***
		if (magoManager.isCameraMoving)
		{
			indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
		}
		else
		{
			indicesCount = this.vbo_vi_cacheKey_aux.indicesCount;
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
		
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
Renderer.prototype.renderNodes = function(gl, visibleNodesArray, magoManager, shader, renderTexture, ssao_idx, maxSizeToRender, refMatrixIdxKey) 
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
	
	var flipYTexCoord = false;
	var renderType = ssao_idx;
	
	// do render.
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		node.renderContent(magoManager, renderType, refMatrixIdxKey);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Renderer.prototype.renderNeoBuildingsLOD2AsimetricVersion = function(gl, visibleNodesArray, magoManager, shader, renderTexture, ssao_idx) 
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
		
		if (neoBuilding.currentVisibleOctreesControler === undefined)
		{ continue; }
	
		lowestOctreesCount = neoBuilding.currentVisibleOctreesControler.currentVisibles2.length;
		if (lowestOctreesCount === 0)
		{ continue; }
		
		if (ssao_idx === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === neoBuilding)
		{
			// active stencil buffer to draw silhouette.***
			this.enableStencilBuffer(gl);
		}
		
		// check attributes of the project.************************************************
		var project = magoManager.hierarchyManager.getNodesMap(node.data.projectId);
		if (project.attributes !== undefined && project.attributes.specularLighting !== undefined && shader.bApplySpecularLighting_loc !== undefined)
		{
			var applySpecLighting = project.attributes.specularLighting;
			if (applySpecLighting)
			{ gl.uniform1i(shader.bApplySpecularLighting_loc, true); }
			else
			{ gl.uniform1i(shader.bApplySpecularLighting_loc, false); }
		}
		// end check attributes of the project.----------------------------------------
		
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

		for (var j=0; j<lowestOctreesCount; j++) 
		{
			lowestOctree = neoBuilding.currentVisibleOctreesControler.currentVisibles2[j];

			if (lowestOctree.lego === undefined) 
			{
				lowestOctree.lego = new Lego();
				lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
				lowestOctree.lego.legoKey = lowestOctree.octreeKey + "_lego";
				continue;
			}
			
			if (lowestOctree.lego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
			{ continue; }

			// if the building is highlighted, the use highlight oneColor4.*********************
			if (ssao_idx === 1)
			{
				if (neoBuilding.isHighLighted)
				{
					gl.uniform1i(shader.bUse1Color_loc, true);
					gl.uniform4fv(shader.oneColor4_loc, this.highLightColor4); //.***
				}
				else if (neoBuilding.isColorChanged)
				{
					gl.uniform1i(shader.bUse1Color_loc, true);
					gl.uniform4fv(shader.oneColor4_loc, [neoBuilding.aditionalColor.r, neoBuilding.aditionalColor.g, neoBuilding.aditionalColor.b, neoBuilding.aditionalColor.a]); //.***
				}
				else
				{
					gl.uniform1i(shader.bUse1Color_loc, false);
				}
				//----------------------------------------------------------------------------------
				renderTexture = true;
				if (neoBuilding.simpleBuilding3x3Texture !== undefined && neoBuilding.simpleBuilding3x3Texture.texId)
				{
					gl.enableVertexAttribArray(shader.texCoord2_loc);
					//gl.activeTexture(gl.TEXTURE2); 
					gl.uniform1i(shader.hasTexture_loc, true);
					if (lastExtureId !== neoBuilding.simpleBuilding3x3Texture.texId)
					{
						gl.bindTexture(gl.TEXTURE_2D, neoBuilding.simpleBuilding3x3Texture.texId);
						lastExtureId = neoBuilding.simpleBuilding3x3Texture.texId;
					}
				}
				else 
				{
					//continue;
					gl.uniform1i(shader.hasTexture_loc, false);
					gl.disableVertexAttribArray(shader.texCoord2_loc);
					renderTexture = false;
				}
			}
			
			// If data is compressed, then set uniforms.***
			//gl.uniform1i(shader.posDataByteSize_loc, 2);
			//gl.uniform1i(shader.texCoordByteSize_loc, 2);
			//var bbox = lowestOctree.lego.bbox;
			//gl.uniform3fv(shader.compressionMaxPoint_loc, [bbox.maxX, bbox.maxY, bbox.maxZ]); //.***
			//gl.uniform3fv(shader.compressionMinPoint_loc, [bbox.minX, bbox.minY, bbox.minZ]); //.***

			this.renderLodBuilding(gl, lowestOctree.lego, magoManager, shader, ssao_idx, renderTexture);
		}
		
		if (ssao_idx === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === neoBuilding)
		{
			// active stencil buffer to draw silhouette.***
			this.disableStencilBuffer(gl);
		}
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
Renderer.prototype.renderPCloud = function(gl, pCloud, magoManager, shader, ssao_idx, renderTexture, distToCam, lod, posCompressed) 
{
	if (pCloud.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	gl.frontFace(gl.CCW);
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	if (ssao_idx === 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = pCloud.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		if (!vbo_vicky.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ return; }

		var vertices_count = vbo_vicky.vertexCount;
		if (vertices_count === 0) 
		{
			return;
		}
		
		gl.disableVertexAttribArray(shader.color4_loc);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.UNSIGNED_SHORT, false, 0, 0);
		gl.drawArrays(gl.POINTS, 0, vertices_count);
	}
	else if (ssao_idx === 1) // ssao.***
	{
		var vbo_vicky = pCloud.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;

		if (vertices_count === 0) 
		{
			return;
		}
		
		if (!vbo_vicky.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ return; }
		
		//if (!vbo_vicky.isReadyNormals(gl, magoManager.vboMemoryManager))
		//{ return; }
		
		if (!vbo_vicky.isReadyColors(gl, magoManager.vboMemoryManager))
		{ return; }
		
		// 4) Texcoord.*********************************************
		/*
		if (renderTexture)
		{
			if (!vbo_vicky.isReadyTexCoords(gl, magoManager.vboMemoryManager))
			{ return; }
		}
		else 
		{
			gl.uniform1i(shader.bUse1Color_loc, false);
			gl.disableVertexAttribArray(shader.texCoord2_loc);
		}
		*/
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		if (posCompressed)
		{
			gl.vertexAttribPointer(shader.position3_loc, 3, gl.UNSIGNED_SHORT, false, 0, 0);
		}
		else 
		{
			gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		}

		//gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
		//gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);

		if (vbo_vicky.meshColorCacheKey !== undefined )
		{
			gl.enableVertexAttribArray(shader.color4_loc);
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
			gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
		}
		
		//if (renderTexture && vbo_vicky.meshTexcoordsCacheKey)
		//{
		//	gl.disableVertexAttribArray(shader.color4_loc);
		//	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshTexcoordsCacheKey);
		//	gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		//}
		if (magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
		{
			vertices_count = Math.floor(vertices_count/5);
			if (vertices_count === 0)
			{ return; }
		}
		
		if (distToCam < 100)
		{
			// do nothing.***
		}
		else if (distToCam < 200)
		{
			vertices_count = Math.floor(vertices_count/2);
			if (vertices_count === 0)
			{ return; }
		}
		else if (distToCam < 400)
		{
			vertices_count = Math.floor(vertices_count/4);
			if (vertices_count === 0)
			{ return; }
		}
		else if (distToCam < 800)
		{
			vertices_count = Math.floor(vertices_count/8);
			if (vertices_count === 0)
			{ return; }
		}
		else if (distToCam < 1600)
		{
			vertices_count = Math.floor(vertices_count/16);
			if (vertices_count === 0)
			{ return; }
		}
		else
		{
			vertices_count = Math.floor(vertices_count/32);
			if (vertices_count === 0)
			{ return; }
		}

		gl.drawArrays(gl.POINTS, 0, vertices_count);
		gl.disableVertexAttribArray(shader.color4_loc);
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
		
		if (neoBuilding.currentVisibleOctreesControler === undefined)
		{ continue; }
	
		lowestOctreesCount = neoBuilding.currentVisibleOctreesControler.currentVisibles2.length;
		if (lowestOctreesCount === 0)
		{ continue; }
		
		if (ssao_idx === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === neoBuilding)
		{
			// active stencil buffer to draw silhouette.***
			this.enableStencilBuffer(gl);
		}
		
		// check attributes of the project.************************************************
		var project = magoManager.hierarchyManager.getNodesMap(node.data.projectId);
		if (project.attributes !== undefined && project.attributes.specularLighting !== undefined && shader.bApplySpecularLighting_loc !== undefined)
		{
			//var applySpecLighting = project.attributes.specularLighting;
			//if (applySpecLighting)
			//{ gl.uniform1i(shader.bApplySpecularLighting_loc, true); }
			//else
			//{ gl.uniform1i(shader.bApplySpecularLighting_loc, false); }
		}
		// end check attributes of the project.----------------------------------------
		
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		

		for (var j=0; j<lowestOctreesCount; j++) 
		{
			lowestOctree = neoBuilding.currentVisibleOctreesControler.currentVisibles2[j];

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
			this.renderPCloud(gl, lowestOctree.lego, magoManager, shader, ssao_idx, renderTexture, distToCam, lod, posCompressed);
		}
		
		if (ssao_idx === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === neoBuilding)
		{
			// active stencil buffer to draw silhouette.***
			this.disableStencilBuffer(gl);
		}
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Renderer.prototype.renderNeoBuildingsLowLOD = function(gl, visibleNodesArray, magoManager, shader, renderTexture, ssao_idx) 
{
	var node;
	var rootNode;
	var geoLocDataManager;
	var neoBuilding;
	var lastExtureId;
	var skinLego;
	
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		rootNode = node.getRoot();
		geoLocDataManager = rootNode.data.geoLocDataManager;
		neoBuilding = node.data.neoBuilding;
		if (neoBuilding === undefined)
		{ continue; }
		
		skinLego = neoBuilding.getCurrentSkin();
		
		if (skinLego === undefined)
		{ continue; }
	
		if (skinLego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
		{ continue; }
	
		if (ssao_idx === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === neoBuilding)
		{
			// active stencil buffer to draw silhouette.***
			this.enableStencilBuffer(gl);
		}
		
		// check attributes of the project.************************************************
		var project = magoManager.hierarchyManager.getNodesMap(node.data.projectId);
		if (project.attributes !== undefined && project.attributes.specularLighting !== undefined && shader.bApplySpecularLighting_loc !== undefined)
		{
			var applySpecLighting = project.attributes.specularLighting;
			if (applySpecLighting)
			{ gl.uniform1i(shader.bApplySpecularLighting_loc, true); }
			else
			{ gl.uniform1i(shader.bApplySpecularLighting_loc, false); }
		}
		// end check attributes of the project.----------------------------------------
			
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

		//if (skinLego.dataArrayBuffer === undefined) 
		//{ continue; }

		// if the building is highlighted, the use highlight oneColor4.*********************
		if (ssao_idx === 1)
		{
			if (neoBuilding.isHighLighted)
			{
				gl.uniform1i(shader.bUse1Color_loc, true);
				gl.uniform4fv(shader.oneColor4_loc, this.highLightColor4); //.***
			}
			else if (neoBuilding.isColorChanged)
			{
				gl.uniform1i(shader.bUse1Color_loc, true);
				gl.uniform4fv(shader.oneColor4_loc, [neoBuilding.aditionalColor.r, neoBuilding.aditionalColor.g, neoBuilding.aditionalColor.b, neoBuilding.aditionalColor.a]); //.***
			}
			else
			{
				gl.uniform1i(shader.bUse1Color_loc, false);
			}
			//----------------------------------------------------------------------------------
			renderTexture = true;
			if (skinLego.texture !== undefined && skinLego.texture.texId)
			{
				gl.enableVertexAttribArray(shader.texCoord2_loc);
				//gl.activeTexture(gl.TEXTURE2); 
				gl.uniform1i(shader.hasTexture_loc, true);
				if (lastExtureId !== skinLego.texture.texId)
				{
					gl.bindTexture(gl.TEXTURE_2D, skinLego.texture.texId);
					lastExtureId = skinLego.texture.texId;
				}
			}
			else 
			{
				if (magoManager.textureAux_1x1 !== undefined)
				{
					gl.enableVertexAttribArray(shader.texCoord2_loc);
					//gl.activeTexture(gl.TEXTURE2); 
					gl.uniform1i(shader.hasTexture_loc, true);
					gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
					//gl.uniform1i(shader.hasTexture_loc, false);
					//gl.disableVertexAttribArray(shader.texCoord2_loc);
					//renderTexture = false;
				}
			}
		}
		
		// If data is compressed, then set uniforms.***
		//gl.uniform1i(shader.posDataByteSize_loc, 2);
		//gl.uniform1i(shader.texCoordByteSize_loc, 2);
		//var bbox = skinLego.bbox;
		//gl.uniform3fv(shader.compressionMaxPoint_loc, [bbox.maxX, bbox.maxY, bbox.maxZ]); //.***
		//gl.uniform3fv(shader.compressionMinPoint_loc, [bbox.minX, bbox.minY, bbox.minZ]); //.***

		this.renderLodBuilding(gl, skinLego, magoManager, shader, ssao_idx, renderTexture);
		skinLego = undefined;
		
		if (ssao_idx === 1 && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected === neoBuilding)
		{
			// active stencil buffer to draw silhouette.***
			this.disableStencilBuffer(gl);
		}
	}
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
	//gl.disable(gl.CULL_FACE);
};

Renderer.prototype.disableStencilBuffer = function(gl)
{
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
	gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.enable(gl.CULL_FACE);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReferencesMotherAndIndices instance of NeoReferencesMotherAndIndices.
  * @returns {boolean} returns if the neoReferencesMotherAndIndices is ready to render.
 */
Renderer.prototype.isReadyNeoRefList = function(neoReferencesMotherAndIndices) 
{
	if (neoReferencesMotherAndIndices === undefined)
	{ return false; }

	if(!neoReferencesMotherAndIndices.isReadyToRender())
	{ return false; }

	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference instance of NeoReference.
  * @returns {boolean} returns if the neoReference is ready to render.
 */
Renderer.prototype.isReadyNeoReference = function(neoReference, magoManager) 
{
	if (neoReference === undefined)
	{ return false; }
	
	if (neoReference.renderingFase === magoManager.renderingFase)
	{ return false; }

	if (neoReference.tMatrixAuxArray === undefined)
	{
		//neoReference.multiplyKeyTransformMatrix(refMatrixIdxKey, neoBuilding.geoLocationDataAux.rotMatrix);
		// we must collect all the neoReferences that has no tMatrixAuxArray and make it.***
		return false;
	}
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoReference instance of NeoReference.
  * @returns {boolean} returns if the neoReference is ready to render.
 */
Renderer.prototype.isReadyBlock = function(block, neoReference, magoManager, maxSizeToRender) 
{
	if (block === undefined)
	{ return false; }

	if (maxSizeToRender && (block.radius < maxSizeToRender))
	{ return false; }
	
	if (magoManager.isCameraMoving && block.radius < magoManager.smallObjectSize && magoManager.objectSelected !== neoReference)
	{ return false; }

	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param magoManager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 */
Renderer.prototype.renderNeoReferenceAsimetricVersionColorSelection = function(gl, neoReference, neoReferencesMotherAndIndices, neoBuilding, magoManager, standardShader, maxSizeToRender, refMatrixIdxKey, glPrimitive) 
{
	// Function used in "magoManager.renderGeometry()" for draw silhouette.***
	var cacheKeys_count;
	var block_idx;
	var block;

	block_idx = neoReference._block_idx;
	block = neoBuilding.motherBlocksArray[block_idx];

	if (!this.isReadyBlock(block, neoReference, magoManager, maxSizeToRender))
	{ return; }
	
	cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
	// Must applicate the transformMatrix of the reference object.***

	gl.uniform1i(standardShader.refMatrixType_loc, neoReference.refMatrixType);
	
	if (neoReference.refMatrixType === 1)
	{ gl.uniform3fv(standardShader.refTranslationVec_loc, neoReference.refTranslationVec); }
	else if (neoReference.refMatrixType === 2)
	{ gl.uniformMatrix4fv(standardShader.refMatrix_loc, false, neoReference.tMatrixAuxArray[refMatrixIdxKey]._floatArrays); }

	if (neoReference.moveVector !== undefined) 
	{
		gl.uniform1i(standardShader.hasAditionalMov_loc, true);
		gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***
	}
	else 
	{
		gl.uniform1i(standardShader.hasAditionalMov_loc, false);
		gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	}

	for (var n=0; n<cacheKeys_count; n++) // Original.***
	{
		//var mesh_array = block.viArraysContainer._meshArrays[n];
		this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];

		if (!this.vbo_vi_cacheKey_aux.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ continue; }
		
		if (!this.vbo_vi_cacheKey_aux.isReadyFaces(gl, magoManager.vboMemoryManager))
		{ continue; }

		// Positions.***
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshVertexCacheKey);
		gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false, 0, 0);

		// Indices.***
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.meshFacesCacheKey);
		gl.drawElements(glPrimitive, this.vbo_vi_cacheKey_aux.indicesCount, gl.UNSIGNED_SHORT, 0); 
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
Renderer.prototype.renderLodBuilding = function(gl, lodBuilding, magoManager, shader, ssao_idx, renderTexture) 
{
	if (lodBuilding.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	gl.frontFace(gl.CCW);
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	if (ssao_idx === 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		if (!vbo_vicky.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ return; }

		var vertices_count = vbo_vicky.vertexCount;
		if (vertices_count === 0) 
		{
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
	else if (ssao_idx === 1) // ssao.***
	{
		var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;

		if (vertices_count === 0) 
		{
			return;
		}
		
		if (!vbo_vicky.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ return; }
		
		if (!vbo_vicky.isReadyNormals(gl, magoManager.vboMemoryManager))
		{ return; }
		
		if (!renderTexture && !vbo_vicky.isReadyColors(gl, magoManager.vboMemoryManager))
		{ return; }
		
		// 4) Texcoord.*********************************************
		if (renderTexture)
		{
			if (!vbo_vicky.isReadyTexCoords(gl, magoManager.vboMemoryManager))
			{ return; }
		}
		else 
		{
			gl.uniform1i(shader.bUse1Color_loc, false);
			gl.disableVertexAttribArray(shader.texCoord2_loc);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
		gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);

		if (vbo_vicky.meshColorCacheKey !== undefined )
		{
			gl.enableVertexAttribArray(shader.color4_loc);
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
			gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
		}
		
		if (renderTexture && vbo_vicky.meshTexcoordsCacheKey)
		{
			gl.disableVertexAttribArray(shader.color4_loc);
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshTexcoordsCacheKey);
			gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
		}

		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		gl.disableVertexAttribArray(shader.color4_loc);
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
Renderer.prototype.renderLodBuildingColorSelection = function(gl, lodBuilding, magoManager, shader)
{
	if (lodBuilding.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	gl.frontFace(gl.CCW);

	// 1) Position.*********************************************
	var vbo_vicky = lodBuilding.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.***
	if (!vbo_vicky.isReadyPositions(gl, magoManager.vboMemoryManager))
	{ return; }

	var vertices_count = vbo_vicky.vertexCount;
	if (vertices_count === 0) 
	{
		return;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
	gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
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
	
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	if (bRenderLines === undefined)
	{ bRenderLines = false; }
	
	var vbosCount = vbo_vicks_container.getVbosCount();
	for (var i=0; i<vbosCount; i++)
	{
		// 1) Position.*********************************************
		var vbo_vicky = vbo_vicks_container.vboCacheKeysArray[i]; // there are only one.***
		if (!vbo_vicky.isReadyPositions(gl, magoManager.vboMemoryManager))
		{ return; }

		var vertices_count = vbo_vicky.vertexCount;
		if (vertices_count === 0) 
		{ return; }

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshVertexCacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);

		if (ssao_idx === 1) // ssao.***
		{
			if (!vbo_vicky.isReadyNormals(gl, magoManager.vboMemoryManager)) // do this optional. TODO.***
			{ 
				//return;
				gl.disableVertexAttribArray(shader.normal3_loc);
				gl.uniform1i(shader.bUseNormal_loc, false);
			}
			else 
			{
				gl.enableVertexAttribArray(shader.normal3_loc);
				gl.uniform1i(shader.bUseNormal_loc, true);
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshNormalCacheKey);
				gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);
			}
			
			if (!vbo_vicky.isReadyColors(gl, magoManager.vboMemoryManager)) // do this optional. TODO.***
			{ 
				gl.disableVertexAttribArray(shader.color4_loc);
			}
			else 
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.meshColorCacheKey);
				gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
			}
		}
		
		if (bRenderLines === false)
		{
			if (vbo_vicky.indicesCount > 0)
			{
				if (!vbo_vicky.isReadyFaces(gl, magoManager.vboMemoryManager)) 
				{ return; }
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_vicky.meshFacesCacheKey);
				gl.drawElements(gl.TRIANGLES, vbo_vicky.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
			}
			else 
			{
				gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
			}
		}
		else 
		{
			/*
			if (!vbo_vicky.isReadyFaces(gl, magoManager.vboMemoryManager)) 
				{ return; }
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_vicky.meshFacesCacheKey);
				gl.drawElements(gl.LINE_STRIP, vbo_vicky.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
				*/
			gl.drawArrays(gl.LINE_STRIP, 0, vertices_count);
		}
	}
};























