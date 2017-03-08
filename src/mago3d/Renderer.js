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
 * @param f4d_manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefLists = function(gl, neoRefList_array, neoBuilding, f4d_manager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var gl = gl;
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;
	

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;
	
	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	if(MagoConfig.getInformation().renderingConfg.glEnable) {
		gl.enable(gl.CULL_FACE);
	} else {
		gl.disable(gl.CULL_FACE);
	}
	
	gl.disable(gl.CULL_FACE);
		
	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;
	  
	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1)
			gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
	} else{
		gl.bindTexture(gl.TEXTURE_2D, f4d_manager.textureAux_1x1);
	}
	 
	var geometryDataPath = f4d_manager.readerWriter.geometryDataPath;
	  
	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;
		
		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;
		
		if(myBlocksList == undefined)
			continue;
		
		if(myBlocksList.fileLoadState == 2)
		{
			myBlocksList.parseArrayBuffer(gl, myBlocksList.dataArraybuffer, f4d_manager.readerWriter);
			myBlocksList.dataArraybuffer = undefined;
			continue;
		}
		
		if(myBlocksList.fileLoadState != 4)
			continue;
		
		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;


		visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
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

		for(var k=0; k<visibleIndices_count; k++)
		{
			//if(f4d_manager.isCameraMoving && isInterior && timeControlCounter == 0)
			if(f4d_manager.isCameraMoving && timeControlCounter == 0)
			{
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
			//var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined)
			{
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList.blocksArray.length)
			{
				var hola =0;
				continue;
			}
			block = myBlocksList.getBlock(block_idx);
			
			if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
			{
				if(block != null)
				{
					if(block.isSmallObj && f4d_manager.objectSelected != neoReference)
						continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined && neoReference.texture.tex_id == undefined)
			{
				if(f4d_manager.backGround_fileReadings_count > 10)
					continue;
				
				// 1rst, check if the texture is loaded.***
				var tex_id = neoBuilding.getTextureId(neoReference.texture);
				if(tex_id == undefined)
				{
					// Load the texture.***
					var filePath_inServer = geometryDataPath + "/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.texture_image_fileName;
					f4d_manager.readerWriter.readNeoReferenceTextureInServer(gl, filePath_inServer, neoReference.texture, neoBuilding, f4d_manager);
					f4d_manager.backGround_fileReadings_count ++;
					continue;
				}
				else{
					neoReference.texture.tex_id = tex_id;
				}
			}
				
			// **************************************************************************************************************************
			if(f4d_manager.objectSelected == neoReference)
			{
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
				gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
			}
			else
			{
				//if(neoReference.texture != undefined && renderTexture)
				if(renderTexture) 
				{
					if(neoReference.hasTexture)
					{
						if(neoReference.texture != undefined)
						{
							if(neoReference.texture.tex_id != undefined)
							{
								gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
								if(current_tex_id != neoReference.texture.tex_id)
								{
									//gl.activeTexture(gl.TEXTURE2);
									gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.tex_id);
									current_tex_id = neoReference.texture.tex_id;
								
								}
								else{
									// do nothing.***
									//var hola = 0;
								}
							}
							else{
								continue;
							}
						}
						else{
							continue;
						}
					}
					else{
						// if there are no texture, then use a color.***
						if(ssao_idx == 1)
						{
							if(!neoReference.hasTexture)
							{
								if(neoReference.color4)
								{
									//if(neoReference.color4.a < 60)
									//	continue;
									
									gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
									gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
								}
							}
						}
					}
				}
				else
				{
					// if there are no texture, then use a color.***
					if(ssao_idx == 1)// real render.***
					{
						if(!neoReference.hasTexture)
						{
							if(neoReference.color4)
							{
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								//	continue;
								
								gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
								gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
							}
						}
					}
					else if(ssao_idx == 0) // depth render.***
					{
						if(neoReference.color4)
						{
							//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
							//	continue;
							
						}
					}
				}
			}
			
			// End checking textures loaded.------------------------------------------------------------------------------------

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{
					
					//ifc_entity = block.mIFCEntityType;
					//if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
					//	continue;
					
					//if(f4d_manager.isCameraMoving && block.isSmallObj)
					//	continue;
					
					cacheKeys_count = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***

					gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					
					if(neoReference.moveVector != undefined)
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, true);
						gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
					}
					else
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, false);
						gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
					}
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block.viArraysContainer._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray[n];
						
						//****************************************************************************************************AAA
						if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = gl.createBuffer ();
							gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
							gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, gl.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.pos_vboDataArray = [];
							this.vbo_vi_cacheKey_aux.pos_vboDataArray = null;
								continue;
						}
						
						if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.nor_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = gl.createBuffer ();
							gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
							gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, gl.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.nor_vboDataArray = [];
							this.vbo_vi_cacheKey_aux.nor_vboDataArray = null;
								continue;
						}
						
						if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = gl.createBuffer ();
							gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
							gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, gl.STATIC_DRAW);
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
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;

		}
	}
	
	gl.enable(gl.DEPTH_TEST);
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsAsimetricVersion = function(gl, neoRefList_array, neoBuilding, f4d_manager, isInterior, standardShader, renderTexture, ssao_idx, maxSizeToRender) {
	// render_neoRef
	var gl = gl;
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;
	

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;
	
	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	if(MagoConfig.getInformation().renderingConfg.glEnable) {
		gl.enable(gl.CULL_FACE);
	} else {
		gl.disable(gl.CULL_FACE);
	}
	
	gl.disable(gl.CULL_FACE);
		
	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;
	  
	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1)
			gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
	} else{
		gl.bindTexture(gl.TEXTURE_2D, f4d_manager.textureAux_1x1);
	}
	 
	var geometryDataPath = f4d_manager.readerWriter.geometryDataPath;
	  
	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;
		
		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;
		
		if(myBlocksList == undefined)
			continue;
		
		if(myBlocksList.fileLoadState == 2)
		{
			myBlocksList.parseArrayBufferAsimetricVersion(gl, myBlocksList.dataArraybuffer, f4d_manager.readerWriter);
			continue;
		}
		
		if(myBlocksList.fileLoadState != 4)
			continue;
		
		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;


		visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
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

		for(var k=0; k<visibleIndices_count; k++)
		{
			//if(f4d_manager.isCameraMoving && isInterior && timeControlCounter == 0)
			if(f4d_manager.isCameraMoving && timeControlCounter == 0)
			{
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
			//var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined)
			{
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList.blocksArray.length)
			{
				var hola =0;
				continue;
			}
			block = myBlocksList.getBlock(block_idx);
			
			if(maxSizeToRender && block != null)
			{
				if(block.radius < maxSizeToRender)
					continue;
			}
			
			if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
			{
				if(block != null)
				{
					if(block.isSmallObj && f4d_manager.objectSelected != neoReference)
						continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined && neoReference.texture.tex_id == undefined)
			{
				if(f4d_manager.backGround_fileReadings_count > 10)
					continue;
				
				// 1rst, check if the texture is loaded.***
				var tex_id = neoBuilding.getTextureId(neoReference.texture);
				if(tex_id == undefined)
				{
					// Load the texture.***
					var filePath_inServer = geometryDataPath + "/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.texture_image_fileName;
					f4d_manager.readerWriter.readNeoReferenceTextureInServer(gl, filePath_inServer, neoReference.texture, neoBuilding, f4d_manager);
					f4d_manager.backGround_fileReadings_count ++;
					continue;
				}
				else{
					neoReference.texture.tex_id = tex_id;
				}
			}
				
			// **************************************************************************************************************************
			if(f4d_manager.objectSelected == neoReference)
			{
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
				gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
			}
			else
			{
				//if(neoReference.texture != undefined && renderTexture)
				if(renderTexture) 
				{
					if(neoReference.hasTexture)
					{
						if(neoReference.texture != undefined)
						{
							if(neoReference.texture.tex_id != undefined)
							{
								gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
								if(current_tex_id != neoReference.texture.tex_id)
								{
									//gl.activeTexture(gl.TEXTURE2);
									gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.tex_id);
									current_tex_id = neoReference.texture.tex_id;
								
								}
								else{
									// do nothing.***
									//var hola = 0;
								}
							}
							else{
								continue;
							}
						}
						else{
							continue;
						}
					}
					else{
						// if there are no texture, then use a color.***
						if(ssao_idx == 1)
						{
							if(!neoReference.hasTexture)
							{
								if(neoReference.color4)
								{
									//if(neoReference.color4.a < 60)
									//	continue;
									
									gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
									gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
								}
							}
						}
					}
				}
				else
				{
					// if there are no texture, then use a color.***
					if(ssao_idx == 1)// real render.***
					{
						if(!neoReference.hasTexture)
						{
							if(neoReference.color4)
							{
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								//	continue;
								
								gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
								gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
							}
						}
					}
					else if(ssao_idx == 0) // depth render.***
					{
						if(neoReference.color4)
						{
							//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
							//	continue;
							
						}
					}
				}
			}
			
			// End checking textures loaded.------------------------------------------------------------------------------------

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{
					
					//ifc_entity = block.mIFCEntityType;
					//if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
					//	continue;
					
					//if(f4d_manager.isCameraMoving && block.isSmallObj)
					//	continue;
					
					cacheKeys_count = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***

					gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					
					if(neoReference.moveVector != undefined)
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, true);
						gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
					}
					else
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, false);
						gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
					}
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block.viArraysContainer._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray[n];
						
						//****************************************************************************************************AAA
						if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = gl.createBuffer ();
							gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
							gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, gl.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.pos_vboDataArray = [];
							this.vbo_vi_cacheKey_aux.pos_vboDataArray = null;
								continue;
						}
						
						if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.nor_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = gl.createBuffer ();
							gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
							gl.bufferData(gl.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, gl.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.nor_vboDataArray = [];
							this.vbo_vi_cacheKey_aux.nor_vboDataArray = null;
								continue;
						}
						
						if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = gl.createBuffer ();
							gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
							gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, gl.STATIC_DRAW);
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
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;

		}
	}
	
	gl.enable(gl.DEPTH_TEST);
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsLegoAsimetricVersion = function(gl, neoRefList_array, neoBuilding, f4d_manager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var gl = gl;
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;
	

	//this.dateSC = new Date();
	//this.startTimeSC = this.dateSC.getTime();
	//this.currentTimeSC;
	//var secondsUsed;

	var timeControlCounter = 0;
	
	gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	if(MagoConfig.getInformation().renderingConfg.glEnable) {
		gl.enable(gl.CULL_FACE);
	} else {
		gl.disable(gl.CULL_FACE);
	}
	
	gl.disable(gl.CULL_FACE);
		
	//if(ssao_idx == 0)
	//	gl.disable(gl.CULL_FACE);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	var cacheKeys_count;
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;
	  
	gl.activeTexture(gl.TEXTURE2); // necessary.***
	if(renderTexture) {
		if(ssao_idx == 1)
			gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
	} else{
		gl.bindTexture(gl.TEXTURE_2D, f4d_manager.textureAux_1x1);
	}
	 
	var geometryDataPath = f4d_manager.readerWriter.geometryDataPath;
	  
	for(var j=0; j<neoRefLists_count; j++) {
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList.blocksList;
		
		//var visibleIndices_count = neoRefList._currentVisibleIndices.length;
		
		if(myBlocksList == undefined)
			continue;
		
		if(myBlocksList.fileLoadState == 2)
		{
			myBlocksList.parseArrayBufferAsimetricVersion(gl, myBlocksList.dataArraybuffer, f4d_manager.readerWriter);
			myBlocksList.dataArraybuffer = undefined;
			continue;
		}
		
		if(myBlocksList.fileLoadState != 4)
			continue;
		
		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;


		visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
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

		for(var k=0; k<visibleIndices_count; k++)
		{
			//if(f4d_manager.isCameraMoving && isInterior && timeControlCounter == 0)
			if(f4d_manager.isCameraMoving && timeControlCounter == 0)
			{
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
			//var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined)
			{
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList.blocksArray.length)
			{
				var hola =0;
				continue;
			}
			block = myBlocksList.getBlock(block_idx);
			
			if(block.radius < 0.3)
						continue;
			
			if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
			{
				if(block != null)
				{
					
					if(block.isSmallObj && f4d_manager.objectSelected != neoReference)
						continue;
				}
			}

			// Check if the texture is loaded.********************************************************************************
			if(neoReference.texture != undefined && neoReference.texture.tex_id == undefined)
			{
				if(f4d_manager.backGround_fileReadings_count > 10)
					continue;
				
				// 1rst, check if the texture is loaded.***
				var tex_id = neoBuilding.getTextureId(neoReference.texture);
				if(tex_id == undefined)
				{
					// Load the texture.***
					var filePath_inServer = geometryDataPath + "/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.texture_image_fileName;
					f4d_manager.readerWriter.readNeoReferenceTextureInServer(gl, filePath_inServer, neoReference.texture, neoBuilding, f4d_manager);
					f4d_manager.backGround_fileReadings_count ++;
					continue;
				}
				else{
					neoReference.texture.tex_id = tex_id;
				}
			}
				
			// **************************************************************************************************************************
			if(f4d_manager.objectSelected == neoReference)
			{
				gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
				gl.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
			}
			else
			{
				//if(neoReference.texture != undefined && renderTexture)
				if(renderTexture) 
				{
					if(neoReference.hasTexture)
					{
						if(neoReference.texture != undefined)
						{
							if(neoReference.texture.tex_id != undefined)
							{
								gl.uniform1i(standardShader.hasTexture_loc, true); //.***	
								if(current_tex_id != neoReference.texture.tex_id)
								{
									//gl.activeTexture(gl.TEXTURE2);
									gl.bindTexture(gl.TEXTURE_2D, neoReference.texture.tex_id);
									current_tex_id = neoReference.texture.tex_id;
								
								}
								else{
									// do nothing.***
									//var hola = 0;
								}
							}
							else{
								continue;
							}
						}
						else{
							continue;
						}
					}
					else{
						// if there are no texture, then use a color.***
						if(ssao_idx == 1)
						{
							if(!neoReference.hasTexture)
							{
								if(neoReference.color4)
								{
									//if(neoReference.color4.a < 60)
									//	continue;
									
									//gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
									//gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
								}
							}
						}
					}
				}
				else
				{
					// if there are no texture, then use a color.***
					if(ssao_idx == 1)// real render.***
					{
						if(!neoReference.hasTexture)
						{
							if(neoReference.color4)
							{
								//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
								//	continue;
								
								//gl.uniform1i(standardShader.hasTexture_loc, false); //.***	
								//gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
							}
						}
					}
					else if(ssao_idx == 0) // depth render.***
					{
						if(neoReference.color4)
						{
							//if(neoReference.color4.a < 255) // if transparent object, then skip. provisional.***
							//	continue;
							
						}
					}
				}
			}
			
			// End checking textures loaded.------------------------------------------------------------------------------------

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null && block.lego != undefined)
				{
					//if(f4d_manager.isCameraMoving && block.isSmallObj)
					//	continue;
					
					//cacheKeys_count = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray.length;
					cacheKeys_count = block.lego.vbo_vicks_container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***

					gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					
					if(neoReference.moveVector != undefined)
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, true);
						gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
					}
					else
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, false);
						gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
					}
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block.viArraysContainer._meshArrays[n];
						//this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray[n];
						this.vbo_vi_cacheKey_aux = block.lego.vbo_vicks_container._vbo_cacheKeysArray[n];
						
						// ssao_idx = -1 -> pickingMode.***
						// ssao_idx = 0 -> depth.***
						// ssao_idx = 1 -> ssao.***
						
						if(ssao_idx == 0) // depth.***
						{
							// 1) Position.*********************************************
							var vbo_vicky = block.lego.vbo_vicks_container._vbo_cacheKeysArray[0]; // there are only one.***
							if(vbo_vicky.MESH_VERTEX_cacheKey == null)
							{
								if(vbo_vicky.pos_vboDataArray != undefined) //dataArray_byteLength > 0
								{
									vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
									gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
									gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.pos_vboDataArray, gl.STATIC_DRAW);
									
									vbo_vicky.pos_vboDataArray = undefined;
								}
								
								continue;
							}
							
							var vertices_count = vbo_vicky.vertexCount;
							
							if(vertices_count == 0)
							{
								continue;
							}
							
							//-------------------------------------------------------------------------------------------------------------------------------------
							gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
							gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
							gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
						}
						else if(ssao_idx == 1) // ssao.***
						{
							var vbo_vicky = block.lego.vbo_vicks_container._vbo_cacheKeysArray[0]; // there are only one.***
							var vertices_count = vbo_vicky.vertexCount;
							
							if(vertices_count == 0)
							{
								continue;
							}
							
							// 1) Position.*********************************************
							if(vbo_vicky.MESH_VERTEX_cacheKey == null)
							{
								if(vbo_vicky.pos_vboDataArray != undefined) //dataArray_byteLength > 0
								{
									vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
									gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
									gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.pos_vboDataArray, gl.STATIC_DRAW);
									
									vbo_vicky.pos_vboDataArray = undefined;
								}
								
								continue;
							}
							
							// 2) Normal.*********************************************
							if(vbo_vicky.MESH_NORMAL_cacheKey == null)
							{
								if(vbo_vicky.nor_vboDataArray != undefined) //dataArray_byteLength > 0
								{
									vbo_vicky.MESH_NORMAL_cacheKey = gl.createBuffer ();
									gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_NORMAL_cacheKey);
									gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.nor_vboDataArray, gl.STATIC_DRAW);
									
									vbo_vicky.nor_vboDataArray = undefined;
								}
								continue;
							}
							
							// 3) Color.*********************************************
							if(vbo_vicky.MESH_COLOR_cacheKey == null)
							{
								if(vbo_vicky.col_vboDataArray != undefined) //dataArray_byteLength > 0
								{
									vbo_vicky.MESH_COLOR_cacheKey = gl.createBuffer ();
									gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_COLOR_cacheKey);
									gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.col_vboDataArray, gl.STATIC_DRAW);
									
									vbo_vicky.col_vboDataArray = undefined;
								}
								
								continue;
							}
							
							if(vertices_count == 0)
							{
								continue;
							}
							
							gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
							gl.vertexAttribPointer(standardShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
							
							gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_NORMAL_cacheKey);
							gl.vertexAttribPointer(standardShader.normal3_loc, 3, gl.BYTE, true, 0, 0);
							
							gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_COLOR_cacheKey);
							gl.vertexAttribPointer(standardShader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
							
							gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
						}

					}
				}
			//timeControlCounter++;
			//if(timeControlCounter > 20)
			//	timeControlCounter = 0;

		}
	}
	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderNeoRefListsColorSelection = function(gl, neoRefList_array, neoBuilding, f4d_manager, isInterior, standardShader, renderTexture, ssao_idx) {
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0) return;
	
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC;
	var secondsUsed;
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
	var reference;
	var block_idx;
	var block;
	var ifc_entity;
	var vbo_ByteColorsCacheKeys_Container;
	var current_tex_id;

	for(var j=0; j<neoRefLists_count; j++) {
		
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;
		
		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

		//visibleIndices_count = neoRefList.neoRefs_Array.length; // TEST******************************
		for(var k=0; k<visibleIndices_count; k++)
		{
			//if(f4d_manager.isCameraMoving && isInterior && timeControlCounter == 0)
			if(f4d_manager.isCameraMoving && timeControlCounter == 0)
			{
			}
			var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			//var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined)
			{
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList.blocksArray.length)
			{
				var hola =0;
				continue;
			}
			block = myBlocksList.getBlock(block_idx);
			
			/*
			if(f4d_manager.isCameraMoving)// && !isInterior && f4d_manager.isCameraInsideBuilding)
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
				if(f4d_manager.backGround_fileReadings_count > 10)
					continue;
				
				// 1rst, check if the texture is loaded.***
				var tex_id = neoBuilding.getTextureId(neoReference.texture);
				if(tex_id == undefined)
				{
					// Load the texture.***
					var filePath_inServer = "/F4D_GeometryData/"+neoBuilding.buildingFileName+"/Images/"+neoReference.texture.texture_image_fileName;
					f4d_manager.readerWriter.readNeoReferenceTextureInServer(gl, filePath_inServer, neoReference.texture, neoBuilding, f4d_manager);
					f4d_manager.backGround_fileReadings_count ++;
					continue;
				}
				else{
					neoReference.texture.tex_id = tex_id;
				}
			}
			*/
				
			//if(neoReference.texture != undefined && renderTexture)


			//if(ssao_idx == -1) // selection render.***
			{
				if(neoReference.selColor4)
				{
					gl.uniform4fv(standardShader.color4Aux_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, neoReference.selColor4.a/255.0]);
				}
				else
					continue; // never enter here.***
			}
			
			// End checking textures loaded.------------------------------------------------------------------------------------

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{

					cacheKeys_count = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					gl.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					
					if(neoReference.moveVector != undefined)
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, true);
						gl.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
					}
					else
					{
						gl.uniform1i(standardShader.hasAditionalMov_loc, false);
						gl.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
					}
					
					// for workers.**************************************************************************************************************************
					//vbo_ByteColorsCacheKeys_Container = neoBuilding._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
					// End for workers.----------------------------------------------------------------------------------------------------------------------
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block.viArraysContainer._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block.vBOVertexIdxCacheKeysContainer._vbo_cacheKeysArray[n];
						
						//****************************************************************************************************AAA
						if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined)
								continue;
						
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
						if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined)
								continue;
						
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
			if(timeControlCounter > 20)
				timeControlCounter = 0;
		}
	}
	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderLodBuilding = function(gl, lodBuilding, magoManager, shader, ssao_idx) {
	if(lodBuilding.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}
	
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	if(ssao_idx == 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = lodBuilding.vbo_vicks_container._vbo_cacheKeysArray[0]; // there are only one.***
		if(vbo_vicky.MESH_VERTEX_cacheKey == null)
		{
			if(vbo_vicky.pos_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.pos_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.pos_vboDataArray = undefined;
			}
			
			return;
		}
		
		var vertices_count = vbo_vicky.vertexCount;
		
		if(vertices_count == 0)
		{
			return;
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
	else if(ssao_idx == 1) // ssao.***
	{
		var vbo_vicky = lodBuilding.vbo_vicks_container._vbo_cacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;
		
		if(vertices_count == 0)
		{
			return;
		}
		
		// 1) Position.*********************************************
		if(vbo_vicky.MESH_VERTEX_cacheKey == null)
		{
			if(vbo_vicky.pos_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.pos_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.pos_vboDataArray = undefined;
			}
			
			return;
		}
		
		// 2) Normal.*********************************************
		if(vbo_vicky.MESH_NORMAL_cacheKey == null)
		{
			if(vbo_vicky.nor_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_NORMAL_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_NORMAL_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.nor_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.nor_vboDataArray = undefined;
			}
			return;
		}
		
		// 3) Color.*********************************************
		if(vbo_vicky.MESH_COLOR_cacheKey == null)
		{
			if(vbo_vicky.col_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_COLOR_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_COLOR_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.col_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.col_vboDataArray = undefined;
			}
			
			return;
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_NORMAL_cacheKey);
		gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_COLOR_cacheKey);
		gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoRefList_array 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 * @param isInterior 변수
 * @param standardShader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 */
Renderer.prototype.renderLego = function(gl, lego, magoManager, shader, ssao_idx) {
	if(lego.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}
	
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	if(ssao_idx == 0) // depth.***
	{
		// 1) Position.*********************************************
		var vbo_vicky = lego.vbo_vicks_container._vbo_cacheKeysArray[0]; // there are only one.***
		if(vbo_vicky.MESH_VERTEX_cacheKey == null)
		{
			if(vbo_vicky.pos_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.pos_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.pos_vboDataArray = undefined;
			}
			
			return;
		}
		
		var vertices_count = vbo_vicky.vertexCount;
		
		if(vertices_count == 0)
		{
			return;
		}
		
		//-------------------------------------------------------------------------------------------------------------------------------------
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
	else if(ssao_idx == 1) // ssao.***
	{
		var vbo_vicky = lego.vbo_vicks_container._vbo_cacheKeysArray[0]; // there are only one.***
		var vertices_count = vbo_vicky.vertexCount;
		
		if(vertices_count == 0)
		{
			return;
		}
		
		// 1) Position.*********************************************
		if(vbo_vicky.MESH_VERTEX_cacheKey == null)
		{
			if(vbo_vicky.pos_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_VERTEX_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.pos_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.pos_vboDataArray = undefined;
			}
			
			return;
		}
		
		// 2) Normal.*********************************************
		if(vbo_vicky.MESH_NORMAL_cacheKey == null)
		{
			if(vbo_vicky.nor_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_NORMAL_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_NORMAL_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.nor_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.nor_vboDataArray = undefined;
			}
			return;
		}
		
		// 3) Color.*********************************************
		if(vbo_vicky.MESH_COLOR_cacheKey == null)
		{
			if(vbo_vicky.col_vboDataArray != undefined) //dataArray_byteLength > 0
			{
				vbo_vicky.MESH_COLOR_cacheKey = gl.createBuffer ();
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_COLOR_cacheKey);
				gl.bufferData(gl.ARRAY_BUFFER, vbo_vicky.col_vboDataArray, gl.STATIC_DRAW);
				
				vbo_vicky.col_vboDataArray = undefined;
			}
			
			return;
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
		gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_NORMAL_cacheKey);
		gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo_vicky.MESH_COLOR_cacheKey);
		gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param neoBuilding 변수
 * @param f4d_manager 변수
 * @param imageLod 변수
 * @param shader 변수
 */
Renderer.prototype.renderNeoSimpleBuildingPostFxShader = function(gl, neoBuilding, f4d_manager, imageLod, shader) {
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var shadersManager = f4d_manager.shadersManager;
	
	// check if has vbos.***
	if(simpBuild.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	//if(f4d_manager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	var shaderProgram = shader.program;

	  gl.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding._buildingPositionHIGH);
	  gl.uniform3fv(shader.buildingPosLOW_loc, neoBuilding._buildingPositionLOW);

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
 * @param f4d_manager 변수
 * @param shader 변수
 */
Renderer.prototype.renderNeoSimpleBuildingDepthShader = function(gl, neoBuilding, f4d_manager, shader) {
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var shadersManager = f4d_manager.shadersManager;
	
	// check if has vbos.***
	if(simpBuild.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}

	var shaderProgram = shader.program;

	  gl.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding._buildingPositionHIGH);
	  gl.uniform3fv(shader.buildingPosLOW_loc, neoBuilding._buildingPositionLOW);

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
 * @param f4d_manager 변수
 * @param imageLod 변수
 * @param shader 변수
 */
Renderer.prototype.renderSimpleBuildingV1PostFxShader = function(gl, BR_Project, f4d_manager, imageLod, shader) {
	var simpBuildV1 = BR_Project._simpleBuilding_v1;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var shadersManager = f4d_manager.shadersManager;
	
	if(simpBuildV1._simpleObjects_array.length == 0)
	{
		return;
	}
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	//if(f4d_manager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	var shaderProgram = shader.program;

	  gl.uniform3fv(shader.buildingPosHIGH_loc, BR_Project._buildingPositionHIGH);
	  gl.uniform3fv(shader.buildingPosLOW_loc, BR_Project._buildingPositionLOW);

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
 * @param modelViewProjRelToEye_matrix 변수
 * @param encodedCamPosMC_High 변수
 * @param encodedCamPosMC_Low 변수
 * @param f4d_manager 변수
 */
Renderer.prototype.renderPCloudProject = function(gl, pCloudProject, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_manager) {
	var shadersManager = f4d_manager.shadersManager;
	
	//if(simpBuildV1._simpleObjects_array.length == 0)
	//{
	//	return;
	//}
	
	// Test using f4d_shaderManager.************************
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
			//f4d_manager.f4d_rendering_time += this.currentTimeSC - this.startTimeSC;
		}
	
	}
};
