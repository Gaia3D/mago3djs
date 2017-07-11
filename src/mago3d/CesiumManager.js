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
	this.bRBuildingProjectsList = new BRBuildingProjectsList(); // Old. Provisionally for old f4d projects.*** !!!
	this.terranTile = new TerranTile();// use this.***
	this.neoBuildingsList = new NeoBuildingsList();
	//this.neoBuildingsList_3000 = new NeoBuildingsList();
	//this.neoBuildingsListAux;
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
	this.mouseMiddleDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane;

	this.selectionCandidateObjectsArray = [];
	this.selectionCandidateLowestOctreesArray = [];
	this.selectionCandidateBuildingsArray = [];
	this.objectSelected;
	this.buildingSelected;
	this.octreeSelected;
	this.objMovState = 0; // 0 = no started. 1 = mov started.
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.startMovPoint = new Point3D();
	
	this.configInformation;

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
	this.sceneState = new SceneState(); // this contains all scene mtrices and camera position.***
	this.selectionColor = new SelectionColor();

	this.currentVisible_terranTiles_array = [];
	this.currentVisibleBuildings_array = []; // delete this.***
	this.currentVisibleBuildings_LOD0_array = []; // delete this.***
	this.currentVisibleBuildingsPost_array = [];

	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerBuildings = new VisibleObjectsControler();
	this.visibleObjControlerOctrees = new VisibleObjectsControler(); // delete this.***
	this.visibleObjControlerOctreesAux = new VisibleObjectsControler(); // delete this.***
	
	this.currentVisibleNeoBuildings_array = []; // delete this.***
	this.currentVisibleClouds_array = [];
	this.detailed_building; // old.***
	this.detailed_neoBuilding; // old.***
	this.boundingSphere_Aux; 
	this.radiusAprox_aux;

	this.currentRenderables_neoRefLists_array = []; // dont use this.***

	this.filteredVisibleTiles_array = [];
	this.detailedVisibleTiles_array = [];
	this.LOD0VisibleTiles_array = [];

	this.lastCamPos = new Point3D();
	this.squareDistUmbral = 22.0;

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
	this.renderingFase = 0;

	this.min_squaredDist_to_see_detailed = 100000; // 200m.***
	this.min_squaredDist_to_see_LOD0 = 100000; // Original.***
	//this.min_squaredDist_to_see_LOD0 = 1000000; // 600m.***
	this.min_squaredDist_to_see = 15000000;
	this.min_squaredDist_to_see_smallBuildings = 700000;
	this.renders_counter = 0;
	this.render_time = 0;
	this.bPicking = false;
	this.bObjectMarker = true;

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

	this.objMarkerManager = new ObjectMarkerManager();
	this.pin = new Pin();
	
	

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

/**
 * noise texture를 생성
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
	// this is cesium version.***
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
		if(this.configInformation == undefined)
		{
			this.configInformation = MagoConfig.getPolicy();
		}
		this.sceneState.gl = scene.context._gl;
		this.renderNeoBuildingsAsimectricVersion(scene, isLastFrustum, frustumIdx, numFrustums);
		//this.renderNeoBuildings(scene, isLastFrustum); // original.****
		//this.renderTerranTileServiceFormatPostFxShader(scene, isLastFrustum);
	}
};

CesiumManager.prototype.render = function(dc)
{
    // Function for WebWorldWind.*********************************************************************************************************
	// Function for WebWorldWind.*********************************************************************************************************

    // Now, we add to orderedRenderable the buildings that wants to render. PENDENT.***
    dc.addOrderedRenderable(this, 1000.0); // 1000 = distance to eye.*** Provisionally, we render all.***
	
};

/**
 * object 를 그리는 두가지 종류의 function을 호출
 * @param scene 변수
 * @param pass 변수
 * @param frustumIdx 변수
 * @param numFrustums 변수
 */
CesiumManager.prototype.renderOrdered = function(dc)
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
	//this.render_Tiles(dc);
	if(this.configInformation == undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}
		
	var hola = 0;
	var isLastFrustum = true;
	var frustumIdx = 0;
	var numFrustums = 1;
	this.sceneState.dc = dc;
	this.sceneState.gl = dc.currentGlContext;
	var scene;
	
	this.renderNeoBuildingsAsimectricVersion(scene, isLastFrustum, frustumIdx, numFrustums);
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
	gl.depthMask(false);
	gl.stencilMask(0x00);

	gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
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
 /*
CesiumManager.prototype.calculateEncodedCameraPositionMCHighLow = function(encodedCamPosMC_High, encodedCamPosMC_Low, cameraPosition) {
	var camSplitVelue_X  = Cesium.EncodedCartesian3.encode(cameraPosition.x);
	var camSplitVelue_Y  = Cesium.EncodedCartesian3.encode(cameraPosition.y);
	var camSplitVelue_Z  = Cesium.EncodedCartesian3.encode(cameraPosition.z);

	encodedCamPosMC_High[0] = camSplitVelue_X.high;
	encodedCamPosMC_High[1] = camSplitVelue_Y.high;
	encodedCamPosMC_High[2] = camSplitVelue_Z.high;

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
*/

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
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read metadata file.***
				var neoBuildingHeaderPath = geometryDataPath + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
				this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
				//continue;
				}
				else
					return;
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
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read metadata file.***
				var neoBuildingHeaderPath = geometryDataPath + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
				this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
				//continue;
				}
				else
					return;
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
 * ??
 * @param scene 변수
 * @param isLastFrustum 변수
 */
