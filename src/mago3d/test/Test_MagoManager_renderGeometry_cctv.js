'use strict';

MagoManager.prototype.test_cctv = function()
{
	if (this.cctvList === undefined)
	{
		this.cctvList = new CCTVList();
		
		/*
		var longitude = 126.61090424717905;
		var latitude = 37.58158288958673;
		var altitude = 80.0;
		*/
		
		var far = 10.0;
		var altitude = 60.0;
		var vboMemManager = this.vboMemoryManager;
		
		// 2- create a cctv.*********************************************************************************
		var cctv = this.cctvList.new_CCTV("0000100001000T");
		var longitude = 128.606641;
		var latitude = 35.902546;
		var altitude_0000100001000T = 74.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_0000100001000T, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_0000100001000T, cctv.camera.position, this);
		var frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 3- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("0000100002000T");
		longitude = 128.606341;
		latitude = 35.901937;
		var altitude_0000100002000T = 82.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_0000100002000T, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_0000100002000T, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 4- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("0000100003000T");
		longitude = 128.606641;
		latitude = 35.902156;
		var altitude_0000100003000T = 80.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_0000100003000T, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_0000100003000T, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 5- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("0000100004000T");
		longitude = 128.606641;
		latitude = 35.902106;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_0000100003000T, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_0000100003000T, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 6- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV-1");
		cctv.minHeading = 45.0;
		cctv.maxHeading = 180.0;
		longitude = 127.054720;
		latitude = 37.540641;
		var altitude_CCTV_1 = 47.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_CCTV_1, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_CCTV_1, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 7- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV-2");
		longitude = 127.055259;
		latitude = 37.544781;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 8- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV-3");
		longitude = 127.043323;
		latitude = 37.548298;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 9- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV-4");
		longitude = 127.056880;
		latitude = 37.544136;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 10- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV-5");
		longitude = 127.054847;
		latitude = 37.544761;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 11- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV10");
		longitude = 127.056265;
		latitude = 37.542031;
		var altitude_CCTV10 = 43.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_CCTV10, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_CCTV10, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 12- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV11");
		cctv.minHeading = -150.0;
		cctv.maxHeading = -35.0;
		longitude = 127.054967;
		latitude = 37.539409;
		var altitude_CCTV11 = 45.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_CCTV11, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_CCTV11, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 13- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV13");
		cctv.minHeading = 90.0;
		cctv.maxHeading = 240.0;
		longitude = 127.055030;
		latitude = 37.540139;
		var altitude_CCTV13 = 46.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_CCTV13, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_CCTV13, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 14- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV14");
		longitude = 127.056001;
		latitude = 37.539940;
		var altitude_CCTV14 = 47.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude_CCTV14, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude_CCTV14, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 15- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV6");
		longitude = 127.057016;
		latitude = 37.544093;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 16- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV7");
		cctv.minHeading = -140.0;
		cctv.maxHeading = 0.0;
		longitude = 127.056593;
		latitude = 37.543283;
		altitude = 45.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 17- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV8");
		longitude = 127.055027;
		latitude = 37.545001;
		altitude = 60.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 18- create a cctv.*********************************************************************************
		cctv = this.cctvList.new_CCTV("CCTV9");
		longitude = 127.057023;
		latitude = 37.544420;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 19- create a cctv.*********************************************************************************
		//cctv = this.cctvList.new_CCTV("공원3-22");
		//longitude = 127.057024;
		//latitude = 37.544420;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 20- create a cctv.*********************************************************************************
		//cctv = this.cctvList.new_CCTV("공원4-42");
		//longitude = 127.057025;
		//latitude = 37.544420;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 21- create a cctv.*********************************************************************************
		//cctv = this.cctvList.new_CCTV("교행1-51");
		//longitude = 127.057026;
		//latitude = 37.544420;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 22- create a cctv.*********************************************************************************
		//cctv = this.cctvList.new_CCTV("자치15-31123");
		//longitude = 127.057027;
		//latitude = 37.544420;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
		// 23- create a cctv.*********************************************************************************
		//cctv = this.cctvList.new_CCTV("자치6-13");
		//longitude = 127.057028;
		//latitude = 37.544420;
		//altitude = 70.0;
		
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, 0.0, 0.0, 0.0, cctv.geoLocationData, this);
		cctv.camera.position = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, altitude, cctv.camera.position, this);
		frustum = cctv.camera.bigFrustum;
		frustum.far = far;
		cctv.vboKeyContainer  = new VBOVertexIdxCacheKeysContainer();
		cctv.vboKeyContainer = cctv.getVbo(cctv.vboKeyContainer, undefined, vboMemManager);
		cctv.calculateRotationMatrix();
		
	}
};

