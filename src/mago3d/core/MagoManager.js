'use strict';

/**
 * cesium을 관리
 * @class MagoManager
 */
var MagoManager = function() 
{
	if (!(this instanceof MagoManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// F4D Data structure & objects.*****************************************
	//this.bRBuildingProjectsList = new BRBuildingProjectsList(); // Old. Provisionally for old f4d projects.*** !!!
	this.terranTile = new TerranTile();// use this.***
	//this.neoBuildingsList = new NeoBuildingsList();
	this.renderer = new Renderer();
	//this.selection = new Selection();
	this.selectionCandidates = new SelectionCandidates();
	this.shadersManager = new ShadersManager();
	this.postFxShadersManager = new PostFxShadersManager();
	this.vBOManager = new VBOManager();
	this.readerWriter = new ReaderWriter();
	this.magoPolicy = new Policy();
	this.smartTileManager = new SmartTileManager();
	this.processQueue = new ProcessQueue();
	this.parseQueue = new ParseQueue();

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

	this.objectSelected;
	this.buildingSelected;
	this.octreeSelected;

	this.objMovState = 0; // 0 = no started. 1 = mov started.
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.startMovPoint = new Point3D();
	
	this.configInformation;
	this.cameraFPV = new FirstPersonView();

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
	this.vboMemoryManager = new VBOMemoryManager();

	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerBuildings = new VisibleObjectsController();
	this.visibleObjControlerOctrees = new VisibleObjectsController(); // delete this.***
	this.visibleObjControlerOctreesAux = new VisibleObjectsController(); // delete this.***
	
	this.currentVisibleNeoBuildings_array = []; 
	this.boundingSphere_Aux; 
	this.radiusAprox_aux;

	this.lastCamPos = new Point3D();
	this.squareDistUmbral = 22.0;

	this.lowestOctreeArray = [];

	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	this.isCameraMoving = false;
	this.isCameraInsideBuilding = false;
	this.isCameraInsideNeoBuilding = false;
	this.renderingFase = 0;

	this.renders_counter = 0;
	this.render_time = 0;
	this.bPicking = false;
	this.bObjectMarker = true;
	this.framesCounter = 0;

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
};

/**
 * noise texture를 생성
 * @param gl 변수
 * @param w 변수
 * @param h 변수
 * @param pixels 변수
 * @returns texture
 */
function genNoiseTextureRGBA(gl, w, h, pixels) 
{
	var texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//	var b = new ArrayBuffer(w*h*4);
	//var pixels = new Uint8Array(b);

	if (w === 4 && h === 4) 
	{
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
	}
	else 
	{
		for (var y=0; y<h; y++) 
		{
			for (var x=0; x<w; x++) 
			{
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
MagoManager.prototype.start = function(scene, pass, frustumIdx, numFrustums) 
{
	// Calculate FPS.
	//var start = new Date().getTime();
	
	// this is cesium version.***
	// mago3d 활성화가 아니면 화면을 그리지 않음
	if (!this.magoPolicy.getMagoEnable()) { return; }

	var isLastFrustum = false;
	this.frustumIdx = frustumIdx;
	this.numFrustums = numFrustums;
	if (frustumIdx === numFrustums-1) 
	{
		isLastFrustum = true;
		this.isLastFrustum = true;
	}

	// cesium 새 버전에서 지원하지 않음
	var picking = pass.pick;
	if (picking) 
	{
		//this.renderNeoBuildings(scene, isLastFrustum);
	}
	else 
	{
		if (this.configInformation === undefined)
		{
			this.configInformation = MagoConfig.getPolicy();
		}
		this.sceneState.gl = scene.context._gl;
		this.renderNeoBuildingsAsimectricVersion(scene, isLastFrustum, frustumIdx, numFrustums);
	}
	/*
	if(isLastFrustum)
	{
		// print FPS to console.
		var end = new Date().getTime();
		var fps = 1000/(end - start);
		console.log('FPS :  ' + fps);
	}
	*/
};

MagoManager.prototype.render = function(dc)
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
MagoManager.prototype.renderOrdered = function(dc)
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
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}
		
	var isLastFrustum = true;
	var frustumIdx = 0;
	var numFrustums = 1;
	this.sceneState.dc = dc;
	this.sceneState.gl = dc.currentGlContext;
	var scene;
	
	this.renderNeoBuildingsAsimectricVersion(scene, isLastFrustum, frustumIdx, numFrustums);
};

/**
 * 카메라가 이동중인지를 확인
 * @param cameraPosition 변수
 * @param squareDistUmbral 변수
 * @returns camera_was_moved
 */
MagoManager.prototype.isCameraMoved = function(cameraPosition, squareDistUmbral) 
{
	var camera_was_moved = false;
	var squareDistFromLastPos = this.lastCamPos.squareDistTo(cameraPosition.x, cameraPosition.y, cameraPosition.z);
	if (squareDistFromLastPos > squareDistUmbral) 
	{
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
MagoManager.prototype.updateCameraMoved = function(cameraPosition) 
{
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
MagoManager.prototype.renderAtmosphere = function(gl, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum) 
{
	var clouds_count = this.atmosphere.cloudsManager.circularCloudsArray.length;
	if (clouds_count === 0) { return; }

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
	for (var i=0; i<clouds_count; i++) 
	{
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i];

		gl.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		gl.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		if (cloud.vbo_vertexCacheKey === undefined) 
		{
			cloud.vbo_vertexCacheKey = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, cloud.getVBOVertexColorFloatArray(), gl.STATIC_DRAW);
		}
		if (cloud.vbo_indexCacheKey === undefined) 
		{
			cloud.vbo_indexCacheKey = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_indexCacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.getVBOIndicesShortArray(), gl.STATIC_DRAW);
		}

		// Interleaved mode.***
		gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_vertexCacheKey);
		gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false, 24, 0);
		gl.vertexAttribPointer(standardShader._color, 3, gl.FLOAT, false, 24, 12);

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
MagoManager.prototype.renderCloudShadows = function(gl, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye, scene, isLastFrustum) 
{
	//if(!isLastFrustum)
	//	return;
	//this.doFrustumCullingClouds(cullingVolume, this.atmosphere.cloudsManager.circularCloudsArray, cameraPosition);

	var clouds_count = this.atmosphere.cloudsManager.circularCloudsArray.length;
	if (clouds_count === 0) { return; }

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
	for (var i=0; i<clouds_count; i++) 
	{
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i]; // Original.***
		//cloud = this.currentVisibleClouds_array[i];

		gl.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		gl.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if (cloud.vbo_shadowVertexCacheKey === undefined) 
		{
			cloud.vbo_shadowVertexCacheKey = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, cloud.getVBOShadowVertexFloatArray(), gl.STATIC_DRAW);
		}
		if (cloud.vbo_shadowIndexCacheKey === undefined) 
		{
			cloud.vbo_shadowIndexCacheKey = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.getVBOShadowIndicesShortArray(), gl.STATIC_DRAW);
		}

		// Interleaved mode.***
		gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
		gl.drawElements(gl.TRIANGLES, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
		//gl.drawElements(gl.LINE_LOOP, cloud.indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
	}

	// Second pass.****************************************************************************************************
	gl.cullFace(gl.BACK);
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP);

	// Clouds.***
	for (var i=0; i<clouds_count; i++) 
	{
		cloud = this.atmosphere.cloudsManager.circularCloudsArray[i];

		gl.uniform3fv(standardShader._cloudPosHIGH, cloud.positionHIGH);
		gl.uniform3fv(standardShader._cloudPosLOW, cloud.positionLOW);

		// Provisionally render sadow.***
		if (cloud.vbo_shadowVertexCacheKey === undefined) 
		{
			cloud.vbo_shadowVertexCacheKey = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, cloud.getVBOShadowVertexFloatArray(), gl.STATIC_DRAW);
		}
		if (cloud.vbo_shadowIndexCacheKey === undefined) 
		{
			cloud.vbo_shadowIndexCacheKey = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloud.vbo_shadowIndexCacheKey);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloud.getVBOShadowIndicesShortArray(), gl.STATIC_DRAW);
		}

		// Interleaved mode.***
		gl.bindBuffer(gl.ARRAY_BUFFER, cloud.vbo_shadowVertexCacheKey);
		gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false, 0, 0);

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
	if (shadowBC.vbo_vertexCacheKey === undefined) 
	{
		shadowBC.vbo_vertexCacheKey = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, shadowBC.getVBOVertexColorRGBAFloatArray(), gl.STATIC_DRAW);
	}
	if (shadowBC.vbo_indexCacheKey === undefined) 
	{
		shadowBC.vbo_indexCacheKey = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shadowBC.getVBOIndicesShortArray(), gl.STATIC_DRAW);
	}

	// Interleaved mode.***
	gl.bindBuffer(gl.ARRAY_BUFFER, shadowBC.vbo_vertexCacheKey);
	gl.vertexAttribPointer(standardShader._position, 3, gl.FLOAT, false, 28, 0);
	gl.vertexAttribPointer(standardShader._color, 4, gl.FLOAT, false, 28, 12);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shadowBC.vbo_indexCacheKey);
	gl.drawElements(gl.TRIANGLES, shadowBC.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***

	gl.disableVertexAttribArray(standardShader._position);
	gl.disableVertexAttribArray(standardShader._color);

	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
	gl.disable(gl.STENCIL_TEST);
};

/**
 * 텍스처를 읽어서 그래픽 카드에 올림
 * @param gl 변수
 * @param image 변수
 * @param texture
 */
function handleTextureLoaded(gl, image, texture) 
{
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
 * 빌딩을 준비(새버전)
 * @param gl 변수
 */
MagoManager.prototype.prepareNeoBuildingsAsimetricVersion = function(gl) 
{
	// for all renderables, prepare data.***
	var neoBuilding;
	var geometryDataPath = this.readerWriter.geometryDataPath;

	var currentVisibleBlocks = [].concat(this.visibleObjControlerBuildings.currentVisibles0, this.visibleObjControlerBuildings.currentVisibles2);
	for (var i=0, length = currentVisibleBlocks.length; i<length; i++) 
	{
		neoBuilding = currentVisibleBlocks[i];
		
		if (neoBuilding.buildingId === "U310T")
		{ var hola = 0; }

		// check if this building is ready to render.***
		if (!neoBuilding.allFilesLoaded) 
		{
			// 1) MetaData
			var metaData = neoBuilding.metaData;
			if (metaData.fileLoadState === CODE.fileLoadState.READY) 
			{
				if (this.fileRequestControler.isFull())	{ return; }
				
				var neoBuildingHeaderPath = geometryDataPath + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
				this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
			}
		}
	}
	currentVisibleBlocks.length = 0;
};

/**
 * Here updates the modelView matrices.
 * @param {SceneState} sceneState
 */
MagoManager.prototype.upDateSceneStateMatrices = function(sceneState) 
{
	// here updates the modelView and modelViewProjection matrices of the scene.***
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
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
		
		// ModelViewProjectionMatrix.***
		var modelViewProjection_aux = WorldWind.Matrix.fromIdentity();
		modelViewProjection_aux.copy(projection);
		modelViewProjection_aux.multiplyMatrix(modelView);
		var columnMajorArrayAux = WorldWind.Matrix.fromIdentity();
		var columnMajorArray = modelViewProjection_aux.columnMajorComponents(columnMajorArrayAux); // Original.***
		sceneState.modelViewProjMatrix.copyFromFloatArray(columnMajorArray);
		
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
		ManagerUtils.calculateSplited3fv([cameraPosition[0], cameraPosition[1], cameraPosition[2]], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);
		
		var viewport = this.wwd.viewport;
		sceneState.camera.frustum.aspectRatio = viewport.width/viewport.height;
		//sceneState.camera.frustum.near[0] = this.wwd.navigator.nearDistance;
		sceneState.camera.frustum.near[0] = 0.1;
		sceneState.camera.frustum.far = 1000.0;
		//sceneState.camera.frustum.far[0] = this.wwd.navigator.farDistance;
		
		// Calculate FOV & FOVY.***
		if (sceneState.camera.frustum.dirty)
		{
			var projectionMatrix = dc.navigatorState.projection;
			var aspectRat = sceneState.camera.frustum.aspectRatio;
			var angleAlfa = 2*Math.atan(1/(aspectRat*projectionMatrix[0]));
			sceneState.camera.frustum.fovyRad = angleAlfa; // pendent to know the real fov in webwroldwind.***
			sceneState.camera.frustum.fovRad = sceneState.camera.frustum.fovyRad*sceneState.camera.frustum.aspectRatio;
			sceneState.camera.frustum.dirty = false;
			sceneState.camera.frustum.tangentOfHalfFovy = Math.tan(sceneState.camera.frustum.fovyRad/2);
		}

		// screen size.***
		sceneState.drawingBufferWidth = viewport.width;
		sceneState.drawingBufferHeight = viewport.height;
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		// * if this is in Cesium:
		var scene = this.scene;
		var uniformState = scene._context.uniformState;
		//var uniformState = scene._context._us;
		Cesium.Matrix4.toArray(uniformState._modelViewProjectionRelativeToEye, sceneState.modelViewProjRelToEyeMatrix._floatArrays);
		Cesium.Matrix4.toArray(uniformState._modelViewProjection, sceneState.modelViewProjMatrix._floatArrays); // always dirty.
		Cesium.Matrix4.toArray(uniformState._modelViewRelativeToEye, sceneState.modelViewRelToEyeMatrix._floatArrays);
		
		sceneState.modelViewRelToEyeMatrixInv._floatArrays = Cesium.Matrix4.inverseTransformation(sceneState.modelViewRelToEyeMatrix._floatArrays, sceneState.modelViewRelToEyeMatrixInv._floatArrays);// original.***
		
		//Cesium.Matrix4.toArray(uniformState._modelView, sceneState.modelViewMatrix._floatArrays);// original.***
		//sceneState.modelViewMatrix._floatArrays = Cesium.Matrix4.multiply(uniformState.model, uniformState.view, sceneState.modelViewMatrix._floatArrays);
		sceneState.modelViewMatrix._floatArrays = Cesium.Matrix4.clone(uniformState.view, sceneState.modelViewMatrix._floatArrays);
		Cesium.Matrix4.toArray(uniformState._projection, sceneState.projectionMatrix._floatArrays);
		
		//calculate modelViewProjection.
		//sceneState.modelViewProjMatrix = sceneState.modelViewMatrix.getMultipliedByMatrix(sceneState.projectionMatrix, sceneState.modelViewProjMatrix);

		var cameraPosition = scene.context._us._cameraPosition;
		ManagerUtils.calculateSplited3fv([cameraPosition.x, cameraPosition.y, cameraPosition.z], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);

		sceneState.modelViewMatrixInv._floatArrays = Cesium.Matrix4.inverseTransformation(sceneState.modelViewMatrix._floatArrays, sceneState.modelViewMatrixInv._floatArrays);// original.***
		sceneState.normalMatrix4._floatArrays = Cesium.Matrix4.transpose(sceneState.modelViewMatrixInv._floatArrays, sceneState.normalMatrix4._floatArrays);// original.***

		sceneState.camera.frustum.far[0] = scene._frustumCommandsList[0].far; // original.***
		//sceneState.camera.frustum.far[0] = 5000000.0;
		sceneState.camera.frustum.near[0] = scene._frustumCommandsList[0].near;
		sceneState.camera.frustum.fovRad = scene._camera.frustum._fov;
		sceneState.camera.frustum.fovyRad = scene._camera.frustum._fovy;
		sceneState.camera.frustum.aspectRatio = scene._camera.frustum._aspectRatio;
		sceneState.camera.frustum.tangentOfHalfFovy = Math.tan(sceneState.camera.frustum.fovyRad/2);

		sceneState.camera.position.set(scene.context._us._cameraPosition.x, scene.context._us._cameraPosition.y, scene.context._us._cameraPosition.z);
		sceneState.camera.direction.set(scene._camera.direction.x, scene._camera.direction.y, scene._camera.direction.z);
		sceneState.camera.up.set(scene._camera.up.x, scene._camera.up.y, scene._camera.up.z);
		
		sceneState.drawingBufferWidth = scene.drawingBufferWidth;
		sceneState.drawingBufferHeight = scene.drawingBufferHeight;
	}

};

/**
 * Here updates the camera's parameters and frustum planes.
 * @param {Camera} camera
 */
MagoManager.prototype.upDateCamera = function(resultCamera) 
{
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		var wwwFrustumVolume = this.sceneState.dc.navigatorState.frustumInModelCoordinates;
		for (var i=0; i<6; i++)
		{
			var plane = wwwFrustumVolume._planes[i];
			resultCamera.frustum.planesArray[i].setNormalAndDistance(plane.normal[0], plane.normal[1], plane.normal[2], plane.distance);
		}
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		var camera = this.scene.frameState.camera;
		var cesiumFrustum = camera.frustum.computeCullingVolume(camera.position, camera.direction, camera.up);

		for (var i=0; i<6; i++)
		{
			var plane = cesiumFrustum.planes[i];
			resultCamera.frustum.planesArray[i].setNormalAndDistance(plane.x, plane.y, plane.z, plane.w);
		}
	}
};