CesiumManager.prototype.upDateSceneStateMatrices = function(sceneState) {
	// here updates the modelView and modelViewProjection matrices of the scene.***
	if(this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		// * else if this is in WebWorldWind:
		// www dependency.****
		var dc = sceneState.dc;
		
		var columnMajorArray = WorldWind.Matrix.fromIdentity();
		var columnMajorArrayAux = WorldWind.Matrix.fromIdentity();
		
		var modelViewRelToEye = WorldWind.Matrix.fromIdentity();
		modelViewRelToEye.copy(dc.navigatorState.modelview);
		modelViewRelToEye[3] = 0.0;
		modelViewRelToEye[7] = 0.0;
		modelViewRelToEye[11] = 0.0;
		
		// ModelViewMatrix.***
		var modelView = WorldWind.Matrix.fromIdentity();
		modelView.copy(dc.navigatorState.modelview);
		columnMajorArray = modelView.columnMajorComponents(columnMajorArrayAux);
		sceneState.modelViewMatrix.copyFromFloatArray(columnMajorArray);
		
		// ModelViewMatrix Inverse.***
		var matrixInv = WorldWind.Matrix.fromIdentity();
		//matrixInv.invertMatrix(modelView);
		matrixInv.invertOrthonormalMatrix(modelView);
		columnMajorArray = matrixInv.columnMajorComponents(columnMajorArrayAux);
		sceneState.modelViewMatrixInv.copyFromFloatArray(columnMajorArray);
		
		// NormalMatrix.***
		sceneState.normalMatrix4.copyFromFloatArray(matrixInv);
	  
		// Projection Matrix.***
		var projection = WorldWind.Matrix.fromIdentity();
		projection.copy(dc.navigatorState.projection);
		columnMajorArray = projection.columnMajorComponents(columnMajorArrayAux);
		sceneState.projectionMatrix.copyFromFloatArray(columnMajorArray);
		
		// ModelViewRelToEyeMatrix.***
		modelView = WorldWind.Matrix.fromIdentity();
		modelView.copy(dc.navigatorState.modelview);
		columnMajorArray = modelViewRelToEye.columnMajorComponents(columnMajorArray);
		sceneState.modelViewRelToEyeMatrix.copyFromFloatArray(columnMajorArray);
		
		// ModelViewRelToEyeMatrixInv.***
		var mvRelToEyeInv = WorldWind.Matrix.fromIdentity();
		mvRelToEyeInv.invertOrthonormalMatrix(modelViewRelToEye);
		columnMajorArray = mvRelToEyeInv.columnMajorComponents(columnMajorArrayAux);
		sceneState.modelViewRelToEyeMatrixInv.copyFromFloatArray(columnMajorArray);
		
		// ModelViewProjectionRelToEyeMatrix.***
		var modelViewProjectionRelToEye_aux = WorldWind.Matrix.fromIdentity();
		modelViewProjectionRelToEye_aux.copy(projection);
		modelViewProjectionRelToEye_aux.multiplyMatrix(modelViewRelToEye);
		var columnMajorArrayAux = WorldWind.Matrix.fromIdentity();
		var columnMajorArray = modelViewProjectionRelToEye_aux.columnMajorComponents(columnMajorArrayAux); // Original.***
		sceneState.modelViewProjRelToEyeMatrix.copyFromFloatArray(columnMajorArray);
		
		/*
		// ModelViewProjectionRelToEyeMatrix.***
		columnMajorArray = WorldWind.Matrix.fromIdentity();
		var modelViewProjection = WorldWind.Matrix.fromIdentity();
		modelViewProjection.copy(dc.navigatorState.modelviewProjection);
		columnMajorArray = modelViewProjection.columnMajorComponents(columnMajorArrayAux);
		columnMajorArray[12] = 0.0;
		columnMajorArray[13] = 0.0;
		columnMajorArray[14] = 0.0;
		sceneState.modelViewProjRelToEyeMatrix.copyFromFloatArray(columnMajorArray);
		*/
		
		var cameraPosition = dc.navigatorState.eyePoint;
		sceneState.camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
		//sceneState.camera.direction.set(scene._camera.direction.x, scene._camera.direction.y, scene._camera.direction.z);
		//sceneState.camera.up.set(scene._camera.up.x, scene._camera.up.y, scene._camera.up.z);
		ManagerUtils.calculateSplited3fv([cameraPosition[0], cameraPosition[1], cameraPosition[2]] ,sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);
		
		var viewport = this.wwd.viewport;
		sceneState.camera.frustum.aspectRatio = viewport.width/viewport.height;
		//sceneState.camera.frustum.near[0] = this.wwd.navigator.nearDistance;
		sceneState.camera.frustum.near[0] = 0.1;
		sceneState.camera.frustum.far = 1000.0;
		//sceneState.camera.frustum.far[0] = this.wwd.navigator.farDistance;
		
		sceneState.camera.frustum.fovRad = 56.1 * Math.PI/180; // pendent to know the real fov in webwroldwind.***
		sceneState.camera.frustum.fovyRad = sceneState.camera.frustum.fovRad/sceneState.camera.frustum.aspectRatio;
		//sceneState.camera.frustum.fovyRad = 45 * Math.PI/180;

		// screen size.***
		sceneState.drawingBufferWidth = viewport.width;
		sceneState.drawingBufferHeight = viewport.height;
	}
	else if(this.configInformation.geo_view_library === Constant.CESIUM)
	{
		// * if this is in Cesium:
		var scene = this.scene;
		var uniformState = scene._context.uniformState;
		//var uniformState = scene._context._us;
		Cesium.Matrix4.toArray(uniformState._modelViewProjectionRelativeToEye, sceneState.modelViewProjRelToEyeMatrix._floatArrays);
		Cesium.Matrix4.toArray(uniformState._modelViewRelativeToEye, sceneState.modelViewRelToEyeMatrix._floatArrays);
		
		sceneState.modelViewRelToEyeMatrixInv._floatArrays = Cesium.Matrix4.inverseTransformation(sceneState.modelViewRelToEyeMatrix._floatArrays, sceneState.modelViewRelToEyeMatrixInv._floatArrays);// original.***
		
		//Cesium.Matrix4.toArray(uniformState._modelView, sceneState.modelViewMatrix._floatArrays);// original.***
		//sceneState.modelViewMatrix._floatArrays = Cesium.Matrix4.multiply(uniformState.model, uniformState.view, sceneState.modelViewMatrix._floatArrays);
		sceneState.modelViewMatrix._floatArrays = Cesium.Matrix4.clone(uniformState.view, sceneState.modelViewMatrix._floatArrays);
		Cesium.Matrix4.toArray(uniformState._projection, sceneState.projectionMatrix._floatArrays);

		var cameraPosition = scene.context._us._cameraPosition;
		ManagerUtils.calculateSplited3fv([cameraPosition.x, cameraPosition.y, cameraPosition.z] ,sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);

		sceneState.modelViewMatrixInv._floatArrays = Cesium.Matrix4.inverseTransformation(sceneState.modelViewMatrix._floatArrays, sceneState.modelViewMatrixInv._floatArrays);// original.***
		sceneState.normalMatrix4._floatArrays = Cesium.Matrix4.transpose(sceneState.modelViewMatrixInv._floatArrays, sceneState.normalMatrix4._floatArrays);// original.***

		sceneState.camera.frustum.far[0] = scene._frustumCommandsList[0].far; // original.***
		//sceneState.camera.frustum.far[0] = 5000000.0;
		sceneState.camera.frustum.near[0] = scene._frustumCommandsList[0].near;
		sceneState.camera.frustum.fovRad = scene._camera.frustum._fov;
		sceneState.camera.frustum.fovyRad = scene._camera.frustum._fovy;
		sceneState.camera.frustum.aspectRatio = scene._camera.frustum._aspectRatio;

		sceneState.camera.position.set(scene.context._us._cameraPosition.x, scene.context._us._cameraPosition.y, scene.context._us._cameraPosition.z);
		sceneState.camera.direction.set(scene._camera.direction.x, scene._camera.direction.y, scene._camera.direction.z);
		sceneState.camera.up.set(scene._camera.up.x, scene._camera.up.y, scene._camera.up.z);
		
		sceneState.drawingBufferWidth = scene.drawingBufferWidth;
		sceneState.drawingBufferHeight = scene.drawingBufferHeight;
	}
	

	
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
	this.isLastFrustum = isLastFrustum;
	
	this.upDateSceneStateMatrices(this.sceneState);

	var gl = this.sceneState.gl;
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	if(this.textureAux_1x1 == undefined) {
		this.textureAux_1x1 = gl.createTexture();
		// Test wait for texture to load.********************************************
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	if(this.pin.texture == undefined)
	{
		this.pin.texture = new Texture();
		var filePath_inServer = this.magoPolicy.imagePath + "/PinImage.png";
		this.pin.texture.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, this.pin.texture, undefined, this);
		this.pin.texturesArray.push(this.pin.texture);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/PinCabreado.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/PinTijeras.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/PinDislike.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/PinLikeGreen.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/PinCarcajadas.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
	}
	
	//scene
	if(this.depthFboNeo == undefined) this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	if(this.sceneState.drawingBufferWidth != this.depthFboNeo.width || this.sceneState.drawingBufferHeight != this.depthFboNeo.height)
	{
		this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	}
	
	
	var cameraPosition = this.sceneState.camera.position;

	// do frustum culling.***
	//if(this.isCameraMoving)
	//{
	//	var hola = 0;
	//}
	
	if(!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if(this.isLastFrustum)
		{
			if(this.myCameraSCX == undefined) 
			this.myCameraSCX = new Camera();
				
			var frustumVolume;
			if(this.configInformation.geo_view_library === Constant.WORLDWIND)
			{
				var wwwFrustumVolume = this.sceneState.dc.navigatorState.frustumInModelCoordinates;
				for(var i=0; i<6; i++)
				{
					var plane = wwwFrustumVolume._planes[i];
					this.myCameraSCX.frustum.planesArray[i].setNormalAndDistance(plane.normal[0], plane.normal[1], plane.normal[2], plane.distance);
				}
			}
			else if(this.configInformation.geo_view_library === Constant.CESIUM)
			{
				var camera = scene.frameState.camera;
				var cesiumFrustum = camera.frustum.computeCullingVolume(camera.position, camera.direction, camera.up);

				for(var i=0; i<6; i++)
				{
					var plane = cesiumFrustum.planes[i];
					this.myCameraSCX.frustum.planesArray[i].setNormalAndDistance(plane.x, plane.y, plane.z, plane.w);
				}
			}

			this.currentVisibleNeoBuildings_array.length = 0;
			this.doFrustumCullingNeoBuildings(this.myCameraSCX.frustum, cameraPosition);
			this.prepareNeoBuildingsAsimetricVersion(gl);
		}
	}
	else{
		var hola = 0;
	}

	var currentShader = undefined;

	// renderDepth for all buildings.***
	// 1) LOD 0.*********************************************************************************************************************
	if(!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown && this.isLastFrustum) {
		this.visibleObjControlerOctrees.initArrays(); // init.******
		this.visibleObjControlerOctreesAux.initArrays(); // init.******

		var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for(var i=0; i<buildingsCount; i++) {
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, neoBuilding, this.visibleObjControlerOctrees, this.visibleObjControlerOctreesAux, 0);
			this.prepareVisibleOctreesAsimetricVersion(gl, scene, neoBuilding);
			this.prepareVisibleOctreesAsimetricVersionLOD2(gl, scene, neoBuilding);
		}
		buildingsCount = this.visibleObjControlerBuildings.currentVisibles2.length;
		for(var i=0; i<buildingsCount; i++) {
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[i];
			this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, neoBuilding, this.visibleObjControlerOctrees, this.visibleObjControlerOctreesAux, 2);
			this.prepareVisibleOctreesAsimetricVersionLOD2(gl, scene, neoBuilding);
		}
		
		// if a LOD0 building has a NO ready lowestOctree, then push this building to the LOD2BuildingsArray.***
		buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for(var i=0; i<buildingsCount; i++) {
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			if(neoBuilding.currentVisibleOctreesControler == undefined)
				continue;
			if(neoBuilding.currentVisibleOctreesControler.currentVisibles2.length > 0)
			{
				// then push this neoBuilding to the LOD2BuildingsArray.***
				this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
			}
		}
		
	}
	else{
		var hola = 0;
	}
	
	if(this.bPicking == true && isLastFrustum)
	{
		if(this.magoPolicy.issueInsertEnable == true)
		{
			if(this.objMarkerSC == undefined)
				this.objMarkerSC = new ObjectMarker();
			
			var pixelPos = new Point3D();
			pixelPos = this.calculatePixelPositionWorldCoord(gl, scene, pixelPos);
			//var objMarker = this.objMarkerManager.newObjectMarker();
			
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, this.objMarkerSC.geoLocationData, this);
			this.renderingFase = !this.renderingFase;
		}
		
		if(this.magoPolicy.objectInfoViewEnable == true)
		{
			if(this.objMarkerSC == undefined)
				this.objMarkerSC = new ObjectMarker();
			
			var pixelPos = new Point3D();
			pixelPos = this.calculatePixelPositionWorldCoord(gl, scene, pixelPos);
			//var objMarker = this.objMarkerManager.newObjectMarker();
			
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, this.objMarkerSC.geoLocationData, this);
			this.renderingFase = !this.renderingFase;
		}
	}
	
	
	if(this.bPicking == true && isLastFrustum)
	{
		this.arrayAuxSC.length = 0;
		this.objectSelected = this.getSelectedObjectPickingAsimetricMode(gl, scene, this.visibleObjControlerBuildings, this.arrayAuxSC);
		this.buildingSelected = this.arrayAuxSC[0];
		this.octreeSelected = this.arrayAuxSC[1];
		this.arrayAuxSC.length = 0;
		if(this.buildingSelected != undefined) {
			this.displayLocationAndRotation(this.buildingSelected);
			this.selectedObjectNotice(this.buildingSelected);
		}
		if(this.objectSelected != undefined) {
			//this.displayLocationAndRotation(currentSelectedBuilding);
			//this.selectedObjectNotice(currentSelectedBuilding);
			//console.log("objectId = " + selectedObject.objectId);
		}
	}
	
	// 1) The depth render.**********************************************************************************************************************
	//if(this.currentFramebuffer == null)
	//	this.currentFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
	var ssao_idx = 0; // 0= depth. 1= ssao.***
	var renderTexture = false;
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	this.renderLowestOctreeAsimetricVersion(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, this.visibleObjControlerBuildings);
	this.depthFboNeo.unbind();
	
	this.renderingFase = !this.renderingFase;

	
	// 2) ssao render.************************************************************************************************************
	//if(this.currentFramebuffer != null)
		//this.sceneState.gl.bindFramebuffer(this.sceneState.gl.FRAMEBUFFER, this.currentFramebuffer);
	
	if(this.configInformation.geo_view_library === Constant.WORLDWIND)
	{

	}
	else if(this.configInformation.geo_view_library === Constant.CESIUM)
	{
		scene._context._currentFramebuffer._bind();
	}
	
	var wwwCurrentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
	var wwwCurrentTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
	
	if(this.noiseTexture == undefined) 
		this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels);

	ssao_idx = 1;
	this.renderLowestOctreeAsimetricVersion(gl, cameraPosition, scene, currentShader, renderTexture, ssao_idx, this.visibleObjControlerBuildings);
	
	this.renderingFase = !this.renderingFase;
	
	if(this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		//this.wwd.drawContext.bindFramebuffer(null);
        //this.wwd.drawContext.bindProgram(wwwCurrentProgram);
		gl.activeTexture(gl.TEXTURE0);
		//gl.bindTexture(gl.TEXTURE_2D, wwwCurrentTexture);
		this.wwd.drawContext.redrawRequested = true;
	}
	
};

/**
 * 선택된 object를 취득
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
		this.doFrustumCullingNeoBuildings(frustumVolume, cameraPosition);
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
 * 선택된 object 를 asimetric mode로 취득
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 * @returns selectionCandidateObjectsArray[idx]
 */
CesiumManager.prototype.getSelectedObjectPickingAsimetricMode = function(gl, scene, visibleObjControlerBuildings, resultSelectedArray) {
	// Picking render.***
	// Picking render.***
	// Picking render.***
	
	this.bPicking = false;

	//var cameraPosition = scene.context._us._cameraPosition;
	var cameraPosition = this.sceneState.camera.position;

	if(this.selectionFbo == undefined) 
		this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);

	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	// selection render.*******************************************************************************************************************
	this.selectionColor.init(); // selection colors manager.***
	
	// picking mode.***
	this.selectionCandidateObjectsArray.length = 0; // init.***
	this.selectionCandidateLowestOctreesArray.length = 0; // init.***
	this.selectionCandidateBuildingsArray.length = 0; // init.***
	
	// set byteColor codes for references objects.***
	var alfa = 255;
	
	var neoBuilding;
	var currentVisibleOctreesControler;
	var currentVisibleLowestOctCount;
	var lowestOctree;
	var availableColor;
	var refsCount;
	var neoRef;
	
	var isInterior = false;
	var renderTexture = false;
	var ssao_idx = -1;
	var minSize = 0.0;
	var refTMatrixIdxKey = 0;
	var glPrimitive = gl.TRIANGLES;
	
	// LOD0 & LOD1 & LOD2.***
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<neoBuildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles0[i];
		currentVisibleOctreesControler = neoBuilding.currentVisibleOctreesControler;
		
		// LOD0.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles0.length;
		for(var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles0[j];
			if(lowestOctree.neoReferencesMotherAndIndices == undefined)
				continue;
			refsCount = lowestOctree.neoReferencesMotherAndIndices.currentVisibleIndices.length;
			for(var k=0; k<refsCount; k++)
			{
				neoRef = neoBuilding.motherNeoReferencesArray[lowestOctree.neoReferencesMotherAndIndices.currentVisibleIndices[k]];
				if(neoRef.selColor4 == undefined)
					neoRef.selColor4 = new Color();
				
				availableColor = this.selectionColor.getAvailableColor(availableColor);

				neoRef.selColor4.set(availableColor.r, availableColor.g, availableColor.b, alfa);
				this.selectionCandidateObjectsArray.push(neoRef);
				this.selectionCandidateLowestOctreesArray.push(lowestOctree);
				this.selectionCandidateBuildingsArray.push(neoBuilding);
			}
		}
		
		// LOD1.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles1.length;
		for(var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles1[j];
			if(lowestOctree.neoReferencesMotherAndIndices == undefined)
				continue;
			refsCount = lowestOctree.neoReferencesMotherAndIndices.currentVisibleIndices.length;
			for(var k=0; k<refsCount; k++)
			{
				neoRef = neoBuilding.motherNeoReferencesArray[lowestOctree.neoReferencesMotherAndIndices.currentVisibleIndices[k]];
				if(neoRef.selColor4 == undefined)
					neoRef.selColor4 = new Color();
				
				availableColor = this.selectionColor.getAvailableColor(availableColor);

				neoRef.selColor4.set(availableColor.r, availableColor.g, availableColor.b, alfa);
				this.selectionCandidateObjectsArray.push(neoRef);
				this.selectionCandidateLowestOctreesArray.push(lowestOctree);
				this.selectionCandidateBuildingsArray.push(neoBuilding);
			}
		}
		
		// LOD2.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles2.length;
		for(var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles2[j];

			if(lowestOctree.lego == undefined)
				continue;

			if(lowestOctree.lego.selColor4 == undefined)
				lowestOctree.lego.selColor4 = new Color();
			
			availableColor = this.selectionColor.getAvailableColor(availableColor);

			lowestOctree.lego.selColor4.set(availableColor.r, availableColor.g, availableColor.b, alfa);
			this.selectionCandidateObjectsArray.push(undefined);
			this.selectionCandidateLowestOctreesArray.push(lowestOctree);
			this.selectionCandidateBuildingsArray.push(neoBuilding);
		}
	}
	
	neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
	for(var i=0; i<neoBuildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles2[i];
		currentVisibleOctreesControler = neoBuilding.currentVisibleOctreesControler;
		if(currentVisibleOctreesControler)
		{
			// LOD2.***
			currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles2.length;
			for(var j=0; j<currentVisibleLowestOctCount; j++)
			{
				lowestOctree = currentVisibleOctreesControler.currentVisibles2[j];

				if(lowestOctree.lego == undefined)
					continue;

				if(lowestOctree.lego.selColor4 == undefined)
					lowestOctree.lego.selColor4 = new Color();
				
				availableColor = this.selectionColor.getAvailableColor(availableColor);

				lowestOctree.lego.selColor4.set(availableColor.r, availableColor.g, availableColor.b, alfa);
				this.selectionCandidateObjectsArray.push(undefined);
				this.selectionCandidateLowestOctreesArray.push(lowestOctree);
				this.selectionCandidateBuildingsArray.push(neoBuilding);
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
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	gl.clearColor(1, 1, 1, 1); // white background.***
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
	//gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);
	
	gl.disable(gl.CULL_FACE);

	var shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
	
	// do the colorCoding render.***
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles0.length;
	for(var i=0; i<neoBuildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles0[i];
		
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		currentVisibleOctreesControler = neoBuilding.currentVisibleOctreesControler;
		
		// LOD0.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles0.length;
		for(var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles0[j];
			minSize = 0.0;
			this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, minSize, refTMatrixIdxKey, glPrimitive);
		}
		
		// LOD1.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles1.length;
		for(var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles1[j];
			minSize = 0.0;
			this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree.neoReferencesMotherAndIndices, neoBuilding, this, isInterior, currentShader, minSize, refTMatrixIdxKey, glPrimitive);
		}
		
		// LOD2.***
		gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, buildingGeoLocation.rotMatrix._floatArrays);
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles2.length;
		for(var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles2[j];

			if(lowestOctree.lego == undefined) {
			continue;
			}

			if(lowestOctree.lego.fileLoadState == CODE.fileLoadState.READY) {
				continue;
			}

			if(lowestOctree.lego.fileLoadState == 2) {
				continue;
			}

			gl.uniform1i(currentShader.hasTexture_loc, false); //.***
			gl.uniform4fv(currentShader.color4Aux_loc, [lowestOctree.lego.selColor4.r/255.0, lowestOctree.lego.selColor4.g/255.0, lowestOctree.lego.selColor4.b/255.0, 1.0]);

			gl.uniform1i(currentShader.hasAditionalMov_loc, false);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

			this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader, ssao_idx);
		}
		
	}
	
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
	for(var i=0; i<neoBuildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles2[i];
		
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		currentVisibleOctreesControler = neoBuilding.currentVisibleOctreesControler;
		if(currentVisibleOctreesControler)
		{

			// LOD2.***
			gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, buildingGeoLocation.rotMatrix._floatArrays);
			currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles2.length;
			for(var j=0; j<currentVisibleLowestOctCount; j++)
			{
				lowestOctree = currentVisibleOctreesControler.currentVisibles2[j];

				if(lowestOctree.lego == undefined) {
				continue;
				}

				if(lowestOctree.lego.fileLoadState == CODE.fileLoadState.READY) {
					continue;
				}

				if(lowestOctree.lego.fileLoadState == 2) {
					continue;
				}

				gl.uniform1i(currentShader.hasTexture_loc, false); //.***
				gl.uniform4fv(currentShader.color4Aux_loc, [lowestOctree.lego.selColor4.r/255.0, lowestOctree.lego.selColor4.g/255.0, lowestOctree.lego.selColor4.b/255.0, 1.0]);

				gl.uniform1i(currentShader.hasAditionalMov_loc, false);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

				this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader, ssao_idx);
			}
		}
	}

	if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);

	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***

	gl.disableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);

	// Now, read the picked pixel and find the object.*********************************************************
	var pixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(this.mouse_x, this.sceneState.drawingBufferHeight - this.mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***

	// now, select the object.***
	var idx = 64516*pixels[0] + 254*pixels[1] + pixels[2];

	var selectedObject = this.selectionCandidateObjectsArray[idx];
	this.selectionCandidateObjectsArray.length = 0;

	var currentOctreeSelected = this.selectionCandidateLowestOctreesArray[idx];
	var currentSelectedBuilding = this.selectionCandidateBuildingsArray[idx];
	this.selectionCandidateLowestOctreesArray.length = 0;
	this.selectionCandidateBuildingsArray.length = 0;

	resultSelectedArray[0] = currentSelectedBuilding;
	resultSelectedArray[1] = currentOctreeSelected;
	resultSelectedArray[2] = selectedObject;
	
	if(selectedObject || currentOctreeSelected || currentSelectedBuilding)
	{
		var hola = 0;
	}

	return selectedObject;
};

