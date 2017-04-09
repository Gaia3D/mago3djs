'use strict';

/**
 * cesium을 관리
 * @class CesiumManager
 */
var CesiumManager = function() {
	if(!(this instanceof CesiumManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// F4D Data structure & objects.*****************************************
	this.bRBuildingProjectsList = new BRBuildingProjectsList(); // Old. Provisionally for f4d projects.*** !!!
	this.terranTile = new TerranTile();// use this.***
	this.neoBuildingsList = new NeoBuildingsList();
	//this.neoBuildingsList_3000 = new NeoBuildingsList();
	this.neoBuildingsListAux;
	this.renderer = new Renderer();
	this.selection = new Selection();
	this.shadersManager = new ShadersManager();
	this.postFxShadersManager = new PostFxShadersManager();
	this.vBOManager = new VBOManager();
	this.readerWriter = new ReaderWriter();
	this.magoPolicy = new Policy();
	
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
	this.buildingSelected;
	this.octreeSelected;
	this.objMovState = 0; // 0 = no started. 1 = mov started. 
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.startMovPoint = new Point3D();
	
	//this.ssaoFSQuad;// No use this.***
	this.kernel = [ 0.33, 0.0, 0.85,
					0.25, 0.3, 0.5,
					0.1, 0.3, 0.85,
					-0.15, 0.2, 0.85, 
					-0.33, 0.05, 0.6,
					-0.1, -0.15, 0.85,
					-0.05, -0.32, 0.25,
					0.2, -0.15, 0.85,
					0.6, 0.0, 0.55,
					0.5, 0.6, 0.45,
					-0.01, 0.7, 0.35,
					-0.33, 0.5, 0.45,
					-0.45, 0.0, 0.55,
					-0.65, -0.5, 0.7,
					0.0, -0.5, 0.55,
					0.33, 0.3, 0.35];
	
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
	
	/* Test for sphere.***
	for(var i=0; i<kernelSize; i++) {
		this.kernel.push(2.0 * (Math.random() - 0.5));
		this.kernel.push(2.0 * (Math.random() - 0.5));
		this.kernel.push(2.0 * (Math.random() - 0.5));				
	}
	*/
	// End ssao.------------------------------------------------
	
	this.atmosphere = new Atmosphere();
	
	// Vars.****************************************************************
	this.modelViewProjRelToEye_matrix = new Float32Array(16);
	this.modelViewRelToEye_matrix = new Float32Array(16);
	this.modelView_matrix = new Float32Array(16);
	this.projection_matrix = new Float32Array(16);
	this.normalMat3 = new Cesium.Matrix3();
	this.normalMat3_array = new Float32Array(9);
	this.normalMat4 = new Cesium.Matrix4();
	this.normalMat4_array = new Float32Array(16);
	this.mvMatInv = new Cesium.Matrix4();
	
	this.currentVisible_terranTiles_array = [];
	this.currentVisibleBuildings_array = []; // delete this.***
	this.currentVisibleBuildings_LOD0_array = []; // delete this.***
	this.currentVisibleBuildingsPost_array = [];
	
	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerBuildings = new VisibleObjectsControler();
	this.visibleObjControlerOctrees = new VisibleObjectsControler();
	this.visibleObjControlerOctreesAux = new VisibleObjectsControler();
	this.currentVisibleNeoBuildings_array = []; // delete this.***
	this.currentVisibleClouds_array = [];
	this.detailed_building;
	this.detailed_neoBuilding;
	this.boundingSphere_Aux = new Cesium.BoundingSphere(); // Cesium dependency.***
	this.radiusAprox_aux;
	
	this.currentRenderables_neoRefLists_array = []; // dont use this.***
	
	this.filteredVisibleTiles_array = [];
	this.detailedVisibleTiles_array = [];
	this.LOD0VisibleTiles_array = [];
	
	this.lastCamPos = new Point3D();
	this.squareDistUmbral = 22.0;
	
	this.encodedCamPosMC_High = new Float32Array(3);
	this.encodedCamPosMC_Low = new Float32Array(3);
	
	this.compRefList_array;
	this.compRefList_array_background;
	this.intCRefList_array = [];
	this.intNeoRefList_array = [];
	
	this.lowestOctreeArray = [];

	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	this.isCameraMoving = false;
	this.isCameraInsideBuilding = false;
	this.isCameraInsideNeoBuilding = false;
	
	this.min_squaredDist_to_see_detailed = 100000; // 200m.***
	this.min_squaredDist_to_see_LOD0 = 100000; // Original.***
	//this.min_squaredDist_to_see_LOD0 = 1000000; // 600m.***
	this.min_squaredDist_to_see = 15000000;
	this.min_squaredDist_to_see_smallBuildings = 700000;
	this.renders_counter = 0;
	this.render_time = 0;
	this.bPicking = false;
	
	this.scene;
	
	this.renderingModeTemp = 0; // 0 = assembled mode. 1 = dispersed mode.***
	
	this.frustumIdx;
	this.numFrustums;
	this.isLastFrustum = false;
	this.highLightColor4 = new Float32Array([0.2, 1.0, 0.2, 1.0]);
	
	// CURRENTS.********************************************************************
	this.currentSelectedObj_idx = -1;
	this.currentByteColorPicked = new Uint8Array(4);
	this.currentShader;
	
	// SPEED TEST.******************************************************************
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
	
	this.testFilesLoaded = false;
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.pointSC= new Point3D();
	this.pointSC_2= new Point3D();
	this.arrayAuxSC = [];
	
	this.currentTimeSC;
	this.dateSC;
	this.startTimeSC;
	this.maxMilisecondsForRender = 10;
	
	this.terranTileSC;
	
	this.textureAux_1x1;
	this.resultRaySC = new Float32Array(3);
	this.matrix4SC = new Matrix4();
	
	this.unitaryBoxSC = new Box();
	this.unitaryBoxSC.makeAABB(1.0, 1.0, 1.0); // make a unitary box.***
	this.unitaryBoxSC.vBOVertexIdxCacheKey = this.unitaryBoxSC.triPolyhedron.getVBOArrayModePosNorCol(this.unitaryBoxSC.vBOVertexIdxCacheKey);
	
	this.demoBlocksLoaded = false;
	
	
	
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
	
//	this.createCloudsTEST();
//	this.loadObjectIndexFile = false;
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
//	var b = new ArrayBuffer(w*h*4);
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
 * object 를 그리는 두가지 종류의 function을 호출
 * @param scene 변수
 * @param pass 변수
 * @param frustumIdx 변수
 * @param numFrustums 변수
 */
CesiumManager.prototype.start = function(scene, pass, frustumIdx, numFrustums) {
	
	// mago3d 활성화가 아니면 화면을 그리지 않음
	if(!this.magoPolicy.getMagoEnable()) return;
	
	var isLastFrustum = false;
	this.frustumIdx = frustumIdx;
	this.numFrustums = numFrustums;
	if(frustumIdx == numFrustums-1) {
		isLastFrustum = true;
		this.isLastFrustum = true;
	}
	
	// cesium 새 버전에서 지원하지 않음
	var picking = pass.pick;
	if(picking) {
		//this.renderNeoBuildings(scene, isLastFrustum);
	} else {
		this.renderNeoBuildingsAsimectricVersion(scene, isLastFrustum, frustumIdx, numFrustums);
		//this.renderNeoBuildings(scene, isLastFrustum); // original.****
		//this.renderTerranTileServiceFormatPostFxShader(scene, isLastFrustum);
	}
};

///**
// * 어떤 일을 하고 있습니까?
// */
//CesiumManager.prototype.createCloudsTEST = function() {
////	var increLong = 0.004;
////	var increLat = 0.004;
//	
//	var randomLongitude = 0;
//	var randomLatitude = 0;
//	var randomAltitude = 0;
//	var randomRadius = 0;
//	var randomDepth = 0;
//	
//	var cloud;
//	for(var i =0; i<10; i++) {
//		randomLongitude = 126.91+(0.05*Math.random());
//		randomLatitude = 37.51+(0.05*Math.random());
//		randomAltitude = 350+Math.random()*50;
//		randomRadius = 10+Math.random()*150;
//		randomDepth = 10+Math.random()*50;
//		cloud = this.atmosphere.cloudsManager.newCircularCloud();
//		cloud.createCloud(randomLongitude, randomLatitude, randomAltitude, randomRadius, randomDepth, 16);
//	}
//	
//	for(var i =0; i<10; i++) {
//		randomLongitude = 127.0+(0.05*Math.random());
//		randomLatitude = 37.45+(0.05*Math.random());
//		randomAltitude = 350+Math.random()*50;
//		randomRadius = 10+Math.random()*150;
//		randomDepth = 10+Math.random()*50;
//		cloud = this.atmosphere.cloudsManager.newCircularCloud();
//		cloud.createCloud(randomLongitude, randomLatitude, randomAltitude, randomRadius, randomDepth, 16);
//	}
//	/*
//	cloud = this.atmosphere.cloudsManager.newCircularCloud();
//	cloud.createCloud(126.929, 37.5172076, 300.0, 100.0, 40.0, 16);
//
//	cloud = this.atmosphere.cloudsManager.newCircularCloud();
//	cloud.createCloud(126.929+increLong, 37.5172076, 340.0, 50.0, 40.0, 16);
//	
//	cloud = this.atmosphere.cloudsManager.newCircularCloud();
//	cloud.createCloud(126.929+increLong, 37.5172076+increLat, 340.0, 80.0, 90.0, 16);
//	*/
//};

/**
 * 카메라가 이동중인지를 확인
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
 * 카메라 이동 정보를 갱신
 * @param cameraPosition 변수
 */
CesiumManager.prototype.updateCameraMoved = function(cameraPosition) {
	// This function must run in a background process.****
	// call this function if camera was moved.****
	//----------------------------------------------------------------
	
	// 1rst, do frustum culling and find a detailed building.***
};

/**
 * 기상 데이터를 그림
 * @param gl 변수
 * @param cameraPosition 변수
 * @param cullingVolume 변수
 * @param _modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderAtmosphere = function(gl, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum) {
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
	// Test using f4d_shaderManager.************************
	var shadersManager = this.shadersManager;
	var standardShader = shadersManager.getMagoShader(4); // 4 = cloud-shader.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(standardShader._color);
	gl.enableVertexAttribArray(standardShader._position);
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	gl.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	gl.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	gl.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	
	// Clouds.***************************************************
	var cloud;
	for(var i=0; i<clouds_count; i++) {
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i];
		
		gl.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		gl.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);
		
		if(cloud.vbo_vertexCacheKey == undefined) {
			cloud.vbo_vertexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, cloud.getVBOVertexColorFloatArray(), gl.STATIC_DRAW);
		}
		if(cloud.vbo_indexCacheKey == undefined) {
			cloud.vbo_indexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.getVBOIndicesShortArray(), gl.STATIC_DRAW);
		}

		// Interleaved mode.***
		gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
		gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false,24,0);
		gl.vertexAttribPointer(standardShader._color, 3, gl.FLOAT, false,24,12);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
		gl.drawElements(gl.TRIANGLES, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
		//gl.drawElements(gl.LINE_LOOP, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	
	gl.disableVertexAttribArray(standardShader._color);
	gl.disableVertexAttribArray(standardShader._position);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

/**
 * 구름 그림자를 그림
 * @param gl 변수
 * @param cameraPosition 변수
 * @param cullingVolume 변수
 * @param _modelViewProjectionRelativeToEye 변수
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderCloudShadows = function(gl, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum) {
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
	// Test using f4d_shaderManager.************************
	var shadersManager = this.shadersManager;
	var standardShader = shadersManager.getMagoShader(4); // 4 = cloud-shader.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	
	gl.useProgram(shaderProgram);
	//gl.enableVertexAttribArray(standardShader._color);
	//gl.disableVertexAttribArray(standardShader._color);
	gl.enableVertexAttribArray(standardShader._position);
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
	
	gl.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	gl.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	gl.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	
	// SHADOW SETTINGS.**********************************************************************************
	gl.colorMask(false, false, false, false);
	gl.depthMask(false);
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);
	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1.0, 2.0); // Original.***
	//gl.polygonOffset(1.0, 1.0);
	
	// First pas.****************************************************************************************************
	gl.cullFace(gl.FRONT);
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP);
	gl.clearStencil(0);
	//gl.clear(gl.STENCIL_BUFFER_BIT);

	// Clouds.***
	//clouds_count = this.currentVisibleClouds_array.length;
	var cloud;
	for(var i=0; i<clouds_count; i++) {
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i]; // Original.***
		//cloud = this.currentVisibleClouds_array[i];
		
		gl.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		gl.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if(cloud.vbo_shadowVertexCacheKey == undefined) {
			cloud.vbo_shadowVertexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, cloud.getVBOShadowVertexFloatArray(), gl.STATIC_DRAW);
		}
		if(cloud.vbo_shadowIndexCacheKey == undefined) {
			cloud.vbo_shadowIndexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.getVBOShadowIndicesShortArray(), gl.STATIC_DRAW);
		}

		// Interleaved mode.***
		gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false,0,0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		gl.drawElements(gl.TRIANGLES, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
		//gl.drawElements(gl.LINE_LOOP, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	
	// Second pass.****************************************************************************************************
	gl.cullFace(gl.BACK);
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP);
	
	// Clouds.***
	for(var i=0; i<clouds_count; i++) {
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i];
		
		gl.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		gl.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if(cloud.vbo_shadowVertexCacheKey == undefined) {
			cloud.vbo_shadowVertexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, cloud.getVBOShadowVertexFloatArray(), gl.STATIC_DRAW);
		}
		if(cloud.vbo_shadowIndexCacheKey == undefined) {
			cloud.vbo_shadowIndexCacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.getVBOShadowIndicesShortArray(), gl.STATIC_DRAW);
		}

		// Interleaved mode.***
		gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false,0,0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		gl.drawElements(gl.TRIANGLES, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
		//gl.drawElements(gl.LINE_LOOP, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
	}
	//gl.disableVertexAttribArray(standardShader._color);
	gl.disableVertexAttribArray(standardShader._position);
	
	// Render the shadow.*********************************************************************************************
	gl.disable(gl.POLYGON_OFFSET_FILL);
	gl.disable(gl.CULL_FACE);
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);

	gl.stencilFunc(gl.NOTEQUAL, 0x0, 0xff);
	gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	// must draw a rectangle for blending.***
	gl.cullFace(gl.FRONT);

	// render the shadowBlendingCube.***
	standardShader = shadersManager.getMagoShader(5); // 5 = blendingCube-shader.***
	gl.useProgram(standardShader.SHADER_PROGRAM);
	
	gl.enableVertexAttribArray(standardShader._color);
	gl.enableVertexAttribArray(standardShader._position);
	
	gl.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
	gl.uniform3fv(standardShader._encodedCamPosHIGH, this.encodedCamPosMC_High);
	gl.uniform3fv(standardShader._encodedCamPosLOW, this.encodedCamPosMC_Low);

	var shadowBC = this.atmosphere.shadowBlendingCube;
	if(shadowBC.vbo_vertexCacheKey == undefined) {
		shadowBC.vbo_vertexCacheKey = gl.createBuffer ();
		gl.bindBuffer(gl.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, shadowBC.getVBOVertexColorRGBAFloatArray(), gl.STATIC_DRAW);
	}
	if(shadowBC.vbo_indexCacheKey == undefined) {
		shadowBC.vbo_indexCacheKey = gl.createBuffer ();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shadowBC.getVBOIndicesShortArray(), gl.STATIC_DRAW);
	}

	// Interleaved mode.***
	gl.bindBuffer(gl.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
	gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false,28,0);
	gl.vertexAttribPointer(standardShader._color, 4, gl.FLOAT, false,28,12);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
	gl.drawElements(gl.TRIANGLES, shadowBC.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
	
	gl.disableVertexAttribArray(standardShader._position);
	gl.disableVertexAttribArray(standardShader._color);

	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
	gl.disable(gl.STENCIL_TEST);
};

/**
 * 카메라 포지션이 double 형 자료 데이터를 두개로 분리
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

///**
// * TODO 사용 안해서 주석 처리함
// * @param gl 변수
// * @param cameraPosition 변수
// * @param _modelViewProjectionRelativeToEye 변수
// * @param scene 변수
// */
//CesiumManager.prototype.renderPCloudProjects = function(gl, cameraPosition, _modelViewProjectionRelativeToEye, scene) {
//	//this.isCameraMoving = this.isButtonDown(scene);
//	
//	// Check if camera was moved considerably for update the renderables objects.***
//	if(this.detailed_building) {
//		this.squareDistUmbral = 4.5*4.5;
//	} else {
//		this.squareDistUmbral = 50*50;
//	}
//	this.isCameraMoved(cameraPosition, this.squareDistUmbral);
//	
//	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
//	Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
//	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------
//	
//	// Calculate encodedCamPosMC high and low values.********************************************************
//	this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
//	
//	// Now, render the simple visible buildings.***************************************************************************
//	// http://learningwebgl.com/blog/?p=684 // tutorial for shader with normals.***
//	var shader = this.shadersManager.getMagoShader(6);
//	var shaderProgram = shader.SHADER_PROGRAM;
//	gl.useProgram(shaderProgram);
//	gl.enableVertexAttribArray(shader._color);
//	gl.enableVertexAttribArray(shader._position);
//	
//	gl.enable(gl.DEPTH_TEST);
//	gl.depthFunc(gl.LEQUAL); 
//	gl.depthRange(0, 1);
//
//	gl.uniformMatrix4fv(shader._ModelViewProjectionMatrixRelToEye, false, this.modelViewProjRelToEye_matrix);
//	gl.uniform3fv(shader._encodedCamPosHIGH, this.encodedCamPosMC_High);
//	gl.uniform3fv(shader._encodedCamPosLOW, this.encodedCamPosMC_Low);
//
//	//gl.activeTexture(gl.TEXTURE0);
//	this.currentVisibleBuildingsPost_array.length = 0;
//	
//	var filePath_scratch = "";
//	
//	// Now, render LOD0 texture buildings.***
//	var pCloudProject;
//	var pCloud_projectsCount = this.bRBuildingProjectsList._pCloudMesh_array.length;
//	for(var i=0; i<pCloud_projectsCount; i++) {
//		pCloudProject = this.bRBuildingProjectsList._pCloudMesh_array[i];
//		if(!pCloudProject._f4d_header_readed) {
//			// Must read the header file.***
//			if(this.backGround_fileReadings_count < 20) {
//				filePath_scratch = this.readerWriter.geometryDataPath +"/" + pCloudProject._f4d_headerPathName;
//				
//				this.readerWriter.getPCloudHeader(gl, filePath_scratch, pCloudProject, this.readerWriter, this);
//				this.backGround_fileReadings_count ++;
//			}
//			continue;
//		} else if(!pCloudProject._f4d_geometry_readed && pCloudProject._f4d_header_readed_finished) {
//			if(this.backGround_fileReadings_count < 20) {
//				filePath_scratch = this.readerWriter.geometryDataPath +"/" + pCloudProject._f4d_geometryPathName;
//				
//				this.readerWriter.getPCloudGeometry(gl, filePath_scratch, pCloudProject, this.readerWriter, this);
//				this.backGround_fileReadings_count ++;
//			}
//			continue;
//		}
//		
//		// Now, render the pCloud project.***
//		if(pCloudProject._f4d_geometry_readed_finished) {
//			this.renderer.renderPCloudProject(gl, pCloudProject, this.modelViewProjRelToEye_matrix, this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this);
//		}
//	}
//	
//	gl.disableVertexAttribArray(shader._color);
//	gl.disableVertexAttribArray(shader._position);
//};

/**
 * 텍스처를 읽어서 그래픽 카드에 올림
 * @param gl 변수
 * @param image 변수
 * @param texture
 */
function handleTextureLoaded(gl, image, texture) {
	// https://developer.mozilla.org/en-US/docs/Web/API/Webgl_API/Tutorial/Using_textures_in_Webgl
	//var gl = viewer.scene.context._gl;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBgl,true); // if need vertical mirror of the image.***
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * 빌딩을 준비
 * @param gl 변수
 */

CesiumManager.prototype.prepareNeoBuildings = function(gl) {
	// for all renderables, prepare data.***
	// LOD_0.***
	var neoBuilding;
	var metaData;
	var buildingFolderName = "";
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var blocksList;
	var neoReferencesList;
	var neoReferencesListName;
//	var subOctree;
//	var buildingRotationMatrix;
	
	var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
		
		// check if this building is ready to render.***
		if(!neoBuilding.allFilesLoaded) {
			buildingFolderName = neoBuilding.buildingFileName;
			
			// 1) The buildings metaData.*************************************************************************************
			metaData = neoBuilding.metaData;
			if(metaData.fileLoadState == CODE.fileLoadState.READY) {
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read metadata file.***
					var neoBuildingHeaderPath = geometryDataPath + "/" + buildingFolderName + "/Header.hed";
					this.readerWriter.getNeoHeader(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
					continue;
				}
			}
			
			// 2) The block models.********************************************************************************************
			// the InteriorBlock must load only if the camera is very cloesd.***
			var blocksListsCount = neoBuilding._blocksList_Container.blocksListsArray.length;
			// blocksListsCount-1 bcos interiorLOD4 only load if cam is inside of building.***
			for(var j=0; j<blocksListsCount-1; j++) {
				blocksList = neoBuilding._blocksList_Container.blocksListsArray[j];
				if(blocksList.fileLoadState == CODE.fileLoadState.READY) {
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						// must read blocksList.***
						var fileName = geometryDataPath + "/" + buildingFolderName + "/" + blocksList.name;
						this.readerWriter.getNeoBlocksArraybuffer(fileName, blocksList, this);
						continue;
					}
				}
			}
			
			// 3) The references (Exteriors & Bone).*************************************************************************
			var neoReferencesListsCount = neoBuilding._neoRefLists_Container.neoRefsLists_Array.length;
			if(neoReferencesListsCount == 0) {
				// if there are no referencesList then make it.***
				// there are 4 neoReferencesLists (lodExt0, lodExt1, lodExt2, lodBone).****
				for(var j=0; j<4; j++) {
					blocksList = neoBuilding._blocksList_Container.blocksListsArray[j];
					neoReferencesList = neoBuilding._neoRefLists_Container.newNeoRefsList(blocksList);
					if(j == 0) neoReferencesListName = "Ref_Skin1";
					else if(j == 1) neoReferencesListName = "Ref_Skin2";
					else if(j == 2) neoReferencesListName = "Ref_Skin3";
					else if(j == 3) neoReferencesListName = "Ref_Bone";
						
					neoReferencesList.name = neoReferencesListName;
				}
			}

			for(var j=0; j<neoReferencesListsCount; j++) {
				neoReferencesList = neoBuilding._neoRefLists_Container.neoRefsLists_Array[j];
				if(neoReferencesList.fileLoadState == CODE.fileLoadState.READY) {
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						var fileName = geometryDataPath + "/" + buildingFolderName + "/" + neoReferencesList.name;
						this.readerWriter.getNeoReferencesArraybuffer(fileName, neoReferencesList, this);
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
			}	
		}
	}
	
	// LOD Buildings.***********************************************************************************
	buildingsCount = this.visibleObjControlerBuildings.currentVisibles1.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles1[i];
		buildingFolderName = neoBuilding.buildingFileName;
			
		// 1) The buildings metaData.*************************************************************************************
		metaData = neoBuilding.metaData;
		if(metaData.fileLoadState == CODE.fileLoadState.READY) {
			if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
				// must read metadata file.***
				var neoBuildingHeaderPath = geometryDataPath + "/" + buildingFolderName + "/Header.hed";
				this.readerWriter.getNeoHeader(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
				continue;
			}
		}
			
		if(neoBuilding.lod2Building == undefined) {
			neoBuilding.lod2Building = new LodBuilding();
			continue;
		}
		
		// file no requested.***
		if(neoBuilding.lod2Building.fileLoadState == CODE.fileLoadState.READY) {
			if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
				var fileName = geometryDataPath + "/" + buildingFolderName + "/" + "simpleBuilding_LOD2";
				this.readerWriter.getLodBuildingArraybuffer(fileName, neoBuilding.lod2Building, this);
			}
		}
	}
};

/**
 * 빌딩을 준비(새버전)
 * @param gl 변수
 */
CesiumManager.prototype.prepareNeoBuildingsAsimetricVersion = function(gl) {
	
	// for all renderables, prepare data.***
	var neoBuilding;
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
		
		// check if this building is ready to render.***
		if(!neoBuilding.allFilesLoaded) {
			// 1) The buildings metaData.*************************************************************************************
			var metaData = neoBuilding.metaData;
			if(metaData.fileLoadState == CODE.fileLoadState.READY) {
				//if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read metadata file.***
					var neoBuildingHeaderPath = geometryDataPath + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
					this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
					continue;
				//}
			}
			
		}
	}
	
	buildingsCount = this.visibleObjControlerBuildings.currentVisibles2.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[i];
		
		// check if this building is ready to render.***
		if(!neoBuilding.allFilesLoaded) {
			// 1) The buildings metaData.*************************************************************************************
			var metaData = neoBuilding.metaData;
			if(metaData.fileLoadState == CODE.fileLoadState.READY) {
				//if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read metadata file.***
					var neoBuildingHeaderPath = geometryDataPath + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
					this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
					continue;
				//}
			}
			
		}
	}
};