/**
 * object index 파일을 읽어서 Frustum Culling으로 화면에 rendering
 * @param scene 변수
 * @param isLastFrustum 변수
 */
MagoManager.prototype.renderNeoBuildingsAsimectricVersion = function(scene, isLastFrustum, frustumIdx, numFrustums) 
{
	if (this.renderingModeTemp === 0) 
	{
		if (!isLastFrustum) { return; }
	}

	//if(!isLastFrustum) return;

	this.frustumIdx = frustumIdx;
	this.numFrustums = numFrustums;
	this.isLastFrustum = isLastFrustum;
	
	this.upDateSceneStateMatrices(this.sceneState);

	var gl = this.sceneState.gl;

	if (this.textureAux_1x1 === undefined) 
	{
		this.textureAux_1x1 = gl.createTexture();
		// Test wait for texture to load.********************************************
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	if (this.pin.texture === undefined)
	{
		this.pin.texture = new Texture();
		var filePath_inServer = this.magoPolicy.imagePath + "/bugger.png";
		this.pin.texture.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, this.pin.texture, undefined, this);
		this.pin.texturesArray.push(this.pin.texture);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/improve.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/etc.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		var cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/new.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
	
	}
	
	//scene
	if (this.depthFboNeo === undefined) { this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	if (this.sceneState.drawingBufferWidth !== this.depthFboNeo.width || this.sceneState.drawingBufferHeight !== this.depthFboNeo.height)
	{
		this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
		this.sceneState.camera.frustum.dirty = true;
	}

	var cameraPosition = this.sceneState.camera.position;

	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (this.isLastFrustum)
		{
			//if(this.sceneState.bMust)
			{
				if (this.myCameraSCX === undefined) 
				{ this.myCameraSCX = new Camera(); }

				this.upDateCamera(this.myCameraSCX);
				this.currentVisibleNeoBuildings_array.length = 0;
				//this.doFrustumCullingNeoBuildings(this.myCameraSCX.frustum, cameraPosition); // old.
				this.doFrustumCullingSmartTiles(this.myCameraSCX.frustum, cameraPosition);
				this.prepareNeoBuildingsAsimetricVersion(gl);
			}
		}
	}
	
	var currentShader = undefined;

	// prepare data if camera is no moving.***
	// 1) LOD 0.*********************************************************************************************************************
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown && this.isLastFrustum) 
	{
		this.visibleObjControlerOctrees.initArrays(); // init.******
		this.visibleObjControlerOctreesAux.initArrays(); // init.******

		// lod 0 & lod 1.
		var buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for (var i=0; i<buildingsCount; i++) 
		{
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			if (neoBuilding.buildingId === "U310T")
			{ var hola = 0; }
			
			this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, neoBuilding, this.visibleObjControlerOctrees, this.visibleObjControlerOctreesAux, 0);
		}
		var fileRequestExtraCount = 2;
		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, scene, this.visibleObjControlerOctrees, fileRequestExtraCount);
		fileRequestExtraCount = 5;
		this.prepareVisibleOctreesSortedByDistance(gl, scene, this.visibleObjControlerOctrees, fileRequestExtraCount); 
		
		// lod 2.
		buildingsCount = this.visibleObjControlerBuildings.currentVisibles2.length;
		for (var i=0; i<buildingsCount; i++) 
		{
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[i];
			this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, neoBuilding, this.visibleObjControlerOctrees, this.visibleObjControlerOctreesAux, 2);
		}
		fileRequestExtraCount = 2;
		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, scene, this.visibleObjControlerOctrees, fileRequestExtraCount);
		
		// if a LOD0 building has a NO ready lowestOctree, then push this building to the LOD2BuildingsArray.***
		buildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
		for (var i=0; i<buildingsCount; i++) 
		{
			var neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[i];
			if (neoBuilding.currentVisibleOctreesControler === undefined)
			{ continue; }
			if (neoBuilding.currentVisibleOctreesControler.currentVisibles2.length > 0)
			{
				// then push this neoBuilding to the LOD2BuildingsArray.***
				this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
			}
		}
		
		this.manageQueue();
	}
	
	if (this.bPicking === true && isLastFrustum)
	{
		var pixelPos;
		
		if (this.magoPolicy.issueInsertEnable === true)
		{
			if (this.objMarkerSC === undefined)
			{ this.objMarkerSC = new ObjectMarker(); }
			
			pixelPos = new Point3D();
			pixelPos = this.calculatePixelPositionWorldCoord(gl, this.mouse_x, this.mouse_y, pixelPos);
			//var objMarker = this.objMarkerManager.newObjectMarker();
			
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, this.objMarkerSC.geoLocationData, this);
			this.renderingFase = !this.renderingFase;
		}
		
		if (this.magoPolicy.objectInfoViewEnable === true)
		{
			if (this.objMarkerSC === undefined)
			{ this.objMarkerSC = new ObjectMarker(); }
			
			if (pixelPos === undefined)
			{
				pixelPos = new Point3D();
				pixelPos = this.calculatePixelPositionWorldCoord(gl, this.mouse_x, this.mouse_y, pixelPos);
			}
			//var objMarker = this.objMarkerManager.newObjectMarker();
			
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, this.objMarkerSC.geoLocationData, this);
			this.renderingFase = !this.renderingFase;
		}
	}

	if (this.bPicking === true && isLastFrustum)
	{
		this.arrayAuxSC.length = 0;
		this.objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.visibleObjControlerBuildings, this.arrayAuxSC);
		this.buildingSelected = this.arrayAuxSC[0];
		this.octreeSelected = this.arrayAuxSC[1];
		this.arrayAuxSC.length = 0;
		if (this.buildingSelected !== undefined) 
		{
			this.displayLocationAndRotation(this.buildingSelected);
			this.selectedObjectNotice(this.buildingSelected);
		}
		if (this.objectSelected !== undefined) 
		{
			//this.displayLocationAndRotation(currentSelectedBuilding);
			//this.selectedObjectNotice(currentSelectedBuilding);
			//console.log("objectId = " + selectedObject.objectId);
		}
	}
	
	// 1) The depth render.**********************************************************************************************************************
	//if(this.currentFramebuffer === null)
	//	this.currentFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	this.depthFboNeo.bind(); // DEPTH START.*****************************************************************************************************
	var ssao_idx = 0; // 0= depth. 1= ssao.***
	var renderTexture = false;
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	this.renderLowestOctreeAsimetricVersion(gl, cameraPosition, currentShader, renderTexture, ssao_idx, this.visibleObjControlerBuildings);
	this.depthFboNeo.unbind();
	
	this.renderingFase = !this.renderingFase;

	
	// 2) ssao render.************************************************************************************************************
	//if(this.currentFramebuffer !== null)
	//this.sceneState.gl.bindFramebuffer(this.sceneState.gl.FRAMEBUFFER, this.currentFramebuffer);
	
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		;//
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		scene._context._currentFramebuffer._bind();
	}
	
	var wwwCurrentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
	var wwwCurrentTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
	
	if (this.noiseTexture === undefined) 
	{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }

	ssao_idx = 1;
	this.renderLowestOctreeAsimetricVersion(gl, cameraPosition, currentShader, renderTexture, ssao_idx, this.visibleObjControlerBuildings);
	
	// test. Draw the buildingNames.***
	if (this.magoPolicy.getShowLabelInfo())
	{
		this.drawBuildingNames(this.visibleObjControlerBuildings) ;
	}
	
	this.renderingFase = !this.renderingFase;
	
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		//this.wwd.drawContext.bindFramebuffer(null);
		//this.wwd.drawContext.bindProgram(wwwCurrentProgram);
		gl.activeTexture(gl.TEXTURE0);
		//gl.bindTexture(gl.TEXTURE_2D, wwwCurrentTexture);
		this.wwd.drawContext.redrawRequested = true;
	}
	
	
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawBuildingNames = function(visibleObjControlerBuildings) 
{
	var canvas = document.getElementById("objectLabel");
	canvas.style.opacity = 1.0;
	canvas.width = this.sceneState.drawingBufferWidth;
	canvas.height = this.sceneState.drawingBufferHeight;
	var ctx = canvas.getContext("2d");
	ctx.strokeStyle = 'black';
	ctx.fillStyle= "white";
	ctx.lineWidth = 4;
	ctx.font = "20px Arial";
	ctx.textAlign = 'center';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	var lineHeight = ctx.measureText("M").width * 1.1;

	// lod2.
	var gl = this.sceneState.gl;
	var neoBuilding;
	var geoLocation;
	var worldPosition;
	var screenCoord;
	var buildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
	for (var i=0; i<buildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles2[i];
		//geoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		//worldPosition = geoLocation.position;
		worldPosition = neoBuilding.getBBoxCenterPositionWorldCoord();
		screenCoord = this.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, neoBuilding);

		ctx.font = "20px Arial";
		ctx.strokeText(neoBuilding.name, screenCoord.x, screenCoord.y);
		ctx.fillText(neoBuilding.name, screenCoord.x, screenCoord.y);

		ctx.font = "10px Arial";
		ctx.strokeText("("+neoBuilding.buildingId+")", screenCoord.x, screenCoord.y+lineHeight);
		ctx.fillText("("+neoBuilding.buildingId+")", screenCoord.x, screenCoord.y+lineHeight);
	}
	ctx.restore();
};

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 * @returns {Array} resultSelectedArray 
 */
MagoManager.prototype.getSelectedObjects = function(gl, mouseX, mouseY, visibleObjControlerBuildings, resultSelectedArray) 
{
	// Picking render.***
	this.bPicking = false;
	var cameraPosition = this.sceneState.camera.position;

	if (this.selectionFbo === undefined) 
	{ this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }

	// selection render.
	this.selectionColor.init(); // selection colors manager.***
	this.selectionCandidates.clearCandidates();
	
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
	
	// colorSelection render.
	this.selectionFbo.bind(); // framebuffer for color selection.***

	// Set uniforms.***************
	var currentShader = this.postFxShadersManager.pFx_shaders_array[5]; // color selection shader.***
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	gl.clearColor(1, 1, 1, 1); // white background.***
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
	
	gl.disable(gl.CULL_FACE);

	var shaderProgram = currentShader.program;
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(currentShader.position3_loc);

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
	
	// do the colorCoding render.***
	var idxKey;
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles0.length;
	for (var i=0; i<neoBuildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles0[i];
		
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		currentVisibleOctreesControler = neoBuilding.currentVisibleOctreesControler;
		if (currentVisibleOctreesControler === undefined)
		{ continue; }
		
		// LOD0.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles0.length;
		for (var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles0[j];
			minSize = 0.0;
			this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree, neoBuilding, this, isInterior, currentShader, minSize, refTMatrixIdxKey, glPrimitive);
		}
		
		// LOD1.***
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles1.length;
		for (var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles1[j];
			minSize = 0.0;
			this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree, neoBuilding, this, isInterior, currentShader, minSize, refTMatrixIdxKey, glPrimitive);
		}
		
		// LOD2.***
		if (this.colorAux === undefined)
		{ this.colorAux = new Color(); }
		
		gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, buildingGeoLocation.rotMatrix._floatArrays);
		currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles2.length;
		for (var j=0; j<currentVisibleLowestOctCount; j++)
		{
			lowestOctree = currentVisibleOctreesControler.currentVisibles2[j];

			if (lowestOctree.lego === undefined) 
			{ continue; }

			if (lowestOctree.lego.fileLoadState === CODE.fileLoadState.READY) 
			{ continue; }

			if (lowestOctree.lego.fileLoadState === 2) 
			{ continue; }
			
			this.colorAux = this.selectionColor.getAvailableColor(this.colorAux);
			idxKey = this.selectionColor.decodeColor3(this.colorAux.r, this.colorAux.g, this.colorAux.b);
			this.selectionCandidates.setCandidates(idxKey, undefined, lowestOctree, neoBuilding);
			
			gl.uniform1i(currentShader.hasTexture_loc, false); //.***
			gl.uniform4fv(currentShader.color4Aux_loc, [this.colorAux.r/255.0, this.colorAux.g/255.0, this.colorAux.b/255.0, 1.0]);

			gl.uniform1i(currentShader.hasAditionalMov_loc, false);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

			this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader, ssao_idx);
		}
		
	}
	
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
	for (var i=0; i<neoBuildingsCount; i++)
	{
		neoBuilding = visibleObjControlerBuildings.currentVisibles2[i];
		
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		currentVisibleOctreesControler = neoBuilding.currentVisibleOctreesControler;
		if (currentVisibleOctreesControler)
		{

			// LOD2.***
			gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, buildingGeoLocation.rotMatrix._floatArrays);
			currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles2.length;
			for (var j=0; j<currentVisibleLowestOctCount; j++)
			{
				lowestOctree = currentVisibleOctreesControler.currentVisibles2[j];

				if (lowestOctree.lego === undefined) 
				{ continue; }

				if (lowestOctree.lego.fileLoadState === CODE.fileLoadState.READY) 
				{ continue; }

				if (lowestOctree.lego.fileLoadState === 2) 
				{ continue; }

				this.colorAux = this.selectionColor.getAvailableColor(this.colorAux);
				idxKey = this.selectionColor.decodeColor3(this.colorAux.r, this.colorAux.g, this.colorAux.b);
				this.selectionCandidates.setCandidates(idxKey, undefined, lowestOctree, neoBuilding);
			
				gl.uniform1i(currentShader.hasTexture_loc, false); //.***
				gl.uniform4fv(currentShader.color4Aux_loc, [this.colorAux.r/255.0, this.colorAux.g/255.0, this.colorAux.b/255.0, 1.0]);

				gl.uniform1i(currentShader.hasAditionalMov_loc, false);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

				this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader, ssao_idx);
			}
		}
	}

	if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
	gl.disableVertexAttribArray(currentShader.position3_loc);

	// Now, read the picked pixel and find the object.*********************************************************
	var pixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(mouseX, this.sceneState.drawingBufferHeight - mouseY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***

	// now, select the object.***
	var idx = 64516*pixels[0] + 254*pixels[1] + pixels[2];
	this.selectionCandidates.selectObjects(idx);
	
	var selectedObject = this.selectionCandidates.currentReferenceSelected;

	resultSelectedArray[0] = this.selectionCandidates.currentBuildingSelected;
	resultSelectedArray[1] = this.selectionCandidates.currentOctreeSelected;
	resultSelectedArray[2] = this.selectionCandidates.currentReferenceSelected;
	
	return selectedObject;
};


/**
 * Calculates the direction vector of a ray that starts in the camera position and
 * continues to the pixel position in world space.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @returns {Line} resultRay
 */
MagoManager.prototype.getRayWorldSpace = function(gl, pixelX, pixelY, resultRay) 
{
	// in this function the "ray" is a line.***
	if (resultRay === undefined) 
	{ resultRay = new Line(); }
	
	// world ray = camPos + lambda*camDir.
	var camPos = this.sceneState.camera.position;
	var rayCamSpace = new Float32Array(3);
	rayCamSpace = this.getRayCamSpace(gl, pixelX, pixelY, rayCamSpace);
	
	if (this.pointSC === undefined)
	{ this.pointSC = new Point3D(); }
	
	this.pointSC.set(rayCamSpace[0], rayCamSpace[1], rayCamSpace[2]);

	// now, must transform this posCamCoord to world coord.***
	this.pointSC2 = this.sceneState.modelViewMatrixInv.rotatePoint3D(this.pointSC, this.pointSC2); // rayWorldSpace.***
	this.pointSC2.unitary(); // rayWorldSpace.***
	resultRay.setPointAndDir(camPos.x, camPos.y, camPos.z,       this.pointSC2.x, this.pointSC2.y, this.pointSC2.z);// original.***

	return resultRay;
};

/**
 * Calculates the direction vector of a ray that starts in the camera position and
 * continues to the pixel position in camera space.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @returns {Float32Array(3)} resultRay Result of the calculation.
 */
MagoManager.prototype.getRayCamSpace = function(gl, pixelX, pixelY, resultRay) 
{
	// in this function "ray" is a vector.***
	var frustum_far = 1.0; // unitary frustum far.***
	var fov = this.sceneState.camera.frustum.fovyRad;
	var aspectRatio = this.sceneState.camera.frustum.aspectRatio;

	var hfar = 2.0 * Math.tan(fov/2.0) * frustum_far;
	var wfar = hfar * aspectRatio;
	var mouseX = pixelX;
	var mouseY = this.sceneState.drawingBufferHeight - pixelY;
	if (resultRay === undefined) 
	{ resultRay = new Float32Array(3); }
	resultRay[0] = wfar*((mouseX/this.sceneState.drawingBufferWidth) - 0.5);
	resultRay[1] = hfar*((mouseY/this.sceneState.drawingBufferHeight) - 0.5);
	resultRay[2] = - frustum_far;
	return resultRay;
};

