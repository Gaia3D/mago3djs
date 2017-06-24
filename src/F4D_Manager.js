


//http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html // GOOD TUTORIALS !!!!!!!!!!!!!!!!!!!!!!!!!!!


var f4d_manager = function()
{
	// F4D Data structure & objects.*****************************************
	this.f4dBR_buildingProjectsList = new f4d_BR_buildingProjectsList();
	this.f4dRenderer = new f4d_renderer();
	this.f4dSelection = new f4d_selection();
	this.f4d_shadersManager = new f4d_ShadersManager();
	this.f4d_vboManager = new f4d_vbo_manager();
	
	// Vars.****************************************************************
	this.currentVisibleBuildings_array = [];
	this.detailed_building = undefined;
	//this.boundingSphere_Aux = new Cesium.BoundingSphere(); // Cesium dependency.***
	
	this.radiusAprox_aux = undefined;
	
	this.lastCamPos = new f4d_point3d();
	this.squareDistUmbral = 22.0;
	
	this.encodedCamPosMC_High = new Float32Array(3);
	this.encodedCamPosMC_Low = new Float32Array(3);
	
	this.compRefList_array = undefined;
	this.compRefList_array_background = undefined;
	
	this.currentSelectedObj_idx = -1;
	this.currentByteColorPicked = new Uint8Array(4);
	
	// Workers.****************************************************************************
	/*
	this.worker_sonGeometry = new Worker('../Build/CesiumUnminified/SonWebWorker.js'); 
	//this.worker_sonGeometry.setTest(77.77);
	this.worker_sonGeometry.onmessage = function (event) 
	{
		//document.getElementById('result').textContent = event.data;
		this.compRefList_array = event.data[0];
		
	};
	*/
	
	
	/*  
	this.worker_sonGeometry = new Worker('SonWebWorker.js'); 
	this.worker_sonGeometry.addEventListener('message', function(e) {
		document.getElementById('result').innerHTML  = e.data;
	  }, false);
	*/
	// End workers.------------------------------------------------------------------------
};

