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
	this.terranTile = new TerranTile();
	this.renderer = new Renderer();
	this.selectionCandidates = new SelectionCandidates();
	this.shadersManager = new ShadersManager();
	this.postFxShadersManager = new PostFxShadersManager();
	this.vBOManager = new VBOManager();
	this.readerWriter = new ReaderWriter();
	this.magoPolicy = new Policy();
	this.smartTileManager = new SmartTileManager();
	this.processQueue = new ProcessQueue();
	this.parseQueue = new ParseQueue();
	this.hierarchyManager = new HierarchyManager();

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
	this.nodeSelected;

	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.startMovPoint = new Point3D();
	
	this.TEST_maxWheelZoomAmount = 0;
	this.TEST_maxZoomAmount = 0;
	
	this.configInformation;
	this.cameraFPV = new FirstPersonView();
	this.myCameraSCX;
	this.lightCam;
	this.magoGeometryTest;

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
	this.visibleObjControlerOctrees = new VisibleObjectsController(); 
	this.visibleObjControlerNodes = new VisibleObjectsController(); 
	
	this.boundingSphere_Aux; 
	this.radiusAprox_aux;

	this.lastCamPos = new Point3D();
	this.squareDistUmbral = 22.0;

	this.lowestOctreeArray = [];

	this.backGround_fileReadings_count = 0; // this can be as max = 9.***
	this.backGround_imageReadings_count = 0;
	this.isCameraMoving = false; 
	this.isCameraInsideNeoBuilding = false;
	this.renderingFase = 0;

	this.bPicking = false;
	this.scene;

	this.numFrustums;
	this.isLastFrustum = false;
	this.currentFrustumIdx = 0;
	this.highLightColor4 = new Float32Array([0.2, 1.0, 0.2, 1.0]);
	this.thereAreUrgentOctrees = false;
	
	this.hierarchyManager = new HierarchyManager();
	
	// small object size.
	this.smallObjectSize = 0.153;
	
	// sqrtTable.
	
	this.sqrtTable = new Float32Array(11);
	// make 100 values.
	var increValue = 0.1;
	for (var i=0; i<11; i++)
	{
		this.sqrtTable[i] = Math.sqrt(1+(increValue*i)*(increValue*i));
	}
	
	this.managerUtil = new ManagerUtils();

	// CURRENTS.********************************************************************
	this.currentSelectedObj_idx = -1;
	this.currentByteColorPicked = new Uint8Array(4);
	this.currentShader;

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
	
	this.invertedBox = new Box();
	this.invertedBox.makeAABB(0.1, 0.1, 0.1); // make a 0.1m length box.***
	this.invertedBox.triPolyhedron.invertTrianglesSenses();
	this.invertedBox.vBOVertexIdxCacheKey = this.invertedBox.triPolyhedron.getVBOArrayModePosNorCol(this.invertedBox.vBOVertexIdxCacheKey);

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
	this.numFrustums = numFrustums;
	this.currentFrustumIdx = frustumIdx;
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
		this.startRender(scene, isLastFrustum, frustumIdx, numFrustums);
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
	
	this.startRender(scene, isLastFrustum, frustumIdx, numFrustums);
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
 * 카메라가 이동중인지를 확인
 * @param cameraPosition 변수
 * @param squareDistUmbral 변수
 * @returns camera_was_moved
 */
MagoManager.prototype.swapRenderingFase = function() 
{
	this.renderingFase = !this.renderingFase;
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
MagoManager.prototype.renderAtmosphere = function(gl, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye) 
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
MagoManager.prototype.renderCloudShadows = function(gl, cameraPosition, cullingVolume, _modelViewProjectionRelativeToEye) 
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
 * Loading Texture
 * 
 * @param {any} gl 
 * @param {any} image 
 * @param {any} texture 
 */
function handleTextureLoaded(gl, image, texture) 
{
	// https://developer.mozilla.org/en-US/docs/Web/API/Webgl_API/Tutorial/Using_textures_in_Webgl
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBgl,true); // if need vertical mirror of the image.***
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
};

/**
 * 빌딩을 준비(새버전)
 * @param {gl} gl
 */
MagoManager.prototype.prepareNeoBuildingsAsimetricVersion = function(gl) 
{
	// for all renderables, prepare data.***
	var neoBuilding;
	var node, rootNode;
	var projectFolderName;
	
	//var geometryDataPath = this.readerWriter.getCurrentDataPath();
	var geometryDataPath = this.readerWriter.geometryDataPath;
	if (this.headersRequestedCounter === undefined)
	{ this.headersRequestedCounter = 0; }

	var currentVisibleNodes = [].concat(this.visibleObjControlerNodes.currentVisibles0, this.visibleObjControlerNodes.currentVisibles2, this.visibleObjControlerNodes.currentVisibles3);
	for (var i=0, length = currentVisibleNodes.length; i<length; i++) 
	{
		node = currentVisibleNodes[i];
		projectFolderName = node.data.projectFolderName;
		
		neoBuilding = currentVisibleNodes[i].data.neoBuilding;
		// check if this building is ready to render.***
		//if (!neoBuilding.allFilesLoaded) // no used yet.
		{
			// 1) MetaData
			var metaData = neoBuilding.metaData;
			if (metaData.fileLoadState === CODE.fileLoadState.READY) 
			{
				if (this.fileRequestControler.isFullHeaders())	{ return; }
				/*
				if (this.headersRequestedCounter <2)
				{
					this.headersRequestedCounter ++;
					return;
				}
				*/
				var neoBuildingHeaderPath = geometryDataPath + "/"  + projectFolderName + "/"  + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
				this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
				//this.headersRequestedCounter = 0;
			}
		}
	}
	currentVisibleNodes.length = 0;
};

/**
 * Here updates the modelView matrices.
 * @param {SceneState} sceneState
 */
MagoManager.prototype.upDateSceneStateMatrices = function(sceneState) 
{
	if (this.myCameraSCX === undefined) 
	{ this.myCameraSCX = new Camera(); }

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
		
		var cameraHeading = dc.navigatorState.heading;
		var cameraTilt = dc.navigatorState.tilt;
		
		// now, calculate camera direction and up from cameraHeading and cameraTilt.
		var cameraDirection = new Point3D();
		cameraDirection.set(0, 0, -1);
		var rotatedCameraDirection = new Point3D();
		rotatedCameraDirection.set(0, 0, 0);
		
		var cameraUp = new Point3D();
		cameraUp.set(0, 1, 0);
		var rotatedCameraUp = new Point3D();
		rotatedCameraUp.set(0, 0, 0);
		
		rotatedCameraDirection = sceneState.modelViewMatrixInv.rotatePoint3D(cameraDirection, rotatedCameraDirection);
		rotatedCameraDirection.unitary();
		rotatedCameraUp = sceneState.modelViewMatrixInv.rotatePoint3D(cameraUp, rotatedCameraUp);
		rotatedCameraUp.unitary();
			
		sceneState.camera.direction.set(rotatedCameraDirection.x, rotatedCameraDirection.y, rotatedCameraDirection.z);
		sceneState.camera.up.set(rotatedCameraUp.x, rotatedCameraUp.y, rotatedCameraUp.z);
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
	
	// set the auxiliar camera.
	this.myCameraSCX.direction.set(sceneState.camera.direction.x, sceneState.camera.direction.y, sceneState.camera.direction.z);
	this.myCameraSCX.up.set(sceneState.camera.up.x, sceneState.camera.up.y, sceneState.camera.up.z);
	this.myCameraSCX.frustum.near = sceneState.camera.frustum.near;
	this.myCameraSCX.frustum.far = sceneState.camera.frustum.far;
	this.myCameraSCX.frustum.fovyRad = sceneState.camera.frustum.fovyRad;
	this.myCameraSCX.frustum.tangentOfHalfFovy = sceneState.camera.frustum.tangentOfHalfFovy;
	this.myCameraSCX.frustum.fovRad = sceneState.camera.frustum.fovRad;
	this.myCameraSCX.frustum.aspectRatio = sceneState.camera.frustum.aspectRatio;
	
	
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

		this.sceneState.camera.frustum.far[0] = this.scene._frustumCommandsList[this.numFrustums-this.currentFrustumIdx-1].far; 
		this.sceneState.camera.frustum.near[0] = this.scene._frustumCommandsList[this.numFrustums-this.currentFrustumIdx-1].near;
		var currentFrustumFar = this.scene._frustumCommandsList[this.numFrustums-this.currentFrustumIdx-1].far;
		var currentFrustumNear = this.scene._frustumCommandsList[this.numFrustums-this.currentFrustumIdx-1].near;
		
		//currentFrustumFar = 50000;
		//currentFrustumNear = 0.1;

		resultCamera.position.set(camera.position.x, camera.position.y, camera.position.z);
		resultCamera.direction.set(camera.direction.x, camera.direction.y, camera.direction.z);
		resultCamera.up.set(camera.up.x, camera.up.y, camera.up.z);
		resultCamera.frustum.near[0] = currentFrustumNear;
		resultCamera.frustum.far[0] = currentFrustumFar;
		resultCamera.calculateFrustumPlanes();
	}
};

/**
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
MagoManager.prototype.startRender = function(scene, isLastFrustum, frustumIdx, numFrustums) 
{
	//if (!isLastFrustum) { return; }
	if (numFrustums > 2)
	{
		if (frustumIdx === 0 )
		{ return; }
	}

	this.numFrustums = numFrustums;
	this.isLastFrustum = isLastFrustum;
	
	var gl = this.sceneState.gl;
	
	if (gl.isContextLost())
	{ return; }
	
	this.upDateSceneStateMatrices(this.sceneState);

	if (this.textureAux_1x1 === undefined) 
	{
		this.textureAux_1x1 = gl.createTexture();
		// Test wait for texture to load.********************************************
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255])); // clear grey
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	// provisional pin textures loading.
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
		
		cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/etc.png";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
		
		cabreadoTex = new Texture();
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
		//if (this.isLastFrustum)
		{
			//if(this.sceneState.camera.getDirty())
			{
				if (this.myCameraSCX === undefined) 
				{ this.myCameraSCX = new Camera(); }

				this.upDateCamera(this.myCameraSCX);
				this.doFrustumCullingSmartTiles(this.myCameraSCX.frustum, cameraPosition);
				
				//this.sceneState.camera.setDirty(false);
			}
			if (this.isLastFrustum)
			{ 
				this.prepareNeoBuildingsAsimetricVersion(gl); 
				
			}
			
			if (this.isFirstFrustum())
			{
				gl.clearStencil(0); // provisionally here.***
				gl.clear(gl.STENCIL_BUFFER_BIT);
			}
		}
	}
	
	var currentShader = undefined;

	// prepare data if camera is no moving.***
	// 1) LOD 0.*********************************************************************************************************************
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown && this.isLastFrustum) 
	{
		//if(this.isFirstFrustum())
		this.visibleObjControlerOctrees.initArrays(); // init.******

		var neoBuilding;
		var node;
		var octree;
		// lod 0 & lod 1.
		this.checkPropertyFilters(this.visibleObjControlerNodes.currentVisibles0);
		this.checkPropertyFilters(this.visibleObjControlerNodes.currentVisibles2);
		var nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
		for (var i=0; i<nodesCount; i++) 
		{
			node = this.visibleObjControlerNodes.currentVisibles0[i];
			if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, node, this.visibleObjControlerOctrees, 0))
			{
				// any octree is visible.
				this.visibleObjControlerNodes.currentVisibles0.splice(i, 1);
				i--;
				nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
			}
		}
		var fileRequestExtraCount = 1;

		if (this.isLastFrustum)
		{ 
			this.prepareVisibleOctreesSortedByDistanceLOD2(gl, scene, this.visibleObjControlerOctrees, fileRequestExtraCount); 
		}
		//fileRequestExtraCount = 2;
		fileRequestExtraCount = this.visibleObjControlerOctrees.currentVisibles0.length;
		if (fileRequestExtraCount > 2)
		{ fileRequestExtraCount = 2; }
		
		if (this.isLastFrustum)
		{ 
			this.prepareVisibleOctreesSortedByDistance(gl, scene, this.visibleObjControlerOctrees, fileRequestExtraCount); 
		} 
		
		// lod 2.
		nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
		for (var i=0; i<nodesCount; i++) 
		{
			node = this.visibleObjControlerNodes.currentVisibles2[i];
			if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, scene, node, this.visibleObjControlerOctrees, 2))
			{
				// any octree is visible.
				this.visibleObjControlerNodes.currentVisibles2.splice(i, 1);
				i--;
				nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
			}
		}
		fileRequestExtraCount = 2;
		if (this.isLastFrustum)
		{ this.prepareVisibleOctreesSortedByDistanceLOD2(gl, scene, this.visibleObjControlerOctrees, fileRequestExtraCount); }
		
		
		// in this point, put octrees of lod2 to the deletingQueue to delete the lod0 data.
		nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
		for (var i=nodesCount-1; i>=0; i--) 
		{
			// inverse "for" because delete 1rst farest.***
			node = this.visibleObjControlerNodes.currentVisibles2[i];
			this.processQueue.putNodeToDeleteModelReferences(node, 0);
		}
		
		// in this point, put nodes to delete lod lower than lod3 (delete lod0, lod1, lod2).***
		nodesCount = this.visibleObjControlerNodes.currentVisibles3.length;
		var nodesPutted = 0;
		for (var i=nodesCount-1; i>=0; i--) 
		{
			// inverse "for" because delete 1rst farest.***
			node = this.visibleObjControlerNodes.currentVisibles3[i];
			neoBuilding = node.data.neoBuilding;
			if (neoBuilding === undefined)
			{ continue; }
			
			var key = neoBuilding.buildingId;
			if (!this.processQueue.nodesToDeleteLessThanLod3Map.hasOwnProperty(key))
			{
				this.processQueue.putNodeToDeleteLessThanLod3(node, 0);
				nodesPutted++;
			}
			if (nodesPutted > 10)
			{ break; }
			//if(this.processQueue.nodesToDeleteLessThanLod3Map.length > 10)
			//{ break; }
		}
		
		// lod3, lod4, lod5.***
		this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles3);
		
		if (this.isLastFrustum)
		{ this.manageQueue(); }
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
		}
	}

	if (this.bPicking === true && isLastFrustum)
	{
		this.arrayAuxSC.length = 0;
		this.objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.visibleObjControlerNodes, this.arrayAuxSC);
		this.buildingSelected = this.arrayAuxSC[0];
		this.octreeSelected = this.arrayAuxSC[1];
		this.nodeSelected = this.arrayAuxSC[3];
		if (this.nodeSelected)
		{ this.rootNodeSelected = this.nodeSelected.getRoot(); }
		else
		{ this.rootNodeSelected = undefined; }
			
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
	
	// lightDepthRender.***
	
	
			
	// 1) The depth render.**********************************************************************************************************************
	var ssao_idx = 0; // 0= depth. 1= ssao.***
	var renderTexture = false;
	this.depthFboNeo.bind(); 
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	this.renderGeometry(gl, cameraPosition, currentShader, renderTexture, ssao_idx, this.visibleObjControlerNodes);
	this.depthFboNeo.unbind();
	this.swapRenderingFase();
	
	// 2) ssao render.************************************************************************************************************
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		;//
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		scene._context._currentFramebuffer._bind();
	}
	
	if (this.noiseTexture === undefined) 
	{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }

	ssao_idx = 1;
	this.renderGeometry(gl, cameraPosition, currentShader, renderTexture, ssao_idx, this.visibleObjControlerNodes);
	this.swapRenderingFase();
	
	// 3) test mago geometries.***********************************************************************************************************
	//this.renderMagoGeometries(); TEST
	
	// test. Draw the buildingNames.***
	if (this.magoPolicy.getShowLabelInfo())
	{
		this.drawBuildingNames(this.visibleObjControlerNodes) ;
	}

	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		gl.activeTexture(gl.TEXTURE0);
		this.wwd.drawContext.redrawRequested = true;
	}
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.prepareVisibleLowLodNodes = function(lowLodNodesArray) 
{
	// Prepare lod3, lod4 and lod5 meshes.***
	// check "this.visibleObjControlerNodes.currentVisibles3".***
	var lowLodMesh;
	var lod;
	var node;
	var neoBuilding;
	var projectFolderName;
	var buildingFolderName;
	var extraCount = 5;
	var gl = this.sceneState.gl;
	var geometryDataPath = this.readerWriter.geometryDataPath;
	
	var lowLodNodesCount = lowLodNodesArray.length;
	for (var i=0; i<lowLodNodesCount; i++) 
	{
		node = lowLodNodesArray[i];
		neoBuilding = node.data.neoBuilding;
		
		var headerVersion = neoBuilding.getHeaderVersion();
		if (headerVersion === undefined)
		{ continue; }
		
		if (headerVersion[0] !== "0")
		{
			continue;
		}
		
		//if (neoBuilding.lodMeshesArray === undefined)
		//{ neoBuilding.lodMeshesArray = []; } // old.***
	
		if (neoBuilding.lodMeshesMap === undefined)
		{ neoBuilding.lodMeshesMap = {}; } 
		
		projectFolderName = neoBuilding.projectFolderName;
		buildingFolderName = neoBuilding.buildingFileName;
		
		// recalculate the distToCam with octrees.***
		//var cameraPosition = this.sceneState.camera.position;
		//neoBuilding.distToCam = neoBuilding.octree.getMinDistToCamera(cameraPosition);
		var textureFileName;
		var lodString;
		var lodIdx; // old.***
		
		if (neoBuilding.distToCam < this.magoPolicy.getLod3DistInMeters())
		{
			lodIdx = 0;
			neoBuilding.currentLod = 3;
		}
		else if (neoBuilding.distToCam < this.magoPolicy.getLod4DistInMeters())
		{
			lodIdx = 1;
			neoBuilding.currentLod = 4;
		}
		else if (neoBuilding.distToCam < this.magoPolicy.getLod5DistInMeters())
		{
			lodIdx = 2;
			neoBuilding.currentLod = 5;
		}
		else { continue; }
		
		if (neoBuilding.buildingId === "2119_P11VC_F41GC_W530P_o")
		{ var hola = 0; }
		
		// must check if the desirable lodMesh is available.***
		var lodBuildingData = neoBuilding.getLodBuildingData(neoBuilding.currentLod);
		if (lodBuildingData === undefined)
		{ continue; }
		
		textureFileName = lodBuildingData.textureFileName;
		lodString = lodBuildingData.geometryFileName;
		
		///lowLodMesh = neoBuilding.lodMeshesMap.get(lodString);
		lowLodMesh = neoBuilding.lodMeshesMap[lodString];
		if (lowLodMesh === undefined)
		{
			lowLodMesh = new Lego();
			lowLodMesh.fileLoadState = CODE.fileLoadState.READY;
			lowLodMesh.textureName = textureFileName;
			lowLodMesh.legoKey = neoBuilding.buildingId + "_" + lodString;
			//neoBuilding.lodMeshesArray[lodIdx] = lowLodMesh;// old.***
			neoBuilding.lodMeshesMap[lodString] = lowLodMesh;
		}
		
		if (lowLodMesh.fileLoadState === -1)
		{
			// if a lodObject has "fileLoadState" = -1 means that there are no file in server.***
			continue;
		}
		
		if (lowLodMesh.fileLoadState === CODE.fileLoadState.READY) 
		{
			// load lodMesh.***
			if (!this.fileRequestControler.isFullPlus(extraCount))
			{
				var lodMeshFilePath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/" + lodString;
				this.readerWriter.getLegoArraybuffer(lodMeshFilePath, lowLodMesh, this);
			}
			continue;
		}
		
		// finally check if there are legoSimpleBuildingTexture.***
		if (lowLodMesh.vbo_vicks_container.vboCacheKeysArray[0] && lowLodMesh.vbo_vicks_container.vboCacheKeysArray[0].meshTexcoordsCacheKey)
		{
			// this is the new version.***
			if (lowLodMesh.texture === undefined)
			{
				lowLodMesh.texture = new Texture();
				var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/" + textureFileName;
				this.readerWriter.readLegoSimpleBuildingTexture(gl, filePath_inServer, lowLodMesh.texture, this);
			}
		}
	}
	
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.renderMagoGeometries = function() 
{
	// 1rst, make the test object if no exist.***
	if (this.parametricMeshTest == undefined)
	{
		this.parametricMeshTest = new ParametricMesh();
		
		// make a extrude object.***
		// create a profile.
		var profile = new Profile();
		var extrusionVector = new Point3D();
		extrusionVector.set(0.0, 0.0, 1.0);
		var extrusionDist = 10.0;
		
		// make a concave profile ( a "L" shape).***
		var outer = profile.getOuter();
		var vertex = outer.newVertex();
		vertex.setPosition(1.0, 0.0, 0.0);
		
		vertex = outer.newVertex();
		vertex.setPosition(1.0, 3.0, 0.0);
		
		vertex = outer.newVertex();
		vertex.setPosition(3.0, 3.0, 0.0);
		
		vertex = outer.newVertex();
		vertex.setPosition(3.0, 5.0, 0.0);
		
		vertex = outer.newVertex();
		vertex.setPosition(0.0, 5.0, 0.0);
		
		vertex = outer.newVertex();
		vertex.setPosition(0.0, 0.0, 0.0);
		
		// now extrude or revolve.***
		this.parametricMeshTest.extrude(profile, extrusionVector, extrusionDist);
	}
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawBuildingNames = function(visibleObjControlerNodes) 
{
	var canvas = document.getElementById("objectLabel");
	if (canvas === undefined)
	{ return; }
	
	canvas.style.opacity = 1.0;
	canvas.width = this.sceneState.drawingBufferWidth;
	canvas.height = this.sceneState.drawingBufferHeight;
	var ctx = canvas.getContext("2d");
	//ctx.strokeStyle = 'SlateGrey';
	//ctx.strokeStyle = 'MidnightBlue';
	ctx.strokeStyle = 'DarkSlateGray'; 
	//ctx.fillStyle= "white";
	ctx.fillStyle= "PapayaWhip";
	ctx.lineWidth = 4;
	ctx.font = "20px Arial";
	ctx.textAlign = 'center';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	var lineHeight = ctx.measureText("M").width * 1.1;

	// lod2.
	var gl = this.sceneState.gl;
	var node;
	var nodeRoot;
	var geoLocDataManager;
	var geoLoc;
	var neoBuilding;
	var worldPosition;
	var screenCoord;
	
	// 1rst, collect rootNodes.
	var rootNodesMap = {};
	var currentVisiblesArray = visibleObjControlerNodes.currentVisibles2.concat(visibleObjControlerNodes.currentVisibles3);
	var nodesCount = currentVisiblesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = currentVisiblesArray[i];
		nodeRoot = node.getRoot();
		if (node.data === undefined || node.data.neoBuilding === undefined)
		{ continue; }
		
		var key = node.data.neoBuilding.buildingId;
		///rootNodesMap.set(nodeRoot, nodeRoot);
		rootNodesMap[key] = nodeRoot;
	}
	
	//var rootNodesArray = Object.values(rootNodesMap);
	//var rootNodesKeysArray = Object.keys(rootNodesMap);
	//var nodesCount = rootNodesKeysArray.length;
	//for (var i=0; i<nodesCount; i++)
	for (var key in rootNodesMap)
	{
		//nodeRoot = rootNodesArray[i];
		nodeRoot = rootNodesMap[key];
		geoLocDataManager = nodeRoot.data.geoLocDataManager;
		geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		//neoBuilding = node.data.neoBuilding;
		worldPosition = nodeRoot.getBBoxCenterPositionWorldCoord(geoLoc);
		screenCoord = this.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord);
		
		if (screenCoord.x >= 0 && screenCoord.y >= 0)
		{
			ctx.font = "13px Arial";
			//ctx.strokeText(nodeRoot.data.nodeId, screenCoord.x, screenCoord.y);
			//ctx.fillText(nodeRoot.data.nodeId, screenCoord.x, screenCoord.y);
			ctx.strokeText(nodeRoot.data.data_name, screenCoord.x, screenCoord.y);
			ctx.fillText(nodeRoot.data.data_name, screenCoord.x, screenCoord.y);
		}
	}
	
	rootNodesMap = {};

	ctx.restore();
};

/**
 * The camera was moved.
 */