/**
 * Calculates the plane on move an object.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @return {Plane} resultSelObjMovePlane Calculated plane.
 */
MagoManager.prototype.calculateSelObjMovePlaneAsimetricMode = function(gl, pixelX, pixelY, resultSelObjMovePlane) 
{
	if (this.pointSC === undefined)
	{ this.pointSC = new Point3D(); }
	
	if (this.pointSC2 === undefined)
	{ this.pointSC2 = new Point3D(); }
	
	this.calculatePixelPositionWorldCoord(gl, pixelX, pixelY, this.pointSC2);
	var buildingGeoLocation = this.buildingSelected.geoLocDataManager.getGeoLocationData(0);
	this.pointSC = buildingGeoLocation.tMatrixInv.transformPoint3D(this.pointSC2, this.pointSC); // buildingSpacePoint.***

	if (resultSelObjMovePlane === undefined)
	{ resultSelObjMovePlane = new Plane(); }
	// the plane is in world coord.***
	resultSelObjMovePlane.setPointAndNormal(this.pointSC.x, this.pointSC.y, this.pointSC.z, 0.0, 0.0, 1.0);
	return resultSelObjMovePlane;
};

/**
 * Calculates the pixel position in camera coordinates.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @return {Point3D} resultPixelPos The result of the calculation.
 */
MagoManager.prototype.calculatePixelPositionCamCoord = function(gl, pixelX, pixelY, resultPixelPos) 
{
	// depth render.
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	gl.frontFace(gl.CCW);

	var current_frustum_near = this.sceneState.camera.frustum.near;
	var current_frustum_far = this.sceneState.camera.frustum.far;

	// framebuffer for color selection.
	if (this.selectionFbo === undefined) 
	{ this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
	this.selectionFbo.bind(); 

	gl.clearColor(1, 1, 1, 1); // white background.***
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
	gl.disable(gl.BLEND);
	var ssao_idx = 0;
	this.depthRenderLowestOctreeAsimetricVersion(gl, ssao_idx, this.visibleObjControlerBuildings);

	// Now, read the pixel and find the pixel position.
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(pixelX, this.sceneState.drawingBufferHeight - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);
	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	zDepth /= 256.0; // convert to 0 to 1.0 range depth.***
	var realZDepth = zDepth*current_frustum_far;

	// now, find the 3d position of the pixel in camCoord.****
	this.resultRaySC = this.getRayCamSpace(gl, pixelX, pixelY, this.resultRaySC);
	if (resultPixelPos === undefined)
	{ resultPixelPos = new Point3D(); }
	
	resultPixelPos.set(this.resultRaySC[0] * realZDepth, this.resultRaySC[1] * realZDepth, this.resultRaySC[2] * realZDepth);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return resultPixelPos;
};

/**
 * Calculates the pixel position in world coordinates.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @return {Point3D} resultPixelPos The result of the calculation.
 */
MagoManager.prototype.calculatePixelPositionWorldCoord = function(gl, pixelX, pixelY, resultPixelPos) 
{
	var pixelPosCamCoord = new Point3D();
	pixelPosCamCoord = this.calculatePixelPositionCamCoord(gl, pixelX, pixelY, pixelPosCamCoord);

	// now, must transform this pixelCamCoord to world coord.***
	var mv_inv = this.sceneState.modelViewMatrixInv;
	if (resultPixelPos === undefined)
	{ var resultPixelPos = new Point3D(); }
	resultPixelPos = mv_inv.transformPoint3D(pixelPosCamCoord, resultPixelPos);
	return resultPixelPos;
};

/**
 * Calculates the pixel position in world coordinates.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @return {Point3D} resultPixelPos The result of the calculation.
 */
MagoManager.prototype.calculateWorldPositionToScreenCoord = function(gl, worldCoordX, worldCoordY, worldCoordZ, resultScreenCoord, neoBuilding) // arg "neoBuilding" is test.
{
	if (resultScreenCoord === undefined)
	{ resultScreenCoord = new Point3D(); }
	
	if (this.pointSC === undefined)
	{ this.pointSC = new Point3D(); }
	
	if (this.pointSC2 === undefined)
	{ this.pointSC2 = new Point3D(); }
	
	this.pointSC.set(worldCoordX, worldCoordY, worldCoordZ);
	
	// calculate the position in camera coords.
	this.pointSC2 = this.sceneState.modelViewMatrix.transformPoint3D(this.pointSC, this.pointSC2);
	
	// now calculate the position in screen coords.
	var zDist = this.pointSC2.z;
	
	// now calculate the width and height of the plane in zDist.
	var fovyRad = this.sceneState.camera.frustum.fovyRad;
	
	var planeHeight = this.sceneState.camera.frustum.tangentOfHalfFovy*zDist*2;
	var planeWidth = planeHeight * this.sceneState.camera.frustum.aspectRatio; // aspectRatio(w/h).
	
	var pixelX = -this.pointSC2.x * this.sceneState.drawingBufferWidth / planeWidth;
	var pixelY = -(this.pointSC2.y) * this.sceneState.drawingBufferHeight / planeHeight;

	pixelX += this.sceneState.drawingBufferWidth / 2;
	pixelY += this.sceneState.drawingBufferHeight / 2;
	
	pixelY = this.sceneState.drawingBufferHeight - pixelY;
	
	resultScreenCoord.set(pixelX, pixelY, 0);
	
	return resultScreenCoord;
};

/**
 * 드래그 여부 판단
 * 
 * @returns {Boolean} 드래그 여부
 */
MagoManager.prototype.isDragging = function() 
{
	// test function.***
	var gl = this.sceneState.gl;

	if (this.magoPolicy.mouseMoveMode === CODE.moveMode.ALL)	// Moving all
	{
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.visibleObjControlerBuildings, this.arrayAuxSC);
		var currentBuildingSelected = this.arrayAuxSC[0];
		this.arrayAuxSC.length = 0;

		if (currentBuildingSelected === this.buildingSelected) 
		{
			return true;
		}
		else 
		{
			return false;
		}
	}
	else if (this.magoPolicy.mouseMoveMode === CODE.moveMode.OBJECT) // Moving object
	{
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.visibleObjControlerBuildings, this.arrayAuxSC);
		this.arrayAuxSC.length = 0;

		if (current_objectSelected === this.objectSelected) 
		{
			return true;
		}
		else 
		{
			return false;
		}
	}
	else
	{
		return false;
	}

};

/**
 * 카메라 motion 활성 또는 비활성
 * 
 * @param {Boolean} state 카메라 모션 활성화 여부
 */
MagoManager.prototype.setCameraMotion = function(state)
{
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		this.wwd.navigator.panRecognizer.enable = state;
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
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
MagoManager.prototype.manageMouseMove = function(mouseX, mouseY) 
{

	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		// distinguish 2 modes.******************************************************
		if (this.magoPolicy.mouseMoveMode === CODE.moveMode.ALL) // blocks move.***
		{
			if (this.buildingSelected !== undefined) 
			{
				// move the selected object.***
				this.mouse_x = mouseX;
				this.mouse_y = mouseY;

				// 1rst, check if there are objects to move.***
				if (this.mustCheckIfDragging) 
				{
					if (this.isDragging()) 
					{
						this.mouseDragging = true;
						this.setCameraMotion(false);
					}
					this.mustCheckIfDragging = false;
				}
			}
			else 
			{
				this.isCameraMoving = true; // if no object is selected.***
			}
		}
		else if (this.magoPolicy.mouseMoveMode === CODE.moveMode.OBJECT) // objects move.***
		{
			if (this.objectSelected !== undefined) 
			{
				// move the selected object.***
				this.mouse_x = mouseX;
				this.mouse_y = mouseY;

				// 1rst, check if there are objects to move.***
				if (this.mustCheckIfDragging) 
				{
					if (this.isDragging()) 
					{
						this.mouseDragging = true;
						this.setCameraMotion(false);
					}
					this.mustCheckIfDragging = false;
				}
			}
			else 
			{
				this.isCameraMoving = true; // if no object is selected.***
			}
		}
		//---------------------------------------------------------------------------------
		this.isCameraMoving = true; // test.***
		if (this.mouseDragging) 
		{
			this.moveSelectedObjectAsimetricMode(this.sceneState.gl);
		}

	}
	else if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		;//
	}
};


/**
 * Moves an object.
 * @param {GL} gl 변수
 */
MagoManager.prototype.moveSelectedObjectAsimetricMode = function(gl) 
{
	var cameraPosition = this.sceneState.camera.position;
	if (this.magoPolicy.mouseMoveMode === CODE.moveMode.ALL) // buildings move.***
	{
		if (this.buildingSelected === undefined)
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			var currentRenderingFase = this.renderingFase;
			this.renderingFase = -1;
			this.selObjMovePlane = new Plane();
			// create a local XY plane.
			this.selObjMovePlane.setPointAndNormal(0.0, 0.0, 0.0,    0.0, 0.0, 1.0); 
			// selObjMovePlane is a tangent plane to globe in the selected point.
			this.renderingFase = currentRenderingFase;
		}

		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.lineSC = this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***

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
		
		if (this.pointSC === undefined)
		{ this.pointSC = new Point3D(); }
		this.pointSC = buildingGeoLocation.geoLocMatrix.transformPoint3D(intersectionPoint, this.pointSC);
		intersectionPoint.set(this.pointSC.x, this.pointSC.y, this.pointSC.z);

		// register the movement.***
		if (this.buildingSelected.moveVector === undefined)
		{ this.buildingSelected.moveVector = new Point3D(); }

		if (!this.thereAreStartMovePoint) 
		{
			var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPoint, cartographic, this);
			this.startMovPoint.x = cartographic.longitude;
			this.startMovPoint.y = cartographic.latitude;
			this.thereAreStartMovePoint = true;
		}
		else 
		{
			var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPoint, cartographic, this);
			this.pointSC.x = cartographic.longitude;
			this.pointSC.y = cartographic.latitude;
			var difX = this.pointSC.x - this.startMovPoint.x;
			var difY = this.pointSC.y - this.startMovPoint.y;

			var geoLocationData;
			geoLocationData = this.buildingSelected.geoLocDataManager.geoLocationDataArray[0];
			var newLongitude = geoLocationData.geographicCoord.longitude - difX;
			var newlatitude = geoLocationData.geographicCoord.latitude - difY;
			var newHeight = cartographic.altitude;

			this.changeLocationAndRotation(this.buildingSelected.buildingId, newlatitude, newLongitude, undefined, undefined, undefined, undefined);
			this.displayLocationAndRotation(this.buildingSelected);
			
			this.startMovPoint.x -= difX;
			this.startMovPoint.y -= difY;
		}
		
		this.buildingSelected.calculateBBoxCenterPositionWorldCoord();
	}
	else if (this.magoPolicy.mouseMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		if (this.objectSelected === undefined)
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			var currentRenderingFase = this.renderingFase;
			this.renderingFase = -1;
			this.selObjMovePlane = this.calculateSelObjMovePlaneAsimetricMode(gl, this.mouse_x, this.mouse_y, this.selObjMovePlane);
			this.renderingFase = currentRenderingFase;
		}

		// world ray = camPos + lambda*camDir.***
		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***
		var buildingGeoLocation = this.buildingSelected.geoLocDataManager.getGeoLocationData(0);
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();
		camPosBuilding = buildingGeoLocation.tMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		camDirBuilding = buildingGeoLocation.tMatrixInv.rotatePoint3D(this.lineSC.direction, camDirBuilding);
	
		// now, intersect building_ray with the selObjMovePlane.***
		var line = new Line();
		line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z,       camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);// original.***

		var intersectionPoint = new Point3D();
		intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);

		//the movement of an object must multiply by buildingRotMatrix.***
		var transformedIntersectPoint = new Point3D();
		transformedIntersectPoint = buildingGeoLocation.tMatrix.rotatePoint3D(intersectionPoint, transformedIntersectPoint); 
		intersectionPoint.x = transformedIntersectPoint.x;
		intersectionPoint.y = transformedIntersectPoint.y;
		intersectionPoint.z = transformedIntersectPoint.z;

		// register the movement.***
		if (this.objectSelected.moveVector === undefined)
		{ this.objectSelected.moveVector = new Point3D(); }

		if (!this.thereAreStartMovePoint) 
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
	}
};

/**
 * Moves an object.
 * @param {GL} gl 변수
 */
MagoManager.prototype.moveSelectedObjectAsimetricMode_current = function(gl) 
{
	var cameraPosition = this.sceneState.camera.position;
	if (this.magoPolicy.mouseMoveMode === CODE.moveMode.ALL) // buildings move.***
	{
		if (this.buildingSelected === undefined)
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			var currentRenderingFase = this.renderingFase;
			this.renderingFase = -1;
			this.selObjMovePlane = this.calculateSelObjMovePlaneAsimetricMode(gl, this.mouse_x, this.mouse_y, this.selObjMovePlane);
			this.renderingFase = currentRenderingFase;
		}

		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.lineSC = this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***

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
		if (this.buildingSelected.moveVector === undefined)
		{ this.buildingSelected.moveVector = new Point3D(); }

		if (!this.thereAreStartMovePoint) 
		{
			this.startMovPoint = intersectionPoint;
			this.thereAreStartMovePoint = true;
		}
		else 
		{
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;

			this.buildingSelected.moveVector.set(difX, difY, difZ);
			
			var geoLocationData;
			geoLocationData = this.buildingSelected.geoLocDataManager.geoLocationDataArray[0];

			// test.*** see the cartographic values of the intersected point.***
			var newPosition = new Point3D();

			newPosition.add(difX, difY, difZ);
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
	else if (this.magoPolicy.mouseMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		if (this.objectSelected === undefined)
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			var currentRenderingFase = this.renderingFase;
			this.renderingFase = -1;
			this.selObjMovePlane = this.calculateSelObjMovePlaneAsimetricMode(gl, this.mouse_x, this.mouse_y, this.selObjMovePlane);
			this.renderingFase = currentRenderingFase;
		}

		// world ray = camPos + lambda*camDir.***
		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***
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
		if (this.objectSelected.moveVector === undefined)
		{ this.objectSelected.moveVector = new Point3D(); }

		if (!this.thereAreStartMovePoint) 
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
	}
};

/**
 * Frustum 안의 VisibleOctree 를 검색하여 currentVisibleOctreesControler 를 준비
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 * @param {VisibleObjectsController} visibleObjControlerOctrees 
 * @param {any} visibleObjControlerOctreesAux 
 * @param {any} lod 
 */
