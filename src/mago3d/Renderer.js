'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var Renderer = function() {
	if(!(this instanceof Renderer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
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
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefLists = function(gl, neoRefList_array, neoBuilding, manager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;
	
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC;
	var timeControlCounter = 0;
	
	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	if(MagoConfig.getInformation().renderingConfg.cullFaceEnable) {
		gl.enable(gl.CULL_FACE);
	} else {
		gl.disable(gl.CULL_FACE);
	}
		
	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);
	
	var cacheKeys_count;
	var block_idx;
	var block;
	var current_tex_id;
	  
	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1)
			gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
	} else{
		gl.bindTexture(gl.TEXTURE_2D, manager.textureAux_1x1);
	}
	 
	var geometryDataPath = manager.readerWriter.geometryDataPath;
	  
	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;
		
		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;
		
		if(myBlocksList == undefined) continue;
		
		if(myBlocksList.fileLoadState == 2) {
			myBlocksList.parseArrayBuffer(gl, myBlocksList.dataArraybuffer, manager.readerWriter);
			continue;
		}
		
		if(myBlocksList.fileLoadState != 4) continue;
		
		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		if(manager.isCameraMoving)// && !isInterior && manager.isCameraInsideBuilding)
		{
			/*
			if(neoRefList._lodLevel == 1 || neoRefList._lodLevel == 2)
			{
				continue;
			}

			this.dateSC = new Date();
			this.currentTimeSC = this.dateSC.getTime();
			secondsUsed = this.currentTimeSC - this.startTimeSC;
			if(secondsUsed > 60)
			{
				//gl.disableVertexAttribArray(standardShader.normal3_loc);
				//gl.disableVertexAttribArray(standardShader.position3_loc);
				//gl.disableVertexAttribArray(standardShader.texCoord2_loc);
				return;
			}
			*/
		}

		for(var k=0; k<visibleIndices_count; k++) {
			//if(manager.isCameraMoving && isInterior && timeControlCounter == 0)
			if(manager.isCameraMoving && timeControlCounter == 0) {
				//if(j==4)return;
				
				//this.dateSC = new Date();
				//this.currentTimeSC = this.dateSC.getTime();
				//secondsUsed = this.currentTimeSC - this.startTimeSC;
				//if(secondsUsed > 600) // miliseconds.***
				{
					//gl.disableVertexAttribArray(standardShader.normal3_loc);
					//gl.disableVertexAttribArray(standardShader.position3_loc);
					//gl.disableVertexAttribArray(standardShader.texCoord2_loc);
					//return;
				}
			}
			var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			//var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined) {
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList.blocksArray.length) {
				continue;
			}
			block = myBlocksList.getBlock(block_idx);
			
			if(manager.isCameraMoving)// && !isInterior && manager.isCameraInsideBuilding)
			{
				if(block != null) {
					if(block.isSmallObj && manager.objectSelected != neoReference) continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined && neoReference.texture.tex_id == undefined) {
				if(manager.backGround_fileReadings_count > 10) continue;
				
				// 1rst, check if the texture is loaded.***
				var tex_id = neoBuilding.getTextureId(neoReference.texture);
				if(tex_id == undefined) {
					// Load the texture.***
					var filePath_inServer = geometryDataPath + "/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.texture_image_fileName;
					manager.readerWriter.readNeoReferenceTextureInServer(gl, filePath_inServer, neoReference.texture, neoBuilding, manager);
					manager.backGround_fileReadings_count ++;
					continue;
				} else {
					neoReference.texture.tex_id = tex_id;
				}
			}
				
			if(manager.objectSelected == neoReference) {
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
				gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
			} else {
				//if(neoReference.texture != undefined && renderTexture)
				if(renderTexture) {
					if(neoReference.hasTexture) {
						if(neoReference.texture != undefined) {
							if(neoReference.texture.tex_id != undefined) {
								gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
								if(current_tex_id != neoReference.texture.tex_id) {
									//gl.activeTexture(gl.TEXTURE2);
									gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.tex_id);
									current_tex_id = neoReference.texture.tex_id;
								
								}
							} else {
								continue;
							}
						} else {
							continue;
						}
					} else {
						// if there are no texture, then use a color.***
						if(ssao_idx == 1) {
							if(!neoReference.hasTexture) {
								if(neoReference.color4) {
									//if(neoReference.color4.a < 60)
									//	continue;
									
									gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
									gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
								}
							}
						}
					}
				} else {
					// if there are no texture, then use a color.***
					if(ssao_idx == 1)// real render.***
					{
						if(!neoReference.hasTexture) {
							if(neoReference.color4) {
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								//	continue;
								
								gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
								gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
							}
						}
					} else if(ssao_idx == 0) {
						if(neoReference.color4) {
							//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
							//	continue;
							
						}
					}
				}
			}
			
			// End checking textures loaded.------------------------------------------------------------------------------------

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null) {
					
				//ifc_entity = block.mIFCEntityType;
				//if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
				//	continue;
				
				//if(manager.isCameraMoving && block.isSmallObj)
				//	continue;
				
				cacheKeys_count = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***

				gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4.floatArrays);
					
				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
				}
				
				for(var n=0; n<cacheKeys_count; n++) // Original.***
				{
					//var mesh_array = block._vi_arrays_Container._meshArrays[n];
					this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray[n];
					
					//****************************************************************************************************AAA
					if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined) continue;
					
						this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.pos_vboDataArray = [];
						this.vbo_vi_cacheKey_aux.pos_vboDataArray = null;
						continue;
					}
						
					if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.nor_vboDataArray == undefined) continue;
					
						this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.nor_vboDataArray = [];
						this.vbo_vi_cacheKey_aux.nor_vboDataArray = null;
						continue;
					}
					
					if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined) continue;
					
						this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.indices_count = this.vbo_vi_cacheKey_aux.idx_vboDataArray.length;
						this.vbo_vi_cacheKey_aux.idx_vboDataArray = [];
						this.vbo_vi_cacheKey_aux.idx_vboDataArray = null;
						continue;
					}
						
					//if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
					//	continue;
					//----------------------------------------------------------------------------------------------------AAA
					
					// Positions.***
					gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
					gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false,0,0);
					
					// Normals.***
					if(standardShader.normal3_loc != -1)
					{
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
						gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true,0,0);
					}

					if(renderTexture && neoReference.hasTexture)
					{
						if(block.vertex_count <= neoReference.vertex_count)
						{
							gl.enableVertexAttribArray(standardShader.texCoord2_loc);
							gl.bindBuffer(gl.ARRAY_BUFFER, neoReference.MESH_TEXCOORD_cacheKey);
							gl.vertexAttribPointer(standardShader.texCoord2_loc, 2, gl.FLOAT, false,0,0);
						}
						else{
							if(standardShader.texCoord2_loc != -1)
								gl.disableVertexAttribArray(standardShader.texCoord2_loc);
						}
					}
					else{
						if(standardShader.texCoord2_loc != -1)
							gl.disableVertexAttribArray(standardShader.texCoord2_loc);
					}
					  
					// Indices.***
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
					gl.drawElements(gl.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, gl.UNSIGNED_SHORT, 0); // Fill.***
					//gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indices_count, gl.UNSIGNED_SHORT, 0); // Wireframe.***

				}
			}
			timeControlCounter++;
			if(timeControlCounter > 20) timeControlCounter = 0;
		}
	}
	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsColorSelection = function(gl, neoRefList_array, neoBuilding, manager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;
	
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC;
	var timeControlCounter = 0;
	
	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	gl.enable(gl.CULL_FACE);
	//gl.disable(gl.CULL_FACE);
	
	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);
	
	var cacheKeys_count;
	var block_idx;
	var block;
	
	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;
		
		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		for(var k=0; k<visibleIndices_count; k++) {
			//if(manager.isCameraMoving && isInterior && timeControlCounter == 0)
//			if(manager.isCameraMoving && timeControlCounter == 0) {
//			}
			var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			//var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined) {
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList.blocksArray.length) {
				continue;
			}
			block = myBlocksList.getBlock(block_idx);
			
			/*
			if(manager.isCameraMoving)// && !isInterior && manager.isCameraInsideBuilding)
			{
				if(block != null)
				{
					
					if(block.isSmallObj)
								continue;
							
				}
			}
			*/
			
			// Check if the texture is loaded.********************************************************************************
			/*
			if(neoReference.texture != undefined && neoReference.texture.tex_id == undefined)
			{
				if(manager.backGround_fileReadings_count > 10)
					continue;
				
				// 1rst, check if the texture is loaded.***
				var tex_id = neoBuilding.getTextureId(neoReference.texture);
				if(tex_id == undefined)
				{
					// Load the texture.***
					var filePath_inServer = "/F4D_GeometryData/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.texture_image_fileName;
					manager.readerWriter.readNeoReferenceTextureInServer(gl, filePath_inServer, neoReference.texture, neoBuilding, manager);
					manager.backGround_fileReadings_count ++;
					continue;
				}
				else{
					neoReference.texture.tex_id = tex_id;
				}
			}
			*/
				
			//if(neoReference.texture != undefined && renderTexture)
			
			if(neoReference.selColor4) {
				gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, neoReference.selColor4.a/255.0]);
			}
			else continue; // never enter here.***
			
			// End checking textures loaded.------------------------------------------------------------------------------------

			// ifc_space = 27, ifc_window = 26, ifc_plate = 14
			if(block != null) {

				cacheKeys_count = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray.length;
				// Must applicate the transformMatrix of the reference object.***
				gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4.floatArrays);
				
				if(neoReference.moveVector != undefined) {
					gl.uniform1i(standardShader.hasAditionalMov_loc, true);
					gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
				} else {
					gl.uniform1i(standardShader.hasAditionalMov_loc, false);
					gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
				}
				
				// for workers.**************************************************************************************************************************
				//vbo_ByteColorsCacheKeys_Container = neoBuilding._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
				// End for workers.----------------------------------------------------------------------------------------------------------------------
				for(var n=0; n<cacheKeys_count; n++) {
					//var mesh_array = block._vi_arrays_Container._meshArrays[n];
					this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray[n];
					
					if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined) continue;
					
						this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.pos_vboDataArray.length = 0;
						
						continue;
					}
					/*
					if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined)
					{
						if(this.vbo_vi_cacheKey_aux.nor_vboDataArray == undefined)
							continue;
					
						this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
						gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, gl.STATIC_DRAW);
						this.vbo_vi_cacheKey_aux.nor_vboDataArray.length = 0;
							continue;
					}
					*/
					if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined) {
						if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined) continue;
					
						this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = gl.createBuffer ();
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, gl.STATIC_DRAW);
						//this.vbo_vi_cacheKey_aux.indices_count = this.vbo_vi_cacheKey_aux.idx_vboDataArray.length;
						this.vbo_vi_cacheKey_aux.idx_vboDataArray = null;
						continue;
					}
					
					//if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
					//	continue;
					//----------------------------------------------------------------------------------------------------AAA
					
					// Positions.***
					gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
					gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false,0,0);
					
					// Normals.***
					/*
					//if(ssao_idx != -1)
					{
						gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
						gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true,0,0);
					}
					*/

					// Indices.***
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
					gl.drawElements(gl.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, gl.UNSIGNED_SHORT, 0); // Fill.***
					//gl.drawElements(gl.LINES, this.vbo_vi_cacheKey_aux.indices_count, gl.UNSIGNED_SHORT, 0); // Wireframe.***

				}
			}
			
			timeControlCounter++;
			if(timeControlCounter > 20) timeControlCounter = 0;
		}
	}
	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoBuilding 변수
 * @param manager 변수
 * @param imageLod 변수
 * @param shader 변수
 */