f4d_manager.prototype.isCameraMoved = function(cameraPosition)
{
	var camera_was_moved = false;
	var squareDistFromLastPos = this.lastCamPos.squareDistTo(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	if(squareDistFromLastPos>this.squareDistUmbral )
	{
		camera_was_moved = true;
		this.lastCamPos.x = cameraPosition.x;
		this.lastCamPos.y = cameraPosition.y;
		this.lastCamPos.z = cameraPosition.z;
	}
	
	return camera_was_moved;
};

f4d_manager.prototype.update_CameraMoved = function(cameraPosition)
{
	// This function must run in a background process.****
	// call this function if camera was moved.****
	//----------------------------------------------------------------
	
	// 1rst, do frustum culling and find a detailed building.***
	
	
};

f4d_manager.prototype.select_F4D_object = function(GL, _modelViewProjectionRelativeToEye, mousePickPos_x, mousePickPos_y, drawingBufferHeight)
{
	/*
	if(this.detailed_building)
	{

		GL.clearColor(1, 1, 1, 1);
		GL.bindFramebuffer(GL.FRAMEBUFFER, this.f4dSelection.GAIA_selectFrameBuffer);				
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	
		//render_F4D_compRefList_forColorSelection(this, this.compRefList_array, this.detailed_building); // Old.***
		// Calculate "modelViewProjectionRelativeToEye".****************************************************
		var modelViewProjRelToEye_matrix = new Float32Array(16);
		Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, modelViewProjRelToEye_matrix); 
		
		// Color code render.****************************************************************************************************
		if(this.compRefList_array)
		{
			this.f4dRenderer.render_F4D_compRefList_forColorSelection(GL, this.compRefList_array, this.detailed_building, 
				modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
		}
		// End color code render.------------------------------------------------------------------------------------------------

		var pickX = mousePickPos_x;
		var pickY = drawingBufferHeight - mousePickPos_y; // Invert Y axis, bcos webgl has origen in left-down.***
		
		GL.readPixels(pickX, pickY, 1, 1, GL.RGBA, GL.UNSIGNED_BYTE, this.currentByteColorPicked); // Original.***
		//GL.readPixels(0, 0, this.drawingBufferWidth, this.drawingBufferHeight, GL.RGBA, GL.UNSIGNED_BYTE, this.lastCapturedColourMap);// Test, maybe util for deferredRenders....***
		
		this.currentSelectedObj_idx = 255*255*this.currentByteColorPicked[0] + 255*this.currentByteColorPicked[1] + this.currentByteColorPicked[2];
	}
	else
	{
		// For the moment... later we need select simple_buildings too.***
		this.currentSelectedObj_idx = -1;
	}
	*/
	
};

f4d_manager.prototype.render_F4D_Projects = function(GL, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye)
{
	/*
	GL.disable(GL.CULL_FACE); // Optional.***
	
	// Check if camera was moved considerably for update the renderables objects.***
	var cameraMoved = this.isCameraMoved(cameraPosition);
	if(cameraMoved)
	{
		this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // test ok.***
	}
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	var modelViewProjRelToEye_matrix = new Float32Array(16);
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	// Calculate encodedCamPosMC high and low values.********************************************************
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	this.encodedCamPosMC_High[0] = camSplitVelue_X.high;
	this.encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	this.encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	this.encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	this.encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	
	//var us = context._us;
	//this.encodedCamPosMC_High[0] = us._encodedCameraPositionMC.high.x;
	//this.encodedCamPosMC_High[1] = us._encodedCameraPositionMC.high.y;
	//this.encodedCamPosMC_High[2] = us._encodedCameraPositionMC.high.z;
	//this.encodedCamPosMC_Low[0] = us._encodedCameraPositionMC.low.x;
	//this.encodedCamPosMC_Low[1] = us._encodedCameraPositionMC.low.y;
	//this.encodedCamPosMC_Low[2] = us._encodedCameraPositionMC.low.z;
	// End Calculate encodedCamPosMC high and low values.------------------------------------------------------
	
	// Now, render the detailed building if exist.**********************************************************
	var transformedRelEyePoint3d = undefined;
	if(this.detailed_building)
	{
		// Test for background task.*******************************************
		//this.worker_sonGeometry.building_project = scene.detailed_building;
		// End for Test for background task.-----------------------------------

		if(cameraMoved)
		{
			// 1rst, Determine the relative eye position.***************************************************************************
			//transformedRelEyePoint3d = this.detailed_building.getTransformedRelativeEyePosition_toBuilding(cameraPosition.x, cameraPosition.y, cameraPosition.z);
			//this.compRefList_array = this.detailed_building.getVisibleCompRefLists(transformedRelEyePoint3d.x, transformedRelEyePoint3d.y, transformedRelEyePoint3d.z);// with occlusion culling.***
		}
		
		//if(picking)// refrence: http://learningwebgl.com/blog/?p=1786
		
		if(this.compRefList_array)
		{
			this.f4dRenderer.render_F4D_compRefList(GL, this.compRefList_array, this.detailed_building, 
				modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
				
			//this.f4dRenderer.render_F4D_compRefList_forColorSelection(GL, this.compRefList_array, this.detailed_building, 
			//	modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
		}
	}
	// End render the detailed building if exist.-------------------------------------------------------------
	
	// Now, render the simple visible buildings.***************************************************************************
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++)
	{
		var BR_Project = this.currentVisibleBuildings_array[p_counter];
		
		this.f4dRenderer.render_F4D_simpleBuilding(GL, BR_Project, modelViewProjRelToEye_matrix, 
			this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.f4d_shadersManager);
	}
	
	//---------------------------------------------------
	
	GL.useProgram(null);
	GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	//---------------------------------------------------
	*/
};

f4d_manager.prototype.doFrustumCulling = function(frustumVolume, visibleBuildings_array, cameraPosition)
{
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	/*
	// Init the visible buildings array.***
	visibleBuildings_array.length = 0;
	this.detailed_building = undefined;
	
	var min_squaredDist_to_see_detailed = 40000;
	var min_squaredDist_to_see = 10000000;
	var squaredDistToCamera = undefined;
	var last_squared_dist = undefined;
	
	var building_projects_count = this.f4dBR_buildingProjectsList._BR_buildingsArray.length;
	for(var p_counter = 0; p_counter<building_projects_count; p_counter++)
	{
		var BR_Project = this.f4dBR_buildingProjectsList._BR_buildingsArray[p_counter];
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
		if(squaredDistToCamera > min_squaredDist_to_see)
			continue;
						
		this.boundingSphere_Aux.center = BR_Project._buildingPosition;
		this.radiusAprox_aux = BR_Project.getRadiusAprox();
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}

		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull !== Cesium.Intersect.OUTSIDE) 
		{
			if(squaredDistToCamera < min_squaredDist_to_see_detailed)// min dist to see detailed.***
			{
				if(last_squared_dist)
				{
					if(squaredDistToCamera < last_squared_dist)
					{
						last_squared_dist = squaredDistToCamera;
						visibleBuildings_array.push(this.detailed_building);
						this.detailed_building = BR_Project;
					}
					else{
						visibleBuildings_array.push(BR_Project);
					}
				}
				else{
					last_squared_dist = squaredDistToCamera;
					this.detailed_building = BR_Project;
				}
			}
			else{
				visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	return visibleBuildings_array;
	*/
};



//# sourceURL=f4d_manager.js

















