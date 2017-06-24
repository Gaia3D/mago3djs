
// Codes examples from internet.*******************************************************************************************************************
/*
	Scene.prototype.InitializePickingBuffers = function () 
	{
		// code copied from http://coffeesmudge.blogspot.kr/2013/08/implementing-picking-in-webgl.html
	  // refrence: http://learningwebgl.com/blog/?p=1786
	  // This procress is similar to renderring to a buffer. The only difference is that it will be externally read on demand.
	  var gl = this.context._gl;
	  this.lastCapturedColourMap = new Uint8Array(gl.canvas.clientWidth, gl.canvas.clientHeight * 4);
	  this.fb = gl.createFramebuffer();
	  gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
	  this.rttTexture = gl.createTexture();
	  gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	  var renderbuffer = gl.createRenderbuffer();
	  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.clientWidth, gl.canvas.clientHeight);
	  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);
	  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	  
	}
	*/
// End codes examples.----------------------------------------------------------------------------------------------------------------------



var f4d_renderer = function()
{
	this.vbo_vi_cacheKey_aux = undefined;
	this.byteColorAux = new f4d_ByteColor();
	
};

f4d_renderer.prototype.render_F4D_compRefLists_v1 = function(GL, compRefList_array, BR_Project, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_manager, isInterior)
{
	var compRefLists_count = compRefList_array.length;
	if(compRefLists_count == 0)return;

	//var GL = scene.context._gl;
	//var context = scene.context;
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();
	this.currentTimeSC = undefined;
	var secondsUsed = undefined;
	var timeControlCounter = 0;
	
	// Test using f4d_shaderManager.************************
	var f4d_shadersManager = f4d_manager.f4d_shadersManager;
	var standardShader = f4d_shadersManager.get_f4dShader(0);
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	//------------------------------------------------------
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	

//    	  Entity.prototype._getModelMatrix = function(time, result) {
//    	        var position = Property.getValueOrUndefined(this._position, time, positionScratch);
//    	        if (!defined(position)) {
//    	            return undefined;
//    	        }
//    	        var orientation = Property.getValueOrUndefined(this._orientation, time, orientationScratch);
//    	        if (!defined(orientation)) {
//    	            result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
//    	        } else {
//    	            result = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, result);
//    	        }
//    	        return result;
//    	    };
		  
	  //if(defined(context._us._modelView))
	  {
		  // Note: projection_matrix * view_matrix = modelViewProj_matrix.*********************************** //
		  //var view_matrix = new Float32Array(16);
		  //Matrix4.toArray(context._us._modelView, view_matrix);
		  //var projection_matrix = new Float32Array(16);
		  //Matrix4.toArray(context._us._projection, projection_matrix);
		  //------------------------------------------------------------------------------------------------- //

		  var move_matrix = BR_Project.move_matrix;
		  
		  GL.uniformMatrix4fv(standardShader._Mmatrix, false, move_matrix);
		  GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, modelViewProjRelToEye_matrix);
		  GL.uniform3fv(standardShader._BuildingPosHIGH, BR_Project._buildingPositionHIGH);
		  GL.uniform3fv(standardShader._BuildingPosLOW, BR_Project._buildingPositionLOW);

		  GL.uniform3fv(standardShader._encodedCamPosHIGH, encodedCamPosMC_High);
		  GL.uniform3fv(standardShader._encodedCamPosLOW, encodedCamPosMC_Low);
	  }
	
	var cacheKeys_count = undefined;
	var reference = undefined;
	var block_idx = undefined;
	var block = undefined;
	var ifc_entity = undefined;
	var vbo_ByteColorsCacheKeys_Container = undefined;
	  
	// ------------------------------------------------------------------------------------- //  
	for(var j=0; j<compRefLists_count; j++)
	{
		var compRefList = compRefList_array[j];
		var myBlocksList = BR_Project._blocksList_Container._BlocksListsArray[compRefList._lodLevel];  // new for use workers.***
		
		// New version. Use occlussion indices.***
		var visibleIndices_count = compRefList._currentVisibleIndices.length;
			
			if(f4d_manager.isCameraMoving && !isInterior && f4d_manager.isCameraInsideBuilding)
			{
				if(compRefList._lodLevel == 1 || compRefList._lodLevel == 2)
				{
					continue;
				}
				
				this.dateSC = new Date();
				this.currentTimeSC = this.dateSC.getTime();
				secondsUsed = this.currentTimeSC - this.startTimeSC;
				if(secondsUsed > 30)
				{
					GL.disableVertexAttribArray(standardShader._color);
					GL.disableVertexAttribArray(standardShader._position);
					return;
				}
				
			}
			
			

		for(var k=0; k<visibleIndices_count; k++)
		{
			//if(f4d_manager.isCameraMoving && isInterior && timeControlCounter == 0)
				
			if(f4d_manager.isCameraMoving && timeControlCounter == 0)
			{
				//if(j==4)return;
				
				this.dateSC = new Date();
				this.currentTimeSC = this.dateSC.getTime();
				secondsUsed = this.currentTimeSC - this.startTimeSC;
				if(secondsUsed > 50) // miliseconds.***
				{
					GL.disableVertexAttribArray(standardShader._color);
					GL.disableVertexAttribArray(standardShader._position);
					return;
				}
				
			}
			
			var compReference = compRefList._compoundRefsArray[compRefList._currentVisibleIndices[k]]; // good.***
			var references_count = compReference._referencesList.length;
			for(var m=0; m<references_count; m++)
			{
				
				reference = compReference._referencesList[m];
				block_idx = reference._block_idx;
				block = myBlocksList.getBlock(block_idx);

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{
					ifc_entity = block.mIFCEntityType;
					if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
						continue;
					
					if(f4d_manager.isCameraMoving && block.isSmallObj)
						continue;
					
					cacheKeys_count = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					GL.uniformMatrix4fv(standardShader._RefTransfMatrix, false, reference._matrix4._floatArrays);
					
					// for workers.**************************************************************************************************************************
					vbo_ByteColorsCacheKeys_Container = BR_Project._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
					// End for workers.----------------------------------------------------------------------------------------------------------------------
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block._vi_arrays_Container._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray[n];
						
						GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
						
						// Colors in float mode.*****************************************************************************************
						//GL.bindBuffer(GL.ARRAY_BUFFER, reference._VBO_ByteColorsCacheKeys_Container._vbo_byteColors_cacheKeysArray[n].MESH_COLORS_cacheKey);
						//GL.vertexAttribPointer(scene._color, 3, GL.FLOAT, false,0,0);
						  
						// Colors in byte mode.******************************************************************************************
						GL.bindBuffer(GL.ARRAY_BUFFER, vbo_ByteColorsCacheKeys_Container._vbo_byteColors_cacheKeysArray[n].MESH_COLORS_cacheKey);// Test for workers.***
						GL.vertexAttribPointer(standardShader._color, 3, GL.UNSIGNED_BYTE, true,0,0); // In "colors" the argument normalized must be TRUE when is in BYTE.***
				
						GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						GL.drawElements(GL.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
						//GL.drawElements(GL.LINES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
					}
				}
				/*
				if(f4d_manager.isCameraMoving && isInterior)
				{
					date = new Date();
					currentTime = date.getTime();
					secondsUsed = currentTime - startTime;
					if(secondsUsed > 0.000000000000000000000000001)
					{
						m = references_count;
						continue;
					}
				}
				*/
			}
			
			timeControlCounter++;
			if(timeControlCounter > 10)
				timeControlCounter = 0;
		}
	}

	GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	//---------------------------------------------------
};

