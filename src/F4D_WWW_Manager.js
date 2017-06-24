



// Microsoft office product key = RJKNH-YDDQD-X72R4-WF83J-JFHBB

//**************************************************************************************************************************//
// F4d_wwwManager.**********************************************************************************************************//
var F4d_wwwManager = function()
{
	this.isCameraMoving = false;
	
};

//**************************************************************************************************************************//
// F4d renderable layer.****************************************************************************************************//
var F4d_wwwLayer = function()
{
	this.wwd = undefined;
	this.f4d_wwwManager = new F4d_wwwManager();
	this.f4dBR_buildingProjectsList = new f4d_BR_buildingProjectsList(); // Old. Provisionally for f4d projects.*** !!!
	this._BR_buildingsArray = []; // for f4d buildings.***
	this.f4d_terranTile = new f4d_TerranTile();
	this.f4d_readerWriter = new f4d_ReaderWriter();
	this.f4d_shadersManager = new f4d_ShadersManager();
	this.f4dRenderer = new f4d_renderer();
	
	this.encodedCamPosMC_High = new Float32Array(3);
	this.encodedCamPosMC_Low = new Float32Array(3); 
	this.modelViewProjectionRelToEye = new Float32Array(16); 
	
	this.compRefList_array = undefined;
	this.compRefList_array_background = undefined;
	this.intCRefList_array = [];
	
	//
	this.currentVisibleBuildings_array = [];
	this.currentVisibleBuildings_LOD0_array = [];
	this.currentVisibleBuildingsPost_array = [];
	this.currentVisible_terranTiles_array = [];
	
	
	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	
	this.filteredVisibleTiles_array = [];
	this.detailedVisibleTiles_array = [];
	this.LOD0VisibleTiles_array = [];
	
	this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	this.min_squaredDist_to_see_LOD0 = 70000; // 600m.***
	this.min_squaredDist_to_see = 5000000;
	this.min_squaredDist_to_see_smallBuildings = 500000;
	
	// mago3d.******************************************************
	this.magoCManager = new CesiumManager();
	
};

F4d_wwwLayer.prototype.new_BR_Project = function()
{
	//var titol = "holes a tothom"
	//var br_buildingProject = new f4d_BR_buildingProject({Titol : titol});
	var br_buildingProject = new f4d_BR_buildingProject();
	this._BR_buildingsArray.push(br_buildingProject);
	return br_buildingProject;
};

F4d_wwwLayer.prototype.calculate_encodedCameraPositionMC_HighLow = function(encodedCamPosMC_High, encodedCamPosMC_Low, cameraPosition)
{
	f4dGeoModifier = new f4d_geometryModifier();
	var eyePoint = cameraPosition;
	var eyePosHIGH = new Float32Array(3);
	var eyePosLOW = new Float32Array(3);
	
	var eyePosSplit_x = new f4d_splitValue();
	eyePosSplit_x = f4dGeoModifier.Calculate_splitValues(eyePoint[0], eyePosSplit_x);
	var eyePosSplit_y = new f4d_splitValue();
	eyePosSplit_y = f4dGeoModifier.Calculate_splitValues(eyePoint[1], eyePosSplit_y);
	var eyePosSplit_z = new f4d_splitValue();
	eyePosSplit_z = f4dGeoModifier.Calculate_splitValues(eyePoint[2], eyePosSplit_z);
	
	encodedCamPosMC_High[0] = eyePosSplit_x.high;
	encodedCamPosMC_High[1] = eyePosSplit_y.high;
	encodedCamPosMC_High[2] = eyePosSplit_z.high;
	
	encodedCamPosMC_Low[0] = eyePosSplit_x.low;
	encodedCamPosMC_Low[1] = eyePosSplit_y.low;
	encodedCamPosMC_Low[2] = eyePosSplit_z.low;
			
			
	/*		
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	encodedCamPosMC_High[0] = camSplitVelue_X.high;
	encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	*/
};

