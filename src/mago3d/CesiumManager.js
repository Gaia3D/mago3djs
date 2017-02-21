'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var CesiumManager = function() {
	if(!(this instanceof CesiumManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// F4D Data structure & objects.*****************************************
	this.bRBuildingProjectsList = new BRBuildingProjectsList(); // Old. Provisionally for f4d projects.*** !!!
	this.terranTile = new TerranTile();// use this.***
	this.neoBuildingsList = new NeoBuildingsList();
	this.renderer = new Renderer();
	this.selection = new Selection();
	this.shadersManager = new ShadersManager();
	this.postFxShadersManager = new PostFxShadersManager();
	this.vBOManager = new VBOManager();
	this.readerWriter = new ReaderWriter();
	
	// SSAO.***************************************************
	this.noiseTexture;
	this.depthFbo; 
	this.normalFbo; // Only for test disply normals. No use this in release.***    
	this.ssaoFbo;
	
	this.pixels = new Uint8Array(4*4*4); // really this is no necessary.***
	
	this.depthFboNeo;    
	this.ssaoFboNeo;
	this.selectionFbo; // framebuffer for selection.***
	
	// Mouse handler.***********************************************************************
	this.handler; // mouse handlers. mouse_DOWN, mouse_MOVE, mouse_UP.***
	this.mouse_x = 0;
	this.mouse_y = 0;
	this.mouseLeftDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane;
	
	this.selectionCandidateObjectsArray = [];
	this.objectSelected;
	this.objMovState = 0; // 0 = no started. 1 = mov started. 
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.startMovPoint = new Point3D();
	
	//this.ssaoFSQuad;// No use this.***
	this.kernel = [];
	
	// Original for hemisphere.***
	/*
	for(var i=0; i<kernelSize; i++) {
		var x = 2.0 * (Math.random() - 0.5);
		var y = 2.0 * (Math.random() - 0.5);
		var z = Math.random();
		if(z<0.15)z = 0.15;
		this.kernel.push(x);
		this.kernel.push(y);
		this.kernel.push(z);				
	}
	*/
	
	// 1.***
	this.kernel.push(0.33);
	this.kernel.push(0.0);
	this.kernel.push(0.85);
	
	// 2.***
	this.kernel.push(0.25);
	this.kernel.push(0.3);
	this.kernel.push(0.5);
	
	// 3.***
	this.kernel.push(0.1);
	this.kernel.push(0.3);
	this.kernel.push(0.85);
	
	// 4.***
	this.kernel.push(-0.15);
	this.kernel.push(0.2);
	this.kernel.push(0.85);
	
	// 5.***
	this.kernel.push(-0.33);
	this.kernel.push(0.05);
	this.kernel.push(0.6);
	
	// 6.***
	this.kernel.push(-0.1);
	this.kernel.push(-0.15);
	this.kernel.push(0.85);
	
	// 7.***
	this.kernel.push(-0.05);
	this.kernel.push(-0.32);
	this.kernel.push(0.25);
	
	// 8.***
	this.kernel.push(0.2);
	this.kernel.push(-0.15);
	this.kernel.push(0.85);
	
	// 9.***
	this.kernel.push(0.6);
	this.kernel.push(0.0);
	this.kernel.push(0.55);
	
	// 10.***
	this.kernel.push(0.5);
	this.kernel.push(0.6);
	this.kernel.push(0.45);
	
	// 11.***
	this.kernel.push(-0.01);
	this.kernel.push(0.7);
	this.kernel.push(0.35);
	
	// 12.***
	this.kernel.push(-0.33);
	this.kernel.push(0.5);
	this.kernel.push(0.45);
	
	// 13.***
	this.kernel.push(-0.45);
	this.kernel.push(0.0);
	this.kernel.push(0.55);
	
	// 14.***
	this.kernel.push(-0.65);
	this.kernel.push(-0.5);
	this.kernel.push(0.7);
	
	// 15.***
	this.kernel.push(0.0);
	this.kernel.push(-0.5);
	this.kernel.push(0.55);
	
	// 16.***
	this.kernel.push(0.33);
	this.kernel.push(0.3);
	this.kernel.push(0.35);
	
	/* Test for sphere.***
	for(var i=0; i<kernelSize; i++) {
		this.kernel.push(2.0 * (Math.random() - 0.5));
		this.kernel.push(2.0 * (Math.random() - 0.5));
		this.kernel.push(2.0 * (Math.random() - 0.5));				
	}
	*/
	
	this.atmosphere = new Atmosphere();
	
	// Vars.****************************************************************
	this.modelViewProjRelToEyeMatrix = new Float32Array(16);
	this.modelViewRelToEyeMatrix = new Float32Array(16);
	this.modelView_matrix = new Float32Array(16);
	this.projection_matrix = new Float32Array(16);
	this.normalMat3 = new Cesium.Matrix3();
	this.normalMat3_array = new Float32Array(9);
	this.normalMat4 = new Cesium.Matrix4();
	this.normalMat4_array = new Float32Array(16);
	
	this.currentVisible_terranTiles_array = [];
	this.currentVisibleBuildings_array = []; // delete this.***
	this.currentVisibleBuildings_LOD0_array = []; // delete this.***
	this.currentVisibleBuildingsPost_array = [];
	
	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerBuildings = new VisibleObjectsControler();
	this.visibleObjControlerOctrees = new VisibleObjectsControler();
	this.currentVisibleNeoBuildings_array = []; // delete this.***
	this.currentVisibleClouds_array = [];
	this.detailed_building;
	this.detailed_neoBuilding;
	this.boundingSphere_Aux = new Cesium.BoundingSphere(); // Cesium dependency.***
	this.radiusAprox_aux;
	
	this.currentRenderablesNeoRefListsArray = []; // dont use this.***
	
	this.filteredVisibleTiles_array = [];
	this.detailedVisibleTiles_array = [];
	this.lOD0VisibleTilesArray = [];
	
	this.lastCamPos = new Point3D();
	this.squareDistUmbral = 22.0;
	
	this.encodedCamPosMC_High = new Float32Array(3);
	this.encodedCamPosMC_Low = new Float32Array(3);
	
	this.compRefList_array;
	this.compRefList_array_background;
	this.intCRefList_array = [];
	this.intNeoRefList_array = [];
	
	this.currentSelectedObj_idx = -1;
	this.currentByteColorPicked = new Uint8Array(4);
	
	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	this.isCameraMoving = false;
	this.isCameraInsideBuilding = false;
	this.isCameraInsideNeoBuilding = false;
	
	this.min_squaredDist_to_see_detailed = 100000; // 200m.***
	this.min_squaredDist_to_see_LOD0 = 100000; // Original.***
	//this.min_squaredDist_to_see_LOD0 = 1000000; // 600m.***
	this.min_squaredDist_to_see = 5000000;
	this.min_squaredDist_to_see_smallBuildings = 700000;
	this.renders_counter = 0;
	this.render_time = 0;
	this.bPicking = false;
	
	this.scene;
	
	// SPEED TEST.********************************************************
	this.renderingTime = 0;
	this.xdo_rendering_time = 0;
	this.xdo_rendering_time_arrays = 0;
	
	this.amountRenderTime = 0;
	this.xdo_amountRenderTime = 0;
	this.xdo_amountRenderTime_arrays = 0;
	
	this.averageRenderTime = 0;
	this.xdo_averageRenderTime = 0;
	this.xdo_averageRenderTime_arrays = 0;
	
	this.allBuildingsLoaded = false;
	this.renderingCounter = 0;
	this.averageRenderingCounter = 0;
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.pointSC = new Point3D();
	this.pointSC_2 = new Point3D();
	
	this.currentTimeSC;
	this.dateSC;
	this.startTimeSC;
	this.maxMilisecondsForRender = 10;
	
	this.terranTileSC;
	
	this.textureAux_1x1;
	
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
	
	this.createCloudsTEST();
	this.loadObjectIndexFile = false;
};

// real time radiosity shader http://madebyevan.com/webgl-path-tracing/
//http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html // GOOD TUTORIALS !!!!!!!!!!!!!!!!!!!!!!!!!!!
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param w 변수
 * @param h 변수
 * @param pixels 변수
 * @returns texture
 */
function genNoiseTextureRGBA(gl, w, h, pixels) {       
	var texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//var pixels = new Uint8Array(b);
  
	if(w == 4 && h == 4) {
		/*
	  	pixels[0] = 149; pixels[1] = 16; pixels[2] = 2; pixels[3] = 197;
	  	pixels[4] = 79; pixels[5] = 76; pixels[6] = 11; pixels[7] = 53;
	  	pixels[8] = 83; pixels[9] = 74; pixels[10] = 155; pixels[11] = 159;
	  	pixels[12] = 19; pixels[13] = 232; pixels[14] = 183; pixels[15] = 27;
	  
	  	pixels[16] = 200; pixels[17] = 248; pixels[18] = 98; pixels[19] = 10;
	  	pixels[20] = 63; pixels[21] = 75; pixels[22] = 229; pixels[23] = 231;
	  	pixels[24] = 162; pixels[25] = 85; pixels[26] = 114; pixels[27] = 243;
	  	pixels[28] = 149; pixels[29] = 136; pixels[30] = 210; pixels[31] = 59;
	  
	  	pixels[32] = 210; pixels[33] = 233; pixels[34] = 117; pixels[35] = 103;
	  	pixels[36] = 83; pixels[37] = 214; pixels[38] = 42; pixels[39] = 175;
	  	pixels[40] = 117; pixels[41] = 223; pixels[42] = 87; pixels[43] = 197;
	  	pixels[44] = 99; pixels[45] = 254; pixels[46] = 128; pixels[47] = 9;
	  
	  	pixels[48] = 137; pixels[49] = 99; pixels[50] = 146; pixels[51] = 38;
	  	pixels[52] = 145; pixels[53] = 76; pixels[54] = 178; pixels[55] = 133;
	  	pixels[56] = 202; pixels[57] = 11; pixels[58] = 220; pixels[59] = 34;
	  	pixels[60] = 61; pixels[61] = 216; pixels[62] = 95; pixels[63] = 249;
		 */
		var i = 0;
	    pixels[i] = 50; i++;
		pixels[i] = 58; i++;
		pixels[i] = 229; i++;
		pixels[i] = 120; i++;
		pixels[i] = 212; i++;
		pixels[i] = 236; i++;
		pixels[i] = 251; i++;
		pixels[i] = 148; i++;
		pixels[i] = 75; i++;
		pixels[i] = 92; i++;
		pixels[i] = 246; i++;
		pixels[i] = 59; i++;
		pixels[i] = 197; i++;
		pixels[i] = 95; i++;
		pixels[i] = 235; i++;
		pixels[i] = 216; i++;
		pixels[i] = 130; i++;
		pixels[i] = 124; i++;
		pixels[i] = 215; i++;
		pixels[i] = 154; i++;
		pixels[i] = 25; i++;
		pixels[i] = 41; i++;
		pixels[i] = 221; i++;
		pixels[i] = 146; i++;
		pixels[i] = 187; i++;
		pixels[i] = 217; i++;
		pixels[i] = 130; i++;
		pixels[i] = 199; i++;
		pixels[i] = 142; i++;
		pixels[i] = 112; i++;
		pixels[i] = 61; i++;
		pixels[i] = 135; i++;
		pixels[i] = 67; i++;
		pixels[i] = 125; i++;
		pixels[i] = 159; i++;
		pixels[i] = 153; i++;
		pixels[i] = 215; i++;
		pixels[i] = 49; i++;
		pixels[i] = 49; i++;
		pixels[i] = 69; i++;
		pixels[i] = 126; i++;
		pixels[i] = 168; i++;
		pixels[i] = 61; i++;
		pixels[i] = 215; i++;
		pixels[i] = 21; i++;
		pixels[i] = 93; i++;
		pixels[i] = 183; i++;
		pixels[i] = 1; i++;
		pixels[i] = 125; i++;
		pixels[i] = 44; i++;
		pixels[i] = 22; i++;
		pixels[i] = 130; i++;
		pixels[i] = 197; i++;
		pixels[i] = 118; i++;
		pixels[i] = 109; i++;
		pixels[i] = 23; i++;
		pixels[i] = 195; i++;
		pixels[i] = 4; i++;
		pixels[i] = 148; i++;
		pixels[i] = 245; i++;
		pixels[i] = 124; i++;
		pixels[i] = 125; i++;
		pixels[i] = 185; i++;
		pixels[i] = 28; i++;
	} else {
		for(var y=0; y<h; y++) {
			for(var x=0; x<w; x++) {
				pixels[(y*w + x)*4+0] = Math.floor(255 * Math.random());
				pixels[(y*w + x)*4+1] = Math.floor(255 * Math.random());
				pixels[(y*w + x)*4+2] = Math.floor(255 * Math.random());
				pixels[(y*w + x)*4+3] = Math.floor(255 * Math.random());
			}
		} 
	}
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);   
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.bindTexture(gl.TEXTURE_2D, null);  
  
	texture.width = w;
	texture.height = h; 
	return texture;
}