f4d_renderer.prototype.render_F4D_compRefList = function(GL, compRefList_array, BR_Project, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_shadersManager)
{
	var compRefLists_count = compRefList_array.length;
	if(compRefLists_count == 0)return;

	//var GL = scene.context._gl;
	//var context = scene.context;
	
	// Test using f4d_shaderManager.************************
	var standardShader = f4d_shadersManager.get_f4dShader(0);
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	//------------------------------------------------------
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	

//    	  Entity.prototype._getModelMatrix = function(time, result) {
//    	        var position = Property.getValueOrUndefined(this._position, time, positionScratch);
//    	        if (!defined(position)) {
//    	            return undefined;
//    	        }
//    	        var orientation = Property.getValueOrUndefined(this._orientation, time, orientationScratch);
//    	        if (!defined(orientation)) {
//    	            result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
//    	        } else {
//    	            result = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, result);
//    	        }
//    	        return result;
//    	    };
		  
	  //if(defined(context._us._modelView))
	  {
		  // Note: projection_matrix * view_matrix = modelViewProj_matrix.*********************************** //
		  //var view_matrix = new Float32Array(16);
		  //Matrix4.toArray(context._us._modelView, view_matrix);
		  //var projection_matrix = new Float32Array(16);
		  //Matrix4.toArray(context._us._projection, projection_matrix);
		  //------------------------------------------------------------------------------------------------- //

		  var move_matrix = BR_Project.move_matrix;
		  
		  GL.uniformMatrix4fv(standardShader._Mmatrix, false, move_matrix);
		  GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, modelViewProjRelToEye_matrix);
		  GL.uniform3fv(standardShader._BuildingPosHIGH, BR_Project._buildingPositionHIGH);
		  GL.uniform3fv(standardShader._BuildingPosLOW, BR_Project._buildingPositionLOW);

		  GL.uniform3fv(standardShader._encodedCamPosHIGH, encodedCamPosMC_High);
		  GL.uniform3fv(standardShader._encodedCamPosLOW, encodedCamPosMC_Low);
	  }
	
	var cacheKeys_count = undefined;
	var reference = undefined;
	var block_idx = undefined;
	var block = undefined;
	var ifc_entity = undefined;
	var vbo_ByteColorsCacheKeys_Container = undefined;
	  
	// ------------------------------------------------------------------------------------- //  
	for(var j=0; j<compRefLists_count; j++)
	{
		var compRefList = compRefList_array[j];
		var myBlocksList = BR_Project._blocksList_Container._BlocksListsArray[compRefList._lodLevel];  // new for use workers.***
		var compReferences_count = compRefList._compoundRefsArray.length;
		for(var k=0; k<compReferences_count; k++)
		{
			var compReference = compRefList._compoundRefsArray[k];
			var references_count = compReference._referencesList.length;
			for(var m=0; m<references_count; m++)
			{
				reference = compReference._referencesList[m];
				block_idx = reference._block_idx;
				block = myBlocksList.getBlock(block_idx);

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{
					ifc_entity = block.mIFCEntityType;
					if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
						continue;
					
					cacheKeys_count = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					GL.uniformMatrix4fv(standardShader._RefTransfMatrix, false, reference._matrix4._floatArrays);
					
					// for workers.**************************************************************************************************************************
					vbo_ByteColorsCacheKeys_Container = BR_Project._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
					// End for workers.----------------------------------------------------------------------------------------------------------------------
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block._vi_arrays_Container._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray[n];
						
						GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
						
						// Colors in float mode.*****************************************************************************************
						//GL.bindBuffer(GL.ARRAY_BUFFER, reference._VBO_ByteColorsCacheKeys_Container._vbo_byteColors_cacheKeysArray[n].MESH_COLORS_cacheKey);
						//GL.vertexAttribPointer(scene._color, 3, GL.FLOAT, false,0,0);
						  
						// Colors in byte mode.******************************************************************************************
						GL.bindBuffer(GL.ARRAY_BUFFER, vbo_ByteColorsCacheKeys_Container._vbo_byteColors_cacheKeysArray[n].MESH_COLORS_cacheKey);// Test for workers.***
						GL.vertexAttribPointer(standardShader._color, 3, GL.UNSIGNED_BYTE, true,0,0); // In "colors" the argument normalized must be TRUE when is in BYTE.***
				
						GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						GL.drawElements(GL.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
						//GL.drawElements(GL.LINES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
					}
				}
			}
		}
	}

	GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	//---------------------------------------------------
};