F4d_wwwLayer.prototype.calculate_modelViewProjectionMatrixRelativeToEye = function(dc)
{
	// www dependency.****
	var modelViewRelToEye = WorldWind.Matrix.fromIdentity();
	modelViewRelToEye.copy(dc.navigatorState.modelview);
	modelViewRelToEye[3] = 0.0;
	modelViewRelToEye[7] = 0.0;
	modelViewRelToEye[11] = 0.0;
  
	var projection = WorldWind.Matrix.fromIdentity();
	projection.copy(dc.navigatorState.projection);
  
	var modelViewProjectionRelToEye_aux = WorldWind.Matrix.fromIdentity();
	modelViewProjectionRelToEye_aux.copy(projection);
	modelViewProjectionRelToEye_aux.multiplyMatrix(modelViewRelToEye);
  
	// End Calculate modelViewProjectionRelToEye.--------------------------------------------

	var columnMajorArrayAux = WorldWind.Matrix.fromIdentity();
	var columnMajorArray = modelViewProjectionRelToEye_aux.columnMajorComponents(columnMajorArrayAux); // Original.***
  
	for(var i=0; i<16; i++)
	{
		this.modelViewProjectionRelToEye[i] = columnMajorArray[i]; 
	}

};

F4d_wwwLayer.prototype.render = function(dc)
{
    // Function for WebWorldWind.*********************************************************************************************************
	// Function for WebWorldWind.*********************************************************************************************************

    // Now, we add to orderedRenderable the buildings that wants to render. PENDENT.***
	
    dc.addOrderedRenderable(this, 1000.0); // 1000 = distance to eye.*** Provisionally, we render all.***
	
};

F4d_wwwLayer.prototype.renderOrdered = function(dc)
{
    // Function for WebWorldWind.*********************************************************************************************************
	// Function for WebWorldWind.*********************************************************************************************************
    // Provisional function.***
    //this.render_F4D_compRefListWWW(dc, this._compRefList_Container._compRefsList_Array, this, this.f4d_shadersManager);
	/*
	var projectionMatrix = WorldWind.Matrix.fromIdentity();
	var viewport = this.wwd.viewport;
	projectionMatrix.setToPerspectiveProjection(viewport.width, viewport.height, 0.1, this.wwd.navigator.farDistance);
    dc.navigatorState = new WorldWind.NavigatorState(dc.navigatorState.modelview, projectionMatrix, viewport, dc.navigatorState.heading, dc.navigatorState.tilt);
	*/
	this.render_Tiles(dc);
};

F4d_wwwLayer.prototype.calculate_splitedBuildingPosition = function(BR_Project, globe)
{
	var origin = new WorldWind.Vec3(0, 0, 0);
	var result = new WorldWind.Vec3(0, 0, 0);

	var latitude = BR_Project._header._latitude;
	var longitude = BR_Project._header._longitude;
	var height = BR_Project._header._elevation;
	
	// Note: recalculate the elevation of the building.***
	var elevation = globe.elevationAtLocation(latitude, longitude);
	
	if(elevation < 0.1)
	{
		var hola = 0;
	}
	var buildingHeight = BR_Project._header._boundingBox.get_zLength();
	
	height = elevation+buildingHeight/2.0 - 1.0;
	origin = globe.computePointFromPosition(latitude, longitude, height, result);
	
	BR_Project._buildingPosition = origin;
	
	var buildingPosSplit_x = new f4d_splitValue();
	buildingPosSplit_x = f4dGeoModifier.Calculate_splitValues(origin[0], buildingPosSplit_x);
	var buildingPosSplit_y = new f4d_splitValue();
	buildingPosSplit_y = f4dGeoModifier.Calculate_splitValues(origin[1], buildingPosSplit_y);
	var buildingPosSplit_z = new f4d_splitValue();
	buildingPosSplit_z = f4dGeoModifier.Calculate_splitValues(origin[2], buildingPosSplit_z);
	
	BR_Project._buildingPositionHIGH = new Float32Array(3);
	BR_Project._buildingPositionLOW = new Float32Array(3);

	BR_Project._buildingPositionHIGH[0] = buildingPosSplit_x.high; 
	BR_Project._buildingPositionHIGH[1] = buildingPosSplit_y.high;
	BR_Project._buildingPositionHIGH[2] = buildingPosSplit_z.high;
	
	BR_Project._buildingPositionLOW[0] = buildingPosSplit_x.low;
	BR_Project._buildingPositionLOW[1] = buildingPosSplit_y.low;
	BR_Project._buildingPositionLOW[2] = buildingPosSplit_z.low;
	
	// Now, make the extent of the building, for do frustum culling.***
	// For now, there are only one segment.***
	var building_semi_height = (BR_Project._header._boundingBox._maxZ - BR_Project._header._boundingBox._minZ)/2.0;
	BR_Project.segments_array[0].point_1.set(origin[0], origin[1], origin[2]-building_semi_height);
	BR_Project.segments_array[0].point_2.set(origin[0], origin[1], origin[2]+building_semi_height);
};