/**
 * 어떤 일을 하고 있습니까?
 */
CesiumManager.prototype.createCloudsTEST = function() {
	var randomLongitude = 0;
	var randomLatitude = 0;
	var randomAltitude = 0;
	var randomRadius = 0;
	var randomDepth = 0;
	
	var cloud;
	
	for(var i =0; i<10; i++)
	{
		randomLongitude = 126.91+(0.05*Math.random());
		randomLatitude = 37.51+(0.05*Math.random());
		randomAltitude = 350+Math.random()*50;
		randomRadius = 10+Math.random()*150;
		randomDepth = 10+Math.random()*50;
		cloud = this.atmosphere.cloudsManager.newCircularCloud();
		cloud.createCloud(randomLongitude, randomLatitude, randomAltitude, randomRadius, randomDepth, 16);
	}
	
	for(var i =0; i<10; i++)
	{
		randomLongitude = 127.0+(0.05*Math.random());
		randomLatitude = 37.45+(0.05*Math.random());
		randomAltitude = 350+Math.random()*50;
		randomRadius = 10+Math.random()*150;
		randomDepth = 10+Math.random()*50;
		cloud = this.atmosphere.cloudsManager.newCircularCloud();
		cloud.createCloud(randomLongitude, randomLatitude, randomAltitude, randomRadius, randomDepth, 16);
	}
	/*
	cloud = this.atmosphere.cloudsManager.newCircularCloud();
	cloud.createCloud(126.929, 37.5172076, 300.0, 100.0, 40.0, 16);

	cloud = this.atmosphere.cloudsManager.newCircularCloud();
	cloud.createCloud(126.929+increLong, 37.5172076, 340.0, 50.0, 40.0, 16);
	
	cloud = this.atmosphere.cloudsManager.newCircularCloud();
	cloud.createCloud(126.929+increLong, 37.5172076+increLat, 340.0, 80.0, 90.0, 16);
	*/
};

/**
 * 어떤 일을 하고 있습니까?
 * @param cameraPosition 변수
 * @param squareDistUmbral 변수
 * @returns camera_was_moved
 */