MagoManager.prototype.getRenderablesDetailedNeoBuildingAsimetricVersion = function(gl, scene, neoBuilding, visibleObjControlerOctrees, visibleObjControlerOctreesAux, lod) 
{
	if (neoBuilding === undefined || neoBuilding.octree === undefined) { return; }

	var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);

	if (neoBuilding.currentVisibleOctreesControler === undefined)
	{
		neoBuilding.currentVisibleOctreesControler = new VisibleObjectsController();
	}	

	if (this.myFrustumSC === undefined) 
	{
		this.myFrustumSC = new Frustum();
	}

	if (lod === 0 || lod === 1 || lod === 2)
	{
		var squaredDistLod0 = this.magoPolicy.getLod0DistInMeters();
		var squaredDistLod1 = this.magoPolicy.getLod1DistInMeters();
		var squaredDistLod2 = this.magoPolicy.getLod2DistInMeters();
		
		squaredDistLod0 *= squaredDistLod0;
		squaredDistLod1 *= squaredDistLod1;
		squaredDistLod2 *= squaredDistLod2;
		
		if (neoBuilding.buildingId === "Sea_Port" || neoBuilding.buildingId === "ctships")
		{
			squaredDistLod0 = 120000;
			squaredDistLod1 = 285000;
			squaredDistLod2 = 500000*1000;
		}

		var frustumVolume;
		var find = false;
			
		if (this.configInformation.geo_view_library === Constant.WORLDWIND)
		{
			if (this.myCameraSC === undefined) 
			{ this.myCameraSC = new Camera(); }
			
			if (this.myCameraSC2 === undefined) 
			{ this.myCameraSC2 = new Camera(); }
			
			var cameraPosition = this.sceneState.dc.navigatorState.eyePoint;
			this.myCameraSC2.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
			buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
			this.myCameraSC = buildingGeoLocation.getTransformedRelativeCamera(this.myCameraSC2, this.myCameraSC);
			var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);

			if (this.myBboxSC === undefined)
			{ this.myBboxSC = new BoundingBox(); }
			
			if (this.myCullingVolumeBBoxSC === undefined)
			{ this.myCullingVolumeBBoxSC = new BoundingBox(); }
			
			// Provisionally use a bbox to frustumCulling.***
			var radiusAprox = 4000.0;
			this.myCullingVolumeBBoxSC.minX = this.myCameraSC.position.x - radiusAprox;
			this.myCullingVolumeBBoxSC.maxX = this.myCameraSC.position.x + radiusAprox;
			this.myCullingVolumeBBoxSC.minY = this.myCameraSC.position.y - radiusAprox;
			this.myCullingVolumeBBoxSC.maxY = this.myCameraSC.position.y + radiusAprox;
			this.myCullingVolumeBBoxSC.minZ = this.myCameraSC.position.z - radiusAprox;
			this.myCullingVolumeBBoxSC.maxZ = this.myCameraSC.position.z + radiusAprox;
			
			
			// get frustumCulled lowestOctrees classified by distances.************************************************************************************
			neoBuilding.currentVisibleOctreesControler.currentVisibles0.length = 0;
			neoBuilding.currentVisibleOctreesControler.currentVisibles1.length = 0;
			neoBuilding.currentVisibleOctreesControler.currentVisibles2.length = 0;
			neoBuilding.currentVisibleOctreesControler.currentVisibles3.length = 0;
			find = neoBuilding.octree.getBBoxIntersectedLowestOctreesByLOD(	this.myCullingVolumeBBoxSC, neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctrees, this.myBboxSC,
				this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z,
				squaredDistLod0, squaredDistLod1, squaredDistLod2);
			// End provisional.----------------------------------------------------------------																		
		}
		else if (this.configInformation.geo_view_library === Constant.CESIUM)
		{
			if (this.myCameraSC === undefined) 
			{ this.myCameraSC = new Cesium.Camera(scene); }
			
			var camera = scene.frameState.camera;
			var near = scene._frustumCommandsList[this.frustumIdx].near;
			var far = scene._frustumCommandsList[this.frustumIdx].far;
			var fov = scene.frameState.camera.frustum.fov;
			this.myCameraSC.frustum.fov = fov; // fov = fovx.***
			this.myCameraSC = buildingGeoLocation.getTransformedRelativeCamera(camera, this.myCameraSC);
			
			var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);

			//this.myCameraSC.frustum.fovy = 0.3;
			//camera.frustum.far = 2.0;
			this.myCameraSC.near = near;
			this.myCameraSC.far = far;
			var frustumVolume = this.myCameraSC.frustum.computeCullingVolume(this.myCameraSC.position, this.myCameraSC.direction, this.myCameraSC.up);

			for (var i=0, length = frustumVolume.planes.length; i<length; i++)
			{
				var plane = frustumVolume.planes[i];
				this.myFrustumSC.planesArray[i].setNormalAndDistance(plane.x, plane.y, plane.z, plane.w);
			}
			
			neoBuilding.currentVisibleOctreesControler.currentVisibles0 = [];
			neoBuilding.currentVisibleOctreesControler.currentVisibles1 = [];
			neoBuilding.currentVisibleOctreesControler.currentVisibles2 = [];
			neoBuilding.currentVisibleOctreesControler.currentVisibles3 = [];
			
			if (lod === 2)
			{
				neoBuilding.octree.extractLowestOctreesByLOD(neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctrees, this.boundingSphere_Aux,
					this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z,
					squaredDistLod0, squaredDistLod1, squaredDistLod2);
				find = true;
			}
			else 
			{
				find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	this.myFrustumSC, neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctrees, this.boundingSphere_Aux,
					this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z,
					squaredDistLod0, squaredDistLod1, squaredDistLod2);
			}
		}

		if (!find) 
		{
			//this.deleteNeoBuilding(this.sceneState.gl, neoBuilding);
			this.processQueue.buildingsToDeleteMap.set(neoBuilding, 0);
			return;
		}
	}
	else
	{
		// no enter here...
		neoBuilding.currentVisibleOctreesControler.currentVisibles2.length = 0;
		neoBuilding.octree.extractLowestOctreesIfHasTriPolyhedrons(neoBuilding.currentVisibleOctreesControler.currentVisibles2); // old.
	}
	
	// LOD0 & LOD1
	// Check if the lod0lowestOctrees, lod1lowestOctrees must load and parse data
	var lowestOctree;
	var currentVisibleOctrees = [].concat(neoBuilding.currentVisibleOctreesControler.currentVisibles0, neoBuilding.currentVisibleOctreesControler.currentVisibles1);

	for (var i=0, length = currentVisibleOctrees.length; i<length; i++) 
	{
		lowestOctree = currentVisibleOctrees[i];
		if (lowestOctree.triPolyhedronsCount === 0) 
		{ continue; }

		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
		}
		else
		{
			var isExterior = !isCameraInsideOfBuilding;
			lowestOctree.neoReferencesMotherAndIndices.updateCurrentVisibleIndices(isExterior, this.myCameraSC.position.x, this.myCameraSC.position.y, this.myCameraSC.position.z);
		}
		
		// if the octree has no blocks list ready, then render the lego
		var myBlocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
		if (myBlocksList === undefined || myBlocksList.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
		{
			neoBuilding.currentVisibleOctreesControler.currentVisibles2.push(lowestOctree);
		}
	}
	currentVisibleOctrees.length = 0;
};

/**
 * LOD0, LOD1 에 대한 F4D ModelData, ReferenceData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.manageQueue = function() 
{
	// first, delete buildings.
	var gl = this.sceneState.gl;
	var maxDeleteBuildingsCount = 8;
	var buildingsToDeleteCount = this.processQueue.buildingsToDeleteMap.size;
	if (buildingsToDeleteCount < maxDeleteBuildingsCount)
	{ maxDeleteBuildingsCount = buildingsToDeleteCount; }
	
	var neoBuilding;
	/*
	// incompatibility gulp.
	for (var key of this.processQueue.buildingsToDeleteMap.keys())
	{
		this.deleteNeoBuilding(gl, key);
		this.processQueue.buildingsToDeleteMap.delete(key);
		deletedCount += 1;
		if (deletedCount > maxDeleteBuildingsCount)
		{ break; }
	}
	*/
	var buildingsToDeleteArray = Array.from(this.processQueue.buildingsToDeleteMap.keys());
	for (var i=0; i<maxDeleteBuildingsCount; i++)
	{
		neoBuilding = buildingsToDeleteArray[i];
		this.deleteNeoBuilding(gl, neoBuilding);
		this.processQueue.buildingsToDeleteMap.delete(neoBuilding);
	}
	buildingsToDeleteArray = [];
	buildingsToDeleteArray = undefined;
	
	// parse pendent data.
	var maxParsesCount = 2;
	
	// parse references lod0 & lod 1.
	toParseCount = this.parseQueue.octreesLod0ReferencesToParseArray.length;
	if (toParseCount < maxParsesCount)
	{ maxParsesCount = toParseCount; }
	
	var lowestOctree;
	var neoBuilding;
	
	if (this.matrix4SC === undefined)
	{ this.matrix4SC = new Matrix4(); }
	
	for (var i=0; i<maxParsesCount; i++)
	{
		lowestOctree = this.parseQueue.octreesLod0ReferencesToParseArray.shift();
		
		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{ continue; }
		
		if (lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer === undefined)
		{ continue; }
		
		neoBuilding = lowestOctree.neoBuildingOwner;
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		this.matrix4SC.setByFloat32Array(buildingGeoLocation.rotMatrix._floatArrays);
		lowestOctree.neoReferencesMotherAndIndices.parseArrayBufferReferences(gl, lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer, this.readerWriter, neoBuilding.motherNeoReferencesArray, this.matrix4SC, this);
		lowestOctree.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(0, buildingGeoLocation.rotMatrix);
		lowestOctree.neoReferencesMotherAndIndices.dataArraybuffer = undefined;
	}
	
	// parse models lod0 & lod1.
	maxParsesCount = 2;
	var toParseCount = this.parseQueue.octreesLod0ModelsToParseArray.length;
	if (toParseCount < maxParsesCount)
	{ maxParsesCount = toParseCount; }
	
	for (var i=0; i<maxParsesCount; i++)
	{
		lowestOctree = this.parseQueue.octreesLod0ModelsToParseArray.shift();
		
		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{ continue; }
		
		var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
		if (blocksList.dataArraybuffer === undefined)
		{ continue; }
		
		neoBuilding = lowestOctree.neoBuildingOwner;
		blocksList.parseBlocksList(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
		blocksList.dataArraybuffer = undefined;
	}
	
	// parse lego lod2.
	maxParsesCount = 3;
	var toParseCount = this.parseQueue.octreesLod2LegosToParseArray.length;
	if (toParseCount < maxParsesCount)
	{ maxParsesCount = toParseCount; }
	
	for (var i=0; i<maxParsesCount; i++)
	{
		lowestOctree = this.parseQueue.octreesLod2LegosToParseArray.shift();
		if (lowestOctree.lego === undefined)
		{ continue; }
		
		lowestOctree.lego.parseArrayBuffer(gl, lowestOctree.lego.dataArrayBuffer, this);
		lowestOctree.lego.dataArrayBuffer = undefined;
	}
};