/**
 * 빌딩의 octree를 적용
 * @param neoBuilding 변수
 */
CesiumManager.prototype.loadBuildingOctree = function(neoBuilding) {
	// The references (Interiors Octree).*************************************************************************
	// octree must load if the camera is very closed.***
	if(neoBuilding.octree != undefined && !neoBuilding.octreeLoadedAllFiles) {
		var geometryDataPath = this.readerWriter.geometryDataPath;
		var buildingFolderName = neoBuilding.buildingFileName;
		var interiorCRef_folderPath = geometryDataPath + "/" + buildingFolderName + "/inLOD4";
		//var lod_level = 4;
		//var interior_base_name = "Ref_NodeData";
		var subOctreeName_counter = -1;
		var areAllSubOctreesLoadedFile = true; // init on true.***
		var blocksList = neoBuilding._blocksList_Container.getBlockList("Blocks4");
		var subOctree;
		var neoReferencesList;
		
		// a = octree level 1.***
		for(var a=1; a<9; a++) {
			// b = octree level 2.***
			for(var b=1; b<9; b++) {
				// c = octree level 3.***
				for(var c=1; c<9; c++) {
					
					// slow method.**************************************************************************************************
					subOctreeName_counter = a*100 + b*10 + c;
					var subOctreeNumberName = subOctreeName_counter.toString();
					subOctree = neoBuilding.octree.getOctreeByNumberName(subOctreeNumberName); // dont use this method. is slow.***
					
					if(subOctree.neoRefsList_Array.length == 0) {
						if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
							neoReferencesList = new NeoReferencesList();
							//if(transformMat)
							//{
							//	neoReferencesList.multiplyReferencesMatrices(transformMat); // after parse, multiply transfMat by the buildings mat.***
							//}
							neoReferencesList.blocksList = blocksList;
							subOctree.neoRefsList_Array.push(neoReferencesList);
							
							var intRef_filePath = interiorCRef_folderPath + "/" + subOctreeNumberName;
							this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, neoReferencesList, this);
						}
						areAllSubOctreesLoadedFile = false;
					} else {
						neoReferencesList = subOctree.neoRefsList_Array[0];
						if(neoReferencesList != undefined && neoReferencesList.fileLoadState == CODE.fileLoadState.READY) areAllSubOctreesLoadedFile = false;
					}
					////readerWriter.getNeoReferences(gl, intCompRef_filePath, null, subOctreeNumberName, lod_level, blocksList_4, moveMatrix, neoBuilding, readerWriter, subOctreeName_counter);
				}
			}
		}
		
		if(areAllSubOctreesLoadedFile) {
			neoBuilding.octreeLoadedAllFiles = true;
		}
	}
};