F4d_wwwLayer.prototype.render_Tiles = function(dc)
{
	
	var GL = dc.currentGlContext;
	var cameraPosition = dc.navigatorState.eyePoint;
	
	// 1rst, do frustum culling.**********************************************
	if(!this.f4d_wwwManager.isCameraMoving)
	{
		//this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // test ok.***
		this.currentVisibleBuildings_array.length = 0; // Init.***
		var cullingVolume = dc.navigatorState.frustumInModelCoordinates;
		
		// Init the visible buildings array.***
		this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
		this.detailed_building = undefined;
	
		this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // test ok.***
		this.doFrustumCulling_terranTile_serviceFormat(GL, cullingVolume, this.currentVisibleBuildings_array, cameraPosition); 
	}
	
	GL.disable(GL.CULL_FACE); // Optional.***
	
	
	
	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculate_encodedCameraPositionMC_HighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
	this.calculate_modelViewProjectionMatrixRelativeToEye(dc); 
	
	// *************************************************************************************************************************************************
	// Now, render the detailed building if exist.******************************************************************************************************
	var transformedCamPos = undefined;
	if(this.detailed_building) // && isLastFrustum)
	{
		// Test for background task.*******************************************
		//this.worker_sonGeometry.building_project = scene.detailed_building;
		// End for Test for background task.-----------------------------------

		// must make a relative camera for the building, to do octrees frustum culling.***
		transformedCamPos = this.detailed_building.getTransformedRelativeEyePosition_toBuilding(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
		this.isCameraInsideBuilding = this.detailed_building.isCameraInsideOfBuilding(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
		if(!this.f4d_wwwManager.isCameraMoving)
		{
			// Determine if the camera is inside of the building.***
			this.intCRefList_array.length = 0; // Init.***

			if(this.isCameraInsideBuilding)
			{
				//if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
				
				if(this.detailed_building.buildingPosMat_inv == undefined)
				{
				  this.detailed_building.buildingPosMat_inv = new f4d_Matrix4();
				  this.detailed_building.buildingPosMat_inv.setByFloat32Array(this.detailed_building.move_matrix_inv);
				}
				
				/*
				// code from navigatorState.***********************************************************************************
				this.frustumInModelCoordinates = null;
				// Compute the frustum in model coordinates. Start by computing the frustum in eye coordinates from the
				// projection matrix, then transform this frustum to model coordinates by multiplying its planes by the
				// transpose of the modelview matrix. We use the transpose of the modelview matrix because planes are
				// transformed by the inverse transpose of a matrix, and we want to transform from eye coordinates to model
				// coordinates.
				var modelviewTranspose = Matrix.fromIdentity();
				modelviewTranspose.setToTransposeOfMatrix(this.modelview);
				this.frustumInModelCoordinates = Frustum.fromProjectionMatrix(this.projection);
				this.frustumInModelCoordinates.transformByMatrix(modelviewTranspose);
				this.frustumInModelCoordinates.normalize();
				// End----------------------------------------------------------------------------------------------------------
				*/
				
				var modelViewRelToEye = WorldWind.Matrix.fromIdentity();
				modelViewRelToEye.copy(dc.navigatorState.modelview);
				modelViewRelToEye[3] = 0.0;
				modelViewRelToEye[7] = 0.0;
				modelViewRelToEye[11] = 0.0;
				
				var modelviewTranspose = WorldWind.Matrix.fromIdentity();
				modelviewTranspose.setToTransposeOfMatrix(modelViewRelToEye);
				
				var frustumRelToEye = WorldWind.Frustum.fromProjectionMatrix(dc.navigatorState.projection);
				frustumRelToEye.transformByMatrix(modelviewTranspose);
				frustumRelToEye.normalize();
			
				// then do frustum culling for interior octree.***
				this.detailed_building.octree.getFrustumVisibleCRefListArray(frustumRelToEye, this.intCRefList_array, this.boundingSphere_Aux, transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
				for(var i=0; i<this.intCRefList_array.length; i++)
				{
					this.intCRefList_array[i].update_currentVisibleIndices_Interior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
				}
			}
			this.detailed_building.update_currentVisibleIndices_exterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
		}

		
		//if(picking)// refrence: http://learningwebgl.com/blog/?p=1786
		//var frameState = scene._frameState;
		
		// 1rst, the exterior model.***
		this.f4dRenderer.render_F4D_compRefLists_v1(GL, this.detailed_building._compRefList_Container._compRefsList_Array, this.detailed_building, 
			this.modelViewProjectionRelToEye, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, false);
			
		// Now, the interior model.***
		if(this.isCameraInsideBuilding && this.intCRefList_array.length > 0)// && isLastFrustum)
		{
			this.f4dRenderer.render_F4D_compRefLists_v1(GL, this.intCRefList_array, this.detailed_building, 
				this.modelViewProjectionRelToEye, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, true);
		}

	}
	
	// End render the detailed building if exist.---------------------------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------------------------------------------------------------------
	
	
	
	
	
	// Now, render the simple visible buildings.***************************************************************************
	var shader = this.f4d_shadersManager.get_f4dShader(4); // f4dTextureSimpleObjectA1Shader
	if(shader == undefined)
	{
		var h=0;
	}
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._texcoord);
	GL.enableVertexAttribArray(shader._position);
	
	GL.enable(GL.DEPTH_TEST);
	  GL.depthFunc(GL.LEQUAL); 
	  GL.depthRange(0, 1);

	  GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjectionRelToEye);
	  GL.uniform3fv(shader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	  GL.uniform3fv(shader._encodedCamPosLOW, this.encodedCamPosMC_Low);

	GL.activeTexture(GL.TEXTURE0);
	//------------------------------------------------------
	this.render_time = 0;
	/*
	if(this.isCameraMoving)
	{
		this.dateSC = new Date();
		this.currentTimeSC = undefined;
		this.startTimeSC = this.dateSC.getTime();
	}
	*/
	
	////////////////////////////////////
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	
	
	//*******************************************************************************************************************************
	// LOD0 BUILDINGS.***************************************************************************************************************
	//this.filteredVisibleTiles_array.length;
	//this.detailedVisibleTiles_array.length;
	//this.LOD0VisibleTiles_array.length;
	
	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
	var buildingComplexCalculationsCount = 0;
	var max_buildingComplexCal = 30;
	for(var i=0; i<LOD0_projectsCount; i++)
	{
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
		
		//if(!this.isCameraMoving)
		{
				// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
				if(BR_Project._header._f4d_version == 2)
				{
					//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
					var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
					if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
					{
						
						if(buildingComplexCalculationsCount > max_buildingComplexCal)
							continue;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						var vt_cacheKey = simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0];
						
						// interleaved vertices_texCoords.***
						vt_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
						GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._verticesArray_cacheKey);
						GL.bufferData(GL.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer, GL.STATIC_DRAW);
						simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer = null;
						
						// normals.***
						if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer != undefined)
						{
							vt_cacheKey._normalsArray_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._normalsArray_cacheKey);
							GL.bufferData(GL.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer, GL.STATIC_DRAW);
							simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer = null;
						}

						// Simple building texture(create 1pixel X 1pixel bitmap).****************************************************
						// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
						if(simpBuildingV1._simpleBuildingTexture == undefined)
								simpBuildingV1._simpleBuildingTexture = GL.createTexture();
						
						// Test wait for texture to load.********************************************
						//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
						GL.bindTexture(GL.TEXTURE_2D, simpBuildingV1._simpleBuildingTexture);
						//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
						GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
						GL.bindTexture(GL.TEXTURE_2D, null);
						BR_Project._f4d_nailImage_readed_finished = true;
						
						//continue;
						buildingComplexCalculationsCount++;
						
					}
					else if(!BR_Project._f4d_nailImage_readed)
					{
						if(this.backGround_imageReadings_count < 100)
						{
							if(buildingComplexCalculationsCount > max_buildingComplexCal)
							continue;
						
							this.backGround_imageReadings_count++;
							BR_Project._f4d_nailImage_readed = true;
							
							var simpBuildingV1 = BR_Project._simpleBuilding_v1;
							///////////////////////////////////////////////////////////
							this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
							//--------------------------------------------------------------------------
							buildingComplexCalculationsCount++;
						
						}
						//continue;
					}
					
					// Original.***
					else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists)
					{
						// this.textureArrayBuffer_lod0
						if(!this.f4d_wwwManager.isCameraMoving && this.backGround_fileReadings_count < 1)
						{
							if(buildingComplexCalculationsCount > max_buildingComplexCal)
							continue;
						
							//filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
							filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/Images/" + BR_Project._header._global_unique_id + ".jpg";
							
							this.f4d_readerWriter.readF4D_NailImage_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this, 0); 
							this.backGround_fileReadings_count ++;
							
							buildingComplexCalculationsCount++;
							

						}
						//continue;
					}
					/*
					else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists)
					{
						// this.textureArrayBuffer_lod0
						if(!this.f4d_wwwManager.isCameraMoving && this.backGround_fileReadings_count < 1)
						{
							filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/Images/" + BR_Project._header._global_unique_id + ".jpg";
							
							//this.f4d_readerWriter.readF4D_NailImage_inServer(GL, filePath_scratch, BR_Project, this.f4d_readerWriter, this, 0); 
							this.f4d_readerWriter.readF4D_ImageAsArrayBuffer_inServer(GL, filePath_scratch, BR_Project, 0);
							this.backGround_fileReadings_count ++;

						}
						//continue;
					}
					else if(BR_Project._f4d_lod0Image_readed_finished && BR_Project._f4d_lod0Image_exists)
					{
						// this.textureArrayBuffer_lod0
						if(!this.f4d_wwwManager.isCameraMoving && this.backGround_fileReadings_count < 1)
						{
							var simpBuildingV1 = BR_Project._simpleBuilding_v1;
							///////////////////////////////////////////////////////////
							this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 0);

						}
						continue;
					}
					*/
				}
				else{
					this.currentVisibleBuildingsPost_array.push(BR_Project);
				}
		
		
		}
		
		//--------------------------------------------------------------------------------------------------------------
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1)// Test
		{
			// Independency version.*******************************************************************************************
			// Check if there are "BR_Project._buildingPositionHIGH" & "BR_Project._buildingPositionLOW".***
			if(BR_Project._buildingPositionHIGH == undefined)
			{
				this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
				
			}
			// End independency version.---------------------------------------------------------------------------------------
	
			if(BR_Project._f4d_lod0Image_exists)
			{
				if(BR_Project._f4d_lod0Image_readed_finished)
					this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this.modelViewProjectionRelToEye, 
						this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, 0); // 0 = lod0.***
						//this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, 3); // test.***
				else if(BR_Project._f4d_nailImage_readed_finished)
				{
					this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this.modelViewProjectionRelToEye, 
						this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, 3); // 3 = lod3.***
				}
			}
			else if(BR_Project._f4d_nailImage_readed_finished)
			{
				this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this.modelViewProjectionRelToEye, 
					this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, 3); // 3 = lod3.***

			}
		}
	}
	
	//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++)
	{
		/*
		if(!isLastFrustum && this.isCameraMoving && timeControlCounter == 0)
		{
			date = new Date();
			currentTime = date.getTime();
			secondsUsed = currentTime - startTime;
			if(secondsUsed > 20) // miliseconds.***
			{
				GL.disableVertexAttribArray(shader._texcoord);
				GL.disableVertexAttribArray(shader._position);
				return;
			}
			
		}
		*/
		
		var BR_Project = this.currentVisibleBuildings_array[p_counter];
		
		//if(!this.isCameraMoving)
		{
				// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
				if(BR_Project._header._f4d_version == 2)
				{
					//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
					var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
					if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null)
					{
						if(buildingComplexCalculationsCount > max_buildingComplexCal)
							continue;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						var vt_cacheKey = simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0];
						
						// interleaved vertices_texCoords.***
						vt_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
						GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._verticesArray_cacheKey);
						GL.bufferData(GL.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer, GL.STATIC_DRAW);
						simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer = null;
						
						// normals.***
						
						if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer != undefined)
						{
							vt_cacheKey._normalsArray_cacheKey = GL.createBuffer ();
							GL.bindBuffer(GL.ARRAY_BUFFER, vt_cacheKey._normalsArray_cacheKey);
							GL.bufferData(GL.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer, GL.STATIC_DRAW);
							simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer = null;
						}

						// Simple building texture(create 1pixel X 1pixel bitmap).****************************************************
						// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
						if(simpBuildingV1._simpleBuildingTexture == undefined)
								simpBuildingV1._simpleBuildingTexture = GL.createTexture();
						
						// Test wait for texture to load.********************************************
						//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
						GL.bindTexture(GL.TEXTURE_2D, simpBuildingV1._simpleBuildingTexture);
						//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
						GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
						GL.bindTexture(GL.TEXTURE_2D, null);
						BR_Project._f4d_nailImage_readed_finished = true;
						//continue;
						buildingComplexCalculationsCount++;
						
					}
					
					else if(!BR_Project._f4d_nailImage_readed)
					{
						if(this.backGround_imageReadings_count < 100)
						{
							if(buildingComplexCalculationsCount > max_buildingComplexCal)
							continue;
						
							this.backGround_imageReadings_count++;
							BR_Project._f4d_nailImage_readed = true;
							
							var simpBuildingV1 = BR_Project._simpleBuilding_v1;
							//--------------------------------------------------------------------------
							///////////////////////////////////////////////////////////
							this.f4d_readerWriter.readF4D_NailImage_ofArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.f4d_readerWriter, this, 3);
							//--------------------------------------------------------------------------
							
							buildingComplexCalculationsCount++;
							
						}
						//continue;
					}
					
				}
				else{
					this.currentVisibleBuildingsPost_array.push(BR_Project);
				}
		
		}
		
		//--------------------------------------------------------------------------------------------------------------
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished)// Test
		{
			if(BR_Project._buildingPositionHIGH == undefined)
			{
				if(buildingComplexCalculationsCount > max_buildingComplexCal)
					continue;
				
				this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
				buildingComplexCalculationsCount++;
				
			}
			
			this.f4dRenderer.render_F4D_simpleBuilding_V1(GL, BR_Project, this.modelViewProjectionRelToEye, 
				this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this, 3); // 3 = lod3.***
		}
		/*
		if(this.isCameraMoving)
		{
			this.dateSC = new Date();
			this.currentTimeSC = this.dateSC.getTime();
			if(this.currentTimeSC-this.startTimeSC > this.maxMilisecondsForRender)
			{
				GL.disableVertexAttribArray(shader._texcoord);
				GL.disableVertexAttribArray(shader._position);
				return;
			}
		}
		*/
	}
	
	GL.disableVertexAttribArray(shader._texcoord);
	GL.disableVertexAttribArray(shader._position);
	//---------------------------------------------------
	
	
	// Render the lasts simpleBuildings.******************************************************************************************************************************
	var last_simpBuilds_count = this.currentVisibleBuildingsPost_array.length;
	for(var i=0; i<last_simpBuilds_count; i++)
	{
		this.f4dRenderer.render_F4D_simpleBuilding(GL, this.currentVisibleBuildingsPost_array[i], this.modelViewProjectionRelToEye, 
				this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
	}
};