/**
 * LOD0, LOD1 에 대한 F4D ModelData, ReferenceData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistance = function(gl, scene, globalVisibleObjControlerOctrees, fileRequestExtraCount) 
{
	if (this.fileRequestControler.isFullPlus(fileRequestExtraCount))	{ return; }

	var refListsParsingCount = 0;
	var maxRefListParsingCount = 20;
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var buildingFolderName;
	var neoBuilding;
	// LOD0 & LOD1
	// Check if the lod0lowestOctrees, lod1lowestOctrees must load and parse data
	var currentVisibleOctrees = [].concat(globalVisibleObjControlerOctrees.currentVisibles0, globalVisibleObjControlerOctrees.currentVisibles1);
	var lowestOctree;
	for (var i=0, length = currentVisibleOctrees.length; i<length; i++) 
	{
		//if (this.vboMemoryManager.isGpuMemFull())
		//{ return; }
		
		//if (refListsParsingCount > maxRefListParsingCount && this.fileRequestControler.isFullPlus(fileRequestExtraCount)) 
		//{ return; }
	
		//if (this.fileRequestControler.isFullPlus(fileRequestExtraCount)) 
		//{ return; }
			
		lowestOctree = currentVisibleOctrees[i];
		neoBuilding = lowestOctree.neoBuildingOwner;
		
		if (neoBuilding === undefined)
		{ continue; }
		
		if (lowestOctree.triPolyhedronsCount === 0) 
		{ continue; }
		
		if (lowestOctree.octree_number_name === undefined)
		{ continue; }
	
		buildingFolderName = neoBuilding.buildingFileName;
		
		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
		}

		if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.READY)
		{
			if (this.fileRequestControler.isFullPlus(fileRequestExtraCount))	{ return; }

			if (lowestOctree.neoReferencesMotherAndIndices.blocksList === undefined)
			{ lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList(); }

			var subOctreeNumberName = lowestOctree.octree_number_name.toString();
			var references_folderPath = geometryDataPath + "/" + buildingFolderName + "/References";
			var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
			this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree, this);
			continue;
		}

		if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.PARSE_FINISHED ) 
		{
			// 4 = parsed.***
			// now, check if the blocksList is loaded & parsed.***
			var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
			// 0 = file loading NO started.***
			if (blocksList.fileLoadState === CODE.fileLoadState.READY) 
			{
				if (this.fileRequestControler.isFullPlus(fileRequestExtraCount))	{ return; }

				// must read blocksList.***
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var blocks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Models";
				var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
				this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, lowestOctree, this);
				continue;
			}
		}
		
		// if the lowest octree is not ready to render, then:
		if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED )
		{
			globalVisibleObjControlerOctrees.currentVisibles2.push(lowestOctree);
		}
	}
};

/**
 * LOD2 에 대한 F4D LegoData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistanceLOD2 = function(gl, scene, globalVisibleObjControlerOctrees, fileRequestExtraCount) 
{
	var extraCount = fileRequestExtraCount;
	if (this.fileRequestControler.isFullPlus(extraCount))	{ return; }

	//var visibleObjControlerOctrees = neoBuilding.currentVisibleOctreesControler;
	if (globalVisibleObjControlerOctrees === undefined)
	{ return; }

	var lowestOctreeLegosParsingCount = 0;
	var maxLowestOctreeLegosParsingCount = 100;
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var neoBuilding;
	var buildingFolderName;

	// LOD2
	// Check if the lod2lowestOctrees must load and parse data
	var lowestOctree;

	for (var i=0, length = globalVisibleObjControlerOctrees.currentVisibles2.length; i<length; i++) 
	{
		lowestOctree = globalVisibleObjControlerOctrees.currentVisibles2[i];
		
		if (lowestOctree.octree_number_name === undefined)
		{ continue; }
		
		if (lowestOctree.lego === undefined) 
		{
			lowestOctree.lego = new Lego();
			lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
		}

		if (lowestOctree.lego === undefined && lowestOctree.lego.dataArrayBuffer === undefined) 
		{ continue; }
	
		neoBuilding = lowestOctree.neoBuildingOwner;
		if (neoBuilding === undefined)
		{ continue; }
		
		buildingFolderName = neoBuilding.buildingFileName;

		if (neoBuilding.buildingType === "outfitting")
		{ continue; }

		// && lowestOctree.neoRefsList_Array.length === 0)
		if (lowestOctree.lego.fileLoadState === CODE.fileLoadState.READY && !this.isCameraMoving) 
		{
			// must load the legoStructure of the lowestOctree.***
			if (!this.fileRequestControler.isFullPlus(extraCount))
			{
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var bricks_folderPath = geometryDataPath + "/" + buildingFolderName + "/Bricks";
				var filePathInServer = bricks_folderPath + "/" + subOctreeNumberName + "_Brick";
				this.readerWriter.getOctreeLegoArraybuffer(filePathInServer, lowestOctree, this);
			}
			continue;
		}
		/*
		if (lowestOctree.lego.fileLoadState === 2 && !this.isCameraMoving) 
		{
			if (lowestOctreeLegosParsingCount < maxLowestOctreeLegosParsingCount) 
			{
				var bytesReaded = 0;
				lowestOctree.lego.parseArrayBuffer(gl, lowestOctree.lego.dataArrayBuffer, this);
				lowestOctree.lego.dataArrayBuffer = undefined;
				lowestOctreeLegosParsingCount++;
			}
			continue;
		}
		*/
		// finally check if there are legoSimpleBuildingTexture.***
		if (lowestOctree.lego.vbo_vicks_container.vboCacheKeysArray[0] && lowestOctree.lego.vbo_vicks_container.vboCacheKeysArray[0].meshTexcoordsCacheKey)
		{
			if (neoBuilding.simpleBuilding3x3Texture === undefined)
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

MagoManager.prototype.renderLowestOctreeAsimetricVersion = function(gl, cameraPosition, shader, renderTexture, ssao_idx, visibleObjControlerBuildings) 
{
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	gl.frontFace(gl.CCW);
	//gl.depthFunc(gl.GREATER);
	//gl.enable(gl.CULL_FACE);
	gl.depthRange(0.0, 1.0);
	
	gl.enable(gl.DEPTH_TEST);

	if (ssao_idx === -1) 
	{
		// is selection.***
	}
	else 
	{

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
		if (ssao_idx === 0) 
		{
			
			gl.disable(gl.BLEND);
			this.depthRenderLowestOctreeAsimetricVersion(gl, ssao_idx, visibleObjControlerBuildings);
		}
		if (ssao_idx === 1) 
		{
			
			// 2) ssao render.************************************************************************************************************
			var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles0.length;
			if (neoBuildingsCount > 0)
			{
				if (this.noiseTexture === undefined) 
				{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }

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
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	
				gl.uniform1f(currentShader.screenHeight_loc, this.sceneState.drawingBufferHeight);
				gl.uniform1f(currentShader.shininessValue_loc, 40.0);

				gl.uniform1i(currentShader.depthTex_loc, 0);
				gl.uniform1i(currentShader.noiseTex_loc, 1);
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***

				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
				
				gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);
				
				// lighting.
				//this.magoPolicy.setSpecularColor(api.getSpecularColor());
				gl.uniform3fv(currentShader.specularColor_loc, [0.7, 0.7, 0.7]);
				gl.uniform1f(currentShader.ssaoRadius_loc, this.magoPolicy.getSsaoRadius());  

				gl.uniform1f(currentShader.ambientReflectionCoef_loc, this.magoPolicy.getAmbientReflectionCoef());
				gl.uniform1f(currentShader.diffuseReflectionCoef_loc, this.magoPolicy.getDiffuseReflectionCoef());
				gl.uniform1f(currentShader.specularReflectionCoef_loc, this.magoPolicy.getSpecularReflectionCoef());
				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
				
				//gl.clearStencil(0);
				this.visibleObjControlerOctreesAux.initArrays();
				
				// 1) LOD0 & LOD1.*********************************************************************************************************************
				var refTMatrixIdxKey = 0;
				var minSize = 0.0;
				var renderTexture;
				if (this.isLastFrustum)
				{
					this.renderer.renderNeoBuildingsAsimetricVersion(gl, visibleObjControlerBuildings, this, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
				}
				
				if (currentShader)
				{
					if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
					if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
					if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
					if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
				}

			}
			// 2) LOD 2 & 3.************************************************************************************************************************************
			var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
			if (neoBuildingsCount > 0)
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
				gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);

				gl.uniform1i(currentShader.depthTex_loc, 0);
				gl.uniform1i(currentShader.noiseTex_loc, 1);
				gl.uniform1i(currentShader.diffuseTex_loc, 2); // no used.***
				gl.uniform1f(currentShader.fov_loc, this.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
				gl.uniform1f(currentShader.aspectRatio_loc, this.sceneState.camera.frustum.aspectRatio);
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	
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
				
				if (currentShader)
				{
					if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
					if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
					if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
					if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
				}
			}
			
			// If there are an object selected, then there are a stencilBuffer.******************************************
			if (this.buildingSelected && this.objectSelected) // if there are an object selected then there are a building selected.***
			{
				neoBuilding = this.buildingSelected;
				var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				var neoReferencesMotherAndIndices = this.octreeSelected.neoReferencesMotherAndIndices;
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				
				// do as the "getSelectedObjectPicking".**********************************************************
				currentShader = this.postFxShadersManager.pFx_shaders_array[14]; // silhouette shader.***
				var shaderProgram = currentShader.program;
				gl.useProgram(shaderProgram);
				
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
				
				var offsetSize = 3/1000;
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
				this.renderer.renderNeoReferenceAsimetricVersionColorSelection(gl, this.objectSelected, neoReferencesMotherAndIndices, neoBuilding, this, currentShader, maxSizeToRender, refMatrixIdxKey, glPrimitive);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
				this.renderer.renderNeoReferenceAsimetricVersionColorSelection(gl, this.objectSelected, neoReferencesMotherAndIndices, neoBuilding, this, currentShader, maxSizeToRender, refMatrixIdxKey, glPrimitive);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
				this.renderer.renderNeoReferenceAsimetricVersionColorSelection(gl, this.objectSelected, neoReferencesMotherAndIndices, neoBuilding, this, currentShader, maxSizeToRender, refMatrixIdxKey, glPrimitive);
				gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
				this.renderer.renderNeoReferenceAsimetricVersionColorSelection(gl, this.objectSelected, neoReferencesMotherAndIndices, neoBuilding, this, currentShader, maxSizeToRender, refMatrixIdxKey, glPrimitive);
				gl.enable(gl.DEPTH_TEST);// return to the normal state.***
				gl.disable(gl.STENCIL_TEST);
				gl.depthRange(0, 1);// return to the normal value.***
				gl.disableVertexAttribArray(currentShader.position3_loc);
				
				if (currentShader)
				{
					if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
					if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
					if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
					if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
				}
				
			}
			
			// 3) now render bboxes.*******************************************************************************************************************
			if (this.magoPolicy.getShowBoundingBox())
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
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	
				gl.uniform1f(currentShader.screenHeight_loc, this.sceneState.drawingBufferHeight);


				gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
				gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);

				var visibleBuildingsCount = this.visibleObjControlerBuildings.currentVisibles0.length;
				for (var b=0; b<visibleBuildingsCount; b++)
				{
					neoBuilding = this.visibleObjControlerBuildings.currentVisibles0[b];
					gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***
					var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

					this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
					gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
					this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, neoBuilding.isHighLighted);
				}

				visibleBuildingsCount = this.visibleObjControlerBuildings.currentVisibles2.length;
				//if(visibleBuildingsCount > 0)
				//	visibleBuildingsCount = 10;

				for (var b=0; b<visibleBuildingsCount; b++)
				{
					neoBuilding = this.visibleObjControlerBuildings.currentVisibles2[b];
					gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***

					var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
					gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
					gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
					gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

					this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
					gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
					this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, neoBuilding.isHighLighted);
				}
				
				if (currentShader)
				{
					if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
					if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
					if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
					if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
				}
			}
			
			// 4) Render ObjectMarkers.********************************************************************************************************
			// 4) Render ObjectMarkers.********************************************************************************************************
			// 4) Render ObjectMarkers.********************************************************************************************************
			var objectsMarkersCount = this.objMarkerManager.objectMarkerArray.length;
			if (objectsMarkersCount > 0)
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
				gl.uniform1f(currentShader.screenWidth_loc, this.sceneState.drawingBufferWidth);	
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
					if(currentShader.texCoord2_loc !== -1)gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					if(currentShader.position3_loc !== -1)gl.disableVertexAttribArray(currentShader.position3_loc);
					if(currentShader.normal3_loc !== -1)gl.disableVertexAttribArray(currentShader.normal3_loc);
					if(currentShader.color4_loc !== -1)gl.disableVertexAttribArray(currentShader.color4_loc);
				}
				*/
				
				// now repeat the objects markers for png images.***
				// Png for pin image 128x128.********************************************************************
				if (this.pin.positionBuffer === undefined)
				{ this.pin.createPinCenterBottom(gl); }
				
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
				gl.disableVertexAttribArray(currentShader.texCoord2_loc);
				gl.disableVertexAttribArray(currentShader.position3_loc);
				
			}
			
		}
		
		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		if (currentShader)
		{
			if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
			if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
			if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
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

MagoManager.prototype.depthRenderLowestOctreeAsimetricVersion = function(gl, ssao_idx, visibleObjControlerBuildings) 
{
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
	if (neoBuildingsCount > 0)
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
		var refTMatrixIdxKey = 0;
		var minSize = 0.0;
		if (this.isLastFrustum)
		{
			this.renderer.renderNeoBuildingsAsimetricVersion(gl, visibleObjControlerBuildings, this, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
		}
	}
	if (currentShader)
	{
		//if(currentShader.position3_loc !== -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	}
	
	// 2) LOD 2 & 3.************************************************************************************************************************************
	var neoBuildingsCount = visibleObjControlerBuildings.currentVisibles2.length;
	if (neoBuildingsCount > 0)
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

		//if(currentShader.position3_loc !== -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	}
	
	if (currentShader)
	{
		//if(currentShader.position3_loc !== -1)gl.disableVertexAttribArray(currentShader.position3_loc);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
MagoManager.prototype.createDefaultShaders = function(gl) 
{
	// here creates the necessary shaders for mago3d.***
	// 1) ModelReferences ssaoShader.******************************************************************************
	var shaderName = "modelReferencesSsao";
	var shader = this.postFxShadersManager.newShader(shaderName);
	var ssao_vs_source = ShaderSource.ModelRefSsaoVS;
	var ssao_fs_source = ShaderSource.ModelRefSsaoFS;

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
MagoManager.prototype.renderLodBuilding = function(gl, cameraPosition, scene, shader, renderTexture, ssao_idx, lodBuilding) 
{
	// file loaded but not parsed.***
	if (lodBuilding.fileLoadState === CODE.fileLoadState.LOADING_FINISHED) 
	{
		lodBuilding.parseArrayBuffer(gl, this.readerWriter);
	}

	this.renderer.renderLodBuilding(gl, lodBuilding, this, shader, ssao_idx);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param BR_Project 변수
 */
MagoManager.prototype.createFirstTimeVBOCacheKeys = function(gl, BR_Project) 
{
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
	var vt_cacheKey = simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0];

	// interleaved vertices_texCoords.***
	vt_cacheKey._verticesArray_cacheKey = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vt_cacheKey._verticesArray_cacheKey);
	gl.bufferData(gl.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer, gl.STATIC_DRAW);
	simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].verticesArrayBuffer = null;

	// normals.***
	if (simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer !== undefined) 
	{
		vt_cacheKey._normalsArray_cacheKey = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vt_cacheKey._normalsArray_cacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer, gl.STATIC_DRAW);
		simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0].normalsArrayBuffer = null;
	}

	// Simple building texture(create 1pixel X 1pixel bitmap).****************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/Webgl_API/Tutorial/Using_textures_in_Webgl
	if (simpBuildingV1._simpleBuildingTexture === undefined) { simpBuildingV1._simpleBuildingTexture = gl.createTexture(); }

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
MagoManager.prototype.reCalculateModelViewProjectionRelToEyeMatrix = function(scene) 
{
	for (var i=0; i<16; i++) 
	{
		if (scene.context._us._modelView[i] === 0) { return; }
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
MagoManager.prototype.renderTerranTileServiceFormatPostFxShader = function(scene, isLastFrustum) 
{
	if (!isLastFrustum) { return; }
	if (this.isCameraInsideNeoBuilding) { return; }

	var gl = scene.context._gl;
	var cameraPosition = scene.context._us._cameraPosition;
	var cullingVolume = scene._frameState.cullingVolume;
	//	var modelViewProjectionRelativeToEye = scene.context._us._modelViewProjectionRelativeToEye;

	gl.disable(gl.CULL_FACE);

	// Check if camera was moved considerably for update the renderables objects.***
	if (this.detailed_building) 
	{
		this.squareDistUmbral = 4.5*4.5;
	}
	else 
	{
		this.squareDistUmbral = 50*50;
	}
	this.isCameraMoved(cameraPosition, this.squareDistUmbral);

	if (this.depthFbo === undefined) { this.depthFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight); }
	if (this.ssaoFbo === undefined) { this.ssaoFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight); } // no used.***

	// Another check for depthBuffer.***
	if (this.depthFbo.width !== scene.drawingBufferWidth || this.depthFbo.height !== scene.drawingBufferHeight) 
	{
		this.depthFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}

	//if(cameraMoved && !this.isCameraMoving)
	if (!this.isCameraMoving) 
	{
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
	if (this.detailed_building && isLastFrustum) 
	{
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
	if (this.isCameraMoving) 
	{
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
	for (var i=0; i<LOD0_projectsCount; i++) 
	{
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];

		//if(!this.isCameraMoving)
		//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if (BR_Project._header._f4d_version === 2) 
		{
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if (simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey === null) 
			{
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			}
			else if (!BR_Project._f4d_nailImage_readed) 
			{
				if (this.backGround_imageReadings_count < 100) 
				{
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;

					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			}
			else if (!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists) 
			{
				if (!this.isCameraMoving && this.backGround_fileReadings_count < 1) 
				{
					//filePath_scratch = this.readerWriter.geometryDataPath +"/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
					filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";

					this.readerWriter.readNailImage(gl, filePath_scratch, BR_Project, this.readerWriter, this, 0);
					this.backGround_fileReadings_count ++;

				}
				//continue;
			}
		}
		else 
		{
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}
		//		}

		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if (BR_Project._simpleBuilding_v1) 
		{
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
	for (var p_counter = 0; p_counter<projects_count; p_counter++) 
	{
		var BR_Project = this.currentVisibleBuildings_array[p_counter];

		//if(!this.isCameraMoving)
		//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if (BR_Project._header._f4d_version === 2) 
		{
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if (simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey === null) 
			{
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			}
			else if (!BR_Project._f4d_nailImage_readed) 
			{
				if (this.backGround_imageReadings_count < 100) 
				{
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;

					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			}
		}
		else 
		{
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}
		//		}

		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if (BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished) 
		{
			this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, -1, currentShader); // 3 = lod3.***
		}
	}
	//gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	gl.disableVertexAttribArray(currentShader.position3_loc);
	gl.disableVertexAttribArray(currentShader.normal3_loc);
	this.depthFbo.unbind(); // DEPTH END.*****************************************************************************************************************************************************************

	// Now, ssao.************************************************************
	scene._context._currentFramebuffer._bind();

	if (this.depthFbo.width !== scene.drawingBufferWidth || this.depthFbo.height !== scene.drawingBufferHeight) 
	{
		this.depthFbo = new FBO(gl, scene.drawingBufferWidth, scene.drawingBufferHeight);
	}

	//this.ssaoFbo.bind();// SSAO START.********************************************************************************************************************************************************************
	gl.clearColor(0, 0, 0, 1);
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, scene.drawingBufferWidth, scene.drawingBufferHeight);

	if (this.noiseTexture === undefined) { this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }

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
	for (var i=0; i<LOD0_projectsCount; i++) 
	{
		var BR_Project = this.currentVisibleBuildings_LOD0_array[i];

		//if(!this.isCameraMoving)
		//		{
		// Check if this building has readed 1- Header, 2- SimpBuilding, 3- NailImage.******************************
		if (BR_Project._header._f4d_version === 2) 
		{
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if (simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey === null) 
			{
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			}
			else if (!BR_Project._f4d_nailImage_readed) 
			{
				if (this.backGround_imageReadings_count < 100) 
				{
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;

					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			}
			else if (!BR_Project._f4d_lod0Image_readed && BR_Project._f4d_nailImage_readed_finished && BR_Project._f4d_lod0Image_exists) 
			{
				if (!this.isCameraMoving && this.backGround_fileReadings_count < 1) 
				{
					//filePath_scratch = this.readerWriter.geometryDataPath +"/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
					filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";

					this.readerWriter.readNailImage(gl, filePath_scratch, BR_Project, this.readerWriter, this, 0);
					this.backGround_fileReadings_count ++;
				}
				//continue;
			}
		}
		else 
		{
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}

		//		}

		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if (BR_Project._simpleBuilding_v1) 
		{
			//renderSimpleBuildingV1PostFxShader
			if (BR_Project._f4d_lod0Image_exists) 
			{
				if (BR_Project._f4d_lod0Image_readed_finished) { this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 0, currentShader); } // 0 = lod0.***
				else if (BR_Project._f4d_nailImage_readed_finished) 
				{
					this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 3, currentShader); // 3 = lod3.***
				}
			}
			else if (BR_Project._f4d_nailImage_readed_finished) 
			{
				this.renderer.renderSimpleBuildingV1PostFxShader(gl, BR_Project, this, 3, currentShader); // 3 = lod3.***
			}
		}
	}

	var projects_count = this.currentVisibleBuildings_array.length;
	for (var p_counter = 0; p_counter<projects_count; p_counter++) 
	{
		/*
		if(!isLastFrustum && this.isCameraMoving && timeControlCounter === 0)
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
		if (BR_Project._header._f4d_version === 2) 
		{
			//if(!BR_Project._f4d_nailImage_readed && BR_Project._f4d_simpleBuilding_readed_finished)
			var simpleObj = BR_Project._simpleBuilding_v1._simpleObjects_array[0];
			if (simpleObj._vtCacheKeys_container._vtArrays_cacheKeys_array[0]._verticesArray_cacheKey === null) 
			{
				this.createFirstTimeVBOCacheKeys(gl, BR_Project);
				continue;
			}
			else if (!BR_Project._f4d_nailImage_readed) 
			{
				if (this.backGround_imageReadings_count < 100) 
				{
					this.backGround_imageReadings_count++;
					BR_Project._f4d_nailImage_readed = true;

					var simpBuildingV1 = BR_Project._simpleBuilding_v1;
					this.readerWriter.readNailImageOfArrayBuffer(gl, simpBuildingV1.textureArrayBuffer, BR_Project, this.readerWriter, this, 3);
				}
				continue;
			}
		}
		else 
		{
			this.currentVisibleBuildingsPost_array.push(BR_Project);
		}

		//		}

		//if(BR_Project._simpleBuilding_v1 && BR_Project._f4d_simpleBuilding_readed_finished)// Original.***
		// Test
		if (BR_Project._simpleBuilding_v1 && BR_Project._f4d_nailImage_readed_finished) 
		{
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

	for (var i=0; i<last_simpBuilds_count; i++) 
	{
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
MagoManager.prototype.deleteNeoBuilding = function(gl, neoBuilding) 
{
	// check if the neoBuilding id the selected building.***
	var vboMemoryManager = this.vboMemoryManager;
	if (neoBuilding === this.buildingSelected)
	{
		this.buildingSelected = undefined;
		this.octreeSelected = undefined;
		this.objectSelected = undefined;
	}

	neoBuilding.metaData.deleteObjects();
	neoBuilding.metaData.fileLoadState = CODE.fileLoadState.READY;

	var blocksCount = neoBuilding.motherBlocksArray.length;
	for (var i=0; i<blocksCount; i++)
	{
		if (neoBuilding.motherBlocksArray[i])
		{ neoBuilding.motherBlocksArray[i].deleteObjects(gl, vboMemoryManager); }
		neoBuilding.motherBlocksArray[i] = undefined;
	}
	neoBuilding.motherBlocksArray = [];

	var referencesCount = neoBuilding.motherNeoReferencesArray.length;
	for (var i=0; i<referencesCount; i++)
	{
		if (neoBuilding.motherNeoReferencesArray[i])
		{ neoBuilding.motherNeoReferencesArray[i].deleteGlObjects(gl, vboMemoryManager); }
		neoBuilding.motherNeoReferencesArray[i] = undefined;
	}
	neoBuilding.motherNeoReferencesArray = [];

	// The octree.
	if (neoBuilding.octree !== undefined)
	{ neoBuilding.octree.deleteGlObjects(gl, vboMemoryManager); }
	neoBuilding.octree = undefined; // f4d_octree. Interior objects.***
	neoBuilding.octreeLoadedAllFiles = false;
	
	//neoBuilding.buildingFileName = "";

	neoBuilding.allFilesLoaded = false;
	neoBuilding.isReadyToRender = false;

	// delete textures.
	/*
	//if(neoBuilding.texturesLoaded)
	{
		var texturesCount = neoBuilding.texturesLoaded.length;
		for(var i=0; i<texturesCount; i++)
		{
			if(neoBuilding.texturesLoaded[i])
			{
				gl.deleteTexture(neoBuilding.texturesLoaded[i].texId);
				neoBuilding.texturesLoaded[i].deleteObjects();
			}
			neoBuilding.texturesLoaded[i] = undefined;
		}
	}
	//neoBuilding.texturesLoaded = undefined;
	*/
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.doFrustumCullingNeoBuildings = function(frustumVolume, cameraPosition) 
{
	// This makes the visible buildings array.***
	//---------------------------------------------------------------------------------------------------------
	// Note: in this function, we do frustum culling and determine the detailedBuilding in same time.***
	var deleteBuildings = false;
	this.framesCounter += 1;
	if (this.framesCounter > 1000)
	{
		deleteBuildings = true;
		this.framesCounter = 0;
	}

	var squaredDistToCamera;
	var lod0_minSquaredDist = 100000;
	var lod1_minSquaredDist = 1;
	var lod2_minSquaredDist = 100000*10000;
	var lod3_minSquaredDist = 100000*9;

	this.visibleObjControlerBuildings.currentVisibles0.length = 0;
	this.visibleObjControlerBuildings.currentVisibles1.length = 0;
	this.visibleObjControlerBuildings.currentVisibles2.length = 0;
	this.visibleObjControlerBuildings.currentVisibles3.length = 0;

	var maxNumberOfCalculatingPositions = 100;
	var currentCalculatingPositionsCount = 0;
	
	if (this.boundingSphere_Aux === undefined)
	{
		this.boundingSphere_Aux = new Sphere();
	}

	for (var i=0, length = this.neoBuildingsList.neoBuildingsArray.length; i<length; i++) 
	{
		var neoBuilding = this.neoBuildingsList.get(i);

		if (this.renderingModeTemp === 2 && neoBuilding.isDemoBlock === false)
		{ continue; }

		if (neoBuilding.bbox === undefined)
		{
			if (currentCalculatingPositionsCount < maxNumberOfCalculatingPositions)
			{
				this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
				currentCalculatingPositionsCount++;
			}
			continue;
		}

		this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);

		var geoLoc = neoBuilding.geoLocDataManager.getGeoLocationData(0); // the idx = 0 -> is the 1rst (default).***
		if (geoLoc === undefined || geoLoc.pivotPoint === undefined)
		{ continue; }

		//var realBuildingPos = geoLoc.pivotPoint;
		var bboxCenterPoint = neoBuilding.bbox.getCenterPoint(bboxCenterPoint); // local bbox.
		var realBuildingPos = geoLoc.tMatrix.transformPoint3D(bboxCenterPoint, realBuildingPos);
		if (neoBuilding.buildingType === "basicBuilding")
		{
			//lod0_minSquaredDist = 50000.0;
		}
		
		if (neoBuilding.buildingId === "ctships")
		{
			lod0_minSquaredDist = 100000000;
			lod1_minSquaredDist = 1;
			lod2_minSquaredDist = 10000000*10000;
			lod3_minSquaredDist = 100000*9;
		}

		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
		squaredDistToCamera = cameraPosition.squareDistTo(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
		squaredDistToCamera -= (this.radiusAprox_aux*this.radiusAprox_aux)*2;
		if (squaredDistToCamera > this.magoPolicy.getFrustumFarSquaredDistance())
		{
			if (deleteBuildings)
			{ 
				this.deleteNeoBuilding(this.sceneState.gl, neoBuilding); 
			}
			continue;
		}
			
		this.boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
		var ratio = 1.0;
		if (this.renderingModeTemp === 0)
		{
			ratio = 1.2/2.0;
		}
		else if (this.renderingModeTemp === 1)
		{
			ratio = 4.2/2.0;
		}
		else if (this.renderingModeTemp === 2)
		{
			ratio = 1.2/2.0;
		}

		this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * ratio;

		this.boundingSphere_Aux.setRadius(this.radiusAprox_aux);
		
		var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
		// intersect with Frustum
		if (frustumCull !== Constant.INTERSECTION_OUTSIDE) 
		{	
			if (this.isLastFrustum)
			{
				if (squaredDistToCamera < lod0_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
				}
				else if (squaredDistToCamera < lod1_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
				}
				else if (squaredDistToCamera < lod2_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
				}
				else if (squaredDistToCamera < lod3_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
				}
			}
			else
			{
				if (squaredDistToCamera < lod1_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
				}
				else if (squaredDistToCamera < lod2_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
				}
				else if (squaredDistToCamera < lod3_minSquaredDist) 
				{
					this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
				}
			}
		}
		else
		{
			if (deleteBuildings)
			{ this.deleteNeoBuilding(this.sceneState.gl, neoBuilding); }
		}
	}
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.putBuildingToArraySortedByDist = function(buildingArray, neoBuilding) 
{
	// provisionally do this.
	var finished = false;
	var i=0;
	var idx;
	var buildingsCount = buildingArray.length;
	while (!finished && i<buildingsCount)
	{
		if (neoBuilding.squaredDistToCam < buildingArray[i].squaredDistToCam)
		{
			idx = i;
			finished = true;
		}
		i++;
	}
	
	if (finished)
	{
		buildingArray.splice(idx, 0, neoBuilding);
	}
	else 
	{
		buildingArray.push(neoBuilding);
	}
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.doFrustumCullingSmartTiles = function(frustumVolume, cameraPosition) 
{
	// This makes the visible buildings array.
	var smartTile1 = this.smartTileManager.tilesArray[0];
	var smartTile2 = this.smartTileManager.tilesArray[1];
	if (this.intersectedLowestTilesArray === undefined)
	{ this.intersectedLowestTilesArray = []; }
	
	this.intersectedLowestTilesArray.length = 0; // init array.
	smartTile1.getFrustumIntersectedLowestTiles(frustumVolume, this.intersectedLowestTilesArray);
	smartTile2.getFrustumIntersectedLowestTiles(frustumVolume, this.intersectedLowestTilesArray);
	
	var tilesCount = this.intersectedLowestTilesArray.length;
	
	if (tilesCount === 0)
	{ return; }
	
	var squaredDistToCamera;
	var lod0_minSquaredDist = 100000;
	var lod1_minSquaredDist = 1;
	var lod2_minSquaredDist = 100000*10000;
	var lod3_minSquaredDist = 100000*10000*2;

	this.visibleObjControlerBuildings.currentVisibles0.length = 0;
	this.visibleObjControlerBuildings.currentVisibles1.length = 0;
	this.visibleObjControlerBuildings.currentVisibles2.length = 0;
	this.visibleObjControlerBuildings.currentVisibles3.length = 0;

	var maxNumberOfCalculatingPositions = 100;
	var currentCalculatingPositionsCount = 0;
	
	var lowestTile;
	var tileCenterPos;
	var buildingSeedsCount;
	var buildingSeed;
	var neoBuilding;
	var geoLoc;
	var bboxCenterPoint;
	var realBuildingPos;
	var parentBuilding;
	var longitude, latitude, altitude, heading, pitch, roll;
	
	for (var i=0; i<tilesCount; i++)
	{
		lowestTile = this.intersectedLowestTilesArray[i];
		tileCenterPos = lowestTile.sphereExtent.centerPoint;
		squaredDistToCamera = cameraPosition.squareDistTo(tileCenterPos.x, tileCenterPos.y, tileCenterPos.z);
		if (squaredDistToCamera > lod3_minSquaredDist)
		{ continue; }
		
		if (lowestTile.buildingsArray && lowestTile.buildingsArray.length > 0)
		{
			var buildingsCount = lowestTile.buildingsArray.length;
			for (var j=0; j<buildingsCount; j++)
			{
				// determine LOD for each building.
				neoBuilding = lowestTile.buildingsArray[j];
				
				if (neoBuilding.buildingId === "U310T")
				{ var hola = 0; }
	
				geoLoc = neoBuilding.geoLocDataManager.getGeoLocationData(0);
				if (geoLoc === undefined || geoLoc.pivotPoint === undefined)
				{ 
					geoLoc = neoBuilding.geoLocDataManager.newGeoLocationData("deploymentLoc");
					longitude = neoBuilding.metaData.geographicCoord.longitude;
					latitude = neoBuilding.metaData.geographicCoord.latitude;
					altitude = neoBuilding.metaData.geographicCoord.altitude;
					heading = neoBuilding.metaData.heading;
					pitch = neoBuilding.metaData.pitch;
					roll = neoBuilding.metaData.roll;
					ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude+10, heading, pitch, roll, geoLoc, this);
					
					parentBuilding = neoBuilding;
					this.pointSC = parentBuilding.bbox.getCenterPoint(this.pointSC);
					
					if (neoBuilding.buildingId === "ctships")
					{
						// Test:
						// for this building dont translate the pivot point to the bbox center.***
						return;
					}
					//if (firstName !== "testId")
					//ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
					continue;
					
				}
				
				//realBuildingPos = geoLoc.pivotPoint;
				realBuildingPos = neoBuilding.getBBoxCenterPositionWorldCoord();
				
				if (neoBuilding.buildingId === "ctships")
				{
					lod0_minSquaredDist = 1000;
					lod1_minSquaredDist = 1;
					lod2_minSquaredDist = 10000000*10000;
					lod3_minSquaredDist = 100000*9;
				}

				this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0;
				squaredDistToCamera = cameraPosition.squareDistTo(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
				squaredDistToCamera -= (this.radiusAprox_aux*this.radiusAprox_aux)*2;
				neoBuilding.squaredDistToCam = squaredDistToCamera;
				if (squaredDistToCamera > this.magoPolicy.getFrustumFarSquaredDistance())
				{
					continue;
				}
				//this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles0, neoBuilding);

				
				if (this.isLastFrustum)
				{
					if (squaredDistToCamera < lod0_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles0, neoBuilding);
					}
					else if (squaredDistToCamera < lod1_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles1, neoBuilding);
					}
					else if (squaredDistToCamera < lod2_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles2, neoBuilding);
					}
					else if (squaredDistToCamera < lod3_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles3, neoBuilding);
					}
				}
				else
				{
					if (squaredDistToCamera < lod1_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles1.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles1, neoBuilding);
					}
					else if (squaredDistToCamera < lod2_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles2.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles2, neoBuilding);
					}
					else if (squaredDistToCamera < lod3_minSquaredDist) 
					{
						//this.visibleObjControlerBuildings.currentVisibles3.push(neoBuilding);
						this.putBuildingToArraySortedByDist(this.visibleObjControlerBuildings.currentVisibles3, neoBuilding);
					}
				}
				
			}
		
		}
		else
		{
			// create the buildings by buildingSeeds.
			buildingSeedsCount = lowestTile.buildingSeedsArray.length;
			for (var j=0; j<buildingSeedsCount; j++)
			{
				buildingSeed = lowestTile.buildingSeedsArray[j];
				neoBuilding = new NeoBuilding();
				
				if (lowestTile.buildingsArray === undefined)
				{ lowestTile.buildingsArray = []; }
				
				lowestTile.buildingsArray.push(neoBuilding);
				
				if (neoBuilding.metaData === undefined) 
				{ neoBuilding.metaData = new MetaData(); }

				if (neoBuilding.metaData.geographicCoord === undefined)
				{ neoBuilding.metaData.geographicCoord = new GeographicCoord(); }

				if (neoBuilding.metaData.bbox === undefined) 
				{ neoBuilding.metaData.bbox = new BoundingBox(); }

				// create a building and set the location.***
				neoBuilding.name = buildingSeed.name;
				neoBuilding.buildingId = buildingSeed.buildingId;
				neoBuilding.buildingType = "basicBuilding";
				neoBuilding.buildingFileName = buildingSeed.buildingFileName;
				neoBuilding.metaData.geographicCoord.setLonLatAlt(buildingSeed.geographicCoord.longitude, buildingSeed.geographicCoord.latitude, buildingSeed.geographicCoord.altitude);
				neoBuilding.metaData.bbox = buildingSeed.bBox;
				if (neoBuilding.bbox === undefined)
				{ neoBuilding.bbox = new BoundingBox(); }
				neoBuilding.bbox.copyFrom(buildingSeed.bBox);
				neoBuilding.metaData.heading = buildingSeed.rotationsDegree.z;
				neoBuilding.metaData.pitch = buildingSeed.rotationsDegree.x;
				neoBuilding.metaData.roll = buildingSeed.rotationsDegree.y;
				if (neoBuilding.bbox === undefined)
				{
					if (currentCalculatingPositionsCount < maxNumberOfCalculatingPositions)
					{
						this.visibleObjControlerBuildings.currentVisibles0.push(neoBuilding);
						//this.parseQueue.neoBuildingsHeaderToParseArray.push(neoBuilding);
						currentCalculatingPositionsCount++;
					}
					continue;
				}
			}
		}
	}
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.flyToBuilding = function(dataKey) 
{
	var neoBuilding = this.getNeoBuildingById(null, dataKey);

	if (neoBuilding === undefined)
	{ return; }

	// calculate realPosition of the building.****************************************************************************
	var realBuildingPos;
	if (this.renderingModeTemp === 1 || this.renderingModeTemp === 2) // 0 = assembled mode. 1 = dispersed mode.***
	{
		if (neoBuilding.geoLocationDataAux === undefined) 
		{
			var realTimeLocBlocksList = MagoConfig.getData().alldata;
			var newLocation = realTimeLocBlocksList[neoBuilding.dataKey];
			// must calculate the realBuildingPosition (bbox_center_position).***

			if (newLocation) 
			{
				neoBuilding.geoLocationDataAux = ManagerUtils.calculateGeoLocationData(newLocation.LONGITUDE, newLocation.LATITUDE, newLocation.ELEVATION, heading, pitch, roll, neoBuilding.geoLocationDataAux, this);
				this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
				//realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
				realBuildingPos = neoBuilding.geoLocationDataAux.pivotPoint;
			}
			else 
			{
				// use the normal data.***
				this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
				realBuildingPos = neoBuilding.transfMat.transformPoint3D(this.pointSC, realBuildingPos );
			}
		}
		else 
		{
			this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
			//realBuildingPos = neoBuilding.geoLocationDataAux.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
			realBuildingPos = neoBuilding.geoLocationDataAux.pivotPoint;
		}
	}
	else 
	{
		var buildingGeoLocation = neoBuilding.geoLocDataManager.getGeoLocationData(0);
		this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
		realBuildingPos = buildingGeoLocation.tMatrix.transformPoint3D(this.pointSC, realBuildingPos );
	}
	// end calculating realPosition of the building.------------------------------------------------------------------------

	if (realBuildingPos === undefined)
	{ return; }

	//
	
	if (this.renderingModeTemp === 0)
	{ this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0; }
	if (this.renderingModeTemp === 1)
	{ this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0; }
	if (this.renderingModeTemp === 2)
	{ this.radiusAprox_aux = (neoBuilding.bbox.maxX - neoBuilding.bbox.minX) * 1.2/2.0; }

	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }
	
	this.boundingSphere_Aux.radius = this.radiusAprox_aux;

	//var position = new Cesium.Cartesian3(this.pointSC.x, this.pointSC.y, this.pointSC.z);
	//var cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
		var viewer = this.scene.viewer;
		var seconds = 3;
		this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, seconds);
	}
	else if (this.configInformation.geo_view_library === Constant.WORLDWIND)
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
MagoManager.prototype.getNeoBuildingById = function(buildingType, buildingId) 
{
	/*
	// old.
	var buildingCount = this.neoBuildingsList.neoBuildingsArray.length;
	var find = false;
	var i=0;
	var resultNeoBuilding;
	while (!find && i<buildingCount) 
	{
		if (buildingType)
		{
			if (this.neoBuildingsList.neoBuildingsArray[i].buildingId === buildingId && this.neoBuildingsList.neoBuildingsArray[i].buildingType === buildingType) 
			{
				find = true;
				resultNeoBuilding = this.neoBuildingsList.neoBuildingsArray[i];
			}
		}
		else 
		{
			if (this.neoBuildingsList.neoBuildingsArray[i].buildingId === buildingId) 
			{
				find = true;
				resultNeoBuilding = this.neoBuildingsList.neoBuildingsArray[i];
			}
		}
		i++;
	}
	*/
	var resultNeoBuilding = this.smartTileManager.getNeoBuildingById(buildingType, buildingId);
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
MagoManager.prototype.doFrustumCullingTerranTileServiceFormat = function(gl, frustumVolume, visibleBuildings_array, cameraPosition) 
{
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
	if (visibleTiles_count === 0) { return; }

	for (var i=0; i<visibleTiles_count; i++) 
	{
		this.terranTileSC = this.currentVisible_terranTiles_array[i];
		squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, this.terranTileSC.position);

		if (squaredDistToCamera > this.min_squaredDist_to_see) { continue; }

		if (squaredDistToCamera < this.min_squaredDist_to_see_detailed * 1.2) 
		{
			this.detailedVisibleTiles_array.push(this.terranTileSC);
		}
		else if (squaredDistToCamera <  this.min_squaredDist_to_see_LOD0 * 1.2) 
		{
			this.LOD0VisibleTiles_array.push(this.terranTileSC);
		}
		else 
		{
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
	for (var i=0; i<detailedVisibleTiles_count; i++) 
	{
		this.terranTileSC = this.detailedVisibleTiles_array[i];

		if (!this.terranTileSC.fileReading_started) 
		{
			if (this.backGround_fileReadings_count < max_tileFilesReading) 
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";
				this.readerWriter.getTileArrayBuffer(gl, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}

			continue;
		}

		if (this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished) 
		{
			//this.terranTileSC.parseFileOneBuilding(gl, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}

		need_frustumCulling = false;
		if (this.terranTileSC.visibilityType === Cesium.Intersect.INTERSECTING) { need_frustumCulling = true; }

		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for (var j=0; j<buildings_count; j++) 
		{
			BR_Project = this.detailedVisibleTiles_array[i]._BR_buildingsArray[j];
			if (BR_Project.buildingPosition === undefined) 
			{
				this.currentVisibleBuildings_LOD0_array.push(BR_Project);
				continue;
			}

			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
			if (squaredDistToCamera < this.min_squaredDist_to_see_detailed) 
			{

				// Activate this in the future, when all f4d_projects unified.***
				if (BR_Project._compRefList_Container.compRefsListArray.length > 0) 
				{
					if (BR_Project._header._f4d_version === 1) 
					{
						if (last_squared_dist) 
						{
							if (squaredDistToCamera < last_squared_dist) 
							{
								last_squared_dist = squaredDistToCamera;
								this.currentVisibleBuildings_LOD0_array.push(this.detailed_building);
								this.detailed_building = BR_Project;
							}
							else 
							{
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						}
						else 
						{
							last_squared_dist = squaredDistToCamera;
							this.detailed_building = BR_Project;
						}
					}
				}
				else 
				{
					if (BR_Project._header.isSmall) { visibleBuildings_array.push(BR_Project); }
					else { this.currentVisibleBuildings_LOD0_array.push(BR_Project); }
				}
			}
			else if (squaredDistToCamera < this.min_squaredDist_to_see_LOD0) 
			{
				if (need_frustumCulling) 
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if (need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE) 
					{
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
				}
				else { this.currentVisibleBuildings_LOD0_array.push(BR_Project); }
			}
			else 
			{
				if (need_frustumCulling) 
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if (need_frustumCulling && frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE) 
					{
						visibleBuildings_array.push(BR_Project);
					}
				}
				else { visibleBuildings_array.push(BR_Project); }
			}
		}
	}

	var LOD0VisiblesTiles_count = this.LOD0VisibleTiles_array.length;
	for (var i=0; i<LOD0VisiblesTiles_count; i++) 
	{
		this.terranTileSC = this.LOD0VisibleTiles_array[i];

		if (!this.terranTileSC.fileReading_started) 
		{
			if (this.backGround_fileReadings_count < max_tileFilesReading) 
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";
				this.readerWriter.getTileArrayBuffer(gl, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}

		if (this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished) 
		{
			//this.terranTileSC.parseFileOneBuilding(gl, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}

		need_frustumCulling = false;
		if (this.terranTileSC.visibilityType === Cesium.Intersect.INTERSECTING) { need_frustumCulling = true; }

		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for (var j=0; j<buildings_count; j++) 
		{
			BR_Project = this.LOD0VisibleTiles_array[i]._BR_buildingsArray[j];
			if (BR_Project.buildingPosition === undefined) 
			{
				visibleBuildings_array.push(BR_Project);
				continue;
			}

			squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
			if (squaredDistToCamera < this.min_squaredDist_to_see_LOD0) 
			{
				if (need_frustumCulling) 
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if (frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE) 
					{
						this.currentVisibleBuildings_LOD0_array.push(BR_Project);
					}
				}
				else { this.currentVisibleBuildings_LOD0_array.push(BR_Project); }
			}
			else 
			{
				if (need_frustumCulling) 
				{
					this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
					if (frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE) 
					{
						visibleBuildings_array.push(BR_Project);
					}
				}
				else { visibleBuildings_array.push(BR_Project); }
			}
		}
	}

	var filteredVisibleTiles_count = this.filteredVisibleTiles_array.length;
	for (var i=0; i<filteredVisibleTiles_count; i++) 
	{
		this.terranTileSC = this.filteredVisibleTiles_array[i];
		if (!this.terranTileSC.fileReading_started) 
		{
			if (this.backGround_fileReadings_count < max_tileFilesReading) 
			{
				tileNumberNameString = this.terranTileSC._numberName.toString();
				filePath_scratch = this.readerWriter.geometryDataPath + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";
				this.readerWriter.getTileArrayBuffer(gl, filePath_scratch, this.terranTileSC, this.readerWriter, this);
				this.backGround_fileReadings_count ++;
			}
			continue;
		}

		if (this.terranTileSC.fileReading_finished && !this.terranTileSC.fileParsingFinished) 
		{
			//this.terranTileSC.parseFileOneBuilding(gl, this);
			this.terranTileSC.parseFileAllBuildings(this);
			//continue;
		}

		need_frustumCulling = false;
		if (this.terranTileSC.visibilityType === Cesium.Intersect.INTERSECTING) { need_frustumCulling = true; }

		buildings_count = this.terranTileSC._BR_buildingsArray.length;
		for (var j=0; j<buildings_count; j++) 
		{
			BR_Project = this.filteredVisibleTiles_array[i]._BR_buildingsArray[j];
			if (BR_Project.buildingPosition === undefined) 
			{
				visibleBuildings_array.push(BR_Project);
				continue;
			}
			else 
			{
				squaredDistToCamera = Cesium.Cartesian3.distanceSquared(cameraPosition, BR_Project.buildingPosition);
				if (BR_Project._header.isSmall) 
				{
					if (squaredDistToCamera < this.min_squaredDist_to_see_smallBuildings) 
					{
						if (need_frustumCulling) 
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if (frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE)
							{ visibleBuildings_array.push(BR_Project); }
						}
						else { visibleBuildings_array.push(BR_Project); }
					}
				}
				else 
				{
					// Provisionally check for LODzero distance.***
					if (squaredDistToCamera < this.min_squaredDist_to_see_LOD0) 
					{
						if (need_frustumCulling) 
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if (frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE) 
							{
								this.currentVisibleBuildings_LOD0_array.push(BR_Project);
							}
						}
						else { this.currentVisibleBuildings_LOD0_array.push(BR_Project); }
					}
					else 
					{
						if (need_frustumCulling) 
						{
							this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(BR_Project.buildingPosition);
							if (frustumVolume.computeVisibility(this.boundingSphere_Aux) !== Cesium.Intersect.OUTSIDE)
							{ visibleBuildings_array.push(BR_Project); }
						}
						else { visibleBuildings_array.push(BR_Project); }
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
MagoManager.prototype.doFrustumCullingClouds = function(frustumVolume, visibleBuildings_array, cameraPosition) 
{
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
	for (var p_counter = 0; p_counter<clouds_count; p_counter++) 
	{
		var cloud = this.atmosphere.cloudsManager.circularCloudsArray[p_counter];

		if (cloud.cullingPosition === undefined) 
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

		if (this.radiusAprox_aux) 
		{
			this.boundingSphere_Aux.radius = this.radiusAprox_aux;
		}
		else 
		{
			this.boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		}

		var frustumCull = frustumVolume.computeVisibility(this.boundingSphere_Aux);
		if (frustumCull !== Cesium.Intersect.OUTSIDE) 
		{
			this.currentVisibleClouds_array.push(cloud);
		}
	}

	return visibleBuildings_array;
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.highLightBuildings = function()
{
	// 1rst, init highlightiedBuildings.***
	var buildingsCount = this.neoBuildingsList.neoBuildingsArray.length;
	for (var i=0; i<buildingsCount; i++)
	{
		this.neoBuildingsList.neoBuildingsArray[i].isHighLighted = false;
	}

	var buildingType = "structure";
	//var buildingType = "MSP"; khj(0331)
	var highLightingBuildingsCount = this.magoPolicy.highLightedBuildings.length;
	for (var i=0; i<highLightingBuildingsCount; i++)
	{
		var highLightedBuildingId = this.magoPolicy.highLightedBuildings[i];
		var highLightedBuilding = this.neoBuildingsList.getNeoBuildingByTypeId(buildingType, highLightedBuildingId.projectId + "_" + highLightedBuildingId.blockId);
		if (highLightedBuilding)
		{
			highLightedBuilding.isHighLighted = true;
		}
		//var hola = 0;
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.renderModeChanged = function()
{
	if (this.renderModeTemp === 0)
	{
		;//
	}
	else if (this.renderModeTemp === 1)
	{
		;//
	}
	else if (this.renderModeTemp === 2)
	{
		;//
	}

};

MagoManager.prototype.buildingColorChanged = function(projectAndBlockId, color)
{
	var neoBuilding = this.getNeoBuildingById("structure", projectAndBlockId);
	
	if (neoBuilding)
	{
		if (neoBuilding.aditionalColor === undefined)
		{
			neoBuilding.aditionalColor = new Color();
		}
		neoBuilding.isColorChanged = true;
		neoBuilding.aditionalColor.setRGB(color[0], color[1], color[2]);
	}
};

MagoManager.prototype.objectColorChanged = function(projectAndBlockId, objectId, color)
{
	var neoBuilding = this.getNeoBuildingById("structure", projectAndBlockId);
	
	if (neoBuilding)
	{
		var neoReference;
		var neoReferencesCount = neoBuilding.motherNeoReferencesArray.length;
		var found = false;
		var i = 0;
		while (!found && i<neoReferencesCount)
		{
			if (neoBuilding.motherNeoReferencesArray[i])
			{
				if (neoBuilding.motherNeoReferencesArray[i].objectId === objectId)
				{
					neoReference = neoBuilding.motherNeoReferencesArray[i];
					found = true;
				}
			}
			i++;
		}
		
		if (neoReference)
		{
			if (neoReference.aditionalColor === undefined)
			{
				neoReference.aditionalColor = new Color();
			}
			
			neoReference.aditionalColor.setRGB(color[0], color[1], color[2]);
		}
	}
};

MagoManager.prototype.policyColorChanged = function(projectAndBlockId, objectId)
{
	// old.***
	var neoBuilding = this.getNeoBuildingById("structure", projectAndBlockId);

	// 1rst, init colorChanged.***
	var buildingsCount = this.neoBuildingsList.neoBuildingsArray.length;
	for (var i=0; i<buildingsCount; i++)
	{
		this.neoBuildingsList.neoBuildingsArray[i].isColorChanged = false;
	}

	neoBuilding.isColorChanged = true;
	this.magoPolicy.colorChangedObjectId = objectId;

};

/**
 * 변환 행렬
 */
 
MagoManager.prototype.displayLocationAndRotation = function(neoBuilding) 
{
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
};

/**
 * 변환 행렬
 */
MagoManager.prototype.selectedObjectNotice = function(neoBuilding) 
{
	//var projectIdAndBlockId = neoBuilding.buildingId;
	var geoLocationData = neoBuilding.geoLocDataManager.geoLocationDataArray[0];
	var dividedName = neoBuilding.buildingId.split("_");
	
	if (MagoConfig.getPolicy().geo_callback_enable === "true") 
	{
		if (this.objMarkerSC === undefined) { return; }
		var objectId = null;
		if (this.objectSelected !== undefined) { objectId = this.objectSelected.objectId; }
		
		// click object 정보를 표시
		if (this.magoPolicy.getObjectInfoViewEnable()) 
		{
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
		}
			
		// 이슈 등록 창 오픈
		if (this.magoPolicy.getIssueInsertEnable()) 
		{
			if (this.objMarkerSC === undefined) { return; }
			
			insertIssueCallback(	MagoConfig.getPolicy().geo_callback_insertissue,
				dividedName[0] + "_" + dividedName[1],
				objectId,
				this.objMarkerSC.geoLocationData.geographicCoord.latitude,
				this.objMarkerSC.geoLocationData.geographicCoord.longitude,
				(parseFloat(this.objMarkerSC.geoLocationData.geographicCoord.altitude)));
		}
	}
};

/**
 * 변환 행렬
 */
MagoManager.prototype.changeLocationAndRotation = function(projectIdAndBlockId, latitude, longitude, elevation, heading, pitch, roll) 
{
	//var neoBuilding = this.getNeoBuildingById("structure", projectIdAndBlockId); // original for heavyIndustries.***
	var neoBuilding = this.getNeoBuildingById(undefined, projectIdAndBlockId);

	if (neoBuilding === undefined)
	{ return; }
	var geoLocationData = neoBuilding.geoLocDataManager.geoLocationDataArray[0];
	geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, this);
	if (geoLocationData === undefined)
	{ return; }

	//this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
	//ManagerUtils.translatePivotPointGeoLocationData(geoLocationData, this.pointSC );

	// now, must change the keyMatrix of the references of the octrees.***
	if (neoBuilding.octree)
	{
		neoBuilding.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
	}
	/*
	// repeat this for outfitting building.*********************************************************************************************************************
	// repeat this for outfitting building.*********************************************************************************************************************
	// repeat this for outfitting building.*********************************************************************************************************************
	var neoBuildingOutffiting = this.getNeoBuildingById("outfitting", projectIdAndBlockId);

	if (neoBuildingOutffiting === undefined)
	{ return; }

	// "longitude", "latitude" and "elevation" is from the structure block.***
	geoLocationData = neoBuildingOutffiting.geoLocDataManager.geoLocationDataArray[0];
	geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, this);
	if (geoLocationData === undefined)
	{ return; }

	//this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC); // the centerpoint is taken from structure block.***
	//ManagerUtils.translatePivotPointGeoLocationData(geoLocationData, this.pointSC );

	// now, must change the keyMatrix of the references of the octrees.***
	if (neoBuildingOutffiting.octree)
	{
		neoBuildingOutffiting.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
	}
	*/
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.createDeploymentGeoLocationsForHeavyIndustries = function() 
{
	// as the heavy industries special method, add new position for buildings.***.***
	var realTimeLocBlocksList = MagoConfig.getData().alldata;
	var neoBuildingsCount = this.neoBuildingsList.neoBuildingsArray.length;
	var neoBuilding;
	var newLocation;
	var structureTypedBuilding;
	var buildingGeoLocation;
	for (var i=0; i<neoBuildingsCount; i++) 
	{
		neoBuilding = this.neoBuildingsList.neoBuildingsArray[i];
		
		if (neoBuilding.buildingType === "outfitting")
		{
			structureTypedBuilding = this.neoBuildingsList.getNeoBuildingByTypeId("structure", neoBuilding.buildingId);
		}
		else
		{ structureTypedBuilding = neoBuilding; }

		if (structureTypedBuilding === undefined)
		{ continue; }

		if (structureTypedBuilding.bbox === undefined)
		{ continue; }
	
		// Test son.****************************************************************************
		var buildingNameDivided = neoBuilding.buildingId.split("_");
		if (buildingNameDivided.length > 0)
		{
			var firstName = buildingNameDivided[0];
			if (firstName === "testId")
			{
				if (buildingNameDivided[2] !== undefined)
				{
					neoBuilding.buildingId = buildingNameDivided[0] + "_" + buildingNameDivided[1];
					neoBuilding.buildingType = buildingNameDivided[2];
				}
				else
				{
					neoBuilding.buildingId = buildingNameDivided[1];
					neoBuilding.buildingType = buildingNameDivided[3];
				}
			}
		}
		// End Test son.------------------------------------------------------------------------
		
		newLocation = realTimeLocBlocksList[neoBuilding.buildingId];
		// must calculate the realBuildingPosition (bbox_center_position).***
		var longitude;
		var latitude;
		var altitude;
		var heading, pitch, roll;
			
		if (newLocation) 
		{
			longitude = parseFloat(newLocation.longitude);
			latitude = parseFloat(newLocation.latitude);
			altitude = parseFloat(newLocation.height);
			heading = parseFloat(newLocation.heading);
			pitch = parseFloat(newLocation.pitch);
			roll = parseFloat(newLocation.roll);

			buildingGeoLocation = neoBuilding.geoLocDataManager.newGeoLocationData("deploymentLoc");
			ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude+10, heading, pitch, roll, buildingGeoLocation, this);
			
			this.pointSC = structureTypedBuilding.bbox.getCenterPoint(this.pointSC);
			
			if (neoBuilding.buildingId === "ctships")
			{
				// Test:
				// for this building dont translate the pivot point to the bbox center.***
				return;
			}
			//ManagerUtils.translatePivotPointGeoLocationData(buildingGeoLocation, this.pointSC );
			////this.changeLocationAndRotation(neoBuilding.buildingId, latitude, longitude, altitude, heading, pitch, roll);
			////currentCalculatingPositionsCount ++;
		}
		else
		{
			if (firstName === "testId")
			{
				longitude = 128.5894;
				latitude = 34.90167;
				altitude = -400.0;
				heading = 0;
				pitch = 0;
				roll = 0;
				
				buildingGeoLocation = neoBuilding.geoLocDataManager.newGeoLocationData("deploymentLoc");
				ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude+10, heading, pitch, roll, buildingGeoLocation, this);
				
				this.pointSC = structureTypedBuilding.bbox.getCenterPoint(this.pointSC);
			}
		}
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */

MagoManager.prototype.getObjectIndexFile = function() 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}
	// old.***
	//this.readerWriter.getObjectIndexFile(	this.readerWriter.geometryDataPath + Constant.OBJECT_INDEX_FILE, this.readerWriter, this.neoBuildingsList, this);
	
	// use smartTile. Create one smartTile for all Korea.
	this.buildingSeedList = new BuildingSeedList();
	this.readerWriter.getObjectIndexFileForSmartTile(	this.readerWriter.geometryDataPath + Constant.OBJECT_INDEX_FILE, this, this.buildingSeedList);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.makeSmartTile = function(buildingSeedList) 
{
	// as the heavy industries special method, add new position for buildings.***.***
	var realTimeLocBlocksList = MagoConfig.getData().alldata;
	var buildingSeedsCount;
	var buildingSeed;
	var newLocation;
	var structureTypedBuilding;
	var buildingGeoLocation;
	
	var smartTilesCount = this.smartTileManager.tilesArray.length;
	for (var a=0; a<smartTilesCount; a++)
	{
		var smartTile = this.smartTileManager.tilesArray[a];
		buildingSeedsCount = buildingSeedList.buildingSeedArray.length;
		for (var i=0; i<buildingSeedsCount; i++) 
		{
			buildingSeed = buildingSeedList.buildingSeedArray[i];
		
			// Test son.****************************************************************************
			var buildingNameDivided = buildingSeed.buildingId.split("_");
			if (buildingNameDivided.length > 0)
			{
				var firstName = buildingNameDivided[0];
				buildingSeed.firstName = firstName;
				if (firstName === "testId")
				{
					if (buildingNameDivided[2] !== undefined)
					{
						buildingSeed.buildingId = buildingNameDivided[0] + "_" + buildingNameDivided[1];
						buildingSeed.buildingType = buildingNameDivided[2];
					}
					else
					{
						buildingSeed.buildingId = buildingNameDivided[1];
						buildingSeed.buildingType = buildingNameDivided[3];
					}
				}
			}
			// End Test son.------------------------------------------------------------------------
			
			newLocation = realTimeLocBlocksList[buildingSeed.buildingId];
			// must calculate the realBuildingPosition (bbox_center_position).***
			var longitude;
			var latitude;
			var altitude;
			var heading, pitch, roll;
				
			if (newLocation) 
			{
				buildingSeed.name = newLocation.data_name;

				longitude = parseFloat(newLocation.longitude);
				latitude = parseFloat(newLocation.latitude);
				altitude = parseFloat(newLocation.height);
				heading = parseFloat(newLocation.heading);
				pitch = parseFloat(newLocation.pitch);
				roll = parseFloat(newLocation.roll);
			}
			else
			{
				if (firstName === "testId")
				{
					longitude = 128.5894;
					latitude = 34.90167;
					altitude = -400.0;
					heading = 0;
					pitch = 0;
					roll = 0;
				}
				else 
				{
					longitude = 128.5894;
					latitude = 35.0;
					altitude = 50.0;
					heading = 0;
					pitch = 0;
					roll = 0;
				}
			}
			
			if (buildingSeed.geographicCoord === undefined)
			{ buildingSeed.geographicCoord = new GeographicCoord(); }
		
			if (buildingSeed.rotationsDegree === undefined)
			{ buildingSeed.rotationsDegree = new Point3D(); }
		
			buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
			buildingSeed.rotationsDegree.set(pitch, roll, heading);
		}
		
		smartTile.buildingSeedsArray = buildingSeedList.buildingSeedArray;
		var minDegree = 0.015; // 0.01deg = 1.105,74m.
		smartTile.makeTree(minDegree, this);
		
	}
	this.buildingSeedList.buildingSeedArray.length = 0; // init.
};

/**
 * api gateway
 */
MagoManager.prototype.callAPI = function(api) 
{
	var apiName = api.getAPIName();
	if (apiName === "changeMagoState") 
	{
		this.magoPolicy.setMagoEnable(api.getMagoEnable());
	}
	else if (apiName === "changeRender") 
	{
		this.renderingModeTemp = api.getRenderMode();
	}
	else if (apiName === "searchData") 
	{
		this.flyToBuilding(api.getDataKey());
	}
	else if (apiName === "changeHighLighting") 
	{
		this.magoPolicy.highLightedBuildings.length = 0;
		var projectId = api.getProjectId();
		var blockIds = api.getBlockIds().split(",");
		var objectIds = null;
		var isExistObjectIds = false;
		if (api.getObjectIds() !== null && api.getObjectIds().length !== 0) 
		{
			objectIds = api.getObjectIds().split(",");
			isExistObjectIds = true;
		}
		var hightedBuilds = [];
		for (var i=0, count = blockIds.length; i<count; i++) 
		{
			var projectLayer = new ProjectLayer();
			projectLayer.setProjectId(projectId);
			projectLayer.setBlockId(blockIds[i].trim());
			if (isExistObjectIds) { projectLayer.setObjectId(objectIds[i].trim()); }
			else { projectLayer.setObjectId(null); }
			hightedBuilds.push(projectLayer);
		}
		this.magoPolicy.setHighLightedBuildings(hightedBuilds);
		this.highLightBuildings();
	}
	else if (apiName === "changeColor") 
	{
		this.magoPolicy.colorBuildings.length = 0;
		var projectId = api.getProjectId();
		var blockIds = api.getBlockIds().split(",");
		var objectIds = null;
		var isExistObjectIds = false;
		if (api.getObjectIds() !== null && api.getObjectIds().length !== 0) 
		{
			objectIds = api.getObjectIds().split(",");
			isExistObjectIds = true;
		}
		var colorBuilds = [];
		for (var i=0, count = blockIds.length; i<count; i++) 
		{
			if (isExistObjectIds) 
			{
				for (var j=0, objectCount = objectIds.length; j<objectCount; j++) 
				{
					var projectLayer = new ProjectLayer();
					projectLayer.setProjectId(projectId);
					projectLayer.setBlockId(blockIds[i].trim());
					projectLayer.setObjectId(objectIds[j].trim());
					colorBuilds.push(projectLayer);
				}
			}
			else 
			{
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
		for (var i=0; i<buildingsCount; i++)
		{
			//var projectAndBlockId = projectId + "_" + blockIds[i]; // old.***
			var projectAndBlockId = colorBuilds[i].projectId + "_" + colorBuilds[i].blockId;
			if (colorBuilds[i].objectId === null)
			{
				this.buildingColorChanged(projectAndBlockId, rgbArray);
			}
			else
			{
				this.objectColorChanged(projectAndBlockId, colorBuilds[i].objectId, rgbArray);
			}
			
		}
	}
	else if (apiName === "show") 
	{
		this.magoPolicy.setHideBuildings.length = 0;
	}
	else if (apiName === "hide") 
	{
		this.magoPolicy.setHideBuildings(api.gethideBuilds());
	}
	else if (apiName === "move") 
	{
	}
	else if (apiName === "changeOutFitting") 
	{
		this.magoPolicy.setShowOutFitting(api.getShowOutFitting());
	} 
	else if (apiName === "changeLabel") 
	{
		this.magoPolicy.setShowLabelInfo(api.getShowLabelInfo());
		
		// clear the text canvas.
		var canvas = document.getElementById("objectLabel");
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	}
	else if (apiName === "changeBoundingBox") 
	{
		this.magoPolicy.setShowBoundingBox(api.getShowBoundingBox());
	}
	else if (apiName === "changeShadow") 
	{
		this.magoPolicy.setShowShadow(api.getShowShadow());
		
	}
	else if (apiName === "changefrustumFarDistance") 
	{
		// frustum culling 가시 거리
		this.magoPolicy.setFrustumFarSquaredDistance(api.getFrustumFarDistance() * api.getFrustumFarDistance());
	}
	else if (apiName === "changeLocationAndRotation") 
	{
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
	}
	else if (apiName === "getLocationAndRotation") 
	{
		return this.neoBuildingsList.getNeoBuildingByTypeId("structure", api.getProjectId() + "_" + api.getBlockId());
	}
	else if (apiName === "changeMouseMove") 
	{
		this.magoPolicy.setMouseMoveMode(api.getMouseMoveMode());
	}
	else if (apiName === "changeInsertIssueMode") 
	{
		this.magoPolicy.setIssueInsertEnable(api.getIssueInsertEnable());
		//selectedObjectCallback(이걸 해 주면 될거 같음)
	}
	else if (apiName === "changeObjectInfoViewMode") 
	{
		// object info 표시
		this.magoPolicy.setObjectInfoViewEnable(api.getObjectInfoViewEnable());
	}
	else if (apiName === "changeNearGeoIssueListViewMode") 
	{
		// issue list 표시
		this.magoPolicy.setNearGeoIssueListEnable(api.getNearGeoIssueListEnable());
		if (!api.getNearGeoIssueListEnable()) 
		{
			// clear objMarkerManager objectmakersarrays 사이즈를 0 으로 하면... .됨
			this.objMarkerManager.objectMarkerArray = [];
		}
	}
	else if (apiName === "drawInsertIssueImage") 
	{
		// pin 을 표시
		if (this.objMarkerSC === undefined || api.getDrawType() === 0) 
		{
			this.objMarkerSC = new ObjectMarker();
			this.objMarkerSC.geoLocationData.geographicCoord = new GeographicCoord();
			ManagerUtils.calculateGeoLocationData(parseFloat(api.getLongitude()), parseFloat(api.getLatitude()), parseFloat(api.getElevation()), 
				undefined, undefined, undefined, this.objMarkerSC.geoLocationData, this);
		}
		
		var objMarker = this.objMarkerManager.newObjectMarker();
		
		this.objMarkerSC.issue_id = api.getIssueId();
		this.objMarkerSC.issue_type = api.getIssueType();
		this.objMarkerSC.geoLocationData.geographicCoord.setLonLatAlt(parseFloat(api.getLongitude()), parseFloat(api.getLatitude()), parseFloat(api.getElevation()));
		
		objMarker.copyFrom(this.objMarkerSC);
		this.objMarkerSC = undefined;
	}
	else if (apiName === "changeInsertIssueState")
	{
		this.sceneState.insertIssueState = 0;
	}
	else if (apiName === "changeLod")
	{
		this.magoPolicy.setLod0DistInMeters(api.getLod0DistInMeters());
		this.magoPolicy.setLod1DistInMeters(api.getLod1DistInMeters());
		this.magoPolicy.setLod2DistInMeters(api.getLod2DistInMeters());
		this.magoPolicy.setLod3DistInMeters(api.getLod3DistInMeters());
	}
	else if (apiName === "changeLighting")
	{
		this.magoPolicy.setAmbientReflectionCoef(api.getAmbientReflectionCoef());
		this.magoPolicy.setDiffuseReflectionCoef(api.getDiffuseReflectionCoef());
		this.magoPolicy.setSpecularReflectionCoef(api.getSpecularReflectionCoef());
		this.magoPolicy.setSpecularColor(api.getSpecularColor());
	}
	else if (apiName === "changeSsadRadius")
	{
		this.magoPolicy.setSsaoRadius(api.getSsaoRadius());
	}	
	else if (apiName === "changeFPVMode")
	{
		if (api.getFPVMode())
		{
			if (this.cameraFPV._camera !== undefined)	{ return; }
			var scratchLookAtMatrix4 = new Cesium.Matrix4();
			var scratchFlyToBoundingSphereCart4 = new Cesium.Cartesian4();

			var camera = this.scene._camera;
			this.cameraFPV.init();
			this.cameraFPV._camera = camera;
			this.cameraFPV._cameraBAK = Cesium.Camera.clone(camera, this.cameraFPV._cameraBAK);

			var position = new Cesium.Cartesian3();
			var direction = new Cesium.Cartesian3();
			var up = new Cesium.Cartesian3();

			var cameraCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
			cameraCartographic.height = this.scene.globe.getHeight(cameraCartographic) + 2.0;

			this.scene.globe.ellipsoid.cartographicToCartesian(cameraCartographic, position);
			var transform = Cesium.Transforms.eastNorthUpToFixedFrame(position, Cesium.Ellipsoid.WGS84, scratchLookAtMatrix4);
			Cesium.Cartesian3.fromCartesian4(Cesium.Matrix4.getColumn(transform, 1, scratchFlyToBoundingSphereCart4), direction);
			Cesium.Cartesian3.fromCartesian4(Cesium.Matrix4.getColumn(transform, 2, scratchFlyToBoundingSphereCart4), up);

			camera.flyTo({
				destination : position,
				orientation : {
					direction : direction,
					up        : up
				},
				duration: 1
			});
		}
		else 
		{
			if (this.cameraFPV._cameraBAK === undefined)	{ return; }
			this.scene._camera = Cesium.Camera.clone(this.cameraFPV._cameraBAK, this.scene._camera);
			this.cameraFPV.release();
		}
	}
};
MagoManager.prototype.checkCollision = function (position, direction)
{
	var gl = this.sceneState.gl;
	if (gl === undefined)	{ return; }

	var posX = this.sceneState.drawingBufferWidth * 0.5;
	var posY = this.sceneState.drawingBufferHeight * 0.5;
	
	var objects = this.getSelectedObjects(gl, posX, posY, this.visibleObjControlerBuildings, this.arrayAuxSC);
	if (objects === undefined)	{ return; }

	var current_building = this.buildingSelected;
	this.buildingSelected = this.arrayAuxSC[0];

	var collisionPosition = new Point3D();
	var height = new Point3D();

	this.calculatePixelPositionWorldCoord(gl, posX, posY, collisionPosition);
	this.renderingFase = !this.renderingFase;
	this.calculatePixelPositionWorldCoord(gl, posX, this.sceneState.drawingBufferHeight - posY * 0.5, height);

	//this.calculateSelObjMovePlaneAsimetricMode(gl, posX, posY, plane);
	//collisionPos.set(this.pointSC2.x, this.pointSC2.y, this.pointSC2.z);
	//plane.setPointAndNormal(this.pointSC2.x, this.pointSC2.y, this.pointSC2.z, 0.0, 0.0, 1.0);
	//line.setPointAndDir(position.x, position.y, position.z, direction.x, direction.y, direction.z);

	//var pickPosition = this.scene.camera.pickEllipsoid(position, this.scene.globe.ellipsoid);

	this.buildingSelected = current_building;
	var distance = collisionPosition.squareDistTo(position.x, position.y, position.z);
	this.renderingFase = !this.renderingFase;
	if (distance < 3.5)
	{ return true; }
	else
	{
		var heightCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(height);
		var positionCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(position);
		var tmpAlt = Math.min(positionCartographic.height, heightCartographic.height + 2.0);
		var tmpLat = Cesium.Math.toDegrees(positionCartographic.latitude);
		var tmpLon = Cesium.Math.toDegrees(positionCartographic.longitude);
		if (positionCartographic.height - heightCartographic.height - 1.0 < 0)
		{
			tmpAlt = heightCartographic.height + 2.0;
		}
		console.log(this.scene.globe.ellipsoid.cartesianToCartographic(collisionPosition));
		console.log(this.scene.globe.ellipsoid.cartesianToCartographic(position));
		console.log(this.scene.globe.ellipsoid.cartesianToCartographic(height));
		console.log(distance);
		
		this.cameraFPV.camera.position = Cesium.Cartesian3.fromDegrees(tmpLon, tmpLat, tmpAlt);
	
		return false; 
	}
};