/**
 * 카메라 공간의 ray를 취득
 * @param gl 변수
 * @param scene 변수
 * @param resultRay 변수
 * @returns resultRay
 */
CesiumManager.prototype.getRayWorldSpace = function(gl, scene, pixelX, pixelY, resultRay) {
	// in this function the "ray" is a line.***
	if(resultRay == undefined) 
		resultRay = new Line();
	
	// world ray = camPos + lambda*camDir.***
	var camPos = this.sceneState.camera.position;
	var rayCamSpace = new Float32Array(3);
	rayCamSpace = this.getRayCamSpace(gl, pixelX, pixelY, rayCamSpace);
	
	if(this.pointSC == undefined)
		this.pointSC = new Point3D();
	
	this.pointSC.set(rayCamSpace[0], rayCamSpace[1], rayCamSpace[2]);

	// now, must transform this posCamCoord to world coord.***
	this.pointSC2 = this.sceneState.modelViewMatrixInv.rotatePoint3D(this.pointSC, this.pointSC2); // rayWorldSpace.***
	this.pointSC2.unitary(); // rayWorldSpace.***
	resultRay.setPointAndDir(camPos.x, camPos.y, camPos.z,       this.pointSC2.x, this.pointSC2.y, this.pointSC2.z);// original.***

	return resultRay;
};

/**
 * 카메라 공간의 ray를 취득
 * @param gl 변수
 * @param resultRay 변수
 * @returns resultRay
 */
CesiumManager.prototype.getRayCamSpace = function(gl, pixelX, pixelY, resultRay) {
	// in this function "ray" is a vector.***
	var frustum_far = 1.0; // unitary frustum far.***
	var fov = this.sceneState.camera.frustum.fovyRad;
	var aspectRatio = this.sceneState.camera.frustum.aspectRatio;

	var hfar = 2.0 * Math.tan(fov/2.0) * frustum_far;
	var wfar = hfar * aspectRatio;
	var mouseX = pixelX;
	var mouseY = this.sceneState.drawingBufferHeight - pixelY;
	if(resultRay == undefined) 
		resultRay = new Float32Array(3);
	resultRay[0] = wfar*((mouseX/this.sceneState.drawingBufferWidth) - 0.5);
	resultRay[1] = hfar*((mouseY/this.sceneState.drawingBufferHeight) - 0.5);
	resultRay[2] = - frustum_far;

	return resultRay;
};

/**
 * 선택된 object의 움직임 plane를 계산하여 asimetric mode 로 취득
 * @param gl 변수
 * @param cameraPosition 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.calculateSelObjMovePlaneAsimetricMode = function(gl, cameraPosition, scene, neoBuilding) {
	if(this.pointSC == undefined)
		this.pointSC = new Point3D();
	
	if(this.pointSC2 == undefined)
		this.pointSC2 = new Point3D();
	
	this.calculatePixelPositionWorldCoord(gl, scene, this.pointSC2);
	var buildingGeoLocation = this.buildingSelected.geoLocDataManager.getGeoLocationData(0);
	this.pointSC = buildingGeoLocation.tMatrixInv.transformPoint3D(this.pointSC2, this.pointSC); // buildingSpacePoint.***

	this.selObjMovePlane = new Plane();
	// provisionally make an XY plane.***
	// the plane is in world coord.***
	this.selObjMovePlane.setPointAndNormal(this.pointSC.x, this.pointSC.y, this.pointSC.z, 0.0, 0.0, 1.0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

/**
 * 선택된 object의 움직임 plane를 계산하여 asimetric mode 로 취득
 * @param gl 변수
 * @param cameraPosition 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.calculatePixelPositionWorldCoord = function(gl, scene, resultPixelPos) {

	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	// depth render.************************************************************************************************************
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	
	gl.frontFace(gl.CCW);
	//gl.depthFunc(gl.GREATER);
	//gl.enable(gl.CULL_FACE);

	var current_frustum_near = this.sceneState.camera.frustum.near;
	var current_frustum_far = this.sceneState.camera.frustum.far;

	if(this.selectionFbo == undefined) 
		this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	this.selectionFbo.bind(); // framebuffer for color selection.***
	
	//this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
	gl.clearColor(1, 1, 1, 1); // white background.***
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
	gl.disable(gl.BLEND);
	var ssao_idx = 0;
	this.depthRenderLowestOctreeAsimetricVersion(gl, ssao_idx, this.visibleObjControlerBuildings);
	//-------------------------------------------------------------------------------------------------------------------------------------------------------
	// Now, read the picked pixel and find the pixel position.*********************************************************
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(this.mouse_x, this.sceneState.drawingBufferHeight - this.mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);
	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	zDepth /= 256.0; // convert to 0 to 1.0 range depth.***
	var realZDepth = zDepth*current_frustum_far;

	// now, find the 3d position of the pixel in camCoord.****
	this.resultRaySC = this.getRayCamSpace(gl, this.mouse_x, this.mouse_y, this.resultRaySC);

	var pixelPosCamCoord = new Float32Array(3);
	pixelPosCamCoord[0] = this.resultRaySC[0] * realZDepth;
	pixelPosCamCoord[1] = this.resultRaySC[1] * realZDepth;
	pixelPosCamCoord[2] = this.resultRaySC[2] * realZDepth;

	// now, must transform this pixelCamCoord to world coord.***
	var mv_inv = this.sceneState.modelViewMatrixInv;
	var pixelPosCamCoordCartesian = new Point3D();
	pixelPosCamCoordCartesian.set(pixelPosCamCoord[0], pixelPosCamCoord[1], pixelPosCamCoord[2]);
	if(resultPixelPos == undefined)
		var resultPixelPos = new Point3D();
	resultPixelPos = mv_inv.transformPoint3D(pixelPosCamCoordCartesian, resultPixelPos);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	return resultPixelPos;
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
 * 카메라 motion 활성화
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
 * dragging 중인지 아닌지를 판단
 * @param gl 변수
 * @param scene 변수
 */