f4d_renderer.prototype.render_F4D_simpleBuilding = function(GL, BR_Project, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_shadersManager)
{
	var simpleBuilding = BR_Project._simpleBuilding;
	var storeys_count = simpleBuilding._simpleStoreys_list.length;
	if(storeys_count == 0)
	{
		return;
	}

	// Test using f4d_shaderManager.************************
	var shader = f4d_shadersManager.get_f4dShader(1);
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._texcoord);
	GL.enableVertexAttribArray(shader._position);
	//------------------------------------------------------

	  GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);

	  {
		  var move_matrix = BR_Project.move_matrix;
		  
		  GL.uniformMatrix4fv(shader._Mmatrix, false, move_matrix);
		  GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, modelViewProjRelToEye_matrix);
		  GL.uniform3fv(shader._BuildingPosHIGH, BR_Project._buildingPositionHIGH);
		  GL.uniform3fv(shader._BuildingPosLOW, BR_Project._buildingPositionLOW);

		  GL.uniform3fv(shader._encodedCamPosHIGH, encodedCamPosMC_High);
		  GL.uniform3fv(shader._encodedCamPosLOW, encodedCamPosMC_Low);

	  }
	  
	// http://learningwebgl.com/blog/?p=507
	GL.activeTexture(GL.TEXTURE0);
	GL.bindTexture(GL.TEXTURE_2D, simpleBuilding._simpleBuildingTexture);
	GL.uniform1i(shaderProgram.samplerUniform, 0);

	
	for(var i=0; i<storeys_count; i++)
	{
		var storey = simpleBuilding._simpleStoreys_list[i];
		var objects_count = storey._simpleObjects_array.length;
		for(var j=0; j<objects_count; j++)
		{
			var simpleObject = storey._simpleObjects_array[j];
			var vt_arraysCacheKeys_arrays_count = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array.length;
			for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
			{
				var verticesArrays_cacheKey = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array[k]._verticesArray_cacheKey;
				var texcoordsArrays_cacheKey = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array[k]._texcoordsArray_cacheKey;
				var vertices_count = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array[k]._vertices_count;
				
				GL.bindBuffer(GL.ARRAY_BUFFER, verticesArrays_cacheKey);
				GL.vertexAttribPointer(shader._position, 3, GL.FLOAT, false,0,0);
				
				GL.bindBuffer(GL.ARRAY_BUFFER, texcoordsArrays_cacheKey);
				GL.vertexAttribPointer(shader._texcoord, 2, GL.UNSIGNED_BYTE, true,0,0);
				//GL.vertexAttribPointer(scene.textureCoordAttribute, 2, GL.UNSIGNED_BYTE, true,0,0);

				
				GL.drawArrays(GL.TRIANGLES, 0, vertices_count);
			}
		}
		
	}
	
	GL.disableVertexAttribArray(shader._texcoord);
	GL.disableVertexAttribArray(shader._position);
	
	//---------------------------------------------------
	//GL.useProgram(null);
	//GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	//GL.bindBuffer(GL.ARRAY_BUFFER, null);
	//GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	//---------------------------------------------------
};