CesiumManager.prototype.isCameraMoved = function(cameraPosition, squareDistUmbral) {
	// if camera is interior of building -> this.squareDistUmbral = 22.0;
	// if camera is exterior of building -> this.squareDistUmbral = 200.0;
	/*
	if(this.detailed_building)
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else{
		this.squareDistUmbral = 50*50;
	}
	*/
	
	var camera_was_moved = false;
	var squareDistFromLastPos = this.lastCamPos.squareDistTo(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	if(squareDistFromLastPos > squareDistUmbral) {
		camera_was_moved = true;
		this.lastCamPos.x = cameraPosition.x;
		this.lastCamPos.y = cameraPosition.y;
		this.lastCamPos.z = cameraPosition.z;
	}
	
	return camera_was_moved;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param cameraPosition 변수
 */
CesiumManager.prototype.updateCameraMoved = function(cameraPosition) {
	// This function must run in a background process.****
	// call this function if camera was moved.****
	
	// 1rst, do frustum culling and find a detailed building.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param cameraPosition 변수
 * @param cullingVolume 변수
 * @param modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderAtmosphere = function(GL, cameraPosition, cullingVolume, modelViewProjectionRelativeToEye, scene, isLastFrustum) {
	var clouds_count = this.atmosphere.cloudsManager.circularCloudsArray.length;
	if(clouds_count == 0) return;
	
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	this.encodedCamPosMC_High[0] = camSplitVelue_X.high;
	this.encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	this.encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	this.encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	this.encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	
	// Test using shaderManager.************************
	var shadersManager = this.shadersManager;
	var standardShader = shadersManager.getMagoShader(4); // 4 = cloud-shader.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);

	GL.enableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(modelViewProjectionRelativeToEye, this.modelViewProjRelToEyeMatrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEyeMatrix);
	GL.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	
	// Clouds.***************************************************
	var cloud;
	for(var i=0; i<clouds_count; i++) {
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i];
		
		GL.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		GL.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);
		
		if(cloud.vbo_vertexCacheKey == undefined) {
			cloud.vbo_vertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, cloud.getVBOVertexColorFloatArray(), GL.STATIC_DRAW);
		}
		if(cloud.vbo_indexCacheKey == undefined) {
			cloud.vbo_indexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, cloud.getVBOIndicesShortArray(), GL.STATIC_DRAW);
		}

		// Interleaved mode.***
		GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
		GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,24,0);
		GL.vertexAttribPointer(standardShader._color, 3, GL.FLOAT, false,24,12);
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
		GL.drawElements(GL.TRIANGLES, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		//GL.drawElements(GL.LINE_LOOP, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	
	GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param cameraPosition 변수
 * @param cullingVolume 변수
 * @param modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderCloudShadows = function(GL, cameraPosition, cullingVolume, modelViewProjectionRelativeToEye, scene, isLastFrustum) {
	//if(!isLastFrustum)
	//	return;
	//this.doFrustumCullingClouds(cullingVolume, this.atmosphere.cloudsManager.circularCloudsArray, cameraPosition);
	
	var clouds_count = this.atmosphere.cloudsManager.circularCloudsArray.length;
	if(clouds_count == 0) return;
	
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	this.encodedCamPosMC_High[0] = camSplitVelue_X.high;
	this.encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	this.encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	this.encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	this.encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	
	// Test using shaderManager.************************
	var shadersManager = this.shadersManager;
	var standardShader = shadersManager.getMagoShader(4); // 4 = cloud-shader.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	
	//GL.enableVertexAttribArray(standardShader._color);
	//GL.disableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(modelViewProjectionRelativeToEye, this.modelViewProjRelToEyeMatrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEyeMatrix);
	GL.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	
	var cloud;
	
	// SHADOW SETTINGS.**********************************************************************************
	GL.colorMask(false, false, false, false);
	GL.depthMask(false);
	GL.enable(GL.CULL_FACE);
	GL.enable(GL.STENCIL_TEST);
	GL.enable(GL.POLYGON_OFFSET_FILL);
	GL.polygonOffset(1.0, 2.0); // Original.***
	//GL.polygonOffset(1.0, 1.0);
	
	// First pas.****************************************************************************************************
	GL.cullFace(GL.FRONT);
	GL.stencilFunc(GL.ALWAYS, 0x0, 0xff);
	GL.stencilOp(GL.KEEP, GL.INCR, GL.KEEP);
	GL.clearStencil(0);
	//GL.clear(GL.STENCIL_BUFFER_BIT);

	// Clouds.***
	//clouds_count = this.currentVisibleClouds_array.length;
	for(var i=0; i<clouds_count; i++)
	{
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i]; // Original.***
		//cloud = this.currentVisibleClouds_array[i];
		
		GL.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		GL.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if(cloud.vbo_shadowVertexCacheKey == undefined)
		{
			cloud.vbo_shadowVertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, cloud.getVBOShadowVertexFloatArray(), GL.STATIC_DRAW);
		}
		if(cloud.vbo_shadowIndexCacheKey == undefined)
		{
			cloud.vbo_shadowIndexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, cloud.getVBOShadowIndicesShortArray(), GL.STATIC_DRAW);
		}

		// Interleaved mode.***
		GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		GL.drawElements(GL.TRIANGLES, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		//GL.drawElements(GL.LINE_LOOP, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	
	// Second pass.****************************************************************************************************
	GL.cullFace(GL.BACK);
	GL.stencilFunc(GL.ALWAYS, 0x0, 0xff);
	GL.stencilOp(GL.KEEP, GL.DECR, GL.KEEP);
	
	// Clouds.***
	for(var i=0; i<clouds_count; i++)
	{
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i];
		
		GL.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		GL.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if(cloud.vbo_shadowVertexCacheKey == undefined)
		{
			cloud.vbo_shadowVertexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, cloud.getVBOShadowVertexFloatArray(), GL.STATIC_DRAW);
		}
		if(cloud.vbo_shadowIndexCacheKey == undefined)
		{
			cloud.vbo_shadowIndexCacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, cloud.getVBOShadowIndicesShortArray(), GL.STATIC_DRAW);
		}

		// Interleaved mode.***
		GL.bindBuffer(GL.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
		
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		GL.drawElements(GL.TRIANGLES, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
		//GL.drawElements(GL.LINE_LOOP, cloud.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	//-------------------------------------------------------
	//GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	
	// Render the shadow.*********************************************************************************************
	GL.disable(GL.POLYGON_OFFSET_FILL);
	GL.disable(GL.CULL_FACE);
	GL.colorMask(true, true, true, true);
	GL.depthMask(true);

	GL.stencilFunc(GL.NOTEQUAL, 0x0, 0xff);
	GL.stencilOp(GL.REPLACE, GL.REPLACE, GL.REPLACE);

	GL.disable(GL.DEPTH_TEST);
	GL.enable(GL.BLEND);
	GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA); // Original.***
	//GL.blendFunc(GL.ONE, GL.ONE_MINUS_SRC_ALPHA);
	//--------------------------------------------------------------
	// must draw a rectangle for blending.***
	GL.cullFace(GL.FRONT);

	// render the shadowBlendingCube.***
	standardShader = shadersManager.getMagoShader(5); // 5 = blendingCube-shader.***
	var shaderProgram_blendingCube = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram_blendingCube);
	
	GL.enableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	
	GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEyeMatrix);
	GL.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	var shadowBC = this.atmosphere.shadowBlendingCube;
	if(shadowBC.vbo_vertexCacheKey == undefined)
	{
		shadowBC.vbo_vertexCacheKey = GL.createBuffer ();
		GL.bindBuffer(GL.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
		GL.bufferData(GL.ARRAY_BUFFER, shadowBC.getVBOVertexColorRGBAFloatArray(), GL.STATIC_DRAW);
	}
	if(shadowBC.vbo_indexCacheKey == undefined)
	{
		shadowBC.vbo_indexCacheKey = GL.createBuffer ();
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
		GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, shadowBC.getVBOIndicesShortArray(), GL.STATIC_DRAW);
	}

	// Interleaved mode.***
	GL.bindBuffer(GL.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
	GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,28,0);
	GL.vertexAttribPointer(standardShader._color, 4, GL.FLOAT, false,28,12);
	
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
	GL.drawElements(GL.TRIANGLES, shadowBC.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
	
	GL.disableVertexAttribArray(standardShader._position);
	GL.disableVertexAttribArray(standardShader._color);

	GL.enable(GL.DEPTH_TEST);
	GL.disable(GL.BLEND);
	GL.disable(GL.STENCIL_TEST);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param encodedCamPosMC_High 변수
 * @param encodedCamPosMC_Low 변수
 * @param cameraPosition 변수
 */
CesiumManager.prototype.calculateEncodedCameraPositionMCHighLow = function(encodedCamPosMC_High, encodedCamPosMC_Low, cameraPosition) {
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);
	
	encodedCamPosMC_High[0] = camSplitVelue_X.high;
	encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	this.encodedCamPosMC_High[2] = camSplitVelue_Z.high;
  
	encodedCamPosMC_Low[0] = camSplitVelue_X.low;
	encodedCamPosMC_Low[1] = camSplitVelue_Y.low;
	encodedCamPosMC_Low[2] = camSplitVelue_Z.low;
	
	//var us = context._us;
	//this.encodedCamPosMC_High[0] = us._encodedCameraPositionMC.high.x;
	//this.encodedCamPosMC_High[1] = us._encodedCameraPositionMC.high.y;
	//this.encodedCamPosMC_High[2] = us._encodedCameraPositionMC.high.z;
	//this.encodedCamPosMC_Low[0] = us._encodedCameraPositionMC.low.x;
	//this.encodedCamPosMC_Low[1] = us._encodedCameraPositionMC.low.y;
	//this.encodedCamPosMC_Low[2] = us._encodedCameraPositionMC.low.z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param cameraPosition 변수
 * @param cullingVolume 변수
 * @param modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderPCloudProjects = function(GL, cameraPosition, cullingVolume, modelViewProjectionRelativeToEye, scene, isLastFrustum) {
	//this.isCameraMoving = this.isButtonDown(scene);
	
	// Check if camera was moved considerably for update the renderables objects.***
	if(this.detailed_building) {
		this.squareDistUmbral = 4.5*4.5;
	} else {
		this.squareDistUmbral = 50*50;
	}
	var cameraMoved = this.isCameraMoved(cameraPosition, this.squareDistUmbral);
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(modelViewProjectionRelativeToEye, this.modelViewProjRelToEyeMatrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
	
	// Now, render the simple visible buildings.***************************************************************************
	// http://learningwebgl.com/blog/?p=684 // tutorial for shader with normals.***
	var shader = this.shadersManager.getMagoShader(6);
	var shaderProgram = shader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(shader._color);
	GL.enableVertexAttribArray(shader._position);
	
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);

	GL.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEyeMatrix);
	GL.uniform3fv(shader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	GL.uniform3fv(shader._encodedCamPosLOW, this.encodedCamPosMC_Low);

	//GL.activeTexture(GL.TEXTURE0);
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	
	// Now, render LOD0 texture buildings.***
	var pCloudProject;
	var pCloud_projectsCount = this.bRBuildingProjectsList._pCloudMesh_array.length;
	for(var i=0; i<pCloud_projectsCount; i++) {
		pCloudProject = this.bRBuildingProjectsList._pCloudMesh_array[i];
		
		if(!pCloudProject.headerReaded) {
			// Must read the header file.***
			if(this.backGround_fileReadings_count < 20) {
				filePath_scratch = this.readerWriter.geometryDataPath +"/" + pCloudProject.headerPathName;
				
				this.readerWriter.readPCloudHeaderInServer(GL, filePath_scratch, pCloudProject, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		} else if(!pCloudProject.geometryReaded && pCloudProject.headerReadedFinished) {
			if(this.backGround_fileReadings_count < 20) {
				filePath_scratch = this.readerWriter.geometryDataPath +"/" + pCloudProject.geometryPathName;
				
				this.readerWriter.readPCloudGeometryInServer(GL, filePath_scratch, pCloudProject, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}
		
		// Now, render the pCloud project.***
		if(pCloudProject.geometryReadedFinished) {
			this.renderer.renderPCloudProject(GL, pCloudProject, this.modelViewProjRelToEyeMatrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this);
		}
	}
	
	GL.disableVertexAttribArray(shader._color);
	GL.disableVertexAttribArray(shader._position);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param image 변수
 * @param texture
 */
function handleTextureLoaded(gl, image, texture) {
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	//var gl = viewer.scene.context._gl;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

CesiumManager.prototype.prepareNeoBuildings = function(GL, scene) {
	
	// for all renderables, prepare data.***
	// LOD_0.***
	var neoBuilding;
	var metaData;
	var neoBuilding_header_path = "";
	var buildingFolderName = "";
	var filePathInServer = "";
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var blocksList;
	var neoReferencesList;
	var neoReferencesListName;
	
	
	var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<buildingsCount; i++)
	{
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
		
		// check if this building is ready to render.***
		if(!neoBuilding.allFilesLoaded)
		{
			buildingFolderName = neoBuilding.buildingFileName;
			
			// 1) The buildings metaData.*************************************************************************************
			metaData = neoBuilding.metaData;
			if(metaData.fileLoadState == 0)
			{
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
				{
					// must read metadata file.***
					neoBuilding_header_path = geometryDataPath + "/" + buildingFolderName + "/Header.hed";
					this.readerWriter.readNeoHeaderInServer(GL, neoBuilding_header_path, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
					continue;
				}
			}
			
			// 2) The block models.********************************************************************************************
			// the InteriorBlock must load only if the camera is very cloesd.***
			var blocksListsCount = neoBuilding.blocksListContainer.blocksListsArray.length;
			for(var j=0; j<blocksListsCount-1; j++) // blocksListsCount-1 bcos interiorLOD4 only load if cam is inside of building.***
			{
				blocksList = neoBuilding.blocksListContainer.blocksListsArray[j];
				if(blocksList.fileLoadState == 0)
				{
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
					{
						// must read blocksList.***
						filePathInServer = geometryDataPath + "/" + buildingFolderName + "/" + blocksList.name;
						this.readerWriter.readNeoBlocksArraybufferInServer(GL, filePathInServer, blocksList, neoBuilding, this);
						continue;
					}
				}
			}
			
			// 3) The references (Exteriors & Bone).*************************************************************************
			var neoReferencesListsCount = neoBuilding.neoRefListsContainer.neoRefsLists_Array.length;
			if(neoReferencesListsCount == 0)
			{
				// if there are no referencesList then make it.***
				// there are 4 neoReferencesLists (lodExt0, lodExt1, lodExt2, lodBone).****
				for(var j=0; j<4; j++)
				{
					blocksList = neoBuilding.blocksListContainer.blocksListsArray[j];
					neoReferencesList = neoBuilding.neoRefListsContainer.newNeoRefsList(blocksList);
					if(j == 0)
						neoReferencesListName = "Ref_Skin1";
					else if(j == 1)
						neoReferencesListName = "Ref_Skin2";
					else if(j == 2)
						neoReferencesListName = "Ref_Skin3";
					else if(j == 3)
						neoReferencesListName = "Ref_Bone";
						
					neoReferencesList.name = neoReferencesListName;
				}
			}
			
			for(var j=0; j<neoReferencesListsCount; j++)
			{
				neoReferencesList = neoBuilding.neoRefListsContainer.neoRefsLists_Array[j];
				if(neoReferencesList.fileLoadState == 0)
				{
					filePathInServer = geometryDataPath + "/" + buildingFolderName + "/" + neoReferencesList.name;
					this.readerWriter.readNeoReferencesArraybufferInServer(filePathInServer, neoReferencesList, neoBuilding, this);
					// remember multiply reference matrices by the building transform matrix.***
					//var transformMat = new Matrix4();
					//transformMat.setByFloat32Array(neoBuilding.move_matrix);
					//if(transformMat)
					//{
						//neoRefsList.multiplyReferencesMatrices(transformMat);
					//}
					continue;
				}
			}
			
			// 4) The references (Interiors Octree).*************************************************************************
			// octree must load if the camera is very closed.***
			/*
			if(neoBuilding.octree != undefined && !neoBuilding.octreeLoadedAllFiles)
			{
				var interiorCRef_folderPath = geometryDataPath + "/" + buildingFolderName + "/inLOD4";
				//var lod_level = 4;
				//var interior_base_name = "Ref_NodeData";
				var subOctreeName_counter = -1;
				var areAllSubOctreesLoadedFile = true; // init on true.***
				blocksList = neoBuilding.blocksListContainer.getBlockList("Blocks4");
				
				for(var a=1; a<9; a++)
				{
					for(var b=1; b<9; b++)
					{
						for(var c=1; c<9; c++)
						{
							subOctreeName_counter = a*100 + b*10 + c;
							var subOctreeNumberName = subOctreeName_counter.toString();
							
							subOctree = neoBuilding.octree.getOctreeByNumberName(subOctreeNumberName);
							if(subOctree.neoRefsList_Array.length == 0)
							{
								if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
								{
									neoReferencesList = new NeoReferencesList();
									//if(transformMat)
									//{
									//	neoReferencesList.multiplyReferencesMatrices(transformMat); // after parse, multiply transfMat by the buildings mat.***
									//}
									neoReferencesList.blocksList = blocksList;
									subOctree.neoRefsList_Array.push(neoReferencesList);
									
									var intRef_filePath = interiorCRef_folderPath + "/" + subOctreeNumberName;
									this.readerWriter.readNeoReferencesArraybufferInServer(intRef_filePath, neoReferencesList, neoBuilding, this);
								}
								areAllSubOctreesLoadedFile = false;
							}
							else{
								neoReferencesList = subOctree.neoRefsList_Array[0];
								if(neoReferencesList != undefined && neoReferencesList.fileLoadState == 0)
									areAllSubOctreesLoadedFile = false;
							}
							////readerWriter.readNeoReferencesInServer(GL, intCompRef_filePath, null, subOctreeNumberName, lod_level, blocksList_4, moveMatrix, neoBuilding, readerWriter, subOctreeName_counter);
						}
					}
				}
				
				if(areAllSubOctreesLoadedFile)
				{
					neoBuilding.octreeLoadedAllFiles = true;
				}
				
			}
			*/
		}
		else
		{
			// Now, must check if the blocks and references was parsed the dataArrayBuffer.***
			
		}
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param neoBuilding 변수
 */
CesiumManager.prototype.loadBuildingOctree = function(neoBuilding) {
	// The references (Interiors Octree).*************************************************************************
	// octree must load if the camera is very closed.***
	if(neoBuilding.octree != undefined && !neoBuilding.octreeLoadedAllFiles)
	{
		var geometryDataPath = this.readerWriter.geometryDataPath;
		var buildingFolderName = neoBuilding.buildingFileName;
		var interiorCRef_folderPath = geometryDataPath + "/" + buildingFolderName + "/inLOD4";
		//var lod_level = 4;
		//var interior_base_name = "Ref_NodeData";
		var subOctreeName_counter = -1;
		var areAllSubOctreesLoadedFile = true; // init on true.***
		var blocksList = neoBuilding.blocksListContainer.getBlockList("Blocks4");
		var subOctree;
		var neoReferencesList;
		
		for(var a=1; a<9; a++) // a = octree level 1.***
		{
			for(var b=1; b<9; b++) // b = octree level 2.***
			{
				for(var c=1; c<9; c++) // c = octree level 3.***
				{
					
					// slow method.**************************************************************************************************
					subOctreeName_counter = a*100 + b*10 + c;
					var subOctreeNumberName = subOctreeName_counter.toString();
					subOctree = neoBuilding.octree.getOctreeByNumberName(subOctreeNumberName); // dont use this method. is slow.***
					//---------------------------------------------------------------------------------------------------------------
					
					if(subOctree.neoRefsList_Array.length == 0)
					{
						if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
						{
							neoReferencesList = new NeoReferencesList();
							//if(transformMat)
							//{
							//	neoReferencesList.multiplyReferencesMatrices(transformMat); // after parse, multiply transfMat by the buildings mat.***
							//}
							neoReferencesList.blocksList = blocksList;
							subOctree.neoRefsList_Array.push(neoReferencesList);
							
							var intRef_filePath = interiorCRef_folderPath + "/" + subOctreeNumberName;
							this.readerWriter.readNeoReferencesArraybufferInServer(intRef_filePath, neoReferencesList, neoBuilding, this);
						}
						areAllSubOctreesLoadedFile = false;
					}
					else{
						neoReferencesList = subOctree.neoRefsList_Array[0];
						if(neoReferencesList != undefined && neoReferencesList.fileLoadState == 0)
							areAllSubOctreesLoadedFile = false;
					}
					////readerWriter.readNeoReferencesInServer(GL, intCompRef_filePath, null, subOctreeNumberName, lod_level, blocksList_4, moveMatrix, neoBuilding, readerWriter, subOctreeName_counter);
				}
			}
		}
		
		if(areAllSubOctreesLoadedFile)
		{
			neoBuilding.octreeLoadedAllFiles = true;
		}
		
	}
	
};

/**
 * 헤더 파일을 읽어서 Frustum Culling으로 화면에 rendering
 * @param GL 변수
 * @param cameraPosition 변수
 * @param modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderNeoBuildings = function(GL, cameraPosition, modelViewProjectionRelativeToEye, scene, isLastFrustum) {
	if(!isLastFrustum) return;
	
	if(this.textureAux_1x1 == undefined) {
		this.textureAux_1x1 = GL.createTexture();
		// Test wait for texture to load.********************************************
		GL.bindTexture(GL.TEXTURE_2D, this.textureAux_1x1);
		//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
		GL.bindTexture(GL.TEXTURE_2D, null);
	}
	
	if(this.depthFboNeo == undefined) this.depthFboNeo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	//if(this.ssaoFboNeo == undefined)this.ssaoFboNeo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight); // no used.***
	
	// do frustum culling.***
	if(!this.isCameraMoving) {
		var frustumVolume = scene._frameState.cullingVolume;
		this.currentVisibleNeoBuildings_array.length = 0;
		this.doFrustumCullingNeoBuildings(frustumVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
		this.prepareNeoBuildings(GL, scene);
	}
	
	if(this.visibleObjControlerBuildings.currentVisibles0.length > 0) {
		this.detailed_neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[0]; // provisionally take the 1rst.***
	} else {
		this.detailed_neoBuilding = undefined;
	}
	
	//if(!this.isCameraMoving)
	//{
	//	this.currentRenderablesNeoRefListsArray.length = 0;
	//	this.getRenderablesDetailedNeoBuilding(GL, scene, this.detailed_neoBuilding , this.currentRenderablesNeoRefListsArray);
	//}

	if(this.bPicking == true) {
		this.objectSelected = this.getSelectedObjectPicking(GL, scene, this.currentRenderablesNeoRefListsArray);
	}
	
	//return;
	
	//if(this.detailed_neoBuilding) // Provisional.***
	if(this.visibleObjControlerBuildings.currentVisibles0.length > 0) {
		// Calculate "modelViewProjectionRelativeToEye".*********************************************************
		Cesium.Matrix4.toArray(scene._context._us.modelViewProjectionRelativeToEye, this.modelViewProjRelToEyeMatrix); 
		Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEyeMatrix); // Original.*** 
		Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
		Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
		//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
		// Calculate encodedCamPosMC high and low values.********************************************************
		this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
		
		// Normal matrix.********************************************************************
		var mvMat = scene._context._us._modelView; // original.***
		var mvMat_inv = new Cesium.Matrix4();
		mvMat_inv = Cesium.Matrix4.inverse(mvMat, mvMat_inv);
		//var normalMat = new Cesium.Matrix4();
		this.normalMat4 = Cesium.Matrix4.transpose(mvMat_inv, this.normalMat4);// Original.***
		//this.normalMat4 = Cesium.Matrix4.clone(mvMat_inv, this.normalMat4);
		this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);

		Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
		Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 
	
		var camera = scene._camera;
		var frustum = camera.frustum;
		var current_frustum_near = scene._context._us._currentFrustum.x;
		var current_frustum_far = scene._context._us._currentFrustum.y;
		
		GL.enable(GL.CULL_FACE);
		
		//scene._context._currentFramebuffer._bind();
		
		var ssao_idx = 0; // 0= depth. 1= ssao.***
		
		// 1) The depth render.***************************************************************************************************
		// 1) The depth render.***************************************************************************************************
		// 1) The depth render.***************************************************************************************************
		var currentShader = this.postFxShadersManager.pFx_shaders_array[3]; // neo depth.***
		//var currentShader = this.postFxShadersManager.pFx_shaders_array[5]; // neo depth TEST.***
		this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
		GL.clearColor(0, 0, 0, 1);
		GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		GL.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);  
	
		var shaderProgram = currentShader.program;
		GL.useProgram(shaderProgram);
		//GL.enableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
		GL.enableVertexAttribArray(currentShader.position3_loc);
		if(currentShader.normal3_loc != -1) GL.enableVertexAttribArray(currentShader.normal3_loc);

		GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEyeMatrix);
		GL.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEyeMatrix); // original.***
		GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
		GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
		GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		
		GL.uniform1f(currentShader.near_loc, frustum._near);	
		//GL.uniform1f(currentShader.far_loc, frustum._far);	
		GL.uniform1f(currentShader.far_loc, current_frustum_far); 
		
		GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
		GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
		var renderTexture = false;
		var cameraPosition = null;
		var neoBuilding;
		
		// renderDepth for all buildings.***
		// 1) LOD 0.***
		var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for(var i=0; i<buildingsCount; i++) {
			neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			if(!this.isCameraMoving)
			{
				this.getRenderablesDetailedNeoBuilding(GL, scene, neoBuilding , this.currentRenderablesNeoRefListsArray);
			}
			GL.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
			GL.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			GL.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			this.renderDetailedNeoBuilding(GL, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.currentRenderablesNeoRefLists);
		}
		
		// now, render depth of the neoSimpleBuildings.**********************************************************************************************
		var imageLod = 3;
		var neoSkinsCount = this.currentVisibleNeoBuildings_array.length;
		for(var i=0; i<neoSkinsCount; i++) {
			neoBuilding = this.currentVisibleNeoBuildings_array[i];
			var neoSkin = neoBuilding.neoSimpleBuilding;
			// check if loaded the simplebuilding texture.***
			if(neoSkin.texturesArray.length == 0)
			{
				// must load the texture.***
				if(this.backGround_imageReadings_count < 10)
				{
					var simpBuild_tex = neoSkin.newTexture();
					
					var filePath_inServer = this.readerWriter.geometryDataPath +"/" + neoBuilding.buildingFileName + Constant.SIMPLE_BUILDING_TEXTURE3x3_BMP;
					this.readerWriter.readTextureInServer(GL, filePath_inServer, simpBuild_tex, this);
				}
			} else {
				var simpBuildTexture = neoSkin.texturesArray[0]; 
				if(simpBuildTexture.load_finished) {
					if(simpBuildTexture.textureId != undefined) {
						// RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.***
						//this.renderer.renderNeoSimpleBuildingDepthShader(GL, neoBuilding, this, currentShader); 
					} else {
						/*
						simpBuildTexture.textureId = GL.createTexture();
		
						// must upload the texture to gl.***
						GL.bindTexture(GL.TEXTURE_2D, simpBuildTexture.textureId);
						////GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
						GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, simpBuildTexture.texImage); // Original.***
						GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
						GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
						GL.generateMipmap(GL.TEXTURE_2D);
						GL.bindTexture(GL.TEXTURE_2D, null);
						  
						delete simpBuildTexture.texImage;
						*/
					}
				}
			}
		}
		
		if(currentShader.normal3_loc != -1) GL.disableVertexAttribArray(currentShader.normal3_loc);
		GL.disableVertexAttribArray(currentShader.position3_loc);
		//GL.disableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
	
		this.depthFboNeo.unbind();
		
		// 2) ssao render.************************************************************************************************************
		// 2) ssao render.************************************************************************************************************
		// 2) ssao render.************************************************************************************************************
		scene._context._currentFramebuffer._bind();
		currentShader = this.postFxShadersManager.pFx_shaders_array[4];
		
		//GL.clearColor(0, 0, 0, 1);
		//GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
		//GL.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
		
		if(this.noiseTexture == undefined) this.noiseTexture = genNoiseTextureRGBA(GL, 4, 4, this.pixels);
		
		shaderProgram = currentShader.program;
		GL.useProgram(shaderProgram);
		GL.enableVertexAttribArray(currentShader.texCoord2_loc);
		GL.enableVertexAttribArray(currentShader.position3_loc);
		if(currentShader.normal3_loc != -1) GL.enableVertexAttribArray(currentShader.normal3_loc);

		GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEyeMatrix);
		GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
		GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***

		GL.uniform1f(currentShader.near_loc, frustum._near);	
		//GL.uniform1f(currentShader.far_loc, frustum._far); // Original.***
		GL.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
		
		GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
		GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
			
		GL.uniform1i(currentShader.depthTex_loc, 0);	
		GL.uniform1i(currentShader.noiseTex_loc, 1);	
		GL.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
		GL.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
		GL.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
		GL.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
		GL.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
		GL.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
		GL.uniform3fv(currentShader.kernel16_loc, this.kernel);	
		GL.activeTexture(GL.TEXTURE0);
		GL.bindTexture(GL.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
		GL.activeTexture(GL.TEXTURE1);            
		GL.bindTexture(GL.TEXTURE_2D, this.noiseTexture); 
			
		renderTexture = true;

		ssao_idx = 1;
		var cameraPosition = null;
		//this.renderDetailedNeoBuilding(GL, cameraPosition, scene, currentShader, renderTexture, ssao_idx, this.currentRenderablesNeoRefListsArray);
		buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for(var i=0; i<buildingsCount; i++)
		{
			neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			GL.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
			GL.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			GL.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			this.renderDetailedNeoBuilding(GL, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.currentRenderablesNeoRefLists);
		}
		// now, render ssao of the neoSimpleBuildings.**********************************************************************************
		var imageLod = 3;
		var neoSkinsCount = this.currentVisibleNeoBuildings_array.length;
		for(var i=0; i<neoSkinsCount; i++)
		{
			var neoBuilding = this.currentVisibleNeoBuildings_array[i];
			var neoSkin = neoBuilding.neoSimpleBuilding;
			// check if loaded the simplebuilding texture.***
			if(neoSkin.texturesArray.length == 0)
			{
				// must load the texture.***
				if(this.backGround_imageReadings_count < 10)
				{
					var simpBuild_tex = neoSkin.newTexture();
					
					var filePath_inServer = this.readerWriter.geometryDataPath +"/" + neoBuilding.buildingFileName + Constant.SIMPLE_BUILDING_TEXTURE3x3_BMP;
					this.readerWriter.readTextureInServer(GL, filePath_inServer, simpBuild_tex, this);
				}
			}
			else
			{
				var simpBuildTexture = neoSkin.texturesArray[0]; 
				if(simpBuildTexture.load_finished)
				{
					if(simpBuildTexture.textureId != undefined)
					{
						// RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.***
						//this.renderer.renderNeoSimpleBuildingPostFxShader(GL, neoBuilding, this, imageLod, currentShader); 
					}
					else
					{
						/*
						simpBuildTexture.textureId = GL.createTexture();
		
						// must upload the texture to gl.***
						GL.bindTexture(GL.TEXTURE_2D, simpBuildTexture.textureId);
						////GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
						GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, simpBuildTexture.texImage); // Original.***
						GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
						GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
						GL.generateMipmap(GL.TEXTURE_2D);
						GL.bindTexture(GL.TEXTURE_2D, null);
						  
						delete simpBuildTexture.texImage;
						*/
					}
				}
			}
		}
		
		if(currentShader.normal3_loc != -1) GL.disableVertexAttribArray(currentShader.normal3_loc);
		GL.disableVertexAttribArray(currentShader.position3_loc);
		GL.disableVertexAttribArray(currentShader.texCoord2_loc);
		
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 * @returns selectionCandidateObjectsArray[idx]
 */
CesiumManager.prototype.getSelectedObjectPicking = function(gl, scene, renderables_neoRefLists_array) {
	// Picking render.***
	// Picking render.***
	// Picking render.***

	this.bPicking = false;
	
	var GL = gl;
	var cameraPosition = scene.context._us._cameraPosition;
	
	if(this.selectionFbo == undefined)this.selectionFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	
	// do frustum culling.***
	if(!this.isCameraMoving)
	{
		var frustumVolume = scene._frameState.cullingVolume;
		this.currentVisibleNeoBuildings_array.length = 0;
		this.doFrustumCullingNeoBuildings(frustumVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
	}
	
	if(this.detailed_neoBuilding) // original.***
	//if(this.currentVisibleNeoBuildings_array.length > 0)
	{
		// Calculate "modelViewProjectionRelativeToEye".*********************************************************
		Cesium.Matrix4.toArray(scene._context._us.modelViewProjectionRelativeToEye, this.modelViewProjRelToEyeMatrix); 
		Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEyeMatrix); // Original.*** 
		Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
		Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
		//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
		// Calculate encodedCamPosMC high and low values.********************************************************
		this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
		
		// Normal matrix.********************************************************************
		var mvMat = scene._context._us._modelView; // original.***
		var mvMat_inv = new Cesium.Matrix4();
		mvMat_inv = Cesium.Matrix4.inverse(mvMat, mvMat_inv);
		//var normalMat = new Cesium.Matrix4();
		this.normalMat4 = Cesium.Matrix4.transpose(mvMat_inv, this.normalMat4);// Original.***
		//this.normalMat4 = Cesium.Matrix4.clone(mvMat_inv, this.normalMat4);
		this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);

		Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
		Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 
	
		var camera = scene._camera;
		var frustum = camera.frustum;
		var current_frustum_near = scene._context._us._currentFrustum.x;
		var current_frustum_far = scene._context._us._currentFrustum.y;
		
		gl.enable(gl.CULL_FACE); // option.***

		// colorSelection render.************************************************************************************************************
		// colorSelection render.************************************************************************************************************
		// colorSelection render.************************************************************************************************************
		
		//scene._context._currentFramebuffer._bind();// no.***
		this.selectionFbo.bind(); // framebuffer for color selection.***
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.selectionFbo.colorBuffer, 0);
		
		var currentShader = this.postFxShadersManager.pFx_shaders_array[5]; // color selection shader.***
		
		gl.clearColor(1, 1, 1, 1); // white background.***
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
		//gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
		
		var shaderProgram = currentShader.program;
		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(currentShader.position3_loc);
		//gl.enableVertexAttribArray(currentShader.normal3_loc);

		gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEyeMatrix);
		GL.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, this.detailed_neoBuilding.move_matrix);
		gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding.buildingPositionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding.buildingPositionLOW);

		var ssao_idx = -1; // selection code.***
		//ssao_idx = 1; // test.***
		var renderTexture = false;
		var cameraPosition = null;
		this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, renderables_neoRefLists_array);
		
		gl.disableVertexAttribArray(currentShader.position3_loc);
		//gl.disableVertexAttribArray(currentShader.normal3_loc);
		
		// Now, read the picked pixel and find the object.*********************************************************

		var pixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
		gl.readPixels(this.mouse_x, scene.drawingBufferHeight - this.mouse_y, 1, 1, GL.RGBA, GL.UNSIGNED_BYTE, pixels);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		// now, select the object.***
		var idx = 64516*pixels[0] + 254*pixels[1] + pixels[2];
		//this.objectSelected = this.selectionCandidateObjectsArray[idx];
		
		return this.selectionCandidateObjectsArray[idx];
	} else {
		return undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param scene 변수
 * @param resultRay 변수
 * @returns resultRay
 */
CesiumManager.prototype.getRayCamSpace = function(GL, scene, resultRay) {
	var frustum_far = 1.0; // unitary frustum far.***
	var camera = scene._camera;
	var frustum = camera.frustum;
	var fov = frustum._fovy;
	var aspectRatio = frustum.aspectRatio;
	
	var hfar = 2.0 * Math.tan(fov/2.0) * frustum_far;
	var wfar = hfar * aspectRatio;
	var mouseX = this.mouse_x;
	var mouseY = scene.drawingBufferHeight - this.mouse_y;
	if(resultRay == undefined) resultRay = new Float32Array(3);
	resultRay[0] = wfar*((mouseX/scene.drawingBufferWidth) - 0.5);
	resultRay[1] = hfar*((mouseY/scene.drawingBufferHeight) - 0.5);
	resultRay[2] = - frustum_far;
	
	return resultRay;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param cameraPosition 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.calculateSelObjMovePlane = function(GL, cameraPosition, scene, renderables_neoRefLists_array) {
	
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	var gl = GL;
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
  
	var camera = scene._camera;
	var frustum = camera.frustum;
	var current_frustum_near = scene._context._us._currentFrustum.x;
	var current_frustum_far = scene._context._us._currentFrustum.y;
	var frustumsCount = scene._frustumCommandsList.length;
	current_frustum_far = scene._frustumCommandsList[frustumsCount-1].far;
	
	this.selectionFbo.bind(); // framebuffer for color selection.***
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.selectionFbo.colorBuffer, 0);
	
	//var currentShader = this.postFxShadersManager.pFx_shaders_array[6]; // depth shader.***
	var currentShader = this.postFxShadersManager.pFx_shaders_array[3]; // ssao_depth shader.***
	
	gl.clearColor(1, 1, 1, 1); // white background.***
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
	//gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	var shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEyeMatrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEyeMatrix); // original.***
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding.buildingPositionHIGH);
	gl.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding.buildingPositionLOW);
	  
	GL.uniform1f(currentShader.far_loc, current_frustum_far); 

	var ssao_idx = -1; // selection code.***
	//ssao_idx = 1; // test.***
	var renderTexture = false;
	this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, renderables_neoRefLists_array);
	
	gl.disableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	
	// Now, read the picked pixel and find the pixel position.*********************************************************
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(this.mouse_x, scene.drawingBufferHeight - this.mouse_y, 1, 1, GL.RGBA, GL.UNSIGNED_BYTE, depthPixels);

	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	zDepth /= 256.0; // convert to 0 to 1.0 range depth.***

	var realZDepth = zDepth*current_frustum_far;
	
	// now, find the 3d position of the pixel in camCoord.****
	var ray = new Float32Array(3);
	ray = this.getRayCamSpace(GL, scene, ray);
	
	var pixelPosCamCoord = new Float32Array(3);
	pixelPosCamCoord[0] = ray[0] * realZDepth;
	pixelPosCamCoord[1] = ray[1] * realZDepth;
	pixelPosCamCoord[2] = ray[2] * realZDepth;
	
	// now, must transform this pixelCamCoord to world coord.***
	var mv_inv = new Cesium.Matrix4();
	mv_inv = Cesium.Matrix4.inverse(scene._context._us._modelView, mv_inv);
	var pixelPosCamCoordCartesian = new Cesium.Cartesian3(pixelPosCamCoord[0], pixelPosCamCoord[1], pixelPosCamCoord[2]);
	var pixelPos = new Cesium.Cartesian3();
	pixelPos = Cesium.Matrix4.multiplyByPoint(mv_inv, pixelPosCamCoordCartesian, pixelPos);
	
	var pixelPosBuilding = new Cesium.Cartesian3();
	pixelPosBuilding = Cesium.Matrix4.multiplyByPoint(this.detailed_neoBuilding.transfMat_inv, pixelPos, pixelPosBuilding);
	
	this.selObjMovePlane = new Plane();
	// provisionally make an XY plane.***
	// the plane is in world coord.***
	this.selObjMovePlane.setPointAndNormal(pixelPosBuilding.x, pixelPosBuilding.y, pixelPosBuilding.z, 0.0, 0.0, 1.0);
	
	/*
	// a check. calculate the ray direction and compare with the cesium camera direction.***
	var rayDirX = pixelPos.x - camera._position.x;
	var rayDirY = pixelPos.y - camera._position.y;
	var rayDirZ = pixelPos.z - camera._position.z;
	var module = Math.sqrt(rayDirX*rayDirX + rayDirY*rayDirY + rayDirZ*rayDirZ);
	
	rayDirX /= module;
	rayDirY /= module;
	rayDirZ /= module;
	*/
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/*
// camera function.***
function getPickRayPerspective(camera, windowPosition, result) {
    var canvas = camera._scene.canvas;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    var tanPhi = Math.tan(camera.frustum.fovy * 0.5);
    var tanTheta = camera.frustum.aspectRatio * tanPhi;
    var near = camera.frustum.near;

    var x = (2.0 / width) * windowPosition.x - 1.0;
    var y = (2.0 / height) * (height - windowPosition.y) - 1.0;

    var position = camera.positionWC;
    Cartesian3.clone(position, result.origin);

    var nearCenter = Cartesian3.multiplyByScalar(camera.directionWC, near, pickPerspCenter);
    Cartesian3.add(position, nearCenter, nearCenter);
    var xDir = Cartesian3.multiplyByScalar(camera.rightWC, x * near * tanTheta, pickPerspXDir);
    var yDir = Cartesian3.multiplyByScalar(camera.upWC, y * near * tanPhi, pickPerspYDir);
    var direction = Cartesian3.add(nearCenter, xDir, result.direction);
    Cartesian3.add(direction, yDir, direction);
    Cartesian3.subtract(direction, position, direction);
    Cartesian3.normalize(direction, direction);

    return result;
}
*/