/**
 * object index 파일을 읽어서 Frustum Culling으로 화면에 rendering
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderNeoBuildings = function(scene, isLastFrustum) {
	var gl = scene.context._gl;
	var cameraPosition = scene.context._us._cameraPosition;
//	var modelViewProjectionRelativeToEye = scene.context._us._modelViewProjectionRelativeToEye;
	
	if(!isLastFrustum) return;
	
	if(this.textureAux_1x1 == undefined) {
		this.textureAux_1x1 = gl.createTexture();
		// Test wait for texture to load.********************************************
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	if(this.depthFboNeo == undefined) this.depthFboNeo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	//if(this.ssaoFboNeo == undefined)this.ssaoFboNeo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight); // no used.***
	
//	var neoVisibleBuildingsArray = [];
	
	// do frustum culling.***
	if(!this.isCameraMoving) {
		var frustumVolume = scene._frameState.cullingVolume;
		this.currentVisibleNeoBuildings_array.length = 0;
		this.doFrustumCullingNeoBuildings(frustumVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
		this.prepareNeoBuildings(gl, scene);
	}
	
	if(this.visibleObjControlerBuildings.currentVisibles0.length > 0) {
		// PROVISIONAL.***
		this.detailed_neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[0]; // provisionally take the 1rst.***
	} else {
		this.detailed_neoBuilding = undefined;
	}
	
	//if(!this.isCameraMoving)
	//{
	//	this.currentRenderables_neoRefLists_array.length = 0;
	//	this.getRenderablesDetailedNeoBuilding(gl, scene, this.detailed_neoBuilding , this.currentRenderables_neoRefLists_array);
	//}

	if(this.bPicking == true) {
		this.objectSelected = this.getSelectedObjectPicking(gl, scene, this.currentRenderables_neoRefLists_array);
	}
	
	//return;
	
	//if(this.detailed_neoBuilding) // Provisional.***
	//if(this.visibleObjControlerBuildings.currentVisibles0.length > 0) // Provisional.***
//	{
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(scene._context._us._modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEye_matrix); // Original.*** 
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------

	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
	
	// Normal matrix.********************************************************************
	var mvMat = scene._context._us._modelView; // original.***
	var mvMat_inv = new Cesium.Matrix4();
	mvMat_inv = Cesium.Matrix4.inverseTransformation(mvMat, mvMat_inv);
	//var normalMat = new Cesium.Matrix4();
	this.normalMat4 = Cesium.Matrix4.transpose(mvMat_inv, this.normalMat4);// Original.***
	//this.normalMat4 = Cesium.Matrix4.clone(mvMat_inv, this.normalMat4);
	this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);

	Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
	Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 

	var camera = scene._camera;
	var frustum = camera.frustum;
//		var current_frustum_near = scene._context._us._currentFrustum.x;
	var current_frustum_far = scene._context._us._currentFrustum.y;
	
	gl.enable(gl.CULL_FACE);
	
	//scene._context._currentFramebuffer._bind();
	
	var ssao_idx = 0; // 0= depth. 1= ssao.***
	var buildingsCount;
	var renderTexture = false;
	cameraPosition = null;
	var neoBuilding;
	
	// 1) The depth render.***************************************************************************************************
	// 1) The depth render.***************************************************************************************************
	// 1) The depth render.***************************************************************************************************
	var currentShader = this.postFxShadersManager.pFx_shaders_array[3]; // neo depth.***
	this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);  

	var shaderProgram = currentShader.program;
	
	gl.useProgram(shaderProgram);
	//gl.enableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
	gl.enableVertexAttribArray(currentShader.position3_loc);
	if(currentShader.normal3_loc != -1) gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	gl.uniform1f(currentShader.near_loc, frustum._near);	
	//gl.uniform1f(currentShader.far_loc, frustum._far);	
	gl.uniform1f(currentShader.far_loc, current_frustum_far); 
	
	gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
	// renderDepth for all buildings.***
	// 1) LOD 0.*********************************************************************************************************************
	buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
		if(!this.isCameraMoving) {
			this.getRenderablesDetailedNeoBuilding(gl, scene, neoBuilding , this.currentRenderables_neoRefLists_array);
		}
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
		this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.currentRenderablesNeoRefLists);
	}
	
	// LOD 2 & 3.*********************************************************************************************************************************
	currentShader = this.postFxShadersManager.pFx_shaders_array[7]; // lodBuilding depth.***
	shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);
	//gl.enableVertexAttribArray(currentShader.color4_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	gl.uniform1f(currentShader.near_loc, frustum._near);	
	//gl.uniform1f(currentShader.far_loc, frustum._far);	
	gl.uniform1f(currentShader.far_loc, current_frustum_far); 
	
	gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
	
	gl.uniform1i(currentShader.hasAditionalMov_loc, true);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
	
	buildingsCount = this.visibleObjControlerBuildings.currentVisibles1.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles1[i];
		if(neoBuilding.lod2Building) {
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			this.renderLodBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.lod2Building);
		}
	}
	
	// now, render depth of the neoSimpleBuildings.**********************************************************************************************
	var imageLod = 3;
	var neoSkinsCount = this.currentVisibleNeoBuildings_array.length;
	for(var i=0; i<neoSkinsCount; i++) {
		neoBuilding = this.currentVisibleNeoBuildings_array[i];
		var neoSkin = neoBuilding.neoSimpleBuilding;
		// check if loaded the simplebuilding texture.***
		if(neoSkin.texturesArray.length == 0) {
			// must load the texture.***
			if(this.backGround_imageReadings_count < 10) {
				var simpBuild_tex = neoSkin.newTexture();
				
				var filePath_inServer = this.readerWriter.geometryDataPath + "/" + neoBuilding.buildingFileName + Constant.SIMPLE_BUILDING_TEXTURE3x3_BMP;
				this.readerWriter.readTexture(gl, filePath_inServer, simpBuild_tex, this);
			}
		} else {
			var simpBuildTexture = neoSkin.texturesArray[0]; 
//			if(simpBuildTexture.loadFinished) {
//				if(simpBuildTexture.textureId != undefined) {
//					// RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.***
//					//this.renderer.renderNeoSimpleBuildingDepthShader(gl, neoBuilding, this, currentShader); 
//				} else {
//					
//					// simpBuildTexture.textureId = gl.createTexture();
//	
//					// // must upload the texture to gl.***
//					// gl.bindTexture(gl.TEXTURE_2D, simpBuildTexture.textureId);
//					// ////gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBgl,true); // if need vertical mirror of the image.***
//					// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, simpBuildTexture.texImage); // Original.***
//					// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//					// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
//					// gl.generateMipmap(gl.TEXTURE_2D);
//					// gl.bindTexture(gl.TEXTURE_2D, null);
//					  
//					// delete simpBuildTexture.texImage;
//				}
//			}
		}
	}
		
	if(currentShader.normal3_loc != -1) gl.disableVertexAttribArray(currentShader.normal3_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
		
	this.depthFboNeo.unbind();
		
	// 2) ssao render.************************************************************************************************************
	// 2) ssao render.************************************************************************************************************
	// 2) ssao render.************************************************************************************************************
	scene._context._currentFramebuffer._bind();
	if(this.noiseTexture == undefined) this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels);
	
	ssao_idx = 1;
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[4];
	
	//gl.clearColor(0, 0, 0, 1);
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);

	shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	if(currentShader.normal3_loc != -1) gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***

	gl.uniform1f(currentShader.near_loc, frustum._near);	
	//gl.uniform1f(currentShader.far_loc, frustum._far); // Original.***
	gl.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
	
	gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
	gl.uniform1i(currentShader.depthTex_loc, 0);	
	gl.uniform1i(currentShader.noiseTex_loc, 1);	
	gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
	gl.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
	gl.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
	gl.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
	gl.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
	gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
	gl.uniform3fv(currentShader.kernel16_loc, this.kernel);	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
	gl.activeTexture(gl.TEXTURE1);            
	gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture); 
		
	renderTexture = true;
	
	cameraPosition = null;
	//this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, this.currentRenderables_neoRefLists_array);
	buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
		this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.currentRenderablesNeoRefLists);
	}
	
	gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	// LOD 2 & 3.*********************************************************************************************************************************
	currentShader = this.postFxShadersManager.pFx_shaders_array[8]; // lodBuilding ssao.***
	shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	gl.enableVertexAttribArray(currentShader.normal3_loc);
	gl.enableVertexAttribArray(currentShader.color4_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	gl.uniform1f(currentShader.near_loc, frustum._near);	
	//gl.uniform1f(currentShader.far_loc, frustum._far);	
	gl.uniform1f(currentShader.far_loc, current_frustum_far); 
	
	gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
	gl.uniform1i(currentShader.hasAditionalMov_loc, true);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
	
	gl.uniform1i(currentShader.depthTex_loc, 0);	
	gl.uniform1i(currentShader.noiseTex_loc, 1);	
	gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
	gl.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
	gl.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
	gl.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
	gl.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
	
	gl.uniform1i(currentShader.depthTex_loc, 0);	
	gl.uniform1i(currentShader.noiseTex_loc, 1);	
	//gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
	
	gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
	gl.uniform3fv(currentShader.kernel16_loc, this.kernel);	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
	gl.activeTexture(gl.TEXTURE1);            
	gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture); 
	
	buildingsCount = this.visibleObjControlerBuildings.currentVisibles1.length;
	for(var i=0; i<buildingsCount; i++) {
		neoBuilding = this.visibleObjControlerBuildings.currentVisibles1[i];
		if(neoBuilding.lod2Building) {
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			this.renderLodBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.lod2Building);
		}
	}
	// now, render ssao of the neoSimpleBuildings.**********************************************************************************
	imageLod = 3;
	neoSkinsCount = this.currentVisibleNeoBuildings_array.length;
	for(var i=0; i<neoSkinsCount; i++) {
		var neoBuilding = this.currentVisibleNeoBuildings_array[i];
		var neoSkin = neoBuilding.neoSimpleBuilding;
		// check if loaded the simplebuilding texture.***
		if(neoSkin.texturesArray.length == 0) {
			// must load the texture.***
			if(this.backGround_imageReadings_count < 10) {
				var simpBuild_tex = neoSkin.newTexture();
				
				var filePath_inServer = this.readerWriter.geometryDataPath +"/" + neoBuilding.buildingFileName + Constant.SIMPLE_BUILDING_TEXTURE3x3_BMP;
				this.readerWriter.readTexture(gl, filePath_inServer, simpBuild_tex, this);
			}
		} else {
			var simpBuildTexture = neoSkin.texturesArray[0]; 
			if(simpBuildTexture.loadFinished) {
				if(simpBuildTexture.textureId != undefined) {
					// RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.*** RENDER.***
					//this.renderer.renderNeoSimpleBuildingPostFxShader(gl, neoBuilding, this, imageLod, currentShader); 
				} else {
					// simpBuildTexture.textureId = gl.createTexture();
	
					// // must upload the texture to gl.***
					// gl.bindTexture(gl.TEXTURE_2D, simpBuildTexture.textureId);
					// ////gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBgl,true); // if need vertical mirror of the image.***
					// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, simpBuildTexture.texImage); // Original.***
					// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
					// gl.generateMipmap(gl.TEXTURE_2D);
					// gl.bindTexture(gl.TEXTURE_2D, null);
					  
					delete simpBuildTexture.texImage;
				}
			}
		}
	}
	
	if(currentShader.normal3_loc != -1) gl.disableVertexAttribArray(currentShader.normal3_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
//}
};

/**
 * object index 파일을 읽어서 Frustum Culling으로 화면에 rendering
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderNeoBuildingsAsimectricVersion = function(scene, isLastFrustum, frustumIdx, numFrustums) {
	if(this.renderingModeTemp == 0) {
		if(!isLastFrustum) return;
	}
	
	//if(!isLastFrustum) return;
	
	this.frustumIdx = frustumIdx;
	this.numFrustums = numFrustums;
	var gl = scene.context._gl;
	var cameraPosition = scene.context._us._cameraPosition;
//	var modelViewProjectionRelativeToEye = scene.context._us._modelViewProjectionRelativeToEye;
	if(this.textureAux_1x1 == undefined) {
		this.textureAux_1x1 = gl.createTexture();
		// Test wait for texture to load.********************************************
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	if(this.depthFboNeo == undefined) this.depthFboNeo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	if(scene.drawingBufferWidth != this.depthFboNeo.width || scene.drawingBufferHeight != this.depthFboNeo.height)
	{
		this.depthFboNeo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}
	
	//if(this.ssaoFboNeo == undefined)this.ssaoFboNeo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight); // no used.***
	
//	var neoVisibleBuildingsArray = [];
	
	// do frustum culling.***
	if(!this.isCameraMoving && !this.mouseLeftDown) 
	{
		//var camera = scene.frameState.camera;
		var cameraModev = this.isCameraMoved(cameraPosition, 1.0);
		
		//if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
		//this.myCameraSC.near = 0.1;
		//this.myCameraSC.far = 50000000;
		//var myCullingVolume = this.myCameraSC.frustum.computeCullingVolume(camera.position, camera.direction, camera.up);
		var frustumVolume = scene._frameState.cullingVolume; // original.***
		this.currentVisibleNeoBuildings_array.length = 0;
		if(frustumIdx == 0)
		{
			//this.neoBuildingsList.setNeoBuildingsFrustumCulled(false);
		}
		this.doFrustumCullingNeoBuildings(frustumVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
		//this.doFrustumCullingNeoBuildings(myCullingVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
		this.prepareNeoBuildingsAsimetricVersion(gl);
	}
	
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	Cesium.Matrix4.toArray(scene._context._us._modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEye_matrix); // Original.*** 
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------

	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);
	
	// Normal matrix.********************************************************************
	this.mvMatInv = Cesium.Matrix4.inverseTransformation(scene._context._us._modelView, this.mvMatInv);
	//var normalMat = new Cesium.Matrix4();
	this.normalMat4 = Cesium.Matrix4.transpose(this.mvMatInv, this.normalMat4);// Original.***
	//this.normalMat4 = Cesium.Matrix4.clone(this.mvMatInv, this.normalMat4);
	this.normalMat3 = Cesium.Matrix4.getRotation(this.normalMat4, this.normalMat3);

	//Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
	Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 

	var ssao_idx = 0; // 0= depth. 1= ssao.***
	var renderTexture = false;
	//cameraPosition = null;

	var currentShader = undefined;

	// renderDepth for all buildings.***
	// 1) LOD 0.*********************************************************************************************************************
	if(!this.isCameraMoving && this.isLastFrustum) {
		this.visibleObjControlerOctrees.initArrays(); // init.******
		this.visibleObjControlerOctreesAux.initArrays(); // init.******
		
		var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for(var i=0; i<buildingsCount; i++) {
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, neoBuilding, this.visibleObjControlerOctrees, this.visibleObjControlerOctreesAux, 0);
			this.prepareVisibleOctreesAsimetricVersion(gl, scene, this.visibleObjControlerOctrees);
		}
		buildingsCount = this.visibleObjControlerBuildings.currentVisibles2.length;
		for(var i=0; i<buildingsCount; i++) {
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[i];
			this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, neoBuilding, this.visibleObjControlerOctrees, this.visibleObjControlerOctreesAux, 2);
			//this.prepareVisibleOctreesAsimetricVersion(gl, scene, this.visibleObjControlerOctrees);
		}
	}
	else{
		var hola = 0;
	}
	
	if(this.bPicking == true && isLastFrustum)
	{
		this.arrayAuxSC.length = 0;
		this.objectSelected = this.getSelectedObjectPickingAsimetricMode(gl, scene, this.visibleObjControlerOctrees, this.arrayAuxSC);
		this.buildingSelected = this.arrayAuxSC[0];
		this.octreeSelected = this.arrayAuxSC[1];
		this.arrayAuxSC.length = 0;
	}
	
	// 1) The depth render.***************************************************************************************************
	this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);  
	
	this.renderLowestOctreeLegoAsimetricVersion(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, this.visibleObjControlerOctrees);
	this.depthFboNeo.unbind();
	
	// 2) ssao render.************************************************************************************************************
	scene._context._currentFramebuffer._bind();
	if(this.noiseTexture == undefined) this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels);
	
	ssao_idx = 1;
	//currentShader = this.postFxShadersManager.pFx_shaders_array[4];

	this.renderLowestOctreeLegoAsimetricVersion(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, this.visibleObjControlerOctrees);
	/*
	gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	if(currentShader.normal3_loc != -1) gl.disableVertexAttribArray(currentShader.normal3_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
	*/

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
	
	var cameraPosition = scene.context._us._cameraPosition;
	
	if(this.selectionFbo == undefined) this.selectionFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	
	// do frustum culling.***
	if(!this.isCameraMoving) {
		var frustumVolume = scene._frameState.cullingVolume;
		this.currentVisibleNeoBuildings_array.length = 0;
		this.doFrustumCullingNeoBuildings(frustumVolume, this.currentVisibleNeoBuildings_array, cameraPosition);
	}
	
	if(this.detailed_neoBuilding) // original.***
	//if(this.currentVisibleNeoBuildings_array.length > 0)
	{
		// Calculate "modelViewProjectionRelativeToEye".*********************************************************
		Cesium.Matrix4.toArray(scene._context._us._modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
		Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEye_matrix); // Original.*** 
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
//		var frustum = camera.frustum;
//		var current_frustum_near = scene._context._us._currentFrustum.x;
//		var current_frustum_far = scene._context._us._currentFrustum.y;
		
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

		gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, this.detailed_neoBuilding.move_matrix);
		gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding.buildingPositionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding.buildingPositionLOW);

		var ssao_idx = -1; // selection code.***
		//ssao_idx = 1; // test.***
		var renderTexture = false;
		cameraPosition = null;
		this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, renderables_neoRefLists_array);
		
		gl.disableVertexAttribArray(currentShader.position3_loc);
		//gl.disableVertexAttribArray(currentShader.normal3_loc);
		
		// Now, read the picked pixel and find the object.*********************************************************

		var pixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
		gl.readPixels(this.mouse_x, scene.drawingBufferHeight - this.mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
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
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 * @returns selectionCandidateObjectsArray[idx]
 */
CesiumManager.prototype.getSelectedObjectPickingAsimetricMode = function(gl, scene, visibleObjControlerOctrees, resultSelectedArray) {
	// Picking render.***
	// Picking render.***
	// Picking render.***

	this.bPicking = false;
	
	var cameraPosition = scene.context._us._cameraPosition;
	
	if(this.selectionFbo == undefined) this.selectionFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************

	// picking mode.***
	this.selectionCandidateObjectsArray.length = 0; // init.***
	
	// set byteColor codes for references objects.***
	var red = 0, green = 0, blue = 0, alfa = 255;
	var selectionCandidateLowestOctreesArray = [];
	// LOD 0.******************************************************************************************************************************
	var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
	var refsCount;
	var neoRef;
	var lowestOctree;
	for(var i=0; i<lowestOctreesCount; i++) 
	{
		lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
		if(lowestOctree.neoReferencesMotherAndIndices == undefined) 
			continue;
		
		//neoBuilding = lowestOctree.neoBuildingOwner;
		refsCount = lowestOctree.neoReferencesMotherAndIndices.neoRefsIndices.length;
		for(var j=0; j<refsCount; j++)
		{
			neoRef = lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList[lowestOctree.neoReferencesMotherAndIndices.neoRefsIndices[j]];
			if(neoRef.selColor4 == undefined)
				neoRef.selColor4 = new Color();
			
			neoRef.selColor4.set(red, green, blue, alfa);
			this.selectionCandidateObjectsArray.push(neoRef);
			selectionCandidateLowestOctreesArray.push(lowestOctree);
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
	
	// LOD 1.********************************************************************************************************
	lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
	for(var i=0; i<lowestOctreesCount; i++) 
	{
		lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
		if(lowestOctree.neoReferencesMotherAndIndices == undefined) 
			continue;
		
		refsCount = lowestOctree.neoReferencesMotherAndIndices.neoRefsIndices.length;
		for(var j=0; j<refsCount; j++)
		{
			neoRef = lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList[lowestOctree.neoReferencesMotherAndIndices.neoRefsIndices[j]];
			if(neoRef.selColor4 == undefined)
				neoRef.selColor4 = new Color();
			
			neoRef.selColor4.set(red, green, blue, alfa);
			this.selectionCandidateObjectsArray.push(neoRef);
			selectionCandidateLowestOctreesArray.push(lowestOctree);
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
	
	// LOD 2, 3.***************************************************************************************************************************************
	lowestOctreesCount = visibleObjControlerOctrees.currentVisibles2.length;
	for(var i=0; i<lowestOctreesCount; i++) 
	{
		lowestOctree = visibleObjControlerOctrees.currentVisibles2[i];
		
		if(lowestOctree.lego == undefined) 
			continue;
		
		if(lowestOctree.lego.selColor4 == undefined)
			lowestOctree.lego.selColor4 = new Color();
		
		lowestOctree.lego.selColor4.set(red, green, blue, alfa);
		//this.selectionCandidateObjectsArray.push(lowestOctree);
		selectionCandidateLowestOctreesArray.push(lowestOctree);
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
	

	// colorSelection render.************************************************************************************************************
	// colorSelection render.************************************************************************************************************
	// colorSelection render.************************************************************************************************************
	
	//scene._context._currentFramebuffer._bind();// no.***
	this.selectionFbo.bind(); // framebuffer for color selection.***
		
	// Set uniforms.***************
	var currentShader = this.postFxShadersManager.pFx_shaders_array[5]; // color selection shader.***
		
	gl.clearColor(1, 1, 1, 1); // white background.***
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
	//gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	var shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	// 1) LOD 0.*********************************************************************************************************************
	// 1) LOD 0.*********************************************************************************************************************
	// 1) LOD 0.*********************************************************************************************************************
	
	var neoBuilding;
	var isInterior = false;
	var renderTexture = false;
	var ssao_idx = -1;
	var minSize = 0.0;
	var refTMatrixIdxKey = -1;
	var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
	for(var i=0; i<lowestOctreesCount; i++) {
		lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
		
		if(lowestOctree.neoReferencesMotherAndIndices == undefined) 
			continue;

		neoBuilding = lowestOctree.neoBuildingOwner;
		//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
		
		if(this.renderingModeTemp == 0)
		{
			//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			refTMatrixIdxKey = -1;
		}
		else{
			if(neoBuilding.geoLocationDataAux)
			{
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
				
				// check if the references of the lowestOctree has the geoLocationDataAux tMatrix.***
				//if(lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0))
				//{
				//	if( !lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0).hasKeyMatrix(0))
				//	lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
				//}
				refTMatrixIdxKey = 0;
			}
			else{
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
				refTMatrixIdxKey = -1;
			}
		}

		if(i == 0)
			minSize = 0.1;
		else minSize = 0.1;
		this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, refTMatrixIdxKey);
	}
	
	// 2) LOD 1.*********************************************************************************************************************
	// 2) LOD 1.*********************************************************************************************************************
	// 2) LOD 1.*********************************************************************************************************************
	
	lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
	for(var i=0; i<lowestOctreesCount; i++) {
		lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
		
		if(lowestOctree.neoReferencesMotherAndIndices == undefined) 
			continue;
		
		neoBuilding = lowestOctree.neoBuildingOwner;
		//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
		
		if(this.renderingModeTemp == 0)
		{
			//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			refTMatrixIdxKey = -1;
		}
		else{
			if(neoBuilding.geoLocationDataAux)
			{
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
				
				// check if the references of the lowestOctree has the geoLocationDataAux tMatrix.***
				//if(lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0))
				//{
				//	if( !lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0).hasKeyMatrix(0))
				//	lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
				//}
				refTMatrixIdxKey = 0;
			}
			else{
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
				refTMatrixIdxKey = -1;
			}
		}

		if(i == 0)
			minSize = 0.9;
		else minSize = 0.9;
		this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, refTMatrixIdxKey);
	}
	
	// 2) LOD 2 & 3.************************************************************************************************************************************
	// 2) LOD 2 & 3.************************************************************************************************************************************
	// 2) LOD 2 & 3.************************************************************************************************************************************
	
	lowestOctreesCount = visibleObjControlerOctrees.currentVisibles2.length;
	for(var i=0; i<lowestOctreesCount; i++) {
		lowestOctree = visibleObjControlerOctrees.currentVisibles2[i];
		
		if(lowestOctree.lego == undefined) {
			continue;
		}
		
		neoBuilding = lowestOctree.neoBuildingOwner;
		
		if(lowestOctree.lego.fileLoadState == CODE.fileLoadState.READY) {
			continue;
		}
		
		if(lowestOctree.lego.fileLoadState == 2) {
			continue;
		}
		
		if(this.renderingModeTemp == 0) {
			//gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
			gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, neoBuilding.move_matrix);
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
		} else {
			if(neoBuilding.geoLocationDataAux) {
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
			} else {
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
				gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, neoBuilding.move_matrix);
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
			}
		}
		

		gl.uniform1i(currentShader.hasTexture_loc, false); //.***	
		gl.uniform4fv(currentShader.color4Aux_loc, [lowestOctree.lego.selColor4.r/255.0, lowestOctree.lego.selColor4.g/255.0, lowestOctree.lego.selColor4.b/255.0, 1.0]);
		
		gl.uniform1i(currentShader.hasAditionalMov_loc, false);
		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	

				
		this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader, ssao_idx);
		
	}
	
	if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	gl.disableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	
	// Now, read the picked pixel and find the object.*********************************************************

	var pixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(this.mouse_x, scene.drawingBufferHeight - this.mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***
	
	// now, select the object.***
	var idx = 64516*pixels[0] + 254*pixels[1] + pixels[2];
	//this.objectSelected = this.selectionCandidateObjectsArray[idx];
	var selectedObject = this.selectionCandidateObjectsArray[idx];
	this.selectionCandidateObjectsArray.length = 0;
	
	var currentOctreeSelected = selectionCandidateLowestOctreesArray[idx];
	
	if(currentOctreeSelected == undefined)
	{
		currentSelectedBuilding = undefined;
		return undefined;
	}
		
	
	var currentSelectedBuilding = selectionCandidateLowestOctreesArray[idx].neoBuildingOwner;
	selectionCandidateLowestOctreesArray = undefined;
	
	resultSelectedArray[0] = currentSelectedBuilding;
	resultSelectedArray[1] = currentOctreeSelected;
	resultSelectedArray[2] = selectedObject;
	
	console.log(currentSelectedBuilding.buildingFileName);
	
	return selectedObject;

};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param resultRay 변수
 * @returns resultRay
 */
CesiumManager.prototype.getRayCamSpace = function(gl, scene, resultRay) {
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
CesiumManager.prototype.calculateSelObjMovePlane = function(gl, cameraPosition, scene, renderables_neoRefLists_array) {
	
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
  
	var camera = scene._camera;
//	var frustum = camera.frustum;
//	var current_frustum_near = scene._context._us._currentFrustum.x;
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

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.detailed_neoBuilding.buildingPositionHIGH);
	gl.uniform3fv(currentShader.buildingPosLOW_loc, this.detailed_neoBuilding.buildingPositionLOW);
	  
	gl.uniform1f(currentShader.far_loc, current_frustum_far); 

	var ssao_idx = -1; // selection code.***
	//ssao_idx = 1; // test.***
	var renderTexture = false;
	this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, renderables_neoRefLists_array);
	
	gl.disableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	
	// Now, read the picked pixel and find the pixel position.*********************************************************
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(this.mouse_x, scene.drawingBufferHeight - this.mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);

	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	zDepth /= 256.0; // convert to 0 to 1.0 range depth.***

	var realZDepth = zDepth*current_frustum_far;
	
	// now, find the 3d position of the pixel in camCoord.****
	this.resultRaySC = this.getRayCamSpace(gl, scene, this.resultRaySC);
	
	var pixelPosCamCoord = new Float32Array(3);
	pixelPosCamCoord[0] = this.resultRaySC[0] * realZDepth;
	pixelPosCamCoord[1] = this.resultRaySC[1] * realZDepth;
	pixelPosCamCoord[2] = this.resultRaySC[2] * realZDepth;
	
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

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param cameraPosition 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.calculateSelObjMovePlaneAsimetricMode = function(gl, cameraPosition, scene, renderables_neoRefLists_array) {
	
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
  
	var camera = scene._camera;
//	var frustum = camera.frustum;
	var current_frustum_near = scene._context._us._currentFrustum.x;
	var current_frustum_far = scene._context._us._currentFrustum.y;
	var frustumsCount = scene._frustumCommandsList.length;
	current_frustum_far = scene._frustumCommandsList[frustumsCount-1].far;
	
	this.selectionFbo.bind(); // framebuffer for color selection.***
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.selectionFbo.colorBuffer, 0);
	
	if(this.octreeSelected.neoReferencesMotherAndIndices)
	{
		//var currentShader = this.postFxShadersManager.pFx_shaders_array[6]; // depth shader.***
		var currentShader = this.postFxShadersManager.pFx_shaders_array[3]; // ssao_depth shader.***
		
		gl.clearColor(1, 1, 1, 1); // white background.***
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
		//gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
		
		var shaderProgram = currentShader.program;
		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(currentShader.position3_loc);
		//gl.enableVertexAttribArray(currentShader.normal3_loc);

		gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
		gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
		gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
		gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
		var idxKeyMatrix = -1;
		if(this.renderingModeTemp == 0) {
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.buildingSelected.buildingPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, this.buildingSelected.buildingPositionLOW); 
		} else {
			if(this.buildingSelected.geoLocationDataAux) {
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.buildingSelected.geoLocationDataAux.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, this.buildingSelected.geoLocationDataAux.positionLOW);
				idxKeyMatrix = 0;
			} else {
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.buildingSelected.buildingPositionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, this.buildingSelected.buildingPositionLOW);
			}
		}

		gl.uniform1f(currentShader.far_loc, current_frustum_far); 
		
		var ssao_idx = -1; // selection code.***
		//ssao_idx = 1; // test.***
		var renderTexture = false;
		//this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, renderables_neoRefLists_array); // old.***
		var isInterior = false;
		var renderTexture = false;
		var minSize = 0.0;
		var refsCount = this.octreeSelected.setRenderedFalseToAllReferences();
		this.renderer.renderNeoRefListsAsimetricVersion(gl, this.octreeSelected.neoReferencesMotherAndIndices, this.buildingSelected, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, undefined, idxKeyMatrix);
		
		gl.disableVertexAttribArray(currentShader.position3_loc);
		//gl.disableVertexAttribArray(currentShader.normal3_loc);
	}
	// 2) LOD 2 & 3.************************************************************************************************************************************
	// 2) LOD 2 & 3.************************************************************************************************************************************
	// 2) LOD 2 & 3.************************************************************************************************************************************
	var neoBuilding = this.octreeSelected.neoBuildingOwner;
	var lowestOctree;
	if(neoBuilding != undefined)
	{
		this.arrayAuxSC.length = 0;
		neoBuilding.octree.extractLowestOctreesIfHasTriPolyhedrons(this.arrayAuxSC);
		
		var lowestOctreesCount = this.arrayAuxSC.length;
		for(var i=0; i<lowestOctreesCount; i++)
		{
			lowestOctree = this.arrayAuxSC[i];
			if(lowestOctree.lego != undefined) 
			{
				if(neoBuilding != undefined)
				{
					currentShader = this.postFxShadersManager.pFx_shaders_array[7]; // lodBuilding depth.***
					shaderProgram = currentShader.program;
					gl.useProgram(shaderProgram);
					gl.enableVertexAttribArray(currentShader.position3_loc);

					gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
					gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
					gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
					gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
					gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
					gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
					
					gl.uniform1f(currentShader.near_loc, current_frustum_near);		
					gl.uniform1f(currentShader.far_loc, current_frustum_far); 
					
					gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
					gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
					
					gl.uniform1i(currentShader.hasAditionalMov_loc, true);
					gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	

					
					if(this.renderingModeTemp == 0) {
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					} else {
						if(neoBuilding.geoLocationDataAux) {
							gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
							gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
							gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						} else {
							gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
							gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
							gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						}
					}
					var ssao_idx = 0; // depth.***
					this.renderer.renderLodBuilding(gl, lowestOctree.lego, this, currentShader, ssao_idx);
					if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
				}
			}
		}
	}
	
	
	//-------------------------------------------------------------------------------------------------------------------------------------------------------
	
	// Now, read the picked pixel and find the pixel position.*********************************************************
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(this.mouse_x, scene.drawingBufferHeight - this.mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);

	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	zDepth /= 256.0; // convert to 0 to 1.0 range depth.***

	var realZDepth = zDepth*current_frustum_far;
	
	// now, find the 3d position of the pixel in camCoord.****
	this.resultRaySC = this.getRayCamSpace(gl, scene, this.resultRaySC);
	
	var pixelPosCamCoord = new Float32Array(3);
	pixelPosCamCoord[0] = this.resultRaySC[0] * realZDepth;
	pixelPosCamCoord[1] = this.resultRaySC[1] * realZDepth;
	pixelPosCamCoord[2] = this.resultRaySC[2] * realZDepth;
	
	// now, must transform this pixelCamCoord to world coord.***
	var mv_inv = new Cesium.Matrix4();
	mv_inv = Cesium.Matrix4.inverse(scene._context._us._modelView, mv_inv);
	var pixelPosCamCoordCartesian = new Cesium.Cartesian3(pixelPosCamCoord[0], pixelPosCamCoord[1], pixelPosCamCoord[2]);
	var pixelPos = new Cesium.Cartesian3();
	pixelPos = Cesium.Matrix4.multiplyByPoint(mv_inv, pixelPosCamCoordCartesian, pixelPos);
	
	var pixelPosBuilding = new Cesium.Cartesian3();
	if(this.renderingModeTemp == 0) {
		pixelPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, pixelPos, pixelPosBuilding);
	} else {
		if(this.buildingSelected.geoLocationDataAux) {
			pixelPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.geoLocationDataAux.tMatrixInv._floatArrays, pixelPos, pixelPosBuilding);
		} else {
			pixelPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, pixelPos, pixelPosBuilding);
		}
	}

	this.selObjMovePlane = new Plane();
	// provisionally make an XY plane.***
	// the plane is in world coord.***
	this.selObjMovePlane.setPointAndNormal(pixelPosBuilding.x, pixelPosBuilding.y, pixelPosBuilding.z, 0.0, 0.0, 1.0);
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
 * @param gl 변수
 * @param scene 변수
 */