Renderer.prototype.renderNeoSimpleBuildingPostFxShader = function(gl, neoBuilding, manager, imageLod, shader) {
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	
	// check if has vbos.***
	if(simpBuild.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	//if(manager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	
	gl.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);

	//gl.activeTexture(gl.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***
	
	var skinTexture = simpBuild.texturesArray[0]; // provisionally take the 1rst.***
	
	gl.activeTexture(gl.TEXTURE2); // for diffuse texture.***
	if(imageLod == 3)
		gl.bindTexture(gl.TEXTURE_2D, skinTexture.textureId); // embedded image.***
	else if(imageLod == 0)
		gl.bindTexture(gl.TEXTURE_2D, skinTexture.textureId); // biggest image.***
	else if(imageLod == -1)
	{
		// dont bind texture.***
	}
	
	// now, check accesors.***
	var accesorsCount = simpBuild.accesors_array.length;
	var stride = 0;
	for(var i=0; i<accesorsCount; i++)
	{
		var accesor = simpBuild.accesors_array[i];
		
		var normalize_data = false;
		//var dataType = undefined;
		
		// Use accesor.data_ytpe. no use dataType.***
		if(accesor.data_ytpe == 5120)
		{
			//dataType = gl.BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5121)
		{
			//dataType = gl.UNSIGNED_BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5122)
		{
			//dataType = gl.SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5123)
		{
			//dataType = gl.UNSIGNED_SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5126)
		{
			//dataType = gl.FLOAT;
			normalize_data = false;
		}
		
		
		// 0= position, 1= normal, 2= color, 3= texcoord.***
		if(accesor.accesor_type == 0) // position.***
		{
			gl.enableVertexAttribArray(shader.position3_loc);
			//gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 
				stride = accesor.stride;		
		}
		else if(accesor.accesor_type == 1) // normal.***
		{
			gl.enableVertexAttribArray(shader.normal3_loc);
			//gl.vertexAttribPointer(shader.normal3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			gl.vertexAttribPointer(shader.normal3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 			
		}
		else if(accesor.accesor_type == 3) // texcoord.***
		{
			if(imageLod != -1)
			{
				gl.enableVertexAttribArray(shader.texCoord2_loc);
				//gl.vertexAttribPointer(shader.texCoord2_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
				gl.vertexAttribPointer(shader.texCoord2_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 
			}			
		}
	}
	
	var vbo_vicky = simpBuild.vbo_vicks_container._vbo_cacheKeysArray[0];
	if(vbo_vicky.MESH_VERTEX_cacheKey == null)
	{
		if(vbo_vicky.buffer.dataArray != undefined) //dataArray_byteLength > 0
		{
			vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.buffer.dataArray, gl.STATIC_DRAW);
			
			vbo_vicky.buffer.dataArray = undefined;
		}
	}
	
	//for(var i=0; i<simpObjs_count; i++)
	{
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = vbo_vicky.buffer.dataArray_byteLength / stride;
			//-------------------------------------------------------------------------------------------------------------------------------------
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			//gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false,20,0);
			//if(imageLod != -1)gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.UNSIGNED_SHORT, true,20,12);
			//gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true,20,16);
			
			gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoBuilding 변수
 * @param manager 변수
 * @param shader 변수
 */
Renderer.prototype.renderNeoSimpleBuildingDepthShader = function(gl, neoBuilding, manager, shader) {
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	
	// check if has vbos.***
	if(simpBuild.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}

	gl.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);

	//gl.activeTexture(gl.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***
	
	//gl.activeTexture(gl.TEXTURE2); // for diffuse texture.***
	
	// now, check accesors.***
	var accesorsCount = simpBuild.accesors_array.length;
	var stride = 0;
	for(var i=0; i<accesorsCount; i++)
	{
		var accesor = simpBuild.accesors_array[i];
		
		var normalize_data = false;
		//var dataType = undefined;
		
		// Use accesor.data_ytpe. no use dataType.***
		if(accesor.data_ytpe == 5120)
		{
			//dataType = gl.BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5121)
		{
			//dataType = gl.UNSIGNED_BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5122)
		{
			//dataType = gl.SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5123)
		{
			//dataType = gl.UNSIGNED_SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5126)
		{
			//dataType = gl.FLOAT;
			normalize_data = false;
		}
		
		// 0= position, 1= normal, 2= color, 3= texcoord.***
		if(accesor.accesor_type == 0) // position.***
		{
			gl.enableVertexAttribArray(shader.position3_loc);
			//gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			gl.vertexAttribPointer(shader.position3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 
				stride = accesor.stride;		
		}
	}

	var vbo_vicky = simpBuild.vbo_vicks_container._vbo_cacheKeysArray[0];
	if(vbo_vicky.MESH_VERTEX_cacheKey == null)
	{
		if(vbo_vicky.buffer.dataArray != undefined) //dataArray_byteLength > 0
		{
			vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.buffer.dataArray, gl.STATIC_DRAW);
			
			vbo_vicky.buffer.dataArray = undefined;
		}
	}
	
	//for(var i=0; i<simpObjs_count; i++)
	{
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = vbo_vicky.buffer.dataArray_byteLength / stride;
			//-------------------------------------------------------------------------------------------------------------------------------------
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param BR_Project 변수
 * @param manager 변수
 * @param imageLod 변수
 * @param shader 변수
 */
Renderer.prototype.renderSimpleBuildingV1PostFxShader = function(gl, BR_Project, manager, imageLod, shader) {
	var simpBuildV1 = BR_Project._simpleBuilding_v1;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	
	if(simpBuildV1._simpleObjects_array.length == 0)
	{
		return;
	}
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	//if(manager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	
	gl.uniform3fv(shader.buildingPosHIGH_loc, BR_Project.buildingPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, BR_Project.buildingPositionLOW);

	//gl.activeTexture(gl.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***
	
	
	gl.activeTexture(gl.TEXTURE2); // for diffuse texture.***
	if(imageLod == 3)
		gl.bindTexture(gl.TEXTURE_2D, simpBuildV1._simpleBuildingTexture); // embedded image.***
	else if(imageLod == 0)
		gl.bindTexture(gl.TEXTURE_2D, simpBuildV1._texture_0); // biggest image.***
	else if(imageLod == -1)
	{
		// dont bind texture.***
	}
	
	//gl.uniform1i(shaderProgram.samplerUniform, 0);
	
	// single interleaved buffer mode.************************************************************************************
	//for(var i=0; i<simpObjs_count; i++)
	{

		this.simpObj_scratch = simpBuildV1._simpleObjects_array[0];

		//var vt_arraysCacheKeys_arrays_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array.length;
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._vertices_count;
			//-------------------------------------------------------------------------------------------------------------------------------------
			gl.bindBuffer(gl.ARRAY_BUFFER, this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey);
			gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false,20,0);
			if(imageLod != -1)gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.UNSIGNED_SHORT, true,20,12);
			gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true,20,16);
			
			gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param pCloudProject 변수
 * @param modelViewProjRelToEyeMatrix 변수
 * @param encodedCamPosMC_High 변수
 * @param encodedCamPosMC_Low 변수
 * @param manager 변수
 */
Renderer.prototype.renderPCloudProject = function(gl, pCloudProject, modelViewProjRelToEyeMatrix, encodedCamPosMC_High, encodedCamPosMC_Low, manager) {
	var shadersManager = manager.shadersManager;
	
	//if(simpBuildV1._simpleObjects_array.length == 0)
	//{
	//	return;
	//}
	
	// Test using shaderManager.************************
	var shader = shadersManager.getMagoShader(6);
	var shaderProgram = shader.SHADER_PROGRAM;
	//------------------------------------------------------

	gl.uniform1i(shaderProgram.samplerUniform, 0);
	
	gl.uniform3fv(shader._BuildingPosHIGH, pCloudProject._pCloudPositionHIGH);
	gl.uniform3fv(shader._BuildingPosLOW, pCloudProject._pCloudPositionLOW);
	
	// single interleaved buffer mode.************************************************************************************
	var vbo_datas_count = pCloudProject.vbo_datas._vbo_cacheKeysArray.length;
	for(var i=0; i<vbo_datas_count; i++)
	{
		var vbo_data = pCloudProject.vbo_datas._vbo_cacheKeysArray[i];

		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			//-------------------------------------------------------------------------------------------------------------------------------------
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo_data.MESH_VERTEX_cacheKey);
			//gl.vertexAttribPointer(shader._position, 3, gl.FLOAT, false,19,0); // pos(4*3) + nor(1*3) + col(1*4) = 12+3+4 = 19.***
			gl.vertexAttribPointer(shader._position, 3, gl.FLOAT, false,28,0); // pos(4*3) + nor(4*3) + col(1*4) = 12+12+4 = 28.***
			gl.vertexAttribPointer(shader._color, 3, gl.UNSIGNED_BYTE, true,28,24);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_data.MESH_FACES_cacheKey);
			gl.drawElements(gl.TRIANGLES, vbo_data.indices_count, gl.UNSIGNED_SHORT, 0); 
			//--------------------------------------------------------------------------------------------------------------------------------------
			
			//this.dateSC = new Date();
			//this.currentTimeSC = this.dateSC.getTime();
			//manager.renderingTime += this.currentTimeSC - this.startTimeSC;
		}
	
	}
};