CesiumManager.prototype.isDragging = function(scene) {
	// test function.***
	var gl = this.sceneState.gl;

	if(this.magoPolicy.mouseMoveMode == 0) // buildings move.***
	{
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjectPickingAsimetricMode(gl, scene, this.visibleObjControlerBuildings, this.arrayAuxSC);
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
		var current_objectSelected = this.getSelectedObjectPickingAsimetricMode(gl, scene, this.visibleObjControlerBuildings, this.arrayAuxSC);
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

// 뭐하는 메서드 인가?
CesiumManager.prototype.disableCameraMotion = function(state){
	if(this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		this.wwd.navigator.panRecognizer.enable = false;
	}
	else if(this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.scene.screenSpaceCameraController.enableRotate = state;
		this.scene.screenSpaceCameraController.enableZoom = state;
		this.scene.screenSpaceCameraController.enableLook = state;
		this.scene.screenSpaceCameraController.enableTilt = state;
		this.scene.screenSpaceCameraController.enableTranslate = state;
	}
	
};


/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.manageMouseMove = function(mouseX, mouseY) {

	if(this.configInformation.geo_view_library === Constant.CESIUM)
	{
		// distinguish 2 modes.******************************************************
		if(this.magoPolicy.mouseMoveMode == 0) // blocks move.***
		{
			if(this.buildingSelected != undefined) {
				// move the selected object.***
				this.mouse_x = mouseX;
				this.mouse_y = mouseY;

				// 1rst, check if there are objects to move.***
				if(this.mustCheckIfDragging) {
					if(this.isDragging(this.scene)) {
						this.mouseDragging = true;
						this.disableCameraMotion(false);
					}
					this.mustCheckIfDragging = false;
				}
			} else {
				this.isCameraMoving = true; // if no object is selected.***
			}
		}
		else if(this.magoPolicy.mouseMoveMode == 1) // objects move.***
		{
			if(this.objectSelected != undefined) {
				// move the selected object.***
				this.mouse_x = mouseX;
				this.mouse_y = mouseY;

				// 1rst, check if there are objects to move.***
				if(this.mustCheckIfDragging) {
					if(this.isDragging(this.scene)) {
						this.mouseDragging = true;
						this.disableCameraMotion(false);
					}
					this.mustCheckIfDragging = false;
				}
			} else {
				this.isCameraMoving = true; // if no object is selected.***
			}
		}
		//---------------------------------------------------------------------------------
		this.isCameraMoving = true; // test.***
		if(this.mouseDragging) {
			this.moveSelectedObjectAsimetricMode(this.scene, this.currentRenderablesNeoRefListsArray);
		}

	}
	else if(this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		
	}
};


/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
CesiumManager.prototype.moveSelectedObjectAsimetricMode = function(scene, renderables_neoRefLists_array) {

	var gl = this.sceneState.gl;

	//var cameraPosition = scene.context._us._cameraPosition;
	var cameraPosition = this.sceneState.camera.position;
	if(this.magoPolicy.mouseMoveMode == 0) // buildings move.***
	{
		if(this.buildingSelected == undefined)
			return;

		// create a XY_plane in the selected_pixel_position.***
		if(this.selObjMovePlane == undefined) {
			var currentRenderingFase = this.renderingFase;
			this.renderingFase = -1;
			this.calculateSelObjMovePlaneAsimetricMode(gl, cameraPosition, scene, renderables_neoRefLists_array);
			this.renderingFase = currentRenderingFase;
		}

		if(this.lineSC == undefined)
			this.lineSC = new Line();
		
		this.getRayWorldSpace(gl, scene, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***

		// transform world_ray to building_ray.***
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();
		
		var buildingGeoLocation = this.buildingSelected.geoLocDataManager.getGeoLocationData(0);
		camPosBuilding = buildingGeoLocation.geoLocMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		this.pointSC = buildingGeoLocation.geoLocMatrixInv.rotatePoint3D(this.lineSC.direction, this.pointSC);
		camDirBuilding.x = this.pointSC.x;
		camDirBuilding.y = this.pointSC.y;
		camDirBuilding.z = this.pointSC.z;

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
			this.thereAreStartMovePoint = true;
		} else {
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;

			this.buildingSelected.moveVector.set(difX, difY, difZ);

			// test.*** see the cartographic values of the intersected point.***
			var newPosition = new Point3D();

			newPosition.add(difX, difY, difZ);
			var geoLocationData;
			geoLocationData = this.buildingSelected.geoLocDataManager.geoLocationDataArray[0];
			
			newPosition.add(geoLocationData.pivotPoint.x, geoLocationData.pivotPoint.y, geoLocationData.pivotPoint.z);

			//var cartographic = Cesium.Ellipsoid.cartesianToCartographic(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
			var cartographic = Cesium.Cartographic.fromCartesian(new Cesium.Cartesian3(newPosition.x, newPosition.y, newPosition.z));
			var newLongitude = cartographic.longitude * (180.0/Math.PI);
			var newlatitude = cartographic.latitude * (180.0/Math.PI);
			var newHeight = cartographic.height;

			this.changeLocationAndRotation(this.buildingSelected.buildingId, newlatitude, newLongitude, undefined, undefined, undefined, undefined);
			this.displayLocationAndRotation(this.buildingSelected);
			//this.selectedObjectNotice(this.buildingSelected);
		}
	}
	else if(this.magoPolicy.mouseMoveMode == 1) // objects move.***
	{
		if(this.objectSelected == undefined)
			return;

		// create a XY_plane in the selected_pixel_position.***
		if(this.selObjMovePlane == undefined) {
			var currentRenderingFase = this.renderingFase;
			this.renderingFase = -1;
			this.calculateSelObjMovePlaneAsimetricMode(gl, cameraPosition, scene, renderables_neoRefLists_array);
			this.renderingFase = currentRenderingFase;
		}

		// world ray = camPos + lambda*camDir.***
		if(this.lineSC == undefined)
			this.lineSC = new Line();
		
		this.getRayWorldSpace(gl, scene, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***
		var buildingGeoLocation = this.buildingSelected.geoLocDataManager.getGeoLocationData(0);
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();
		camPosBuilding = buildingGeoLocation.tMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		camDirBuilding = buildingGeoLocation.rotMatrixInv.transformPoint3D(this.lineSC.direction, camDirBuilding);
	
		// now, intersect building_ray with the selObjMovePlane.***
		var line = new Line();
		line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z,       camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);// original.***

		var intersectionPoint = new Point3D();
		intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);

		//the movement of an object must multiply by buildingRotMatrix.***
		var transformedIntersectPoint = new Point3D();
		transformedIntersectPoint = buildingGeoLocation.rotMatrix.transformPoint3D(intersectionPoint, transformedIntersectPoint); 
		intersectionPoint.x = transformedIntersectPoint.x;
		intersectionPoint.y = transformedIntersectPoint.y;
		intersectionPoint.z = transformedIntersectPoint.z;

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

		if(neoBuilding.buildingPosMatInv == undefined) {
			neoBuilding.buildingPosMatInv = new Matrix4();
			neoBuilding.buildingPosMatInv.setByFloat32Array(neoBuilding.moveMatrixInv);
		}

		var camera = scene.frameState.camera;

		var cameraDir = camera.direction;
		var transformedCamDir;
		var transformedCamUp;

		this.pointSC.set(cameraDir.x, cameraDir.y, cameraDir.z);
		transformedCamDir = neoBuilding.buildingPosMatInv.transformPoint3D(this.pointSC, transformedCamDir);
		this.pointSC.set(camera.up.x, camera.up.y, camera.up.z);
		transformedCamUp = neoBuilding.buildingPosMatInv.transformPoint3D(this.pointSC, transformedCamUp);

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

	var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
	if(buildingGeoLocation == undefined)
	{
		if(currentCalculatingPositionsCount < maxNumberOfCalculatingPositions)
		{
			if(neoBuilding.metaData != undefined)
			{
				buildingGeoLocation = neoBuilding.geoLocDataManager.newGeoLocationData("defaultLoc");
				var longitude = neoBuilding.metaData.geographicCoord.longitude;
				var latitude = neoBuilding.metaData.geographicCoord.latitude;
				var altitude = neoBuilding.metaData.geographicCoord.altitude;
				var heading = neoBuilding.metaData.heading;
				var pitch = neoBuilding.metaData.pitch;
				var roll = neoBuilding.metaData.roll;
				ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude-500.0, heading, pitch, roll, buildingGeoLocation, this);

				if(neoBuilding.octree)
				{
					//neoBuilding.octree.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
				}
			}
		}

		return;
	}

	var refList;
	var maxRefListParsingCount = 90;
	var refListsParsingCount = 0;

	//if(this.isCameraInsideNeoBuilding && neoBuilding.octree != undefined) // original.***
	if(neoBuilding.octree != undefined) {
		if(neoBuilding.currentVisibleOctreesControler == undefined)
				neoBuilding.currentVisibleOctreesControler = new VisibleObjectsControler();	
			
		if(lod == 0 || lod == 1)
		{
			var squaredDistLod0 = 500;
			var squaredDistLod1 = 15000;
			var squaredDistLod2 = 500000*1000;
			
			
			//squaredDistLod0 = 45000;
			//squaredDistLod1 = 85000;
			//squaredDistLod2 = 500000*1000;
				
			var frustumVolume;
			var find = false;
			if(this.myFrustumSC == undefined) 
				this.myFrustumSC = new Frustum();
				
			if(this.configInformation.geo_view_library === Constant.WORLDWIND)
			{
				if(this.myCameraSC == undefined) 
					this.myCameraSC = new Camera();
				
				if(this.myCameraSC2 == undefined) 
					this.myCameraSC2 = new Camera();
				
				var dc = this.sceneState.dc;
				
				if(neoBuilding.buildingId == "gangnam_del")
				{
					var hola = 0;
				}
				
				var cameraPosition = this.sceneState.dc.navigatorState.eyePoint;
				this.myCameraSC2.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
				//this.myCameraSC.frustum.near = 0.1;
				//this.myCameraSC.frustum.far = 5000000.0;
				buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				this.myCameraSC = buildingGeoLocation.getTransformedRelativeCamera(this.myCameraSC2, this.myCameraSC);
				var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);
				/*
				var modelViewRelToEye = WorldWind.Matrix.fromIdentity();
				modelViewRelToEye.copy(dc.navigatorState.modelview);
				modelViewRelToEye[3] = 0.0;
				modelViewRelToEye[7] = 0.0;
				modelViewRelToEye[11] = 0.0;
				
				var modelviewTranspose = WorldWind.Matrix.fromIdentity();
				modelviewTranspose.setToTransposeOfMatrix(modelViewRelToEye);
				
				var frustumRelToEye = WorldWind.Frustum.fromProjectionMatrix(dc.navigatorState.projection);
				frustumRelToEye.transformByMatrix(modelviewTranspose); // original.***
				frustumRelToEye.normalize(); // original.***

				//var buildingRotInv = WorldWind.Matrix.fromIdentity();
				//buildingRotInv.columnMajorComponents(buildingGeoLocation.rotMatrix._floatArrays);
				if(this.matrixSC == undefined)
					this.matrixSC = new Float32Array(16);
				
				for(var i=0; i<16; i++)
					this.matrixSC[i] = buildingGeoLocation.tMatrix._floatArrays[i];

				this.matrixSC[12] = (buildingGeoLocation.tMatrix._floatArrays[12] - cameraPosition[0]);
				this.matrixSC[13] = (buildingGeoLocation.tMatrix._floatArrays[13] - cameraPosition[1]);
				this.matrixSC[14] = (buildingGeoLocation.tMatrix._floatArrays[14] - cameraPosition[2]);
				
				var matrixInv = WorldWind.Matrix.fromIdentity();
				matrixInv.invertMatrix(this.matrixSC);
				
				var matInvTranspose = WorldWind.Matrix.fromIdentity();
				matInvTranspose.setToTransposeOfMatrix(matrixInv);
				
				//this.matrixSC[12] = buildingGeoLocation.tMatrixInv._floatArrays[12];
				//this.matrixSC[13] = buildingGeoLocation.tMatrixInv._floatArrays[13];
				//this.matrixSC[14] = buildingGeoLocation.tMatrixInv._floatArrays[14];
				
				frustumRelToEye.transformByMatrix(matrixInv);
				frustumRelToEye.normalize();
				
				//var frustumRelToEye = WorldWind.Frustum.fromProjectionMatrix(matrixInv);
				//****************************************************************************************************************************************
				for(var i=0; i<6; i++)
				{
					var plane = frustumRelToEye._planes[i];
					this.myFrustumSC.planesArray[i].setNormalAndDistance(plane.normal[0], plane.normal[1], plane.normal[2], plane.distance);
				}
				
				*/
				if(this.myBboxSC == undefined)
					this.myBboxSC = new BoundingBox();
				
				if(this.myCullingVolumeBBoxSC == undefined)
					this.myCullingVolumeBBoxSC = new BoundingBox();
				
				// Provisionally use a bbox to frustumCulling.***
				var radiusAprox = 2000.0;
				this.myCullingVolumeBBoxSC.minX = this.myCameraSC.position.x - radiusAprox;
				this.myCullingVolumeBBoxSC.maxX = this.myCameraSC.position.x + radiusAprox;
				this.myCullingVolumeBBoxSC.minY = this.myCameraSC.position.y - radiusAprox;
				this.myCullingVolumeBBoxSC.maxY = this.myCameraSC.position.y + radiusAprox;
				this.myCullingVolumeBBoxSC.minZ = this.myCameraSC.position.z - radiusAprox;
				this.myCullingVolumeBBoxSC.maxZ = this.myCameraSC.position.z + radiusAprox;
				
				
				// get frustumCulled lowestOctrees classified by distances.************************************************************************************
				var lastLOD0LowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
				var lastLOD1LowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;	
				
				neoBuilding.currentVisibleOctreesControler.currentVisibles0.length = 0;
				neoBuilding.currentVisibleOctreesControler.currentVisibles1.length = 0;
				neoBuilding.currentVisibleOctreesControler.currentVisibles2.length = 0;
				neoBuilding.currentVisibleOctreesControler.currentVisibles3.length = 0;
				find = neoBuilding.octree.getBBoxIntersectedLowestOctreesByLOD(	this.myCullingVolumeBBoxSC, neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctreesAux, this.myBboxSC,
																						this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z,
																						squaredDistLod0, squaredDistLod1, squaredDistLod2);
				
				//find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	this.myFrustumSC, neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctreesAux, this.boundingSphere_Aux,
				//																		this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z,
				//																		squaredDistLod0, squaredDistLod1, squaredDistLod2);
																						
			}
			else if(this.configInformation.geo_view_library === Constant.CESIUM)
			{
				
				if(this.myCameraSC == undefined) 
					this.myCameraSC = new Cesium.Camera(scene);
				
				var camera = scene.frameState.camera;
				var near = scene._frustumCommandsList[this.frustumIdx].near;
				var far = scene._frustumCommandsList[this.frustumIdx].far;
				var fov = scene.frameState.camera.frustum.fov;
				this.myCameraSC.frustum.fov = fov; // fov = fovx.***
				buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				this.myCameraSC = buildingGeoLocation.getTransformedRelativeCamera(camera, this.myCameraSC);
				
				var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);

				//this.myCameraSC.frustum.fovy = 0.3;
				//camera.frustum.far = 2.0;
				this.myCameraSC.near = near;
				this.myCameraSC.far = far;
				var frustumVolume = this.myCameraSC.frustum.computeCullingVolume(this.myCameraSC.position, this.myCameraSC.direction, this.myCameraSC.up);
				var advancedDist = 3.0;

				for(var i=0; i<6; i++)
				{
					var plane = frustumVolume.planes[i];
					this.myFrustumSC.planesArray[i].setNormalAndDistance(plane.x, plane.y, plane.z, plane.w);
				}
				
				
				//var advancedCamPosX = this.myCameraSC.position.x + advancedDist * this.myCameraSC.direction.x;
				//var advancedCamPosY = this.myCameraSC.position.y + advancedDist * this.myCameraSC.direction.y;
				//var advancedCamPosZ = this.myCameraSC.position.z + advancedDist * this.myCameraSC.direction.z;
				
				// get frustumCulled lowestOctrees classified by distances.************************************************************************************
				var lastLOD0LowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
				var lastLOD1LowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;	
				
				neoBuilding.currentVisibleOctreesControler.currentVisibles0.length = 0;
				neoBuilding.currentVisibleOctreesControler.currentVisibles1.length = 0;
				neoBuilding.currentVisibleOctreesControler.currentVisibles2.length = 0;
				neoBuilding.currentVisibleOctreesControler.currentVisibles3.length = 0;
				find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	this.myFrustumSC, neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctreesAux, this.boundingSphere_Aux,
																						this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z,
																						squaredDistLod0, squaredDistLod1, squaredDistLod2);
			}
			
			

			if(!find) {
				//var hola = 0;
				//this.deleteNeoBuilding(gl, neoBuilding);
				//neoBuilding.octree.deleteLod0GlObjects(gl);
				return;
			}
		}
		else
		{
			neoBuilding.currentVisibleOctreesControler.currentVisibles2.length = 0;
			neoBuilding.octree.extractLowestOctreesIfHasTriPolyhedrons(neoBuilding.currentVisibleOctreesControler.currentVisibles2);
		}
		
		// LOD0.*** check if the lod0lowestOctrees must load and parse data.************************************************************
		// LOD0.*** check if the lod0lowestOctrees must load and parse data.************************************************************
		// LOD0.*** check if the lod0lowestOctrees must load and parse data.************************************************************
		var geometryDataPath = this.readerWriter.geometryDataPath;
		var buildingFolderName = neoBuilding.buildingFileName;
		var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
		var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
		var lowestOctree;
		var lowestOctreesCount = neoBuilding.currentVisibleOctreesControler.currentVisibles0.length;

		for(var i=0; i<lowestOctreesCount; i++) {

			lowestOctree = neoBuilding.currentVisibleOctreesControler.currentVisibles0[i];
			if(lowestOctree.triPolyhedronsCount == 0) 
				continue;

			if(lowestOctree.neoReferencesMotherAndIndices == undefined)
			{
				lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
				lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
			}
			else
			{
				var isExterior = !isCameraInsideOfBuilding;
				lowestOctree.neoReferencesMotherAndIndices.updateCurrentVisibleIndices(isExterior, this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);
			}
			
			// if the octree has no blocks list ready, then render the lego.*****************************************
			var myBlocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
			if(myBlocksList == undefined || myBlocksList.fileLoadState != CODE.fileLoadState.PARSE_FINISHED)
			{
				neoBuilding.currentVisibleOctreesControler.currentVisibles2.push(lowestOctree);
			}
		}

		// LOD 1.****************************************************************************************************************
		// LOD 1.****************************************************************************************************************
		// LOD 1.****************************************************************************************************************
		if(neoBuilding.buildingType == "outfitting")
			return;

		lowestOctreesCount = neoBuilding.currentVisibleOctreesControler.currentVisibles1.length;
		for(var i=0; i<lowestOctreesCount; i++) {

			lowestOctree = neoBuilding.currentVisibleOctreesControler.currentVisibles1[i];
			if(lowestOctree.triPolyhedronsCount == 0) 
				continue;
			
			if(lowestOctree.neoReferencesMotherAndIndices == undefined)
			{
				lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
				lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
			}
			else
			{
				var isExterior = !isCameraInsideOfBuilding;
				lowestOctree.neoReferencesMotherAndIndices.updateCurrentVisibleIndices(isExterior, this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);
			}
			
			// if the octree has no blocks list ready, then render the lego.*****************************************
			var myBlocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
			if(myBlocksList == undefined || myBlocksList.fileLoadState != CODE.fileLoadState.PARSE_FINISHED)
			{
				neoBuilding.currentVisibleOctreesControler.currentVisibles2.push(lowestOctree);
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

CesiumManager.prototype.prepareVisibleOctreesAsimetricVersion = function(gl, scene, neoBuilding) {

	if(this.fileRequestControler.filesRequestedCount >= this.fileRequestControler.maxFilesRequestedCount)
		return;
	
	var refList;
	var maxRefListParsingCount = 30;
	var refListsParsingCount = 0;
	
	var visibleObjControlerOctrees = neoBuilding.currentVisibleOctreesControler;
	if(visibleObjControlerOctrees == undefined)
		return;

	

	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var lowestOctree;
	var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;

	for(var i=0; i<lowestOctreesCount; i++) {

		lowestOctree = visibleObjControlerOctrees.currentVisibles0[i];
		if(lowestOctree.triPolyhedronsCount == 0) 
			continue;
		
		if(lowestOctree.octree_number_name == undefined)
			continue;
		
		if(lowestOctree.neoReferencesMotherAndIndices == undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
		}

		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == 0)
		{
			if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
			{
				if(lowestOctree.neoReferencesMotherAndIndices.blocksList == undefined)
					lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList();

				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var buildingFolderName = neoBuilding.buildingFileName;
				var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
				var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
				this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree.neoReferencesMotherAndIndices, this);
			}
			else
				return;

			// test
			//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
			continue;
		}

		// 2 = file loading finished.***
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {

			if(refListsParsingCount < maxRefListParsingCount) {
				// must parse the arraybuffer data.***
				var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				this.matrix4SC.setByFloat32Array(buildingGeoLocation.rotMatrix._floatArrays);
				lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC);
				lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
				lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
				refListsParsingCount += 1;
			}

		} else if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.PARSE_FINISHED ) {
			// 4 = parsed.***
			// now, check if the blocksList is loaded & parsed.***
			var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
			// 0 = file loading NO started.***
			if(blocksList.fileLoadState == CODE.fileLoadState.READY) {
				if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount) {
					// must read blocksList.***
					var geometryDataPath = this.readerWriter.geometryDataPath;
					var buildingFolderName = neoBuilding.buildingFileName;
					var subOctreeNumberName = lowestOctree.octree_number_name.toString();
					var buildingFolderName = neoBuilding.buildingFileName;
					var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
					var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
					this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);
				}
				else
				return;

				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
				continue;
			}
		}
		
		// if the lowest octree is not ready to render, then:
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState != CODE.fileLoadState.PARSE_FINISHED )
		{
			visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
		}
		
	}

	// LOD 1.*************************************************************************************************************************************************
	// LOD 1.*************************************************************************************************************************************************
	// LOD 1.*************************************************************************************************************************************************
	lowestOctreesCount = visibleObjControlerOctrees.currentVisibles1.length;
	for(var i=0; i<lowestOctreesCount; i++) {
		lowestOctree = visibleObjControlerOctrees.currentVisibles1[i];
		if(lowestOctree.octree_number_name == undefined)
			continue;
		
		if(lowestOctree.neoReferencesMotherAndIndices == undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
		}

		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == 0)
		{
			if(this.fileRequestControler.filesRequestedCount < this.fileRequestControler.maxFilesRequestedCount)
			{
				if(lowestOctree.neoReferencesMotherAndIndices.blocksList == undefined)
					lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList();

				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var buildingFolderName = neoBuilding.buildingFileName;
				var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
				var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
				this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree.neoReferencesMotherAndIndices, this);

			}
			else
				return;
			// test
			//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);

			continue;
		}
		// 2 = file loading finished.***
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState == CODE.fileLoadState.LOADING_FINISHED) {
			if(refListsParsingCount < maxRefListParsingCount) {
				// must parse the arraybuffer data.***
				var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				this.matrix4SC.setByFloat32Array(buildingGeoLocation.rotMatrix._floatArrays);
				lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC);
				lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
				lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
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
					var subOctreeNumberName = lowestOctree.octree_number_name.toString();
					var buildingFolderName = neoBuilding.buildingFileName;
					var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
					var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
					this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, blocksList, this);
				}
				else
					return;
				// test
				//visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
				continue;
			}
		}
		
		// if the lowest octree is not ready to render, then:
		if(lowestOctree.neoReferencesMotherAndIndices.fileLoadState != CODE.fileLoadState.PARSE_FINISHED )
		{
			visibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
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

CesiumManager.prototype.prepareVisibleOctreesAsimetricVersionLOD2 = function(gl, scene, neoBuilding) {

	if(this.fileRequestControler.filesRequestedCount >= this.fileRequestControler.maxFilesRequestedCount)
		return;
	
	var refList;
	var maxRefListParsingCount = 30;
	var refListsParsingCount = 0;
	
	var visibleObjControlerOctrees = neoBuilding.currentVisibleOctreesControler;
	if(visibleObjControlerOctrees == undefined)
		return;

	//if(this.isCameraInsideNeoBuilding && neoBuilding.octree != undefined) // original.***

	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	// LOD0.*** check if the lod0lowestOctrees must load and parse data.***********************************************************************************
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var lowestOctree;
	var lowestOctreesCount = visibleObjControlerOctrees.currentVisibles0.length;
	var lowestOctreeLegosParsingCount = 0;

	lowestOctreesCount = neoBuilding.currentVisibleOctreesControler.currentVisibles2.length;
	for(var j=0; j<lowestOctreesCount; j++) {
		lowestOctree = neoBuilding.currentVisibleOctreesControler.currentVisibles2[j];
		
		if(lowestOctree.octree_number_name == undefined)
			continue;
		
		if(lowestOctree.lego == undefined) {
			lowestOctree.lego = new Lego();
			lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
		}

		if(lowestOctree.lego == undefined && lowestOctree.lego.dataArrayBuffer == undefined) 
			continue;

		if(neoBuilding.buildingType == "outfitting")
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
		
		// finally check if there are legoSimpleBuildingTexture.***
		if(lowestOctree.lego.vbo_vicks_container.vboCacheKeysArray[0] && lowestOctree.lego.vbo_vicks_container.vboCacheKeysArray[0].tcoordVboDataArray)
		{
			if(neoBuilding.simpleBuilding3x3Texture == undefined)
			{
				neoBuilding.simpleBuilding3x3Texture = new Texture();
				var buildingFolderName = neoBuilding.buildingFileName;
				var filePath_inServer = this.readerWriter.geometryDataPath + "/" + buildingFolderName + "/SimpleBuildingTexture3x3.bmp";
				this.readerWriter.readLegoSimpleBuildingTexture(gl, filePath_inServer, neoBuilding.simpleBuilding3x3Texture, this);
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
			var neoRefsCount = neoRefList.neoRefs_Array.length;
			for(var j = 0; j < neoRefsCount; j++) {
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

CesiumManager.prototype.renderLowestOctreeAsimetricVersion = function(gl, cameraPosition, scene, shader, renderTexture, ssao_idx, visibleObjControlerBuildings) {
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	gl.frontFace(gl.CCW);
	//gl.depthFunc(gl.GREATER);
	//gl.enable(gl.CULL_FACE);
	gl.depthRange(0.0, 1.0);
	
	gl.enable(gl.DEPTH_TEST);

	if(ssao_idx == -1) {
		// is selection.***
	} else {

		var isInterior = false; // no used.***

		var currentShader;
		var shaderProgram;
		var lowestOctree;
		var refList;
		var neoBuilding;
		var lowestOctreesCount;
//		var refListsParsingCount = 0;
//		var maxRefListParsingCount = 10;

		renderTexture = false;
		var lowestOctreeLegosParsingCount = 0;

		// Test render in lego.***
		if(ssao_idx == 0) {
			
			gl.disable(gl.BLEND);
			this.depthRenderLowestOctreeAsimetricVersion(gl, ssao_idx, visibleObjControlerBuildings);
		}
		if(ssao_idx == 1) {
			
			// 2) ssao render.************************************************************************************************************
			// 2) ssao render.************************************************************************************************************
			// 2) ssao render.************************************************************************************************************
			var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles0.length;
			if(neoBuildingsCount > 0)
			{
				if(this.noiseTexture == undefined) 
					this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels);

				currentShader = this.postFxShadersManager.pFx_shaders_array[4];

				shaderProgram = currentShader.program;
				gl.useProgram(shaderProgram);
				
				gl.enableVertexAttribArray(currentShader.texCoord2_loc);
				gl.enableVertexAttribArray(currentShader.position3_loc);
				gl.enableVertexAttribArray(currentShader.normal3_loc);
				
				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
				gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.sceneState.normalMatrix4._floatArrays);
				gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
				gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);

				gl.uniform1f(currentShader.fov_loc, this.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
				gl.uniform1f(currentShader.aspectRatio_loc, this.sceneState.camera.frustum.aspectRatio);
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
				gl.uniform1f(currentShader.screenHeight_loc, this.sceneState.drawingBufferHeight);
				gl.uniform1f(currentShader.shininessValue_loc, 40.0);

				gl.uniform1i(currentShader.depthTex_loc, 0);
				gl.uniform1i(currentShader.noiseTex_loc, 1);
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***

				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
				
				gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
				
				//gl.clearStencil(0);
				this.visibleObjControlerOctreesAux.initArrays();
				
				// 1) LOD0 & LOD1.*********************************************************************************************************************
				// 1) LOD0 & LOD1.*********************************************************************************************************************
				// 1) LOD0 & LOD1.*********************************************************************************************************************
				var refTMatrixIdxKey = 0;
				var minSize = 0.0;
				var renderTexture;
				if(this.isLastFrustum)
				{
					this.renderer.renderNeoBuildingsAsimetricVersion(gl, visibleObjControlerBuildings, this, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
				}
				
				if(currentShader)
				{
					if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
					if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
					if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
				}

			}
			// 2) LOD 2 & 3.************************************************************************************************************************************
			// 2) LOD 2 & 3.************************************************************************************************************************************
			// 2) LOD 2 & 3.************************************************************************************************************************************
			
			var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
			if(neoBuildingsCount > 0)
			{
				currentShader = this.postFxShadersManager.pFx_shaders_array[8]; // lodBuilding ssao.***
				shaderProgram = currentShader.program;
				gl.useProgram(shaderProgram);
				gl.enableVertexAttribArray(currentShader.position3_loc);
				gl.enableVertexAttribArray(currentShader.normal3_loc);
				gl.enableVertexAttribArray(currentShader.color4_loc);

				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);

				gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
				gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);

				gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.sceneState.normalMatrix4._floatArrays);
				//-----------------------------------------------------------------------------------------------------
				gl.uniform1i(currentShader.hasAditionalMov_loc, true);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				gl.uniform1i(currentShader.hasTexture_loc, false); // initially false.***
				gl.uniform1i(currentShader.textureFlipYAxis_loc,this.sceneState.textureFlipYAxis);

				gl.uniform1i(currentShader.depthTex_loc, 0);
				gl.uniform1i(currentShader.noiseTex_loc, 1);
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
				gl.uniform1f(currentShader.fov_loc, this.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
				gl.uniform1f(currentShader.aspectRatio_loc, this.sceneState.camera.frustum.aspectRatio);
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
				gl.uniform1f(currentShader.screenHeight_loc, this.sceneState.drawingBufferHeight);

				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
				gl.activeTexture(gl.TEXTURE2); 
				gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);

				this.renderer.renderNeoBuildingsLOD2AsimetricVersion(gl, visibleObjControlerBuildings, this, currentShader, renderTexture, ssao_idx);
				
				if(currentShader)
				{
					if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
					if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
					if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
				}
			}
			
			// If there are an object selected, then there are a stencilBuffer.******************************************
			
			if(this.buildingSelected && this.objectSelected) // if there are an object selected then there are a building selected.***
			{
				/*
				neoBuilding = this.buildingSelected;
				var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				var neoReferencesMotherAndIndices = this.octreeSelected.neoReferencesMotherAndIndices;
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				
				// do as the "getSelectedObjectPicking".**********************************************************
				currentShader = this.postFxShadersManager.pFx_shaders_array[5]; // color selection shader.***
				var shaderProgram = currentShader.program;
				gl.useProgram(shaderProgram);
				
				gl.enableVertexAttribArray(currentShader.position3_loc);
				
				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
				
				// do the colorCoding render.***
				// position uniforms.***
				gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
				gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
				//gl.uniform4fv(currentShader.color4Aux_loc, [1.0, 0.0, 0.0, 1.0]);
				
				// Active stencil if the object selected.****************************************************************************************************************
				//gl.enable(gl.STENCIL_TEST);
				//gl.clearStencil(0);
				//gl.clear(gl.STENCIL_BUFFER_BIT);
				//gl.stencilFunc(gl.ALWAYS, 1, 1);
				//gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
				//gl.disable(gl.CULL_FACE);
				//this.renderer.renderNeoReferenceAsimetricVersionColorSelection(gl, this.objectSelected, neoReferencesMotherAndIndices, neoBuilding, this, currentShader, maxSizeToRender, refMatrixIdxKey, glPrimitive);
				//-------------------------------------------------------------------
				
				gl.uniform4fv(currentShader.color4Aux_loc, [0.0, 1.0, 0.0, 1.0]);
				gl.enable(gl.STENCIL_TEST);
				gl.disable(gl.POLYGON_OFFSET_FILL);
				gl.disable(gl.CULL_FACE);
				//gl.colorMask(true, true, true, true);
				//gl.depthMask(true);
				gl.depthRange(0, 0);
				
				//gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
				gl.stencilFunc(gl.EQUAL, 0, 1);
				gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
					
				glPrimitive = gl.POINTS;
				//gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );
				this.renderer.renderNeoReferenceAsimetricVersionColorSelection(gl, this.objectSelected, neoReferencesMotherAndIndices, neoBuilding, this, currentShader, maxSizeToRender, refMatrixIdxKey, glPrimitive);
				gl.enable(gl.DEPTH_TEST);// return to the normal state.***
				gl.disable(gl.STENCIL_TEST);
				gl.depthRange(0, 1);// return to the normal value.***
				//gl.disableVertexAttribArray(currentShader.position3_loc);
				
				if(currentShader)
				{
					if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
					if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
					if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
				}
				*/
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

				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);

				gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
				gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);

				gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.sceneState.normalMatrix4._floatArrays);
				//-----------------------------------------------------------------------------------------------------------

				gl.uniform1i(currentShader.hasAditionalMov_loc, true);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				gl.uniform1i(currentShader.bScale_loc, true);

				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.0, 1.0, 1.0]); //.***

				gl.uniform1i(currentShader.depthTex_loc, 0);
				gl.uniform1i(currentShader.noiseTex_loc, 1);
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
				gl.uniform1f(currentShader.fov_loc, this.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
				gl.uniform1f(currentShader.aspectRatio_loc, this.sceneState.camera.frustum.aspectRatio);
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
				gl.uniform1f(currentShader.screenHeight_loc, this.sceneState.drawingBufferHeight);


				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);

				var visibleBuildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
				for(var b=0; b<visibleBuildingsCount; b++)
				{
					neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[b];
					gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***
					var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

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
					gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***

					var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

					this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
					gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
					this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, neoBuilding.isHighLighted);
				}
				
				if(currentShader)
				{
					if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
					if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
					if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
				}
			}
			
			// 4) Render ObjectMarkers.********************************************************************************************************
			// 4) Render ObjectMarkers.********************************************************************************************************
			// 4) Render ObjectMarkers.********************************************************************************************************
			var objectsMarkersCount = this.objMarkerManager.objectMarkerArray.length;
			if(objectsMarkersCount > 0)
			{
				/*
				currentShader = this.postFxShadersManager.pFx_shaders_array[12]; // box ssao.***
				shaderProgram = currentShader.program;
				gl.useProgram(shaderProgram);
				gl.enableVertexAttribArray(currentShader.position3_loc);
				gl.enableVertexAttribArray(currentShader.normal3_loc);
				gl.disableVertexAttribArray(currentShader.color4_loc);

				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
				gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);

				gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
				gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);

				gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.sceneState.normalMatrix4._floatArrays);
				//-----------------------------------------------------------------------------------------------------------

				gl.uniform1i(currentShader.hasAditionalMov_loc, true);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
				gl.uniform1i(currentShader.bScale_loc, true);

				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.0, 1.0, 1.0]); //.***

				gl.uniform1i(currentShader.depthTex_loc, 0);
				gl.uniform1i(currentShader.noiseTex_loc, 1);
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
				gl.uniform1f(currentShader.fov_loc, this.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
				gl.uniform1f(currentShader.aspectRatio_loc, this.sceneState.camera.frustum.aspectRatio);
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	//scene._canvas.width, scene._canvas.height
				gl.uniform1f(currentShader.screenHeight_loc, this.sceneState.drawingBufferHeight);


				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
				var boxLengthX = 0.1;
				var boxLengthY = 0.1;
				var boxLengthZ = 0.1;
				var isHighLighted = false;
				for(var i=0; i<objectsMarkersCount; i++)
				{
					var objMarker = this.objMarkerManager.objectMarkerArray[i];
					//neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[b];
					gl.uniform3fv(currentShader.scale_loc, [boxLengthX, boxLengthY, boxLengthZ]); //.***

					var buildingGeoLocation = objMarker.geoLocationData;
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

					this.pointSC.set(0.0, 0.0, 0.0);
					gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
					this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, isHighLighted);
				}
				if(currentShader)
				{
					if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
					if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
					if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
				}
				*/
				
				// now repeat the objects markers for png images.***
				// Png for pin image 128x128.********************************************************************
				if(this.pin.positionBuffer == undefined)
					this.pin.createPin(gl);
				
				currentShader = this.postFxShadersManager.pFx_shaders_array[13]; // png image shader.***
				
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
				for(var i=0; i<objectsMarkersCount; i++)
				{
					if(j>= this.pin.texturesArray.length)
						j=0;
					
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
				gl.disableVertexAttribArray(currentShader.texCoord2_loc);
				gl.disableVertexAttribArray(currentShader.position3_loc);
				
			}
			
		}
		
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		if(currentShader)
		{
			if(currentShader.texCoord2_loc != -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
			if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
			if(currentShader.normal3_loc != -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
			if(currentShader.color4_loc != -1)gl.disableVertexAttribArray(currentShader.color4_loc);
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

CesiumManager.prototype.depthRenderLowestOctreeAsimetricVersion = function(gl, ssao_idx, visibleObjControlerBuildings) {
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	

	var isInterior = false; // no used.***

	var currentShader;
	var shaderProgram;
	var lowestOctree;
	var refList;
	var neoBuilding;
	var lowestOctreesCount;
//		var refListsParsingCount = 0;
//		var maxRefListParsingCount = 10;

	var renderTexture = false;
	
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles0.length;
	if(neoBuildingsCount > 0)
	{
		// LOD 0. Render detailed.***
		currentShader = this.postFxShadersManager.pFx_shaders_array[3]; // neo depth.***
		shaderProgram = currentShader.program;

		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(currentShader.position3_loc);

		gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
		gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
		gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
		gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
		gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
		gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);

		gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
		gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);

		// renderDepth for all buildings.***
		// 1) LOD 0 & LOD1.*********************************************************************************************************************
		// 1) LOD 0 & LOD1.*********************************************************************************************************************
		// 1) LOD 0 & LOD1.*********************************************************************************************************************
		var refTMatrixIdxKey = 0;
		var minSize = 0.0;
		if(this.isLastFrustum)
		{
			this.renderer.renderNeoBuildingsAsimetricVersion(gl, visibleObjControlerBuildings, this, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
		}
	}
	if(currentShader)
	{
		//if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	}
	
	// 2) LOD 2 & 3.************************************************************************************************************************************
	// 2) LOD 2 & 3.************************************************************************************************************************************
	// 2) LOD 2 & 3.************************************************************************************************************************************
	
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
	if(neoBuildingsCount > 0)
	{
		currentShader = this.postFxShadersManager.pFx_shaders_array[7]; // lodBuilding depth.***
		shaderProgram = currentShader.program;
		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(currentShader.position3_loc);

		gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
		gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
		gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
		gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
		gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
		gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);

		gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
		gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);

		gl.uniform1i(currentShader.hasAditionalMov_loc, true);
		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		
		this.renderer.renderNeoBuildingsLOD2AsimetricVersion(gl, visibleObjControlerBuildings, this, currentShader, renderTexture, ssao_idx);

		//if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	}
	
	if(currentShader)
	{
		//if(currentShader.position3_loc != -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
CesiumManager.prototype.createDefaultShaders = function(gl) {
	// here creates the necessary shaders for mago3d.***
	// 1) ModelReferences ssaoShader.******************************************************************************
	var shaderName = "modelReferencesSsao";
	var shader = this.postFxShadersManager.newShader(shaderName);
	var ssao_vs_source = ShaderSource.modelRefSsaoVsSource;
	var ssao_fs_source = ShaderSource.modelRefSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	var uniformDataPair;
	uniformDataPair = shader.newUniformDataPair("Matrix4fv", "mvpMat4RelToEye");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	uniformDataPair.matrix4fv = this.sceneState.modelViewProjRelToEyeMatrix._floatArrays;
	
	uniformDataPair = shader.newUniformDataPair("Matrix4fv", "mvMat4RelToEye");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	uniformDataPair.matrix4fv = this.sceneState.modelViewRelToEyeMatrix._floatArrays;
	
	uniformDataPair = shader.newUniformDataPair("Matrix4fv", "pMat4");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "projectionMatrix");
	uniformDataPair.matrix4fv = this.sceneState.projectionMatrix._floatArrays;
	
	uniformDataPair = shader.newUniformDataPair("Vec3fv", "encodedCamPosHigh");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	uniformDataPair.vec3fv = this.sceneState.encodedCamPosHigh;
	
	uniformDataPair = shader.newUniformDataPair("Vec3fv", "encodedCamPosLow");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	uniformDataPair.vec3fv = this.sceneState.encodedCamPosLow;
	
	uniformDataPair = shader.newUniformDataPair("Matrix4fv", "normalMat4");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "normalMatrix4");
	uniformDataPair.matrix4fv = this.sceneState.normalMatrix4._floatArrays;
	
	uniformDataPair = shader.newUniformDataPair("1f", "frustumFar");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "far");
	uniformDataPair.floatValue = this.sceneState.camera.frustum.far;
	
	uniformDataPair = shader.newUniformDataPair("1f", "fovy");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "fov");
	uniformDataPair.floatValue = this.sceneState.camera.frustum.fovyRad;
	
	uniformDataPair = shader.newUniformDataPair("1f", "aspectRatio");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "aspectRatio");
	uniformDataPair.floatValue = this.sceneState.camera.frustum.aspectRatio;
	
	uniformDataPair = shader.newUniformDataPair("1i", "drawBuffWidht");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "screenWidth");
	uniformDataPair.intValue = this.sceneState.drawingBufferWidth;
	
	uniformDataPair = shader.newUniformDataPair("1i", "drawBuffHeight");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "screenHeight");
	uniformDataPair.intValue = this.sceneState.drawingBufferHeight;
	
			//gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
			//gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
			
	uniformDataPair = shader.newUniformDataPair("1i", "depthTex");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "depthTex");
	uniformDataPair.intValue = 0;
	
	uniformDataPair = shader.newUniformDataPair("1i", "noiseTex");
	uniformDataPair.uniformLocation = gl.getUniformLocation(shader.program, "noiseTex");
	uniformDataPair.intValue = 1;
	
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
			var neoRefsCount = neoRefList.neoRefs_Array.length;
			for(var j=0; j<neoRefsCount; j++) {
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

	// create the default blocks_lists.*****************************
	if(neoBuilding._blocksList_Container && neoBuilding._blocksList_Container.blocksListsArray.length > 0) {
		neoBuilding._blocksList_Container.blocksListsArray[0].deleteGlObjects(gl);
		neoBuilding._blocksList_Container.blocksListsArray[0] = undefined;
		neoBuilding._blocksList_Container.blocksListsArray = undefined;
	}
	neoBuilding._blocksList_Container = undefined;

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
CesiumManager.prototype.doFrustumCullingNeoBuildings = function(frustumVolume, cameraPosition) {
	// This makes the visible buildings array.***
	// This has Cesium dependency because uses the frustumVolume and the boundingSphere of cesium.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***

	var squaredDistToCamera;
	this.detailed_neoBuilding;

	var lod0_minSquaredDist = 10000;
	var lod1_minSquaredDist = 1;
	var lod2_minSquaredDist = 100000*10000;
	var lod3_minSquaredDist = 100000*9;

	this.visibleObjControlerBuildings.currentVisibles0.length = 0;
	this.visibleObjControlerBuildings.currentVisibles1.length = 0;
	this.visibleObjControlerBuildings.currentVisibles2.length = 0;
	this.visibleObjControlerBuildings.currentVisibles3.length = 0;

	//this.visibleObjControlerBuildings.initArrays();
	var heading = 0.0;
	var pitch = 0.0;
	var roll = 0.0;

	var maxNumberOfCalculatingPositions = 100;
	var currentCalculatingPositionsCount = 0;
	var neoBuildings_count = this.neoBuildingsList.neoBuildingsArray.length;
	
	
	for(var i=0; i<neoBuildings_count; i++) {
		//if(this.neoBuildingsList.neoBuildingsArray[i].frustumCulled)
		//	continue;

		var neoBuilding = this.neoBuildingsList.neoBuildingsArray[i];

		if(this.renderingModeTemp == 2)
		{
			if(neoBuilding.isDemoBlock == false)
				continue;
		}
		/*
		if(!this.magoPolicy.getShowOutFitting())
		{
			if(neoBuilding.buildingType == "outfitting")
				continue;
		}
		*/

		if(neoBuilding.buildingId == "buggy")
		{
			var hola = 0;
		}

		if(neoBuilding.bbox == undefined)
		{
			if(currentCalculatingPositionsCount < maxNumberOfCalculatingPositions)
			{
				this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
				currentCalculatingPositionsCount++;
			}
			continue;
		}

		this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
		var realBuildingPos = undefined; // necesary init to undefined.***
		
		var geoLoc = neoBuilding.geoLocDataManager.getGeoLocationData(0); // the idx = 0 -> is the 1rst (default).***
			if(geoLoc == undefined)
				continue;

		realBuildingPos = geoLoc.pivotPoint;

		if(realBuildingPos == undefined)
			continue;
		if(neoBuilding.buildingId == "Grendizer")
		{
			var hola = 0;
		}
		
		if(neoBuilding.buildingType == "basicBuilding")
		{
			//squaredDistLod0 = 500;
			//squaredDistLod1 = 55000;
			//squaredDistLod2 = 500000*1000;
			lod0_minSquaredDist = 50000.0;
			var hola = 0;
		}
		//squareDistTo
		//squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, realBuildingPos); // old.***
		squaredDistToCamera = cameraPosition.squareDistTo(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
		//if(squaredDistToCamera > this.min_squaredDist_to_see)
		if(squaredDistToCamera > this.magoPolicy.getFrustumFarSquaredDistance())
		{
			//this.deleteNeoBuilding(this.scene._context._gl, neoBuilding); // original.***
			this.deleteNeoBuilding(this.sceneState.gl, neoBuilding);
			continue;
		}
		
		
		
		var intersects = false;
		/*
		if(this.configInformation.geo_view_library === Constant.WORLDWIND)
		{
			if(neoBuilding.provisionalSegmentsArray == undefined)
			{
				neoBuilding.provisionalSegmentsArray = [];
				var auxSegment = new AuxiliarSegment();
				auxSegment.point1 = new WorldWind.Vec3();
				auxSegment.point2 = new WorldWind.Vec3();
				auxSegment.setPoints(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z,   realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
				neoBuilding.provisionalSegmentsArray.push(auxSegment);
			}
			intersects = frustumVolume.intersectsSegment(neoBuilding.provisionalSegmentsArray[0].point1, neoBuilding.provisionalSegmentsArray[0].point2); // www.***
		}
		else if(this.configInformation.geo_view_library === Constant.CESIUM)
			*/
		{
			/*
			if(this.boundingSphere_Aux == undefined)
				this.boundingSphere_Aux = new Cesium.BoundingSphere();

			this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
			if(this.renderingModeTemp == 0)
				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
			else if(this.renderingModeTemp == 1)
				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 4.2/2.0;
			else if(this.renderingModeTemp == 2)
				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;

			if(this.radiusAprox_aux) {
				this.boundingSphere_Aux.radius = this.radiusAprox_aux;
			} else {
				this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
			}
		
			var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux); // cesium.***
			if(frustumCull != Cesium.Intersect.OUTSIDE) {
				intersects = true;
			}
			*/
			if(this.boundingSphere_Aux == undefined)
				this.boundingSphere_Aux = new Sphere();
				
			this.boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
			
			if(this.renderingModeTemp == 0)
				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
			else if(this.renderingModeTemp == 1)
				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 4.2/2.0;
			else if(this.renderingModeTemp == 2)
				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;

			if(this.radiusAprox_aux) {
				this.boundingSphere_Aux.setRadius(this.radiusAprox_aux);
			} else {
				this.boundingSphere_Aux.setRadius(50.0); // 50m. Provisional.***
			}
			
			var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
			if(frustumCull != Constant.INTERSECTION_OUTSIDE) {
				intersects = true;
			}
		}
			
		//var 
		
		if(intersects) {
			// min dist to see detailed.***
			if(this.isLastFrustum)
			{
				if(squaredDistToCamera < lod0_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
				} else if(squaredDistToCamera < lod1_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
				} else if(squaredDistToCamera < lod2_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
				} else if(squaredDistToCamera < lod3_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
				}
			}
			else{
				if(squaredDistToCamera < lod1_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
				} else if(squaredDistToCamera < lod2_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
				} else if(squaredDistToCamera < lod3_minSquaredDist) {
					this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
				}
			}
			//neoBuilding.frustumCulled = true;
		}
		else
		{
			//neoBuilding.frustumCulled = true;
			this.deleteNeoBuilding(this.sceneState.gl, neoBuilding);
		}
	}
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
CesiumManager.prototype.flyToBuilding = function(dataKey) {
	var neoBuilding = this.getNeoBuildingById(null, dataKey);

	if(neoBuilding == undefined)
		return;

	// calculate realPosition of the building.****************************************************************************
	var realBuildingPos;
	if(this.renderingModeTemp == 1 || this.renderingModeTemp == 2) // 0 = assembled mode. 1 = dispersed mode.***
	{
		if(neoBuilding.geoLocationDataAux == undefined) {
			var realTimeLocBlocksList = MagoConfig.getData().alldata;
			var newLocation = realTimeLocBlocksList[neoBuilding.dataKey];
			// must calculate the realBuildingPosition (bbox_center_position).***

			if(newLocation) {
				neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(newLocation.LONGITUDE, newLocation.LATITUDE, newLocation.ELEVATION, heading, pitch, roll, neoBuilding.geoLocationDataAux, this);
				this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
				//realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
				realBuildingPos = neoBuilding.geoLocationDataAux.pivotPoint;
			} else {
				// use the normal data.***
				this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
				realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
			}
		} else {
			this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
			//realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
			realBuildingPos = neoBuilding.geoLocationDataAux.pivotPoint;
		}
	} else {
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
		realBuildingPos = buildingGeoLocation.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
	}
	// end calculating realPosition of the building.------------------------------------------------------------------------

	if(realBuildingPos == undefined)
		return;

	//
	
	if(this.renderingModeTemp == 0)
		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
	if(this.renderingModeTemp == 1)
		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
	if(this.renderingModeTemp == 2)
		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;

	this.boundingSphere_Aux.radius = this.radiusAprox_aux;

	//var position = new Cesium.Cartesian3(this.pointSC.x, this.pointSC.y, this.pointSC.z);
	//var cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	if(this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
		var viewer = this.scene.viewer;
		var seconds = 3;
		this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, seconds);
	}
	else if(this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		//this.boundingSphere_Aux.center = realBuildingPos;
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		var geographicCoord = buildingGeoLocation.geographicCoord;
		this.wwd.goToAnimator.travelTime = 3000;
		this.wwd.goTo(new WorldWind.Position(geographicCoord.latitude, geographicCoord.longitude, geographicCoord.altitude + 1000));
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
CesiumManager.prototype.getNeoBuildingById = function(buildingType, buildingId) {
	var buildingCount = this.neoBuildingsList.neoBuildingsArray.length;
	var find = false;
	var i=0;
	var resultNeoBuilding;
	while(!find && i<buildingCount) {
		if(buildingType)
		{
			if(this.neoBuildingsList.neoBuildingsArray[i].buildingId == buildingId && this.neoBuildingsList.neoBuildingsArray[i].buildingType == buildingType) {
				find = true;
				resultNeoBuilding = this.neoBuildingsList.neoBuildingsArray[i];
			}
		}
		else{
			if(this.neoBuildingsList.neoBuildingsArray[i].buildingId == buildingId) {
				find = true;
				resultNeoBuilding = this.neoBuildingsList.neoBuildingsArray[i];
			}
		}
		i++;
	}

	return resultNeoBuilding;
};

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
	var buildingsCount = this.neoBuildingsList.neoBuildingsArray.length;
	for(var i=0; i<buildingsCount; i++)
	{
		this.neoBuildingsList.neoBuildingsArray[i].isHighLighted = false;
	}

	var buildingType = "structure";
	//var buildingType = "MSP"; khj(0331)
	var highLightingBuildingsCount = this.magoPolicy.highLightedBuildings.length;
	for(var i=0; i<highLightingBuildingsCount; i++)
	{
		var highLightedBuildingId = this.magoPolicy.highLightedBuildings[i];
		var highLightedBuilding = this.neoBuildingsList.getNeoBuildingByTypeId(buildingType, highLightedBuildingId.projectId + "_" + highLightedBuildingId.blockId);
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

};

CesiumManager.prototype.buildingColorChanged = function(projectAndBlockId, color)
{
	var neoBuilding = this.getNeoBuildingById("structure", projectAndBlockId);
	
	if(neoBuilding)
	{
		if(neoBuilding.aditionalColor == undefined)
		{
			neoBuilding.aditionalColor = new Color();
		}
		neoBuilding.isColorChanged = true;
		neoBuilding.aditionalColor.setRGB(color[0], color[1], color[2]);
	}
};

CesiumManager.prototype.objectColorChanged = function(projectAndBlockId, objectId, color)
{
	var neoBuilding = this.getNeoBuildingById("structure", projectAndBlockId);
	
	if(neoBuilding)
	{
		var neoReference;
		var neoReferencesCount = neoBuilding.motherNeoReferencesArray.length;
		var found = false;
		var i = 0;
		while(!found && i<neoReferencesCount)
		{
			if(neoBuilding.motherNeoReferencesArray[i])
			{
				if(neoBuilding.motherNeoReferencesArray[i].objectId == objectId)
				{
					neoReference = neoBuilding.motherNeoReferencesArray[i];
					found = true;
				}
			}
			i++;
		}
		
		if(neoReference)
		{
			if(neoReference.aditionalColor == undefined)
			{
				neoReference.aditionalColor = new Color();
			}
			
			neoReference.aditionalColor.setRGB(color[0], color[1], color[2]);
		}
	}
};

CesiumManager.prototype.policyColorChanged = function(projectAndBlockId, objectId)
{
	// old.***
	var neoBuilding = this.getNeoBuildingById("structure", projectAndBlockId);

	// 1rst, init colorChanged.***
	var buildingsCount = this.neoBuildingsList.neoBuildingsArray.length;
	for(var i=0; i<buildingsCount; i++)
	{
		this.neoBuildingsList.neoBuildingsArray[i].isColorChanged = false;
	}

	neoBuilding.isColorChanged = true;
	this.magoPolicy.colorChangedObjectId = objectId;

};

/**
 * 변환 행렬
 */
 
CesiumManager.prototype.displayLocationAndRotation = function(neoBuilding) {
	//var projectIdAndBlockId = neoBuilding.buildingId;
	var latitude, longitude, altitude, heading, pitch, roll;
	var geoLocationData = neoBuilding.geoLocDataManager.geoLocationDataArray[0];
	latitude = geoLocationData.geographicCoord.latitude;
	longitude = geoLocationData.geographicCoord.longitude;
	altitude = geoLocationData.geographicCoord.altitude;
	heading = geoLocationData.heading;
	pitch = geoLocationData.pitch;
	roll = geoLocationData.roll;
	
	var dividedName = neoBuilding.buildingId.split("_");
	showLocationAndRotationAPI(	dividedName[0],
								dividedName[1],
								null,
								geoLocationData.geographicCoord.latitude,
								geoLocationData.geographicCoord.longitude,
								geoLocationData.geographicCoord.altitude,
								geoLocationData.heading,
								geoLocationData.pitch,
								geoLocationData.roll);
	
};

/**
 * 변환 행렬
 */
CesiumManager.prototype.selectedObjectNotice = function(neoBuilding) {
	//var projectIdAndBlockId = neoBuilding.buildingId;
	var geoLocationData = neoBuilding.geoLocDataManager.geoLocationDataArray[0];
	var dividedName = neoBuilding.buildingId.split("_");
	
	if(MagoConfig.getPolicy().geo_callback_enable == "true") {
		var objectId = null;
		if(this.objectSelected != undefined) objectId = this.objectSelected.objectId;
		
		selectedObjectCallback(		MagoConfig.getPolicy().geo_callback_selectedobject,
									dividedName[0],
									dividedName[1],
									objectId,
									this.objMarkerSC.geoLocationData.geographicCoord.latitude,
									this.objMarkerSC.geoLocationData.geographicCoord.longitude,
									this.objMarkerSC.geoLocationData.geographicCoord.altitude,
									geoLocationData.heading,
									geoLocationData.pitch,
									geoLocationData.roll);
		
		// 이슈 등록 창 오픈
		if(this.magoPolicy.getIssueInsertEnable()) {
			if(this.objMarkerSC == undefined) return;
			
			insertIssueCallback(	MagoConfig.getPolicy().geo_callback_insertissue,
									dividedName[0] + "_" + dividedName[1],
									objectId,
									this.objMarkerSC.geoLocationData.geographicCoord.latitude,
									this.objMarkerSC.geoLocationData.geographicCoord.longitude,
									(parseFloat(this.objMarkerSC.geoLocationData.geographicCoord.altitude) + 10));
		}
	}
};

/**
 * 변환 행렬
 */
CesiumManager.prototype.changeLocationAndRotation = function(projectIdAndBlockId, latitude, longitude, elevation, heading, pitch, roll) {
	//var neoBuilding = this.getNeoBuildingById("structure", projectIdAndBlockId); // original for heavyIndustries.***
	var neoBuilding = this.getNeoBuildingById(undefined, projectIdAndBlockId);

	if(neoBuilding == undefined)
		return;
	var geoLocationData = neoBuilding.geoLocDataManager.geoLocationDataArray[0];
	geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, this);
	if(geoLocationData == undefined)
		return;

	this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC);
	ManagerUtils.translatePivotPointGeoLocationData(geoLocationData, this.pointSC );

	// now, must change the keyMatrix of the references of the octrees.***
	if(neoBuilding.octree)
	{
		neoBuilding.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
	}


	// repeat this for outfitting building.*********************************************************************************************************************
	// repeat this for outfitting building.*********************************************************************************************************************
	// repeat this for outfitting building.*********************************************************************************************************************
	var neoBuildingOutffiting = this.getNeoBuildingById("outfitting", projectIdAndBlockId);

	if(neoBuildingOutffiting == undefined)
		return;

	// "longitude", "latitude" and "elevation" is from the structure block.***
	geoLocationData = neoBuildingOutffiting.geoLocDataManager.geoLocationDataArray[0];
	geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, this);
	if(geoLocationData == undefined)
		return;

	this.pointSC = neoBuilding.bbox.getCenterPoint3d(this.pointSC); // the centerpoint is taken from structure block.***
	ManagerUtils.translatePivotPointGeoLocationData(geoLocationData, this.pointSC );

	// now, must change the keyMatrix of the references of the octrees.***
	if(neoBuildingOutffiting.octree)
	{
		neoBuildingOutffiting.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
	}
}

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
CesiumManager.prototype.createDeploymentGeoLocationsForHeavyIndustries = function() {
	// as the heavy industries special method, add new position for buildings.***.***
	var realTimeLocBlocksList = MagoConfig.getData().alldata;
	var neoBuildingsCount = this.neoBuildingsList.neoBuildingsArray.length;
	var neoBuilding;
	var newLocation;
	var structureTypedBuilding;
	var buildingGeoLocation;
	for(var i=0; i<neoBuildingsCount; i++) {
		neoBuilding = this.neoBuildingsList.neoBuildingsArray[i];
		if(i == 526)
		{
			var hola = 0;
		}
		
		if(neoBuilding.buildingType == "outfitting")
		{
			structureTypedBuilding = this.neoBuildingsList.getNeoBuildingByTypeId("structure", neoBuilding.buildingId);
		}
		else
			structureTypedBuilding = neoBuilding;

		if(structureTypedBuilding == undefined)
			continue;

		if(structureTypedBuilding.bbox == undefined)
			continue;
		
		if(neoBuilding.buildingId == "KICT_main")
		{
			var hola = 0;
		}
	
		newLocation = realTimeLocBlocksList[neoBuilding.buildingId];
		// must calculate the realBuildingPosition (bbox_center_position).***
		var longitude;
		var latitude;
		var altitude;
		var heading, pitch, roll;
		
		if(neoBuilding.buildingId == "gangnam_del")
		{
			var hola = 0;
		}
		
		//KICT_main_Arc_v3_with_spaces
			
		if(newLocation) {

			longitude = parseFloat(newLocation.longitude);
			latitude = parseFloat(newLocation.latitude);
			altitude = parseFloat(newLocation.height);
			heading = parseFloat(newLocation.heading);
			pitch = parseFloat(newLocation.pitch);
			roll = parseFloat(newLocation.roll);

			buildingGeoLocation = neoBuilding.geoLocDataManager.newGeoLocationData("deploymentLoc");
			ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude+10, heading, pitch, roll, buildingGeoLocation, this);
			
			this.pointSC = structureTypedBuilding.bbox.getCenterPoint3d(this.pointSC);
			ManagerUtils.translatePivotPointGeoLocationData(buildingGeoLocation, this.pointSC );
			////this.changeLocationAndRotation(neoBuilding.buildingId, latitude, longitude, altitude, heading, pitch, roll);
			////currentCalculatingPositionsCount ++;
		}
		else
		{
			// use the normal data. never enter here.***
			var hola = 0;
			var increLon = 0.001;
			var increLat = 0.001;
			/*
			if(neoBuilding.buildingType == "basicBuilding")
			{
				longitude = 128.594998;
				latitude = 34.904209;
				altitude = 40.0;
		
				buildingGeoLocation = neoBuilding.geoLocDataManager.newGeoLocationData("deploymentLoc");
				ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, buildingGeoLocation);
				
				this.pointSC = structureTypedBuilding.bbox.getCenterPoint3d(this.pointSC);
				ManagerUtils.translatePivotPointGeoLocationData(buildingGeoLocation, this.pointSC );
			}
			
			if(neoBuilding.buildingId == "gangbuk_cultur")
			{
				longitude = 128.596;
				latitude = 34.904;
				altitude = 40.0;
		
				buildingGeoLocation = neoBuilding.geoLocDataManager.newGeoLocationData("deploymentLoc");
				ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, buildingGeoLocation);
				
				this.pointSC = structureTypedBuilding.bbox.getCenterPoint3d(this.pointSC);
				ManagerUtils.translatePivotPointGeoLocationData(buildingGeoLocation, this.pointSC );
			}
			
			else continue;
			*/
		}
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */

CesiumManager.prototype.getObjectIndexFile = function() {
	if(this.configInformation == undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}
	this.readerWriter.getObjectIndexFile(	this.readerWriter.geometryDataPath + Constant.OBJECT_INDEX_FILE, this.readerWriter, this.neoBuildingsList, this);
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
	} else if(apiName === "searchData") {
		this.flyToBuilding(api.getDataKey());
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
			projectLayer.setBlockId(blockIds[i].trim());
			if(isExistObjectIds) projectLayer.setObjectId(objectIds[i].trim());
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
			if(isExistObjectIds) {
				for(var j=0, objectCount = objectIds.length; j<objectCount; j++) {
					var projectLayer = new ProjectLayer();
					projectLayer.setProjectId(projectId);
					projectLayer.setBlockId(blockIds[i].trim());
					projectLayer.setObjectId(objectIds[j].trim());
					colorBuilds.push(projectLayer);
				}
			} else {
				var projectLayer = new ProjectLayer();
				projectLayer.setProjectId(projectId);
				projectLayer.setBlockId(blockIds[i].trim());
				projectLayer.setObjectId(null);
				colorBuilds.push(projectLayer);
			}
		}
		this.magoPolicy.setColorBuildings(colorBuilds);

		var rgbColor = api.getColor().split(",");
		var rgbArray = [ rgbColor[0]/255, rgbColor[1]/255, rgbColor[2]/255 ] ;
		this.magoPolicy.setColor(rgbArray);
		
		var buildingsCount = colorBuilds.length;
		for(var i=0; i<buildingsCount; i++)
		{
			//var projectAndBlockId = projectId + "_" + blockIds[i]; // old.***
			var projectAndBlockId = colorBuilds[i].projectId + "_" + colorBuilds[i].blockId;
			if(colorBuilds[i].objectId == null)
			{
				this.buildingColorChanged(projectAndBlockId, rgbArray);
			}
			else{
				this.objectColorChanged(projectAndBlockId, colorBuilds[i].objectId, rgbArray);
			}
			
		}
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
	} else if(apiName === "changefrustumFarDistance") {
		// frustum culling 가시 거리
		this.magoPolicy.setFrustumFarSquaredDistance(api.getFrustumFarDistance() * api.getFrustumFarDistance());
	} else if(apiName === "changeLocationAndRotation") {
		// 변환 행렬
		// find the building.***
		var buildingId = api.getDataKey();
		var buildingType = "structure";
		var building = this.neoBuildingsList.getNeoBuildingByTypeId(buildingType, buildingId);

		this.changeLocationAndRotation(api.getDataKey(),
							parseFloat(api.getLatitude()),
							parseFloat(api.getLongitude()),
							parseFloat(api.getElevation()),
							parseFloat(api.getHeading()),
							parseFloat(api.getPitch()),
							parseFloat(api.getRoll()));
	} else if(apiName === "getLocationAndRotation") {
		return this.neoBuildingsList.getNeoBuildingByTypeId("structure", api.getProjectId() + "_" + api.getBlockId());
	} else if(apiName === "changeMouseMove") {
		this.magoPolicy.setMouseMoveMode(api.getMouseMoveMode());
	} else if(apiName === "changeInsertIssueMode") {
		this.magoPolicy.setIssueInsertEnable(api.getIssueInsertEnable());
		//selectedObjectCallback(이걸 해 주면 될거 같음)
	} else if(apiName === "changeObjectInfoViewMode") {
		// object info 표시
		this.magoPolicy.setObjectInfoViewEnable(api.getObjectInfoViewEnable());
	} else if(apiName === "changeListIssueViewMode") {
		// issue list 표시
		this.magoPolicy.setIssueListEnable(api.getIssueListEnable());
	} else if(apiName === "drawInsertIssueImage") {
		if(this.objMarkerSC == undefined) return;
		
		this.objMarkerManager.objectMarkerArray.push(this.objMarkerSC);
		this.objMarkerSC == undefined;
		// pin image를 그림
		// api.getIssueId(),
		// api.getDataKey(),
		// api.getLatitude()),
		// api.getLongitude()),
		// api.getElevation()),
	}
};