CesiumManager.prototype.isDragging = function(scene) {
	// test function.***
	var gl = scene._context._gl;
	
	if(this.magoPolicy.mouseMoveMode == 0) // buildings move.***
	{
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjectPickingAsimetricMode(gl, scene, this.visibleObjControlerOctrees, this.arrayAuxSC);
		var currentBuildingSelected = this.arrayAuxSC[0];
		this.arrayAuxSC.length = 0;
		
		if(currentBuildingSelected == this.buildingSelected) {
			return true;
		} else {
			return false;
		}
	}
	else if(this.magoPolicy.mouseMoveMode == 1) // objects move.***
	{
		//var current_objectSelected = this.getSelectedObjectPicking(gl, scene, this.currentRenderables_neoRefLists_array); // original.***
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjectPickingAsimetricMode(gl, scene, this.visibleObjControlerOctrees, this.arrayAuxSC);
		this.arrayAuxSC.length = 0;
		
		if(current_objectSelected == this.objectSelected) {
			return true;
		} else {
			return false;
		}
	}
	else
		return false;
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.moveSelectedObject = function(scene, renderables_neoRefLists_array) {
	if(this.objectSelected == undefined) return;
	
	var gl = scene._context._gl;
	
	// 1rst, check if the clicked point is the selected object.***
	//var current_selectedObject = this.getSelectedObjectPicking(gl, scene, renderables_neoRefLists_array);
	//if(current_selectedObject != this.objectSelected)
	//	return;
	
	//this.objMovState
	
	var cameraPosition = scene.context._us._cameraPosition;
	//this.enableCameraMotion(false, scene);
	
	// create a XY_plane in the selected_pixel_position.***
	if(this.selObjMovePlane == undefined) {
		this.calculateSelObjMovePlane(gl, cameraPosition, scene, renderables_neoRefLists_array);
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
	
	if(!this.thereAreStartMovePoint) {
		this.startMovPoint = intersectionPoint;
		this.startMovPoint.add(-this.objectSelected.moveVector.x, -this.objectSelected.moveVector.y, -this.objectSelected.moveVector.z);
		this.thereAreStartMovePoint = true;
	} else {
		var difX = intersectionPoint.x - this.startMovPoint.x;
		var difY = intersectionPoint.y - this.startMovPoint.y;
		var difZ = intersectionPoint.z - this.startMovPoint.z;
		
		this.objectSelected.moveVector.set(difX, difY, difZ);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.moveSelectedObjectAsimetricMode = function(scene, renderables_neoRefLists_array) {
	
	var gl = scene._context._gl;
	
	var cameraPosition = scene.context._us._cameraPosition;
	//this.enableCameraMotion(false, scene);
	if(this.magoPolicy.mouseMoveMode == 0) // buildings move.***
	{
		if(this.buildingSelected == undefined) 
			return;
	
		// create a XY_plane in the selected_pixel_position.***
		if(this.selObjMovePlane == undefined) {
			this.calculateSelObjMovePlaneAsimetricMode(gl, cameraPosition, scene, renderables_neoRefLists_array);
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
		//camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, camPos, camPosBuilding);
		
		var camDirBuilding = new Cesium.Cartesian3();
		//camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.move_matrix_inv, rayWorldSpace, camDirBuilding); // "move_matrix_inv" is only rotation matrix.***

		if(this.renderingModeTemp == 0) {
			camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, camPos, camPosBuilding);
			camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.move_matrix_inv, rayWorldSpace, camDirBuilding); // "move_matrix_inv" is only rotation matrix.***
		} else {
			if(this.buildingSelected.geoLocationDataAux) {
				//camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.geoLocationDataAux.tMatrixInv._floatArrays, camPos, camPosBuilding);
				//camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.geoLocationDataAux.rotMatrixInv._floatArrays, rayWorldSpace, camDirBuilding);
				
				camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.geoLocationDataAux.geoLocMatrixInv._floatArrays, camPos, camPosBuilding);
				this.pointSC = this.buildingSelected.geoLocationDataAux.geoLocMatrixInv.rotatePoint3D(rayWorldSpace, this.pointSC);
				camDirBuilding.x = this.pointSC.x;
				camDirBuilding.y = this.pointSC.y;
				camDirBuilding.z = this.pointSC.z;
			} else {
				camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, camPos, camPosBuilding);
				camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.move_matrix_inv, rayWorldSpace, camDirBuilding);
			}
		}

		// now, intersect building_ray with the selObjMovePlane.***
		var line = new Line();
		line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z,       camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);
		
		var intersectionPoint = new Point3D();
		intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);
		intersectionPoint.set(-intersectionPoint.x, -intersectionPoint.y, -intersectionPoint.z);
		
		

		
		// register the movement.***
		if(this.buildingSelected.moveVector == undefined)
			this.buildingSelected.moveVector = new Point3D();
		
		if(!this.thereAreStartMovePoint) {
			this.startMovPoint = intersectionPoint;
			//this.startMovPoint.add(-this.buildingSelected.moveVector.x, -this.buildingSelected.moveVector.y, -this.buildingSelected.moveVector.z);
			this.thereAreStartMovePoint = true;
		} else {
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;
			
			this.buildingSelected.moveVector.set(difX, difY, difZ);
			
			// test.*** see the cartographic values of the intersected point.***
			var newPosition = new Point3D();
			newPosition.add(this.buildingSelected.geoLocationDataAux.bboxAbsoluteCenterPos.x, this.buildingSelected.geoLocationDataAux.bboxAbsoluteCenterPos.y, this.buildingSelected.geoLocationDataAux.bboxAbsoluteCenterPos.z);
			newPosition.add(difX, difY, difZ);
			
			//var cartographic = Cesium.Ellipsoid.cartesianToCartographic(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
			var cartographic = Cesium.Cartographic.fromCartesian(new Cesium.Cartesian3(newPosition.x, newPosition.y, newPosition.z));
			var newLongitude = cartographic.longitude * (180.0/Math.PI);
			var newlatitude = cartographic.latitude * (180.0/Math.PI);
			var newHeight = cartographic.height;
			
			this.changeLocationAndRotation(this.buildingSelected.buildingId, newlatitude, newLongitude, undefined, undefined, undefined, undefined);
			var dividedName = this.buildingSelected.buildingId.split("_");
			showLocationAndRotationAPI(	dividedName[0], 
										dividedName[1], 
										this.buildingSelected.geoLocationDataAux.latitude, 
										this.buildingSelected.geoLocationDataAux.longitude,
										this.buildingSelected.geoLocationDataAux.elevation,
										this.buildingSelected.geoLocationDataAux.heading,
										this.buildingSelected.geoLocationDataAux.pitch,
										this.buildingSelected.geoLocationDataAux.roll);
		}
		
	}
	else if(this.magoPolicy.mouseMoveMode == 1) // objects move.***
	{
		if(this.objectSelected == undefined) 
			return;
	
		// create a XY_plane in the selected_pixel_position.***
		if(this.selObjMovePlane == undefined) {
			this.calculateSelObjMovePlaneAsimetricMode(gl, cameraPosition, scene, renderables_neoRefLists_array);
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
		//camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, camPos, camPosBuilding);
		
		var camDirBuilding = new Cesium.Cartesian3();
		//camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.move_matrix_inv, rayWorldSpace, camDirBuilding); // "move_matrix_inv" is only rotation matrix.***

		if(this.renderingModeTemp == 0) {
			camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, camPos, camPosBuilding);
			camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.move_matrix_inv, rayWorldSpace, camDirBuilding); // "move_matrix_inv" is only rotation matrix.***
		} else {
			if(this.buildingSelected.geoLocationDataAux) {
				camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.geoLocationDataAux.tMatrixInv._floatArrays, camPos, camPosBuilding);
				camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.geoLocationDataAux.rotMatrixInv._floatArrays, rayWorldSpace, camDirBuilding);
			} else {
				camPosBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.transfMat_inv, camPos, camPosBuilding);
				camDirBuilding = Cesium.Matrix4.multiplyByPoint(this.buildingSelected.move_matrix_inv, rayWorldSpace, camDirBuilding);
			}
		}

		// now, intersect building_ray with the selObjMovePlane.***
		var line = new Line();
		line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z,       camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);
		
		var intersectionPoint = new Point3D();
		intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);
		
		// register the movement.***
		if(this.objectSelected.moveVector == undefined)
			this.objectSelected.moveVector = new Point3D();
		
		if(!this.thereAreStartMovePoint) {
			this.startMovPoint = intersectionPoint;
			this.startMovPoint.add(-this.objectSelected.moveVector.x, -this.objectSelected.moveVector.y, -this.objectSelected.moveVector.z);
			this.thereAreStartMovePoint = true;
		} else {
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;
			
			this.objectSelected.moveVector.set(difX, difY, difZ);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param result_neoRefLists_array 변수
 * @returns result_neoRefLists_array
 */
CesiumManager.prototype.getRenderablesDetailedNeoBuilding = function(gl, scene, neoBuilding, result_neoRefLists_array) {
	result_neoRefLists_array.length = 0; // Init.***
	neoBuilding.currentRenderablesNeoRefLists.length = 0; // Init.***
	
	if(neoBuilding == undefined) return result_neoRefLists_array;
	
	if(neoBuilding.move_matrix == undefined) {
		ManagerUtils.calculateBuildingPositionMatrix(neoBuilding);
		return result_neoRefLists_array;
	}
	
	var cameraPosition = scene.context._us._cameraPosition;
	var transformedCamPos = neoBuilding.getTransformedRelativeEyePositionToBuilding(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	this.isCameraInsideNeoBuilding = neoBuilding.isCameraInsideOfBuilding(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
	//if(!this.isCameraMoving)
//	{
	result_neoRefLists_array.length = 0; // init.***
	var refList;
	var maxRefListParsingCount = 10;
	var refListsParsingCount = 0;
	//var buildingRotationMatrix;
	
	// Determine if the camera is inside of the building.***
	if(this.isCameraInsideNeoBuilding && neoBuilding.octree != undefined) {
		// check if must load the octree.***
		this.loadBuildingOctree(neoBuilding); // here loads octree interior references.***
		
		if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
		
		if(neoBuilding.buildingPosMat_inv == undefined) {
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
		//buildingRotationMatrix = new Matrix4();
		this.matrix4SC.setByFloat32Array(neoBuilding.move_matrix);
		
		for(var i=0; i<this.intNeoRefList_array.length; i++) {
			// Before "updateCurrentVisibleIndicesInterior", must check if the refList has parsed the arrayBuffer data.***
			refList = this.intNeoRefList_array[i];
			// 2 = file loading finished.***
			if(refList.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
				if(refListsParsingCount < maxRefListParsingCount) {
					// must parse the arraybuffer data.***
					refList.parseArrayBuffer(gl, refList.dataArraybuffer, this.readerWriter);
					refList.dataArraybuffer = null;
					if(this.matrix4SC) {
						refList.multiplyReferencesMatrices(this.matrix4SC);
					}
		  
					refListsParsingCount += 1;
				}
			} else if(refList.fileLoadState == CODE.fileLoadState.PARSE_FINISHED) {
				// 4 = parsed.***
				// now, check if the blocksList is loaded & parsed.***
				var blocksList = refList.blocksList;
				if(blocksList.fileLoadState == CODE.fileLoadState.READY) {
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						// must read blocksList.***
						var geometryDataPath = this.readerWriter.geometryDataPath;
						var buildingFolderName = neoBuilding.buildingFileName;
	
						var filePathInServer = geometryDataPath + "/" + buildingFolderName + "/" + blocksList.name;
						this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);
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
	//buildingRotationMatrix = new Matrix4();
	this.matrix4SC.setByFloat32Array(neoBuilding.move_matrix);
		
	var extNeoRefsCount = neoBuilding._neoRefLists_Container.neoRefsLists_Array.length;
	for(var i=0; i<extNeoRefsCount; i++) {
		refList = neoBuilding._neoRefLists_Container.neoRefsLists_Array[i];
		if(refList.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
			// 2 = file loading finished.***
			if(refListsParsingCount < maxRefListParsingCount) {
				// must parse the arraybuffer data.***
				refList.parseArrayBuffer(gl, refList.dataArraybuffer, this.readerWriter);
				refList.dataArraybuffer = null;
				if(this.matrix4SC) {
					refList.multiplyReferencesMatrices(this.matrix4SC);
				}
	  
				refListsParsingCount += 1;
			}
		}
		//else if(refList.fileLoadState == CODE.fileLoadState.PARSE_FINISHED)
		//{
		//	refList.updateCurrentVisibleIndicesInterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
		//	result_neoRefLists_array.push(refList); // GET INTERIORS.****
		//}
	}
	
	neoBuilding.updateCurrentVisibleIndicesExterior(transformedCamPos.x, transformedCamPos.y, transformedCamPos.z);
	
	// now, make the result list.***
	var neoRefListsContainer_exterior = neoBuilding._neoRefLists_Container;
	var count = neoRefListsContainer_exterior.neoRefsLists_Array.length;
	for(var i=0; i<count; i++) {
		neoBuilding.currentRenderablesNeoRefLists.push(neoRefListsContainer_exterior.neoRefsLists_Array[i]);
	}
//}
	
	//return result_neoRefLists_array;
	return neoBuilding.currentRenderablesNeoRefLists;
};



/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param neoBuilding 변수
 * @param visibleObjControlerOctrees 변수
 * @param visibleObjControlerOctreesAux 변수
 * @returns result_neoRefLists_array
 */
 
CesiumManager.prototype.getRenderablesDetailedNeoBuildingAsimetricVersion = function(gl, scene, neoBuilding, 
		visibleObjControlerOctrees, visibleObjControlerOctreesAux, lod) {
	if(neoBuilding == undefined) return;
	
	neoBuilding.currentRenderablesNeoRefLists.length = 0; // Init.***
	
	if(neoBuilding.move_matrix == undefined) {
		ManagerUtils.calculateBuildingPositionMatrix(neoBuilding);
		return;
	}
	
	var refList;
	var maxRefListParsingCount = 90;
	var refListsParsingCount = 0;
	
	//if(this.isCameraInsideNeoBuilding && neoBuilding.octree != undefined) // original.***
	if(neoBuilding.octree != undefined) {
		if(lod == 0 || lod == 1)
		{
			if(this.myCameraSC == undefined) this.myCameraSC = new Cesium.Camera(scene);
			if(neoBuilding.buildingPosMat_inv == undefined) {
			    neoBuilding.buildingPosMat_inv = new Matrix4();
			    neoBuilding.buildingPosMat_inv.setByFloat32Array(neoBuilding.move_matrix_inv);
			}
			
			var camera = scene.frameState.camera;
			var near = scene._frustumCommandsList[this.frustumIdx].near;
			var far = scene._frustumCommandsList[this.frustumIdx].far;
			if(this.renderingModeTemp == 0) {
				this.myCameraSC = neoBuilding.getTransformedRelativeCameraToBuilding(camera, this.myCameraSC);
			} else {
				if(neoBuilding.geoLocationDataAux) {
					this.myCameraSC = neoBuilding.geoLocationDataAux.getTransformedRelativeCamera(camera, this.myCameraSC);
				} else {
					this.myCameraSC = neoBuilding.getTransformedRelativeCameraToBuilding(camera, this.myCameraSC);
				}
			}
			
			var squaredDistLod0 = 500;
			var squaredDistLod1 = 4000;
			var squaredDistLod2 = 500000*1000;
			if(this.renderingModeTemp == 1) {
				squaredDistLod0 = 300;
				squaredDistLod1 = 1000;
				squaredDistLod2 = 500000*1000;
			}
			//squaredDistLod0 = 20;
			//squaredDistLod1 = 60;
			//squaredDistLod2 = 500000*1000;
			
			if(neoBuilding.buildingType == "outfitting")
			//if(neoBuilding.buildingType == "MOP") khj(20170331)
			{
				if(this.renderingModeTemp == 0)
					this.myCameraSC.frustum.fov = 0.2;
				
				if(this.renderingModeTemp == 1)
					this.myCameraSC.frustum.fov = 0.3;
				
				squaredDistLod1 = 1700;
			}
			else 
			{
				this.myCameraSC.frustum.fov = 0.9;
			}
			//this.myCameraSC.frustum.fovy = 0.3;
			//camera.frustum.far = 2.0;
			this.myCameraSC.near = near;
			this.myCameraSC.far = far;
			var myCullingVolume = this.myCameraSC.frustum.computeCullingVolume(this.myCameraSC.position, this.myCameraSC.direction, this.myCameraSC.up);
			var advancedDist = 3.0;
			var advancedCamPosX = this.myCameraSC.position.x + advancedDist * this.myCameraSC.direction.x;
			var advancedCamPosY = this.myCameraSC.position.y + advancedDist * this.myCameraSC.direction.y;
			var advancedCamPosZ = this.myCameraSC.position.z + advancedDist * this.myCameraSC.direction.z;
			
			// get frustumCulled lowestOctrees classified by distances.************************************************************************************
			var lastLOD0LowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
			var lastLOD1LowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
			
			
			var find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	myCullingVolume, visibleObjControlerOctrees, visibleObjControlerOctreesAux, this.boundingSphere_Aux, 
																					this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z, 
																					squaredDistLod0, squaredDistLod1, squaredDistLod2);
																					
			//var find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	myCullingVolume, visibleObjControlerOctrees, visibleObjControlerOctreesAux, this.boundingSphere_Aux, 
																					//advancedCamPosX, advancedCamPosY, advancedCamPosZ, 
																					//squaredDistLod0, squaredDistLod1, squaredDistLod2);
			if(!find) {
				//this.deleteNeoBuilding(gl, neoBuilding);
				//neoBuilding.octree.deleteLod0GlObjects(gl);
				return;
			}
		}
		else
		{
			neoBuilding.octree.extractLowestOctreesIfHasTriPolyhedrons(visibleObjControlerOctrees.currentVisibles2);
		}
		
		// LOD0.*** check if the lod0lowestOctrees must load and parse data.************************************************************
		// LOD0.*** check if the lod0lowestOctrees must load and parse data.************************************************************
		// LOD0.*** check if the lod0lowestOctrees must load and parse data.************************************************************
		var geometryDataPath = this.readerWriter.geometryDataPath;
		var buildingFolderName = neoBuilding.buildingFileName;
		var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
		var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
		//var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Blocks"; khj(20170331)
		//  var bricks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Bricks";
	
		var lowestOctree;
		//buildingRotationMatrix = new Matrix4();
		this.matrix4SC.setByFloat32Array(neoBuilding.move_matrix);
		var lowestOctreesCount = visibleObjControlerOctreesAux.currentVisibles0.length;
		
		for(var i=lastLOD0LowestOctreesCount; i<lowestOctreesCount; i++) {
			
			lowestOctree = visibleObjControlerOctreesAux.currentVisibles0[i];
			if(lowestOctree.triPolyhedronsCount == 0) continue;
			
			if(lowestOctree.neoReferencesMotherAndIndices == undefined)
			{
				lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
				lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
			}
			
				
			if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == 0) {
				lowestOctree.neoBuildingOwner = neoBuilding; // New.***
				
					/*
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						//var neoReferencesList = new NeoReferencesList();
						//neoReferencesList.neoBuildingOwner = neoBuilding; // New.***
						if(neoBuilding._blocksList_Container == undefined)
						{
							neoBuilding._blocksList_Container = new BlocksListsContainer();
							neoBuilding._blocksList_Container.newBlocksList("Blocks1");
						}
						//lowestOctree.neoReferencesMotherAndIndices.blocksList = neoBuilding._blocksList_Container.blocksListsArray[0]; //OLD!!!;
						if(lowestOctree.neoReferencesMotherAndIndices.blocksList == undefined)
							lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList();
						
						var subOctreeNumberName = lowestOctree.octree_number_name.toString();
						
						var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
						this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree.neoReferencesMotherAndIndices, this);

					}
					*/
				
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
					
				continue;
			}
			
			//refList = lowestOctree.neoRefsList_Array[0];
			//if(refList == undefined)
			//	continue;
			
			// 2 = file loading finished.***
			if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
				/*
				if(refListsParsingCount < maxRefListParsingCount) {
					// must parse the arraybuffer data.***
					lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, lowestOctree.neoBuildingOwner.motherNeoReferencesArray, this.matrix4SC);
					lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
					refListsParsingCount += 1;
				}
				*/
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
						
			} else if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.PARSE_FINISHED ) {
				// 4 = parsed.***
				// now, check if the blocksList is loaded & parsed.***
				/*
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				// 0 = file loading NO started.***
				if(blocksList.fileLoadState == CODE.fileLoadState.READY) {

					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						// must read blocksList.***
						var geometryDataPath = this.readerWriter.geometryDataPath;
						var buildingFolderName = neoBuilding.buildingFileName;
	
						var subOctreeNumberName = lowestOctree.octree_number_name.toString();
						var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Block";
						this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);

					}
					
					// test
					//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
					continue;
				}
				*/
			}
			
		}
		
		// LOD 1.****************************************************************************************************************
		// LOD 1.****************************************************************************************************************
		// LOD 1.****************************************************************************************************************
		if(neoBuilding.buildingType == "outfitting")
		//if(neoBuilding.buildingType == "MOP") khj(20170331)
			return;
		
		lowestOctreesCount = visibleObjControlerOctreesAux.currentVisibles1.length;
		for(var i=lastLOD1LowestOctreesCount; i<lowestOctreesCount; i++) {
			
			lowestOctree = visibleObjControlerOctreesAux.currentVisibles1[i];
			if(lowestOctree.neoReferencesMotherAndIndices == undefined)
			{
				lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
				lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
			}
			
				
			if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == 0) {
				lowestOctree.neoBuildingOwner = neoBuilding; // New.***
				/*
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					//var neoReferencesList = new NeoReferencesList();
					//neoReferencesList.neoBuildingOwner = neoBuilding; // New.***
					if(neoBuilding._blocksList_Container == undefined)
					{
						neoBuilding._blocksList_Container = new BlocksListsContainer();
						neoBuilding._blocksList_Container.newBlocksList("Blocks1");
					}
					//lowestOctree.neoReferencesMotherAndIndices.blocksList = neoBuilding._blocksList_Container.blocksListsArray[0]; //OLD!!!;
					if(lowestOctree.neoReferencesMotherAndIndices.blocksList == undefined)
						lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList();
					
					var subOctreeNumberName = lowestOctree.octree_number_name.toString();
					
					var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
					this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree.neoReferencesMotherAndIndices, this);

				}
				*/
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
					
				continue;
			}
			
			//refList = lowestOctree.neoRefsList_Array[0];
			//if(refList == undefined)
			//	continue;
			
			// 2 = file loading finished.***
			if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
				/*
				if(refListsParsingCount < maxRefListParsingCount) {
					// must parse the arraybuffer data.***
					lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, lowestOctree.neoBuildingOwner.motherNeoReferencesArray, this.matrix4SC);
					lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
					//if(this.matrix4SC) {
					//	refList.multiplyReferencesMatrices(this.matrix4SC);
					//}
		  
					refListsParsingCount += 1;
				}
				*/
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
						
			} else if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.PARSE_FINISHED ) {
				/*
				// 4 = parsed.***
				// now, check if the blocksList is loaded & parsed.***
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				// 0 = file loading NO started.***
				if(blocksList.fileLoadState == CODE.fileLoadState.READY) {
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						// must read blocksList.***
						var geometryDataPath = this.readerWriter.geometryDataPath;
						var buildingFolderName = neoBuilding.buildingFileName;
	
						//var filePathInServer = geometryDataPath + "/" + buildingFolderName + "/" + "Blocks";
						var subOctreeNumberName = lowestOctree.octree_number_name.toString();
						var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Block";
						this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);

					}
					
					// test
					//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
					continue;
				}
				*/
			}
			
		}
		
	}
	

};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param scene 변수
 * @param neoBuilding 변수
 * @param visibleObjControlerOctrees 변수
 * @param visibleObjControlerOctreesAux 변수
 * @returns result_neoRefLists_array
 */
 