/**
 * 어떤 일을 하고 있습니까?
 * @param state 변수
 * @param scene 변수
 */	
CesiumManager.prototype.enableCameraMotion = function(state, scene) {
	scene.screenSpaceCameraController.enableRotate = state;
	scene.screenSpaceCameraController.enableZoom = state;
	scene.screenSpaceCameraController.enableLook = state;
	scene.screenSpaceCameraController.enableTilt = state;
	scene.screenSpaceCameraController.enableTranslate = state;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param scene 변수
 */
CesiumManager.prototype.isDragging = function(GL, scene) {
	// test function.***
	var current_objectSelected = this.getSelectedObjectPicking(GL, scene, this.currentRenderablesNeoRefListsArray);
	
	if(current_objectSelected == this.objectSelected) {
		return true;
	} else {
		return false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.moveSelectedObject = function(GL, scene, renderables_neoRefLists_array) {
	if(this.objectSelected == undefined) return;
	
	// 1rst, check if the clicked point is the selected object.***
	//var current_selectedObject = this.getSelectedObjectPicking(GL, scene, renderables_neoRefLists_array);
	//if(current_selectedObject != this.objectSelected)
	//	return;
	
	//this.objMovState
	
	var cameraPosition = scene.context._us._cameraPosition;
	//this.enableCameraMotion(false, scene);
	
	// create a XY_plane in the selected_pixel_position.***
	if(this.selObjMovePlane == undefined)
	{
		this.calculateSelObjMovePlane(GL, cameraPosition, scene, renderables_neoRefLists_array);
	}
	
	// world ray = camPos + lambda*camDir.***
	var camera = scene._camera;
	var camPos = camera._position;
	
	var windowPosition = new Cesium.Cartesian2(this.mouse_x, this.mouse_y);
	var camRay = new Cesium.Ray();
	camRay = camera.getPickRay(windowPosition, camRay);
	var rayWorldSpace = new Cesium.Cartesian3(camRay.direction.x, camRay.direction.y, camRay.direction.z);
	
	// transform world_ray to building_ray.***
	var camPosBuilding = new Cesium.Cartesian3();
	camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.detailed_neoBuilding.transfMat_inv, camPos, camPosBuilding);
	
	var camDirBuilding = new Cesium.Cartesian3();
	camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.detailed_neoBuilding.move_matrix_inv, rayWorldSpace, camDirBuilding); // "move_matrix_inv" is only rotation matrix.***
	
	// now, intersect building_ray with the selObjMovePlane.***
	var line = new Line();
	line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z,       camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);
	
	var intersectionPoint = new Point3D();
	intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);
	
	// register the movement.***
	if(this.objectSelected.moveVector == undefined)
		this.objectSelected.moveVector = new Point3D();
	
	//this.thereAreStartMovePoint;
	//this.startMovPoint;
	
	if(!this.thereAreStartMovePoint)
	{
		this.startMovPoint = intersectionPoint;
		this.startMovPoint.add(-this.objectSelected.moveVector.x, -this.objectSelected.moveVector.y, -this.objectSelected.moveVector.z);
		this.thereAreStartMovePoint = true;
	}
	else
	{
		var difX = intersectionPoint.x - this.startMovPoint.x;
		var difY = intersectionPoint.y - this.startMovPoint.y;
		var difZ = intersectionPoint.z - this.startMovPoint.z;
		
		this.objectSelected.moveVector.set(difX, difY, difZ);
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param scene 변수
 * @param result_neoRefLists_array 변수
 * @returns result_neoRefLists_array
 */
CesiumManager.prototype.getRenderablesDetailedNeoBuilding = function(GL, scene, neoBuilding, result_neoRefLists_array) {
	result_neoRefLists_array.length = 0; // Init.***
	neoBuilding.currentRenderablesNeoRefLists.length = 0; // Init.***
	
	if(neoBuilding == undefined)
		return result_neoRefLists_array;
	
	if(neoBuilding.move_matrix == undefined)
	{
		ManagerUtils.calculateBuildingPositionMatrix(neoBuilding);
		return result_neoRefLists_array;
	}
	
	var cameraPosition = scene.context._us._cameraPosition;
	var transformedCamPos = neoBuilding.getTransformedRelativeEyePositionToBuilding(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	this.isCameraInsideNeoBuilding = neoBuilding.isCameraInsideOfBuilding(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
	//if(!this.isCameraMoving)
	{
		result_neoRefLists_array.length = 0; // init.***
		var refList;
		var maxRefListParsingCount = 10;
		var refListsParsingCount = 0;
		var buildingRotationMatrix;
		
		// Determine if the camera is inside of the building.***
		
		if(this.isCameraInsideNeoBuilding && neoBuilding.octree != undefined)
		{
			// check if must load the octree.***
			this.loadBuildingOctree(neoBuilding); // here loads octree interior references.***
			
			if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
			
			if(neoBuilding.buildingPosMat_inv == undefined)
			{
			    neoBuilding.buildingPosMat_inv = new Matrix4();
			    neoBuilding.buildingPosMat_inv.setByFloat32Array(neoBuilding.move_matrix_inv);
			}
			
			var camera = scene.frameState.camera;
			var cameraDir = camera.direction;
			var transformedCamDir;
			var transformedCamUp;
			
			this.pointSC.set(cameraDir.x, cameraDir.y, cameraDir.z);
			transformedCamDir = neoBuilding.buildingPosMat_inv.transformPoint3D(this.pointSC, transformedCamDir);
			this.pointSC.set(camera.up.x, camera.up.y, camera.up.z);
			transformedCamUp = neoBuilding.buildingPosMat_inv.transformPoint3D(this.pointSC, transformedCamUp);
			
			this.myCameraSC.position.x = transformedCamPos.x; 
			this.myCameraSC.position.y = transformedCamPos.y;
			this.myCameraSC.position.z = transformedCamPos.z;
			
			this.myCameraSC.direction.x = transformedCamDir.x;
			this.myCameraSC.direction.y = transformedCamDir.y;
			this.myCameraSC.direction.z = transformedCamDir.z;
			
			this.myCameraSC.up.x = transformedCamUp.x;
			this.myCameraSC.up.y = transformedCamUp.y;
			this.myCameraSC.up.z = transformedCamUp.z;
			
			var myCullingVolume = this.myCameraSC.frustum.computeCullingVolume(this.myCameraSC.position, this.myCameraSC.direction, this.myCameraSC.up);
		
			// then do frustum culling for interior octree.***
			this.intNeoRefList_array.length = 0;
			neoBuilding.octree.getFrustumVisibleNeoRefListArray(myCullingVolume, this.intNeoRefList_array, this.boundingSphere_Aux, transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
			buildingRotationMatrix = new Matrix4();
			buildingRotationMatrix.setByFloat32Array(neoBuilding.move_matrix);
			
			for(var i=0; i<this.intNeoRefList_array.length; i++)
			{
				// Before "updateCurrentVisibleIndicesInterior", must check if the refList has parsed the arrayBuffer data.***
				refList = this.intNeoRefList_array[i];
				if(refList.fileLoadState == 2 ) // 2 = file loading finished.***
				{
					if(refListsParsingCount < maxRefListParsingCount)
					{
						// must parse the arraybuffer data.***
						refList.parseArrayBuffer(GL, refList.dataArraybuffer, this.readerWriter);
						refList.dataArraybuffer = null;
						if(buildingRotationMatrix)
						{
							refList.multiplyReferencesMatrices(buildingRotationMatrix);
						}
			  
						refListsParsingCount += 1;
					}
				}
				else if(refList.fileLoadState == 4 ) // 4 = parsed.***
				{
					// now, check if the blocksList is loaded & parsed.***
					var blocksList = refList.blocksList;
					if(blocksList.fileLoadState == 0) // 0 = file loading NO started.***
					{
						if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
						{
							// must read blocksList.***
							var geometryDataPath = this.readerWriter.geometryDataPath;
							var buildingFolderName = neoBuilding.buildingFileName;
		
							var filePathInServer = geometryDataPath + "/" + buildingFolderName + "/" + blocksList.name;
							this.readerWriter.readNeoBlocksArraybufferInServer(GL, filePathInServer, blocksList, neoBuilding, this);
						}
						continue;
					}
					
					refList.updateCurrentVisibleIndicesInterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
					neoBuilding.currentRenderablesNeoRefLists.push(refList);
				}
			}
		}
		
		
		// Exterior and "bone" neoReferences.***************************
		// Before "updateCurrentVisibleIndicesInterior", must check if the refList has parsed the arrayBuffer data.***
		buildingRotationMatrix = new Matrix4();
		buildingRotationMatrix.setByFloat32Array(neoBuilding.move_matrix);
			
		var extNeoRefsCount = neoBuilding.neoRefListsContainer.neoRefsLists_Array.length;
		for(var i=0; i<extNeoRefsCount; i++)
		{
			refList = neoBuilding.neoRefListsContainer.neoRefsLists_Array[i];
			if(refList.fileLoadState == 2 ) // 2 = file loading finished.***
			{
				if(refListsParsingCount < maxRefListParsingCount)
				{
					// must parse the arraybuffer data.***
					refList.parseArrayBuffer(GL, refList.dataArraybuffer, this.readerWriter);
					refList.dataArraybuffer = null;
					if(buildingRotationMatrix)
					{
						refList.multiplyReferencesMatrices(buildingRotationMatrix);
					}
		  
					refListsParsingCount += 1;
				}
			}
			//else if(refList.fileLoadState == 4 )
			//{
			//	refList.updateCurrentVisibleIndicesInterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
			//	result_neoRefLists_array.push(refList); // GET INTERIORS.****
			//}
		}
		
		neoBuilding.updateCurrentVisibleIndicesExterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
		
		// now, make the result list.***
		var neoRefListsContainer_exterior = neoBuilding.neoRefListsContainer;
		var count = neoRefListsContainer_exterior.neoRefsLists_Array.length;
		for(var i=0; i<count; i++)
		{
			neoBuilding.currentRenderablesNeoRefLists.push(neoRefListsContainer_exterior.neoRefsLists_Array[i]);
		}
	}
	
	//return result_neoRefLists_array;
	return neoBuilding.currentRenderablesNeoRefLists;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param cameraPosition 카메라 입장에서 화면에 그리기 전에 객체를 그릴 필요가 있는지 유무를 판단하는 값
 * @param scene 변수
 * @param shader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 * @param neoRefLists_array 변수
 */
CesiumManager.prototype.renderDetailedNeoBuilding = function(GL, cameraPosition, scene, shader, renderTexture, ssao_idx, neoRefLists_array) {
	
	if(ssao_idx == -1)// picking mode.***********************************************************************************
	{
		// picking mode.***
		this.selectionCandidateObjectsArray.length = 0; // init.***
		
		// set byteColor codes for references objects.***
		var red = 0, green = 0, blue = 0, alfa = 255;
		
		// 1) Exterior objects.***
		var neoRefListsArray = neoRefLists_array;
		//var neoRefListsArray = this.detailed_neoBuilding.neoRefListsContainer.neoRefsLists_Array;
		var neoRefLists_count = neoRefListsArray.length;
		for(var i = 0; i<neoRefLists_count; i++)
		{
			var neoRefList = neoRefListsArray[i];
			var neoRefs_count = neoRefList.neoRefs_Array.length;
			for(var j=0; j<neoRefs_count; j++)
			{
				var neoRef = neoRefList.neoRefs_Array[j];
				if(neoRef.selColor4 == undefined) neoRef.selColor4 = new Color();
				
				neoRef.selColor4.set(red, green, blue, alfa);
				this.selectionCandidateObjectsArray.push(neoRef);
				blue++;
				if(blue >= 254)
				{
					blue = 0;
					green++;
					if(green >= 254)
					{
						red++;
					}
				}
			}
		}
	}

	if(ssao_idx == -1) {
		var isInterior = false; // no used.***
		this.renderer.renderNeoRefListsColorSelection(GL, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	} else {
		var isInterior = false; // no used.***
		this.renderer.renderNeoRefLists(GL, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param BR_Project 변수
 */
CesiumManager.prototype.createFirstTimeVBOCacheKeys = function(GL, BR_Project) {
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
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
	if(simpBuildingV1._simpleBuildingTexture == undefined) simpBuildingV1._simpleBuildingTexture = GL.createTexture();
	
	// Test wait for texture to load.********************************************
	//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
	GL.bindTexture(GL.TEXTURE_2D, simpBuildingV1._simpleBuildingTexture);
	//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
	//GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([240, 240, 240, 255])); // red
	GL.bindTexture(GL.TEXTURE_2D, null);
	BR_Project._f4d_nailImage_readed_finished = true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param scene 변수
 */
CesiumManager.prototype.reCalculateModelViewProjectionRelToEyeMatrix = function(scene) {
	if(scene.context._us._modelView[0] == 0 && scene.context._us._modelView[1] == 0 && scene.context._us._modelView[2] == 0 && scene.context._us._modelView[3] == 0 && 
			scene.context._us._modelView[4] == 0 && scene.context._us._modelView[5] == 0 && scene.context._us._modelView[6] == 0 && scene.context._us._modelView[7] == 0 && 
			scene.context._us._modelView[8] == 0 && scene.context._us._modelView[9] == 0 && scene.context._us._modelView[10] == 0 && scene.context._us._modelView[11] == 0 && 
			scene.context._us._modelView[12] == 0 && scene.context._us._modelView[13] == 0 && scene.context._us._modelView[14] == 0 && scene.context._us._modelView[15] == 0 ) {
		return;
	}
	var modelViewRelToEye = new Cesium.Matrix4();
	modelViewRelToEye = Cesium.Matrix4.clone(scene.context._us._modelView);
	modelViewRelToEye[12] = 0.0;
	modelViewRelToEye[13] = 0.0;
	modelViewRelToEye[14] = 0.0;
	var modelViewProjectionRelToEye = new Cesium.Matrix4();
	Cesium.Matrix4.multiply(scene.context._us._projection, modelViewRelToEye, modelViewProjectionRelToEye);
	Cesium.Matrix4.toArray(modelViewProjectionRelToEye, this.modelViewProjRelToEyeMatrix); 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param cameraPosition 변수
 * @param cullingVolume 변수
 * @param modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 * @param frustum_idx 변수
 */
CesiumManager.prototype.renderTerranTileServiceFormatPostFxShader = function(GL, cameraPosition, cullingVolume, modelViewProjectionRelativeToEye, scene, isLastFrustum, frustum_idx) {
	if(this.isCameraInsideNeoBuilding) return;
	
	GL.disable(GL.CULL_FACE); // Optional.***
	
	if(!isLastFrustum)return;
	
	//this.isCameraMoving = this.isButtonDown(scene);
	
	// Check if camera was moved considerably for update the renderables objects.***
	if(this.detailed_building)
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else{
		this.squareDistUmbral = 50*50;
	}
	var cameraMoved = this.isCameraMoved(cameraPosition, this.squareDistUmbral);
	
	if(this.depthFbo == undefined)this.depthFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	if(this.ssaoFbo == undefined)this.ssaoFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight); // no used.***
	
	// Another check for depthBuffer.***
	if(this.depthFbo.width != scene.drawingBufferWidth || this.depthFbo.height != scene.drawingBufferHeight)
	{
		this.depthFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}

	//if(cameraMoved && !this.isCameraMoving)
	if(!this.isCameraMoving)
	{
		this.currentVisibleBuildings_array.length = 0; // Init.***
		this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
		this.detailed_building;
	
		//this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // delete this.***
		this.doFrustumCullingTerranTileServiceFormat(GL, cullingVolume, this.currentVisibleBuildings_array, cameraPosition); 
	}
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	this.reCalculateModelViewProjectionRelToEyeMatrix(scene);

	//Cesium.Matrix4.toArray(modelViewProjectionRelativeToEye, this.modelViewProjRelToEyeMatrix); 
	Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEyeMatrix); // Original.*** 
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------

	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);

	// *************************************************************************************************************************************************
	// Now, render the detailed building if exist.******************************************************************************************************
	// This is OLD.************************************
	var transformedCamPos;
	var currentShader;
	if(this.detailed_building && isLastFrustum)
	{
		currentShader = this.shadersManager.getMagoShader(0);
		//this.render_DetailedBuilding(GL, cameraPosition, modelViewProjectionRelativeToEye, scene, currentShader);
	}
	// End render the detailed building if exist.---------------------------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------------------------------------------------------------------
	// Save the cesium framebuffer.***
	var cesium_frameBuffer = scene._context._currentFramebuffer._framebuffer;
	//var cesium_frameBuffer = scene._context._currentFramebuffer;
	
	// Now, render the simple visible buildings.***************************************************************************
	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	  
	var shaderProgram;
	
	// Calculate the normal_matrix.***
	//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL
	// this code must be executed if the camera was moved.***
	var cameraLittleMoved = this.isCameraMoved(cameraPosition, 10);
	//if(cameraLittleMoved)
	{
		var mvMat = scene._context._us._modelView; // original.***
		//var mvMat = scene._context._us._modelViewRelativeToEye;
		//mvMat[12] = 0.0;
		//mvMat[13] = 0.0;
		//mvMat[14] = 0.0;
		var mvMat_inv = new Cesium.Matrix4();
		mvMat_inv = Cesium.Matrix4.inverseTransformation(mvMat, mvMat_inv);
		//var normalMat = new Cesium.Matrix4();
		this.normalMat4 = Cesium.Matrix4.transpose(mvMat_inv, this.normalMat4);// Original.***
		//this.normalMat4 = Cesium.Matrix4.clone(mvMat_inv, this.normalMat4);
		this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);
	}
	
	Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
	Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 
	//GL.uniformMatrix3fv(currentShader._NormalMatrix, false, this.normalMat3_array);
	
	this.render_time = 0;
	if(this.isCameraMoving)
	{
		this.dateSC = new Date();
		this.currentTimeSC;
		this.startTimeSC = this.dateSC.getTime();
	}
	
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	var camera = scene._camera;
	var frustum = camera.frustum;
	var current_frustum_near = scene._context._us._currentFrustum.x;
	var current_frustum_far = scene._context._us._currentFrustum.y;
	current_frustum_far = 5000.0;
	
	// Depth render.********************************************************
	// Depth render.********************************************************
	// Depth render.********************************************************
	this.depthFbo.bind(); // DEPTH START.**************************************************************************************************************************************************
	GL.clearColor(0, 0, 0, 1);
	GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	GL.viewport(0, 0, this.depthFbo.width, this.depthFbo.height);  
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[0];
	
	shaderProgram = currentShader.program;
	GL.useProgram(shaderProgram);
	//GL.enableVertexAttribArray(currentShader.texCoord2_loc); // no use texcoords.***
	GL.enableVertexAttribArray(currentShader.position3_loc);
	GL.enableVertexAttribArray(currentShader.normal3_loc);

	GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEyeMatrix);
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEyeMatrix); // original.***
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	GL.uniform1f(currentShader.near_loc, frustum._near);	
	//GL.uniform1f(currentShader.far_loc, frustum._far);	// Original (bad)..***
	GL.uniform1f(currentShader.far_loc, current_frustum_far); // test (best)..***	
	
	GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
	
	//GL.uniform1i(currentShader.useRefTransfMatrix_loc, false, false);
	
	// LOD0 BUILDINGS.***************************************************************************************************************

	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
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
					this.createFirstTimeVBOCacheKeys(GL, BR_Project);
					continue;
				}
				else if(!BR_Project._f4d_nailImage_readed)
				{
					if(this.backGround_imageReadings_count < 100)
					{
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						///////////////////////////////////////////////////////////
						this.readerWriter.readNailImageOfArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
						//--------------------------------------------------------------------------
					}
					continue;
				}
				else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists)
				{
					if(!this.isCameraMoving && this.backGround_fileReadings_count < 1)
					{
						//filePath_scratch = this.readerWriter.geometryDataPath +"/Result_xdo2f4d/" + BR_Project.rawPathName + ".jpg"; // Old.***
						filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";
						
						this.readerWriter.readNailImageInServer(GL, filePath_scratch, BR_Project, this.readerWriter, this, 0); 
						this.backGround_fileReadings_count ++;
						
					}
					//continue;
				}
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}
		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1)// Test
		{
			//renderSimpleBuildingV1PostFxShader
			this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, -1, currentShader); // 3 = lod3.***
			/*
			if(BR_Project._f4d_lod0Image_exists)
			{
				if(BR_Project._f4d_lod0Image_readed_finished)
					this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, -1, currentShader); // 0 = lod0.***

				else if(BR_Project._f4d_nailImage_readed_finished)
				{
					this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, -1, currentShader); // 3 = lod3.***
				}
			}
			else if(BR_Project._f4d_nailImage_readed_finished)
			{
				this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, -1, currentShader); // 3 = lod3.***
			}
			*/
		}
	}
	
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++)
	{
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
					this.createFirstTimeVBOCacheKeys(GL, BR_Project);
					continue;
				}
				else if(!BR_Project._f4d_nailImage_readed)
				{
					if(this.backGround_imageReadings_count < 100)
					{
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						this.readerWriter.readNailImageOfArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
					}
					continue;
				}
			}
			else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}
		
		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished)// Test
		{
			this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, -1, currentShader); // 3 = lod3.***
		}
	}
	//GL.disableVertexAttribArray(currentShader.texCoord2_loc);
	GL.disableVertexAttribArray(currentShader.position3_loc);
	GL.disableVertexAttribArray(currentShader.normal3_loc);
	this.depthFbo.unbind(); // DEPTH END.*****************************************************************************************************************************************************************
	
	//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	// Now, ssao.************************************************************
	// Now, ssao.************************************************************
	// Now, ssao.************************************************************
	scene._context._currentFramebuffer._bind();
	
	if(this.depthFbo.width != scene.drawingBufferWidth || this.depthFbo.height != scene.drawingBufferHeight)
	{
		this.depthFbo = new FBO(GL, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}
	
	//this.ssaoFbo.bind();// SSAO START.********************************************************************************************************************************************************************
	GL.clearColor(0, 0, 0, 1);
	//GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
	GL.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	if(this.noiseTexture == undefined)
	this.noiseTexture = genNoiseTextureRGBA(GL, 4, 4, this.pixels);
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[1];
	
	shaderProgram = currentShader.program;
	GL.useProgram(shaderProgram);
	GL.enableVertexAttribArray(currentShader.texCoord2_loc);
	GL.enableVertexAttribArray(currentShader.position3_loc);
	GL.enableVertexAttribArray(currentShader.normal3_loc);

	GL.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEyeMatrix);
	GL.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	GL.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***

	GL.uniform1f(currentShader.near_loc, frustum._near);	
	//GL.uniform1f(currentShader.far_loc, frustum._far); // Original.***
	GL.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
	
	GL.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	GL.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
	GL.uniform1i(currentShader.depthTex_loc, 0);	
	GL.uniform1i(currentShader.noiseTex_loc, 1);	
	GL.uniform1i(currentShader.diffuseTex_loc, 2);
	GL.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
	GL.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
	GL.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
	GL.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
	GL.uniform2fv(currentShader.noiseScale2_loc, [this.depthFbo.width/this.noiseTexture.width, this.depthFbo.height/this.noiseTexture.height]);	
	GL.uniform3fv(currentShader.kernel16_loc, this.kernel);	
	GL.activeTexture(GL.TEXTURE0);
	GL.bindTexture(GL.TEXTURE_2D, this.depthFbo.colorBuffer);  // original.***		
	GL.activeTexture(GL.TEXTURE1);            
	GL.bindTexture(GL.TEXTURE_2D, this.noiseTexture); 
	
	// LOD0 BUILDINGS.***************************************************************************************************************
	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
	for(var i=0; i<LOD0_projectsCount; i++) {
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
		
		//if(!this.isCameraMoving)
		{
			// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
			if(BR_Project._header._f4d_version == 2) {
				//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
				if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null) {
					this.createFirstTimeVBOCacheKeys(GL, BR_Project);
					continue;
				} else if(!BR_Project._f4d_nailImage_readed) {
					if(this.backGround_imageReadings_count < 100) {
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						this.readerWriter.readNailImageOfArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
					}
					continue;
				} else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists) {
					if(!this.isCameraMoving && this.backGround_fileReadings_count < 1) {
						//filePath_scratch = this.readerWriter.geometryDataPath +"/Result_xdo2f4d/" + BR_Project.rawPathName + ".jpg"; // Old.***
						filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";
						
						this.readerWriter.readNailImageInServer(GL, filePath_scratch, BR_Project, this.readerWriter, this, 0); 
						this.backGround_fileReadings_count ++;

					}
					//continue;
				}
			} else{
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}

		}
			
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1)// Test
		{
			//renderSimpleBuildingV1PostFxShader
			if(BR_Project._f4d_lod0Image_exists) {
				if(BR_Project._f4d_lod0Image_readed_finished) {
					this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, 0, currentShader); // 0 = lod0.***
				} else if(BR_Project._f4d_nailImage_readed_finished) {
					this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
				}
			} else if(BR_Project._f4d_nailImage_readed_finished) {
				this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
			}
		}
	}
			
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++) {
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
			if(BR_Project._header._f4d_version == 2) {
				//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
				var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
				if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null) {
					this.createFirstTimeVBOCacheKeys(GL, BR_Project);
					continue;
				} else if(!BR_Project._f4d_nailImage_readed) {
					if(this.backGround_imageReadings_count < 100) {
						this.backGround_imageReadings_count++;
						BR_Project._f4d_nailImage_readed = true;
						
						var simpBuildingV1 = BR_Project._simpleBuilding_v1;
						this.readerWriter.readNailImageOfArrayBuffer(GL, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
					}
					continue;
				}
			} else {
				this.currentVisibleBuildingsPost_array.push(BR_Project);
			}
		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished)// Test 
		{
			this.renderer.renderSimpleBuildingV1PostFxShader(GL, BR_Project, this, 3, currentShader); // 3 = lod3.***
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
			
	GL.activeTexture(GL.TEXTURE0);  
	//this.ssaoFbo.unbind();
		
	GL.disableVertexAttribArray(currentShader.texCoord2_loc);
	GL.disableVertexAttribArray(currentShader.position3_loc);
	GL.disableVertexAttribArray(currentShader.normal3_loc);	
	//this.ssaoFbo.unbind();// SSAO END.********************************************************************************************************************************************************************

	// Now, blur.************************************************************
	// Now, blur.************************************************************
	// Now, blur.************************************************************
	/*
	scene._context._currentFramebuffer._bind();
	
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[2]; // blur.***
	
	shaderProgram = currentShader.program;
	GL.useProgram(shaderProgram);
	
	GL.enableVertexAttribArray(currentShader.texCoord2_loc);
	GL.enableVertexAttribArray(currentShader.position3_loc);
	//GL.enableVertexAttribArray(currentShader.normal3_loc);
	
	this.modelView_matrix[12] = 0.0;
	this.modelView_matrix[13] = 0.0;
	this.modelView_matrix[14] = 0.0;
	
	GL.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	GL.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	
	GL.uniform1i(currentShader.colorTex_loc, 0);	
	GL.uniform2fv(currentShader.texelSize_loc, [1/this.ssaoFbo.width, 1/this.ssaoFbo.height]);	
	GL.activeTexture(GL.TEXTURE0);
	//GL.bindTexture(GL.TEXTURE_2D, this.ssaoFbo.colorBuffer); // original.*** 
	GL.bindTexture(GL.TEXTURE_2D, scene._context._currentFramebuffer.colorBuffer);
		//scene._context._currentFramebuffer._bind();	
	this.ssaoFSQuad.draw(currentShader, GL); 
	GL.activeTexture(GL.TEXTURE0);
		
		
	GL.disableVertexAttribArray(currentShader.texCoord2_loc);
	GL.disableVertexAttribArray(currentShader.position3_loc);
	//GL.disableVertexAttribArray(currentShader.normal3_loc);	
	*/
	// END BLUR.**************************************************************************************************************************************************************************************************************
	
	GL.viewport(0, 0, scene._canvas.width, scene._canvas.height);
	
	scene._context._currentFramebuffer._bind();
	//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, cesium_frameBuffer);
	// Render the lasts simpleBuildings.***
	
	var last_simpBuilds_count = this.currentVisibleBuildingsPost_array.length;
	
	for(var i=0; i<last_simpBuilds_count; i++)
	{
		this.renderer.render_F4D_simpleBuilding(GL, this.currentVisibleBuildingsPost_array[i], this.modelViewProjRelToEyeMatrix, 
				this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.shadersManager);
	}
	
	//GL.useProgram(null);
	//GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
};