F4d_wwwLayer.prototype.doFrustumCulling = function(frustumVolume, visibleBuildings_array, cameraPosition)
{
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	var squaredDistToCamera = undefined;
	var last_squared_dist = undefined;
	//var noHeaderReadedBuildings_count = 0;
	
	var building_projects_count = this.f4dBR_buildingProjectsList._BR_buildingsArray.length;
	for(var p_counter = 0; p_counter<building_projects_count; p_counter++)
	{
		var BR_Project = this.f4dBR_buildingProjectsList._BR_buildingsArray[p_counter];
		
		
		if(BR_Project._buildingPosition == undefined)
		{
			// this building does not readed the header yet.***
			if(!BR_Project._f4d_header_readed)
			{
				visibleBuildings_array.push(BR_Project);
			}
			continue;
		}
			
		
		//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition); // cesium ver.***
		squaredDistToCamera = cameraPosition.distanceToSquared(BR_Project._buildingPosition);
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		if(BR_Project._header.isSmall && squaredDistToCamera>this.min_squaredDist_to_see_smallBuildings)
			continue;
		/*				
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
		this.radiusAprox_aux = BR_Project.getRadiusAprox();
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}
		*/
		var intersects = frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2);
						
		//var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		//if(frustumCull !== Cesium.Intersect.OUTSIDE) 
		if(intersects)
		{
			
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed)// min dist to see detailed.***
			{
				if(BR_Project._compRefList_Container._compRefsList_Array.length > 0)
				{
					// Detect the Detailed building.***
					if(BR_Project._header._f4d_version == 1)
					{
						if(last_squared_dist)
						{
							if(squaredDistToCamera < last_squared_dist && BR_Project._compRefList_Container._compRefsList_Array.length > 0)
							{
								last_squared_dist = squaredDistToCamera;
								visibleBuildings_array.push(this.detailed_building);
								this.detailed_building = BR_Project;
							}
							else{
								if(BR_Project._compRefList_Container._compRefsList_Array.length > 0)
									visibleBuildings_array.push(BR_Project);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
				}
				else{
					if(BR_Project._header.isSmall)
						visibleBuildings_array.push(BR_Project);
					else
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				
			}
			else if(squaredDistToCamera<this.min_squaredDist_to_see_LOD0)
			{
				if(BR_Project._header.isSmall)
						visibleBuildings_array.push(BR_Project);
					else
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}	
			else{
				visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	return visibleBuildings_array;
};

F4d_wwwLayer.prototype.doFrustumCulling_terranTile_serviceFormat = function(GL, frustumVolume, currentVisibleBuildings_array, cameraPosition)
{
	this.currentVisible_terranTiles_array.length = 0;// Init.***
	this.f4d_terranTile.get_intersectedSmallestTiles(frustumVolume, this.currentVisible_terranTiles_array, this.boundingSphere_Aux);
	
	//************************************************************************************************************************************
	// Find the nearest tile to camera.***************************************************************************************************
	var visibleTiles_count = this.currentVisible_terranTiles_array.length;
	if(visibleTiles_count == 0)
		return;
	
	this.filteredVisibleTiles_array.length = 0;
	this.detailedVisibleTiles_array.length = 0;
	this.LOD0VisibleTiles_array.length = 0;
	
	for(var i=0; i<visibleTiles_count; i++)
	{
		this.terranTileSC = this.currentVisible_terranTiles_array[i];
		
		//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, this.terranTileSC.position); // Cesium version.***
		if(this.terranTileSC.position == undefined)
			continue;
		
		squaredDistToCamera = cameraPosition.distanceToSquared(this.terranTileSC.position);
		
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		if(squaredDistToCamera < this.min_squaredDist_to_see_detailed * 1.2)
		{
			this.detailedVisibleTiles_array.push(this.terranTileSC);
		}
		else if(squaredDistToCamera <  this.min_squaredDist_to_see_LOD0 * 1.2)
		{
			this.LOD0VisibleTiles_array.push(this.terranTileSC);
		}
		else
		{
			this.filteredVisibleTiles_array.push(this.terranTileSC); // Original.***
			//this.LOD0VisibleTiles_array.push(this.terranTileSC); // Test.***
		}
	}
	
	//***************************************************************************************************************
	// Make the visible buildings list.******************************************************************************
	//this.boundingSphere_Aux.radius = 50.0;
	var need_frustumCulling = false;
	var filePath_scratch = undefined;
	var tileNumberNameString = undefined;
	var max_tileFilesReading = 10;
	
	var detailedVisibleTiles_count = this.detailedVisibleTiles_array.length;
	for(var i=0; i<detailedVisibleTiles_count; i++)
	{
		this.terranTileSC = this.detailedVisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/F4D_TerrainTiles/" + tileNumberNameString + ".til";	
				this.f4d_readerWriter.readF4D_TileArrayBuffer_inServer(GL, filePath_scratch, this.terranTileSC, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFile_oneBuilding(GL, this);
			this.terranTileSC.parseFile_allBuildings(this);
			continue;
		}
		
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == 2)
		 need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.detailedVisibleTiles_array[i]._BR_buildingsArray[j];

				
			if(BR_Project._buildingPosition == undefined)
			{
				this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				continue;
			}
			
			//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition); // Cesium version.***
			squaredDistToCamera = cameraPosition.distanceToSquared(BR_Project._buildingPosition);
			
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed)
			{
				// Activate this in the future, when all f4d_projects unified.***
				if(BR_Project._compRefList_Container._compRefsList_Array.length > 0)
				{
					if(BR_Project._header._f4d_version == 1)
					{
						if(last_squared_dist)
						{
							if(squaredDistToCamera < last_squared_dist)
							{
								last_squared_dist = squaredDistToCamera;
								this.currentVisibleBuildings_LOD0_array.push(this.detailed_building);
								this.detailed_building = BR_Project;
							}
							else{
									this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
					
				}
				else{
					if(BR_Project._header.isSmall)
						currentVisibleBuildings_array.push(BR_Project);
					else
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				
			}
			else if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
			{
				if(need_frustumCulling)
				{
					//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					//if(need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
					if(BR_Project._buildingPositionHIGH == undefined)
						this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
					else{
						// Do frustum culling.***
						if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
						{
							this.currentVisibleBuildings_LOD0_array.push(BR_Project);
						}
					}
				}
				else
					this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}
			else
			{
				if(need_frustumCulling)
				{
					//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					//if(need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
					if(BR_Project._buildingPositionHIGH == undefined)
						this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
					else{
						// Do frustum culling.***
						if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
						{
							currentVisibleBuildings_array.push(BR_Project);
						}
					}
				}
				else
					currentVisibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	//***********************************************************************************************************************************************************************
	var LOD0VisiblesTiles_count = this.LOD0VisibleTiles_array.length;
	for(var i=0; i<LOD0VisiblesTiles_count; i++)
	{
		this.terranTileSC = this.LOD0VisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/F4D_TerrainTiles/" + tileNumberNameString + ".til";	
				this.f4d_readerWriter.readF4D_TileArrayBuffer_inServer(GL, filePath_scratch, this.terranTileSC, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFile_oneBuilding(GL, this);
			this.terranTileSC.parseFile_allBuildings(this);
			continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == 2)
		 need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.LOD0VisibleTiles_array[i]._BR_buildingsArray[j];

			if(BR_Project._buildingPosition == undefined)
			{
				currentVisibleBuildings_array.push(BR_Project);
				continue;
			}
			
			//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
			squaredDistToCamera = cameraPosition.distanceToSquared(BR_Project._buildingPosition);
			if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
			{
				
				if(need_frustumCulling)
				{
					//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					//if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
					if(BR_Project._buildingPositionHIGH == undefined)
						this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
					else{
						// Do frustum culling.***
						if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
						{
							this.currentVisibleBuildings_LOD0_array.push(BR_Project);
						}
					}
				}
				else
					this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}
			else
			{
				if(need_frustumCulling)
				{
					//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
					//if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
					if(BR_Project._buildingPositionHIGH == undefined)
						this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
					else{
						// Do frustum culling.***
						if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
						{
							currentVisibleBuildings_array.push(BR_Project);
						}
					}
				}
				else
					currentVisibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	//****************************************************************************************************************************************************************************
	var filteredVisibleTiles_count = this.filteredVisibleTiles_array.length;
	for(var i=0; i<filteredVisibleTiles_count; i++)
	{
		
		this.terranTileSC = this.filteredVisibleTiles_array[i];
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = "/F4D_GeometryData/Result_xdo2f4d/F4D_TerrainTiles/" + tileNumberNameString + ".til";	
				this.f4d_readerWriter.readF4D_TileArrayBuffer_inServer(GL, filePath_scratch, this.terranTileSC, this.f4d_readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFile_oneBuilding(GL, this);
			this.terranTileSC.parseFile_allBuildings(this);
			continue;
		}
		
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == 2)
		 need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.filteredVisibleTiles_array[i]._BR_buildingsArray[j];

			if(BR_Project._buildingPosition == undefined)
			{
				currentVisibleBuildings_array.push(BR_Project);
				continue;
			}
			else
			{
				//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
				squaredDistToCamera = cameraPosition.distanceToSquared(BR_Project._buildingPosition);
				if(BR_Project._header.isSmall)
				{
					
					if(squaredDistToCamera < this.min_squaredDist_to_see_smallBuildings)
					{
						if(need_frustumCulling)
						{
							//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
							//if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
							if(BR_Project._buildingPositionHIGH == undefined)
								this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
							else{
								// Do frustum culling.***
								if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
								{
									currentVisibleBuildings_array.push(BR_Project);
								}
							}
						}
						else
							currentVisibleBuildings_array.push(BR_Project);
					}
				}
				else
				{
					// Provisionally check for LODzero distance.***
					if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
					{
						
						if(need_frustumCulling)
						{
							//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
							//if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
							if(BR_Project._buildingPositionHIGH == undefined)
								this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
							else{
								// Do frustum culling.***
								if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
								{
									this.currentVisibleBuildings_LOD0_array.push(BR_Project);
								}
							}
						}
						else
							this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
					else
					{
						if(need_frustumCulling)
						{
							//this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project._buildingPosition);
							//if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
							if(BR_Project._buildingPositionHIGH == undefined)
								this.calculate_splitedBuildingPosition(BR_Project, this.wwd.globe);
							else{
								// Do frustum culling.***
								if(frustumVolume.intersectsSegment(BR_Project.segments_array[0].point_1, BR_Project.segments_array[0].point_2))
								{
									currentVisibleBuildings_array.push(BR_Project);
								}
							}
						}
						else
						{
							currentVisibleBuildings_array.push(BR_Project);
						}
					}
				}
			}	
			
		}
	}
	
};



