MagoManager.prototype.testButtonOnClick = function() 
{
	// Test to reorient a camera.***
	if (this.cctvList === undefined)
	{ return; }
	
	var cam = this.cctvList.getCCTVByName("CCTV6");
	var timeInSeconds = 0.5;
	cam.setOrientation(0.0, 0, 86, timeInSeconds);
	var hola = 0;
};

MagoManager.prototype.renderGeometry = function(gl, cameraPosition, shader, renderTexture, ssao_idx, visibleObjControlerNodes) 
{
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	var currentShader;
	var shaderProgram;
	var neoBuilding;
	var node;
	var rootNode;
	var geoLocDataManager;

	renderTexture = false;
	
	if (ssao_idx === 0) 
	{
		gl.disable(gl.BLEND);
		this.renderGeometryDepth(gl, ssao_idx, visibleObjControlerNodes);
		// Draw the axis.***
		if (this.magoPolicy.getShowOrigin() && this.nodeSelected !== undefined)
		{
			node = this.nodeSelected;
			var nodes = [node];
			
			this.renderAxisNodes(gl, nodes, true, ssao_idx);
		}
	}
	if (ssao_idx === 1) 
	{
		
		// check changesHistory.
		this.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles0);
		this.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles0);
		
		this.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles2);
		this.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);
		
		this.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles3);
		this.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles3);
			
		// ssao render.************************************************************************************************************
		var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;
		var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
		var nodesLOD3Count = visibleObjControlerNodes.currentVisibles3.length;
		if (nodesLOD0Count > 0 || nodesLOD2Count > 0 || nodesLOD3Count > 0)
		{
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao default.***
			
			if (this.noiseTexture === undefined) 
			{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
			currentShader.last_tex_id = this.textureAux_1x1;
			
			
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set this var here.***
			this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);
		}
		
		
		// If there are an object selected, then there are a stencilBuffer.******************************************
		if (this.nodeSelected) // if there are an object selected then there are a building selected.***
		{
			if (this.magoPolicy.getObjectMoveMode() === CODE.moveMode.OBJECT && this.objectSelected)
			{
				node = this.nodeSelected;
				var geoLocDataManager = this.getNodeGeoLocDataManager(node);
				neoBuilding = this.buildingSelected;
				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				var neoReferencesMotherAndIndices = this.octreeSelected.neoReferencesMotherAndIndices;
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				
				// do as the "getSelectedObjectPicking".**********************************************************
				currentShader = this.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
				currentShader.useProgram();
				
				currentShader.enableVertexAttribArray(currentShader.position3_loc);
				currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
				currentShader.disableVertexAttribArray(currentShader.normal3_loc);
				currentShader.disableVertexAttribArray(currentShader.color4_loc);
				
				gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
				
				// do the colorCoding render.***
				// position uniforms.***
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
				
				gl.uniform4fv(currentShader.color4Aux_loc, [0.0, 1.0, 0.0, 1.0]);
				gl.uniform2fv(currentShader.screenSize_loc, [this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight]);
				gl.uniformMatrix4fv(currentShader.ProjectionMatrix_loc, false, this.sceneState.projectionMatrix._floatArrays);
				
				gl.enable(gl.STENCIL_TEST);
				gl.disable(gl.POLYGON_OFFSET_FILL);
				gl.disable(gl.CULL_FACE);
				gl.disable(gl.DEPTH_TEST);
				gl.depthRange(0, 0);
				
				gl.stencilFunc(gl.EQUAL, 0, 1);
				gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
					
				//glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				//gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );
				var localRenderType = 0; // only need positions.***
				var minSizeToRender = 0.0;
				var offsetSize = 3/1000;
				
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
				this.objectSelected.render(this, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
				this.objectSelected.render(this, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
				this.objectSelected.render(this, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
				this.objectSelected.render(this, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				
				gl.enable(gl.DEPTH_TEST);// return to the normal state.***
				gl.disable(gl.STENCIL_TEST);
				gl.depthRange(0, 1);// return to the normal value.***
				//gl.disableVertexAttribArray(currentShader.position3_loc);
				currentShader.disableVertexAttribArrayAll();
				
				gl.useProgram(null);
			}
			
			// new. Render the silhouette by lod3 or lod4 or lod5 mesh***
			if (this.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && this.buildingSelected)
			{
				node = this.nodeSelected;
				var geoLocDataManager = this.getNodeGeoLocDataManager(node);
				neoBuilding = this.buildingSelected;
				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				//var neoReferencesMotherAndIndices = this.octreeSelected.neoReferencesMotherAndIndices;
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				var skinLego = neoBuilding.getCurrentSkin();
				if (skinLego !== undefined)
				{
					// do as the "getSelectedObjectPicking".**********************************************************
					currentShader = this.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
					currentShader.useProgram();
					
					gl.enableVertexAttribArray(currentShader.position3_loc);
					
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
					gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
					gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays);
					gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
					gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
					
					// do the colorCoding render.***
					// position uniforms.***
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
					
					gl.uniform4fv(currentShader.color4Aux_loc, [0.0, 1.0, 0.0, 1.0]);
					gl.uniform2fv(currentShader.screenSize_loc, [this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight]);
					gl.uniformMatrix4fv(currentShader.ProjectionMatrix_loc, false, this.sceneState.projectionMatrix._floatArrays);
					
					gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
					
					gl.enable(gl.STENCIL_TEST);
					gl.disable(gl.POLYGON_OFFSET_FILL);
					gl.disable(gl.CULL_FACE);
					gl.disable(gl.DEPTH_TEST);
					gl.depthRange(0, 0);
					
					gl.stencilFunc(gl.EQUAL, 0, 1);
					//gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
					gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
						
					//glPrimitive = gl.POINTS;
					glPrimitive = gl.TRIANGLES;
					gl.uniform1i(currentShader.refMatrixType_loc, 0); // 0 = identity matrix.***
					//gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );

					
					gl.uniform1i(currentShader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.***
					var offsetSize = 4/1000;
					var localRenderType = 0; // only need positions.***
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
					skinLego.render(this, localRenderType, renderTexture, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
					skinLego.render(this, localRenderType, renderTexture, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
					skinLego.render(this, localRenderType, renderTexture, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
					skinLego.render(this, localRenderType, renderTexture, currentShader);
					gl.enable(gl.DEPTH_TEST);// return to the normal state.***
					gl.disable(gl.STENCIL_TEST);
					gl.depthRange(0, 1);// return to the normal value.***
					gl.disableVertexAttribArray(currentShader.position3_loc);
					
					currentShader.disableVertexAttribArrayAll();
				}
				
			}
			
			// draw the axis.***
			if (this.magoPolicy.getShowOrigin())
			{
				node = this.nodeSelected;
				//var geoLocDataManager = this.getNodeGeoLocDataManager(node);
				var nodes = [node];
				
				this.renderAxisNodes(gl, nodes, true, ssao_idx);
			}
		}
		
		
		// 3) now render bboxes.*******************************************************************************************************************
		if (this.magoPolicy.getShowBoundingBox())
		{
			var bRenderLines = true;
			this.renderBoundingBoxesNodes(gl, this.visibleObjControlerNodes.currentVisibles0, undefined, bRenderLines);
			this.renderBoundingBoxesNodes(gl, this.visibleObjControlerNodes.currentVisibles2, undefined, bRenderLines);
			this.renderBoundingBoxesNodes(gl, this.visibleObjControlerNodes.currentVisibles3, undefined, bRenderLines);
		}
		
		// 4) Render ObjectMarkers.********************************************************************************************************
		// 4) Render ObjectMarkers.********************************************************************************************************
		// 4) Render ObjectMarkers.********************************************************************************************************
		var objectsMarkersCount = this.objMarkerManager.objectMarkerArray.length;
		if (objectsMarkersCount > 0)
		{
			// now repeat the objects markers for png images.***
			// Png for pin image 128x128.********************************************************************
			if (this.pin.positionBuffer === undefined)
			{ this.pin.createPinCenterBottom(gl); }
			
			currentShader = this.postFxShadersManager.pngImageShader; // png image shader.***
			currentShader.resetLastBuffersBinded();
			
			shaderProgram = currentShader.program;
			
			gl.useProgram(shaderProgram);
			gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
			gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
			gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, this.sceneState.modelViewRelToEyeMatrixInv._floatArrays);
			
			gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis); 
			// Tell the shader to get the texture from texture unit 0
			gl.uniform1i(currentShader.texture_loc, 0);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.activeTexture(gl.TEXTURE0);
			
			gl.depthRange(0, 0);
			//var context = document.getElementById('canvas2').getContext("2d");
			//var canvas = document.getElementById("magoContainer");
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.pin.positionBuffer);
			gl.vertexAttribPointer(currentShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.pin.texcoordBuffer);
			gl.vertexAttribPointer(currentShader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
			var j=0;
			for (var i=0; i<objectsMarkersCount; i++)
			{
				if (j>= this.pin.texturesArray.length)
				{ j=0; }
				
				var currentTexture = this.pin.texturesArray[j];
				var objMarker = this.objMarkerManager.objectMarkerArray[i];
				var objMarkerGeoLocation = objMarker.geoLocationData;
				gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, objMarkerGeoLocation.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, objMarkerGeoLocation.positionLOW);

				gl.drawArrays(gl.TRIANGLES, 0, 6);
				
				j++;
			}
			gl.depthRange(0, 1);
			gl.useProgram(null);
			gl.bindTexture(gl.TEXTURE_2D, null);
			currentShader.disableVertexAttribArrayAll();
			
		}
		
		// test renders.***
		// render cctv.***
		this.test_cctv();
		var cctvsCount = 0;
		if (this.cctvList !== undefined)
		{
			cctvsCount = this.cctvList.getCCTVCount();
		}
		if (cctvsCount > 0)
		{
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			this.cctvList.render(this, currentShader );

		}
		
		
		// PointsCloud.****************************************************************************************
		// PointsCloud.****************************************************************************************
		var nodesPCloudCount = this.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			currentShader = this.postFxShadersManager.getShader("pointsCloud");
			currentShader.useProgram();

			currentShader.enableVertexAttribArray(currentShader.position3_loc);
			currentShader.enableVertexAttribArray(currentShader.color4_loc);
			currentShader.disableVertexAttribArray(currentShader.normal3_loc); // provisionally has no normals.***
			currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); // provisionally has no texCoords.***
			
			currentShader.bindUniformGenerals();
			currentShader.resetLastBuffersBinded();

			this.renderer.renderNeoBuildingsPCloud(gl, this.visibleObjControlerNodes.currentVisiblesAux, this, currentShader, renderTexture, ssao_idx); // lod0.***
			currentShader.disableVertexAttribArrayAll();
			//currentShader.resetLastBuffersBinded();
			
			gl.useProgram(null);

		}
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
		currentShader.disableVertexAttribArrayAll();
		
		currentShader = this.postFxShadersManager.getShader("modelRefColorCoding");  // color selection shader.***
		currentShader.disableVertexAttribArrayAll();
		
		currentShader = this.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
		currentShader.disableVertexAttribArrayAll();
		
		// Test TinTerrain.**************************************************************************
		// Test TinTerrain.**************************************************************************
		// render tiles, rendertiles.***
		
		if (this.tinTerrainManager !== undefined)
		{
			var bDepthRender = false; // This is no depth render.***
			this.tinTerrainManager.render(this, bDepthRender);
		}
		
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		if (this.modeler !== undefined)
		{
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao default.***
			
			if (this.noiseTexture === undefined) 
			{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
			currentShader.last_tex_id = this.textureAux_1x1;
			
			
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set this var here.***
			this.modeler.render(this, currentShader);
			//this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			//this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			//this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);

		}

	}
	
	currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
	currentShader.disableVertexAttribArrayAll();
	
	currentShader = this.postFxShadersManager.getShader("modelRefColorCoding");  // color selection shader.***
	currentShader.disableVertexAttribArrayAll();
	
	currentShader = this.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
	currentShader.disableVertexAttribArrayAll();

	
	
	gl.depthRange(0.0, 1.0);	
};