f4d_renderer.prototype.render_F4D_simpleBuilding_V1 = function(GL, BR_Project, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_manager, imageLod)
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
	
	//imageLod = 3; // The lowest lod.***
	
	//if(f4d_manager.isCameraMoving)
	//	imageLod = 3; // The lowest lod.***

	var shader = f4d_shadersManager.get_f4dShader(4);
	var shaderProgram = shader.SHADER_PROGRAM;
	
	  GL.uniform3fv(shader._BuildingPosHIGH, BR_Project._buildingPositionHIGH);
	  GL.uniform3fv(shader._BuildingPosLOW, BR_Project._buildingPositionLOW);

	// http://learningwebgl.com/blog/?p=507
	//GL.activeTexture(GL.TEXTURE0);

	if(imageLod == 3)
		GL.bindTexture(GL.TEXTURE_2D, simpBuildV1._simpleBuildingTexture);
	if(imageLod == 0)
		GL.bindTexture(GL.TEXTURE_2D, simpBuildV1._texture_0);
	
	GL.uniform1i(shaderProgram.samplerUniform, 0);
	
	// single interleaved buffer mode.************************************************************************************
	//for(var i=0; i<simpObjs_count; i++)
	{

		this.simpObj_scratch = simpBuildV1._simpleObjects_array[0];

		//var vt_arraysCacheKeys_arrays_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array.length;
		//for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
		{
			var vertices_count = this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._vertices_count;
			
			//this.dateSC = new Date();
			//this.startTimeSC = this.dateSC.getTime();
			/*
			if(!GL.isBuffer(this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey))
			{
				// GL.isBuffer(...) is very expensive.!!!
				// We must reBindBuffer.***
				return; // Provisionally...
			}
			*/
			//-------------------------------------------------------------------------------------------------------------------------------------
			GL.bindBuffer(GL.ARRAY_BUFFER, this.simpObj_scratch._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey);
			GL.vertexAttribPointer(shader._position, 3, GL.FLOAT, false,20,0);
			GL.vertexAttribPointer(shader._texcoord, 2, GL.UNSIGNED_SHORT, true,20,12);
			
			//GL.vertexAttribPointer(shader._position, 3, GL.FLOAT, false,16,0); // Old.***
			//GL.vertexAttribPointer(shader._texcoord, 2, GL.UNSIGNED_SHORT, true,16,12); // Old.***

			GL.drawArrays(GL.TRIANGLES, 0, vertices_count);
			//--------------------------------------------------------------------------------------------------------------------------------------
			//this.dateSC = new Date();
			//this.currentTimeSC = this.dateSC.getTime();
			//f4d_manager.f4d_rendering_time += this.currentTimeSC - this.startTimeSC;
		}
	
	}
	
};
	