CesiumManager.prototype.prepareVisibleOctreesAsimetricVersion = function(gl, scene, visibleObjControlerOctrees) {

	var refList;
	var maxRefListParsingCount = 30;
	var refListsParsingCount = 0;
	
	//if(this.isCameraInsideNeoBuilding && neoBuilding.octree != undefined) // original.***
		
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	var geometryDataPath = this.readerWriter.geometryDataPath;
	
	//  var bricks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Bricks";

	var lowestOctree;
	var neoBuilding;
	//buildingRotationMatrix = new Matrix4();
	//this.matrix4SC.setByFloat32Array(neoBuilding.move_matrix);
	var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
	
	for(var i=0; i<lowestOctreesCount; i++) {
		
		lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
		neoBuilding = lowestOctree.neoBuildingOwner;
		if(lowestOctree.triPolyhedronsCount == 0) continue;
			
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == 0) 
		{
			if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) 
			{
				neoBuilding = lowestOctree.neoBuildingOwner;
				
				if(lowestOctree.neoReferencesMotherAndIndices.blocksList == undefined)
					lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList();
				
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var buildingFolderName = neoBuilding.buildingFileName;
				var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
				//var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Blocks";
				
				var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
				this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree.neoReferencesMotherAndIndices, this);

			}
			
			// test
			//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
				
			continue;
		}
		
		// 2 = file loading finished.***
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {

			if(refListsParsingCount < maxRefListParsingCount) {
				// must parse the arraybuffer data.***
				this.matrix4SC.setByFloat32Array(neoBuilding.move_matrix);
				lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, lowestOctree.neoBuildingOwner.motherNeoReferencesArray, this.matrix4SC);
				lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
				refListsParsingCount += 1;
			}
			
			// test
			//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
					
		} else if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.PARSE_FINISHED ) {
			// 4 = parsed.***
			// now, check if the blocksList is loaded & parsed.***
			var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
			// 0 = file loading NO started.***
			if(blocksList.fileLoadState == CODE.fileLoadState.READY) {

				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read blocksList.***
					neoBuilding = lowestOctree.neoBuildingOwner;
					var geometryDataPath = this.readerWriter.geometryDataPath;
					var buildingFolderName = neoBuilding.buildingFileName;

					var subOctreeNumberName = lowestOctree.octree_number_name.toString();
					var buildingFolderName = neoBuilding.buildingFileName;
					//var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
					var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
					//var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Blocks"; khj(20170331)
					var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
					//var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Block";
					this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);

				}
				
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
				continue;
			}
		}
		
	}
	
	// LOD 1.*************************************************************************************************************************************************
	// LOD 1.*************************************************************************************************************************************************
	// LOD 1.*************************************************************************************************************************************************
	
	
	lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
	for(var i=0; i<lowestOctreesCount; i++) {
		lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
		neoBuilding = lowestOctree.neoBuildingOwner;
		//if(neoBuilding.buildingType == "MOP")
		//continue;
		if(lowestOctree.neoReferencesMotherAndIndices == undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
		}
		
			
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == 0) 
		{
			//lowestOctree.neoBuildingOwner = neoBuilding; // New.***
			
			if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
			{
				if(lowestOctree.neoReferencesMotherAndIndices.blocksList == undefined)
					lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList();
				
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var buildingFolderName = neoBuilding.buildingFileName;
				var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
				//var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Blocks";
				
				var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
				this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree.neoReferencesMotherAndIndices, this);

			}
			// test
			//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
				
			continue;
		}
		
		//refList = lowestOctree.neoRefsList_Array[0];
		//if(refList == undefined)
		//	continue;
		
		// 2 = file loading finished.***
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
			if(refListsParsingCount < maxRefListParsingCount) {
				// must parse the arraybuffer data.***
				this.matrix4SC.setByFloat32Array(neoBuilding.move_matrix);
				lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, lowestOctree.neoBuildingOwner.motherNeoReferencesArray, this.matrix4SC);
				lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
				//if(this.matrix4SC) {
				//	refList.multiplyReferencesMatrices(this.matrix4SC);
				//}
	  
				refListsParsingCount += 1;
			}
			// test
			//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
					
		} else if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.PARSE_FINISHED ) {
			// 4 = parsed.***
			// now, check if the blocksList is loaded & parsed.***
			var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
			// 0 = file loading NO started.***
			if(blocksList.fileLoadState == CODE.fileLoadState.READY) {
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					neoBuilding = lowestOctree.neoBuildingOwner;
					var subOctreeNumberName = lowestOctree.octree_number_name.toString();
					var buildingFolderName = neoBuilding.buildingFileName;
					//var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
					var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
					//var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Blocks";
					var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
					//var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Block";
					this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);

				}
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
				continue;
			}
		}
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param cameraPosition 카메라 입장에서 화면에 그리기 전에 객체를 그릴 필요가 있는지 유무를 판단하는 값
 * @param scene 변수
 * @param shader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 * @param neoRefLists_array 변수
 */
CesiumManager.prototype.renderDetailedNeoBuilding = function(gl, cameraPosition, scene, shader, renderTexture, ssao_idx, neoRefLists_array) {
	
	// picking mode.***********************************************************************************
	if(ssao_idx == -1) {
		// picking mode.***
		this.selectionCandidateObjectsArray.length = 0; // init.***
		
		// set byteColor codes for references objects.***
		var red = 0, green = 0, blue = 0, alfa = 255;
		
		// 1) Exterior objects.***
		var neoRefListsArray = neoRefLists_array;
		//var neoRefListsArray = this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array;
		var neoRefLists_count = neoRefListsArray.length;
		for(var i = 0; i<neoRefLists_count; i++) {
			var neoRefList = neoRefListsArray[i];
			var neoRefs_count = neoRefList.neoRefs_Array.length;
			for(var j=0; j<neoRefs_count; j++) {
				var neoRef = neoRefList.neoRefs_Array[j];
				if(neoRef.selColor4 == undefined) neoRef.selColor4 = new Color();
				
				neoRef.selColor4.set(red, green, blue, alfa);
				this.selectionCandidateObjectsArray.push(neoRef);
				blue++;
				if(blue >= 254) {
					blue = 0;
					green++;
					if(green >= 254) {
						red++;
					}
				}
			}
		}
	}
	
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	
	var isInterior = false;
	if(ssao_idx == -1) {
		this.renderer.renderNeoRefListsColorSelection(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	} else {
		this.renderer.renderNeoRefLists(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param cameraPosition 카메라 입장에서 화면에 그리기 전에 객체를 그릴 필요가 있는지 유무를 판단하는 값
 * @param scene 변수
 * @param shader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 * @param neoRefLists_array 변수
 */
 
CesiumManager.prototype.renderLowestOctreeLegoAsimetricVersion = function(gl, cameraPosition, scene, shader, renderTexture, ssao_idx, visibleObjControlerOctrees) {

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	gl.frontFace(gl.CCW);
	
	if(ssao_idx == -1) {
		//var isInterior = false; // no used.***
		//this.renderer.renderNeoRefListsColorSelection(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	} else {
	
		var isInterior = false; // no used.***
		// Render Detailed.****************************************************************************************************************************************
		//this.renderer.renderNeoRefListsAsimetricVersion(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
		//return;
		// End render detailed.------------------------------------------------------------------------------------------------------------------------------------
		
		var camera = this.scene._camera;
		var frustum = camera.frustum;
//		var current_frustum_near = scene._context._us._currentFrustum.x;
		var current_frustum_far = scene._context._us._currentFrustum.y;
		var currentShader;
		var shaderProgram;
		var neoBuilding;
		var lowestOctree;
		var refList;
//		var refListsParsingCount = 0;
//		var maxRefListParsingCount = 10;
			
		renderTexture = false;
		
		var lowestOctreeLegosParsingCount = 0;
		
		// Test render in lego.***
		if(ssao_idx == 0) {
			// LOD 0. Render detailed.***
			currentShader = this.postFxShadersManager.pFx_shaders_array[3]; // neo depth.***
			shaderProgram = currentShader.program;
			
			gl.useProgram(shaderProgram);
			//gl.enableVertexAttribArray(currentShader.texCoord2_loc); // No textures for depth render.***
			gl.enableVertexAttribArray(currentShader.position3_loc);
			if(currentShader.normal3_loc != -1)
				gl.enableVertexAttribArray(currentShader.normal3_loc);

			gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
			gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
			gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
			gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);

			gl.uniform1f(currentShader.near_loc, frustum._near);	
			gl.uniform1f(currentShader.far_loc, current_frustum_far); 

			gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
			
			//neoBuilding.setRenderedFalseToAllReferences();
			var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
				lowestOctree.setRenderedFalseToAllReferences();
			}
			lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
				lowestOctree.setRenderedFalseToAllReferences();
			}
			
			// renderDepth for all buildings.***
			// 1) LOD 0.*********************************************************************************************************************
			// 1) LOD 0.*********************************************************************************************************************
			// 1) LOD 0.*********************************************************************************************************************
			var refTMatrixIdxKey = -1;
			var minSize = 0.0;
			var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
				
				if(lowestOctree.neoReferencesMotherAndIndices == undefined) continue;
				
				//refList = lowestOctree.neoRefsList_Array[0];
				//if(refList == undefined)
				//	continue;
				
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				
				//if(neoBuilding.buildingType == "MOP")
				//	continue;
				
				if(this.renderingModeTemp == 0)
				{
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					refTMatrixIdxKey = -1;
				}
				else{
					if(neoBuilding.geoLocationDataAux)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						
						// check if the references of the lowestOctree has the geoLocationDataAux tMatrix.***
						if(lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0))
						{
							if( !lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0).hasKeyMatrix(0))
							lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
						}
						refTMatrixIdxKey = 0;
					}
					else{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						refTMatrixIdxKey = -1;
					}
				}

				if(i == 0)
					minSize = 0.0;
				else minSize = 0.0;
				//minSize = lowestOctree.squareDistToEye/10000;
				this.renderer.renderNeoRefListsAsimetricVersion(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
			}
			
			// 2) LOD 1.*********************************************************************************************************************
			// 2) LOD 1.*********************************************************************************************************************
			// 2) LOD 1.*********************************************************************************************************************
			lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
				
				if(lowestOctree.neoReferencesMotherAndIndices == undefined) continue;
				
				//refList = lowestOctree.neoRefsList_Array[0];
				//if(refList == undefined)
				//	continue;
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				
				if(this.renderingModeTemp == 0 && neoBuilding.buildingType == "outfitting")
				//if(this.renderingModeTemp == 0 && neoBuilding.buildingType == "MOP") khj(20170331)
					continue;
				
				if(this.renderingModeTemp == 0)
				{
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					refTMatrixIdxKey = -1;
				}
				else{
					if(neoBuilding.geoLocationDataAux)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						
						// check if the references of the lowestOctree has the geoLocationDataAux tMatrix.***
						if(lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0))
						{
							if( !lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0).hasKeyMatrix(0))
							lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
						}
						refTMatrixIdxKey = 0;
					}
					else{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						refTMatrixIdxKey = -1;
					}
				}
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
				//gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
				//gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
				//this.renderDetailedNeoBuilding(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, neoBuilding.currentRenderablesNeoRefLists);
				if(i == 0)
					minSize = 0.9;
				else minSize = 0.9;
				//minSize = lowestOctree.squareDistToEye/10000 + 1.0;
				this.renderer.renderNeoRefListsAsimetricVersion(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, 1, refTMatrixIdxKey);
			}
			
			// 2) LOD 2 & 3.************************************************************************************************************************************
			// 2) LOD 2 & 3.************************************************************************************************************************************
			// 2) LOD 2 & 3.************************************************************************************************************************************
			currentShader = this.postFxShadersManager.pFx_shaders_array[7]; // lodBuilding depth.***
			shaderProgram = currentShader.program;
			gl.useProgram(shaderProgram);
			gl.enableVertexAttribArray(currentShader.position3_loc);

			gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
			gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
			gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
			gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
			
			gl.uniform1f(currentShader.near_loc, frustum._near);		
			gl.uniform1f(currentShader.far_loc, current_frustum_far); 
			
			gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
			gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
			
			gl.uniform1i(currentShader.hasAditionalMov_loc, true);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
			
			lowestOctreesCount = visibleObjControlerOctrees.currentVisibles2.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles2[i];
				
				if(lowestOctree.lego == undefined) {
					lowestOctree.lego = new Lego();
					lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
				}
				
				if(lowestOctree.lego == undefined && lowestOctree.lego.dataArrayBuffer == undefined) continue;
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				if(neoBuilding == undefined)
					continue;
				
				if(neoBuilding.buildingType == "outfitting")
				//if(neoBuilding.buildingType == "MOP") khj(20170331)
					continue;
				
				
				
				// && lowestOctree.neoRefsList_Array.length == 0)
				if(lowestOctree.lego.fileLoadState == CODE.fileLoadState.READY && !this.isCameraMoving) {
					// must load the legoStructure of the lowestOctree.***
					if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
						var subOctreeNumberName = lowestOctree.octree_number_name.toString();
						var buildingFolderName = neoBuilding.buildingFileName;
						var bricks_folderPath = this.readerWriter.geometryDataPath + "/" + buildingFolderName + "/Bricks";
						var lego_filePath = bricks_folderPath + "/" + subOctreeNumberName + "_Brick";
						this.readerWriter.getOctreeLegoArraybuffer(lego_filePath, lowestOctree, this);
					}
					continue;
				}
				
				if(lowestOctree.lego.fileLoadState == 2 && !this.isCameraMoving) {
					if(lowestOctreeLegosParsingCount < 100) {
						var bytesReaded = 0;
						lowestOctree.lego.parseArrayBuffer(gl, this.readerWriter, lowestOctree.lego.dataArrayBuffer, bytesReaded);
						lowestOctree.lego.dataArrayBuffer = undefined;
						lowestOctreeLegosParsingCount++;
					} 
					continue;
				}
				if(this.renderingModeTemp == 0) {
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
				} else {
					if(neoBuilding.geoLocationDataAux) {
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
					} else {
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					}
				}
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
				//gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
				//gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
				
				this.renderer.renderLodBuilding(gl, lowestOctree.lego, this, currentShader, ssao_idx);
				
			}
			//this.renderer.renderNeoRefListsLegoAsimetricVersion(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx);
			
			if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
		}
		if(ssao_idx == 1) {
			// LOD 0. Render detailed.***
			// 2) ssao render.************************************************************************************************************
			// 2) ssao render.************************************************************************************************************
			// 2) ssao render.************************************************************************************************************
			if(this.noiseTexture == undefined) this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels);
			
			currentShader = this.postFxShadersManager.pFx_shaders_array[4];

			shaderProgram = currentShader.program;
			gl.useProgram(shaderProgram);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			if(currentShader.normal3_loc != -1) gl.enableVertexAttribArray(currentShader.normal3_loc);

			gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
			gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
			gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
			gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***

			gl.uniform1f(currentShader.near_loc, frustum._near);	
			//gl.uniform1f(currentShader.far_loc, frustum._far); // Original.***
			gl.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
			
			gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
			gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
				
			gl.uniform1i(currentShader.depthTex_loc, 0);	
			gl.uniform1i(currentShader.noiseTex_loc, 1);	
			gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
			gl.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
			gl.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
			gl.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
			gl.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
			gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
			gl.uniform3fv(currentShader.kernel16_loc, this.kernel);	
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
			gl.activeTexture(gl.TEXTURE1);            
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture); 
			
			var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				//lowestOctree.neoBuildingOwner
				lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
				lowestOctree.setRenderedFalseToAllReferences();
			}
			
			lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
				lowestOctree.setRenderedFalseToAllReferences();
			}
			//neoBuilding.setRenderedFalseToAllReferences();
			
			//renderTexture = true;
			// 1) LOD 0.*********************************************************************************************************************
			// 1) LOD 0.*********************************************************************************************************************
			// 1) LOD 0.*********************************************************************************************************************
			var refTMatrixIdxKey = -1;
			var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
				
				if(lowestOctree.neoReferencesMotherAndIndices == undefined) continue;
				
				//refList = lowestOctree.neoRefsList_Array[0];
				//if(refList == undefined)
				//	continue;
				
				
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				//if(neoBuilding.buildingType == "MOP")
				//	continue;
				
				if(this.renderingModeTemp == 0)
				{
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					refTMatrixIdxKey = -1;
				}
				else{
					if(neoBuilding.geoLocationDataAux)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						
						// check if the references of the lowestOctree has the geoLocationDataAux tMatrix.***
						if(lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0))
						{
							if( !lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0).hasKeyMatrix(0))
							lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
						}
						refTMatrixIdxKey = 0;
					}
					else{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						refTMatrixIdxKey = -1;
					}
				}

				if(i == 0)
					minSize = 0.0;
				else minSize = 0.0;
				//minSize = lowestOctree.squareDistToEye/10000;
				this.renderer.renderNeoRefListsAsimetricVersion(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
			}
			
			// 2) LOD 1.*********************************************************************************************************************
			// 2) LOD 1.*********************************************************************************************************************
			// 2) LOD 1.*********************************************************************************************************************
			lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
				
				if(lowestOctree.neoReferencesMotherAndIndices == undefined) continue;
				
				//refList = lowestOctree.neoRefsList_Array[0];
				//if(refList == undefined)
				//	continue;
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				
				if(this.renderingModeTemp == 0 && neoBuilding.buildingType == "outfitting")
					continue;
				
				if(this.renderingModeTemp == 0)
				{
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					refTMatrixIdxKey = -1;
				}
				else{
					if(neoBuilding.geoLocationDataAux)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						
						// check if the references of the lowestOctree has the geoLocationDataAux tMatrix.***
						if(lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0))
						{
							if( !lowestOctree.neoReferencesMotherAndIndices.getNeoReference(0).hasKeyMatrix(0))
							lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
						}
						refTMatrixIdxKey = 0;
					}
					else{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						refTMatrixIdxKey = -1;
					}
				}

				if(i == 0)
					minSize = 0.9;
				else minSize = 0.9;
				//minSize = lowestOctree.squareDistToEye/10000 + 1.0;
				this.renderer.renderNeoRefListsAsimetricVersion(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, renderTexture, ssao_idx, minSize, 1, refTMatrixIdxKey);
			}
			
			// 2) LOD 2 & 3.************************************************************************************************************************************
			// 2) LOD 2 & 3.************************************************************************************************************************************
			// 2) LOD 2 & 3.************************************************************************************************************************************
			currentShader = this.postFxShadersManager.pFx_shaders_array[8]; // lodBuilding ssao.***
			shaderProgram = currentShader.program;
			gl.useProgram(shaderProgram);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			gl.enableVertexAttribArray(currentShader.color4_loc);

			gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
			gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
			gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
			gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
			gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);

			gl.uniform1f(currentShader.near_loc, frustum._near);	
			//gl.uniform1f(currentShader.far_loc, frustum._far);	
			gl.uniform1f(currentShader.far_loc, current_frustum_far); 
			
			gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
			gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
			gl.uniform1i(currentShader.hasAditionalMov_loc, true);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
			
			gl.uniform1i(currentShader.depthTex_loc, 0);	
			gl.uniform1i(currentShader.noiseTex_loc, 1);	
			gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
			gl.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
			gl.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
			gl.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
			gl.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
		
			
			gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
			gl.uniform3fv(currentShader.kernel16_loc, this.kernel);	
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
			gl.activeTexture(gl.TEXTURE1);            
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture); 
			
			
			lowestOctreesCount = visibleObjControlerOctrees.currentVisibles2.length;
			for(var i=0; i<lowestOctreesCount; i++) {
				lowestOctree = visibleObjControlerOctrees.currentVisibles2[i];
				
				if(lowestOctree.legoDataArrayBuffer == undefined && lowestOctree.lego == undefined) continue;
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				if(neoBuilding == undefined)
					continue;
				
				if(neoBuilding.buildingType == "outfitting")
				//if(neoBuilding.buildingType == "MOP") // khj(20170331)
					continue;
				
				// if the building is highlighted, the use highlight oneColor4.*********************
				if(neoBuilding.isHighLighted)
				{
					gl.uniform1i(currentShader.bUse1Color_loc, true);
					gl.uniform4fv(currentShader.oneColor4_loc, this.highLightColor4); //.***
				}
				else
				{
					gl.uniform1i(currentShader.bUse1Color_loc, false);
				}
				//----------------------------------------------------------------------------------
				
				if(this.renderingModeTemp == 0)
				{
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
				}
				else{
					if(neoBuilding.geoLocationDataAux)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
					}
					else{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					}
				}
				//gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
				//gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
				//gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);

				if(lowestOctree.lego == undefined) {
					continue;
				}
				
				this.renderer.renderLodBuilding(gl, lowestOctree.lego, this, currentShader, ssao_idx, neoBuilding.isHighLighted);
				
			}
			
			// 3) now render bboxes.*******************************************************************************************************************
			// 3) now render bboxes.*******************************************************************************************************************
			// 3) now render bboxes.*******************************************************************************************************************
			if(this.magoPolicy.getShowBoundingBox())
			{
				currentShader = this.postFxShadersManager.pFx_shaders_array[12]; // box ssao.***
				shaderProgram = currentShader.program;
				gl.useProgram(shaderProgram);
				gl.enableVertexAttribArray(currentShader.position3_loc);
				gl.enableVertexAttribArray(currentShader.normal3_loc);
				gl.disableVertexAttribArray(currentShader.color4_loc);

				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
				gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);

				gl.uniform1f(currentShader.near_loc, frustum._near);	
				//gl.uniform1f(currentShader.far_loc, frustum._far);	
				gl.uniform1f(currentShader.far_loc, current_frustum_far); 
				
				gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
				gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
				gl.uniform1i(currentShader.hasAditionalMov_loc, true);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***	
				gl.uniform1i(currentShader.bScale_loc, true);
				
				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.0, 1.0, 1.0]); //.***
				
				gl.uniform1i(currentShader.depthTex_loc, 0);	
				gl.uniform1i(currentShader.noiseTex_loc, 1);	
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
				gl.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
				gl.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
				gl.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
				gl.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
			
				
				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);	
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);	
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***		
				gl.activeTexture(gl.TEXTURE1);            
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture); 
				
				
				var visibleBuildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
				//if(visibleBuildingsCount > 0)
				//	visibleBuildingsCount = 10;
				
				for(var b=0; b<visibleBuildingsCount; b++)
				{
					neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[b];
					if(neoBuilding.buildingId == "testId_F110T")
					{
						var hola = 0;
					}
					gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***
					
					if(this.renderingModeTemp == 0)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					}
					else{
						if(neoBuilding.geoLocationDataAux)
						{
							gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
							gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
							gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						}
						else{
							gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
							gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
							gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						}
					}
					this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
					gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
					this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, neoBuilding.isHighLighted);
				}
				
				visibleBuildingsCount = this.visibleObjControlerBuildings.currentVisibles2.length;
				//if(visibleBuildingsCount > 0)
				//	visibleBuildingsCount = 10;
				
				for(var b=0; b<visibleBuildingsCount; b++)
				{
					neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[b];
					if(neoBuilding.buildingId == "testId_F110T")
					{
						var hola = 0;
					}
					gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***
					
					if(this.renderingModeTemp == 0)
					{
						gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
						gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
						gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
					}
					else{
						if(neoBuilding.geoLocationDataAux)
						{
							gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.geoLocationDataAux.rotMatrix._floatArrays);
							gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.geoLocationDataAux.positionHIGH);
							gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.geoLocationDataAux.positionLOW);
						}
						else{
							gl.uniformMatrix4fv(currentShader.buildingRotMatrix, false, neoBuilding.move_matrix);
							gl.uniform3fv(currentShader.buildingPosHIGH_loc, neoBuilding.buildingPositionHIGH);
							gl.uniform3fv(currentShader.buildingPosLOW_loc, neoBuilding.buildingPositionLOW);
						}
					}
					this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
					gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
					this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, neoBuilding.isHighLighted);
				}
			}
		}
		
		if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
		if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
		if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
		if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
	}
	
};



