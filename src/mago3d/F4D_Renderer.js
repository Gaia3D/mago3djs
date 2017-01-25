
/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_renderer = function()
{
	this.vbo_vi_cacheKey_aux = undefined;
	this.byteColorAux = new f4d_ByteColor();
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	
	this.currentTimeSC = undefined;
	this.dateSC = undefined;
	this.startTimeSC = undefined;
			
	this.simpObj_scratch = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL = 변수
 * @param neoRefList_array = 변수
 * @param neoBuilding = 변수
 * @param f4d_manager = 변수
 * @param isInterior = 변수
 * @param standardShader = 변수
 * @param renderTexture = 변수
 * @param ssao_idx = 변수
 */
f4d_renderer.prototype.render_F4D_neoRefLists = function(GL, neoRefList_array, neoBuilding, f4d_manager, isInterior, standardShader, renderTexture, ssao_idx)
{
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0)return;

	
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC = undefined;
	var secondsUsed = undefined;
	var timeControlCounter = 0;
	
	
	GL.enable(GL.DEPTH_TEST);
	//GL.disable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	GL.enable(GL.CULL_FACE);
	//GL.disable(GL.CULL_FACE);
	
	//if(ssao_idx == 0)
	//	GL.disable(GL.CULL_FACE);
	
	
	var cacheKeys_count = undefined;
	var reference = undefined;
	var block_idx = undefined;
	var block = undefined;
	var ifc_entity = undefined;
	var vbo_ByteColorsCacheKeys_Container = undefined;
	var current_tex_id = undefined;
	  
	  
	  GL.activeTexture(GL.TEXTURE2); // necessary.***
	 if(renderTexture) 
	 {
		 if(ssao_idx == 1)
			GL.uniform1i(standardShader.hasTexture_loc, true); //.***	
	 }
	 else{
		 GL.bindTexture(GL.TEXTURE_2D, f4d_manager.textureAux_1x1);
	 }
	 
	 var geometryDataPath = f4d_manager.f4d_readerWriter.geometryDataPath;
	  
	// ------------------------------------------------------------------------------------- //  
	for(var j=0; j<neoRefLists_count; j++)
	{
		
		var neoRefList = neoRefList_array[j];
		var myBlocksList = neoRefList_array[j].blocksList;
		
		//if(!isInterior && neoRefList.name == "Ref_Bone")
		//	continue;

		// New version. Use occlussion indices.***
		var visibleIndices_count = neoRefList._currentVisibleIndices.length;

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
				//GL.disableVertexAttribArray(standardShader.normal3_loc);
				//GL.disableVertexAttribArray(standardShader.position3_loc);
				//GL.disableVertexAttribArray(standardShader.texCoord2_loc);
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
					//GL.disableVertexAttribArray(standardShader.normal3_loc);
					//GL.disableVertexAttribArray(standardShader.position3_loc);
					//GL.disableVertexAttribArray(standardShader.texCoord2_loc);
					//return;
				}
				
				
			}
			var neoReference = neoRefList.neoRefs_Array[neoRefList._currentVisibleIndices[k]]; // good.***
			//var neoReference = neoRefList.neoRefs_Array[k]; // TEST.***
			if(!neoReference || neoReference== undefined)
			{
				continue;
			}
			
			block_idx = neoReference._block_idx;
				
			if(block_idx >= myBlocksList._blocksArray.length)
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
					f4d_manager.f4d_readerWriter.readF4D_neoReferenceTexture_inServer(GL, filePath_inServer, neoReference.texture, neoBuilding, f4d_manager);
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
				GL.uniform1i(standardShader.hasTexture_loc, false); //.***	
				GL.uniform4fv(standardShader.color4Aux_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
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
								GL.uniform1i(standardShader.hasTexture_loc, true); //.***	
								if(current_tex_id != neoReference.texture.tex_id)
								{
									//GL.activeTexture(GL.TEXTURE2);
									GL.bindTexture(GL.TEXTURE_2D, neoReference.texture.tex_id);
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
									
									GL.uniform1i(standardShader.hasTexture_loc, false); //.***	
									GL.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
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
								
								GL.uniform1i(standardShader.hasTexture_loc, false); //.***	
								GL.uniform4fv(standardShader.color4Aux_loc, [neoReference.color4.r/255.0, neoReference.color4.g/255.0, neoReference.color4.b/255.0, neoReference.color4.a/255.0]);
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
					
					cacheKeys_count = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					GL.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					
					if(neoReference.moveVector != undefined)
					{
						GL.uniform1i(standardShader.hasAditionalMov_loc, true);
						GL.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
					}
					else
					{
						GL.uniform1i(standardShader.hasAditionalMov_loc, false);
						GL.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
					}
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block._vi_arrays_Container._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray[n];
						
						//****************************************************************************************************AAA
						if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
							GL.bufferData(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, GL.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.pos_vboDataArray.length = 0;
								continue;
						}
						
						if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.nor_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
							GL.bufferData(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, GL.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.nor_vboDataArray.length = 0;
								continue;
						}
						
						if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
							GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, GL.STATIC_DRAW);
							//this.vbo_vi_cacheKey_aux.indices_count = this.vbo_vi_cacheKey_aux.idx_vboDataArray.length;
							this.vbo_vi_cacheKey_aux.idx_vboDataArray.length = 0;
								continue;
						}
						
						//if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						//	continue;
						//----------------------------------------------------------------------------------------------------AAA
						
						// Positions.***
						GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						GL.vertexAttribPointer(standardShader.position3_loc, 3, GL.FLOAT, false,0,0);
						
						// Normals.***
						if(standardShader.normal3_loc != -1)
						{
							GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
							GL.vertexAttribPointer(standardShader.normal3_loc, 3, GL.BYTE, true,0,0);
						}

						
						
						if(renderTexture && neoReference.hasTexture)
						{
							if(block.vertex_count <= neoReference.vertex_count)
							{
								GL.enableVertexAttribArray(standardShader.texCoord2_loc);
								GL.bindBuffer(GL.ARRAY_BUFFER, neoReference.MESH_TEXCOORD_cacheKey);
								GL.vertexAttribPointer(standardShader.texCoord2_loc, 2, GL.FLOAT, false,0,0);
							}
							else{
								if(standardShader.texCoord2_loc != -1)
									GL.disableVertexAttribArray(standardShader.texCoord2_loc);
							}
						}
						else{
							if(standardShader.texCoord2_loc != -1)
								GL.disableVertexAttribArray(standardShader.texCoord2_loc);
						}
					
						  
						// Indices.***
						GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						GL.drawElements(GL.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
						//GL.drawElements(GL.LINES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***

					}
				}

			
			timeControlCounter++;
			if(timeControlCounter > 20)
				timeControlCounter = 0;
		}
	}
	
	GL.enable(GL.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL = 변수
 * @param neoRefList_array = 변수
 * @param neoBuilding = 변수
 * @param f4d_manager = 변수
 * @param isInterior = 변수
 * @param standardShader = 변수
 * @param renderTexture = 변수
 * @param ssao_idx = 변수
 */
f4d_renderer.prototype.render_F4D_neoRefLists_ColorSelection = function(GL, neoRefList_array, neoBuilding, f4d_manager, isInterior, standardShader, renderTexture, ssao_idx)
{
	// render_neoRef
	var neoRefLists_count = neoRefList_array.length;
	if(neoRefLists_count == 0)return;

	
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC = undefined;
	var secondsUsed = undefined;
	var timeControlCounter = 0;
	
	
	GL.enable(GL.DEPTH_TEST);
	//GL.disable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	GL.enable(GL.CULL_FACE);
	//GL.disable(GL.CULL_FACE);
	
	//if(ssao_idx == 0)
	//	GL.disable(GL.CULL_FACE);
	
	
	var cacheKeys_count = undefined;
	var reference = undefined;
	var block_idx = undefined;
	var block = undefined;
	var ifc_entity = undefined;
	var vbo_ByteColorsCacheKeys_Container = undefined;
	var current_tex_id = undefined;

	// ------------------------------------------------------------------------------------- //  
	for(var j=0; j<neoRefLists_count; j++)
	{
		
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
				
			if(block_idx >= myBlocksList._blocksArray.length)
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
					f4d_manager.f4d_readerWriter.readF4D_neoReferenceTexture_inServer(GL, filePath_inServer, neoReference.texture, neoBuilding, f4d_manager);
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
					GL.uniform4fv(standardShader.color4Aux_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, neoReference.selColor4.a/255.0]);
				}
				else
					continue; // never enter here.***
			}
			
				

			// End checking textures loaded.------------------------------------------------------------------------------------

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{

					cacheKeys_count = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					GL.uniformMatrix4fv(standardShader.RefTransfMatrix, false, neoReference._matrix4._floatArrays);
					
					if(neoReference.moveVector != undefined)
					{
						GL.uniform1i(standardShader.hasAditionalMov_loc, true);
						GL.uniform3fv(standardShader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.***	
					}
					else
					{
						GL.uniform1i(standardShader.hasAditionalMov_loc, false);
						GL.uniform3fv(standardShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
					}
					
					// for workers.**************************************************************************************************************************
					//vbo_ByteColorsCacheKeys_Container = neoBuilding._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
					// End for workers.----------------------------------------------------------------------------------------------------------------------
					
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block._vi_arrays_Container._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray[n];
						
						//****************************************************************************************************AAA
						if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.pos_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
							GL.bufferData(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.pos_vboDataArray, GL.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.pos_vboDataArray.length = 0;
								continue;
						}
						/*
						if(this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.nor_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
							GL.bufferData(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.nor_vboDataArray, GL.STATIC_DRAW);
							this.vbo_vi_cacheKey_aux.nor_vboDataArray.length = 0;
								continue;
						}
						*/
						if(this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						{
							if(this.vbo_vi_cacheKey_aux.idx_vboDataArray == undefined)
								continue;
						
							this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
							GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.idx_vboDataArray, GL.STATIC_DRAW);
							//this.vbo_vi_cacheKey_aux.indices_count = this.vbo_vi_cacheKey_aux.idx_vboDataArray.length;
							this.vbo_vi_cacheKey_aux.idx_vboDataArray.length = 0;
								continue;
						}
						
						//if(this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey == undefined || this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey == undefined)
						//	continue;
						//----------------------------------------------------------------------------------------------------AAA
						
						// Positions.***
						GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						GL.vertexAttribPointer(standardShader.position3_loc, 3, GL.FLOAT, false,0,0);
						
						// Normals.***
						/*
						//if(ssao_idx != -1)
						{
							GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_NORMAL_cacheKey);
							GL.vertexAttribPointer(standardShader.normal3_loc, 3, GL.BYTE, true,0,0);
						}
						*/

						// Indices.***
						GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						GL.drawElements(GL.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
						//GL.drawElements(GL.LINES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***

					}
				}

			
			timeControlCounter++;
			if(timeControlCounter > 20)
				timeControlCounter = 0;
		}
	}
	
	GL.enable(GL.DEPTH_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL = 변수
 * @param neoBuilding = 변수
 * @param f4d_manager = 변수
 * @param imageLod = 변수
 * @param shader = 변수
 */
f4d_renderer.prototype.render_F4D_neoSimpleBuilding_PostFxShader = function(GL, neoBuilding, f4d_manager, imageLod, shader)
{
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var f4d_shadersManager = f4d_manager.f4d_shadersManager;
	
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

	  GL.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding._buildingPositionHIGH);
	  GL.uniform3fv(shader.buildingPosLOW_loc, neoBuilding._buildingPositionLOW);

	//GL.activeTexture(GL.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***
	
	var skinTexture = simpBuild.texturesArray[0]; // provisionally take the 1rst.***
	
	GL.activeTexture(GL.TEXTURE2); // for diffuse texture.***
	if(imageLod == 3)
		GL.bindTexture(GL.TEXTURE_2D, skinTexture.textureId); // embedded image.***
	else if(imageLod == 0)
		GL.bindTexture(GL.TEXTURE_2D, skinTexture.textureId); // biggest image.***
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
			//dataType = GL.BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5121)
		{
			//dataType = GL.UNSIGNED_BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5122)
		{
			//dataType = GL.SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5123)
		{
			//dataType = GL.UNSIGNED_SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5126)
		{
			//dataType = GL.FLOAT;
			normalize_data = false;
		}
		
		
		// 0= position, 1= normal, 2= color, 3= texcoord.***
		if(accesor.accesor_type == 0) // position.***
		{
			GL.enableVertexAttribArray(shader.position3_loc);
			//GL.vertexAttribPointer(shader.position3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			GL.vertexAttribPointer(shader.position3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 
				stride = accesor.stride;		
		}
		else if(accesor.accesor_type == 1) // normal.***
		{
			GL.enableVertexAttribArray(shader.normal3_loc);
			//GL.vertexAttribPointer(shader.normal3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			GL.vertexAttribPointer(shader.normal3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 			
		}
		else if(accesor.accesor_type == 3) // texcoord.***
		{
			if(imageLod != -1)
			{
				GL.enableVertexAttribArray(shader.texCoord2_loc);
				//GL.vertexAttribPointer(shader.texCoord2_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
				GL.vertexAttribPointer(shader.texCoord2_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 
			}			
		}
	}
	

	var vbo_vicky = simpBuild.vbo_vicks_container._vbo_cacheKeysArray[0];
	if(vbo_vicky.MESH_VERTEX_cacheKey == null)
	{
		if(vbo_vicky.buffer.dataArray != undefined) //dataArray_byteLength > 0
		{
			vbo_vicky.MESH_VERTEX_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, vbo_vicky.buffer.dataArray, GL.STATIC_DRAW);
			
			vbo_vicky.buffer.dataArray = undefined;
		}
	}
	
	//for(var i=0; i<simpObjs_count; i++)
	{
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = vbo_vicky.buffer.dataArray_byteLength / stride;
			//-------------------------------------------------------------------------------------------------------------------------------------
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			//GL.vertexAttribPointer(shader.position3_loc, 3, GL.FLOAT, false,20,0);
			//if(imageLod != -1)GL.vertexAttribPointer(shader.texCoord2_loc, 2, GL.UNSIGNED_SHORT, true,20,12);
			//GL.vertexAttribPointer(shader.normal3_loc, 3, GL.BYTE, true,20,16);
			
			GL.drawArrays(GL.TRIANGLES, 0, vertices_count);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL = 변수
 * @param neoBuilding = 변수
 * @param f4d_manager = 변수
 * @param shader = 변수
 */
f4d_renderer.prototype.render_F4D_neoSimpleBuilding_DepthShader = function(GL, neoBuilding, f4d_manager, shader)
{
	var simpBuild = neoBuilding.neoSimpleBuilding;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var f4d_shadersManager = f4d_manager.f4d_shadersManager;
	
	// check if has vbos.***
	if(simpBuild.vbo_vicks_container._vbo_cacheKeysArray.length == 0)
	{
		return;
	}

	var shaderProgram = shader.program;

	  GL.uniform3fv(shader.buildingPosHIGH_loc, neoBuilding._buildingPositionHIGH);
	  GL.uniform3fv(shader.buildingPosLOW_loc, neoBuilding._buildingPositionLOW);

	//GL.activeTexture(GL.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***
	
	//GL.activeTexture(GL.TEXTURE2); // for diffuse texture.***
	
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
			//dataType = GL.BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5121)
		{
			//dataType = GL.UNSIGNED_BYTE;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5122)
		{
			//dataType = GL.SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5123)
		{
			//dataType = GL.UNSIGNED_SHORT;
			normalize_data = true;
		}
		else if(accesor.data_ytpe == 5126)
		{
			//dataType = GL.FLOAT;
			normalize_data = false;
		}
		
		
		// 0= position, 1= normal, 2= color, 3= texcoord.***
		if(accesor.accesor_type == 0) // position.***
		{
			GL.enableVertexAttribArray(shader.position3_loc);
			//GL.vertexAttribPointer(shader.position3_loc, accesor.dimension, dataType, normalize_data, accesor.stride, accesor.buffer_start); // old.***
			GL.vertexAttribPointer(shader.position3_loc, accesor.dimension, accesor.data_ytpe, normalize_data, accesor.stride, accesor.buffer_start); 
				stride = accesor.stride;		
		}


	}
	

	var vbo_vicky = simpBuild.vbo_vicks_container._vbo_cacheKeysArray[0];
	if(vbo_vicky.MESH_VERTEX_cacheKey == null)
	{
		if(vbo_vicky.buffer.dataArray != undefined) //dataArray_byteLength > 0
		{
			vbo_vicky.MESH_VERTEX_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, vbo_vicky.buffer.dataArray, GL.STATIC_DRAW);
			
			vbo_vicky.buffer.dataArray = undefined;
		}
	}
	
	//for(var i=0; i<simpObjs_count; i++)
	{
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = vbo_vicky.buffer.dataArray_byteLength / stride;
			//-------------------------------------------------------------------------------------------------------------------------------------
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vicky.MESH_VERTEX_cacheKey);
			GL.drawArrays(GL.TRIANGLES, 0, vertices_count);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL = 변수
 * @param BR_Project = 변수
 * @param f4d_manager = 변수
 * @param imageLod = 변수
 * @param shader = 변수
 */
f4d_renderer.prototype.render_F4D_simpleBuilding_V1_PostFxShader = function(GL, BR_Project, f4d_manager, imageLod, shader)
{
	var simpBuildV1 = BR_Project._simpleBuilding_v1;
	//var simpObjs_count = simpBuildV1._simpleObjects_array.length;
	var f4d_shadersManager = f4d_manager.f4d_shadersManager;
	
	if(simpBuildV1._simpleObjects_array.length == 0)
	{
		return;
	}
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	//if(f4d_manager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***
	var shaderProgram = shader.program;

	  GL.uniform3fv(shader.buildingPosHIGH_loc, BR_Project._buildingPositionHIGH);
	  GL.uniform3fv(shader.buildingPosLOW_loc, BR_Project._buildingPositionLOW);

	//GL.activeTexture(GL.TEXTURE0);
	// if we are rendering in depth buffer, then no bind texture.***
	
	
	GL.activeTexture(GL.TEXTURE2); // for diffuse texture.***
	if(imageLod == 3)
		GL.bindTexture(GL.TEXTURE_2D, simpBuildV1._simpleBuildingTexture); // embedded image.***
	else if(imageLod == 0)
		GL.bindTexture(GL.TEXTURE_2D, simpBuildV1._texture_0); // biggest image.***
	else if(imageLod == -1)
	{
		// dont bind texture.***
	}
	
	//GL.uniform1i(shaderProgram.samplerUniform, 0);
	
	// single interleaved buffer mode.************************************************************************************
	//for(var i=0; i<simpObjs_count; i++)
	{

		this.simpObj_scratch = simpBuildV1._simpleObjects_array[0];

		//var vt_arraysCacheKeys_arrays_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array.length;
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._vertices_count;
			//-------------------------------------------------------------------------------------------------------------------------------------
			GL.bindBuffer(GL.ARRAY_BUFFER, this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey);
			GL.vertexAttribPointer(shader.position3_loc, 3, GL.FLOAT, false,20,0);
			if(imageLod != -1)GL.vertexAttribPointer(shader.texCoord2_loc, 2, GL.UNSIGNED_SHORT, true,20,12);
			GL.vertexAttribPointer(shader.normal3_loc, 3, GL.BYTE, true,20,16);
			
			GL.drawArrays(GL.TRIANGLES, 0, vertices_count);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL = 변수
 * @param pCloudProject = 변수
 * @param modelViewProjRelToEye_matrix = 변수
 * @param encodedCamPosMC_High = 변수
 * @param encodedCamPosMC_Low = 변수
 * @param f4d_manager = 변수
 */
f4d_renderer.prototype.render_F4D_pCloudProject = function(GL, pCloudProject, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_manager)
{
	var f4d_shadersManager = f4d_manager.f4d_shadersManager;
	
	//if(simpBuildV1._simpleObjects_array.length == 0)
	//{
	//	return;
	//}
	

	// Test using f4d_shaderManager.************************
	var shader = f4d_shadersManager.get_f4dShader(6);
	var shaderProgram = shader.SHADER_PROGRAM;
	//------------------------------------------------------

	GL.uniform1i(shaderProgram.samplerUniform, 0);
	
	GL.uniform3fv(shader._BuildingPosHIGH, pCloudProject._pCloudPositionHIGH);
	GL.uniform3fv(shader._BuildingPosLOW, pCloudProject._pCloudPositionLOW);
	
	// single interleaved buffer mode.************************************************************************************
	var vbo_datas_count = pCloudProject.vbo_datas._vbo_cacheKeysArray.length;
	for(var i=0; i<vbo_datas_count; i++)
	{
		var vbo_data = pCloudProject.vbo_datas._vbo_cacheKeysArray[i];

		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			
			//-------------------------------------------------------------------------------------------------------------------------------------
			GL.bindBuffer(GL.ARRAY_BUFFER, vbo_data.MESH_VERTEX_cacheKey);
			//GL.vertexAttribPointer(shader._position, 3, GL.FLOAT, false,19,0); // pos(4*3) + nor(1*3) + col(1*4) = 12+3+4 = 19.***
			GL.vertexAttribPointer(shader._position, 3, GL.FLOAT, false,28,0); // pos(4*3) + nor(4*3) + col(1*4) = 12+12+4 = 28.***
			GL.vertexAttribPointer(shader._color, 3, GL.UNSIGNED_BYTE, true,28,24);
			
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, vbo_data.MESH_FACES_cacheKey);
			GL.drawElements(GL.TRIANGLES, vbo_data.indices_count, GL.UNSIGNED_SHORT, 0); 
			//--------------------------------------------------------------------------------------------------------------------------------------
			
			//this.dateSC = new Date();
			//this.currentTimeSC = this.dateSC.getTime();
			//f4d_manager.f4d_rendering_time += this.currentTimeSC - this.startTimeSC;
		}
	
	}
};

		
	
	
//# sourceURL=f4d_renderer.js
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	