// Unique color selection tutorial. http://coffeesmudge.blogspot.kr/2013/08/implementing-picking-in-webgl.html
// Unique color selection tutorial. http://learningwebgl.com/blog/?p=1786	
	
f4d_renderer.prototype.render_F4D_compRefList_forColorSelection = function(GL, compRefList_array, BR_Project, modelViewProjRelToEye_matrix, encodedCamPosMC_High, encodedCamPosMC_Low, f4d_shadersManager)
{
	//http://www.lighthouse3d.com/tutorials/opengl-selection-tutorial/
	
	var compRefLists_count = compRefList_array.length;
	if(compRefLists_count == 0)return;
	
	  GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);
	  
	// Test using f4d_shaderManager.************************
	var shader = f4d_shadersManager.get_f4dShader(2);
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._position);
	//------------------------------------------------------

	  // Test son.**************************************************  
	  GL.useProgram(shaderProgram);

	  var byteCol_r_location = GL.getUniformLocation(shaderProgram, "byteColor_r");
	  var byteCol_g_location = GL.getUniformLocation(shaderProgram, "byteColor_g");
	  var byteCol_b_location = GL.getUniformLocation(shaderProgram, "byteColor_b");
	  // End test son.----------------------------------------------


//    	  Entity.prototype._getModelMatrix = function(time, result) {
//    	        var position = Property.getValueOrUndefined(this._position, time, positionScratch);
//    	        if (!defined(position)) {
//    	            return undefined;
//    	        }
//    	        var orientation = Property.getValueOrUndefined(this._orientation, time, orientationScratch);
//    	        if (!defined(orientation)) {
//    	            result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
//    	        } else {
//    	            result = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, result);
//    	        }
//    	        return result;
//    	    };
		
		  
	  //if(defined(context._us._modelView))
	  {
		  var move_matrix = BR_Project.move_matrix;

		  GL.uniformMatrix4fv(shader._Mmatrix, false, move_matrix);
		  GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, modelViewProjRelToEye_matrix);
		  GL.uniform3fv(shader._BuildingPosHIGH, BR_Project._buildingPositionHIGH);
		  GL.uniform3fv(shader._BuildingPosLOW, BR_Project._buildingPositionLOW);

		  GL.uniform3fv(shader._encodedCamPosHIGH, encodedCamPosMC_High);
		  GL.uniform3fv(shader._encodedCamPosLOW, encodedCamPosMC_Low);
	  }

	  //GL.disableVertexAttribArray(scene._color); // OFF the colorArrays of the vbo.***
	  //GL.disableVertexAttribArray(scene._texcoord_Tex); 
	  
	// ------------------------------------------------------------------------------------- //  
	this.byteColorAux._byte_r = 0;
	this.byteColorAux._byte_g = 0;
	this.byteColorAux._byte_b = 0;
	
	var compRefObjects_counter = 0; // we use this to codify the rgb_coded color.***

	for(var j=0; j<compRefLists_count; j++)
	{
		var compRefList = compRefList_array[j];
		var myBlocksList = BR_Project._blocksList_Container._BlocksListsArray[compRefList._lodLevel];  // new for use workers.***
		var compReferences_count = compRefList._compoundRefsArray.length;
		//if(compReferences_count > 1)compReferences_count =1;// delete this.!!!!!!!!!!!!!!
		for(var k=0; k<compReferences_count; k++)
		{
			var compReference = compRefList._compoundRefsArray[k];
			var references_count = compReference._referencesList.length;
			//if(references_count>1)references_count=1; // Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			for(var m=0; m<references_count; m++)
			{
				var reference = compReference._referencesList[m];
				var block_idx = reference._block_idx;
				var block = myBlocksList.getBlock(block_idx);

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{
					var ifc_entity = block.mIFCEntityType;
					if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
						continue;
					
					//var vi_arrays_count = block._vi_arrays_Container._meshArrays.length;
					var cacheKeys_count = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					
					//var transfMatrix = new Float32Array(16);
					var refMatrix = reference._matrix4._floatArrays;

					//transfMatrix = Matrix4.multiply(move_matrix, refMatrix, transfMatrix);
					GL.uniformMatrix4fv(shader._RefTransfMatrix, false, refMatrix);
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block._vi_arrays_Container._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray[n];
						var indices_count = this.vbo_vi_cacheKey_aux.indices_count;
						
						  GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						  GL.vertexAttribPointer(shader._position, 3, GL.FLOAT, false,0,0);
						
						  GL.uniform1i(byteCol_r_location, this.byteColorAux._byte_r);
						  GL.uniform1i(byteCol_g_location, this.byteColorAux._byte_g);
						  GL.uniform1i(byteCol_b_location, this.byteColorAux._byte_b);
				
						  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						  GL.drawElements(GL.TRIANGLES, indices_count, GL.UNSIGNED_SHORT, 0);
						  //--------------------------------------------------------------------
						  this.byteColorAux._byte_b +=1;
						  if(this.byteColorAux._byte_b == 255)
						  {
							  this.byteColorAux._byte_b = 0;
							  this.byteColorAux._byte_g += 1;
							  if(this.byteColorAux._byte_g == 255)
							  {
								  this.byteColorAux._byte_g = 0;
								  this.byteColorAux._byte_r += 1;
								  if(this.byteColorAux._byte_r == 255)
								  { 
									  // this is the limit.***
									  //var hhh=0;
									  //hhh++;
								  }
							  }
						  }
					}
				}
			}
		}
	}

	//GL.useProgram(null);
	//GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	//GL.bindBuffer(GL.ARRAY_BUFFER, null);
	//GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	//---------------------------------------------------
	
};	
	