/**
 * 헤더 파일을 읽어서 object 개수만큼 루핑을 돌면서 화면에 표시
 * @param frustumVolume 변수
 * @param neoVisibleBuildings_array 변수
 * @param cameraPosition 변수
 * @returns neoVisibleBuildings_array
 */
CesiumManager.prototype.doFrustumCullingNeoBuildings = function(frustumVolume, neoVisibleBuildings_array, cameraPosition) {
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***
	neoVisibleBuildings_array.length = 0;
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	//this.min_squaredDist_to_see_detailed = 1000000; // Test for xxxx.***
	
	var squaredDistToCamera;
	var last_squared_dist;
	this.detailed_neoBuilding;
	
	var lod0_minSquaredDist = 100000*0.6;
	var lod1_minSquaredDist = 100000*3;
	var lod2_minSquaredDist = 100000*6;
	var lod3_minSquaredDist = 100000*9;
	
	
	this.visibleObjControlerBuildings.initArrays(); 
	
	var maxNumberOfCalculatingPositions = 50;
	var currentCalculatingPositionsCount = 0;
	
	// ajax 통신을 통해 header file은 후 neoBuilding_Array 에 geo 정보를 입력함
	var neoBuildings_count = this.neoBuildingsList.neoBuildings_Array.length;
	for(var i=0; i<neoBuildings_count; i++) {
		var neoBuilding = this.neoBuildingsList.neoBuildings_Array[i];
		
		// 1) check if there are cartesian position.***
		if(neoBuilding.buildingPosition == undefined)
		{
			// check if there are the metadata. if exist metadata try to calculate the position.***
			// we must fix the max number of this calculation to preserve smoothing rendering.***
			if(currentCalculatingPositionsCount < maxNumberOfCalculatingPositions)
			{
				if(neoBuilding.metaData != undefined)
				{
					// check if there are the geodetic location (longitude, latitude, altitude) inside of the metadata.***
					var longitude = neoBuilding.metaData.longitude;
					var latitude = neoBuilding.metaData.latitude;
					var altitude = neoBuilding.metaData.altitude;
					
					if(longitude != undefined && latitude != undefined && altitude != undefined )
					{
						var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude); 
						//var position = absolutePosition;
						neoBuilding.buildingPosition = position; 
						
						// High and Low values of the position.****************************************************
						var splitValue = Cesium.EncodedCartesian3.encode(position); // no works!.***
						var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
						var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
						var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
						
						neoBuilding.buildingPositionHIGH = new Float32Array([splitVelue_X.high, splitVelue_Y.high, splitVelue_Z.high]);
						neoBuilding.buildingPositionLOW = new Float32Array([splitVelue_X.low, splitVelue_Y.low, splitVelue_Z.low]);
						
						currentCalculatingPositionsCount += 1;
					}
				}
			}
			continue; 
		}
		
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, neoBuilding.buildingPosition);
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(neoBuilding.buildingPosition);

		this.radiusAprox_aux = 20.0;
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}
		
		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull != Cesium.Intersect.OUTSIDE) 
		{
			if(squaredDistToCamera < lod0_minSquaredDist)// min dist to see detailed.***
			{
				this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
			}
			else if(squaredDistToCamera < lod1_minSquaredDist)
			{
				this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
			}
			else if(squaredDistToCamera < lod2_minSquaredDist)
			{
				this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
			}
			else if(squaredDistToCamera < lod3_minSquaredDist)
			{
				this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
			}
		}
		else{
			
		}
		
	}
	/*
	var neoBuildings_count = this.neoBuildingsList.neoBuildings_Array.length;
	for(var i=0; i<neoBuildings_count; i++)
	{
		var neoBuilding = this.neoBuildingsList.neoBuildings_Array[i];
		
		if(neoBuilding.buildingPosition == undefined)
		{
			continue;
		}
		
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, neoBuilding.buildingPosition);
		if(squaredDistToCamera > this.min_squaredDist_to_see)
			continue;
		
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(neoBuilding.buildingPosition);
		this.radiusAprox_aux = 1000.0;
		
		if(this.radiusAprox_aux)
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		}
		else
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}
		
		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull != Cesium.Intersect.OUTSIDE) 
		{
			
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed)// min dist to see detailed.***
			{
				if(neoBuilding.neoRefListsContainer.neoRefsLists_Array.length > 0)
				{
					// Detect the Detailed building.***
					//if(neoBuilding._header._f4d_version == 1)	
					{
						if(last_squared_dist)
						{
							if(squaredDistToCamera < last_squared_dist)
							{
								last_squared_dist = squaredDistToCamera;
								neoVisibleBuildings_array.push(this.detailed_neoBuilding);
								this.detailed_neoBuilding = neoBuilding;
							}
							else{
									neoVisibleBuildings_array.push(neoBuilding);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_neoBuilding = neoBuilding;
							//neoVisibleBuildings_array.push(neoBuilding);
						}
					}
				}
				else{
					if(neoBuilding._header && neoBuilding._header.isSmall)
						neoVisibleBuildings_array.push(neoBuilding);
					else
					{
						neoVisibleBuildings_array.push(neoBuilding);
						//this.currentVisibleBuildings_LOD0_array.push(neoBuilding);
					}
				}
				
			}
			else{
				neoVisibleBuildings_array.push(neoBuilding);
			}
		}
	}
	*/
	return neoVisibleBuildings_array;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param frustumVolume 변수
 * @param visibleBuildings_array 변수
 * @param cameraPosition 변수
 * @returns visibleBuildings_array
 */