/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param cameraPosition 카메라 입장에서 화면에 그리기 전에 객체를 그릴 필요가 있는지 유무를 판단하는 값
 * @param scene 변수
 * @param shader 변수
 * @param renderTexture 변수
 * @param ssao_idx 변수
 * @param neoRefLists_array 변수
 */
CesiumManager.prototype.renderLodBuilding = function(gl, cameraPosition, scene, shader, renderTexture, ssao_idx, lodBuilding) {
	// file loaded but not parsed.***
	if(lodBuilding.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
		lodBuilding.parseArrayBuffer(gl, this.readerWriter);
	}
	
	this.renderer.renderLodBuilding(gl, lodBuilding, this, shader, ssao_idx);
	/*
	// picking mode.***********************************************************************************
	if(ssao_idx == -1) {
		// picking mode.***
		this.selectionCandidateObjectsArray.length = 0; // init.***
		
		// set byteColor codes for references objects.***
		var red = 0, green = 0, blue = 0, alfa = 255;
		
		// 1) Exterior objects.***
		var neoRefListsArray = neoRefLists_array;
		//var neoRefListsArray = this.detailed_neoBuilding._neoRefLists_Container.neoRefsLists_Array;
		var neoRefLists_count = neoRefListsArray.length;
		for(var i = 0; i<neoRefLists_count; i++) {
			var neoRefList = neoRefListsArray[i];
			var neoRefs_count = neoRefList.neoRefs_Array.length;
			for(var j=0; j<neoRefs_count; j++) {
				var neoRef = neoRefList.neoRefs_Array[j];
				if(neoRef.selColor4 == undefined) neoRef.selColor4 = new Color();
				
				neoRef.selColor4.set(red, green, blue, alfa);
				this.selectionCandidateObjectsArray.push(neoRef);
				blue++;
				if(blue >= 254) {
					blue = 0;
					green++;
					if(green >= 254) {
						red++;
					}
				}
			}
		}
	}
	
	if(ssao_idx == -1) {
		var isInterior = false; // no used.***

		this.renderer.renderNeoRefListsColorSelection(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	} else {
		var isInterior = false; // no used.***
		this.renderer.renderNeoRefLists(gl, neoRefLists_array, this.detailed_neoBuilding, this, isInterior, shader, renderTexture, ssao_idx);
	}
	*/
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param BR_Project 변수
 */
CesiumManager.prototype.createFirstTimeVBOCacheKeys = function(gl, BR_Project) {
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
	var vt_cacheKey = simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0];
	
	// interleaved vertices_texCoords.***
	vt_cacheKey._verticesArray_cacheKey = gl.createBuffer ();
	gl.bindBuffer(gl.ARRAY_BUFFER, vt_cacheKey._verticesArray_cacheKey);
	gl.bufferData(gl.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer, gl.STATIC_DRAW);
	simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer = null;
	
	// normals.***
	if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer != undefined) {
		vt_cacheKey._normalsArray_cacheKey = gl.createBuffer ();
		gl.bindBuffer(gl.ARRAY_BUFFER, vt_cacheKey._normalsArray_cacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer, gl.STATIC_DRAW);
		simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer = null;
	}

	// Simple building texture(create 1pixel X 1pixel bitmap).****************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/Webgl_API/Tutorial/Using_textures_in_Webgl
	if(simpBuildingV1._simpleBuildingTexture == undefined) simpBuildingV1._simpleBuildingTexture = gl.createTexture();
	
	// Test wait for texture to load.********************************************
	//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
	gl.bindTexture(gl.TEXTURE_2D, simpBuildingV1._simpleBuildingTexture);
	//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
	//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([240, 240, 240, 255])); // red
	gl.bindTexture(gl.TEXTURE_2D, null);
	BR_Project._f4d_nailImage_readed_finished = true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param scene 변수
 */
CesiumManager.prototype.reCalculateModelViewProjectionRelToEyeMatrix = function(scene) {
	for(var i=0; i<16; i++) {
		if(scene.context._us._modelView[i] == 0) return;
	}
	
	var modelViewRelToEye = new Cesium.Matrix4();
	modelViewRelToEye = Cesium.Matrix4.clone(scene.context._us._modelView);
	modelViewRelToEye[12] = 0.0;
	modelViewRelToEye[13] = 0.0;
	modelViewRelToEye[14] = 0.0;
	var modelViewProjectionRelToEye = new Cesium.Matrix4();
	Cesium.Matrix4.multiply(scene.context._us._projection, modelViewRelToEye, modelViewProjectionRelToEye);
	Cesium.Matrix4.toArray(modelViewProjectionRelToEye, this.modelViewProjRelToEye_matrix); 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.renderTerranTileServiceFormatPostFxShader = function(scene, isLastFrustum) {
	if(!isLastFrustum) return;
	if(this.isCameraInsideNeoBuilding) return;
	
	var gl = scene.context._gl;
	var cameraPosition = scene.context._us._cameraPosition;
	var cullingVolume = scene._frameState.cullingVolume;
//	var modelViewProjectionRelativeToEye = scene.context._us._modelViewProjectionRelativeToEye;
	
	gl.disable(gl.CULL_FACE);
	
	// Check if camera was moved considerably for update the renderables objects.***
	if(this.detailed_building) {
		this.squareDistUmbral = 4.5*4.5;
	} else {
		this.squareDistUmbral = 50*50;
	}
	this.isCameraMoved(cameraPosition, this.squareDistUmbral);
	
	if(this.depthFbo == undefined)this.depthFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	if(this.ssaoFbo == undefined)this.ssaoFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight); // no used.***
	
	// Another check for depthBuffer.***
	if(this.depthFbo.width != scene.drawingBufferWidth || this.depthFbo.height != scene.drawingBufferHeight) {
		this.depthFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}

	//if(cameraMoved && !this.isCameraMoving)
	if(!this.isCameraMoving) {
		this.currentVisibleBuildings_array.length = 0; // Init.***
		this.currentVisibleBuildings_LOD0_array.length = 0; // Init.***
		this.detailed_building;
	
		//this.doFrustumCulling(cullingVolume, this.currentVisibleBuildings_array, cameraPosition); // delete this.***
		this.doFrustumCullingTerranTileServiceFormat(gl, cullingVolume, this.currentVisibleBuildings_array, cameraPosition); 
	}
	
	// Calculate "modelViewProjectionRelativeToEye".*********************************************************
	this.reCalculateModelViewProjectionRelToEyeMatrix(scene);

	//Cesium.Matrix4.toArray(_modelViewProjectionRelativeToEye, this.modelViewProjRelToEye_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._modelViewRelativeToEye, this.modelViewRelToEye_matrix); // Original.*** 
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	//End Calculate "modelViewProjectionRelativeToEye".------------------------------------------------------

	// Calculate encodedCamPosMC high and low values.********************************************************
	this.calculateEncodedCameraPositionMCHighLow(this.encodedCamPosMC_High, this.encodedCamPosMC_Low, cameraPosition);

	// *************************************************************************************************************************************************
	// Now, render the detailed building if exist.******************************************************************************************************
	// This is OLD.************************************
	var currentShader;
	if(this.detailed_building && isLastFrustum) {
		currentShader = this.shadersManager.getMagoShader(0);
		//this.render_DetailedBuilding(gl, cameraPosition, _modelViewProjectionRelativeToEye, scene, currentShader);
	}
	// End render the detailed building if exist.---------------------------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------------------------------------------------------------------
	// Save the cesium framebuffer.***
//	var cesium_frameBuffer = scene._context._currentFramebuffer._framebuffer;
	//var cesium_frameBuffer = scene._context._currentFramebuffer;
	
	// Now, render the simple visible buildings.***************************************************************************
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); 
	gl.depthRange(0, 1);
	  
	var shaderProgram;
	
	// Calculate the normal_matrix.***
	//https://developer.mozilla.org/en-US/docs/Web/API/Webgl_API/Tutorial/Lighting_in_Webgl
	// this code must be executed if the camera was moved.***
	this.isCameraMoved(cameraPosition, 10);
	//if(cameraLittleMoved)
//	{
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
//	}
	
	Cesium.Matrix3.toArray(this.normalMat3, this.normalMat3_array); 
	Cesium.Matrix4.toArray(this.normalMat4, this.normalMat4_array); 
	//gl.uniformMatrix3fv(currentShader._NormalMatrix, false, this.normalMat3_array);
	
	this.render_time = 0;
	if(this.isCameraMoving) {
		this.dateSC = new Date();
		this.currentTimeSC;
		this.startTimeSC = this.dateSC.getTime();
	}
	
	this.currentVisibleBuildingsPost_array.length = 0;
	
	var filePath_scratch = "";
	var camera = scene._camera;
	var frustum = camera.frustum;
//	var current_frustum_near = scene._context._us._currentFrustum.x;
	var current_frustum_far = scene._context._us._currentFrustum.y;
	current_frustum_far = 5000.0;
	
	// Depth render.********************************************************
	// Depth render.********************************************************
	// Depth render.********************************************************
	this.depthFbo.bind(); // DEPTH START.**************************************************************************************************************************************************
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, this.depthFbo.width, this.depthFbo.height);  
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[0];
	
	shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	//gl.enableVertexAttribArray(currentShader.texCoord2_loc); // no use texcoords.***
	gl.enableVertexAttribArray(currentShader.position3_loc);
	gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.modelViewRelToEye_matrix); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	
	gl.uniform1f(currentShader.near_loc, frustum._near);	
	//gl.uniform1f(currentShader.far_loc, frustum._far);	// Original (bad)..***
	gl.uniform1f(currentShader.far_loc, current_frustum_far); // test (best)..***	
	
	gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
	
	//gl.uniform1i(currentShader.useRefTransfMatrix_loc, false, false);
	
	// LOD0 BUILDINGS.***************************************************************************************************************

	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
	for(var i=0; i<LOD0_projectsCount; i++) {
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
		
		//if(!this.isCameraMoving)
//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if(BR_Project._header._f4d_version == 2) {
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null) {
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			} else if(!BR_Project._f4d_nailImage_readed) {
				if(this.backGround_imageReadings_count < 100) {
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;
					
					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			} else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists) {
				if(!this.isCameraMoving && this.backGround_fileReadings_count < 1) {
					//filePath_scratch = this.readerWriter.geometryDataPath +"/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
					filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";
					
					this.readerWriter.readNailImage(gl, filePath_scratch, BR_Project, this.readerWriter, this, 0); 
					this.backGround_fileReadings_count ++;
					
				}
				//continue;
			}
		} else {
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}
//		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if(BR_Project._simpleBuilding_v1) {
			//renderSimpleBuildingV1PostFxShader
			this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, -1, currentShader); // 3 = lod3.***
			/*
			if(BR_Project._f4d_lod0Image_exists)
			{
				if(BR_Project._f4d_lod0Image_readed_finished)
					this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, -1, currentShader); // 0 = lod0.***

				else if(BR_Project._f4d_nailImage_readed_finished)
				{
					this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, -1, currentShader); // 3 = lod3.***
				}
			}
			else if(BR_Project._f4d_nailImage_readed_finished)
			{
				this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, -1, currentShader); // 3 = lod3.***
			}
			*/
		}
	}
	
	var projects_count = this.currentVisibleBuildings_array.length;
	for(var p_counter = 0; p_counter<projects_count; p_counter++) {
		var BR_Project = this.currentVisibleBuildings_array[p_counter];
		
		//if(!this.isCameraMoving)
//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if(BR_Project._header._f4d_version == 2) {
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null) {
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			} else if(!BR_Project._f4d_nailImage_readed) {
				if(this.backGround_imageReadings_count < 100) {
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;
					
					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			}
		} else {
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}
//		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished) {
			this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, -1, currentShader); // 3 = lod3.***
		}
	}
	//gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
	gl.disableVertexAttribArray(currentShader.normal3_loc);
	this.depthFbo.unbind(); // DEPTH END.*****************************************************************************************************************************************************************
	
	// Now, ssao.************************************************************
	scene._context._currentFramebuffer._bind();
	
	if(this.depthFbo.width != scene.drawingBufferWidth || this.depthFbo.height != scene.drawingBufferHeight) {
		this.depthFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}
	
	//this.ssaoFbo.bind();// SSAO START.********************************************************************************************************************************************************************
	gl.clearColor(0, 0, 0, 1);
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
		
	if(this.noiseTexture == undefined) this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels);
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[1];
	
	shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.modelViewProjRelToEye_matrix);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.encodedCamPosMC_High);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.encodedCamPosMC_Low);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix); // original.***

	gl.uniform1f(currentShader.near_loc, frustum._near);	
	//gl.uniform1f(currentShader.far_loc, frustum._far); // Original.***
	gl.uniform1f(currentShader.far_loc, current_frustum_far); // test.***	
	
	gl.uniformMatrix3fv(currentShader.normalMatrix3_loc, false, this.normalMat3_array);
	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.normalMat4_array);
		
	gl.uniform1i(currentShader.depthTex_loc, 0);	
	gl.uniform1i(currentShader.noiseTex_loc, 1);	
	gl.uniform1i(currentShader.diffuseTex_loc, 2);
	gl.uniform1f(currentShader.fov_loc, frustum._fovy);	// "frustum._fov" is in radians.***
	gl.uniform1f(currentShader.aspectRatio_loc, frustum._aspectRatio);	
	gl.uniform1f(currentShader.screenWidth_loc, scene.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
	gl.uniform1f(currentShader.screenHeight_loc, scene.drawingBufferHeight);
	gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFbo.width/this.noiseTexture.width, this.depthFbo.height/this.noiseTexture.height]);	
	gl.uniform3fv(currentShader.kernel16_loc, this.kernel);	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.depthFbo.colorBuffer);  // original.***		
	gl.activeTexture(gl.TEXTURE1);            
	gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture); 
	
	// LOD0 BUILDINGS.***************************************************************************************************************
	// Now, render LOD0 texture buildings.***
	var LOD0_projectsCount = this.currentVisibleBuildings_LOD0_array.length;
	for(var i=0; i<LOD0_projectsCount; i++) {
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];
		
		//if(!this.isCameraMoving)