/*
function render_F4D_drawArrays(scene, objects3D_array)
    {
		var obj_count = objects3D_array.length;
		if(obj_count == 0)return;

    	var GL = scene.context._gl;
    	var context = scene.context;
		
		GL.useProgram(scene.SHADER_PROGRAM_Tex);

		  GL.enable(GL.DEPTH_TEST);
		  GL.depthFunc(GL.LEQUAL); 
		  GL.depthRange(0, 1);

    	  //if(defined(context._us._modelView))
    	  {
    		  var position = Cesium.Cartesian3.fromDegrees(-114.0, 40.0, 3000.0);
    		  
    		  var view_matrix = new Float32Array(16);
    		  Matrix4.toArray(context._us._modelView, view_matrix);
    		  var projection_matrix = new Float32Array(16);
    		  Matrix4.toArray(context._us._projection, projection_matrix); // Original.***
			  //Matrix4.toArray(context._us._modelViewProjection, projection_matrix); // Test.***
    		  var move_matrix = new Float32Array(16);
    		  var orientation = new Cartesian3(0,0,0);
    		  move_matrix = Transforms.eastNorthUpToFixedFrame(position, undefined, move_matrix);
    		  
    		  GL.uniformMatrix4fv(scene._Pmatrix, false, projection_matrix);
	    	  GL.uniformMatrix4fv(scene._Vmatrix, false, view_matrix);
	    	  GL.uniformMatrix4fv(scene._Mmatrix, false, move_matrix);
    	  }
    	  
    	// ------------------------------------------------------------------------------------- //  
		// http://learningwebgl.com/blog/?p=507
		//gl.activeTexture(gl.TEXTURE0);
		//gl.bindTexture(gl.TEXTURE_2D, neheTexture);
		//gl.uniform1i(shaderProgram.samplerUniform, 0);
	
		for(var j=0; j<obj_count; j++)
		{
			var simpleObject = objects3D_array[j];
			var vt_arraysCacheKeys_arrays_count = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array.length;
			for(var k=0; k<vt_arraysCacheKeys_arrays_count; k++)
			{
				var verticesArrays_cacheKey = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array[k]._verticesArray_cacheKey;
				var texcoordsArrays_cacheKey = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array[k]._texcoordsArray_cacheKey;
				var vertices_count = simpleObject._vtCacheKeys_container._vtArrays_cacheKeys_array[k]._vertices_count;
				
				GL.bindBuffer(GL.ARRAY_BUFFER, verticesArrays_cacheKey);
				GL.vertexAttribPointer(scene._position, 3, GL.FLOAT, false,0,0);
				
				GL.bindBuffer(GL.ARRAY_BUFFER, texcoordsArrays_cacheKey);
				GL.vertexAttribPointer(scene._position, 2, GL.FLOAT, false,0,0);
				
				GL.drawArrays(GL.GL_TRIANGLE, 0, vertices_count);
			}

		}

		
		GL.useProgram(null);


        GL.bindFramebuffer(GL.FRAMEBUFFER, null);
		GL.bindBuffer(GL.ARRAY_BUFFER, null);
	    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
		//---------------------------------------------------
		
    };
	*/
	
	
//# sourceURL=f4d_renderer.js
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	