CesiumManager.prototype.doFrustumCullingTerranTileServiceFormat = function(GL, frustumVolume, visibleBuildings_array, cameraPosition) {
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***************************
	//visibleBuildings_array.length = 0; // Init.***
	//this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
	//this.detailed_building;
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	var squaredDistToCamera;
	var squaredDistToCamera_candidate;
	var last_squared_dist;
	var buildings_count;
	var nearestTile;
	var nearestTile_candidate;
	
	this.filteredVisibleTiles_array.length = 0;
	this.detailedVisibleTiles_array.length = 0;
	this.lOD0VisibleTilesArray.length = 0;
	
	var BR_Project;
	
	var max_tileFilesReading = 10;
	
	this.currentVisible_terranTiles_array.length = 0;// Init.***
	this.terranTile.getIntersectedSmallestTiles(frustumVolume, this.currentVisible_terranTiles_array, this.boundingSphere_Aux);
	
	// Find the nearest tile to camera.***
	var visibleTiles_count = this.currentVisible_terranTiles_array.length;
	if(visibleTiles_count == 0) return;
	
	for(var i=0; i<visibleTiles_count; i++)
	{
		this.terranTileSC = this.currentVisible_terranTiles_array[i];
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, this.terranTileSC.position);
		
		if(squaredDistToCamera > this.min_squaredDist_to_see) continue;
		
		if(squaredDistToCamera < this.min_squaredDist_to_see_detailed * 1.2)
		{
			this.detailedVisibleTiles_array.push(this.terranTileSC);
		}
		else if(squaredDistToCamera <  this.min_squaredDist_to_see_LOD0 * 1.2)
		{
			this.lOD0VisibleTilesArray.push(this.terranTileSC);
		}
		else
		{
			this.filteredVisibleTiles_array.push(this.terranTileSC); // Original.***
			//this.lOD0VisibleTilesArray.push(this.terranTileSC); // Test.***
		}
	}
	
	// Make the visible buildings list.******************************************************************************
	this.boundingSphere_Aux.radius = 50.0;
	var need_frustumCulling = false;
	var filePath_scratch;
	var tileNumberNameString;
	
	var detailedVisibleTiles_count = this.detailedVisibleTiles_array.length;
	for(var i=0; i<detailedVisibleTiles_count; i++)
	{
		this.terranTileSC = this.detailedVisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";	
				this.readerWriter.readTileArrayBufferInServer(GL, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFileOneBuilding(GL, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING) need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.detailedVisibleTiles_array[i]._BR_buildingsArray[j];

			if(BR_Project.buildingPosition == undefined)
			{
				this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				continue;
			}
			
			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
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
							else {
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						}
						else{
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
					
				}
				else {
					if(BR_Project._header.isSmall) visibleBuildings_array.push(BR_Project);
					else this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
			} else if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0) {
				if(need_frustumCulling) {
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if(need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
				} else this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			} else {
				if(need_frustumCulling) {
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if(need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
						visibleBuildings_array.push(BR_Project);
					}
				} else visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	var LOD0VisiblesTiles_count = this.lOD0VisibleTilesArray.length;
	for(var i=0; i<LOD0VisiblesTiles_count; i++)
	{
		this.terranTileSC = this.lOD0VisibleTilesArray[i];
		
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";	
				this.readerWriter.readTileArrayBufferInServer(GL, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFileOneBuilding(GL, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING) need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.lOD0VisibleTilesArray[i]._BR_buildingsArray[j];

			if(BR_Project.buildingPosition == undefined)
			{
				visibleBuildings_array.push(BR_Project);
				continue;
			}
			
			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
			if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
			{
				
				if(need_frustumCulling)
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				}
				else
					this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			}
			else
			{
				if(need_frustumCulling)
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
						visibleBuildings_array.push(BR_Project);
				}
				else
					visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	var filteredVisibleTiles_count = this.filteredVisibleTiles_array.length;
	for(var i=0; i<filteredVisibleTiles_count; i++) {
		this.terranTileSC = this.filteredVisibleTiles_array[i];
		if(!this.terranTileSC.fileReading_started)
		{
			if(this.backGround_fileReadings_count < max_tileFilesReading)
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";	
				this.readerWriter.readTileArrayBufferInServer(GL, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished)
		{
			//this.terranTileSC.parseFileOneBuilding(GL, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING) need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++)
		{
			BR_Project = this.filteredVisibleTiles_array[i]._BR_buildingsArray[j];

			if(BR_Project.buildingPosition == undefined)
			{
				visibleBuildings_array.push(BR_Project);
				continue;
			}
			else
			{
				squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
				if(BR_Project._header.isSmall)
				{
					if(squaredDistToCamera < this.min_squaredDist_to_see_smallBuildings)
					{
						if(need_frustumCulling)
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
								visibleBuildings_array.push(BR_Project);
							}
						} else visibleBuildings_array.push(BR_Project);
					}
				} else {
					// Provisionally check for LODzero distance.***
					if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0)
					{
						
						if(need_frustumCulling)
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						}
						else this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
					else {
						if(need_frustumCulling) {
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
								visibleBuildings_array.push(BR_Project);
							}
						} else visibleBuildings_array.push(BR_Project);
					}
				}
			}	
			
		}
	}
	
	return visibleBuildings_array;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustumVolume 변수
 * @param visibleBuildings_array 변수
 * @param cameraPosition 변수
 * @returns visibleBuildings_array
 */
CesiumManager.prototype.doFrustumCullingClouds = function(frustumVolume, visibleBuildings_array, cameraPosition) {
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***
	
	this.currentVisibleClouds_array.length = 0; // Init.***
	
	var min_squaredDist_to_see_detailed = 40000; // 200m.***
	var min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	var min_squaredDist_to_see = 10000000;
	var min_squaredDist_to_see_smallBuildings = 700000;
	
	var squaredDistToCamera;
	var last_squared_dist;
	
	var clouds_count = this.atmosphere.cloudsManager.circularCloudsArray.length;
	for(var p_counter = 0; p_counter<clouds_count; p_counter++)
	{
		var cloud = this.atmosphere.cloudsManager.circularCloudsArray[p_counter];
		
		if(cloud.cullingPosition == undefined)
		{
			continue;
		}
		
/*		
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, cloud.cullingPosition);
		if(squaredDistToCamera > min_squaredDist_to_see)
			continue;
		
		if(BR_Project._header.isSmall && squaredDistToCamera>min_squaredDist_to_see_smallBuildings)
			continue;
		*/
					
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(cloud.cullingPosition);
		this.radiusAprox_aux = cloud.cullingRadius;
		
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
			this.currentVisibleClouds_array.push(cloud);
		}
	}
	
	return visibleBuildings_array;
};

/**
 * 어떤 일을 하고 있습니까?
 */
CesiumManager.prototype.loadData = function(jsonBuildingInformation) {
	// Now, load sejong.***
	var project_number = 7500; // House with car and mini park to children.***
	var GAIA3D__counter =1;
	//GAIA3D__offset_latitude += 0.0021;
	//GAIA3D__offset_longitude += 0.0021;
	
	var incre_latAng = 0.0005;
	var incre_longAng = 0.0005;
	
	// Test modularitzing.*******************************************************
	var BR_ProjectsList = this.bRBuildingProjectsList;
	var neoBuildingsList = this.neoBuildingsList;

	var height = 1635.0;
	var GL = this.scene.context._gl;
	//viewer.readerWriter.openBuildingProject(GL, 100,  latitude, longitude, height, viewer.readerWriter, BR_ProjectsList);
	// End test modularitzing.---------------------------------------------------
	
	/*
	var cesiumTerrainProviderMeshes = new Cesium.CesiumTerrainProvider({
	url : '//assets.agi.com/stk-terrain/world',
	requestWaterMask : false,
	requestVertexNormals : true
	});
	this.terrainProvider = cesiumTerrainProviderMeshes;
	*/

	//this.readerWriter.openTerranTile(GL, this.terranTile, this.readerWriter);
	
	var buildingCount = jsonBuildingInformation.latitude.length;
	for(var i=0; i<buildingCount; i++) {
//		var deltaLat = -0.0015;
//		var deltaLon = 0.0015;
		var latitude = jsonBuildingInformation.latitude;
		var longitude = jsonBuildingInformation.longitude;
		var height = jsonBuildingInformation.height;
		var buildingFileName = jsonBuildingInformation.buildingFileName;
		//this.readerWriter.openNeoBuilding(GL, buildingFileName[i], latitude[i], longitude[i], height[i], this.readerWriter, neoBuildingsList, this);
	}
	
	var filePathInServer = this.readerWriter.geometryDataPath + Constant.OBJECT_INDEX_FILE;
	this.readerWriter.readObjectIndexFileInServer(GL, filePathInServer, this.readerWriter, this);

};

//# sourceURL=CesiumManager.js