//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if(BR_Project._header._f4d_version == 2) {
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null) {
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			} else if(!BR_Project._f4d_nailImage_readed) {
				if(this.backGround_imageReadings_count < 100) {
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;
					
					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			} else if(!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists) {
				if(!this.isCameraMoving && this.backGround_fileReadings_count < 1) {
					//filePath_scratch = this.readerWriter.geometryDataPath +"/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
					filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";
					
					this.readerWriter.readNailImage(gl, filePath_scratch, BR_Project, this.readerWriter, this, 0); 
					this.backGround_fileReadings_count ++;
				}
				//continue;
			}
		} else {
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}

//		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if(BR_Project._simpleBuilding_v1) {
			//renderSimpleBuildingV1PostFxShader
			if(BR_Project._f4d_lod0Image_exists) {
				if(BR_Project._f4d_lod0Image_readed_finished) this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 0, currentShader); // 0 = lod0.***
				else if(BR_Project._f4d_nailImage_readed_finished) {
					this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 3, currentShader); // 3 = lod3.***
				}
			} else if(BR_Project._f4d_nailImage_readed_finished) {
				this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 3, currentShader); // 3 = lod3.***
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
				gl.disableVertexAttribArray(shader._texcoord);
				gl.disableVertexAttribArray(shader._position);
				return;
			}
		}
		*/
		
		var BR_Project = this.currentVisibleBuildings_array[p_counter];
		
		//if(!this.isCameraMoving)
//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if(BR_Project._header._f4d_version == 2) {
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if(simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey == null) {
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			} else if(!BR_Project._f4d_nailImage_readed) {
				if(this.backGround_imageReadings_count < 100) {
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;
					
					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			}
		} else {
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}
		
//		}
		
		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished) {
			this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 3, currentShader); // 3 = lod3.***
		}
		/*
		if(this.isCameraMoving)
		{
			this.dateSC = new Date();
			this.currentTimeSC = this.dateSC.getTime();
			if(this.currentTimeSC-this.startTimeSC > this.maxMilisecondsForRender)
			{
				gl.disableVertexAttribArray(shader._texcoord);
				gl.disableVertexAttribArray(shader._position);
				return;
			}
		}
		*/
	}
		
	gl.activeTexture(gl.TEXTURE0);  
	//this.ssaoFbo.unbind();
		
	gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
	gl.disableVertexAttribArray(currentShader.normal3_loc);	
	//this.ssaoFbo.unbind();// SSAO END.********************************************************************************************************************************************************************

	// Now, blur.************************************************************
	/*
	scene._context._currentFramebuffer._bind();
	
	Cesium.Matrix4.toArray(scene._context._us._modelView, this.modelView_matrix); 
	Cesium.Matrix4.toArray(scene._context._us._projection, this.projection_matrix); 
	
	currentShader = this.postFxShadersManager.pFx_shaders_array[2]; // blur.***
	
	shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	
	gl.enableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);
	
	this.modelView_matrix[12] = 0.0;
	this.modelView_matrix[13] = 0.0;
	this.modelView_matrix[14] = 0.0;
	
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.projection_matrix);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.modelView_matrix);
	
	gl.uniform1i(currentShader.colorTex_loc, 0);	
	gl.uniform2fv(currentShader.texelSize_loc, [1/this.ssaoFbo.width, 1/this.ssaoFbo.height]);	
	gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, this.ssaoFbo.colorBuffer); // original.*** 
	gl.bindTexture(gl.TEXTURE_2D, scene._context._currentFramebuffer.colorBuffer);
	//scene._context._currentFramebuffer._bind();	
	this.ssaoFSQuad.draw(currentShader, gl); 
	gl.activeTexture(gl.TEXTURE0);
		
	gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);	
	*/
	// END BLUR.**************************************************************************************************************************************************************************************************************
	
	gl.viewport(0, 0, scene._canvas.width, scene._canvas.height);
	
	scene._context._currentFramebuffer._bind();
	//this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, cesium_frameBuffer);
	// Render the lasts simpleBuildings.***
	
	var last_simpBuilds_count = this.currentVisibleBuildingsPost_array.length;
	
	for(var i=0; i<last_simpBuilds_count; i++) {
		this.renderer.render_F4D_simpleBuilding(	gl, this.currentVisibleBuildingsPost_array[i], this.modelViewProjRelToEye_matrix, 
													this.encodedCamPosMC_High, this.encodedCamPosMC_Low, this.shadersManager);
	}
	
	//gl.useProgram(null);
	//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustumVolume 변수
 * @param neoVisibleBuildingsArray 변수
 * @param cameraPosition 변수
 * @returns neoVisibleBuildingsArray
 */
CesiumManager.prototype.deleteNeoBuilding = function(gl, neoBuilding) {
	// check if the neoBuilding id the selected building.***

	
	if(neoBuilding == this.buildingSelected)
	{
		this.buildingSelected = undefined;
		this.octreeSelected = undefined;
		this.objectSelected = undefined;
	}
	
	
	neoBuilding.metaData.fileLoadState = CODE.fileLoadState.READY;
	//neoBuilding.buildingPosition = undefined;
	//neoBuilding.buildingPositionHIGH = undefined;
	//neoBuilding.buildingPositionLOW = undefined;
	
	//neoBuilding.move_matrix = undefined; // PositionMatrix (only rotations).***
	//neoBuilding.move_matrix_inv = undefined; // Inverse of PositionMatrix.***
	//neoBuilding.buildingPosMat_inv = undefined; // f4d matrix4.***
	//neoBuilding.transfMat_inv = undefined; // cesium matrix4.***
	//neoBuilding.transfMat = undefined; // f4d matrix4.***
	//neoBuilding.transfMatInv = undefined; // f4d matrix4.***
	
	// create the default blocks_lists.*****************************
	if(neoBuilding._blocksList_Container && neoBuilding._blocksList_Container.blocksListsArray.length > 0) {
		neoBuilding._blocksList_Container.blocksListsArray[0].deleteGlObjects(gl);
		neoBuilding._blocksList_Container.blocksListsArray[0] = undefined;
		neoBuilding._blocksList_Container.blocksListsArray = undefined;
	}
	neoBuilding._blocksList_Container = undefined;
	//neoBuilding._blocksList_Container = new BlocksListsContainer();
	//neoBuilding._blocksList_Container.newBlocksList("Blocks1");
	////this._blocksList_Container.newBlocksList("Blocks2");
	////this._blocksList_Container.newBlocksList("Blocks3");
	////this._blocksList_Container.newBlocksList("BlocksBone");
	////this._blocksList_Container.newBlocksList("Blocks4");
	//--------------------------------------------------------------
	
	// create the references lists.*********************************
	//neoBuilding._neoRefLists_Container = new NeoReferencesListsContainer(); // in asimetric version there are no references in exterior.***
	//neoBuilding.currentRenderablesNeoRefLists = [];
	//neoBuilding.preExtractedLowestOctreesArray = [];
	//neoBuilding.motherNeoReferencesArray = [];
	var blocksCount = neoBuilding.motherBlocksArray.length;
	for(var i=0; i<blocksCount; i++)
	{
		if(neoBuilding.motherBlocksArray[i])
			neoBuilding.motherBlocksArray[i].deleteObjects(gl);
		neoBuilding.motherBlocksArray[i] = undefined;
	}
	neoBuilding.motherBlocksArray = [];
	
	var referencesCount = neoBuilding.motherNeoReferencesArray.length;
	for(var i=0; i<referencesCount; i++)
	{
		if(neoBuilding.motherNeoReferencesArray[i])
			neoBuilding.motherNeoReferencesArray[i].deleteGlObjects(gl);
		neoBuilding.motherNeoReferencesArray[i] = undefined;
	}
	neoBuilding.motherNeoReferencesArray = [];
	
	// Textures loaded.***************************************************
	//neoBuilding.textures_loaded = [];
	
	// The octree.********************************************************
	if(neoBuilding.octree != undefined) 
		neoBuilding.octree.deleteGlObjects(gl);
	neoBuilding.octree = undefined; // f4d_octree. Interior objects.***
	neoBuilding.octreeLoadedAllFiles = false;
	
	//neoBuilding.buildingFileName = "";
	
	neoBuilding.allFilesLoaded = false;
	neoBuilding.isReadyToRender = false;
	
	// The simple building.***********************************************
	neoBuilding.neoSimpleBuilding = undefined; // this is a simpleBuilding for Buildings with texture.***
	
	// The lodBuildings.***
	neoBuilding.lod2Building = undefined;
	neoBuilding.lod3Building = undefined;
	
	
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * @param frustumVolume 변수
 * @param neoVisibleBuildingsArray 변수
 * @param cameraPosition 변수
 * @returns neoVisibleBuildingsArray
 */
CesiumManager.prototype.doFrustumCullingNeoBuildings = function(frustumVolume, neoVisibleBuildingsArray, cameraPosition) {
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	
	// Init the visible buildings array.***
	neoVisibleBuildingsArray.length = 0;
	
	//this.min_squaredDist_to_see_detailed = 40000; // 200m.***
	//this.min_squaredDist_to_see_LOD0 = 250000; // 600m.***
	//this.min_squaredDist_to_see = 10000000;
	//this.min_squaredDist_to_see_smallBuildings = 700000;
	
	//this.min_squaredDist_to_see_detailed = 1000000; // Test for xxxx.***
	
	var squaredDistToCamera;
//	var last_squared_dist;
	this.detailed_neoBuilding;
	
//	var octreesLoadRequestsCount = 0;
	
	//var lod0_minSquaredDist = 100000*10000;
	//var lod1_minSquaredDist = 100000*2;
	//var lod2_minSquaredDist = 100000*6;
	//var lod3_minSquaredDist = 100000*9;
	
	var lod0_minSquaredDist = 10000;
	var lod1_minSquaredDist = 1;
	var lod2_minSquaredDist = 100000*10000;
	var lod3_minSquaredDist = 100000*9;
	
	this.visibleObjControlerBuildings.currentVisibles0.length = 0;
	this.visibleObjControlerBuildings.currentVisibles1.length = 0;
	this.visibleObjControlerBuildings.currentVisibles2.length = 0;
	this.visibleObjControlerBuildings.currentVisibles3.length = 0;
	
	this.visibleObjControlerBuildings.initArrays(); 
	var heading = 0.0;
	var pitch = 0.0;
	var roll = 0.0;
	
	var maxNumberOfCalculatingPositions = 4000;
	var currentCalculatingPositionsCount = 0;
	var neoBuildings_count = this.neoBuildingsList.neoBuildings_Array.length;
	for(var i=0; i<neoBuildings_count; i++) {
		//if(this.neoBuildingsList.neoBuildings_Array[i].frustumCulled)
		//	continue;

		var neoBuilding = this.neoBuildingsList.neoBuildings_Array[i];
		
		if(this.renderingModeTemp == 0 || this.renderingModeTemp == 1)
		{
			if(neoBuilding.isDemoBlock)
				continue;
		}
		
		if(this.renderingModeTemp == 2)
		{
			if(neoBuilding.isDemoBlock == false)
				continue;
		}
		
		if(!this.magoPolicy.getShowOutFitting())
		{
			if(neoBuilding.buildingType == "outfitting")
			{
				continue;
			}
		}
		
		// 1) check if there are cartesian position.***
		if(neoBuilding.buildingPosition == undefined) {
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
					//altitude = -580.0;
					
					if(longitude != undefined && latitude != undefined && altitude != undefined ) 
					{
						if(neoBuilding.buildingId == "F140T")
						{
							var hola = 0;
						}
						var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude-500.0); 
						//var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude); 
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
					
					if(neoBuilding.move_matrix == undefined) {
						ManagerUtils.calculateBuildingPositionMatrix(neoBuilding);
						currentCalculatingPositionsCount += 1;
					}
				}
			}
			// Test for 1500 blocks.***
			this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);// Test for 1500 blocks.***
			continue; 
		}
		if(neoBuilding.bbox == undefined)
		{
			// Test for 1500 blocks.***
			this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
			continue;
		}
		this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
		var realBuildingPos = undefined; // necesary init to undefined.***
		if(this.renderingModeTemp == 0)
		{
			realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
		}
		
		// calculate realPosition of the building.****************************************************************************
		if(this.renderingModeTemp == 1 || this.renderingModeTemp == 2) // 0 = assembled mode. 1 = dispersed mode.***
		{
			if(neoBuilding.geoLocationDataAux == undefined) 
			{
				// 1rst, we must know the buildingType.***
				var structureTypedBuilding;
				if(neoBuilding.buildingType == "outfitting")
				{
					structureTypedBuilding = this.neoBuildingsList.getNeoBuildingByTypeId("structure", neoBuilding.buildingId);
				}
				else
					structureTypedBuilding = neoBuilding;
				
				if(structureTypedBuilding == undefined)
				{
					continue;
				}
				
				if(structureTypedBuilding.bbox == undefined)
					continue;
				
				if(neoBuilding.buildingId == "testId_P320T")
				{
					var hola = 0;
				}
				
				
				// now calculate traslation vector.***
				this.pointSC_2 = structureTypedBuilding.bbox.getCenterPoint3d(this.pointSC_2);
				this.pointSC_2.x = -this.pointSC_2.x;
				this.pointSC_2.y = -this.pointSC_2.y;
				this.pointSC_2.z = -this.pointSC_2.z;
				
				var realTimeLocBlocksList;
				
				if(this.renderingModeTemp == 1)
					realTimeLocBlocksList = MagoConfig.getInformation().blockConfig.blocks;
				else if(this.renderingModeTemp == 2)
					realTimeLocBlocksList = MagoConfig.getInformation().demoBlockConfig.blocks;
				
				var newLocation = realTimeLocBlocksList[neoBuilding.buildingId];
				// must calculate the realBuildingPosition (bbox_center_position).***
				
				if(newLocation) {
					var longitude;
					var latitude;
					var elevation;
					
					if(structureTypedBuilding.geoLocationDataAux)
					{
						longitude = structureTypedBuilding.geoLocationDataAux.longitude;
						latitude = structureTypedBuilding.geoLocationDataAux.latitude;
						elevation = structureTypedBuilding.geoLocationDataAux.elevation;
					}
					else
					{
						longitude = newLocation.LONGITUDE;
						latitude = newLocation.LATITUDE;
						elevation = newLocation.ELEVATION;
					}

					//neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, structureTypedBuilding.geoLocationDataAux);
					neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, neoBuilding.geoLocationDataAux);

					this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);

					var traslationVector;
					realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
					traslationVector = neoBuilding.geoLocationDataAux.tMatrix.rotatePoint3D(this.pointSC_2, traslationVector );
					neoBuilding.geoLocationDataAux.position.x += traslationVector.x;
					neoBuilding.geoLocationDataAux.position.y += traslationVector.y;
					neoBuilding.geoLocationDataAux.position.z += traslationVector.z;
					//neoBuilding.geoLocationDataAux.positionHIGH;
					neoBuilding.geoLocationDataAux.aditionalTraslation = traslationVector;
					neoBuilding.geoLocationDataAux.positionLOW[0] += traslationVector.x;
					neoBuilding.geoLocationDataAux.positionLOW[1] += traslationVector.y;
					neoBuilding.geoLocationDataAux.positionLOW[2] += traslationVector.z;
					
					realBuildingPos.x += traslationVector.x;
					realBuildingPos.y += traslationVector.y;
					realBuildingPos.z += traslationVector.z;
					
					if(neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos == undefined)
						neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos = new Point3D();
					
					neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos.x = realBuildingPos.x;
					neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos.y = realBuildingPos.y;
					neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos.z = realBuildingPos.z;
					
				} 
				else 
				{
					// use the normal data.***
					this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
					realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
				}
			} 
			else 
			{
				realBuildingPos = neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos;
			}
		} 
		else 
		{
			this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
			realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
		}
		// end calculating realPosition of the building.------------------------------------------------------------------------
		
		if(realBuildingPos == undefined) 
			continue;
		
		
		//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, neoBuilding.buildingPosition); // original.****
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, realBuildingPos);
		//if(squaredDistToCamera > this.min_squaredDist_to_see) 
		if(squaredDistToCamera > this.magoPolicy.getFrustumFarSquaredDistance()) 
		{
			this.deleteNeoBuilding(this.scene._context._gl, neoBuilding);
			continue;
		}
		
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
		if(this.renderingModeTemp == 0)
			this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
		else if(this.renderingModeTemp == 1)
			this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 5.2/2.0;
		else if(this.renderingModeTemp == 2)
			this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
		//if(neoBuilding.metaData) {
		//	this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX)/2.0;
		//} else this.radiusAprox_aux = 50.0;
		
		if(this.radiusAprox_aux) {
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		} else {
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}
		
		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull != Cesium.Intersect.OUTSIDE) {
			// min dist to see detailed.***
			if(squaredDistToCamera < lod0_minSquaredDist) {
				this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
			} else if(squaredDistToCamera < lod1_minSquaredDist) {
				this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
			} else if(squaredDistToCamera < lod2_minSquaredDist) {
				this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
			} else if(squaredDistToCamera < lod3_minSquaredDist) {
				this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
			}
			//neoBuilding.frustumCulled = true;
		} 
		else 
		{
			//neoBuilding.frustumCulled = true;
			if(this.renderingModeTemp == 0) {
				this.deleteNeoBuilding(this.scene._context._gl, neoBuilding);
			} else {
//				if(this.frustumIdx == 0) {
//					//this.deleteNeoBuilding(gl, neoBuilding);
//				}
			}
		}
	}

	return neoVisibleBuildingsArray;
};

/**
 * blockId를 이용해서 block 검색
 * @param buildingType 0 struts, 1 outfitting
 * @param buildingId blockId
 */
CesiumManager.prototype.flyToBuilding = function(buildingType, buildingId) {
	var neoBuilding = this.getNeoBuildingById(buildingType, buildingId);
	
	if(neoBuilding == undefined)
		return;
	
	// calculate realPosition of the building.****************************************************************************
	var realBuildingPos;
	if(this.renderingModeTemp == 1 || this.renderingModeTemp == 2) // 0 = assembled mode. 1 = dispersed mode.***
	{
		if(neoBuilding.geoLocationDataAux == undefined) {
			var realTimeLocBlocksList = MagoConfig.getInformation().blockConfig.blocks;
			var newLocation = realTimeLocBlocksList[neoBuilding.buildingId];
			// must calculate the realBuildingPosition (bbox_center_position).***
			
			if(newLocation) {
				neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(newLocation.LONGITUDE, newLocation.LATITUDE, newLocation.ELEVATION, heading, pitch, roll, neoBuilding.geoLocationDataAux);
				this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
				//realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
				realBuildingPos = neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos;
			} else {
				// use the normal data.***
				this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
				realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
			}
		} else {
			this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
			//realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
			realBuildingPos = neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos;
		}
	} else {
		this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
		realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
	}
	// end calculating realPosition of the building.------------------------------------------------------------------------

	if(realBuildingPos == undefined)
		return;
	
	this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
	if(this.renderingModeTemp == 0)
		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
	if(this.renderingModeTemp == 1)
		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
	if(this.renderingModeTemp == 2)
		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
	
	this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
	
	//var position = new Cesium.Cartesian3(this.pointSC.x, this.pointSC.y, this.pointSC.z);
	//var cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	
	var viewer = this.scene.viewer;
	var seconds = 3;
	this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, seconds);
}

/**
 * 어떤 일을 하고 있습니까?
 */
CesiumManager.prototype.getNeoBuildingById = function(buildingType, buildingId) {
	var buildingCount = this.neoBuildingsList.neoBuildings_Array.length;
	var find = false;
	var i=0; 
	var resultNeoBuilding;
	while(!find && i<buildingCount) {
		if(this.neoBuildingsList.neoBuildings_Array[i].buildingId == buildingId && this.neoBuildingsList.neoBuildings_Array[i].buildingType == buildingType) {
			find = true;
			resultNeoBuilding = this.neoBuildingsList.neoBuildings_Array[i];
		}
		i++;
	}
	
	return resultNeoBuilding;
}

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param frustumVolume 변수
 * @param visibleBuildings_array 변수
 * @param cameraPosition 변수
 * @returns visibleBuildings_array
 */