MagoManager.prototype.cameraMoved = function() 
{
	this.sceneState.camera.setDirty(true);
	
	if (this.selectionFbo === undefined) 
	{ this.selectionFbo = new FBO(this.sceneState.gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }

	this.selectionFbo.dirty = true;
};

/**
 * @param {Object} node
 * @returns {Object}
 */
MagoManager.prototype.getNodeGeoLocDataManager = function(node) 
{
	if (node === undefined)
	{ return undefined; }
	
	// provisionally take the geoLocDatamanager from the rootNode.
	//var rootNode = node.getRoot();
	
	var closestRootNode = node.getClosestParentWithData("geoLocDataManager");
	
	if (closestRootNode === undefined)
	{ return undefined; }

	if (closestRootNode.data === undefined)
	{ return undefined; }
	
	var rootNodeGeoLocDataManager = closestRootNode.data.geoLocDataManager;
	return rootNodeGeoLocDataManager;
};

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 * @returns {Array} resultSelectedArray 
 */
MagoManager.prototype.getSelectedObjects = function(gl, mouseX, mouseY, visibleObjControlerNodes, resultSelectedArray) 
{
	// Picking render.***
	this.bPicking = false;

	if (this.selectionFbo === undefined) 
	{ this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }

	// selection render.
	this.selectionColor.init(); // selection colors manager.***

	// colorSelection render.
	this.selectionFbo.bind(); // framebuffer for color selection.***
	
	//if (this.selectionFbo.dirty) // todo.
	{
		this.selectionCandidates.clearCandidates();
		
		// set byteColor codes for references objects.***
		var node;
		var rootNode;
		var neoBuilding;
		var currentVisibleOctreesControler;
		var currentVisibleLowestOctCount;
		var lowestOctree;
		
		var isInterior = false;
		var ssao_idx = -1;
		var minSize = 0.0;
		var refTMatrixIdxKey = 0;
		var glPrimitive = gl.TRIANGLES;

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
		var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;
		for (var i=0; i<nodesLOD0Count; i++)
		{
			node = visibleObjControlerNodes.currentVisibles0[i];
			neoBuilding = node.data.neoBuilding;
			var buildingGeoLocation = this.getNodeGeoLocDataManager(node).getCurrentGeoLocationData();
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
				this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree, node, this, isInterior, currentShader, minSize, refTMatrixIdxKey, glPrimitive);
			}
			
			// LOD1.***
			currentVisibleLowestOctCount = currentVisibleOctreesControler.currentVisibles1.length;
			for (var j=0; j<currentVisibleLowestOctCount; j++)
			{
				lowestOctree = currentVisibleOctreesControler.currentVisibles1[j];
				minSize = 0.0;
				this.renderer.renderNeoRefListsAsimetricVersionColorSelection(gl, lowestOctree, node, this, isInterior, currentShader, minSize, refTMatrixIdxKey, glPrimitive);
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

				if (lowestOctree.lego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED) 
				{ continue; }
					
				this.colorAux = this.selectionColor.getAvailableColor(this.colorAux);
				idxKey = this.selectionColor.decodeColor3(this.colorAux.r, this.colorAux.g, this.colorAux.b);
				this.selectionCandidates.setCandidates(idxKey, undefined, lowestOctree, neoBuilding, node);
				
				gl.uniform1i(currentShader.hasTexture_loc, false); //.***
				gl.uniform4fv(currentShader.color4Aux_loc, [this.colorAux.r/255.0, this.colorAux.g/255.0, this.colorAux.b/255.0, 1.0]);

				gl.uniform1i(currentShader.hasAditionalMov_loc, false);
				gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

				this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader);
			}
		}
		
		var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
		for (var i=0; i<nodesLOD2Count; i++)
		{
			node = visibleObjControlerNodes.currentVisibles2[i];
			neoBuilding = node.data.neoBuilding;
			var buildingGeoLocation = this.getNodeGeoLocDataManager(node).getCurrentGeoLocationData();
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
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
					this.selectionCandidates.setCandidates(idxKey, undefined, lowestOctree, neoBuilding, node);
				
					gl.uniform1i(currentShader.hasTexture_loc, false); //.***
					gl.uniform4fv(currentShader.color4Aux_loc, [this.colorAux.r/255.0, this.colorAux.g/255.0, this.colorAux.b/255.0, 1.0]);

					gl.uniform1i(currentShader.hasAditionalMov_loc, false);
					gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

					this.renderer.renderLodBuildingColorSelection(gl, lowestOctree.lego, this, currentShader);
				}
			}
		}
		
		// now, lod3, lod4 & lod5.***
		var nodesLODXCount = visibleObjControlerNodes.currentVisibles3.length;
		gl.uniform1i(currentShader.refMatrixType_loc, 0); // 0 = identity matrix.***
		for (var i=0; i<nodesLODXCount; i++)
		{
			node = visibleObjControlerNodes.currentVisibles3[i];
			neoBuilding = node.data.neoBuilding;
			var buildingGeoLocation = this.getNodeGeoLocDataManager(node).getCurrentGeoLocationData();
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
			var currentLod = neoBuilding.currentLod;
			
			gl.uniformMatrix4fv(currentShader.RefTransfMatrix, false, buildingGeoLocation.rotMatrix._floatArrays);
			var skinLod = neoBuilding.getCurrentSkin();
			if (skinLod === undefined)
			{ continue; }
		
			if (skinLod.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED) 
			{ continue; }
				
			this.colorAux = this.selectionColor.getAvailableColor(this.colorAux);
			idxKey = this.selectionColor.decodeColor3(this.colorAux.r, this.colorAux.g, this.colorAux.b);
			this.selectionCandidates.setCandidates(idxKey, undefined, undefined, neoBuilding, node);
			
			gl.uniform1i(currentShader.hasTexture_loc, false); //.***
			gl.uniform4fv(currentShader.color4Aux_loc, [this.colorAux.r/255.0, this.colorAux.g/255.0, this.colorAux.b/255.0, 1.0]);

			gl.uniform1i(currentShader.hasAditionalMov_loc, false);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

			this.renderer.renderLodBuildingColorSelection(gl, skinLod, this, currentShader);
		}

		if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
		gl.disableVertexAttribArray(currentShader.position3_loc);
		
		// clean the selBuffer.
		this.selectionFbo.dirty = false;
	}

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
	resultSelectedArray[3] = this.selectionCandidates.currentNodeSelected;
	
	this.swapRenderingFase();
	
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
	
	var geoLocDataManager = this.getNodeGeoLocDataManager(this.nodeSelected);
	
	this.calculatePixelPositionWorldCoord(gl, pixelX, pixelY, this.pointSC2);
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
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

	//var current_frustum_near = this.sceneState.camera.frustum.near;
	var current_frustum_far = this.sceneState.camera.frustum.far;
	
	if (this.depthFboNeo) 
	{
		this.depthFboNeo.bind(); // bind the existent last depthFramebuffer.
	}
	else 
	{
		// never enter here.
		if (this.depthFboNeo === undefined) 
		{ this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
		this.depthFboNeo.bind(); 

		gl.clearColor(1, 1, 1, 1); // white background.***
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
		gl.disable(gl.BLEND);
		var ssao_idx = 0;
		this.depthRenderLowestOctreeAsimetricVersion(gl, ssao_idx, this.visibleObjControlerNodes);
	}

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

	this.depthFboNeo.unbind();
	
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
MagoManager.prototype.calculateWorldPositionToScreenCoord = function(gl, worldCoordX, worldCoordY, worldCoordZ, resultScreenCoord)
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
	if (zDist > 0)
	{
		// the worldPoint is rear the camera.
		resultScreenCoord.set(-1, -1, 0);
		return resultScreenCoord;
	}
	
	// now calculate the width and height of the plane in zDist.
	//var fovyRad = this.sceneState.camera.frustum.fovyRad;
	
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

	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL)	// Moving all
	{
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.visibleObjControlerNodes, this.arrayAuxSC);
		var currentBuildingSelected = this.arrayAuxSC[0];
		var currentNodeSelected = this.arrayAuxSC[3];
		var currentRootNodeSelected;
		if (currentNodeSelected)
		{
			currentRootNodeSelected = currentNodeSelected.getRoot();
		}
		this.arrayAuxSC.length = 0;

		if (currentRootNodeSelected === this.rootNodeSelected) 
		{
			return true;
		}
		else 
		{
			return false;
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // Moving object
	{
		this.arrayAuxSC.length = 0;
		var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.visibleObjControlerNodes, this.arrayAuxSC);
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
		this.wwd.navigator.panRecognizer.enabled = state;
		this.wwd.navigator.primaryDragRecognizer.enabled = state;
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
 */
MagoManager.prototype.mouseActionLeftDown = function(mouseX, mouseY) 
{
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseLeftDown = true;
	//this.isCameraMoving = true;
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.saveHistoryObjectMovement = function(refObject, node) 
{
	var changeHistory = new ChangeHistory();
	var refMove = changeHistory.getReferenceObjectAditionalMovement();
	var refMoveRelToBuilding = changeHistory.getReferenceObjectAditionalMovementRelToBuilding();
	
	if (refObject.moveVector === undefined)
	{ refObject.moveVector = new Point3D(); }
	
	if (refObject.moveVectorRelToBuilding === undefined)
	{ refObject.moveVectorRelToBuilding = new Point3D(); }
	
	refMove.set(refObject.moveVector.x, refObject.moveVector.y, refObject.moveVector.z);
	refMoveRelToBuilding.set(refObject.moveVectorRelToBuilding.x, refObject.moveVectorRelToBuilding.y, refObject.moveVectorRelToBuilding.z);
	if (node === undefined)
	{ return; }

	var projectId = node.data.projectId;
	var dataKey = node.data.nodeId;
	var objectIndex = refObject._id;
	
	changeHistory.setProjectId(projectId);
	changeHistory.setDataKey(dataKey);
	changeHistory.setObjectIndexOrder(objectIndex);
	MagoConfig.saveMovingHistory(projectId, dataKey, objectIndex, changeHistory);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionLeftUp = function(mouseX, mouseY) 
{
	if (this.objectMoved)
	{
		this.objectMoved = false;
		var nodeSelected = this.selectionCandidates.currentNodeSelected;
		if (nodeSelected === undefined)
		{ return; }
		
		this.saveHistoryObjectMovement(this.objectSelected, nodeSelected);
	}
	
	this.isCameraMoving = false;
	this.mouseLeftDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane = undefined;
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;

	this.dateSC = new Date();
	this.currentTimeSC = this.dateSC.getTime();
	var miliSecondsUsed = this.currentTimeSC - this.startTimeSC;
	if (miliSecondsUsed < 1500) 
	{
		if (this.mouse_x === mouseX && this.mouse_y === mouseY) 
		{
			this.bPicking = true;
		}
	}
	
	this.setCameraMotion(true);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionMiddleDown = function(mouseX, mouseY) 
{
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseMiddleDown = true;
	this.isCameraMoving = true;
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionMiddleUp = function(mouseX, mouseY) 
{
	this.isCameraMoving = false;
	this.mouseMiddleDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane = undefined;
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;
	this.setCameraMotion(false);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionRightDown = function(mouseX, mouseY) 
{
	/*
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseRightDown = true;
	this.isCameraMoving = true;
	*/
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionRightUp = function(mouseX, mouseY) 
{
	/*
	this.isCameraMoving = false;
	this.setCameraMotion(false);
	*/
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionMove = function(mouseX, mouseY) 
{
	if (this.mouseLeftDown) 
	{
		this.manageMouseDragging(mouseX, mouseY);
	}
	else if (this.mouseMiddleDown) 
	{
		this.sceneState.camera.setDirty(true);
	}
	else if (this.mouseRightDown) 
	{
		this.sceneState.camera.setDirty(true);
	}
	else
	{
		this.mouseDragging = false;
		this.setCameraMotion(false);
		if (this.mouseMiddleDown)
		{
			this.isCameraMoving = true;
		}
	}
};


/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 */
MagoManager.prototype.manageMouseDragging = function(mouseX, mouseY) 
{
	this.sceneState.camera.setDirty(true);
	
	// distinguish 2 modes.******************************************************
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // blocks move.***
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
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // objects move.***
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
};


/**
 * Moves an object.
 * @param {GL} gl 변수
 */
MagoManager.prototype.moveSelectedObjectAsimetricMode = function(gl) 
{
	//var cameraPosition = this.sceneState.camera.position;
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // buildings move.***
	{
		if (this.selectionCandidates.currentNodeSelected === undefined)
		{ return; }
		
		var geoLocDataManager = this.getNodeGeoLocDataManager(this.selectionCandidates.currentNodeSelected);
		var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
	
		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			this.selObjMovePlane = new Plane();
			// create a local XY plane.
			// find the pixel position relative to building.
			var pixelPosWorldCoord = new Point3D();
			pixelPosWorldCoord = this.calculatePixelPositionWorldCoord(gl, this.mouse_x, this.mouse_y, pixelPosWorldCoord);
			var pixelPosBuildingCoord = geoLocationData.tMatrixInv.transformPoint3D(pixelPosWorldCoord, pixelPosBuildingCoord);
			
			this.selObjMovePlane.setPointAndNormal(pixelPosBuildingCoord.x, pixelPosBuildingCoord.y, pixelPosBuildingCoord.z,    0.0, 0.0, 1.0); 
		}

		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.lineSC = this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***

		// transform world_ray to building_ray.***
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();

		camPosBuilding = geoLocationData.geoLocMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		this.pointSC = geoLocationData.geoLocMatrixInv.rotatePoint3D(this.lineSC.direction, this.pointSC);
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
		this.pointSC = geoLocationData.geoLocMatrix.transformPoint3D(intersectionPoint, this.pointSC);
		intersectionPoint.set(this.pointSC.x, this.pointSC.y, this.pointSC.z);

		// register the movement.***
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

			var newLongitude = geoLocationData.geographicCoord.longitude - difX;
			var newlatitude = geoLocationData.geographicCoord.latitude - difY;
			//var newHeight = cartographic.altitude;

			this.changeLocationAndRotationNode(this.selectionCandidates.currentNodeSelected, newlatitude, newLongitude, undefined, undefined, undefined, undefined);
			this.displayLocationAndRotation(this.buildingSelected);
			
			this.startMovPoint.x -= difX;
			this.startMovPoint.y -= difY;
		}
		
		//this.buildingSelected.calculateBBoxCenterPositionWorldCoord(geoLocationData);
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		if (this.objectSelected === undefined)
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			this.selObjMovePlane = this.calculateSelObjMovePlaneAsimetricMode(gl, this.mouse_x, this.mouse_y, this.selObjMovePlane);
		}
		
		var geoLocDataManager = this.getNodeGeoLocDataManager(this.selectionCandidates.currentNodeSelected);

		// world ray = camPos + lambda*camDir.***
		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
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
		if (this.objectSelected.moveVectorRelToBuilding === undefined)
		{ this.objectSelected.moveVectorRelToBuilding = new Point3D(); }
	
		// move vector rel to building.
		if (!this.thereAreStartMovePoint) 
		{
			this.startMovPoint = intersectionPoint;
			this.startMovPoint.add(-this.objectSelected.moveVectorRelToBuilding.x, -this.objectSelected.moveVectorRelToBuilding.y, -this.objectSelected.moveVectorRelToBuilding.z);
			this.thereAreStartMovePoint = true;
		}
		else 
		{
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;

			this.objectSelected.moveVectorRelToBuilding.set(difX, difY, difZ);
			this.objectSelected.moveVector = buildingGeoLocation.tMatrix.rotatePoint3D(this.objectSelected.moveVectorRelToBuilding, this.objectSelected.moveVector); 
		}
		
		var projectId = this.selectionCandidates.currentNodeSelected.data.projectId;
		var data_key = this.selectionCandidates.currentNodeSelected.data.nodeId;
		var objectIndexOrder = this.objectSelected._id;
		
		MagoConfig.deleteMovingHistoryObject(projectId, data_key, objectIndexOrder);
		this.objectMoved = true; // this provoques that on leftMouseUp -> saveHistoryObjectMovement
		
	}
};


/**
 * Frustum 안의 VisibleOctree 를 검색하여 currentVisibleOctreesControler 를 준비
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 * @param {VisibleObjectsController} visibleObjControlerOctrees 
 * @param {any} lod 
 */
MagoManager.prototype.getRenderablesDetailedNeoBuildingAsimetricVersion = function(gl, scene, node, visibleObjControlerOctrees, lod) 
{
	var neoBuilding = node.data.neoBuilding;
	
	// chaek if the neoBuilding has availableLod_0.***
	
	
	if (neoBuilding === undefined || neoBuilding.octree === undefined) { return; }

	var rootGeoLocDataManager = this.getNodeGeoLocDataManager(node);
	var rootGeoLoc = rootGeoLocDataManager.getCurrentGeoLocationData();
	
	//var nodeGeoLocation = geoLocDataManager.getCurrentGeoLocationData(); // original.***
	var nodeGeoLocation = rootGeoLocDataManager.getCurrentGeoLocationData();
	if (nodeGeoLocation === undefined)
	{ return false; }

	if (neoBuilding.currentVisibleOctreesControler === undefined)
	{ neoBuilding.currentVisibleOctreesControler = new VisibleObjectsController(); }	

	//if (lod === 0 || lod === 1 || lod === 2)
	{
		var distLod0 = this.magoPolicy.getLod0DistInMeters();
		var distLod1 = this.magoPolicy.getLod1DistInMeters();
		var distLod2 = this.magoPolicy.getLod2DistInMeters();
		var distLod3 = this.magoPolicy.getLod3DistInMeters();
		var distLod4 = this.magoPolicy.getLod4DistInMeters();
		var distLod5 = this.magoPolicy.getLod5DistInMeters();
		
		if (neoBuilding.buildingId === "Sea_Port" || neoBuilding.buildingId === "ctships")
		{
			if (distLod0 < 350)
			{ distLod0 = 350; }
			if (distLod1 < 550)
			{ distLod1 = 550; }
			if (distLod2 < 25000)
			{ distLod2 = 25000; }
		}

		var find = false;
		
		this.myCameraSCX = nodeGeoLocation.getTransformedRelativeCamera(this.sceneState.camera, this.myCameraSCX);
		//var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(this.myCameraSCX.position.x, this.myCameraSCX.position.y, this.myCameraSCX.position.z); // old.***

		neoBuilding.currentVisibleOctreesControler.clear();
		
		if (lod === 2)
		{
			// in this case is not necessary calculate the frustum planes.
			neoBuilding.octree.extractLowestOctreesByLOD(neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctrees, this.boundingSphere_Aux,
				this.myCameraSCX.position, distLod0, distLod1, distLod5);
			find = true;
		}
		else 
		{
			// must calculate the frustum planes.
			//var keepFar = this.myCameraSCX.frustum.far;
			//this.myCameraSCX.frustum.far = distLod0;
			this.myCameraSCX.calculateFrustumPlanes();
			
			// 1rst, check if there are octrees very close.
			find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	this.myCameraSCX.frustum, neoBuilding.currentVisibleOctreesControler, visibleObjControlerOctrees, this.boundingSphere_Aux,
				this.myCameraSCX.position, distLod0, distLod1, distLod2*100);
		}

		if (!find) 
		{
			// if the building is far to camera, then delete it.
			if (neoBuilding.distToCam > 60)
			{ this.processQueue.putNodeToDelete(node, 0); }
			return false;
		}
		else 
		{
			this.processQueue.eraseNodeToDelete(node);
		}
	}
	//else
	//{
	//	// never enter here...
	//	neoBuilding.currentVisibleOctreesControler.currentVisibles2.length = 0;
	//	neoBuilding.octree.extractLowestOctreesIfHasTriPolyhedrons(neoBuilding.currentVisibleOctreesControler.currentVisibles2); // old.
	//}
	
	// LOD0 & LOD1
	// Check if the lod0lowestOctrees, lod1lowestOctrees must load and parse data
	var lowestOctree;
	var currentVisibleOctrees = [].concat(neoBuilding.currentVisibleOctreesControler.currentVisibles0, neoBuilding.currentVisibleOctreesControler.currentVisibles1);
	var applyOcclusionCulling = neoBuilding.getRenderSettingApplyOcclusionCulling();
	
	// if there are no lod0 & lod1 then put the neobuilding to delete model-references data.
	if (currentVisibleOctrees.length === 0)
	{
		this.processQueue.putNodeToDeleteModelReferences(node, 0);
	}
	else 
	{
		this.processQueue.eraseNodeToDeleteModelReferences(node);
	}
	
	// test.*************************************************************************
	//if(neoBuilding.currentVisibleOctreesControler.currentVisibles2.length === 0)
	//{
	//	this.processQueue.putNodeToDeleteLessThanLod3(node);
	//}
	// end test.---------------------------------------------------------------------
	
	var putLowestOctreeToLod2 = false;
	for (var i=0, length = currentVisibleOctrees.length; i<length; i++) 
	{
		putLowestOctreeToLod2 = false;
		lowestOctree = currentVisibleOctrees[i];
		if (lowestOctree.triPolyhedronsCount === 0) 
		{ continue; }

		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
			// if the octree has no neoReferencesMotherAndIndices ready, then render the lego.
			putLowestOctreeToLod2 = true;
		}
		else
		{
			lowestOctree.neoReferencesMotherAndIndices.updateCurrentVisibleIndices(this.myCameraSCX.position.x, this.myCameraSCX.position.y, this.myCameraSCX.position.z, applyOcclusionCulling);
		}
		
		// if the octree has no blocks list ready, then render the lego.
		var myBlocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
		if (myBlocksList === undefined || myBlocksList.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
		{
			// if the octree has no blocks list ready, then render the lego.
			putLowestOctreeToLod2 = true;
		}
		
		if (putLowestOctreeToLod2)
		{
			neoBuilding.currentVisibleOctreesControler.currentVisibles2.push(lowestOctree);
		}
	}
	currentVisibleOctrees.length = 0;
	
	// check if all lod2-octrees is ready to render. 
	// If lod2-octrees is no ready to render, then render lod3.***
	var allLod2OctreesIsReady = true;
	var octree;
	var visibleOctreesCount = neoBuilding.currentVisibleOctreesControler.currentVisibles2.length;
	if (visibleOctreesCount > 6)
	{ visibleOctreesCount = 6; }
	for (var j=0; j<visibleOctreesCount; j++)
	{
		octree = neoBuilding.currentVisibleOctreesControler.currentVisibles2[j];
		if (octree.lego === undefined || octree.lego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
		{
			allLod2OctreesIsReady = false;
			break;
		}
	}
	
	if (!allLod2OctreesIsReady)
	{
		// must render lod3.***
		neoBuilding.currentLod = 3;
		this.putNodeToArraySortedByDist(this.visibleObjControlerNodes.currentVisibles3, node);
	}
				
	return true;
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
	var maxDeleteNodesCount = 8;
	var nodesToDeleteCount = Object.keys(this.processQueue.nodesToDeleteMap).length;
	if (nodesToDeleteCount < maxDeleteNodesCount)
	{ maxDeleteNodesCount = nodesToDeleteCount; }
	
	var neoBuilding;
	var node;
	var rootNode;
	
	// incompatibility gulp.
	//for (var key of this.processQueue.buildingsToDeleteMap.keys())
	//{
	//	this.deleteNeoBuilding(gl, key);
	//	this.processQueue.buildingsToDeleteMap.delete(key);
	//	deletedCount += 1;
	//	if (deletedCount > maxDeleteBuildingsCount)
	//	{ break; }
	//}
	
	///var nodesToDeleteArray = Array.from(this.processQueue.nodesToDeleteMap.keys());
	//var nodesToDeleteArray = Object.values(this.processQueue.nodesToDeleteMap);

	//for (var i=0; i<maxDeleteNodesCount; i++)
	for (var key in this.processQueue.nodesToDeleteMap)
	{
		//node = nodesToDeleteArray[i];
		node = this.processQueue.nodesToDeleteMap[key];
		
		if (node == undefined)
		{ continue; }

		neoBuilding = node.data.neoBuilding;
		this.processQueue.eraseNodeToDelete(node);
		
		if (neoBuilding == undefined)
		{ continue; }
	
		this.deleteNeoBuilding(gl, neoBuilding);
	}
	//nodesToDeleteArray = [];
	//nodesToDeleteArray = undefined;
	
	// now delete modelReferences of lod2Octrees.
	var modelRefsDeletedCount = 0;
	//var nodesToDeletesCount = Object.keys(this.processQueue.nodesToDeleteModelReferencesMap).length;
	//var nodesToDeleteModelReferencesArray = Object.values(this.processQueue.nodesToDeleteModelReferencesMap);

	//for (var i=0; i<nodesToDeletesCount; i++)
	for (var key in this.processQueue.nodesToDeleteModelReferencesMap)
	{
		//node = nodesToDeleteModelReferencesArray[i];
		node = this.processQueue.nodesToDeleteModelReferencesMap[key];
		
		if (node.data === undefined)
		{ continue; }
	
		neoBuilding = node.data.neoBuilding;
		this.processQueue.eraseNodeToDeleteModelReferences(neoBuilding);
		if (neoBuilding === undefined)
		{ continue; }

		if (neoBuilding.octree)
		{
			neoBuilding.octree.deleteObjectsModelReferences(gl, this.vboMemoryManager);
		}
		if (neoBuilding.motherBlocksArray.length > 0 || neoBuilding.motherNeoReferencesArray.length > 0)
		{
			modelRefsDeletedCount ++;
		}
		neoBuilding.deleteObjectsModelReferences(gl, this.vboMemoryManager);
		
		if (modelRefsDeletedCount > 10)
		{ break; }
	}
	
	// now, delete lod0, lod1, lod2.***
	var deletedCount = 0;
	/*
	for(var key in this.processQueue.nodesToDeleteLessThanLod3Map)
	{
		node = this.processQueue.nodesToDeleteLessThanLod3Map[key];
		//node = nodesToDeleteLod2Lod4Lod5Array[i];
		if (node.data === undefined)
		{ continue; }
	
		if (this.processQueue.eraseNodeToDeleteLessThanLod3(node))
		{
			neoBuilding = node.data.neoBuilding;
			if (neoBuilding === undefined)
			{ continue; }
			
			if (neoBuilding.octree !== undefined)
			{ 
				neoBuilding.octree.deleteLod2GlObjects(gl, this.vboMemoryManager);
				//if (neoBuilding.octree.lego)
				//{
				//	neoBuilding.octree.lego.deleteObjects(gl, this.vboMemoryManager);
				//	neoBuilding.octree.lego = undefined;
				//}
				
				// delete the textureLod2.***
				if(neoBuilding.simpleBuilding3x3Texture)
				{
					neoBuilding.simpleBuilding3x3Texture.deleteObjects(gl);
					neoBuilding.simpleBuilding3x3Texture = undefined;
				}
			}
			neoBuilding.deleteObjectsModelReferences(gl, this.vboMemoryManager);
			deletedCount++;
			
			if (deletedCount > 10)
			{ break; }
		}
	}
	*/
	
	
	// parse pendent data.**********************************************************************************
	var maxParsesCount = 1;
	
	// parse references lod0 & lod 1.
	var lowestOctree;
	var neoBuilding;
	var headerVersion;
	var geoLocDataManager;
	var octreesParsedCount = 0;
	
	if (this.matrix4SC === undefined)
	{ this.matrix4SC = new Matrix4(); }

	// is desirable to parse octrees references ordered by the current eye distance.
	// in the "visibleObjControlerOctrees" there are the octrees sorted by distance, so must use it.
	// parse octrees lod1 references.
	octreesParsedCount = 0;
	maxParsesCount = 1;
	
	if (this.parseQueue.parseOctreesLod0References(gl, this.visibleObjControlerOctrees, this, maxParsesCount))
	{
		if (this.selectionFbo)
		{ this.selectionFbo.dirty = true; }
	}
	
	// parse octrees lod1 references.
	octreesParsedCount = 0;
	maxParsesCount = 1;
	if (Object.keys(this.parseQueue.octreesLod0ReferencesToParseMap).length > 0)
	{
		// 1rst parse the currently closest lowestOctrees to camera.
		var octreesLod0Count = this.visibleObjControlerOctrees.currentVisibles1.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = this.visibleObjControlerOctrees.currentVisibles1[i];
			if (this.parseQueue.parseOctreesLod0References(gl, lowestOctree, this))
			{
				octreesParsedCount++;
			}
			else 
			{
				// test else.
				//if (lowestOctree.neoReferencesMotherAndIndices)
				//{
				//if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
				//{ var hola = 0; }
				//}
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			///var octreesArray = Array.from(this.parseQueue.octreesLod0ReferencesToParseMap.keys());
			///for (var i=0; i<octreesArray.length; i++)
			for (var key in this.parseQueue.octreesLod0ReferencesToParseMap)
			{
				var lowestOctree = this.parseQueue.octreesLod0ReferencesToParseMap[key];
				//lowestOctree = octreesArray[i];
				this.parseQueue.parseOctreesLod0References(gl, lowestOctree, this);
				octreesParsedCount++;
				if (octreesParsedCount > maxParsesCount)
				{ break; }
			}
		}
		
		if (octreesParsedCount > 0)
		{
			if (this.selectionFbo)
			{ this.selectionFbo.dirty = true; }
		}
	}
	
	// parse octrees lod0 models.
	octreesParsedCount = 0;
	maxParsesCount = 1;
	if (Object.keys(this.parseQueue.octreesLod0ModelsToParseMap).length > 0)
	{
		// 1rst parse the currently closest lowestOctrees to camera.
		var octreesLod0Count = this.visibleObjControlerOctrees.currentVisibles0.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = this.visibleObjControlerOctrees.currentVisibles0[i];
			
			if (this.parseQueue.octreesLod0ModelsToParseMap.hasOwnProperty(lowestOctree.octreeKey))
			{
				delete this.parseQueue.octreesLod0ModelsToParseMap[lowestOctree.octreeKey];
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				if (blocksList === undefined)
				{ continue; }
				
				if (blocksList.dataArraybuffer === undefined)
				{ continue; }
			
				if (blocksList.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				headerVersion = neoBuilding.getHeaderVersion();
				if (headerVersion[0] === "v")
				{
					// parse the beta version.
					blocksList.parseBlocksList(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				else 
				{
					// parse versioned.
					blocksList.parseBlocksListVersioned(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				blocksList.dataArraybuffer = undefined;
				
				octreesParsedCount++;
			}
			else 
			{
				// test else.
				//if (lowestOctree.neoReferencesMotherAndIndices && lowestOctree.neoReferencesMotherAndIndices.blocksList)
				//{
				//	if (lowestOctree.neoReferencesMotherAndIndices.blocksList.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
				//	{ var hola = 0; }
				//}
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			//var octreesArray = Array.from(this.parseQueue.octreesLod0ModelsToParseMap.keys());
			//for (var i=0; i<octreesArray.length; i++)
			for (var key in this.parseQueue.octreesLod0ModelsToParseMap)
			{
				var lowestOctree = this.parseQueue.octreesLod0ModelsToParseMap[key];
				delete this.parseQueue.octreesLod0ModelsToParseMap[key];
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				if (blocksList === undefined)
				{ continue; }
				
				if (blocksList.dataArraybuffer === undefined)
				{ continue; }
			
				if (blocksList.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				headerVersion = neoBuilding.getHeaderVersion();
				if (headerVersion[0] === "v")
				{
					// parse the beta version.
					blocksList.parseBlocksList(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				else 
				{
					// parse versioned.
					blocksList.parseBlocksListVersioned(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				blocksList.dataArraybuffer = undefined;
				
				octreesParsedCount++;
				if (octreesParsedCount > maxParsesCount)
				{ break; }
			}
		}
		
		if (octreesParsedCount > 0)
		{
			if (this.selectionFbo)
			{ this.selectionFbo.dirty = true; }
		}
	}
	
	// parse octrees lod1 models.
	octreesParsedCount = 0;
	maxParsesCount = 1;
	if (Object.keys(this.parseQueue.octreesLod0ModelsToParseMap).length > 0)
	{
		// 1rst parse the currently closest lowestOctrees to camera.
		var octreesLod0Count = this.visibleObjControlerOctrees.currentVisibles1.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = this.visibleObjControlerOctrees.currentVisibles1[i];

			if (this.parseQueue.octreesLod0ModelsToParseMap.hasOwnProperty(lowestOctree.octreeKey))
			{
				delete this.parseQueue.octreesLod0ModelsToParseMap[lowestOctree.octreeKey];
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				if (blocksList === undefined)
				{ continue; }
				
				if (blocksList.dataArraybuffer === undefined)
				{ continue; }
			
				if (blocksList.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				headerVersion = neoBuilding.getHeaderVersion();
				if (headerVersion[0] === "v")
				{
					// parse the beta version.
					blocksList.parseBlocksList(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				else 
				{
					// parse versioned.
					blocksList.parseBlocksListVersioned(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				blocksList.dataArraybuffer = undefined;
				
				octreesParsedCount++;
			}
			else 
			{
				// test else.
				//if (lowestOctree.neoReferencesMotherAndIndices && lowestOctree.neoReferencesMotherAndIndices.blocksList)
				//{
				//	if (lowestOctree.neoReferencesMotherAndIndices.blocksList.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
				//	{ var hola = 0; }
				//}
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			//var octreesArray = Array.from(this.parseQueue.octreesLod0ModelsToParseMap.keys());
			//for (var i=0; i<octreesArray.length; i++)
			for (var key in this.parseQueue.octreesLod0ModelsToParseMap)
			{
				var lowestOctree = this.parseQueue.octreesLod0ModelsToParseMap[key];
				delete this.parseQueue.octreesLod0ModelsToParseMap[key];
				if (lowestOctree.neoReferencesMotherAndIndices === undefined)
				{ continue; }
				
				var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
				if (blocksList === undefined)
				{ continue; }
				
				if (blocksList.dataArraybuffer === undefined)
				{ continue; }
			
				if (blocksList.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
				{ continue; }
				
				neoBuilding = lowestOctree.neoBuildingOwner;
				headerVersion = neoBuilding.getHeaderVersion();
				if (headerVersion[0] === "v")
				{
					// parse the beta version.
					blocksList.parseBlocksList(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				else 
				{
					// parse versioned.
					blocksList.parseBlocksListVersioned(blocksList.dataArraybuffer, this.readerWriter, neoBuilding.motherBlocksArray, this);
				}
				blocksList.dataArraybuffer = undefined;
				
				octreesParsedCount++;
				if (octreesParsedCount > maxParsesCount)
				{ break; }
			}
		}
		
		if (octreesParsedCount > 0)
		{
			if (this.selectionFbo)
			{ this.selectionFbo.dirty = true; }
		}
	}

	
	// parse octrees lod2 (lego).
	octreesParsedCount = 0;
	maxParsesCount = 1;
	if (Object.keys(this.parseQueue.octreesLod2LegosToParseMap).length > 0)
	{
		var octreesLod0Count = this.visibleObjControlerOctrees.currentVisibles2.length;
		for (var i=0; i<octreesLod0Count; i++)
		{
			lowestOctree = this.visibleObjControlerOctrees.currentVisibles2[i];
			if (this.parseQueue.octreesLod2LegosToParseMap.hasOwnProperty(lowestOctree.octreeKey))
			{
				delete this.parseQueue.octreesLod2LegosToParseMap[lowestOctree.octreeKey];
				//this.parseQueue.eraseOctreeLod2LegosToParse(lowestOctree);
				if (lowestOctree.lego === undefined)
				{ continue; }
				
				lowestOctree.lego.parseArrayBuffer(gl, lowestOctree.lego.dataArrayBuffer, this);
				lowestOctree.lego.dataArrayBuffer = undefined;
				
				octreesParsedCount++;
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			//var octreesArray = Array.from(this.parseQueue.octreesLod2LegosToParseMap.keys());
			//for (var i=0; i<octreesArray.length; i++)
			for (var key in this.parseQueue.octreesLod2LegosToParseMap)
			{
				var lowestOctree = this.parseQueue.octreesLod2LegosToParseMap[key];
				if (this.parseQueue.octreesLod2LegosToParseMap.hasOwnProperty(key))
				{
					delete this.parseQueue.octreesLod2LegosToParseMap[key];
					//this.parseQueue.eraseOctreeLod2LegosToParse(lowestOctree);
					if (lowestOctree.lego === undefined)
					{ continue; }
					
					lowestOctree.lego.parseArrayBuffer(gl, lowestOctree.lego.dataArrayBuffer, this);
					lowestOctree.lego.dataArrayBuffer = undefined;
					
					octreesParsedCount++;
				}
				if (octreesParsedCount > maxParsesCount)
				{ break; }
			}
		}
		
		if (octreesParsedCount > 0)
		{
			if (this.selectionFbo)
			{ this.selectionFbo.dirty = true; }
		}
	}
	
	// skin-lego.********************************************************************************
	// skin-lego.********************************************************************************
	octreesParsedCount = 0;
	maxParsesCount = 1;
	if (Object.keys(this.parseQueue.skinLegosToParseMap).length > 0)
	{
		var node;
		var skinLego;
		var neoBuilding;
		var lod3buildingsCount = this.visibleObjControlerNodes.currentVisibles3.length;
		for (var i=0; i<lod3buildingsCount; i++)
		{
			node = this.visibleObjControlerNodes.currentVisibles3[i];
			neoBuilding = node.data.neoBuilding;
			
			if (neoBuilding === undefined || neoBuilding.lodMeshesMap === undefined)
			{ continue; }
		
		    // check the current lod of the building.***
			var currentBuildingLod = neoBuilding.currentLod;
			var lodIdx = currentBuildingLod - 3;
			
			if (lodIdx < 0)
			{ continue; }// old.***
		
			var lodString = undefined;
			if (currentBuildingLod === 3)
			{ lodString = "lod3"; }
			else if (currentBuildingLod === 4)
			{ lodString = "lod4"; }
			else if (currentBuildingLod === 5)
			{ lodString = "lod5"; }

			if (lodString === undefined)
			{ continue; }
			
			///skinLego = neoBuilding.lodMeshesMap.get(lodString);
			skinLego = neoBuilding.lodMeshesMap[lodString];
			if (skinLego === undefined)
			{ continue; }
			
			if (this.parseQueue.skinLegosToParseMap.hasOwnProperty(skinLego.legoKey))
			{
				delete this.parseQueue.skinLegosToParseMap[skinLego.legoKey];
				skinLego.parseArrayBuffer(gl, skinLego.dataArrayBuffer, this);
				skinLego.dataArrayBuffer = undefined;
				
				octreesParsedCount++;
			}
			if (octreesParsedCount > maxParsesCount)
			{ break; }
		}
		
		if (octreesParsedCount === 0)
		{
			//var nodessArray = Array.from(this.parseQueue.skinLegosToParseMap.keys());
			//for (var i=0; i<nodessArray.length; i++)
			for (var key in this.parseQueue.skinLegosToParseMap)
			{
				var node = this.parseQueue.skinLegosToParseMap[key];
				
				if (node.data === undefined)
				{ continue; }
				
				neoBuilding = node.data.neoBuilding;
			
				if (neoBuilding === undefined)
				{ continue; }
			
				// check the current lod of the building.***
				var currentBuildingLod = neoBuilding.currentLod;
				var lodIdx = currentBuildingLod - 3;
				
				if (lodIdx < 0)
				{ continue; }
				
				skinLego = neoBuilding.lodMeshesArray[lodIdx];
				if (skinLego === undefined)
				{ continue; }
				if (this.parseQueue.skinLegosToParseMap.hasOwnProperty(skinLego.legoKey))
				{
					delete this.parseQueue.skinLegosToParseMap[skinLego.legoKey];
					skinLego.parseArrayBuffer(gl, skinLego.dataArrayBuffer, this);
					skinLego.dataArrayBuffer = undefined;
					
					octreesParsedCount++;
				}
				if (octreesParsedCount > maxParsesCount)
				{ break; }
			}
			
		}
	}
};

/**
 */
MagoManager.prototype.TestA = function() 
{
	var hola = 0;
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
	//if (this.fileRequestControler.isFullPlus(fileRequestExtraCount))	{ return; }

	var geometryDataPath = this.readerWriter.geometryDataPath;
	var buildingFolderName;
	var projectFolderName;
	var neoBuilding;

	// LOD0 & LOD1
	// Check if the lod0lowestOctrees, lod1lowestOctrees must load and parse data
	var currentVisibleOctrees = [].concat(globalVisibleObjControlerOctrees.currentVisibles0, globalVisibleObjControlerOctrees.currentVisibles1);
	var lowestOctree;
	this.thereAreUrgentOctrees = false;

	// now, prepare the ocree normally.
	for (var i=0, length = currentVisibleOctrees.length; i<length; i++) 
	{
		lowestOctree = currentVisibleOctrees[i];
		neoBuilding = lowestOctree.neoBuildingOwner;
		
		if (neoBuilding === undefined)
		{ continue; }
		
		if (lowestOctree.triPolyhedronsCount === 0) 
		{ continue; }
		
		if (lowestOctree.octree_number_name === undefined)
		{ continue; }
	
		buildingFolderName = neoBuilding.buildingFileName;
		projectFolderName = neoBuilding.projectFolderName;
		
		if (lowestOctree.neoReferencesMotherAndIndices === undefined)
		{
			lowestOctree.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
			lowestOctree.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
		}
		
		if (this.fileRequestControler.isFullPlusModelReferences(fileRequestExtraCount))	
		{ return; } 

		if (lowestOctree.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.READY)
		{
			if (lowestOctree.neoReferencesMotherAndIndices.blocksList === undefined)
			{ lowestOctree.neoReferencesMotherAndIndices.blocksList = new BlocksList(); }

			var subOctreeNumberName = lowestOctree.octree_number_name.toString();
			var references_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/References";
			var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
			this.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, lowestOctree, this);
			//continue; 
		}
		
		// 4 = parsed.***
		// now, check if the blocksList is loaded & parsed.***
		var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList;
		if (blocksList === undefined)
		{ continue; }
		// 0 = file loading NO started.***
		if (blocksList.fileLoadState === CODE.fileLoadState.READY) 
		{
			if (this.fileRequestControler.isFullPlusModelReferences(fileRequestExtraCount))	
			{ return; }
			
			//if (this.fileRequestControler.isFullPlus(fileRequestExtraCount))	{ return; }
			// must read blocksList.***
			var subOctreeNumberName = lowestOctree.octree_number_name.toString();
			var blocks_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/Models";
			var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
			this.readerWriter.getNeoBlocksArraybuffer(filePathInServer, lowestOctree, this);
			continue;
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

	if (globalVisibleObjControlerOctrees === undefined)
	{ return; }

	//var lowestOctreeLegosParsingCount = 0;
	//var maxLowestOctreeLegosParsingCount = 90;
	var geometryDataPath = this.readerWriter.geometryDataPath;
	var projectFolderName;
	var neoBuilding;
	var buildingFolderName;

	// LOD2
	// Check if the lod2lowestOctrees must load and parse data
	var lowestOctree;

	for (var i=0, length = globalVisibleObjControlerOctrees.currentVisibles2.length; i<length; i++) 
	{	
		if (this.fileRequestControler.isFullPlus(extraCount))	{ return; }
		
		lowestOctree = globalVisibleObjControlerOctrees.currentVisibles2[i];
		
		if (lowestOctree.octree_number_name === undefined)
		{ continue; }
		
		if (lowestOctree.lego === undefined) 
		{
			lowestOctree.lego = new Lego();
			lowestOctree.lego.fileLoadState = CODE.fileLoadState.READY;
			lowestOctree.lego.legoKey = lowestOctree.octreeKey + "_lego";
		}
	
		neoBuilding = lowestOctree.neoBuildingOwner;
		if (neoBuilding === undefined)
		{ continue; }
	
		projectFolderName = neoBuilding.projectFolderName;
		buildingFolderName = neoBuilding.buildingFileName;

		// && lowestOctree.neoRefsList_Array.length === 0)
		if (lowestOctree.lego.fileLoadState === CODE.fileLoadState.READY && !this.isCameraMoving) 
		{
			// must load the legoStructure of the lowestOctree.***
			if (!this.fileRequestControler.isFullPlus(extraCount))
			{
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var bricks_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/Bricks";
				var filePathInServer = bricks_folderPath + "/" + subOctreeNumberName + "_Brick";
				this.readerWriter.getOctreeLegoArraybuffer(filePathInServer, lowestOctree, this);
			}
			continue;
		}

		// finally check if there are legoSimpleBuildingTexture.***
		if (lowestOctree.lego.vbo_vicks_container.vboCacheKeysArray[0] && lowestOctree.lego.vbo_vicks_container.vboCacheKeysArray[0].meshTexcoordsCacheKey)
		{
			var headerVersion = neoBuilding.getHeaderVersion();
			if (headerVersion[0] === "v")
			{
				// this is the old version.***
				if (neoBuilding.simpleBuilding3x3Texture === undefined)
				{
					neoBuilding.simpleBuilding3x3Texture = new Texture();
					var buildingFolderName = neoBuilding.buildingFileName;
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/SimpleBuildingTexture3x3.png";
					this.readerWriter.readLegoSimpleBuildingTexture(gl, filePath_inServer, neoBuilding.simpleBuilding3x3Texture, this);
				}
			}
			else 
			{
				// this is the new version.***
				if (neoBuilding.simpleBuilding3x3Texture === undefined)
				{
					neoBuilding.simpleBuilding3x3Texture = new Texture();
					var imageFilaName = neoBuilding.getImageFileNameForLOD(2);
					var filePath_inServer = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/" + imageFilaName;
					this.readerWriter.readLegoSimpleBuildingTexture(gl, filePath_inServer, neoBuilding.simpleBuilding3x3Texture, this);
				}
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

MagoManager.prototype.checkChangesHistoryMovements = function(nodesArray) 
{
	var nodesCount = nodesArray.length;
	var node;
	var rootNode;	
	var projectId;
	var dataKey;
	var moveHistoryMap;
	var colorChangedHistoryMap;
	var objectIndexOrder;
	var neoBuilding;
	var refObject;
	var moveVector;
	var moveVectorRelToBuilding;
	var geoLocdataManager;
	var geoLoc;
	
	// check movement of objects.
	for (var i=0; i<nodesCount; i++)
	{
		node = nodesArray[i];
		rootNode = node.getRoot();
		if (rootNode === undefined)
		{ continue; }
		
		geoLocdataManager = this.getNodeGeoLocDataManager(rootNode);
		geoLoc = geoLocdataManager.getCurrentGeoLocationData();
		projectId = node.data.projectId;
		dataKey = node.data.nodeId;
		
		// objects movement.
		moveHistoryMap = MagoConfig.getMovingHistoryObjects(projectId, dataKey);
		if (moveHistoryMap)
		{
			neoBuilding = node.data.neoBuilding;
			///for (var changeHistory of moveHistoryMap.values()) 
			for (var key in moveHistoryMap)
			{
				var changeHistory = moveHistoryMap[key];
				objectIndexOrder = changeHistory.getObjectIndexOrder();
				refObject = neoBuilding.getReferenceObject(objectIndexOrder);
				if (refObject === undefined)
				{ continue; }
				
				if (refObject.moveVector === undefined)
				{ refObject.moveVector = new Point3D(); }
				
				if (refObject.moveVectorRelToBuilding === undefined)
				{ refObject.moveVectorRelToBuilding = new Point3D(); }
				
				moveVector = changeHistory.getReferenceObjectAditionalMovement();
				moveVectorRelToBuilding = changeHistory.getReferenceObjectAditionalMovementRelToBuilding();
				refObject.moveVectorRelToBuilding.set(moveVectorRelToBuilding.x, moveVectorRelToBuilding.y, moveVectorRelToBuilding.z);
				refObject.moveVector.set(moveVector.x, moveVector.y, moveVector.z);
				
				// now check if the building was rotated.
				// if was rotated then recalculate the move vector.
				refObject.moveVector = geoLoc.tMatrix.rotatePoint3D(refObject.moveVectorRelToBuilding, refObject.moveVector); 
				
				// if was no rotated, then set the moveVector of the changeHistory.
				//refObject.moveVectorRelToBuilding.set(moveVectorRelToBuilding.x, moveVectorRelToBuilding.y, moveVectorRelToBuilding.z);
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */

MagoManager.prototype.checkPropertyFilters = function(nodesArray) 
{
	if (this.propertyFilterSC === undefined)
	{ return; }
	
	var nodesCount = nodesArray.length;
	var node;	
	var projectId;
	var propertyKey = this.propertyFilterSC.propertyKey;
	var propertyValue = this.propertyFilterSC.propertyValue;
	var visible = this.propertyFilterSC.visible;
	
	for (var i=0; i<nodesCount; i++)
	{
		node = nodesArray[i];
		projectId = node.data.projectId;
		if (projectId === this.propertyFilterSC.projectId)
		{
			if (node.data.attributes)
			{
				if (node.data.attributes[propertyKey] !== undefined && node.data.attributes[propertyKey].toString() === propertyValue)
				{
					if (visible === "true")
					{
						// do nothing.
					}
					else
					{
						nodesArray.splice(i, 1);
						i--;
						nodesCount = nodesArray.length;
					}
				}
				else
				{
					if (visible === "true")
					{
						nodesArray.splice(i, 1);
						i--;
						nodesCount = nodesArray.length;
					}
					else 
					{
						// do nothing.
					}
				}
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */

MagoManager.prototype.checkChangesHistoryColors = function(nodesArray) 
{
	var nodesCount = nodesArray.length;
	var node;
	var rootNode;	
	var projectId;
	var dataKey;
	var moveHistoryMap;
	var colorChangedHistoryMap;
	var objectIndexOrder;
	var neoBuilding;
	var refObject;
	
	// check movement of objects.
	for (var i=0; i<nodesCount; i++)
	{
		node = nodesArray[i];
		rootNode = node.getRoot();
		if (rootNode === undefined)
		{ continue; }
		
		projectId = node.data.projectId;
		dataKey = node.data.nodeId;

		colorChangedHistoryMap = MagoConfig.getColorHistorys(projectId, dataKey);
		if (colorChangedHistoryMap)
		{
			neoBuilding = node.data.neoBuilding;
			//for (var changeHistory of colorChangedHistoryMap.values()) 
			for (var key in colorChangedHistoryMap)
			{
				var changeHistory = colorChangedHistoryMap[key];
				if (changeHistory.objectId === null || changeHistory.objectId === undefined || changeHistory.objectId === "" )
				{
					if (changeHistory.property === null || changeHistory.property === undefined || changeHistory.property === "" )
					{
						// change color for all node.
						neoBuilding.isColorChanged = true;
						if (neoBuilding.aditionalColor === undefined)
						{ neoBuilding.aditionalColor = new Color(); }
						
						neoBuilding.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
					}
					else 
					{
						// there are properties.
						var nodesArray = [];
						node.extractNodes(nodesArray);
						var nodesCount = nodesArray.length;
						var aNode;
						for (var i=0; i<nodesCount; i++)
						{
							aNode = nodesArray[i];
							var propertyKey = changeHistory.propertyKey;
							var propertyValue = changeHistory.propertyValue;
							// 1rst, check if this has the same "key" and same "value".
							if (aNode.data.attributes[propertyKey] !== undefined && aNode.data.attributes[propertyKey].toString() === propertyValue)
							{
								neoBuilding.isColorChanged = true;
								if (neoBuilding.aditionalColor === undefined)
								{ neoBuilding.aditionalColor = new Color(); }
								
								neoBuilding.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
							}
						}
					}
				}
				else 
				{
					// change color for an object.
					var objectId = changeHistory.objectId;
					var objectsArray = neoBuilding.getReferenceObjectsArrayByObjectId(objectId);
					if (objectsArray)
					{
						var objectsCount = objectsArray.length;
						for (var j=0; j<objectsCount; j++)
						{
							var object = objectsArray[j];
							if (object.aditionalColor === undefined)
							{ object.aditionalColor = new Color(); }
							
							object.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
						}
					}
				}
			}
		}
	}
	
	var allColorHistoryMap = MagoConfig.getAllColorHistory();
	if (allColorHistoryMap)
	{
		for (var key in allColorHistoryMap) 
		{
			var colorChangedHistoryMap = allColorHistoryMap[key];
			//for (var colorChangedHistoryMap of allColorHistoryMap.values()) 
			//{
			// now check nodes that is no physical.
			for (var key2 in colorChangedHistoryMap) 
			{
				var changeHistoryMap = colorChangedHistoryMap[key2];
				//for (var changeHistoryMap of colorChangedHistoryMap.values()) 
				//{
				for (var key3 in changeHistoryMap) 
				{
					var changeHistory = changeHistoryMap[key3];
					//for (var changeHistory of changeHistoryMap.values()) 
					//{
					var projectId = changeHistory.projectId;
					var nodesMap = this.hierarchyManager.getNodesMap(projectId);
					var aNode = nodesMap[changeHistory.dataKey];
					if (aNode && aNode.data.attributes.isPhysical !== undefined && aNode.data.attributes.isPhysical === false)
					{
						// must check if there are filters.
						if (changeHistory.property === null || changeHistory.property === undefined || changeHistory.property === "" )
						{
							// this is a no physical node, so must check children.
							var nodesArray = [];
							aNode.extractNodes(nodesArray);
							var nodesCount = nodesArray.length;
							for (var i=0; i<nodesCount; i++)
							{
								var aNode2 = nodesArray[i];
								neoBuilding = aNode2.data.neoBuilding;
								if (neoBuilding)
								{
									neoBuilding.isColorChanged = true;
									if (neoBuilding.aditionalColor === undefined)
									{ neoBuilding.aditionalColor = new Color(); }
									
									neoBuilding.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
								}
							}
						}
						else 
						{
							
							var propertyKey = changeHistory.propertyKey;
							var propertyValue = changeHistory.propertyValue;
								
							// this is a no physical node, so must check children.
							var nodesArray = [];
							aNode.extractNodes(nodesArray);
							var nodesCount = nodesArray.length;
							for (var i=0; i<nodesCount; i++)
							{
								var aNode2 = nodesArray[i];
								neoBuilding = aNode2.data.neoBuilding;
								if (neoBuilding)
								{
									if (aNode2.data.attributes[propertyKey] !== undefined && aNode2.data.attributes[propertyKey].toString() === propertyValue)
									{
										neoBuilding.isColorChanged = true;
										if (neoBuilding.aditionalColor === undefined)
										{ neoBuilding.aditionalColor = new Color(); }
										
										neoBuilding.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
									}
								}
							}
						}
					}
				}
			}
		}
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수

 */

MagoManager.prototype.renderInvertedBox = function(gl, cameraPosition, shader, renderTexture, ssao_idx, visibleObjControlerNodes) 
{
	// call this in the end of rendering pipeline.***
	
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

MagoManager.prototype.renderGeometry = function(gl, cameraPosition, shader, renderTexture, ssao_idx, visibleObjControlerNodes) 
{
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	gl.frontFace(gl.CCW);
	gl.depthRange(0.0, 1.0);	
	gl.enable(gl.DEPTH_TEST);
	
	var currentShader;
	var shaderProgram;
	var neoBuilding;
	var node;
	var rootNode;
	var geoLocDataManager;

	renderTexture = false;
	//var lowestOctreeLegosParsingCount = 0;

	if (ssao_idx === 0) 
	{
		gl.disable(gl.BLEND);
		this.depthRenderLowestOctreeAsimetricVersion(gl, ssao_idx, visibleObjControlerNodes);
	}
	if (ssao_idx === 1) 
	{
		// ssao render.************************************************************************************************************
		var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;

		if (nodesLOD0Count > 0)
		{
			// check changesHistory.
			this.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles0);
			this.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles0);
		
			if (this.noiseTexture === undefined) 
			{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }

			currentShader = this.postFxShadersManager.getModelRefShader();
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
			
			// 1) LOD0 & LOD1.*********************************************************************************************************************
			var refTMatrixIdxKey = 0;
			var minSize = 0.0;
			var renderTexture;
			if (this.isLastFrustum)
			{
				this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, ssao_idx, minSize, refTMatrixIdxKey);
			}
			
			if (currentShader)
			{
				if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
				if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
				if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
				if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			}
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		
		// 2) LOD 2.************************************************************************************************************************************
		var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
		if (nodesLOD2Count > 0 || nodesLOD0Count > 0)
		{
			this.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);

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
			gl.uniform1f(currentShader.shininessValue_loc, 40.0);
			gl.uniform3fv(currentShader.specularColor_loc, [0.7, 0.7, 0.7]);
			gl.uniform1f(currentShader.ssaoRadius_loc, this.magoPolicy.getSsaoRadius()*3);  
			gl.uniform1f(currentShader.ambientReflectionCoef_loc, this.magoPolicy.getAmbientReflectionCoef());
			gl.uniform1f(currentShader.diffuseReflectionCoef_loc, this.magoPolicy.getDiffuseReflectionCoef());
			gl.uniform1f(currentShader.specularReflectionCoef_loc, this.magoPolicy.getSpecularReflectionCoef());

			gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
			gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
			
			this.renderer.renderNeoBuildingsLOD2AsimetricVersion(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, ssao_idx);
			this.renderer.renderNeoBuildingsLOD2AsimetricVersion(gl, visibleObjControlerNodes.currentVisibles2, this, currentShader, renderTexture, ssao_idx);
			
			if (currentShader)
			{
				if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
				if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
				if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
				if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			}
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		
		// 3) LOD3, LOD4, LOD5.************************************************************************************************************************************
		var nodesLOD3Count = visibleObjControlerNodes.currentVisibles3.length;
		if (nodesLOD3Count > 0)
		{
			//this.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);

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
			gl.uniform1f(currentShader.shininessValue_loc, 40.0);
			gl.uniform3fv(currentShader.specularColor_loc, [0.7, 0.7, 0.7]);
			gl.uniform1f(currentShader.ssaoRadius_loc, this.magoPolicy.getSsaoRadius()*3);  
			gl.uniform1f(currentShader.ambientReflectionCoef_loc, this.magoPolicy.getAmbientReflectionCoef());
			gl.uniform1f(currentShader.diffuseReflectionCoef_loc, this.magoPolicy.getDiffuseReflectionCoef());
			gl.uniform1f(currentShader.specularReflectionCoef_loc, this.magoPolicy.getSpecularReflectionCoef());

			gl.uniform2fv(currentShader.noiseScale2_loc, [this.depthFboNeo.width/this.noiseTexture.width, this.depthFboNeo.height/this.noiseTexture.height]);
			gl.uniform3fv(currentShader.kernel16_loc, this.kernel);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
			
			this.renderer.renderNeoBuildingsLowLOD(gl, visibleObjControlerNodes.currentVisibles3, this, currentShader, renderTexture, ssao_idx);
			
			if (currentShader)
			{
				if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
				if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
				if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
				if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			}
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, null);
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
			
			// render bbox for neoBuildingSelected. // old.***
			/*
			var selectedNodesArray = [];
			selectedNodesArray.push(this.nodeSelected);
			if (this.colorSC === undefined)
			{ this.colorSC = new Color(); }
			this.colorSC.setRGB(0.8, 1.0, 1.0);
			this.renderBoundingBoxesNodes(gl, selectedNodesArray, this.colorSC); // old.
			*/
			
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

					
					var offsetSize = 4/1000;
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, offsetSize]);
					this.renderer.renderLodBuildingColorSelection(gl, skinLego, this, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, offsetSize]);
					this.renderer.renderLodBuildingColorSelection(gl, skinLego, this, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [offsetSize, -offsetSize]);
					this.renderer.renderLodBuildingColorSelection(gl, skinLego, this, currentShader);
					gl.uniform2fv(currentShader.camSpacePixelTranslation_loc, [-offsetSize, -offsetSize]);
					this.renderer.renderLodBuildingColorSelection(gl, skinLego, this, currentShader);
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
				
			}
			
		}
		
		// 3) now render bboxes.*******************************************************************************************************************
		if (this.magoPolicy.getShowBoundingBox())
		{
			this.renderBoundingBoxesNodes(gl, this.visibleObjControlerNodes.currentVisibles0);
			this.renderBoundingBoxesNodes(gl, this.visibleObjControlerNodes.currentVisibles2);
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

MagoManager.prototype.renderBoundingBoxesNodes = function(gl, nodesArray, color) 
{
	var node;
	var currentShader = this.postFxShadersManager.pFx_shaders_array[12]; // box ssao.***
	var shaderProgram = currentShader.program;
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
	if (color)
	{
		gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, 1.0]); //.***
	}
	else 
	{
		gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.0, 1.0, 1.0]); //.***
	}

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

	var neoBuilding;
	var ssao_idx = 1;
	var nodesCount = nodesArray.length;
	for (var b=0; b<nodesCount; b++)
	{
		node = nodesArray[b];
		neoBuilding = node.data.neoBuilding;

		gl.uniform3fv(currentShader.scale_loc, [neoBuilding.bbox.getXLength(), neoBuilding.bbox.getYLength(), neoBuilding.bbox.getZLength()]); //.***
		var buildingGeoLocation = this.getNodeGeoLocDataManager(node).getCurrentGeoLocationData();
		gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);

		this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
		gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
		//gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		this.renderer.renderTriPolyhedron(gl, this.unitaryBoxSC, this, currentShader, ssao_idx);
	}
	
	if (currentShader)
	{
		if (currentShader.texCoord2_loc !== -1){ gl.disableVertexAttribArray(currentShader.texCoord2_loc); }
		if (currentShader.position3_loc !== -1){ gl.disableVertexAttribArray(currentShader.position3_loc); }
		if (currentShader.normal3_loc !== -1){ gl.disableVertexAttribArray(currentShader.normal3_loc); }
		if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
	}
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, null);
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

MagoManager.prototype.depthRenderLowestOctreeAsimetricVersion = function(gl, ssao_idx, visibleObjControlerNodes) 
{
	// ssao_idx = -1 -> pickingMode.***
	// ssao_idx = 0 -> depth.***
	// ssao_idx = 1 -> ssao.***
	var currentShader;
	var shaderProgram;
	var renderTexture = false;
	
	var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;
	if (nodesLOD0Count > 0)
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
			this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, ssao_idx, minSize, 0, refTMatrixIdxKey);
		}
		
		if (currentShader.position3_loc !== -1)
		{ gl.disableVertexAttribArray(currentShader.position3_loc); }
	}
	
	// 2) LOD 2 .************************************************************************************************************************************
	var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
	if (nodesLOD2Count > 0 || nodesLOD0Count > 0)
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
		
		this.renderer.renderNeoBuildingsLOD2AsimetricVersion(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, ssao_idx);
		this.renderer.renderNeoBuildingsLOD2AsimetricVersion(gl, visibleObjControlerNodes.currentVisibles2, this, currentShader, renderTexture, ssao_idx);

		if (currentShader.position3_loc !== -1)
		{ gl.disableVertexAttribArray(currentShader.position3_loc); }
	}
	
	// 3) LOD3, LOD4, LOD5.*************************************************************************************************************************
	var nodesLOD3Count = visibleObjControlerNodes.currentVisibles3.length;
	if (nodesLOD3Count > 0)
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
		
		this.renderer.renderNeoBuildingsLowLOD(gl, visibleObjControlerNodes.currentVisibles3, this, currentShader, renderTexture, ssao_idx);

		if (currentShader.position3_loc !== -1)
		{ gl.disableVertexAttribArray(currentShader.position3_loc); }
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
					//filePath_scratch = this.readerWriter.getCurrentDataPath() +"/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
					filePath_scratch = this.readerWriter.getCurrentDataPath() + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";

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
					//filePath_scratch = this.readerWriter.getCurrentDataPath() +"/Result_xdo2f4d/" + BR_Project._f4d_rawPathName + ".jpg"; // Old.***
					filePath_scratch = this.readerWriter.getCurrentDataPath() + Constant.RESULT_XDO2F4D + BR_Project._header._global_unique_id + ".jpg";

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
	
	neoBuilding.deleteObjects(gl, vboMemoryManager);
	
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.getNodeIdxSortedByDist = function(nodesArray, startIdx, endIdx, node) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var neoBuilding = node.data.neoBuilding;
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			var aNeoBuilding = nodesArray[i].data.neoBuilding;
			if (neoBuilding.distToCam < aNeoBuilding.distToCam)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleNeoBuilding = nodesArray[middleIdx].data.neoBuilding;
		if (middleNeoBuilding.distToCam > neoBuilding.distToCam)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getNodeIdxSortedByDist(nodesArray, newStartIdx, newEndIdx, node);
	}
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.putNodeToArraySortedByDist = function(nodesArray, node) 
{
	if (nodesArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = nodesArray.length - 1;
		var idx = this.getNodeIdxSortedByDist(nodesArray, startIdx, endIdx, node);
		
		nodesArray.splice(idx, 0, node);
	}
	else 
	{
		nodesArray.push(node);
	}
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.getBuildingIdxSortedByDist = function(buildingArray, startIdx, endIdx, neoBuilding) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;
		//var buildingsCount = buildingArray.length;

		while (!finished && i<=endIdx)
		{
			if (neoBuilding.distToCam < buildingArray[i].distToCam)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{
			return idx;
		}
		else 
		{
			return endIdx+1;
		}
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		if (buildingArray[middleIdx].distToCam > neoBuilding.distToCam)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getBuildingIdxSortedByDist(buildingArray, newStartIdx, newEndIdx, neoBuilding);
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
	
	if (buildingArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = buildingArray.length - 1;
		var idx = this.getBuildingIdxSortedByDist(buildingArray, startIdx, endIdx, neoBuilding);
		
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
MagoManager.prototype.isFirstFrustum = function() 
{
	if (this.numFrustums - this.currentFrustumIdx - 1 === 1)
	{ return true; }
	else
	{ return false; }
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
	var smartTile1 = this.smartTileManager.tilesArray[0]; // America side tile.
	var smartTile2 = this.smartTileManager.tilesArray[1]; // Asia side tile.
	
	if (this.fullyIntersectedLowestTilesArray === undefined)
	{ this.fullyIntersectedLowestTilesArray = []; }

	if (this.partiallyIntersectedLowestTilesArray === undefined)
	{ this.partiallyIntersectedLowestTilesArray = []; }
	
	if (this.lastIntersectedLowestTilesArray === undefined)
	{ this.lastIntersectedLowestTilesArray = []; }

	// save the last frustumCulled lowestTiles to delete if necessary.
	if (this.isFirstFrustum())
	{ this.lastIntersectedLowestTilesArray.length = 0; } // init only if is the 1rst frustum.***
	this.lastIntersectedLowestTilesArray.push.apply(this.lastIntersectedLowestTilesArray, this.fullyIntersectedLowestTilesArray);
	this.lastIntersectedLowestTilesArray.push.apply(this.lastIntersectedLowestTilesArray, this.partiallyIntersectedLowestTilesArray);
	
	// mark all last_tiles as "no visible".
	var lastLowestTilesCount = this.lastIntersectedLowestTilesArray.length;
	var lowestTile;
	for (var i=0; i<lastLowestTilesCount; i++)
	{
		lowestTile = this.lastIntersectedLowestTilesArray[i];
		lowestTile.isVisible = false;
	}
	
	// do frustum culling for Asia_side_tile and America_side_tile.
	this.fullyIntersectedLowestTilesArray.length = 0; // init array.
	this.partiallyIntersectedLowestTilesArray.length = 0; // init array.
	smartTile1.getFrustumIntersectedLowestTiles(frustumVolume, this.fullyIntersectedLowestTilesArray, this.partiallyIntersectedLowestTilesArray);
	smartTile2.getFrustumIntersectedLowestTiles(frustumVolume, this.fullyIntersectedLowestTilesArray, this.partiallyIntersectedLowestTilesArray);
	
	// mark all current_tiles as "visible".
	var lowestTile;
	var currentLowestTilesCount = this.fullyIntersectedLowestTilesArray.length;
	for (var i=0; i<currentLowestTilesCount; i++)
	{
		lowestTile = this.fullyIntersectedLowestTilesArray[i];
		lowestTile.isVisible = true;
	}
	currentLowestTilesCount = this.partiallyIntersectedLowestTilesArray.length;
	for (var i=0; i<currentLowestTilesCount; i++)
	{
		lowestTile = this.partiallyIntersectedLowestTilesArray[i];
		lowestTile.isVisible = true;
	}
	
	// now, delete all tiles that is no visible.
	var lastLowestTilesCount = this.lastIntersectedLowestTilesArray.length;
	var lowestTile;
	for (var i=0; i<lastLowestTilesCount; i++)
	{
		lowestTile = this.lastIntersectedLowestTilesArray[i];
		if (!lowestTile.isVisible && this.isLastFrustum)
		{
			this.processQueue.putNodesArrayToDelete(lowestTile.nodesArray);
			lowestTile.clearNodesArray();
		}
	}
	
	this.visibleObjControlerNodes.currentVisibles0.length = 0;
	this.visibleObjControlerNodes.currentVisibles1.length = 0;
	this.visibleObjControlerNodes.currentVisibles2.length = 0;
	this.visibleObjControlerNodes.currentVisibles3.length = 0;
	
	//if (this.fullyIntersectedLowestTilesArray.length > 0)
	//{ var hola= 0 ; }
	var bDoFrustumCullingToBuildings = false;
	this.tilesFrustumCullingFinished(this.fullyIntersectedLowestTilesArray, cameraPosition, frustumVolume, bDoFrustumCullingToBuildings);
	bDoFrustumCullingToBuildings = true;
	this.tilesFrustumCullingFinished(this.partiallyIntersectedLowestTilesArray, cameraPosition, frustumVolume, bDoFrustumCullingToBuildings);
	
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.testAproxDist3D = function()
{
	// test: AproxDistance:
	var distCalculationTimeAmount = 0;
	var aproxDistCalculationTimeAmount = 0;
	var squaredDistCalculationTimeAmount = 0;
	
	var pointA = new Point3D();
	var pointB = new Point3D();
	
	var difX, difY, difZ;
	
	
	
	var aproxDist, realDist, squaredDist, startTime, endTime;
	startTime = new Date().getTime();
	for (var k=0; k<1000000; k++)
	{
		pointA.set(Math.random()*1000.0, Math.random()*1000.0, Math.random()*1000.0);
		pointB.set(Math.random()*1000.0, Math.random()*1000.0, Math.random()*1000.0);
		squaredDist = pointA.squareDistToPoint(pointB);
		//difX = pointA.x - pointB.x;
		//difY = pointA.y - pointB.y;
		//difZ = pointA.z - pointB.z;
		//realDist = difX*difX + difY*difY + difZ*difZ;
	}
	endTime = new Date().getTime();
	squaredDistCalculationTimeAmount += (endTime - startTime)/1000;
	
	
	startTime = new Date().getTime();
	for (var k=0; k<1000000; k++)
	{
		pointA.set(Math.random()*1000.0, Math.random()*1000.0, Math.random()*1000.0);
		pointB.set(Math.random()*1000.0, Math.random()*1000.0, Math.random()*1000.0);
		//aproxDist = this.calculateAproxDist3D(pointA, pointB);
		aproxDist = pointA.aproxDistTo(pointB, this.sqrtTable);
		//aproxDist = this.managerUtil.calculateAproxDist3D(pointA, pointB);
		//aproxDist = ManagerUtils.calculateAproxDist3D(pointA, pointB);
	}
	endTime = new Date().getTime();
	aproxDistCalculationTimeAmount += (endTime - startTime)/1000;
	
	
	startTime = new Date().getTime();
	for (var k=0; k<1000000; k++)
	{
		pointA.set(Math.random()*1000.0, Math.random()*1000.0, Math.random()*1000.0);
		pointB.set(Math.random()*1000.0, Math.random()*1000.0, Math.random()*1000.0);
		realDist = pointA.distToPoint(pointB);
		//difX = pointA.x - pointB.x;
		//difY = pointA.y - pointB.y;
		//difZ = pointA.z - pointB.z;
		//realDist = Math.sqrt(difX*difX + difY*difY + difZ*difZ );
	}
	endTime = new Date().getTime();
	distCalculationTimeAmount += (endTime - startTime)/1000;
	
	// test. check the calculation time difference.
	distCalculationTimeAmount;
	aproxDistCalculationTimeAmount;
	squaredDistCalculationTimeAmount;
	
	var ratio = aproxDistCalculationTimeAmount/distCalculationTimeAmount *100;
	var error = (aproxDist - realDist)/realDist * 100;
	
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.calculateAproxDist3D = function(pointA, pointB)
{
	// test function.
	var difX = Math.abs(pointA.x - pointB.x);
	var difY = Math.abs(pointA.y - pointB.y);
	var difZ = Math.abs(pointA.z - pointB.z);

	
	// find the big value.
	var maxValue, value1, value2;
	var value1Idx, value2Idx;
	var aproxDist;
	var tableValuesCount = 10;

	if (difX > difY)
	{
		if (difX > difZ)
		{
			maxValue = difX;
			value1 = difY/maxValue;
			//value1Idx = Math.floor(value1*100);
			value1Idx = ~~(value1*tableValuesCount);
			var middleDist = maxValue * this.sqrtTable[value1Idx];
			value2 = difZ/middleDist;
			//value2Idx = Math.floor(value2*100);
			value2Idx = ~~(value2*tableValuesCount);
			return (middleDist * this.sqrtTable[value2Idx]);
		}
		else 
		{
			maxValue = difZ;
			value1 = difX/maxValue;
			//value1Idx = Math.floor(value1*100);
			value1Idx = ~~(value1*tableValuesCount);
			var middleDist = maxValue * this.sqrtTable[value1Idx];
			value2 = difY/middleDist;
			//value2Idx = Math.floor(value2*100);
			value2Idx = ~~(value2*tableValuesCount);
			return (middleDist * this.sqrtTable[value2Idx]);
		}
	}
	else 
	{
		if (difY > difZ)
		{
			maxValue = difY;
			value1 = difX/maxValue;
			//value1Idx = Math.floor(value1*100);
			value1Idx = ~~(value1*tableValuesCount);
			var middleDist = maxValue * this.sqrtTable[value1Idx];
			value2 = difZ/middleDist;
			//value2Idx = Math.floor(value2*100);
			value2Idx = ~~(value2*tableValuesCount);
			return (middleDist * this.sqrtTable[value2Idx]);
		}
		else 
		{
			maxValue = difZ;
			value1 = difX/maxValue;
			//value1Idx = Math.floor(value1*100);
			value1Idx = ~~(value1*tableValuesCount);
			var middleDist = maxValue * this.sqrtTable[value1Idx];
			value2 = difY/middleDist;
			//value2Idx = Math.floor(value2*100);
			value2Idx = ~~(value2*tableValuesCount);
			return (middleDist * this.sqrtTable[value2Idx]);
		}
	}
	
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.createBuildingsByBuildingSeedsOnLowestTile = function(lowestTile) 
{
	// create the buildings by buildingSeeds.
	var node;
	var neoBuilding;
	var nodeBbox;
	var buildingSeed;
	var startIndex = 0;
	
	// if exist nodesArray (there are buildings) and add a nodeSeed, we must make nodes of the added nodeSeeds.***
	if (lowestTile.nodesArray)
	{ startIndex = lowestTile.nodesArray.length; }
	
	var nodeSeedsCount = lowestTile.nodeSeedsArray.length;
	for (var j=startIndex; j<nodeSeedsCount; j++)
	{
		node = lowestTile.nodeSeedsArray[j];
		neoBuilding = new NeoBuilding();
		neoBuilding.nodeOwner = node;
		node.data.neoBuilding = neoBuilding;
		nodeBbox = new BoundingBox();
		node.data.bbox = nodeBbox;
		buildingSeed = node.data.buildingSeed;
	
		if (lowestTile.nodesArray === undefined)
		{ lowestTile.nodesArray = []; }
		
		lowestTile.nodesArray.push(node);
		
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
		neoBuilding.metaData.bbox.copyFrom(buildingSeed.bBox);
		nodeBbox.copyFrom(buildingSeed.bBox); // initially copy from building.
		if (neoBuilding.bbox === undefined)
		{ neoBuilding.bbox = new BoundingBox(); }
		neoBuilding.bbox.copyFrom(buildingSeed.bBox);
		neoBuilding.metaData.heading = buildingSeed.rotationsDegree.z;
		neoBuilding.metaData.pitch = buildingSeed.rotationsDegree.x;
		neoBuilding.metaData.roll = buildingSeed.rotationsDegree.y;
		//if (node.data.projectFolderName === undefined)
		//{ var hola = 0; }
		neoBuilding.projectFolderName = node.data.projectFolderName;
	}
};
/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.tilesFrustumCullingFinished = function(intersectedLowestTilesArray, cameraPosition, frustumVolume, doFrustumCullingToBuildings) 
{
	var tilesCount = intersectedLowestTilesArray.length;
	
	if (tilesCount === 0)
	{ return; }
	
	var distToCamera;
	
	var lod0_minDist = this.magoPolicy.getLod1DistInMeters();
	var lod1_minDist = 1;
	var lod2_minDist = this.magoPolicy.getLod2DistInMeters();
	var lod5_minDist = this.magoPolicy.getLod5DistInMeters();
	var lod3_minDist;

	var maxNumberOfCalculatingPositions = 100;
	var currentCalculatingPositionsCount = 0;
	
	var lowestTile;
	var buildingSeedsCount;
	var buildingSeed;
	var neoBuilding;
	var node;
	var nodeRoot;
	var nodeBbox;
	var geoLoc;
	var geoLocDataManager;
	var realBuildingPos;
	var longitude, latitude, altitude, heading, pitch, roll;

	for (var i=0; i<tilesCount; i++)
	{
		lowestTile = intersectedLowestTilesArray[i];
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
	
		distToCamera = cameraPosition.distToSphere(lowestTile.sphereExtent);
		if (distToCamera > lod5_minDist)
		{ continue; }

		if (lowestTile.nodesArray && lowestTile.nodesArray.length > 0)
		{
			// the neoBuildings is made.
			var nodesCount = lowestTile.nodesArray.length;
			for (var j=0; j<nodesCount; j++)
			{
				// determine LOD for each building.
				node = lowestTile.nodesArray[j];
				nodeRoot = node.getRoot();
				// now, create a geoLocDataManager for node if no exist.
				if (nodeRoot.data.geoLocDataManager === undefined)
				{ nodeRoot.data.geoLocDataManager = new GeoLocationDataManager(); }
				geoLocDataManager = nodeRoot.data.geoLocDataManager;
				geoLoc = geoLocDataManager.getCurrentGeoLocationData();
					
				neoBuilding = node.data.neoBuilding;
				if (geoLoc === undefined || geoLoc.pivotPoint === undefined)
				{ 
					if (neoBuilding.metaData.geographicCoord === undefined)
					{
						neoBuilding.metaData.geographicCoord = new GeographicCoord();
			
						var buildingSeed = lowestTile.getBuildingSeedById(undefined, neoBuilding.buildingId) ;
						if (buildingSeed)
						{
							neoBuilding.metaData.geographicCoord.setLonLatAlt(buildingSeed.geographicCoord.longitude, buildingSeed.geographicCoord.latitude, buildingSeed.geographicCoord.altitude);
							neoBuilding.metaData.heading = buildingSeed.rotationsDegree.z;
							neoBuilding.metaData.pitch = buildingSeed.rotationsDegree.x;
							neoBuilding.metaData.roll = buildingSeed.rotationsDegree.y;
						}
					}
			
					geoLoc = geoLocDataManager.newGeoLocationData("deploymentLoc"); 
					longitude = neoBuilding.metaData.geographicCoord.longitude;
					latitude = neoBuilding.metaData.geographicCoord.latitude;
					altitude = neoBuilding.metaData.geographicCoord.altitude;
					heading = neoBuilding.metaData.heading;
					pitch = neoBuilding.metaData.pitch;
					roll = neoBuilding.metaData.roll;
					ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, geoLoc, this);
					this.pointSC = neoBuilding.bbox.getCenterPoint(this.pointSC);
					
					if (neoBuilding.buildingId === "ctships")
					{ ; }
					
					// test.
					//***********************************************************************************************************
					if (node.data.attributes.centerOfBBoxAsOrigen !== undefined)
					{
						if (node.data.attributes.centerOfBBoxAsOrigen === true)
						{
							var rootNode = node.getRoot();
							if (rootNode)
							{
								// now, calculate the root center of bbox.
								this.pointSC = rootNode.data.bbox.getCenterPoint(this.pointSC);
								ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
							}
						}
					}
					else 
					{
						var rootNode = node.getRoot();
						if (rootNode)
						{
							// now, calculate the root center of bbox.
							this.pointSC = rootNode.data.bbox.getCenterPoint(this.pointSC);
							ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
						}
					}
					//------------------------------------------------------------------------------------------------------------
					continue;
					
				}
				geoLoc = geoLocDataManager.getCurrentGeoLocationData();
				realBuildingPos = node.getBBoxCenterPositionWorldCoord(geoLoc);
				
				if (neoBuilding.buildingId === "ctships")
				{
					lod0_minDist = 32;
					lod1_minDist = 1;
					lod2_minDist = 316000;
					lod3_minDist = lod2_minDist*10;
				}
			
				this.radiusAprox_aux = neoBuilding.bbox.getRadiusAprox();
				if (this.boundingSphere_Aux === undefined)
				{ this.boundingSphere_Aux = new Sphere(); }
				
				this.boundingSphere_Aux.setCenterPoint(realBuildingPos.x, realBuildingPos.y, realBuildingPos.z);
				this.boundingSphere_Aux.setRadius(this.radiusAprox_aux);
					
				distToCamera = cameraPosition.distToSphere(this.boundingSphere_Aux);
				//}
				neoBuilding.distToCam = distToCamera;
			
				if (distToCamera > this.magoPolicy.getFrustumFarDistance())
				{ continue; }
				
				// If necessary do frustum culling.*************************************************************************
				if (doFrustumCullingToBuildings)
				{
					var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
					// intersect with Frustum
					if (frustumCull === Constant.INTERSECTION_OUTSIDE) 
					{	
						continue;
					}
				}
				//-------------------------------------------------------------------------------------------
				if (distToCamera < lod0_minDist) 
				{
					this.putNodeToArraySortedByDist(this.visibleObjControlerNodes.currentVisibles0, node);
				}
				else if (distToCamera < lod1_minDist) 
				{
					this.putNodeToArraySortedByDist(this.visibleObjControlerNodes.currentVisibles1, node);
				}
				else if (distToCamera < lod2_minDist) 
				{
					this.putNodeToArraySortedByDist(this.visibleObjControlerNodes.currentVisibles2, node);
				}
				else if (distToCamera < lod5_minDist) 
				{
					this.putNodeToArraySortedByDist(this.visibleObjControlerNodes.currentVisibles3, node);
				}
			}
			
			if (lowestTile.nodesArray.length !== lowestTile.nodeSeedsArray.length)
			{
				// create the buildings by buildingSeeds.
				this.createBuildingsByBuildingSeedsOnLowestTile(lowestTile);
			}
		}
		else
		{
			// create the buildings by buildingSeeds.
			this.createBuildingsByBuildingSeedsOnLowestTile(lowestTile);
		}
	}
};

/**
 * dataKey 이용해서 data 검색
 * @param apiName api 이름
 * @param projectId project id
 * @param dataKey
 */
MagoManager.prototype.flyTo = function(longitude, latitude, altitude, duration) 
{
	if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) 
	{
		this.scene.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(parseFloat(longitude),
				parseFloat(latitude),
				parseFloat(altitude) + 10),
			duration: parseInt(duration)
		});
	}
	else 
	{
		this.wwd.goToAnimator.travelTime = duration * 1000;
		this.wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(altitude) + 50));
	}		

};

/**
 * dataKey 이용해서 data 검색
 * @param apiName api 이름
 * @param projectId project id
 * @param dataKey
 */
MagoManager.prototype.flyToBuilding = function(apiName, projectId, dataKey) 
{
	var node = this.hierarchyManager.getNodeByDataName(projectId, "nodeId", dataKey);
	if (node === undefined)
	{ 
		apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
		return; 
	}
	
	var nodeRoot = node.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	
	if (geoLocDataManager === undefined)
	{ return; }

	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	var realBuildingPos = node.getBBoxCenterPositionWorldCoord(geoLoc);

	if (realBuildingPos === undefined)
	{ return; }

	//this.radiusAprox_aux = (nodeRoot.data.bbox.maxX - nodeRoot.data.bbox.minX) * 1.2/2.0;
	this.radiusAprox_aux = nodeRoot.data.bbox.getRadiusAprox();

	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }
	
	this.boundingSphere_Aux.radius = this.radiusAprox_aux;

	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
		//var viewer = this.scene.viewer;
		var seconds = 3;
		this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, seconds);
	}
	else if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		var geographicCoord = buildingSeed.geographicCoordOfBBox;
		this.wwd.goToAnimator.travelTime = 3000;
		this.wwd.goTo(new WorldWind.Position(geographicCoord.latitude, geographicCoord.longitude, geographicCoord.altitude + 1000));
	}
};


/**
 * 어떤 일을 하고 있습니까?
 */
MagoManager.prototype.getNeoBuildingById = function(buildingType, buildingId) 
{
	var resultNeoBuilding = this.smartTileManager.getNeoBuildingById(buildingType, buildingId);
	return resultNeoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 */
MagoManager.prototype.getBuildingSeedById = function(buildingType, buildingId) 
{
	var resultNeoBuildingSeed = this.smartTileManager.getBuildingSeedById(buildingType, buildingId);
	return resultNeoBuildingSeed;
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
				filePath_scratch = this.readerWriter.getCurrentDataPath() + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";
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
				filePath_scratch = this.readerWriter.getCurrentDataPath() + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";
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
				filePath_scratch = this.readerWriter.getCurrentDataPath() + Constant.RESULT_XDO2F4D_TERRAINTILES + tileNumberNameString + ".til";
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
MagoManager.prototype.doFrustumCullingClouds = function(frustumVolume, visibleBuildings_array)
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

MagoManager.prototype.displayLocationAndRotation = function(neoBuilding) 
{
	//var node = this.hierarchyManager.getNodeByDataName(projectId, dataName, dataNameValue); // original.***
	var node = neoBuilding.nodeOwner;
	var geoLocDatamanager = this.getNodeGeoLocDataManager(node);
	if (geoLocDatamanager === undefined)
	{ return; }
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	var latitude = geoLocationData.geographicCoord.latitude;
	var longitude = geoLocationData.geographicCoord.longitude;
	var altitude = geoLocationData.geographicCoord.altitude;
	var heading = geoLocationData.heading;
	var pitch = geoLocationData.pitch;
	var roll = geoLocationData.roll;
	var dividedName = neoBuilding.buildingId.split("_");
};

/**
 * 변환 행렬
 */
MagoManager.prototype.selectedObjectNotice = function(neoBuilding) 
{
	var node = neoBuilding.nodeOwner;
	var geoLocDatamanager = this.getNodeGeoLocDataManager(node);
	if (geoLocDatamanager === undefined)
	{ return; }
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	var dataKey = node.data.nodeId;

	if (MagoConfig.getPolicy().geo_callback_enable === "true") 
	{
		//if (this.objMarkerSC === undefined) { return; }
		var objectId = null;
		if (this.objectSelected !== undefined) { objectId = this.objectSelected.objectId; }
		
		// click object 정보를 표시
		if (this.magoPolicy.getObjectInfoViewEnable()) 
		{
			selectedObjectCallback(		MagoConfig.getPolicy().geo_callback_selectedobject,
				dataKey,
				objectId,
				geoLocationData.geographicCoord.latitude,
				geoLocationData.geographicCoord.longitude,
				geoLocationData.geographicCoord.altitude,
				geoLocationData.heading,
				geoLocationData.pitch,
				geoLocationData.roll);
		}
			
		// 이슈 등록 창 오픈
		if (this.magoPolicy.getIssueInsertEnable()) 
		{
			if (this.objMarkerSC === undefined) { return; }
			
			insertIssueCallback(	MagoConfig.getPolicy().geo_callback_insertissue,
				dataKey,
				objectId,
				geoLocationData.geographicCoord.latitude,
				geoLocationData.geographicCoord.longitude,
				(parseFloat(geoLocationData.geographicCoord.altitude)));
		}
	}
};

/**
 * 변환 행렬
 */
MagoManager.prototype.changeLocationAndRotation = function(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll) 
{
	var nodesMap = this.hierarchyManager.getNodesMap(projectId);
	if (nodesMap)
	{
		var node = nodesMap[dataKey];
		if (node === undefined)
		{ return; }
		this.changeLocationAndRotationNode(node, latitude, longitude, elevation, heading, pitch, roll);
	}
};

/**
 * 변환 행렬
 */
MagoManager.prototype.changeLocationAndRotationNode = function(node, latitude, longitude, elevation, heading, pitch, roll) 
{
	if (node === undefined)
	{ return; }

	// 1rst, find the rootNode.
	var nodeRoot;
	//nodeRoot = node.getRoot(); // original.***
	nodeRoot = node.getClosestParentWithData("geoLocDataManager");
	
	// now, extract all buildings of the nodeRoot.
	var nodesArray = [];
	nodeRoot.extractNodesByDataName(nodesArray, "neoBuilding");
	
	var aNode;
	var nodesCount = nodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		aNode = nodesArray[i];
		var geoLocDatamanager = this.getNodeGeoLocDataManager(aNode);
		var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
		geoLocationData = ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, this);
		if (geoLocationData === undefined)
		{ continue; }

		// now, must change the keyMatrix of the references of the octrees of all buildings of this node.***
		var neoBuilding = aNode.data.neoBuilding;
		if (neoBuilding.octree)
		{
			neoBuilding.octree.multiplyKeyTransformMatrix(0, geoLocationData.rotMatrix);
		}
		neoBuilding.calculateBBoxCenterPositionWorldCoord(geoLocationData);
		nodeRoot.bboxAbsoluteCenterPos = undefined; // provisional.***
		nodeRoot.calculateBBoxCenterPositionWorldCoord(geoLocationData); // provisional.***
		
		aNode.bboxAbsoluteCenterPos = undefined; // provisional.***
		aNode.calculateBBoxCenterPositionWorldCoord(geoLocationData); // provisional.***
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.getObjectIndexFile = function(projectId, projectDataFolder) 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}
	
	this.buildingSeedList = new BuildingSeedList();
	var fileName;
	var geometrySubDataPath = projectDataFolder;
	fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + MagoConfig.getPolicy().content_cache_version;
	this.readerWriter.getObjectIndexFileForSmartTile(fileName, this, this.buildingSeedList, projectId);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.getObjectIndexFile_xxxx = function() 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = MagoConfig.getPolicy();
	}

	this.buildingSeedList = new BuildingSeedList();
	this.readerWriter.getObjectIndexFileForSmartTile(
		this.readerWriter.getCurrentDataPath() + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + MagoConfig.getPolicy().content_cache_version, this, this.buildingSeedList);
		
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.makeNode = function(jasonObject, resultPhysicalNodesArray, buildingSeedMap, projectFolderName, projectId) 
{
	var attributes = undefined;
	var children = undefined;
	var data_group_id = undefined;
	var data_group_name = undefined;
	var data_id = undefined;
	var data_key = undefined;
	var data_name = undefined;
	var heading = undefined;
	var height = undefined;
	var latitude = undefined;
	var longitude = undefined;
	var pitch = undefined;
	var roll = undefined;
	
	if (jasonObject !== undefined)
	{
		attributes = jasonObject.attributes;
		children = jasonObject.children;
		data_group_id = jasonObject.data_group_id;
		data_group_name = jasonObject.data_group_name;
		data_id = jasonObject.data_id;
		data_key = jasonObject.data_key;
		data_name = jasonObject.data_name;
		heading = jasonObject.heading;
		height = jasonObject.height;
		latitude = jasonObject.latitude;
		longitude = jasonObject.longitude;
		pitch = jasonObject.pitch;
		roll = jasonObject.roll;
	}
	
	// now make the node.
	var buildingId;
	var buildingSeed;
	var node;
	var bbox;
	var childJason;
	var childNode;
	var childrenCount;
	if (attributes !== undefined)
	{
		buildingId = data_key;
		node = this.hierarchyManager.newNode(buildingId, projectId);
		// set main data of the node.
		node.data.projectFolderName = projectFolderName;
		node.data.projectId = projectId;
		node.data.data_name = data_name;
		node.data.attributes = attributes;
		
		if (attributes.isPhysical)
		{
			// find the buildingSeed.
			buildingSeed = buildingSeedMap[buildingId];
			if (buildingSeed)
			{
				node.data.buildingSeed = buildingSeed;
				resultPhysicalNodesArray.push(node);
			}
		}

		if (longitude && latitude)
		{
			// this is root node.
			if (height === undefined)
			{ height = 0; }
			
			node.data.geographicCoord = new GeographicCoord();
			node.data.geographicCoord.setLonLatAlt(longitude, latitude, height);
			
			if (node.data.rotationsDegree === undefined)
			{ node.data.rotationsDegree = new Point3D(); }
			node.data.rotationsDegree.set(pitch, roll, heading);
			
			if (buildingSeed !== undefined)
			{
				if (buildingSeed.geographicCoord === undefined)
				{ buildingSeed.geographicCoord = new GeographicCoord(); }
			
				if (buildingSeed.rotationsDegree === undefined)
				{ buildingSeed.rotationsDegree = new Point3D(); }
		
				buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, height);
				buildingSeed.rotationsDegree.set(pitch, roll, heading);
				
				// now calculate the geographic coord of the center of the bbox.
				if (buildingSeed.geographicCoordOfBBox === undefined) 
				{ buildingSeed.geographicCoordOfBBox = new GeographicCoord(); }
			
				// calculate the transformation matrix at (longitude, latitude, height).
				var worldCoordPosition = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, height, worldCoordPosition, this);
				var tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, heading, pitch, roll, undefined, tMatrix, this);
				
				// now calculate the geographicCoord of the center of the bBox.
				var bboxCenterPoint = buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
				var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
				buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, buildingSeed.geographicCoordOfBBox, this); // original.
			}
		}
		
		bbox = new BoundingBox();
		node.data.bbox = bbox;

		if (children !== undefined)
		{
			childrenCount = children.length;
			for (var i=0; i<childrenCount; i++)
			{
				childJason = children[i];
				childNode = this.makeNode(childJason, resultPhysicalNodesArray, buildingSeedMap, projectFolderName, projectId);
				
				// if childNode has "geographicCoord" then the childNode is in reality a root.
				if (childNode.data.geographicCoord === undefined)
				{
					node.addChildren(childNode);
				}
			}
		}
		else 
		{
		    // there are no children.
			if (node.data.buildingSeed)
			{ node.data.bbox.copyFrom(node.data.buildingSeed.bBox); }
		}
	}
	return node;
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.calculateBoundingBoxesNodes = function() 
{
	var node;
	var nodeRoot;
	var buildingSeed;
	var longitude, latitude, height;
	var heading, pitch, roll;
	
	// 1rst, calculate boundingBoxes of buildingSeeds of nodes.
	var nodesCount = this.hierarchyManager.nodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = this.hierarchyManager.nodesArray[i];
		buildingSeed = node.data.buildingSeed;
		if (buildingSeed)
		{
			//nodeRoot = node.getRoot(); // old.***
			nodeRoot = node.getClosestParentWithData("geographicCoord");
			
			longitude = nodeRoot.data.geographicCoord.longitude; 
			latitude = nodeRoot.data.geographicCoord.latitude; 
			height = nodeRoot.data.geographicCoord.altitude;
			
			heading = nodeRoot.data.rotationsDegree.z;
			pitch = nodeRoot.data.rotationsDegree.x;
			roll = nodeRoot.data.rotationsDegree.y;
			
			//node.data.geographicCoord = nodeRoot.data.geographicCoord;
			if (buildingSeed.geographicCoord === undefined)
			{ buildingSeed.geographicCoord = new GeographicCoord(); }
		
			if (buildingSeed.rotationsDegree === undefined)
			{ buildingSeed.rotationsDegree = new Point3D(); }

			buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, height);
			buildingSeed.rotationsDegree.set(pitch, roll, heading);
			
			// now calculate the geographic coord of the center of the bbox.
			if (buildingSeed.geographicCoordOfBBox === undefined) 
			{ buildingSeed.geographicCoordOfBBox = new GeographicCoord(); }
		
			// calculate the transformation matrix at (longitude, latitude, height).
			var worldCoordPosition = ManagerUtils.geographicCoordToWorldPoint(longitude, latitude, height, worldCoordPosition, this);
			var tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, heading, pitch, roll, undefined, tMatrix, this);
			
			// now calculate the geographicCoord of the center of the bBox.
			var bboxCenterPoint = buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
			var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
			buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, buildingSeed.geographicCoordOfBBox, this); // original.
		}
	}
	
	// now, must calculate the bbox of the root nodes.
	var rootNodesArray = [];
	var nodesArray = [];
	this.hierarchyManager.getRootNodes(rootNodesArray); // original.***
	var bboxStarted = false;
	
	var rootNodesCount = rootNodesArray.length;
	for (var i=0; i<rootNodesCount; i++)
	{
		nodeRoot = rootNodesArray[i];
		nodesArray.length = 0; // init.***
		nodeRoot.extractNodesByDataName(nodesArray, "buildingSeed");
		// now, take nodes that is "isMain" = true.
		bboxStarted = false;
		nodesCount =  nodesArray.length;
		for (var j=0; j<nodesCount; j++)
		{
			node = nodesArray[j];
			if (node.data.attributes && node.data.attributes.isMain)
			{
				buildingSeed = node.data.buildingSeed;
				if (buildingSeed)
				{
					if (bboxStarted === false)
					{
						nodeRoot.data.bbox.copyFrom(buildingSeed.bBox);
						bboxStarted = true;
					}
					else 
					{
						nodeRoot.data.bbox.addBox(buildingSeed.bBox);
					}
				}
			}
		}
	}
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 */
MagoManager.prototype.makeSmartTile = function(buildingSeedList, projectId) 
{
	//var realTimeLocBlocksList = MagoConfig.getData().alldata; // original.***
	// "projectId" = json file name.
	var realTimeLocBlocksList = MagoConfig.getData(CODE.PROJECT_ID_PREFIX + projectId);
	var buildingSeedsCount;
	var buildingSeed;
	var buildingId;
	var newLocation;

	// now, read all hierarchyJason and make the hierarchy tree.
	var physicalNodesArray = []; // put here the nodes that has geometry data.
	// make a buildingSeedMap.
	var buildingSeedMap = {};
	var buildingSeedsCount = buildingSeedList.buildingSeedArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		buildingSeed = buildingSeedList.buildingSeedArray[i];
		buildingId = buildingSeed.buildingId;
		
		buildingSeedMap[buildingId] = buildingSeed;
	}
	var projectFolderName = realTimeLocBlocksList.data_key;
	this.makeNode(realTimeLocBlocksList, physicalNodesArray, buildingSeedMap, projectFolderName, projectId);
	this.calculateBoundingBoxesNodes();
	
	// now, make smartTiles.
	// there are 2 general smartTiles: AsiaSide & AmericaSide.
	var smartTilesCount = this.smartTileManager.tilesArray.length; // In this point, "smartTilesCount" = 2 always.
	for (var a=0; a<smartTilesCount; a++)
	{
		var smartTile = this.smartTileManager.tilesArray[a];
		if (smartTile.nodeSeedsArray === undefined)
		{ smartTile.nodeSeedsArray = []; }
		
		smartTile.nodeSeedsArray = physicalNodesArray;
		smartTile.makeTreeByDepth(17, this); // depth = 17.
	}
	this.buildingSeedList.buildingSeedArray.length = 0; // init.

};

MagoManager.prototype.getNeoBuildingByTypeId = function(buildingType, buildingId)
{
	return this.smartTileManager.getNeoBuildingById(buildingType, buildingId);
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
	else if (apiName === "searchData") 
	{
		return this.flyToBuilding(apiName, api.getProjectId(), api.getDataKey());
	}
	else if (apiName === "changeColor") 
	{
		ColorAPI.changeColor(api, this);
	}
	else if (apiName === "show") 
	{
		this.magoPolicy.setHideBuildings.length = 0;
	}
	else if (apiName === "hide") 
	{
		this.magoPolicy.setHideBuildings(api.gethideBuilds());
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
		LocationAndRotationAPI.changeLocationAndRotation(api, this);
	}
	else if (apiName === "changeObjectMove") 
	{
		this.magoPolicy.setObjectMoveMode(api.getObjectMoveMode());
	}
	else if (apiName === "saveObjectMove") 
	{
	//		var changeHistory = new ChangeHistory();
	//		changeHistory.setObjectMoveMode(api.getObjectMoveMode());
	//		MagoConfig.saveMovingHistory(api.getProjectId(), api.getDataKey(), api.getObjectIndexOrder(), changeHistory);
	}
	else if (apiName === "deleteAllObjectMove") 
	{
		MagoConfig.clearMovingHistory();
	}
	else if (apiName === "deleteAllChangeColor") 
	{
		MagoConfig.clearColorHistory();
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
	else if (apiName === "changeOcclusionCulling") 
	{
		// OcclusionCulling 적용 유무
		this.magoPolicy.setOcclusionCullingEnable(api.getOcclusionCullingEnable());
		var neoBuilding = this.selectionCandidates.currentBuildingSelected;
		if (neoBuilding)
		{ neoBuilding.setRenderSettingApplyOcclusionCulling(this.magoPolicy.getOcclusionCullingEnable()); }
		// dataKey 는 api.getDataKey();
	}
	else if (apiName === "drawInsertIssueImage") 
	{
		DrawAPI.drawInsertIssueImage(api, this);
	}
	else if (apiName === "changeInsertIssueState")
	{
		this.sceneState.insertIssueState = 0;
	}
	else if (apiName === "changeLod")
	{
		LodAPI.changeLod(api, this);
	}
	else if (apiName === "changeLighting")
	{
		this.magoPolicy.setAmbientReflectionCoef(api.getAmbientReflectionCoef());
		this.magoPolicy.setDiffuseReflectionCoef(api.getDiffuseReflectionCoef());
		this.magoPolicy.setSpecularReflectionCoef(api.getSpecularReflectionCoef());
		this.magoPolicy.setSpecularColor(api.getSpecularColor());
	}
	else if (apiName === "changeSsaoRadius")
	{
		this.magoPolicy.setSsaoRadius(api.getSsaoRadius());
	}	
	else if (apiName === "changeFPVMode")
	{
		if (api.getFPVMode())
		{
			if (this.cameraFPV._camera !== undefined)	{ return; }

			this.cameraFPV.init();

			if (this.configInformation.geo_view_library === Constant.WORLDWIND)
			{
				;
			}
			else if (this.configInformation.geo_view_library === Constant.CESIUM)
			{
				var scratchLookAtMatrix4 = new Cesium.Matrix4();
				var scratchFlyToBoundingSphereCart4 = new Cesium.Cartesian4();
				var camera = this.scene._camera;

				this.cameraFPV._camera = camera;
				this.cameraFPV._cameraBAK = Cesium.Camera.clone(camera, this.cameraFPV._cameraBAK);
	
				var position = new Cesium.Cartesian3();
				var direction = new Cesium.Cartesian3();
				var up = new Cesium.Cartesian3();
	
				var cameraCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(camera.position);
				cameraCartographic.height = this.scene.globe.getHeight(cameraCartographic) + 1.5;
	
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
		}
		else 
		{
			if (this.cameraFPV._cameraBAK === undefined)	{ return; }
			if (this.configInformation.geo_view_library === Constant.WORLDWIND)
			{
				;
			}
			else if (this.configInformation.geo_view_library === Constant.CESIUM)
			{
				this.scene._camera = Cesium.Camera.clone(this.cameraFPV._cameraBAK, this.scene._camera);
			}
			this.cameraFPV.release();
		}
	}
	else if (apiName === "changePropertyRendering") 
	{
		var visible = api.getShowShadow();
		var projectId = api.getProjectId();
		var property = api.getProperty();
		var splittedWords = property.split("=");
		var propertyKey = splittedWords[0];
		var propertyValue = splittedWords[1];
		
		if (this.propertyFilterSC === undefined)
		{ this.propertyFilterSC = {}; }
		
		this.propertyFilterSC.visible = visible;
		this.propertyFilterSC.projectId = projectId;
		this.propertyFilterSC.propertyKey = propertyKey;
		this.propertyFilterSC.propertyValue = propertyValue;

	}	
	else if (apiName === "drawAppendData")
	{
		DrawAPI.drawAppendData(api, this);
	}
	else if (apiName === "drawDeleteData")
	{
		this.deleteAll();
	}
	else if (apiName === "clearAllData")
	{
		this.deleteAll();
	}
    else if (apiName === "getDataInfoByDataKey")
    {
		var projectId = api.getProjectId(); // for example : 3ds, collada, ifc, etc.***
        var dataKey = api.getDataKey();
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		
		if(node === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var dataName = node.data["data_name"];
		var geoLocDataManager = node.data["geoLocDataManager"];
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		var latitude = geoLocdata.geographicCoord.latitude;
		var longitude = geoLocdata.geographicCoord.longitude;
		var altitude = geoLocdata.geographicCoord.altitude;
		var heading = geoLocdata.heading;
		var pitch = geoLocdata.pitch;
		var roll = geoLocdata.roll;
		
		dataInfoCallback(		MagoConfig.getPolicy().geo_callback_dataInfo,
				dataKey,
				dataName,
				latitude,
				longitude,
				altitude,
				heading,
				pitch,
				roll);
    }
	else if (apiName === "gotoProject")
	{
		var projectId = api.getProjectId();
		//if (!this.hierarchyManager.existProject(projectId))
		//{
		//	var projectDataFolder = api.getProjectDataFolder();
		//	this.getObjectIndexFile(projectId, projectDataFolder);
		//}
		
		var nodeMap = this.hierarchyManager.getNodesMap(projectId);
		if (Object.keys(nodeMap).length == 0)
		{
			var projectDataFolder = api.getProjectDataFolder();
			this.getObjectIndexFile(projectId, projectDataFolder);
		}
		
		
		this.flyTo(api.getLongitude(), api.getLatitude(), api.getElevation(), api.getDuration());
	}
	else if (apiName === "gotoIssue")
	{
		var projectId = api.getProjectId();
		if (!this.hierarchyManager.existProject(projectId))
		{
			var projectDataFolder = api.getProjectDataFolder();
			this.getObjectIndexFile(projectId, projectDataFolder);
		}
		
		this.flyTo(api.getLongitude(), api.getLatitude(), api.getElevation(), api.getDuration());
		
		// pin을 그림
		if (api.getIssueId() !== null && api.getIssueType() !== undefined) 
		{
			DrawAPI.drawInsertIssueImage(api, this);
		}
	}
};

MagoManager.prototype.deleteAll = function ()
{
	// deselect.
	this.selectionCandidates.clearCandidates();
	this.selectionCandidates.clearCurrents();
	this.objectSelected = undefined;
	this.octreeSelected = undefined;
	this.buildingSelected = undefined;
	this.nodeSelected = undefined;
	
	// erase from processQueue and parseQueue. 
	this.parseQueue.clearAll();
	this.processQueue.clearAll();
	
	// clear current visibles.
	if (this.visibleObjControlerBuildings)
	{ this.visibleObjControlerBuildings.clear(); }
	if (this.visibleObjControlerNodes)
	{ this.visibleObjControlerNodes.clear(); }
	if (this.visibleObjControlerOctrees)
	{ this.visibleObjControlerOctrees.clear(); }
	
	// reset tiles.
	this.smartTileManager.resetTiles();
	
	// finally delete nodes.
	this.hierarchyManager.deleteNodes(this.sceneState.gl, this.vboMemoryManager);
};

MagoManager.prototype.checkCollision = function (position, direction)
{
	var gl = this.sceneState.gl;
	if (gl === undefined)	{ return; }

	var posX = this.sceneState.drawingBufferWidth * 0.5;
	var posY = this.sceneState.drawingBufferHeight * 0.5;
	
	var objects = this.getSelectedObjects(gl, posX, posY, this.visibleObjControlerNodes, this.arrayAuxSC);
	if (objects === undefined)	{ return; }

	var current_building = this.buildingSelected;
	this.buildingSelected = this.arrayAuxSC[0];

	var collisionPosition = new Point3D();
	var bottomPosition = new Point3D();

	this.calculatePixelPositionWorldCoord(gl, posX, posY, collisionPosition);
	this.swapRenderingFase();
	this.calculatePixelPositionWorldCoord(gl, posX, this.sceneState.drawingBufferHeight, bottomPosition);

	this.buildingSelected = current_building;
	var distance = collisionPosition.squareDistTo(position.x, position.y, position.z);
	this.swapRenderingFase();

	if (distance > 3.5)
	{
		var bottomPositionCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(bottomPosition);
		var currentPositionCartographic = this.scene.globe.ellipsoid.cartesianToCartographic(position);
		var currentHeight = currentPositionCartographic.height;
		var bottomHeight = bottomPositionCartographic.height + 1.5;
	
		if ( bottomHeight < currentHeight )
		{
			currentHeight -= 0.2;
		}
	
		if ( bottomHeight > currentHeight || 
			(bottomHeight < currentHeight && currentHeight - bottomHeight > 1.5))
		{
			currentHeight = bottomHeight;
		}
		var tmpLat = Cesium.Math.toDegrees(currentPositionCartographic.latitude);
		var tmpLon = Cesium.Math.toDegrees(currentPositionCartographic.longitude);
		
		this.cameraFPV.camera.position = Cesium.Cartesian3.fromDegrees(tmpLon, tmpLat, currentHeight);

		return false; 
	}

	return true;
};;