CesiumManager.prototype.doFrustumCullingTerranTileServiceFormat = function(gl, frustumVolume, visibleBuildings_array, cameraPosition) {
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
//	var squaredDistToCamera_candidate;
	var last_squared_dist;
	var buildings_count;
//	var nearestTile;
//	var nearestTile_candidate;
	
	this.filteredVisibleTiles_array.length = 0;
	this.detailedVisibleTiles_array.length = 0;
	this.LOD0VisibleTiles_array.length = 0;
	
	var BR_Project;
	
	var max_tileFilesReading = 10;
	
	this.currentVisible_terranTiles_array.length = 0;// Init.***
	this.terranTile.getIntersectedSmallestTiles(frustumVolume, this.currentVisible_terranTiles_array, this.boundingSphere_Aux);
	
	// Find the nearest tile to camera.***
	var visibleTiles_count = this.currentVisible_terranTiles_array.length;
	if(visibleTiles_count == 0) return;
	
	for(var i=0; i<visibleTiles_count; i++) {
		this.terranTileSC = this.currentVisible_terranTiles_array[i];
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, this.terranTileSC.position);
		
		if(squaredDistToCamera > this.min_squaredDist_to_see) continue;
		
		if(squaredDistToCamera < this.min_squaredDist_to_see_detailed * 1.2) {
			this.detailedVisibleTiles_array.push(this.terranTileSC);
		} else if(squaredDistToCamera <  this.min_squaredDist_to_see_LOD0 * 1.2) {
			this.LOD0VisibleTiles_array.push(this.terranTileSC);
		} else {
			this.filteredVisibleTiles_array.push(this.terranTileSC); // Original.***
			//this.LOD0VisibleTiles_array.push(this.terranTileSC); // Test.***
		}
	}
	
	// Make the visible buildings list.******************************************************************************
	this.boundingSphere_Aux.radius = 50.0;
	var need_frustumCulling = false;
	var filePath_scratch;
	var tileNumberNameString;
	
	var detailedVisibleTiles_count = this.detailedVisibleTiles_array.length;
	for(var i=0; i<detailedVisibleTiles_count; i++) {
		this.terranTileSC = this.detailedVisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started) {
			if(this.backGround_fileReadings_count < max_tileFilesReading) {
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";	
				this.readerWriter.getTileArrayBuffer(gl, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished) {
			//this.terranTileSC.parseFileOneBuilding(gl, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING) need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++) {
			BR_Project = this.detailedVisibleTiles_array[i]._BR_buildingsArray[j];
			if(BR_Project.buildingPosition == undefined) {
				this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				continue;
			}
			
			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
			if(squaredDistToCamera < this.min_squaredDist_to_see_detailed) {
				
				// Activate this in the future, when all f4d_projects unified.***
				if(BR_Project._compRefList_Container.compRefsListArray.length > 0) {
					if(BR_Project._header._f4d_version == 1) {
						if(last_squared_dist) {
							if(squaredDistToCamera < last_squared_dist) {
								last_squared_dist = squaredDistToCamera;
								this.currentVisibleBuildings_LOD0_array.push(this.detailed_building);
								this.detailed_building = BR_Project;
							} else {
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						} else {
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
				} else {
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
	
	var LOD0VisiblesTiles_count = this.LOD0VisibleTiles_array.length;
	for(var i=0; i<LOD0VisiblesTiles_count; i++) {
		this.terranTileSC = this.LOD0VisibleTiles_array[i];
		
		if(!this.terranTileSC.fileReading_started) {
			if(this.backGround_fileReadings_count < max_tileFilesReading) {
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";	
				this.readerWriter.getTileArrayBuffer(gl, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished) {
			//this.terranTileSC.parseFileOneBuilding(gl, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING) need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++) {
			BR_Project = this.LOD0VisibleTiles_array[i]._BR_buildingsArray[j];
			if(BR_Project.buildingPosition == undefined) {
				visibleBuildings_array.push(BR_Project);
				continue;
			}
			
			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
			if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0) {
				if(need_frustumCulling) {
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
				} else this.currentVisibleBuildings_LOD0_array.push(BR_Project);
			} else {
				if(need_frustumCulling) {
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
						visibleBuildings_array.push(BR_Project);
					}
				} else visibleBuildings_array.push(BR_Project);
			}
		}
	}
	
	var filteredVisibleTiles_count = this.filteredVisibleTiles_array.length;
	for(var i=0; i<filteredVisibleTiles_count; i++) {
		this.terranTileSC = this.filteredVisibleTiles_array[i];
		if(!this.terranTileSC.fileReading_started) {
			if(this.backGround_fileReadings_count < max_tileFilesReading) {
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";	
				this.readerWriter.getTileArrayBuffer(gl, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}
		
		if(this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished) {
			//this.terranTileSC.parseFileOneBuilding(gl, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}
		
		need_frustumCulling = false;
		if(this.terranTileSC.visibilityType == Cesium.Intersect.INTERSECTING) need_frustumCulling = true;
		
		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for(var j=0; j<buildings_count; j++) {
			BR_Project = this.filteredVisibleTiles_array[i]._BR_buildingsArray[j];
			if(BR_Project.buildingPosition == undefined) {
				visibleBuildings_array.push(BR_Project);
				continue;
			} else {
				squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
				if(BR_Project._header.isSmall) {
					if(squaredDistToCamera < this.min_squaredDist_to_see_smallBuildings) {
						if(need_frustumCulling) {
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
							visibleBuildings_array.push(BR_Project);
						} else visibleBuildings_array.push(BR_Project);
					}
				} else {
					// Provisionally check for LODzero distance.***
					if(squaredDistToCamera < this.min_squaredDist_to_see_LOD0) {
						if(need_frustumCulling) {
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE) {
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						} else this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					} else {
						if(need_frustumCulling) {
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if(frustumVolume.computeVisibility(this.boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
								visibleBuildings_array.push(BR_Project);
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
	
//	var min_squaredDist_to_see_detailed = 40000; // 200m.***
//	var min_squaredDist_to_see_LOD0 = 250000; // 600m.***
//	var min_squaredDist_to_see = 10000000;
//	var min_squaredDist_to_see_smallBuildings = 700000;
//	
//	var squaredDistToCamera;
//	var last_squared_dist;
	
	var clouds_count = this.atmosphere.cloudsManager.circularCloudsArray.length;
	for(var p_counter = 0; p_counter<clouds_count; p_counter++) {
		var cloud = this.atmosphere.cloudsManager.circularCloudsArray[p_counter];
		
		if(cloud.cullingPosition == undefined) {
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
		
		if(this.radiusAprox_aux) {
			this.boundingSphere_Aux.radius = this.radiusAprox_aux; 
		} else {
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}

		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if(frustumCull !== Cesium.Intersect.OUTSIDE) {
			this.currentVisibleClouds_array.push(cloud);
		}
	}
	
	return visibleBuildings_array;
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
CesiumManager.prototype.highLightBuildings = function()
{
	// 1rst, init highlightiedBuildings.***
	var buildingsCount = this.neoBuildingsList.neoBuildings_Array.length;
	for(var i=0; i<buildingsCount; i++)
	{
		this.neoBuildingsList.neoBuildings_Array[i].isHighLighted = false;
	}
	
	var buildingType = "structure";
	//var buildingType = "MSP"; khj(0331)
	var highLightingBuildingsCount = this.magoPolicy.highLightedBuildings.length;
	for(var i=0; i<highLightingBuildingsCount; i++)
	{
		var highLightedBuildingId = this.magoPolicy.highLightedBuildings[i];
		var highLightedBuilding = this.neoBuildingsList.getNeoBuildingByTypeId(buildingType, highLightedBuildingId);
		if(highLightedBuilding)
		{
			highLightedBuilding.isHighLighted = true;
		}
		//var hola = 0;
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
CesiumManager.prototype.renderModeChanged = function()
{
	if(this.renderModeTemp == 0)
	{
		
	}
	else if(this.renderModeTemp == 1)
	{
	
	}
	else if(this.renderModeTemp == 2)
	{
	
	}
	
}

/**
 * 변환 행렬
 */
CesiumManager.prototype.changeLocationAndRotation = function(projectIdAndBlockId, latitude, longitude, elevation, heading, pitch, roll) {
	var neoBuilding = this.getNeoBuildingById("structure", projectIdAndBlockId);
	
	if(neoBuilding == undefined)
		return;
	
	neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, neoBuilding.geoLocationDataAux);
	
	this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
	this.pointSC_2.x = -this.pointSC.x;
	this.pointSC_2.y = -this.pointSC.y;
	this.pointSC_2.z = -this.pointSC.z;

	var traslationVector;
	var realBuildingPos;
	realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
	traslationVector = neoBuilding.geoLocationDataAux.tMatrix.rotatePoint3D(this.pointSC_2, traslationVector );
	neoBuilding.geoLocationDataAux.position.x += traslationVector.x;
	neoBuilding.geoLocationDataAux.position.y += traslationVector.y;
	neoBuilding.geoLocationDataAux.position.z += traslationVector.z;
	//neoBuilding.geoLocationDataAux.positionHIGH;
	neoBuilding.geoLocationDataAux.aditionalTraslation = traslationVector;
	neoBuilding.geoLocationDataAux.positionLOW[0] += traslationVector.x;
	neoBuilding.geoLocationDataAux.positionLOW[1] += traslationVector.y;
	neoBuilding.geoLocationDataAux.positionLOW[2] += traslationVector.z;
	
	realBuildingPos.x += traslationVector.x;
	realBuildingPos.y += traslationVector.y;
	realBuildingPos.z += traslationVector.z;
	
	if(neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos == undefined)
		neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos = new Point3D();
	
	neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos.x = realBuildingPos.x;
	neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos.y = realBuildingPos.y;
	neoBuilding.geoLocationDataAux.bboxAbsoluteCenterPos.z = realBuildingPos.z;
	
	// now, must change the keyMatrix of the references of the octrees.***
	//lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
	if(neoBuilding.octree)
	{
		var lowestOctreesArray = [];
		neoBuilding.octree.extractLowestOctreesIfHasTriPolyhedrons(lowestOctreesArray);
		
		var lowestOctreesCount = lowestOctreesArray.length;
		for(var i=0; i<lowestOctreesCount; i++)
		{
			if(lowestOctreesArray[i].neoReferencesMotherAndIndices)
				lowestOctreesArray[i].neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
		}
		
		lowestOctreesArray = undefined;
	}
	
	// repeat this for outfitting building.*********************************************************************************************************************
	// repeat this for outfitting building.*********************************************************************************************************************
	// repeat this for outfitting building.*********************************************************************************************************************
	var neoBuildingOutffiting = this.getNeoBuildingById("outfitting", projectIdAndBlockId);
	
	if(neoBuildingOutffiting == undefined)
		return;
	
	// "longitude", "latitude" and "elevation" is from the structure block.***
	neoBuildingOutffiting.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, neoBuildingOutffiting.geoLocationDataAux);
	
	this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC); // the centerpoint is taken from structure block.***
	this.pointSC_2.x = -this.pointSC.x;
	this.pointSC_2.y = -this.pointSC.y;
	this.pointSC_2.z = -this.pointSC.z;

	var traslationVector = undefined;
	var realBuildingPos = undefined;
	realBuildingPos = neoBuildingOutffiting.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
	traslationVector = neoBuildingOutffiting.geoLocationDataAux.tMatrix.rotatePoint3D(this.pointSC_2, traslationVector );
	neoBuildingOutffiting.geoLocationDataAux.position.x += traslationVector.x;
	neoBuildingOutffiting.geoLocationDataAux.position.y += traslationVector.y;
	neoBuildingOutffiting.geoLocationDataAux.position.z += traslationVector.z;
	//neoBuildingOutffiting.geoLocationDataAux.positionHIGH;
	neoBuildingOutffiting.geoLocationDataAux.aditionalTraslation = traslationVector;
	neoBuildingOutffiting.geoLocationDataAux.positionLOW[0] += traslationVector.x;
	neoBuildingOutffiting.geoLocationDataAux.positionLOW[1] += traslationVector.y;
	neoBuildingOutffiting.geoLocationDataAux.positionLOW[2] += traslationVector.z;
	
	realBuildingPos.x += traslationVector.x;
	realBuildingPos.y += traslationVector.y;
	realBuildingPos.z += traslationVector.z;
	
	if(neoBuildingOutffiting.geoLocationDataAux.bboxAbsoluteCenterPos == undefined)
		neoBuildingOutffiting.geoLocationDataAux.bboxAbsoluteCenterPos = new Point3D();
	
	neoBuildingOutffiting.geoLocationDataAux.bboxAbsoluteCenterPos.x = realBuildingPos.x;
	neoBuildingOutffiting.geoLocationDataAux.bboxAbsoluteCenterPos.y = realBuildingPos.y;
	neoBuildingOutffiting.geoLocationDataAux.bboxAbsoluteCenterPos.z = realBuildingPos.z;
	
	// now, must change the keyMatrix of the references of the octrees.***
	//lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuilding.geoLocationDataAux.rotMatrix);
	if(neoBuildingOutffiting.octree)
	{
		var lowestOctreesArray = [];
		neoBuildingOutffiting.octree.extractLowestOctreesIfHasTriPolyhedrons(lowestOctreesArray);
		
		var lowestOctreesCount = lowestOctreesArray.length;
		for(var i=0; i<lowestOctreesCount; i++)
		{
			if(lowestOctreesArray[i].neoReferencesMotherAndIndices)
				lowestOctreesArray[i].neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, neoBuildingOutffiting.geoLocationDataAux.rotMatrix);
		}
		
		lowestOctreesArray = undefined;
	}
}

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
CesiumManager.prototype.loadDemoBlocks = function()
{
	
	
	if(this.demoBlocksLoaded == true)
		return;
	// 3000 blocks.*****************
	var blocks = MagoConfig.getInformation().demoBlockConfig.blocks;
	var blocksCount = blocks.length;
	for (var blockId in blocks) 
	{
		// MSP.***********************************************************
		var neoBuilding = this.neoBuildingsList.newNeoBuilding();
		neoBuilding.isDemoBlock = true;

		var block = blocks[blockId];
		var blockType = "MSP";
		
		var buildingNameDivided = blockId.split("_");
		var tempBuildingId = buildingNameDivided[0];
		var extraNumber = buildingNameDivided[1];

		neoBuilding.buildingId = blockId;
		neoBuilding.buildingType = blockType;
		
		if(blockType == "MSP")
		{
			if(tempBuildingId == "H710F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R015";
			}
			else if(tempBuildingId == "K120T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R073";
			}
			else if(tempBuildingId == "P220F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R044";
			}
			else if(tempBuildingId == "P350T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R064";
			}
			else if(tempBuildingId == "P360T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R061";
			}
		}
		else if(blockType == "MOP")
		{
			if(tempBuildingId == "H710F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R042";
			}
			else if(tempBuildingId == "K120T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R282";
			}
			else if(tempBuildingId == "P220F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R372";
			}
			else if(tempBuildingId == "P350T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R420";
			}
			else if(tempBuildingId == "P360T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R377";
			}
		}
		
		var longitude = block.LONGITUDE;
		var latitude = block.LATITUDE;
		var altitude= block.ELEVATION;
		
		if(neoBuilding.metaData == undefined) {
			neoBuilding.metaData = new MetaData();
		}
		neoBuilding.metaData.latitude = latitude;
		neoBuilding.metaData.longitude = longitude;
		neoBuilding.metaData.altitude = altitude;
		
		// MOP.************************************************************************
		neoBuilding = this.neoBuildingsList.newNeoBuilding();
		neoBuilding.isDemoBlock = true;

		block = blocks[blockId];

		blockType = "MOP";

		buildingNameDivided = blockId.split("_");
		tempBuildingId = buildingNameDivided[0];
		extraNumber = buildingNameDivided[1];

		neoBuilding.buildingId = blockId;
		neoBuilding.buildingType = blockType;
		
		if(blockType == "MSP")
		{
			if(tempBuildingId == "H710F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R015";
			}
			else if(tempBuildingId == "K120T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R073";
			}
			else if(tempBuildingId == "P220F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R044";
			}
			else if(tempBuildingId == "P350T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R064";
			}
			else if(tempBuildingId == "P360T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R061";
			}
		}
		else if(blockType == "MOP")
		{
			if(tempBuildingId == "H710F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R042";
			}
			else if(tempBuildingId == "K120T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R282";
			}
			else if(tempBuildingId == "P220F")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R372";
			}
			else if(tempBuildingId == "P350T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R420";
			}
			else if(tempBuildingId == "P360T")
			{
				neoBuilding.buildingFileName = "F4D_ALL-" + blockType + "-" + tempBuildingId + "_R377";
			}
		}
		
		var longitude = block.LONGITUDE;
		var latitude = block.LATITUDE;
		var altitude= block.ELEVATION;
		
		if(neoBuilding.metaData == undefined) {
			neoBuilding.metaData = new MetaData();
		}
		neoBuilding.metaData.latitude = latitude;
		neoBuilding.metaData.longitude = longitude;
		neoBuilding.metaData.altitude = altitude;
		
		//neoBuilding.bbox = new BoundingBox();
		//neoBuilding.bbox.minX = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		//neoBuilding.bbox.minY = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		//neoBuilding.bbox.minZ = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		//neoBuilding.bbox.maxX = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		//neoBuilding.bbox.maxY = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		//neoBuilding.bbox.maxZ = this.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		
	}
	
	this.demoBlocksLoaded = true;
}

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
CesiumManager.prototype.getObjectIndexFile = function() {
	this.readerWriter.getObjectIndexFile(	this.scene.context._gl, 
											this.readerWriter.geometryDataPath + Constant.OBJECT_INDEX_FILE, 
											this.readerWriter, 
											this.neoBuildingsList);
};

/**
 * api gateway
 */
CesiumManager.prototype.callAPI = function(api) {
	var apiName = api.getAPIName();
	if(apiName === "changeMagoState") {
		this.magoPolicy.setMagoEnable(api.getMagoEnable());
	} else if(apiName === "changeRender") {
		this.renderingModeTemp = api.getRenderMode();
	} else if(apiName === "searchBlock") {
		this.flyToBuilding(api.getBlockType(), api.getProjectId() + "_"+ api.getBlockId());
	} else if(apiName === "changeHighLighting") {
		this.magoPolicy.highLightedBuildings.length = 0;
		var projectId = api.getProjectId();
		var blockIds = api.getBlockIds().split(",");
		var objectIds = null;
		var isExistObjectIds = false;
		if(api.getObjectIds() != null && api.getObjectIds().length != 0) {
			objectIds = api.getObjectIds().split(",");
			isExistObjectIds = true;
		}
		var hightedBuilds = [];
		for(var i=0, count = blockIds.length; i<count; i++) {
			var projectLayer = new ProjectLayer();
			projectLayer.setProjectId(projectId);
			projectLayer.setBlockId(blockIds[i]);
			if(isExistObjectIds) projectLayer.setObjectId(objectIds[i]);
			else projectLayer.setObjectId(null);
			hightedBuilds.push(projectLayer);
		}
		this.magoPolicy.setHighLightedBuildings(hightedBuilds);
		this.highLightBuildings();
	} else if(apiName === "changeColor") {
		this.magoPolicy.colorBuildings.length = 0;
		var projectId = api.getProjectId();
		var blockIds = api.getBlockIds().split(",");
		var objectIds = null;
		var isExistObjectIds = false;
		if(api.getObjectIds() != null && api.getObjectIds().length != 0) {
			objectIds = api.getObjectIds().split(",");
			isExistObjectIds = true;
		}
		var colorBuilds = [];
		for(var i=0, count = blockIds.length; i<count; i++) {
			var projectLayer = new ProjectLayer();
			projectLayer.setProjectId(projectId);
			projectLayer.setBlockId(blockIds[i]);
			if(isExistObjectIds) projectLayer.setObjectId(objectIds[i]);
			else projectLayer.setObjectId(null);
			colorBuilds.push(projectLayer);
		}
		this.magoPolicy.setColorBuildings(colorBuilds);
		
		var rgbColor = api.getColor().split(",");
		var rgbArray = [ rgbColor[0]/255, rgbColor[1]/255, rgbColor[2]/255 ] ;
		this.magoPolicy.setColor(rgbArray);
		this.policyColorChanged();
	} else if(apiName === "show") {
		this.magoPolicy.setHideBuildings.length = 0;
	} else if(apiName === "hide") {
		this.magoPolicy.setHideBuildings(api.gethideBuilds());
	} else if(apiName === "move") {
		
	} else if(apiName === "changeOutFitting") {
		this.magoPolicy.setShowOutFitting(api.getShowOutFitting());
	} else if(apiName === "changeBoundingBox") {
		this.magoPolicy.setShowBoundingBox(api.getShowBoundingBox());
	} else if(apiName === "changeShadow") {
		this.magoPolicy.setShowShadow(api.getShowShadow());
	} else if(apiName === "changeFrustumFarDistance") {
		// frustum culling 가시 거리
		this.magoPolicy.setFrustumFarSquaredDistance(api.getFrustumFarDistance() * api.getFrustumFarDistance());
	} else if(apiName === "changeLocationAndRotation") {
		// 변환 행렬
		this.changeLocationAndRotation(api.getProjectId() + "_" + api.getBlockId(), 
							parseFloat(api.getLatitude()), 
							parseFloat(api.getLongitude()), 
							parseFloat(api.getElevation()), 
							parseFloat(api.getHeading()), 
							parseFloat(api.getPitch()), 
							parseFloat(api.getRoll()));
	} else if(apiName === "changeMouseMove") {
		this.magoPolicy.setMouseMoveMode(api.getMouseMoveMode());
	}
};
