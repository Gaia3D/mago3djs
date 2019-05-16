'use strict';

/**
 * Main Mago class.
 * @class MagoManager
 */
var MagoManager = function() 
{
	if (!(this instanceof MagoManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// F4D Data structure & objects.*****************************************
	////this.terranTile = new TerranTile();
	//this.tinTerrainManager = new TinTerrainManager();
	this.renderer = new Renderer();
	this.selectionManager = new SelectionManager();
	this.shadersManager = new ShadersManager();
	this.postFxShadersManager = new PostFxShadersManager();
	this.readerWriter = new ReaderWriter();
	this.magoPolicy = new Policy();
	this.animationManager;
	
	var serverPolicy = MagoConfig.getPolicy();
	if (serverPolicy !== undefined)
	{
		this.magoPolicy.setLod0DistInMeters(serverPolicy.geo_lod0);
		this.magoPolicy.setLod1DistInMeters(serverPolicy.geo_lod1);
		this.magoPolicy.setLod2DistInMeters(serverPolicy.geo_lod2);
		this.magoPolicy.setLod3DistInMeters(serverPolicy.geo_lod3);
		this.magoPolicy.setLod4DistInMeters(serverPolicy.geo_lod4);
		this.magoPolicy.setLod5DistInMeters(serverPolicy.geo_lod5);
	}
	
	this.smartTileManager = new SmartTileManager();
	this.processQueue = new ProcessQueue();
	this.parseQueue = new ParseQueue();
	this.loadQueue = new LoadQueue(this);
	this.hierarchyManager = new HierarchyManager();
	this.inspectorBox = new InspectorBox();

	// SSAO.***************************************************
	this.noiseTexture;
	this.depthFbo;
	this.normalFbo; // Only for test disply normals. No use this in release.***
	this.ssaoFbo;

	this.pixels = new Uint8Array(4*4*4); // really this is no necessary.***

	this.depthFboNeo;
	this.depthFboAux;
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

	// Test for sphere.***
	this.sphereKernel = [];
	var kernelSize = 16;
	for (var i=0; i<kernelSize; i++) 
	{
		this.sphereKernel.push(2.0 * (Math.random() - 0.5));
		this.sphereKernel.push(2.0 * (Math.random() - 0.5));
		this.sphereKernel.push(2.0 * (Math.random() - 0.5));
	}
	this.kernel = this.sphereKernel;
	// End ssao.------------------------------------------------

	this.atmosphere = new Atmosphere();

	// Vars.****************************************************************
	this.sceneState = new SceneState(); // this contains all scene mtrices and camera position.***
	this.selectionColor = new SelectionColor();
	this.vboMemoryManager = new VBOMemoryManager();
	

	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerOctrees = new VisibleObjectsController(); 
	this.visibleObjControlerNodes = new VisibleObjectsController(); 
	this.visibleObjControlerTerrain = new VisibleObjectsController(); 
	
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
	this.dateSC = new Date();
	this.startTimeSC;
	this.maxMilisecondsForRender = 10;

	this.terranTileSC;

	this.textureAux_1x1;
	this.resultRaySC = new Float32Array(3);
	this.matrix4SC = new Matrix4();

	//this.unitaryBoxSC;
	this.axisXYZ = new AxisXYZ();

	this.demoBlocksLoaded = false;

	this.objMarkerManager = new ObjectMarkerManager();
	this.pin = new Pin();
	
	//this.weatherStation = new WeatherStation();
	
	// renderWithTopology === 0 -> render only CityGML.***
	// renderWithTopology === 1 -> render only IndoorGML.***
	// renderWithTopology === 2 -> render both.***
	this.tempSettings = {};
	this.tempSettings.renderWithTopology = 1;
	this.tempSettings.renderSpaces = true;
	this.tempSettings.spacesAlpha = 0.6;
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
};

/**
 * object 를 그리는 두가지 종류의 function을 호출
 */
MagoManager.prototype.init = function(gl) 
{
	this.bInit = true;
	
	if (this.sceneState.gl === undefined)
	{ this.sceneState.gl = gl; }
	if (this.vboMemoryManager.gl === undefined)
	{ this.vboMemoryManager.gl = gl; }
	
	if (this.invertedBox === undefined)
	{
		this.invertedBox = new Box();
		var mesh = this.invertedBox.makeMesh(1.5, 1.5, 1.5);
		mesh.reverseSense();
		//mesh.setColor(0.5, 0.5, 0.5, 0.5);
		mesh.getVbo(this.invertedBox.vbo_vicks_container, this.vboMemoryManager);
		mesh.getVboEdges(this.invertedBox.vbo_vicks_containerEdges, this.vboMemoryManager);
	}
};

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
	this.currentFrustumIdx = this.numFrustums-frustumIdx-1;
	if (this.currentFrustumIdx === numFrustums-1) 
	{
		isLastFrustum = true;
		this.isLastFrustum = true;
	}

	// cesium 새 버전에서 지원하지 않음
	var picking = pass.pick;
	if (picking) 
	{
		//
	}
	else 
	{
		if (this.configInformation === undefined)
		{
			this.configInformation = MagoConfig.getPolicy();
		}
		if (scene)
		{
			var gl = scene.context._gl;
			gl.getExtension("EXT_frag_depth");
			
			if (!this.bInit)
			{ this.init(gl); }
		
			if (gl.isContextLost())
			{ return; }

			
		}

		this.startRender(scene, isLastFrustum, this.currentFrustumIdx, numFrustums);
			
	}
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
function handleTextureLoaded(gl, image, texture, flip_y_texCoords) 
{
	// https://developer.mozilla.org/en-US/docs/Web/API/Webgl_API/Tutorial/Using_textures_in_Webgl
	if (flip_y_texCoords === undefined)
	{ flip_y_texCoords = true; }
	
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip_y_texCoords); // if need vertical mirror of the image.***
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
MagoManager.prototype.prepareNeoBuildingsAsimetricVersion = function(gl, visibleObjControlerNodes) 
{
	// for all renderables, prepare data.***
	var neoBuilding;
	var node, rootNode;
	var projectFolderName;
	var neoBuildingFolderName;
	//var geometryDataPath = this.readerWriter.getCurrentDataPath();
	var geometryDataPath = this.readerWriter.geometryDataPath; // default geometryDataPath = "/f4d".***
	if (this.headersRequestedCounter === undefined)
	{ this.headersRequestedCounter = 0; }

	var currentVisibleNodes = [].concat(visibleObjControlerNodes.currentVisibles0, visibleObjControlerNodes.currentVisibles2, visibleObjControlerNodes.currentVisibles3, visibleObjControlerNodes.currentVisiblesAux);
	for (var i=0, length = currentVisibleNodes.length; i<length; i++) 
	{
		node = currentVisibleNodes[i];
		
		// Check if the node is a referenceNode.***
		var attributes = node.data.attributes;
		if (attributes.projectId !== undefined && attributes.isReference !== undefined && attributes.isReference === true)
		{
			// check if has neoBuilding.***
			neoBuilding = currentVisibleNodes[i].data.neoBuilding;
			if (neoBuilding === undefined)
			{
				// test.****************************************
				//neoBuildingFolderName = "F4D_Seongdong_del";
				//projectFolderName = "3ds";
				//----------------------------------------------

				// demand to staticModelsManager the neoBuilding.***
				var projectId = attributes.projectId;
				var staticModelsManager = this.hierarchyManager.getStaticModelsManager();
				var staticModel = staticModelsManager.getStaticModel(projectId);
				neoBuilding = staticModel.neoBuilding;
				neoBuildingFolderName = staticModel.buildingFolderName;
				projectFolderName = staticModel.projectFolderName;
				
				//neoBuilding = staticModelsManager.getStaticModel(staticModelDataPath);
				
				// make a buildingSeed.***
				var buildingSeed = new BuildingSeed();
				buildingSeed.fisrtName = neoBuildingFolderName;
				buildingSeed.name = neoBuildingFolderName;
				buildingSeed.buildingId = neoBuildingFolderName;
				buildingSeed.buildingFileName = neoBuildingFolderName;
				buildingSeed.geographicCoord = new GeographicCoord(attributes.longitude, attributes.latitude, attributes.height); // class : GeographicCoord.
				buildingSeed.rotationsDegree = new Point3D(attributes.pitch, attributes.roll, attributes.heading); // class : Point3D. (heading, pitch, roll).
				buildingSeed.bBox = new BoundingBox();           // class : BoundingBox.
				buildingSeed.bBox.init();
				buildingSeed.bBox.expand(10.0); // we dont know the bbox size, provisionally set as 10,10,10.***
				buildingSeed.geographicCoordOfBBox = new GeographicCoord(attributes.longitude, attributes.latitude, attributes.height);  // class : GeographicCoord.
				buildingSeed.smartTileOwner;
				
				// Now, set neoBuildings parameters.***
				neoBuilding.buildingFileName = neoBuildingFolderName;
				neoBuilding.nodeOwner = node;
				node.data.neoBuilding = neoBuilding;
				node.data.buildingSeed = buildingSeed;
				node.data.projectFolderName = projectFolderName;

				if (neoBuilding.metaData === undefined) 
				{ 
					neoBuilding.metaData = new MetaData(); 
					
					if (neoBuilding.metaData.geographicCoord === undefined)
					{ neoBuilding.metaData.geographicCoord = new GeographicCoord(); }

					if (neoBuilding.metaData.bbox === undefined) 
					{ neoBuilding.metaData.bbox = new BoundingBox(); }
				
					neoBuilding.metaData.geographicCoord.setLonLatAlt(buildingSeed.geographicCoord.longitude, buildingSeed.geographicCoord.latitude, buildingSeed.geographicCoord.altitude);
					neoBuilding.metaData.bbox.copyFrom(buildingSeed.bBox);
					neoBuilding.metaData.heading = buildingSeed.rotationsDegree.z;
					neoBuilding.metaData.pitch = buildingSeed.rotationsDegree.x;
					neoBuilding.metaData.roll = buildingSeed.rotationsDegree.y;
				}

				neoBuilding.name = "test_" + neoBuildingFolderName;
				neoBuilding.buildingId = neoBuildingFolderName;
			
				neoBuilding.buildingType = "basicBuilding";
				//nodeBbox.copyFrom(buildingSeed.bBox); // initially copy from building.
				if (neoBuilding.bbox === undefined)
				{ neoBuilding.bbox = new BoundingBox(); }
				neoBuilding.bbox.copyFrom(buildingSeed.bBox);
				neoBuilding.projectFolderName = node.data.projectFolderName;
			}
		}
		else 
		{
			projectFolderName = node.data.projectFolderName;
			neoBuilding = currentVisibleNodes[i].data.neoBuilding;
		}
		
		// Check if this node has topologyData.***
		/*
		if(node.data && node.data.attributes && node.data.attributes.hasTopology)
		{
			if(neoBuilding.network === undefined)
			{
				// load topologyData for this node.***
				neoBuilding.network = new Network(node);
				var network = neoBuilding.network;
				var magoManager = this;
				
				var geometryDataPath = this.readerWriter.geometryDataPath;
				var indoorGml_filePath = geometryDataPath + "/"  + projectFolderName + "/"  + neoBuilding.buildingFileName + "/topology.json";
				
				loadWithXhr(indoorGml_filePath).done(function(response) 
				{
					var enc = new TextDecoder("utf-8");
					var stringText = enc.decode(response);
					var SampleIndoorJson = JSON.parse(stringText);
					var gmlDataContainer = new GMLDataContainer(SampleIndoorJson, "1.0.3");
					network.parseTopologyData(magoManager, gmlDataContainer);
					
				}).fail(function(status) 
				{
					
				}).always(function() 
				{
					
				});
			}
	
		}
		*/

		// check if this building is ready to render.***
		// 1) MetaData
		var metaData = neoBuilding.metaData;
		if (metaData.fileLoadState === CODE.fileLoadState.READY) 
		{
			projectFolderName = neoBuilding.projectFolderName;
			if (this.fileRequestControler.isFullHeaders())	{ return; }
			var neoBuildingHeaderPath = geometryDataPath + "/"  + projectFolderName + "/"  + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
			
			this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
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

	if (this.configInformation === undefined) 
	{
		// MagoWorld. No need update matrices.***
		return;
	}

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
			
		var cameraPosition = dc.navigatorState.eyePoint;
		sceneState.camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
		sceneState.camera.direction.set(rotatedCameraDirection.x, rotatedCameraDirection.y, rotatedCameraDirection.z);
		sceneState.camera.up.set(rotatedCameraUp.x, rotatedCameraUp.y, rotatedCameraUp.z);
		ManagerUtils.calculateSplited3fv([cameraPosition[0], cameraPosition[1], cameraPosition[2]], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);
		
		var viewport = this.wwd.viewport;
		sceneState.camera.frustum.aspectRatio[0] = viewport.width/viewport.height;
		sceneState.camera.frustum.near[0] = 0.1;
		sceneState.camera.frustum.far[0] = 1000.0;
		
		// Calculate FOV & FOVY.***
		if (sceneState.camera.frustum.dirty)
		{
			var projectionMatrix = dc.navigatorState.projection;
			var aspectRat = sceneState.camera.frustum.aspectRatio;
			var angleAlfa = 2*Math.atan(1/(aspectRat*projectionMatrix[0]));
			var frustum0 = sceneState.camera.getFrustum(0);
			frustum0.dirty = false;
			sceneState.camera.setAspectRatioAndFovyRad(viewport.width/viewport.height, angleAlfa);
		}

		// screen size.***
		sceneState.drawingBufferWidth[0] = viewport.width;
		sceneState.drawingBufferHeight[0] = viewport.height;
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		// * if this is in Cesium:
		var scene = this.scene;
		var uniformState = scene._context.uniformState;
		
		// check if the matrices changed.***
		// compare with the lastModelViewProjectionMatrix.***

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
		
		var frustumCommandsList = this.scene._frustumCommandsList;
		if (frustumCommandsList === undefined)
		{ frustumCommandsList = this.scene.frustumCommandsList; }
		
		var frustum0 = sceneState.camera.getFrustum(0);
		frustum0.far[0] = frustumCommandsList[0].far; 
		frustum0.near[0] = frustumCommandsList[0].near;
		frustum0.fovRad[0] = scene.camera.frustum._fov;
		frustum0.fovyRad[0]= scene.camera.frustum._fovy;
		frustum0.aspectRatio[0] = scene.camera.frustum._aspectRatio;
		frustum0.tangentOfHalfFovy[0] = Math.tan(frustum0.fovyRad/2);
		sceneState.camera.setCurrentFrustum(0);
		
		var frustumIdx = this.currentFrustumIdx;
		var camera = this.sceneState.camera;
		var frustum = camera.getFrustum(frustumIdx);
		var aspectRatio = frustum.aspectRatio;
		var fovy = frustum.fovyRad;
		
		
		
		frustum.far[0] = frustumCommandsList[frustumIdx].far; 
		frustum.near[0] = frustumCommandsList[frustumIdx].near;
		var currentFrustumFar = frustumCommandsList[frustumIdx].far;
		var currentFrustumNear = frustumCommandsList[frustumIdx].near;
		
		this.sceneState.camera.frustum.near[0] = currentFrustumNear;
		this.sceneState.camera.frustum.far[0] = currentFrustumFar;
		

		// now, determine if the camera was moved.***
		// Find cam dir & up by modelViewMatrix.***
		var modelViewMatInv = sceneState.modelViewMatrixInv;
		var camPosX = modelViewMatInv._floatArrays[12];
		var camPosY = modelViewMatInv._floatArrays[13];
		var camPosZ = modelViewMatInv._floatArrays[14];
		
		var camDirX = -modelViewMatInv._floatArrays[8];
		var camDirY = -modelViewMatInv._floatArrays[9];
		var camDirZ = -modelViewMatInv._floatArrays[10];
		
		var camUpX = modelViewMatInv._floatArrays[4];
		var camUpY = modelViewMatInv._floatArrays[5];
		var camUpZ = modelViewMatInv._floatArrays[6];
		
		if (sceneState.camera.isCameraMoved(camPosX, camPosY, camPosZ, camDirX, camDirY, camDirZ, camUpX, camUpY, camUpZ ))
		{
			this.isCameraMoved = true;
		}
		
		sceneState.camera.position.set(camPosX, camPosY, camPosZ);
		sceneState.camera.direction.set(camDirX, camDirY, camDirZ);
		sceneState.camera.up.set(camUpX, camUpY, camUpZ);
		
		sceneState.drawingBufferWidth[0] = scene.drawingBufferWidth;
		sceneState.drawingBufferHeight[0] = scene.drawingBufferHeight;
	}
	else if (this.configInformation.geo_view_library === Constant.MAGOWORLD)
	{
		var camera = sceneState.camera;
		var camPos = camera.position;
		var frustum0 = camera.getFrustum(0);
		sceneState.camera.frustum.aspectRatio = sceneState.drawingBufferWidth / sceneState.drawingBufferHeight;
		// determine frustum near & far.***
		var camHeight = camera.getCameraElevation();
		var eqRadius = Globe.equatorialRadius();
		frustum0.far[0] = (eqRadius + camHeight);
		//frustum0.far[0] = 30000000.0;
		frustum0.near[0] = 0.1 + camHeight / 10000000;
		
		
		ManagerUtils.calculateSplited3fv([camPos.x, camPos.y, camPos.z], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);
		
		// projection.***
		// considere near as zero provisionally.***
		sceneState.projectionMatrix._floatArrays = mat4.perspective(sceneState.projectionMatrix._floatArrays, frustum0.fovyRad[0], frustum0.aspectRatio, 0.0, frustum0.far[0]);
		
		// modelView.***
		//sceneState.modelViewMatrix._floatArrays; 
		sceneState.modelViewMatrixInv._floatArrays = mat4.invert(sceneState.modelViewMatrixInv._floatArrays, sceneState.modelViewMatrix._floatArrays);
	
		// normalMat.***
		sceneState.normalMatrix4._floatArrays = mat4.transpose(sceneState.normalMatrix4._floatArrays, sceneState.modelViewMatrixInv._floatArrays);
		
		// modelViewRelToEye.***
		sceneState.modelViewRelToEyeMatrix._floatArrays = mat4.copy(sceneState.modelViewRelToEyeMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);
		sceneState.modelViewRelToEyeMatrix._floatArrays[12] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[13] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[14] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[15] = 1;
		sceneState.modelViewRelToEyeMatrixInv._floatArrays = mat4.invert(sceneState.modelViewRelToEyeMatrixInv._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);
		
		// modelViewProjection.***
		sceneState.modelViewProjMatrix._floatArrays = mat4.multiply(sceneState.modelViewProjMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);

		// modelViewProjectionRelToEye.***
		sceneState.modelViewProjRelToEyeMatrix.copyFromMatrix4(sceneState.modelViewProjMatrix);
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[12] = 0;
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[13] = 0;
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[14] = 0;
		sceneState.modelViewProjRelToEyeMatrix._floatArrays[15] = 1;
		

		frustum0.tangentOfHalfFovy[0] = Math.tan(frustum0.fovyRad[0]/2);
		
	}
	
	if (this.depthFboNeo !== undefined)
	{
		sceneState.ssaoNoiseScale2[0] = this.depthFboNeo.width[0]/this.noiseTexture.width;
		sceneState.ssaoNoiseScale2[1] = this.depthFboNeo.height[0]/this.noiseTexture.height;
	}
	
	// set the auxiliar camera.
	this.myCameraSCX.direction.set(sceneState.camera.direction.x, sceneState.camera.direction.y, sceneState.camera.direction.z);
	this.myCameraSCX.up.set(sceneState.camera.up.x, sceneState.camera.up.y, sceneState.camera.up.z);
	var frustum0 = this.myCameraSCX.getFrustum(0);
	var sceneCamFurustum0 = sceneState.camera.getFrustum(0);
	frustum0.near[0] = sceneCamFurustum0.near[0];
	frustum0.far[0] = sceneCamFurustum0.far[0];
	frustum0.fovyRad[0] = sceneCamFurustum0.fovyRad[0];
	frustum0.tangentOfHalfFovy[0] = sceneCamFurustum0.tangentOfHalfFovy[0];
	frustum0.fovRad[0] = sceneCamFurustum0.fovRad[0];
	frustum0.aspectRatio[0] = sceneCamFurustum0.aspectRatio[0];
	
	
};

/**
 * Here updates the camera's parameters and frustum planes.
 * @param {Camera} camera
 */
MagoManager.prototype.upDateCamera = function(resultCamera) 
{
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		var frustumIdx = this.currentFrustumIdx;
		var frustum = resultCamera.getFrustum(frustumIdx);
		var fovy = frustum.fovyRad;
		resultCamera.setAspectRatioAndFovyRad(aspectRatio, fovy);
		
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
		
		//var frustumIdx = this.numFrustums-this.currentFrustumIdx-1;
		var frustumIdx = this.currentFrustumIdx;
		var camera = this.sceneState.camera;
		var frustum = camera.getFrustum(frustumIdx);
		var aspectRatio = frustum.aspectRatio;
		var fovy = frustum.fovyRad;
		frustum.far[0] = this.scene.frustumCommandsList[frustumIdx].far; 
		frustum.near[0] = this.scene.frustumCommandsList[frustumIdx].near;
		var currentFrustumFar = this.scene.frustumCommandsList[frustumIdx].far;
		var currentFrustumNear = this.scene.frustumCommandsList[frustumIdx].near;
		
		this.sceneState.camera.frustum.near[0] = currentFrustumNear;
		this.sceneState.camera.frustum.far[0] = currentFrustumFar;
		
		// take all frustums near-far distances.***
		var numFrustums = this.scene.frustumCommandsList.length;
		var distancesArray = [];
		for (var i=0; i<numFrustums; i++)
		{
			distancesArray[i*2] = this.scene.frustumCommandsList[i].near;
			distancesArray[i*2+1] = this.scene.frustumCommandsList[i].far;
		}
		
		// Set cam dir & up by modelViewMatrix.***
		var sceneState = this.sceneState;
		var modelViewMatInv = sceneState.modelViewMatrixInv;
		var camPosX = modelViewMatInv._floatArrays[12];
		var camPosY = modelViewMatInv._floatArrays[13];
		var camPosZ = modelViewMatInv._floatArrays[14];
		
		var camDirX = -modelViewMatInv._floatArrays[8];
		var camDirY = -modelViewMatInv._floatArrays[9];
		var camDirZ = -modelViewMatInv._floatArrays[10];
		
		var camUpX = modelViewMatInv._floatArrays[4];
		var camUpY = modelViewMatInv._floatArrays[5];
		var camUpZ = modelViewMatInv._floatArrays[6];
		
		resultCamera.position.set(camPosX, camPosY, camPosZ);
		resultCamera.direction.set(camDirX, camDirY, camDirZ);
		resultCamera.up.set(camUpX, camUpY, camUpZ);
		
		frustum = resultCamera.getFrustum(frustumIdx);
		frustum.near[0] = currentFrustumNear;
		frustum.far[0] = currentFrustumFar;
		resultCamera.setFrustumsDistances(numFrustums, distancesArray);
		resultCamera.setAspectRatioAndFovyRad(aspectRatio, fovy);
		resultCamera.calculateFrustumsPlanes();
	}
	else if (this.configInformation.geo_view_library === Constant.MAGOWORLD)
	{
		var camera = this.sceneState.camera;
		
		var frustumIdx = 0;
		var camera = this.sceneState.camera;
		var frustum = camera.getFrustum(frustumIdx);
		var aspectRatio = frustum.aspectRatio;
		var fovy = frustum.fovyRad;
		//frustum.far[0] = this.scene._frustumCommandsList[frustumIdx].far; 
		//frustum.near[0] = this.scene._frustumCommandsList[frustumIdx].near;
		var currentFrustumFar = frustum.far;
		var currentFrustumNear = frustum.near;
		
		this.sceneState.camera.frustum.near[0] = currentFrustumNear;
		this.sceneState.camera.frustum.far[0] = currentFrustumFar;
		this.sceneState.camera.frustum.aspectRatio = aspectRatio;
		
		// take all frustums near-far distances.***
		var numFrustums = 1;
		var distancesArray = [];
		for (var i=0; i<numFrustums; i++)
		{
			distancesArray[i*2] = frustum.near;
			distancesArray[i*2+1] = frustum.far;
		}
		
		resultCamera.position.set(camera.position.x, camera.position.y, camera.position.z);
		resultCamera.direction.set(camera.direction.x, camera.direction.y, camera.direction.z);
		resultCamera.up.set(camera.up.x, camera.up.y, camera.up.z);
		frustum = resultCamera.getFrustum(frustumIdx);
		frustum.near[0] = currentFrustumNear;
		frustum.far[0] = currentFrustumFar;
		resultCamera.setFrustumsDistances(numFrustums, distancesArray);
		resultCamera.setAspectRatioAndFovyRad(aspectRatio, fovy);
		resultCamera.calculateFrustumsPlanes();
	}
};




/**
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
 
MagoManager.prototype.load_testTextures = function() 
{
	if (this.pin.texture === undefined)
	{
		var gl = this.sceneState.gl;
		
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
		
		cabreadoTex = new Texture();
		filePath_inServer = this.magoPolicy.imagePath + "/funny.jpg";
		cabreadoTex.texId = gl.createTexture();
		this.readerWriter.readNeoReferenceTexture(gl, filePath_inServer, cabreadoTex, undefined, this);
		this.pin.texturesArray.push(cabreadoTex);
	}
};

/**
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
MagoManager.prototype.getCurrentTime = function() 
{
	return this.currTime;
};
/*
MagoManager.prototype.test__octreeModelRefAndIndices_changed = function() 
{
	if(this.hierarchyManager.existProject("AutonomousVehicle"))
	{
		var nodesMap = this.hierarchyManager.getNodesMap("AutonomousVehicle");
		for(var key in nodesMap)
		{
			if (Object.prototype.hasOwnProperty.call(nodesMap, key))
			{
				var node = nodesMap[key];
				if(node.test__octreeModelRefAndIndices_changed())
					var hola = 0;
			}
		}
	
		var hola = 0 ;
	}
};
*/

/**
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
MagoManager.prototype.startRender = function(scene, isLastFrustum, frustumIdx, numFrustums) 
{
	this.numFrustums = numFrustums;
	this.isLastFrustum = isLastFrustum;

	var gl = this.sceneState.gl;
	this.upDateSceneStateMatrices(this.sceneState);
	
	if (this.isFarestFrustum())
	{
		this.dateSC = new Date();
		this.currTime = this.dateSC.getTime();
		if (this.textureAux_1x1 === undefined) 
		{
			this.textureAux_1x1 = gl.createTexture();
			// Test wait for texture to load.********************************************
			gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([150, 150, 150, 255])); // clear grey
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		
		if (this.noiseTexture === undefined) 
		{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }
		
		// provisional pin textures loading.
		this.load_testTextures();
	
		if (this.depthFboNeo === undefined) { this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
		if (this.sceneState.drawingBufferWidth[0] !== this.depthFboNeo.width[0] || this.sceneState.drawingBufferHeight[0] !== this.depthFboNeo.height[0])
		{
			// move this to onResize.***
			this.depthFboNeo.deleteObjects(gl);
			this.depthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
			this.sceneState.camera.frustum.dirty = true;
		}
	
		if (this.myCameraSCX === undefined) 
		{ this.myCameraSCX = new Camera(); }
		
		if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
		{
			////this.upDateSceneStateMatrices(this.sceneState);
			this.upDateCamera(this.myCameraSCX);
			this.doMultiFrustumCullingSmartTiles(this.myCameraSCX);
		}
		
		gl.clearStencil(0); // provisionally here.***
		gl.clear(gl.STENCIL_BUFFER_BIT);
		
		if (this.animationManager !== undefined)
		{ this.animationManager.checkAnimation(this); }
	}
	
	
	
	var cameraPosition = this.sceneState.camera.position;
	
	// Take the current frustumVolumenObject.***
	var frustumVolumenObject = this.frustumVolumeControl.getFrustumVolumeCulling(frustumIdx); 
	this.myCameraSCX.setCurrentFrustum(frustumIdx);
	var visibleNodes = frustumVolumenObject.visibleNodes;
	
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (this.frustumVolumeControl === undefined)
		{ return; }
		
		//var frustumVolume = this.myCameraSCX.frustum;
		var frustumVolume = this.myCameraSCX.bigFrustum;
		var doFrustumCullingToBuildings = false;
		this.tilesMultiFrustumCullingFinished(frustumVolumenObject.fullyIntersectedLowestTilesArray, visibleNodes, cameraPosition, frustumVolume, doFrustumCullingToBuildings);
		doFrustumCullingToBuildings = true;
		
		this.tilesMultiFrustumCullingFinished(frustumVolumenObject.partiallyIntersectedLowestTilesArray, visibleNodes, cameraPosition, frustumVolume, doFrustumCullingToBuildings);
		
		
		this.prepareNeoBuildingsAsimetricVersion(gl, visibleNodes); 
		
		
	}
	
	
	var currentShader = undefined;
	this.visibleObjControlerNodes = visibleNodes; // set the current visible nodes.***

	// prepare data if camera is no moving.***
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		// 1) LOD 0.***********************************************************************************
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
			if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 0))
			{
				// any octree is visible.
				this.visibleObjControlerNodes.currentVisibles0.splice(i, 1);
				i--;
				nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
			}
		}
		
		
		this.prepareVisibleOctreesSortedByDistance(gl, this.visibleObjControlerOctrees); 
		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles0); 
		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles1); 
		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles2); 

		
		// lod 2.
		if (this.readerWriter.referencesList_requested < 5)
		{
			nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
			for (var i=0; i<nodesCount; i++) 
			{
				node = this.visibleObjControlerNodes.currentVisibles2[i];
				if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 2))
				{
					// any octree is visible.
					this.visibleObjControlerNodes.currentVisibles2.splice(i, 1);
					i--;
					nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
				}
			}

			this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles2); 
		}
		
		
		// lod3, lod4, lod5.***
		this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles3);
		this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles2);
		this.prepareVisibleLowLodNodes(this.visibleObjControlerNodes.currentVisibles0);
		
		
		// provisionally prepare pointsCloud datas.******************************************************
		// Load the motherOctrees pCloudData.***
		var nodesCount = this.visibleObjControlerNodes.currentVisiblesAux.length;
		
		for (var i=0; i<nodesCount; i++) 
		{
			if (this.readerWriter.pCloudPartitionsMotherOctree_requested >= 1)
			{ break; }
			
			node = this.visibleObjControlerNodes.currentVisiblesAux[i];
			
			if (node.isReferenceNode())
			{ continue; }
			
			var neoBuilding = node.data.neoBuilding;
			
			if (neoBuilding === undefined)
			{ continue; }
			
			var octree = neoBuilding.octree; // MotherOctree.***
			
			if (octree === undefined)
			{ continue; }
			
			octree.preparePCloudData(this, neoBuilding); // Here only loads the motherOctrees-pCloud.***
		}
		this.readerWriter.pCloudPartitions_requested = 0;
		
		
		
		// TinTerrain.***
		// TinTerrain.*******************************************************************************************************************************
		if (this.isFarestFrustum())
		{
			if (this.tinTerrainManager !== undefined)
			{ this.tinTerrainManager.prepareVisibleTinTerrains(this); }
		}
		//if(this.isFarestFrustum())
		this.manageQueue();
	
		
		
		if (this.currentFrustumIdx === 0)
		{
			this.loadQueue.manageQueue();
			//this.loadQueue.resetQueue();
		}
		
		
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
			var objMarker = this.objMarkerManager.newObjectMarker();
			//ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, this.objMarkerSC.geoLocationData, this);
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, objMarker.geoLocationData, this);
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
			
			ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, this.objMarkerSC.geoLocationData, this);
			//var objMarker = this.objMarkerManager.newObjectMarker();
			//ManagerUtils.calculateGeoLocationDataByAbsolutePoint(pixelPos.x, pixelPos.y, pixelPos.z, objMarker.geoLocationData, this);
		}
		
		
	}
	
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (this.selectionFbo === undefined) 
		{ this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight); }
		
		if (this.isCameraMoved || this.bPicking) // 
		{
			this.selectionFbo.bind(); // framebuffer for color selection.***
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.depthRange(0, 1);
			gl.disable(gl.CULL_FACE);
			if (this.isLastFrustum)
			{
				// this is the farest frustum, so init selection process.***
				gl.clearColor(1, 1, 1, 1); // white background.***
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear buffer.***
				this.selectionManager.clearCandidates();
			}
			
			this.renderGeometryColorCoding(gl, this.visibleObjControlerNodes);
			this.swapRenderingFase();
			
			if (this.currentFrustumIdx === 0)
			{
				this.isCameraMoved = false;
			}
			
			
		}
		
		if (this.currentFrustumIdx === 0)
		{
			if ( this.bPicking === true)
			{
				// this is the closest frustum.***
				this.bPicking = false;
				this.arrayAuxSC.length = 0;
				this.objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
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
				

				// Test flyTo by topology.******************************************************************************
				var selCandidatesEdges = this.selectionManager.getSelectionCandidatesFamily("networkEdges");
				var selCandidatesNodes = this.selectionManager.getSelectionCandidatesFamily("networkNodes");
				var flyed = false;
				if (selCandidatesEdges)
				{
					var edgeSelected = selCandidatesEdges.currentSelected;
					if (edgeSelected && edgeSelected.vtxSegment)
					{
						// calculate the 2 positions of the edge.***
						var camPos = this.sceneState.camera.position;
						var vtxSeg = edgeSelected.vtxSegment;
						var pos1 = new Point3D();
						var pos2 = new Point3D();
						pos1.copyFrom(vtxSeg.startVertex.point3d);
						pos2.copyFrom(vtxSeg.endVertex.point3d);
						pos1.add(0.0, 0.0, 1.7); // add person height.***
						pos2.add(0.0, 0.0, 1.7); // add person height.***
							
							
						// calculate pos1 & pos2 to worldCoordinate.***
						// Need the building tMatrix.***
						var network = edgeSelected.networkOwner;
						var node = network.nodeOwner;
						var geoLocDataManager = node.data.geoLocDataManager;
						var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
						var tMat = geoLoc.tMatrix;
							
						// To positions must add "pivotPointTraslation" if exist.***
						// If building moved to bboxCenter, for example, then exist "pivotPointTraslation".***
						var pivotTranslation = geoLoc.pivotPointTraslation;
						if (pivotTranslation)
						{
							pos1.add(pivotTranslation.x, pivotTranslation.y, pivotTranslation.z);
							pos2.add(pivotTranslation.x, pivotTranslation.y, pivotTranslation.z);
						}

						var worldPos1 = tMat.transformPoint3D(pos1, undefined);
						var worldPos2 = tMat.transformPoint3D(pos2, undefined);

						// select the farestPoint to camera.***
						var dist1 = camPos.squareDistToPoint(worldPos1);
						var dist2 = camPos.squareDistToPoint(worldPos2);
						var pointSelected;
						if (dist1<dist2)
						{
							pointSelected = worldPos2;
						}
						else
						{ pointSelected = worldPos1; }
							
						// now flyTo pointSelected.***
						this.flyToTopology(pointSelected, 2);
						flyed = true;
					}
				}
				if (!flyed && selCandidatesNodes)
				{
					var nodeSelected = selCandidatesNodes.currentSelected;
					if (nodeSelected)
					{
						// calculate the 2 positions of the edge.***
						var camPos = this.sceneState.camera.position;
						var pos1 = new Point3D(nodeSelected.position.x, nodeSelected.position.y, nodeSelected.position.z);
						pos1.add(0.0, 0.0, 1.7); // add person height.***
							
							
						// calculate pos1 & pos2 to worldCoordinate.***
						// Need the building tMatrix.***
						var network = nodeSelected.networkOwner;
						var node = network.nodeOwner;
						var geoLocDataManager = node.data.geoLocDataManager;
						var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
						var tMat = geoLoc.tMatrix;
							
						// To positions must add "pivotPointTraslation" if exist.***
						// If building moved to bboxCenter, for example, then exist "pivotPointTraslation".***
						var pivotTranslation = geoLoc.pivotPointTraslation;
						if (pivotTranslation)
						{
							pos1.add(pivotTranslation.x, pivotTranslation.y, pivotTranslation.z);
						}
							
						var worldPos1 = tMat.transformPoint3D(pos1, undefined);
							
						// now flyTo pointSelected.***
						this.flyToTopology(worldPos1, 2);
						flyed = true;
					}
				}
				// End Test flyTo by topology.******************************************************************************
				
			}
			
			this.selectionColor.init(); // selection colors manager.***
		}
		this.selectionFbo.unbind();
		gl.enable(gl.CULL_FACE);
	}
	
	// lightDepthRender: TODO.***

			
	// 1) The depth render.**********************************************************************************************************************
	var ssao_idx = 0; // 0= depth. 1= color.***
	var renderTexture = false;
	this.depthFboNeo.bind(); 
	if (this.isFarestFrustum())
	{
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
	this.renderGeometry(gl, cameraPosition, currentShader, renderTexture, ssao_idx, this.visibleObjControlerNodes);
	// test mago geometries.***********************************************************************************************************
	//this.renderMagoGeometries(ssao_idx); //TEST
	this.depthFboNeo.unbind();
	this.swapRenderingFase();
	

	
	// 2) color render.************************************************************************************************************
	if (this.configInformation.geo_view_library === Constant.WORLDWIND)
	{
		;//
	}
	else if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		scene._context._currentFramebuffer._bind();
	}
	


	ssao_idx = 1;
	this.renderGeometry(gl, cameraPosition, currentShader, renderTexture, ssao_idx, this.visibleObjControlerNodes);
	
	if (this.weatherStation)
	{
		//this.weatherStation.test_renderWindLayer(this);
		//this.weatherStation.test_renderTemperatureLayer(this);
		//this.weatherStation.test_renderCuttingPlanes(this, ssao_idx);
		/*
		var renderType = 1;
		var currentShader;
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao default.***
			gl.enable(gl.BLEND);
			
			if (this.noiseTexture === undefined) 
			{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			
			gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
			gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao default.***

			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);
			
			//buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);
			gl.uniformMatrix4fv(currentShader.buildingRotMatrix_loc, false, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]));
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, new Float32Array([0,0,0]));
			gl.uniform3fv(currentShader.buildingPosLOW_loc, new Float32Array([0,0,0]));

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
			currentShader.last_tex_id = this.textureAux_1x1;
		//this.weatherStation.test_renderTemperatureMesh(this, currentShader, renderType);
		this.weatherStation.test_renderPrecipitationMesh(this, currentShader, renderType);
		gl.disable(gl.BLEND);
		
		currentShader.disableVertexAttribArrayAll();
		*/
	}
	
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
		
	this.swapRenderingFase();
	
	// 3) test mago geometries.***********************************************************************************************************
	//this.renderMagoGeometries(ssao_idx); //TEST
	
	// 4) Render filter.******************************************************************************************************************
	//this.renderFilter();
	
	
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
 * 
 */
MagoManager.prototype.processSelection = function() 
{
	
};



/**
 * Prepare current visibles low LOD nodes.***
 */
MagoManager.prototype.prepareVisibleLowLodNodes = function(lowLodNodesArray) 
{
	if (this.readerWriter.skinLegos_requested > 5)
	{ return; }
	
	// Prepare lod3, lod4 and lod5 meshes.***
	// check "this.visibleObjControlerNodes.currentVisibles3".***
	var node;
	var neoBuilding;
	var extraCount = 5;
	
	var lowLodNodesCount = lowLodNodesArray.length;
	for (var i=0; i<lowLodNodesCount; i++) 
	{
		node = lowLodNodesArray[i];
		
		// debug.***
		if (node.data.attributes.isReference !== undefined)
		{ var hola = 0; }
		
		neoBuilding = node.data.neoBuilding;
		
		neoBuilding.prepareSkin(this);
		
		if (this.readerWriter.skinLegos_requested > 5)
		{ return; }
	}
};

/**
 * Mago geometries generation test.***
 */
MagoManager.prototype.renderMagoGeometries = function(ssao_idx) 
{
	// 1rst, make the test object if no exist.***
	//return;
	
	if (this.nativeProjectsArray === undefined)
	{
		this.nativeProjectsArray = [];
		var natProject = new MagoNativeProject();
		this.nativeProjectsArray.push(natProject);
		
		var pMesh = natProject.newParametricMesh();
		
		pMesh.profile = new Profile2D(); // provisional.***
		var profileAux = pMesh.profile; // provisional.***
		
		profileAux.TEST__setFigureHole_2();
		//profileAux.TEST__setFigure_1();
		
		if (pMesh.vboKeyContainer === undefined)
		{ pMesh.vboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
		
		if (pMesh.vboKeyContainerEdges === undefined)
		{ pMesh.vboKeyContainerEdges = new VBOVertexIdxCacheKeysContainer(); }
		
		var bIncludeBottomCap, bIncludeTopCap;
		var extrusionVector, extrusionDist, extrudeSegmentsCount;
		/*
		extrudeSegmentsCount = 120;
		extrusionDist = 15.0;
		pMesh.extrude(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector);
		*/
		
		var revolveAngDeg, revolveSegmentsCount, revolveSegment2d;
		revolveAngDeg = 90.0;
		revolveSegment2d = new Segment2D();
		var strPoint2d = new Point2D(20, -10);
		var endPoint2d = new Point2D(20, 10);
		revolveSegment2d.setPoints(strPoint2d, endPoint2d);
		revolveSegmentsCount = 24;
		pMesh.revolve(profileAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d);
		
		bIncludeBottomCap = true;
		bIncludeTopCap = true;
		var mesh = pMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		mesh.setColor(0.1, 0.5, 0.5, 1.0);

		mesh.getVbo(pMesh.vboKeyContainer, this.vboMemoryManager);
		mesh.getVboEdges(pMesh.vboKeyContainerEdges, this.vboMemoryManager);
		
		// Now, provisionally make a geoLocationData for the nativeProject.*************************************
		if (natProject.geoLocDataManager === undefined)
		{
			natProject.geoLocDataManager = new GeoLocationDataManager();
			var geoLoc = natProject.geoLocDataManager.newGeoLocationData("deploymentLoc"); 
			
			var longitude = 126.61120237344926;
			var latitude = 37.577213509597016;
			var altitude = 50;
			var heading = 0.0;
			var pitch = 0.0;
			var roll = 0.0;

			ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, geoLoc, this);
		}
		
	}
	//---------------------------------------------------------------------------------------------------------------
	var renderType = ssao_idx;
	var gl = this.sceneState.gl;
	var color;
	var node;
	var currentShader;
	if (ssao_idx === 0)
	{
		currentShader = this.postFxShadersManager.getShader("modelRefDepth"); 
		gl.disable(gl.BLEND);
	}
	if (ssao_idx === 1)
	{
		currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
		gl.enable(gl.BLEND);
	}
	
	if (this.noiseTexture === undefined) 
	{ return; }
	
	// Test rendering by modelRefShader.****
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.***
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.***
	gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true); // turn on/off specular lighting & normals.***
	
	// -------------------------------------
	
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	var shaderProgram = currentShader.program;
	currentShader.bindUniformGenerals();
	gl.enableVertexAttribArray(currentShader.position3_loc);
		
	if (ssao_idx === 1)
	{
		// provisionally render all native projects.***
		gl.enableVertexAttribArray(currentShader.normal3_loc);
		gl.enableVertexAttribArray(currentShader.color4_loc);

		gl.uniform1i(currentShader.bUse1Color_loc, false);
		if (color)
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, 1.0]); //.***
		}
		else 
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.***
		}
		
		gl.uniform1i(currentShader.bUseNormal_loc, true);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
	}
	
	var neoBuilding;
	var natProject, pMesh;
	var geoLocDataManager;
	var buildingGeoLocation;
	var bRenderLines = false;
	var nativeProjectsCount = this.nativeProjectsArray.length;
	for (var i=0; i<nativeProjectsCount; i++)
	{
		natProject = this.nativeProjectsArray[i];
		geoLocDataManager = natProject.geoLocDataManager;
		
		gl.uniform3fv(currentShader.scale_loc, [1, 1, 1]); //.***
		buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		
		var meshesCount = natProject.getMeshesCount();
		for (var j=0; j<meshesCount; j++)
		{
			pMesh = natProject.getMesh(j);
			this.renderer.renderObject(gl, pMesh, this, currentShader, ssao_idx, bRenderLines);
		}
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
	
	gl.disable(gl.BLEND);
	
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawBuildingNames = function(visibleObjControlerNodes) 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
	

	for (var key in rootNodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(rootNodesMap, key))
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
	
	return node.getNodeGeoLocDataManager();
};


/**
 * Renders the current frustumVolumen with colorCoding for selection.
 * @param {GL} gl.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 * @returns {Array} resultSelectedArray 
 */
MagoManager.prototype.renderGeometryColorCoding = function(gl, visibleObjControlerNodes) 
{
	var renderType = 2; // 0 = depthRender, 1= colorRender, 2 = selectionRender.***
	
	//if (this.selectionFbo.dirty) // todo.
	{
		var refTMatrixIdxKey = 0;
		var renderTexture = false;

		var currentShader = this.postFxShadersManager.getShader("modelRefColorCoding"); 
		currentShader.useProgram();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		
		currentShader.bindUniformGenerals();
		
		gl.disable(gl.CULL_FACE);
		// do the colorCoding render.***
		var minSizeToRender = 0.0;
		var renderType = 2;
		this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
		this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
		this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, this, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);

		gl.enable(gl.CULL_FACE);
		currentShader.disableVertexAttribArray(currentShader.position3_loc);
		gl.useProgram(null);
		
		// Render cuttingPlanes of temperaturalayers if exist.***
		if (this.weatherStation)
		{ this.weatherStation.test_renderCuttingPlanes(this, renderType); }
	}
	
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS)
	{
		// render geographicCoords of the modeler.***
		if (this.modeler !== undefined)
		{
			var shader = this.postFxShadersManager.getShader("modelRefColorCoding"); 
			shader.useProgram();
			shader.enableVertexAttribArray(shader.position3_loc);
			shader.disableVertexAttribArray(shader.texCoord2_loc);
			shader.disableVertexAttribArray(shader.normal3_loc);
		
			shader.bindUniformGenerals();
			
			gl.disable(gl.CULL_FACE);
			this.modeler.render(this, shader, renderType);
		}
	}
};

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 * @returns {Array} resultSelectedArray 
 */
MagoManager.prototype.getSelectedObjects = function(gl, mouseX, mouseY, resultSelectedArray) 
{
	// Read the picked pixel and find the object.*********************************************************
	var mosaicWidth = 9;
	var mosaicHeight = 9;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 4 x 3x3 pixel, total 9 pixels select.***
	var pixelX = mouseX - Math.floor(mosaicWidth/2);
	var pixelY = this.sceneState.drawingBufferHeight - mouseY - Math.floor(mosaicHeight/2); // origin is bottom.***
	
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***
	
	this.selectionManager.clearCurrents();

	// now, select the object.***
	// The center pixel of the selection is 12, 13, 14.***
	var centerPixel = Math.floor(totalPixelsCount/2);
	var idx = this.selectionColor.decodeColor3(pixels[centerPixel*3], pixels[centerPixel*3+1], pixels[centerPixel*3+2]);
	this.selectionManager.selectObjects(idx);
	
	var selectedObject = this.selectionManager.currentReferenceSelected;

	resultSelectedArray[0] = this.selectionManager.currentBuildingSelected;
	resultSelectedArray[1] = this.selectionManager.currentOctreeSelected;
	resultSelectedArray[2] = this.selectionManager.currentReferenceSelected;
	resultSelectedArray[3] = this.selectionManager.currentNodeSelected;
	
	// Aditionally check if selected an edge of topology.***
	var selNetworkEdges = this.selectionManager.getSelectionCandidatesFamily("networkEdges");
	if (selNetworkEdges)
	{
		var currEdgeSelected = selNetworkEdges.currentSelected;
		var i = 0;
		while (currEdgeSelected === undefined && i< totalPixelsCount)
		{
			var idx = this.selectionColor.decodeColor3(pixels[i*3], pixels[i*3+1], pixels[i*3+2]);
			currEdgeSelected = selNetworkEdges.selectObject(idx);
			i++;
		}
	}
	
	// TEST: Check if selected a cuttingPlane.***
	var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		var i = 0;
		while (currObjectSelected === undefined && i< totalPixelsCount)
		{
			var idx = this.selectionColor.decodeColor3(pixels[i*3], pixels[i*3+1], pixels[i*3+2]);
			currObjectSelected = selGeneralObjects.selectObject(idx);
			i++;
		}
	}
	
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
	rayCamSpace = this.getRayCamSpace(pixelX, pixelY, rayCamSpace);
	
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
MagoManager.prototype.getRayCamSpace = function(pixelX, pixelY, resultRay) 
{
	// in this function "ray" is a vector.***
	var frustum_far = 1.0; // unitary frustum far.***
	var frustum = this.sceneState.camera.frustum;
	var aspectRatio = frustum.aspectRatio;
	var tangentOfHalfFovy = frustum.tangentOfHalfFovy; 
	
	var hfar = 2.0 * tangentOfHalfFovy * frustum_far; //var hfar = 2.0 * Math.tan(fovy/2.0) * frustum_far;
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
	
	var geoLocDataManager = this.nodeSelected.getNodeGeoLocDataManager();
	
	this.calculatePixelPositionWorldCoord(gl, pixelX, pixelY, this.pointSC2);
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
	var tMatrixInv = buildingGeoLocation.getTMatrixInv();
	this.pointSC = tMatrixInv.transformPoint3D(this.pointSC2, this.pointSC); // buildingSpacePoint.***

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
 */
MagoManager.prototype.calculatePixelLinearDepth = function(gl, pixelX, pixelY, depthFbo) 
{
	gl.depthRange(0, 1);
	gl.frontFace(gl.CCW);

	if (depthFbo === undefined)
	{ depthFbo = this.depthFboNeo; }
	
	if (depthFbo) 
	{
		depthFbo.bind(); // bind the existent last depthFramebuffer.
	}
	else 
	{
		// never enter here.
		return;
	}

	// Now, read the pixel and find the pixel position.
	var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.***
	gl.readPixels(pixelX, this.sceneState.drawingBufferHeight - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);
	
	var zDepth = depthPixels[0]/(256.0*256.0*256.0) + depthPixels[1]/(256.0*256.0) + depthPixels[2]/256.0 + depthPixels[3]; // 0 to 256 range depth.***
	var linearDepth = zDepth /= 256.0; // LinearDepth. Convert 0 to 1.0 range depth.***
	return linearDepth;
};

/**
 * Calculates the pixel position in camera coordinates.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @param {Point3D} resultPixelPos The result of the calculation.
 * @return {Point3D} resultPixelPos The result of the calculation.
 */
MagoManager.prototype.calculatePixelPositionCamCoord = function(gl, pixelX, pixelY, resultPixelPos, depthFbo, frustumFar) 
{
	// depth render.
	gl.depthRange(0, 1);
	gl.frontFace(gl.CCW);

	if (frustumFar === undefined)
	{ frustumFar = this.sceneState.camera.frustum.far; }
	
	var linearDepth = this.calculatePixelLinearDepth(gl, pixelX, pixelY, depthFbo);
	var realZDepth = linearDepth*frustumFar; // original.***

	// now, find the 3d position of the pixel in camCoord.****
	this.resultRaySC = this.getRayCamSpace(pixelX, pixelY, this.resultRaySC);
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
MagoManager.prototype.calculatePixelPositionWorldCoord = function(gl, pixelX, pixelY, resultPixelPos, depthFbo, frustumFar) 
{
	var pixelPosCamCoord = new Point3D();
	
	if (frustumFar === undefined)
	{ frustumFar = this.sceneState.camera.frustum.far; }
	
	if (depthFbo === undefined)
	{ depthFbo = this.depthFboNeo; }
	
	pixelPosCamCoord = this.calculatePixelPositionCamCoord(gl, pixelX, pixelY, pixelPosCamCoord, depthFbo, frustumFar);

	if (resultPixelPos === undefined)
	{ var resultPixelPos = new Point3D(); }

	resultPixelPos = this.cameraCoordPositionToWorldCoord(pixelPosCamCoord, resultPixelPos);
	return resultPixelPos;
};

/**
 * Calculates the cameraCoord position in world coordinates.
 * @param {Point3D} cameraCoord position.
 * @return {Point3D} resultPixelPos The result of the calculation.
 */
MagoManager.prototype.cameraCoordPositionToWorldCoord = function(camCoordPos, resultWorldPos) 
{
	// now, must transform this pixelCamCoord to world coord.***
	var mv_inv = this.sceneState.modelViewMatrixInv;
	if (resultWorldPos === undefined)
	{ var resultWorldPos = new Point3D(); }
	resultWorldPos = mv_inv.transformPoint3D(camCoordPos, resultWorldPos);
	return resultWorldPos;
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
	var bIsDragging = false;
	var gl = this.sceneState.gl;

	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL)	// Moving all
	{
		this.arrayAuxSC.length = 0;
		this.selectionFbo.bind();
		var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
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
			bIsDragging = true;
		}
		else 
		{
			bIsDragging = false;
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // Moving object
	{
		this.arrayAuxSC.length = 0;
		this.selectionFbo.bind();
		var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
		this.arrayAuxSC.length = 0;

		if (current_objectSelected === this.objectSelected) 
		{
			bIsDragging = true;
		}
		else 
		{
			bIsDragging = false;
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS) 
	{
		// Compare currentSelectedObject with the nowSelectedObject.***
		var currSelected = this.selectionManager.getSelectedGeneral();
		this.arrayAuxSC.length = 0;
		this.selectionFbo.bind();
		this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
		var nowSelected = this.selectionManager.getSelectedGeneral();
		if (nowSelected !== undefined && nowSelected === currSelected)
		{
			var className = nowSelected.constructor.name;
			if (className === "GeographicCoord")
			{
				bIsDragging = true;
			}
			else 
			{
				bIsDragging = false;
			}
		}
	}
	else
	{
		if (this.weatherStation)
		{
			// check if there are cuttingPlanes to move.***
			this.selectionFbo.bind();
			var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
			var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
			if (selGeneralObjects)
			{
				var currObjectSelected = selGeneralObjects.currentSelected;
				if (currObjectSelected)
				{
					// check if is a cuttingPlane.***
					if (currObjectSelected instanceof CuttingPlane)
					{
						bIsDragging = true;
					}
				}
				else 
				{
					
					bIsDragging = false;
				}
			}
			else
			{ bIsDragging = false; }
		}
	}
	
	if (!bIsDragging)
	{
		this.selectionManager.clearCandidates();
	}

	return bIsDragging;
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
MagoManager.prototype.mouseActionLeftUp = function(mouseX, mouseY) 
{
	if (this.objectMoved)
	{
		this.objectMoved = false;
		var nodeSelected = this.selectionManager.currentNodeSelected;
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
	
	// Clear startPositions of mouseAction.***
	var mouseAction = this.sceneState.mouseAction;
	mouseAction.clearStartPositionsAux(); // provisionally only clear the aux.***
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.keyDown = function(key) 
{
	if (key === 32) // 32 = 'space'.***
	{
		if (this.pointsCloudSsao === undefined)
		{ this.pointsCloudSsao = true; }
		
		if (this.pointsCloudSsao)
		{ this.pointsCloudSsao = false; }
		else
		{ this.pointsCloudSsao = true; }
	}
	else if (key === 80) // 80 = 'p'.***
	{
		var projectId = "AutonomousVehicle";
		var dataKey = "AutonomousBus_0";
			
		// Do a test.***
		//var projectId = "3ds.json";
		//var dataKey = "GyeomjaeJeongSeon_del";
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		node.data.isTrailRender = true; // test.***
		
		var geoLocDataManager = node.getNodeGeoLocDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
		var geoCoords = geoLocData.getGeographicCoords();
		var currLon = geoCoords.longitude;
		var currLat = geoCoords.latitude;
		var currAlt = geoCoords.altitude;

		// Move a little.***
		var latitude = currLat + 0.0002 * 10*(Math.random()*2-1);
		var longitude = currLon + 0.0002 * 10*(Math.random()*2-1);
		var elevation = currAlt + 10.0 * 10*(Math.random()*2-1);
		
		
		var heading;
		var pitch;
		var roll;
		var durationTimeInSeconds = 10;
		this.changeLocationAndRotation(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, durationTimeInSeconds);
	}
	else if (key === 84) // 84 = 't'.***
	{
		// do test.***
		var excavation = this.modeler.getExcavation();
		if (excavation !== undefined)
		{
			excavation.makeExtrudeObject(this);
		}
		
		var tunnel = this.modeler.getTunnel();
		if (tunnel !== undefined)
		{
			tunnel.getProfileGeographicCoordsList(); // executed this only to create the profile.*** TEST.***
			tunnel.makeMesh(this);
			
		}
	}
	else if (key === 89) // 89 = 'y'.***
	{
		if (this.magoMode === undefined)
		{ this.magoMode = CODE.magoMode.NORMAL; }
		
		if (this.magoMode === CODE.magoMode.NORMAL)
		{ this.magoMode = CODE.magoMode.DRAWING; }
		else if (this.magoMode === CODE.magoMode.DRAWING)
		{
			this.magoMode = CODE.magoMode.NORMAL;
			this.modeler.mode = CODE.modelerMode.INACTIVE;
		}
	}
	
	
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 */
MagoManager.prototype.mouseActionLeftClick = function(mouseX, mouseY) 
{
	// Note: the "mouseActionLeftClick" runs after "mouseActionLeftDown" & "mouseActionLeftUp".***
	//--------------------------------------------------------------------------------------------
	
	//if (this.currentFrustumIdx === 0)
	//	var hola = 0;
	//else if (this.currentFrustumIdx > 0)
	//	var hola = 0;
	
	// Test for drawing mode.******************************************************************
	//this.magoMode = CODE.magoMode.DRAWING;
	if (this.magoMode === CODE.magoMode.DRAWING)// then process to draw.***
	{
		// Test code.***
		if (this.modeler === undefined)
		{ this.modeler = new Modeler(); }
		//	CODE.modelerMode = {
		//	"INACTIVE"                 : 0,
		//	"DRAWING_POLYLINE"         : 1,
		//	"DRAWING_GEOGRAPHICPOINTS" : 2,
		//};
			
		//this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_EXCAVATIONPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_TUNNELPOINTS;
		this.modeler.mode = CODE.modelerMode.DRAWING_STATICGEOMETRY;
		
		// Calculate the geographicCoord of the click position.****
		var geoCoord;
		var strWorldPoint;
		if (this.configInformation.geo_view_library === Constant.CESIUM)
		{
			var camera = this.scene.frameState.camera;
			var scene = this.scene;
			var ray = camera.getPickRay(new Cesium.Cartesian2(mouseX, mouseY));
			strWorldPoint = scene.globe.pick(ray, scene);
		}
		else 
		{
			var mouseAction = this.sceneState.mouseAction;
			strWorldPoint = mouseAction.strWorldPoint;
		}
		geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
		geoCoord.absolutePoint = strWorldPoint;
		
		var modelerMode = this.modeler.mode;
		if (this.modeler.mode === CODE.modelerMode.DRAWING_PLANEGRID && this.modeler.planeGrid === undefined)
		{
			// Calculate the click position and create the planeGrid geoLocation.***
			this.modeler.createPlaneGrid();
			this.modeler.planeGrid.makeVbo(this.vboMemoryManager);
			
			if (this.modeler.planeGrid.geoLocDataManager === undefined)
			{ this.modeler.planeGrid.geoLocDataManager = new GeoLocationDataManager(); }
			
			var geoLocDataManager = this.modeler.planeGrid.geoLocDataManager;
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, undefined, undefined, undefined, geoLocData, this);
			return;
		}
		
		// For each "click" add geographicPoint to the modeler's geographicPointsList.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, undefined, undefined, undefined, geoLocData, this);
			
			var geoCoordsList = this.modeler.getGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
		}
		
		// Excavation.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_EXCAVATIONPOINTS)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, undefined, undefined, undefined, geoLocData, this);
			
			var excavation = this.modeler.getExcavation();
			var geoCoordsList = excavation.getGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
			geoCoordsList.makeLines(this);
		}
		
		// Tunnel.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_TUNNELPOINTS)
		{
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, undefined, undefined, undefined, geoLocData, this);
			
			var tunnel = this.modeler.getTunnel();
			var geoCoordsList = tunnel.getPathGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
			geoCoordsList.makeLines(this);
		}
		
		// StaticGeometries.***
		else if (this.modeler.mode === CODE.modelerMode.DRAWING_STATICGEOMETRY)
		{
			// create a "node" & insert into smartTile.***
			var projectId = "AutonomousVehicle";
			var attributes = {
				"isPhysical"         : true,
				"nodeType"           : "TEST",
				"isReference"        : true,
				"projectFolderName"  : "staticModels",
				"buildingFolderName" : "F4D_AutonomousBus",
				"heading"            : 0,
				"pitch"              : 0,
				"roll"               : 0};
				/*
			var attributes = {
				"isPhysical"         : true,
				"nodeType"           : "TEST",
				"isReference"        : true,
				"projectFolderName"  : "3ds",
				"buildingFolderName" : "F4D_GyeomjaeJeongSeon_del",
				"heading"            : 0,
				"pitch"              : 0,
				"roll"               : 0};
				
			attributes.pitch = 90.0;
			*/
			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, attributes.heading, attributes.pitch, attributes.roll, geoLocData, this);
			
			// test to insert an staticGeometry AutonomousBus.***
			var staticGeometryFilePath = "";

			var nodesMap = this.hierarchyManager.getNodesMap(projectId, undefined);
			var existentNodesCount = Object.keys(nodesMap).length;
			var buildingId = "AutonomousBus_" + existentNodesCount.toString();
			
			// Do a test.***
			//var projectId = "3ds.json";
			//buildingId = "GyeomjaeJeongSeon_del";
		
			var node = this.hierarchyManager.newNode(buildingId, projectId, undefined);
			
			// Now, create the geoLocdataManager of node.***
			node.data.attributes = attributes;
			node.data.geographicCoord = geoCoord;
			node.data.rotationsDegree = new Point3D(attributes.pitch, attributes.roll, attributes.heading);
			node.data.geoLocDataManager = geoLocDataManager;
			node.data.rotationsDegree.set(attributes.pitch, attributes.roll, attributes.heading);
			var geoLocDataManager = node.data.geoLocDataManager;
			var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
			
			geoLocData.setRotationHeadingPitchRoll(attributes.heading, attributes.pitch, attributes.roll);
			
			// Now, insert node into smartTile.***
			var targetDepth = this.smartTileManager.targetDepth;
			this.smartTileManager.putNode(targetDepth, node, this);
		}
		
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
	
	MagoWorld.updateMouseStartClick(mouseX, mouseY, this);
	/*
	// Test.**********************************************************************************************************************
	var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		if (currObjectSelected)
		{
			// check if is a cuttingPlane.***
			if (currObjectSelected instanceof CuttingPlane)
			{
				var mouseAction = this.sceneState.mouseAction;
				mouseAction.claculateStartPositionsAux(this);
			}
		}
	}
	*/
	// End test.-------------------------------------------------------------------------------------------------------------------
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
	
	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	
	// distinguish 2 modes.******************************************************
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // blocks move.***
	{
		if (this.buildingSelected !== undefined) 
		{
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
			// Display geoLocationData while moving building.***
			var nodeOwner = this.buildingSelected.nodeOwner;
			if (nodeOwner === undefined)
			{ return; }

			var geoLocDataManager = nodeOwner.data.geoLocDataManager;
			if (geoLocDataManager === undefined)
			{ return; }

			var geoLocation = geoLocDataManager.getGeoLocationData(0);
			if (geoLocation === undefined)
			{ return; }

			var geographicCoords = geoLocation.geographicCoord;
			if (geographicCoords === undefined)
			{ return; }
			
			movedDataCallback(	MagoConfig.getPolicy().geo_callback_moveddata,
				nodeOwner.data.projectId,
				nodeOwner.data.nodeId,
				null,
				geographicCoords.latitude,
				geographicCoords.longitude,
				geographicCoords.altitude,
				geoLocation.heading,
				geoLocation.pitch,
				geoLocation.roll);
								
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
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS) 
	{
		var currSelected = this.selectionManager.getSelectedGeneral();
		if (currSelected)
		{
			var className = currSelected.constructor.name;
			if (className === "GeographicCoord")
			{
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
		}
	}
	else
	{
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
		if (this.selectionManager.currentNodeSelected === undefined)
		{ return; }
		
		var geoLocDataManager = this.selectionManager.currentNodeSelected.getNodeGeoLocDataManager();
		var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
	
		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			this.selObjMovePlane = new Plane();
			// create a local XY plane.
			// find the pixel position relative to building.
			var pixelPosWorldCoord = new Point3D();
			pixelPosWorldCoord = this.calculatePixelPositionWorldCoord(gl, this.mouse_x, this.mouse_y, pixelPosWorldCoord);
			var tMatrixInv = geoLocationData.getTMatrixInv();
			var pixelPosBuildingCoord = tMatrixInv.transformPoint3D(pixelPosWorldCoord, pixelPosBuildingCoord);
			
			this.selObjMovePlane.setPointAndNormal(pixelPosBuildingCoord.x, pixelPosBuildingCoord.y, pixelPosBuildingCoord.z,    0.0, 0.0, 1.0); 
		}

		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.lineSC = this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***

		// transform world_ray to building_ray.***
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();
		
		var geoLocMatrixInv = geoLocationData.getGeoLocationMatrixInv();
		camPosBuilding = geoLocMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		this.pointSC = geoLocMatrixInv.rotatePoint3D(this.lineSC.direction, this.pointSC);
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

			this.changeLocationAndRotationNode(this.selectionManager.currentNodeSelected, newlatitude, newLongitude, undefined, undefined, undefined, undefined);
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
		
		var geoLocDataManager = this.selectionManager.currentNodeSelected.getNodeGeoLocDataManager();

		// world ray = camPos + lambda*camDir.***
		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC); // rayWorldSpace.***
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		var camPosBuilding = new Point3D();
		var camDirBuilding = new Point3D();
		var tMatrixInv = buildingGeoLocation.getTMatrixInv();
		camPosBuilding = tMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
		camDirBuilding = tMatrixInv.rotatePoint3D(this.lineSC.direction, camDirBuilding);
	
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
		
		var projectId = this.selectionManager.currentNodeSelected.data.projectId;
		var data_key = this.selectionManager.currentNodeSelected.data.nodeId;
		var objectIndexOrder = this.objectSelected._id;
		
		MagoConfig.deleteMovingHistoryObject(projectId, data_key, objectIndexOrder);
		this.objectMoved = true; // this provoques that on leftMouseUp -> saveHistoryObjectMovement
		
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS) 
	{
		// Move the current geographic point selected.***
		var currSelected = this.selectionManager.getSelectedGeneral();
		if (currSelected)
		{
			var className = currSelected.constructor.name;
			if (className === "GeographicCoord")
			{
				var geoLocDataManager = currSelected.getGeoLocationDataManager();
				var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
				
				var geoCoord;
				var strWorldPoint;
				if (this.configInformation.geo_view_library === Constant.CESIUM)
				{
					var camera = this.scene.frameState.camera;
					var scene = this.scene;
					var ray = camera.getPickRay(new Cesium.Cartesian2(this.mouse_x, this.mouse_y));
					strWorldPoint = scene.globe.pick(ray, scene);
					geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
				}
				else 
				{
					var mouseAction = this.sceneState.mouseAction;
					strWorldPoint = mouseAction.strWorldPoint;
					geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
				}
				
				currSelected.setLonLatAlt(geoCoord.longitude, geoCoord.latitude, undefined); // no set altitude.***
				
				var geoLocDataManager = currSelected.getGeoLocationDataManager();
				var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
				geoLocData = ManagerUtils.calculateGeoLocationData(currSelected.longitude, currSelected.latitude, currSelected.altitude, undefined, undefined, undefined, geoLocData, this);
				
				// Now, must check the moved object's owner.***
				var owner = currSelected.owner;
				if (owner)
				{
					// 1rst, check if is a geoCoordsList.***
					if (owner.constructor.name === "GeographicCoordsList")
					{
						owner.makeLines(this);
					}
					
					var owner2 = owner.owner;
					if (owner2)
					{
						if (owner2.constructor.name === "Excavation")
						{
							owner2.remakeExtrudeObject(this);
						}
						else if (owner2.constructor.name === "Tunnel")
						{
							owner2.remakeMesh(this);
						}
					}
				}
			}
		}

	}
	else
	{
		if (this.weatherStation)
		{
			// Test. Check if there are cuttingPlanes to move.***
			var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
			if (selGeneralObjects)
			{
				var currObjectSelected = selGeneralObjects.currentSelected;
				if (currObjectSelected)
				{
					// check if is a cuttingPlane.***
					if (currObjectSelected instanceof CuttingPlane)
					{
						// Move the cuttingPlane.***
						var geoLocDataManager = currObjectSelected.geoLocDataManager;
						var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
						
						var mouseAction = this.sceneState.mouseAction;
						
						// New Test.*******************************************************
						var camRay = this.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, undefined);
						var strWorldPoint = mouseAction.strWorldPointAux; // original.***
						////var strWorldPoint = mouseAction.strWorldPoint;
						if (strWorldPoint)
						{
							var strEarthRadius = strWorldPoint.getModul();
							
							var curWorldPosAux;
							curWorldPosAux = this.globe.intersectionLineWgs84(camRay, curWorldPosAux, strEarthRadius);
							if (curWorldPosAux)
							{
								var curWorldPointAux = new Point3D(curWorldPosAux[0], curWorldPosAux[1], curWorldPosAux[2]);
								var curLocation = ManagerUtils.pointToGeographicCoord(curWorldPointAux, undefined, this);
								var strLocation = mouseAction.strLocationAux;
								var objectGeoLoc = geoLocationData.geographicCoord;
								
								var difLocation = new GeographicCoord();
								difLocation.setLonLatAlt(curLocation.longitude - strLocation.longitude, curLocation.latitude - strLocation.latitude, curLocation.altitude - strLocation.altitude);
								var newLongitude = objectGeoLoc.longitude + difLocation.longitude;
								var newlatitude = objectGeoLoc.latitude + difLocation.latitude;
								
								geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
								mouseAction.strLocationAux.setLonLatAlt(curLocation.longitude, curLocation.latitude, curLocation.altitude);
							}
						}
					}
				}
			}
		}
	}
};

MagoManager.prototype.test_renderDepth_objectSelected = function(currObjectSelected) 
{
	// Test function. Provisional.***
	// Test function. Provisional.***
	// Test function. Provisional.***
	// Test. Render depth only for the selected object.***************************
	var gl = this.sceneState.gl;
	
	if (this.depthFboAux === undefined)
	{
		this.depthFboAux = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	}
	if (this.sceneState.drawingBufferWidth[0] !== this.depthFboAux.width[0] || this.sceneState.drawingBufferHeight[0] !== this.depthFboAux.height[0])
	{
		// move this to onResize.***
		this.depthFboAux.deleteObjects(gl);
		this.depthFboAux = new FBO(gl, this.sceneState.drawingBufferWidth, this.sceneState.drawingBufferHeight);
	}
	this.depthFboAux.bind(); 
	
	if (this.isFarestFrustum())
	{
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	gl.disable(gl.BLEND);
	
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	// Now, renderDepth the selected object. Fix the frustumFar for adequate precision on depthPacking.***
	var shader = this.postFxShadersManager.getShader("modelRefDepth"); 
	shader.useProgram();
	shader.bindUniformGenerals();
	shader.enableVertexAttribArray(shader.position3_loc);
		
	var geoLocDataManager = currObjectSelected.geoLocDataManager;
	var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
		
	// test: in depth, set frustumFar = 1000000000(100M).***
	var frustumFarLoc = shader.uniformsMapGeneral.frustumFar.uniformLocation;
	gl.uniform1f(frustumFarLoc, new Float32Array([100000000.0]));
			
	var renderType = 0;
	//this.weatherStation.test_renderCuttingPlanes(this, renderType);
			
	geoLocationData.bindGeoLocationUniforms(gl, shader);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	currObjectSelected.render(this, shader, renderType);
			
	
	this.depthFboAux.unbind(); 
	// End test.------------------------------------------------------------------
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
MagoManager.prototype.getRenderablesDetailedNeoBuildingAsimetricVersion = function(gl, node, globalVisibleObjControlerOctrees, lod) 
{
	var data = node.data;
	var neoBuilding = data.neoBuilding;
	var currentLod = data.currentLod;
	
	// chaek if the neoBuilding has availableLod_0.***
	if (neoBuilding === undefined || neoBuilding.octree === undefined) { return false; }
	
	// Check if for the current lod, the building is modelRefType.***
	var lodBuildingData = neoBuilding.getLodBuildingData(data.currentLod);
	if (lodBuildingData === undefined)
	{ return false; }
	
	if (!lodBuildingData.isModelRef)
	{ return true; } // return true, bcos the caller pops the building from the "visibleObjControlerNodes" if return false.***

	var rootGeoLocDataManager = node.getNodeGeoLocDataManager();
	var rootGeoLoc = rootGeoLocDataManager.getCurrentGeoLocationData();
	
	//var nodeGeoLocation = geoLocDataManager.getCurrentGeoLocationData(); // original.***
	var nodeGeoLocation = rootGeoLocDataManager.getCurrentGeoLocationData();
	if (nodeGeoLocation === undefined)
	{ return false; }

	// Create if necessary, the visibleObjectsControler of the node.***
	if (data.currentVisibleOctreesControler === undefined)
	{ data.currentVisibleOctreesControler = new VisibleObjectsController(); }	

	var distLod0 = this.magoPolicy.getLod0DistInMeters();
	var distLod1 = this.magoPolicy.getLod1DistInMeters();
	var distLod2 = this.magoPolicy.getLod2DistInMeters();
	var distLod3 = this.magoPolicy.getLod3DistInMeters();
	var distLod4 = this.magoPolicy.getLod4DistInMeters();
	var distLod5 = this.magoPolicy.getLod5DistInMeters();

	var find = false;
	if (data.myCameraRelative === undefined)
	{ data.myCameraRelative = new Camera(); }
	
	data.myCameraRelative.frustum.copyParametersFrom(this.myCameraSCX.bigFrustum);
	data.myCameraRelative = nodeGeoLocation.getTransformedRelativeCamera(this.sceneState.camera, data.myCameraRelative);
	//var isCameraInsideOfBuilding = neoBuilding.isCameraInsideOfBuilding(data.myCameraRelative.position.x, data.myCameraRelative.position.y, data.myCameraRelative.position.z); // old.***
	
	data.currentVisibleOctreesControler.clear();
	
	if (lod === 2)
	{
		// In this case is not necessary calculate the frustum planes.
		neoBuilding.octree.extractLowestOctreesByLOD(data.currentVisibleOctreesControler, globalVisibleObjControlerOctrees, this.boundingSphere_Aux,
			data.myCameraRelative.position, distLod0, distLod1, distLod5);
		find = true;
	}
	else 
	{
		// Must calculate the frustum planes.
		data.myCameraRelative.calculateFrustumsPlanes();
		
		// 1rst, check if there are octrees very close.
		var frustum0 = data.myCameraRelative.bigFrustum;
		find = neoBuilding.octree.getFrustumVisibleLowestOctreesByLOD(	frustum0, data.currentVisibleOctreesControler, globalVisibleObjControlerOctrees, this.boundingSphere_Aux,
			data.myCameraRelative.position, distLod0, distLod1, distLod2*100);
	}

	if (!find) 
	{
		// If the building is far to camera, then delete it.
		if (data.distToCam > 100) // default: 60.***
		{ this.processQueue.putNodeToDeleteModelReferences(node, 1); }
		
		// TODO: must check if some part of the building is in parseQueue.***
		return false;
	}
	else 
	{
		this.processQueue.eraseNodeToDeleteModelReferences(node);
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
	var gl = this.sceneState.gl;
	
	
	
	
	// 1rst, manage deleting queue.***************
	this.processQueue.manageDeleteQueue(this);
	
	
	
	// 2nd, parse pendent data.**********************************************************************************
	// is desirable to parse octrees references ordered by the current eye distance.
	// in the "visibleObjControlerOctrees" there are the octrees sorted by distance, so must use it.
	this.parseQueue.initCounters();
	
	// parse octrees lod0 & lod1 references.***
	this.parseQueue.parseArrayOctreesLod0References(gl, this.visibleObjControlerOctrees.currentVisibles0, this);
	this.parseQueue.parseArrayOctreesLod0References(gl, this.visibleObjControlerOctrees.currentVisibles1, this);
	
	

	// parse octrees lod0 & lod1 models.***
	this.parseQueue.parseArrayOctreesLod0Models(gl, this.visibleObjControlerOctrees.currentVisibles0, this);
	this.parseQueue.parseArrayOctreesLod0Models(gl, this.visibleObjControlerOctrees.currentVisibles1, this);
	
	
	
	// parse octrees lod2 (lego).***
	this.parseQueue.parseArrayOctreesLod2Legos(gl, this.visibleObjControlerOctrees.currentVisibles2, this);

	// parse PCloud octree.***
	this.parseQueue.parseArrayOctreesPCloud(gl, this.visibleObjControlerOctrees.currentVisiblesAux, this);
	this.parseQueue.parseArrayOctreesPCloudPartition(gl, this.visibleObjControlerOctrees.currentVisiblesAux, this);

	// parse skin-lego.***
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles0, this);
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles2, this);
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles3, this);
	
	

	// parse TinTerrain.***
	var tinTerrain;
	var parsedsCount = 0;
	for (var key in this.parseQueue.tinTerrainsToParseMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.parseQueue.tinTerrainsToParseMap, key))
		{
			var tinTerrain = this.parseQueue.tinTerrainsToParseMap[key];
			if (tinTerrain !== undefined)
			{
				if (this.parseQueue.eraseTinTerrainToParse(tinTerrain)) // check if is inside of the queue to parse.***
				{
					tinTerrain.parseData(tinTerrain.dataArrayBuffer);
					parsedsCount++;
				}
			}
			
			if (parsedsCount > 1)
			{ break; }
		}
	}
	/*
	var visibleTilesArray = this.tinTerrainManager.visibleTilesArray;
	var visiblesTilesCount = visibleTilesArray.length;
	for(var i=0; i<visiblesTilesCount; i++)
	{
		tinTerrain = visibleTilesArray[i];
		if (tinTerrain !== undefined)
		{
			if (this.parseQueue.eraseTinTerrainToParse(tinTerrain)) // check if is inside of the queue to parse.***
			{
				tinTerrain.parseData(tinTerrain.dataArrayBuffer);
			}
		}
	}
	*/
	
	
};

/**
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistancePointsCloudType = function(gl, globalVisibleObjControlerOctrees, fileRequestExtraCount) 
{
	var lod2DataInQueueCount = Object.keys(this.loadQueue.lod2PCloudDataMap).length;
	if (lod2DataInQueueCount > 5)
	{ return; }
	
	var extraCount = fileRequestExtraCount;
		
	var currentVisibles = globalVisibleObjControlerOctrees.getAllVisibles();
	//var currentVisibles = globalVisibleObjControlerOctrees.currentVisiblesAux;

	if (currentVisibles === undefined)
	{ return; }

	var geometryDataPath = this.readerWriter.geometryDataPath;
	var projectFolderName;
	var neoBuilding;
	var buildingFolderName;

	// LOD2
	// Check if the lod2lowestOctrees must load and parse data
	var lowestOctree;
	for (var i=0, length = currentVisibles.length; i<length; i++) 
	{	
		if (this.fileRequestControler.isFullPlus(extraCount))	
		{ return; }
		
		lowestOctree = currentVisibles[i];
		
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
	
		var projectDataType = neoBuilding.metaData.projectDataType;
		
		if (projectDataType !== undefined && projectDataType === 4) // projectDataType = 4 (pointsCloudType building).***
		{
			projectFolderName = neoBuilding.projectFolderName;
			buildingFolderName = neoBuilding.buildingFileName;

			if (lowestOctree.lego.fileLoadState === CODE.fileLoadState.READY)
			{
				var subOctreeNumberName = lowestOctree.octree_number_name.toString();
				var references_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/References";
				var filePathInServer = references_folderPath + "/" + subOctreeNumberName + "_Ref";
				this.loadQueue.putLod2PCloudData(lowestOctree, filePathInServer, undefined, undefined, 0);

			}
			
			if (Object.keys(this.loadQueue.lod2PCloudDataMap).length > 5)
			{ return; }
		}
	} 
};

/**
 * LOD0, LOD1 에 대한 F4D ModelData, ReferenceData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistance = function(gl, globalVisibleObjControlerOctrees) 
{
	if (this.readerWriter.referencesList_requested > 5)
	{ return; }

	// LOD0 & LOD1
	// Check if the lod0lowestOctrees, lod1lowestOctrees must load and parse data
	var currentVisibleOctrees = [].concat(globalVisibleObjControlerOctrees.currentVisibles0, globalVisibleObjControlerOctrees.currentVisibles1);
	var lowestOctree;
	this.thereAreUrgentOctrees = false;

	// now, prepare the ocree normally.
	var maxFilesLoad = 2;
	var filesLoadCounter = 0;
	
	for (var i=0, length = currentVisibleOctrees.length; i<length; i++) 
	{
		lowestOctree = currentVisibleOctrees[i];
		var neoBuilding = lowestOctree.neoBuildingOwner;
		var version = neoBuilding.getHeaderVersion();
		
		
		// 1rst, check if lod2 is loaded. If lod2 is no loaded yet, then load first lod2.***
		if (this.readerWriter.octreesSkinLegos_requested < 5)
		{
			if (lowestOctree.lego === undefined || !lowestOctree.lego.isReadyToRender())
			{
				lowestOctree.prepareSkinData(this);
			}
		}

		if (this.readerWriter.referencesList_requested < 5)
		{
			if (lowestOctree.neoReferencesMotherAndIndices === undefined || !lowestOctree.neoReferencesMotherAndIndices.isReadyToRender())
			{
				lowestOctree.prepareModelReferencesListData(this);
			}
			else 
			{
				if (version === "0.0.2")
				{
					var blocksList = lowestOctree.neoReferencesMotherAndIndices.blocksList; 
					if (blocksList)
					{ blocksList.prepareData(this, lowestOctree); }
				}
			}
		}
		

		if (this.readerWriter.referencesList_requested > 5)
		{ return; }
		
		if (filesLoadCounter > maxFilesLoad)
		{ return; }
	}
	
	
};

/**
 * LOD2 에 대한 F4D LegoData 를 요청
 * 
 * @param {any} gl 
 * @param {any} scene 
 * @param {any} neoBuilding 
 */
MagoManager.prototype.prepareVisibleOctreesSortedByDistanceLOD2 = function(gl, currentVisibles) 
{
	if (this.readerWriter.octreesSkinLegos_requested > 5)
	{ return; }

	if (currentVisibles === undefined)
	{ return; }

	// LOD2
	// Check if the lod2lowestOctrees must load and parse data
	var lowestOctree;
	for (var i=0, length = currentVisibles.length; i<length; i++) 
	{	
		lowestOctree = currentVisibles[i];
		lowestOctree.prepareSkinData(this);

		if (this.readerWriter.octreesSkinLegos_requested > 5)
		{ return; }
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
		
		geoLocdataManager = rootNode.getNodeGeoLocDataManager();
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
				if (Object.prototype.hasOwnProperty.call(moveHistoryMap, key)) 
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
			var data = node.data;
			//neoBuilding = node.data.neoBuilding;
			for (var key in colorChangedHistoryMap)
			{
				if (Object.prototype.hasOwnProperty.call(colorChangedHistoryMap, key)) 
				{
					var changeHistory = colorChangedHistoryMap[key];
					if (changeHistory.objectId === null || changeHistory.objectId === undefined || changeHistory.objectId === "" )
					{
						if (changeHistory.property === null || changeHistory.property === undefined || changeHistory.property === "" )
						{
							// change color for all node.
							data.isColorChanged = true;
							if (data.aditionalColor === undefined)
							{ data.aditionalColor = new Color(); }
							
							data.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
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
									data.isColorChanged = true;
									if (data.aditionalColor === undefined)
									{ data.aditionalColor = new Color(); }
									
									data.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
								}
							}
						}
					}
					else 
					{
						// change color for an object.
						neoBuilding = node.data.neoBuilding;
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
	}
	
	var allColorHistoryMap = MagoConfig.getAllColorHistory();
	if (allColorHistoryMap)
	{
		for (var key in allColorHistoryMap) 
		{
			if (Object.prototype.hasOwnProperty.call(allColorHistoryMap, key))
			{
				var colorChangedHistoryMap = allColorHistoryMap[key];
				//for (var colorChangedHistoryMap of allColorHistoryMap.values()) 
				//{
				// now check nodes that is no physical.
				for (var key2 in colorChangedHistoryMap) 
				{
					if (Object.prototype.hasOwnProperty.call(colorChangedHistoryMap, key2))
					{
						var changeHistoryMap = colorChangedHistoryMap[key2];
						//for (var changeHistoryMap of colorChangedHistoryMap.values()) 
						//{
						for (var key3 in changeHistoryMap) 
						{
							if (Object.prototype.hasOwnProperty.call(changeHistoryMap, key3))
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
											var data = aNode2.data;
											//neoBuilding = aNode2.data.neoBuilding;
											if (data)
											{
												data.isColorChanged = true;
												if (data.aditionalColor === undefined)
												{ data.aditionalColor = new Color(); }
												
												data.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
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
											var data = aNode2.data;
											//neoBuilding = aNode2.data.neoBuilding;
											if (data)
											{
												if (aNode2.data.attributes[propertyKey] !== undefined && aNode2.data.attributes[propertyKey].toString() === propertyValue)
												{
													data.isColorChanged = true;
													if (data.aditionalColor === undefined)
													{ data.aditionalColor = new Color(); }
													
													data.aditionalColor.setRGB(changeHistory.rgbColor[0], changeHistory.rgbColor[1], changeHistory.rgbColor[2]);
												}
											}
										}
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

MagoManager.prototype.renderFilter = function() 
{
	var gl = this.sceneState.gl;
	
	if (this.screenQuad === undefined)
	{
		var sceneState = this.sceneState;
		var camera = this.myCameraSCX;
		var frustum = camera.bigFrustum;
		
		var fovyRad = this.sceneState.camera.frustum.fovyRad;
		var aspectRatio = frustum.aspectRatio[0];
		var halfHeight = frustum.tangentOfHalfFovy[0];
		var halfWidth = halfHeight * aspectRatio;
		
		var lb = new Point3D(-halfWidth, -halfHeight, -1.0); // leftBottom.***
		var rb = new Point3D(halfWidth, -halfHeight, -1.0); // rightBottom.***
		var ru = new Point3D(halfWidth, halfHeight, -1.0); // rightUp.***
		var lu = new Point3D(-halfWidth, halfHeight, -1.0); // leftUp.***
	
		var data = new Float32Array([lb.x, lb.y, lb.z,   rb.x, rb.y, rb.z,   lu.x, lu.y, lu.z,   
			rb.x, rb.y, rb.z,   ru.x, ru.y, ru.z,   lu.x, lu.y, lu.z]);
		this.screenQuad = FBO.createBuffer(gl, data);
	}
	
	var shaderName = "filterSilhouette"; 
	var currentShader = this.postFxShadersManager.getShader(shaderName); 
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao default.***

	if (this.noiseTexture === undefined) 
	{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }
	
	gl.enable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	
	currentShader.bindUniformGenerals();
	gl.uniform1i(currentShader.textureFlipYAxis_loc, this.sceneState.textureFlipYAxis);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
	gl.activeTexture(gl.TEXTURE2); 
	//gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
	//currentShader.last_tex_id = this.textureAux_1x1;
	
	// do render.***
	gl.bindBuffer(gl.ARRAY_BUFFER, this.screenQuad);
	gl.vertexAttribPointer(currentShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	//gl.activeTexture(gl.TEXTURE2);
	//gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	
	currentShader.disableVertexAttribArrayAll();
	gl.useProgram(null);
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
	
	if (ssao_idx === 0 ) 
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
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		if (this.modeler !== undefined)
		{
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao default.***
			
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
			this.modeler.render(this, currentShader, renderType);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);

		}
		
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
			gl.enable(gl.BLEND);
			currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			var bApplySsao = true;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (this.noiseTexture === undefined) 
			{ this.noiseTexture = genNoiseTextureRGBA(gl, 4, 4, this.pixels); }
			
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
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
			
			bApplySsao = false;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 

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
				var geoLocDataManager = node.getNodeGeoLocDataManager();
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
				
				buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

				gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
				gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays);
				gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
				gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
				
				// do the colorCoding render.***
				
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
				var geoLocDataManager = node.getNodeGeoLocDataManager();
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
					
					buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

					gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
					gl.uniformMatrix4fv(currentShader.ModelViewMatrixRelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays);
					gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
					gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);
					
					// do the colorCoding render.***
					
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
				//var geoLocDataManager = node.getNodeGeoLocDataManager();
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
		/*
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
		*/
		
		// PointsCloud.****************************************************************************************
		// PointsCloud.****************************************************************************************
		var nodesPCloudCount = this.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			if (this.pointsCloudSsao === undefined)
			{ this.pointsCloudSsao = true; }
			
			if (this.pointsCloudSsao)
			{ currentShader = this.postFxShadersManager.getShader("pointsCloudSsao"); }
			else
			{ currentShader = this.postFxShadersManager.getShader("pointsCloud"); }
			currentShader.useProgram();
			
			currentShader.resetLastBuffersBinded();

			currentShader.enableVertexAttribArray(currentShader.position3_loc);
			currentShader.enableVertexAttribArray(currentShader.color4_loc);
			
			currentShader.bindUniformGenerals();
			
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);
			
			// Test to load pCloud.***
			if (this.visibleObjControlerPCloudOctrees === undefined)
			{ this.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			this.visibleObjControlerPCloudOctrees.clear();

			this.renderer.renderNeoBuildingsPCloud(gl, this.visibleObjControlerNodes.currentVisiblesAux, this, currentShader, renderTexture, ssao_idx); // lod0.***
			currentShader.disableVertexAttribArrayAll();
			
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
		
		

	}
	
	currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
	currentShader.disableVertexAttribArrayAll();
	
	currentShader = this.postFxShadersManager.getShader("modelRefColorCoding");  // color selection shader.***
	currentShader.disableVertexAttribArrayAll();
	
	currentShader = this.postFxShadersManager.getModelRefSilhouetteShader(); // silhouette shader.***
	currentShader.disableVertexAttribArrayAll();

	
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);	
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.getObjectLabel = function() 
{
	if (this.canvasObjectLabel === undefined)
	{
		this.canvasObjectLabel = document.getElementById("objectLabel");
		if (this.canvasObjectLabel === undefined)
		{ return; }

		var magoDiv = document.getElementById('magoContainer');
		var offsetLeft = magoDiv.offsetLeft;
		var offsetTop = magoDiv.offsetTop;
		var offsetWidth = magoDiv.offsetWidth;
		var offsetHeight = magoDiv.offsetHeight;
		
		this.canvasObjectLabel.style.opacity = 1.0;
		this.canvasObjectLabel.width = this.sceneState.drawingBufferWidth;
		this.canvasObjectLabel.height = this.sceneState.drawingBufferHeight;
		var canvasStyleLeft = offsetLeft.toString()+"px";
		var canvasStyleTop = offsetTop.toString()+"px";
		this.canvasObjectLabel.style.left = canvasStyleLeft;
		this.canvasObjectLabel.style.top = canvasStyleTop;
		this.canvasObjectLabel.style.position = "absolute";
		
		this.canvasObjectLabel.style.opacity = 1.0;
		this.canvasObjectLabel.width = this.sceneState.drawingBufferWidth;
		this.canvasObjectLabel.height = this.sceneState.drawingBufferHeight;
		var ctx = this.canvasObjectLabel.getContext("2d");
		//ctx.strokeStyle = 'SlateGrey';
		//ctx.strokeStyle = 'MidnightBlue';
		ctx.strokeStyle = 'DarkSlateGray'; 
		//ctx.fillStyle= "white";
		ctx.fillStyle= "PapayaWhip";
		ctx.lineWidth = 4;
		ctx.font = "20px Arial";
		ctx.textAlign = 'center';
		//ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.save();
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		var lineHeight = ctx.measureText("M").width * 1.1;
	}
	
	return this.canvasObjectLabel;
};

/**
 * Draw building names on scene.
 */
MagoManager.prototype.drawCCTVNames = function(cctvArray) 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	// lod2.
	var gl = this.sceneState.gl;
	var node;
	var nodeRoot;
	var geoLocDataManager;
	var geoLoc;
	var neoBuilding;
	var worldPosition;
	var screenCoord;
	var cctv;
	
	var cctvCount = cctvArray.length;
	for (var i=0; i<cctvCount; i++)
	{
		cctv = cctvArray[i];
		geoLoc = cctv.geoLocationData;
		worldPosition = geoLoc.position;
		screenCoord = this.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord);
		//screenCoord.x += 250;
		//screenCoord.y += 150;
		
		if (screenCoord.x >= 0 && screenCoord.y >= 0)
		{
			ctx.font = "13px Arial";
			ctx.strokeText(cctv.name, screenCoord.x, screenCoord.y);
			ctx.fillText(cctv.name, screenCoord.x, screenCoord.y);
		}
		
	}

	ctx.restore();
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

MagoManager.prototype.renderBoundingBoxesNodes = function(gl, nodesArray, color, bRenderLines) 
{
	if (nodesArray === undefined || nodesArray.length === 0)
	{ return; }
	
	if (this.unitaryBoxSC === undefined)
	{
		this.unitaryBoxSC = new BoxAux();
		this.unitaryBoxSC.makeAABB(1.0, 1.0, 1.0); // make a unitary box.***
		this.unitaryBoxSC.vBOVertexIdxCacheKey = this.unitaryBoxSC.triPolyhedron.getVBOArrayModePosNorCol(this.unitaryBoxSC.vBOVertexIdxCacheKey, this.vboMemoryManager);
	}
	
	var node;
	var currentShader = this.postFxShadersManager.getTriPolyhedronShader(); // box ssao.***
	var shaderProgram = currentShader.program;
	gl.enable(gl.BLEND);
	gl.frontFace(gl.CCW);
	gl.useProgram(shaderProgram);
	currentShader.disableVertexAttribArrayAll();

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, this.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, this.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, this.sceneState.modelViewMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, this.sceneState.projectionMatrix._floatArrays);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, this.sceneState.encodedCamPosHigh);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, this.sceneState.encodedCamPosLow);

	gl.uniform1f(currentShader.near_loc, this.sceneState.camera.frustum.near);
	gl.uniform1f(currentShader.far_loc, this.sceneState.camera.frustum.far);
	
	gl.uniform1i(currentShader.bApplySsao_loc, false);

	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, this.sceneState.normalMatrix4._floatArrays);
	//-----------------------------------------------------------------------------------------------------------

	gl.uniform1i(currentShader.hasAditionalMov_loc, true);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform1i(currentShader.bScale_loc, true);
	var alfa = 1.0;
	gl.uniform1i(currentShader.bUse1Color_loc, true);
	if (color)
	{
		gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, alfa]); //.***
	}
	else 
	{
		gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.0, 1.0, alfa]); //.***
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
	var bbox;
	var ssao_idx = 1;
	var nodesCount = nodesArray.length;
	for (var b=0; b<nodesCount; b++)
	{
		currentShader.resetLastBuffersBinded();
		
		node = nodesArray[b];
		neoBuilding = node.data.neoBuilding;
		bbox = node.getBBox();

		gl.uniform3fv(currentShader.scale_loc, [bbox.getXLength(), bbox.getYLength(), bbox.getZLength()]); //.***
		var buildingGeoLocation = node.getNodeGeoLocDataManager().getCurrentGeoLocationData();
		
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

		this.pointSC = bbox.getCenterPoint(this.pointSC);
		gl.uniform3fv(currentShader.aditionalMov_loc, [this.pointSC.x, this.pointSC.y, this.pointSC.z]); //.***
		//gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		this.renderer.renderObject(gl, this.unitaryBoxSC, this, currentShader, ssao_idx, bRenderLines);
	}

	currentShader.resetLastBuffersBinded();
	currentShader.disableVertexAttribArrayAll();
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.disable(gl.BLEND);
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

MagoManager.prototype.renderAxisNodes = function(gl, nodesArray, bRenderLines, ssao_idx) 
{
	if (this.axisXYZ.vbo_vicks_container.vboCacheKeysArray.length === 0)
	{ 
		var mesh = this.axisXYZ.makeMesh(30); 
		mesh.getVboTrianglesConvex(this.axisXYZ.vbo_vicks_container, this.vboMemoryManager);
	}
	
	var gl = this.sceneState.gl;
	var renderType = ssao_idx;
	var color;
	var node;
	var currentShader;
	if (ssao_idx === 0)
	{
		currentShader = this.postFxShadersManager.getShader("modelRefDepth"); 
		gl.disable(gl.BLEND);
	}
	if (ssao_idx === 1)
	{
		currentShader = this.postFxShadersManager.getShader("modelRefSsao"); 
		gl.enable(gl.BLEND);
	}
	
	if (this.noiseTexture === undefined) 
	{ return; }
	
	// Test rendering by modelRefShader.****
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.***
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.***
	gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	
	// -------------------------------------
	
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	var shaderProgram = currentShader.program;
	currentShader.bindUniformGenerals();
	gl.enableVertexAttribArray(currentShader.position3_loc);
		
	if (ssao_idx === 1)
	{
		// provisionally render all native projects.***
		gl.enableVertexAttribArray(currentShader.normal3_loc);
		gl.enableVertexAttribArray(currentShader.color4_loc);

		gl.uniform1i(currentShader.bUse1Color_loc, false);
		if (color)
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [color.r, color.g, color.b, 1.0]); //.***
		}
		else 
		{
			gl.uniform4fv(currentShader.oneColor4_loc, [1.0, 0.1, 0.1, 1.0]); //.***
		}
		
		gl.uniform1i(currentShader.bUseNormal_loc, true);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, this.textureAux_1x1);
	}
	
	var neoBuilding;
	var natProject, mesh;
	var geoLocDataManager;
	var buildingGeoLocation;
	var nodesCount = nodesArray.length;
	for (var b=0; b<nodesCount; b++)
	{
		node = nodesArray[b];
		neoBuilding = node.data.neoBuilding;

		gl.uniform3fv(currentShader.scale_loc, [1, 1, 1]); //.***
		var buildingGeoLocation = node.getNodeGeoLocDataManager().getCurrentGeoLocationData();
		
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);
		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		
		this.renderer.renderObject(gl, this.axisXYZ, this, currentShader, ssao_idx);
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
	
	gl.disable(gl.BLEND);
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

MagoManager.prototype.renderGeometryDepth = function(gl, renderType, visibleObjControlerNodes) 
{
	var currentShader;
	var shaderProgram;
	var renderTexture = false;
	
	// Test Modeler Rendering.********************************************************************
	// Test Modeler Rendering.********************************************************************
	// Test Modeler Rendering.********************************************************************
	if (this.modeler !== undefined)
	{
		currentShader = this.postFxShadersManager.getShader("modelRefDepth"); 
		currentShader.resetLastBuffersBinded();
		shaderProgram = currentShader.program;

		currentShader.useProgram();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		currentShader.disableVertexAttribArray(currentShader.color4_loc);
		currentShader.bindUniformGenerals();
		
		currentShader.bindUniformGenerals();

		var refTMatrixIdxKey = 0;
		var minSizeToRender = 0.0;
		var renderType = 0;
		var refMatrixIdxKey =0; // provisionally set this var here.***
		this.modeler.render(this, currentShader, renderType);

		currentShader.disableVertexAttribArrayAll();
		gl.useProgram(null);

	}
	
	var nodesLOD0Count = visibleObjControlerNodes.currentVisibles0.length;
	var nodesLOD2Count = visibleObjControlerNodes.currentVisibles2.length;
	var nodesLOD3Count = visibleObjControlerNodes.currentVisibles3.length;
	if (nodesLOD0Count > 0 || nodesLOD2Count > 0 || nodesLOD3Count > 0)
	{
		currentShader = this.postFxShadersManager.getShader("modelRefDepth"); 
		currentShader.resetLastBuffersBinded();
		shaderProgram = currentShader.program;

		currentShader.useProgram();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		currentShader.disableVertexAttribArray(currentShader.color4_loc);
		currentShader.bindUniformGenerals();

		// RenderDepth for all buildings.***
		var refTMatrixIdxKey = 0;
		var minSize = 0.0;

		this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, this, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
		//this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, this, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
		//this.renderer.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, this, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
		
		currentShader.disableVertexAttribArray(currentShader.position3_loc); 
		gl.useProgram(null);
	}
	
	// PointsCloud.****************************************************************************************
	// PointsCloud.****************************************************************************************
	var nodesPCloudCount = this.visibleObjControlerNodes.currentVisiblesAux.length;
	if (nodesPCloudCount > 0)
	{
		currentShader = this.postFxShadersManager.getShader("pointsCloudDepth");
		currentShader.useProgram();
		
		currentShader.resetLastBuffersBinded();

		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.enableVertexAttribArray(currentShader.color4_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc); // provisionally has no normals.***
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); // provisionally has no texCoords.***
		
		currentShader.bindUniformGenerals();

		this.renderer.renderNeoBuildingsPCloud(gl, this.visibleObjControlerNodes.currentVisiblesAux, this, currentShader, renderTexture, renderType); 
		currentShader.disableVertexAttribArrayAll();
		
		gl.useProgram(null);

	}
	
	// Render cuttingPlanes of temperaturalayers if exist.***
	if (this.weatherStation)
	{ this.weatherStation.test_renderCuttingPlanes(this, renderType); }
	
	// tin terrain.***
	if (this.tinTerrainManager !== undefined)
	{
		var bDepth = true;
		this.tinTerrainManager.render(this, bDepth);
		gl.useProgram(null);
	}
	
	// Test.***
	var selGeneralObjects = this.selectionManager.getSelectionCandidatesFamily("general");
	if (selGeneralObjects)
	{
		var currObjectSelected = selGeneralObjects.currentSelected;
		if (currObjectSelected)
		{
			// check if is a cuttingPlane.***
			if (currObjectSelected instanceof CuttingPlane)
			{
				// Test. Render depth only for the selected object.***************************
				this.test_renderDepth_objectSelected(currObjectSelected);
			}
		}
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
	var shaderName = "modelRefSsao";
	var shader = this.postFxShadersManager.newShader(shaderName);
	var ssao_vs_source = ShaderSource.ModelRefSsaoVS;
	var ssao_fs_source = ShaderSource.ModelRefSsaoFS;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// 1.1) ModelReferences depthShader.******************************************************************************
	var shaderName = "modelRefDepth";
	var shader = this.postFxShadersManager.newShader(shaderName);
	var showDepth_vs_source = ShaderSource.RenderShowDepthVS;
	var showDepth_fs_source = ShaderSource.RenderShowDepthFS;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// 2) ModelReferences colorCoding shader.***********************************************************************
	var shaderName = "modelRefColorCoding";
	var shader = this.postFxShadersManager.newShader(shaderName);
	var showDepth_vs_source = ShaderSource.ColorSelectionSsaoVS;
	var showDepth_fs_source = ShaderSource.ColorSelectionSsaoFS;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// 3) TinTerrain shader.****************************************************************************************
	shaderName = "tinTerrain";
	shader = this.postFxShadersManager.newShader(shaderName);
	ssao_vs_source = ShaderSource.TinTerrainVS;
	ssao_fs_source = ShaderSource.TinTerrainFS;
	
	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	
	// 4) PointsCloud shader.****************************************************************************************
	shaderName = "pointsCloud";
	shader = this.postFxShadersManager.newShader(shaderName);
	ssao_vs_source = ShaderSource.PointCloudVS;
	ssao_fs_source = ShaderSource.PointCloudFS;
	
	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	
	// 5) Test Quad shader.****************************************************************************************
	shaderName = "testQuad"; // used by temperatura layer.***
	shader = this.postFxShadersManager.newShader(shaderName);
	ssao_vs_source = ShaderSource.Test_QuadVS;
	ssao_fs_source = ShaderSource.Test_QuadFS;
	
	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// 6) Filter silhouette shader.*************************************************************************************
	shaderName = "filterSilhouette"; 
	shader = this.postFxShadersManager.newShader(shaderName);
	ssao_vs_source = ShaderSource.wgs84_volumVS; // simple screen quad v-shader.***
	ssao_fs_source = ShaderSource.filterSilhouetteFS;
	
	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// 7) PointsCloud Depth shader.****************************************************************************************
	shaderName = "pointsCloudDepth";
	shader = this.postFxShadersManager.newShader(shaderName);
	ssao_vs_source = ShaderSource.PointCloudDepthVS;
	ssao_fs_source = ShaderSource.RenderShowDepthFS;
	
	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	
	// 8) PointsCloud shader.****************************************************************************************
	shaderName = "pointsCloudSsao";
	shader = this.postFxShadersManager.newShader(shaderName);
	ssao_vs_source = ShaderSource.PointCloudVS;
	ssao_fs_source = ShaderSource.PointCloudSsaoFS;
	
	shader.program = gl.createProgram();
	shader.shader_vertex = this.postFxShadersManager.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.postFxShadersManager.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, this.sceneState);
	shader.createUniformLocals(gl, shader, this.sceneState);
	
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
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
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * 
 * @param frustumVolume 변수
 * @param cameraPosition 변수
 */
MagoManager.prototype.isFarestFrustum = function() 
{
	if (this.numFrustums - this.currentFrustumIdx - 1 === 0)
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
MagoManager.prototype.doMultiFrustumCullingSmartTiles = function(camera) 
{
	// Here uses a frustum that is the sum of all frustums.***
	var frustumVolume = this.myCameraSCX.bigFrustum;
	
	// This makes the visible buildings array.
	var smartTile1 = this.smartTileManager.tilesArray[0]; // America side tile.
	var smartTile2 = this.smartTileManager.tilesArray[1]; // Asia side tile.
	
	if (this.frustumVolumeControl === undefined)
	{ this.frustumVolumeControl = new FrustumVolumeControl(); }
	
	if (this.fullyIntersectedLowestTilesArray === undefined)
	{ this.fullyIntersectedLowestTilesArray = []; }

	if (this.partiallyIntersectedLowestTilesArray === undefined)
	{ this.partiallyIntersectedLowestTilesArray = []; }
	
	if (this.lastIntersectedLowestTilesArray === undefined)
	{ this.lastIntersectedLowestTilesArray = []; }
	
	// save the last frustumCulled lowestTiles to delete if necessary.
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
	
	// Now, store the culled tiles into corresponding frustums, and mark all current_tiles as "visible".***
	this.frustumVolumeControl.initArrays(); // init.***
	var frustumsCount = this.myCameraSCX.frustumsArray.length;
	var frustum;
	var lowestTile;
	var currentLowestTilesCount = this.fullyIntersectedLowestTilesArray.length;
	for (var i=0; i<currentLowestTilesCount; i++)
	{
		lowestTile = this.fullyIntersectedLowestTilesArray[i];
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
		
		lowestTile.isVisible = true;
		for (var j=frustumsCount-1; j>= 0 ; j--)
		{
			frustum = this.myCameraSCX.frustumsArray[j];
			if (frustum.intersectionNearFarSphere(lowestTile.sphereExtent) !== Constant.INTERSECTION_OUTSIDE)
			{
				var frustumVolumeControlObject = this.frustumVolumeControl.getFrustumVolumeCulling(j); 
				frustumVolumeControlObject.fullyIntersectedLowestTilesArray.push(lowestTile);
				//break;
			}
		}
	}
	
	currentLowestTilesCount = this.partiallyIntersectedLowestTilesArray.length;
	for (var i=0; i<currentLowestTilesCount; i++)
	{
		lowestTile = this.partiallyIntersectedLowestTilesArray[i];
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
		
		lowestTile.isVisible = true;
		for (var j=frustumsCount-1; j>= 0 ; j--)
		{
			frustum = this.myCameraSCX.frustumsArray[j];
			if (frustum.intersectionNearFarSphere(lowestTile.sphereExtent) !== Constant.INTERSECTION_OUTSIDE)
			{
				var frustumVolumeControlObject = this.frustumVolumeControl.getFrustumVolumeCulling(j); 
				frustumVolumeControlObject.partiallyIntersectedLowestTilesArray.push(lowestTile);
				//break;
			}
		}
	}
	
	// Now, delete all tiles that is no visible in the all frustumVolumes.***
	// Put to deleting queue.***
	var lastLowestTilesCount = this.lastIntersectedLowestTilesArray.length;
	var lowestTile;
	for (var i=0; i<lastLowestTilesCount; i++)
	{
		lowestTile = this.lastIntersectedLowestTilesArray[i];
		if (!lowestTile.isVisible)
		{
			this.processQueue.putNodesArrayToDelete(lowestTile.nodesArray);
			lowestTile.clearNodesArray();
		}
	}
	
	this.lastIntersectedLowestTilesArray.length = 0;
	
	
	// TinTerranTiles.*************************************************************************
	// Provisionally:
	if (this.tinTerrainManager !== undefined)
	{ this.tinTerrainManager.doFrustumCulling(frustumVolume, camera.position, this); }
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 */
MagoManager.prototype.tilesMultiFrustumCullingFinished = function(intersectedLowestTilesArray, visibleNodes, cameraPosition, frustumVolume, doFrustumCullingToBuildings) 
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
	
	// get lodDistances for determine the real lod of the building.***
	var lod0Dist = this.magoPolicy.getLod0DistInMeters();
	var lod1Dist = this.magoPolicy.getLod1DistInMeters();
	var lod2Dist = this.magoPolicy.getLod2DistInMeters();
	var lod3Dist = this.magoPolicy.getLod3DistInMeters();
	var lod4Dist = this.magoPolicy.getLod4DistInMeters();
	var lod5Dist = this.magoPolicy.getLod5DistInMeters();

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
		if (distToCamera > Number(lod5_minDist))
		{ continue; }

		if (lowestTile.nodesArray && lowestTile.nodesArray.length > 0)
		{
			// the neoBuildings are made.
			var nodesCount = lowestTile.nodesArray.length;
			for (var j=0; j<nodesCount; j++)
			{
				// determine LOD for each building.
				node = lowestTile.nodesArray[j];
				nodeRoot = node.getRoot();

				// now, create a geoLocDataManager for node if no exist.
				if (nodeRoot.data.geoLocDataManager === undefined)
				{
					geoLoc = this.calculate_geoLocDataOfNode(node);
					continue;
				}
				neoBuilding = node.data.neoBuilding;
				if (neoBuilding === undefined)
				{
					// This node is a reference node.***
					visibleNodes.currentVisiblesAux.push(node);
					continue;
				}
				
				if (this.boundingSphere_Aux === undefined)
				{ this.boundingSphere_Aux = new Sphere(); }
			
				distToCamera = node.getDistToCamera(cameraPosition, this.boundingSphere_Aux);
				
				var data = node.data;
				data.currentLod;
				data.distToCam = distToCamera;

				//neoBuilding.distToCam = distToCamera;
				
				if (data.distToCam < lod0Dist)
				{ data.currentLod = 0; }
				else if (data.distToCam < lod1Dist)
				{ data.currentLod = 1; }
				else if (data.distToCam < lod2Dist)
				{ data.currentLod = 2; }
				else if (data.distToCam < lod3Dist)
				{ data.currentLod = 3; }
				else if (data.distToCam < lod4Dist)
				{ data.currentLod = 4; }
				else if (data.distToCam < lod5Dist)
				{ data.currentLod = 5; }
				
				var frustumFar = this.magoPolicy.getFrustumFarDistance();
				if (distToCamera > frustumFar)
				{ 
					// put this node to delete into queue.***
					this.processQueue.putNodeToDelete(node, 0);
					continue; 
				}
				
				// If necessary do frustum culling.*************************************************************************
				if (doFrustumCullingToBuildings)
				{
					var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
					// intersect with Frustum
					if (frustumCull === Constant.INTERSECTION_OUTSIDE) 
					{
						// put this node to delete into queue.***
						//this.processQueue.putNodeToDeleteModelReferences(node, 0);
						this.processQueue.putNodeToDeleteLessThanLod3(node, 0);
						continue;
					}
				}
				//-------------------------------------------------------------------------------------------
				
				
				
				// provisionally fork versions.***
				var version = neoBuilding.getHeaderVersion();
				if (version === undefined)
				{ continue; }
				
				if (version[0] === 'v')
				{
					if (distToCamera < lod0_minDist) 
					{
						visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles0, node);
					}
					else if (distToCamera < lod1_minDist) 
					{
						visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles1, node);
					}
					else if (distToCamera < lod2_minDist) 
					{
						visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles2, node);
					}
					else if (distToCamera < lod5_minDist) 
					{
						visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles3, node);
					}
				}
				else 
				{
					// provisional test for pointsCloud data.************
					var metaData = neoBuilding.metaData;
					var projectsType = metaData.projectDataType;
					if (projectsType && (projectsType === 4 || projectsType === 5))
					{
						// Project_data_type (new in version 002).***
						// 1 = 3d model data type (normal 3d with interior & exterior data).***
						// 2 = single building skin data type (as vWorld or googleEarth data).***
						// 3 = multi building skin data type (as Shibuya & Odaiba data).***
						// 4 = pointsCloud data type.***
						visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisiblesAux, node);
					}
					// end provisional test.-----------------------------
					else
					{
						if (distToCamera < lod0_minDist) 
						{
							// check if the lod0, lod1, lod2 are modelReference type.***
							var lodBuildingData = neoBuilding.getLodBuildingData(0);
							if (lodBuildingData && lodBuildingData.isModelRef)
							{ 
								visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles0, node);
							}
							else
							{ 
								//visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles3, node);
								visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles0, node);
							}
						}
						else if (distToCamera < lod1_minDist) 
						{
							var lodBuildingData = neoBuilding.getLodBuildingData(1);
							if (lodBuildingData && lodBuildingData.isModelRef)
							{ 
								visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles1, node);
							}
							else
							{ 
								//visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles3, node);
								visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles1, node);
							}
						}
						else if (distToCamera < lod2_minDist) 
						{
							var lodBuildingData = neoBuilding.getLodBuildingData(2);
							if (lodBuildingData && lodBuildingData.isModelRef)
							{ 
								visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles2, node);
							}
							else
							{ 
								visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles3, node);
							}
						}
						else if (distToCamera < lod5_minDist) 
						{
							visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisibles3, node);
						}
					}
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

	if (lowestTile.nodesArray === undefined)
	{ lowestTile.nodesArray = []; }
	
	var nodeSeedsCount = lowestTile.nodeSeedsArray.length;
	for (var j=startIndex; j<nodeSeedsCount; j++)
	{
		node = lowestTile.nodeSeedsArray[j];
		
		if (node.data.neoBuilding !== undefined)
		{
			lowestTile.nodesArray.push(node);
			continue;
		}
		
		neoBuilding = new NeoBuilding();
		
		neoBuilding.nodeOwner = node;
		node.data.neoBuilding = neoBuilding;
		nodeBbox = new BoundingBox();
		node.data.bbox = nodeBbox;
		buildingSeed = node.data.buildingSeed;
		
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
		neoBuilding.projectFolderName = node.data.projectFolderName;
		
	}
};

/**
 */
MagoManager.prototype.calculate_geoLocDataOfNode = function(node) 
{
	// This function creates the geoLocationData of "node".***
	var nodeRoot = node.getRoot();

	if (nodeRoot.data.geoLocDataManager === undefined)
	{ nodeRoot.data.geoLocDataManager = new GeoLocationDataManager(); }
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc = geoLocDataManager.getCurrentGeoLocationData();
		
	if (geoLoc === undefined || geoLoc.pivotPoint === undefined)
	{ 
		geoLoc = geoLocDataManager.newGeoLocationData("deploymentLoc"); 
		var geographicCoord;
		var rotationsDegree;
		
		if (node.data.geographicCoord === undefined)
		{
			var buildingSeed = node.data.buildingSeed;
			geographicCoord = buildingSeed.geographicCoord;
			rotationsDegree = buildingSeed.rotationsDegree;
		}
		else 
		{
			geographicCoord = node.data.geographicCoord;
			rotationsDegree = node.data.rotationsDegree;
		}
		
		var longitude = geographicCoord.longitude;
		var latitude = geographicCoord.latitude;
		var altitude = geographicCoord.altitude;
		var heading = rotationsDegree.z;
		var pitch = rotationsDegree.x;
		var roll = rotationsDegree.y;
		ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, geoLoc, this);
		this.pointSC = node.data.bbox.getCenterPoint(this.pointSC);

		// check if use "centerOfBoundingBoxAsOrigin".***
		if (node.data.mapping_type !== undefined && node.data.mapping_type.toLowerCase() === "boundingboxcenter")
		{
			var rootNode = node.getRoot();
			if (rootNode)
			{
				// now, calculate the root center of bbox.
				var buildingSeed = node.data.buildingSeed;
				var buildingSeedBBox = buildingSeed.bBox;
				this.pointSC = buildingSeedBBox.getCenterPoint(this.pointSC);
				ManagerUtils.translatePivotPointGeoLocationData(geoLoc, this.pointSC );
			}
		}
	}
	
	return geoLoc;
};

/**
 */
MagoManager.prototype.flyToTopology = function(worldPoint3d, duration) 
{
	if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM) 
	{
		this.scene.camera.flyTo({
			destination : Cesium.Cartesian3.clone(worldPoint3d),
			orientation : {
				direction : new Cesium.Cartesian3(this.scene.camera.direction.x, this.scene.camera.direction.y, this.scene.camera.direction.z),
				up        : new Cesium.Cartesian3(this.scene.camera.up.x, this.scene.camera.up.y, this.scene.camera.up.z)},
			duration: parseInt(duration)
		});
	}
	/*
	else if (MagoConfig.getPolicy().geo_view_library === Constant.WORLDWIND)
	{
		this.wwd.goToAnimator.travelTime = duration * 1000;
		this.wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(altitude) + 50));
	}
	else if (MagoConfig.getPolicy().geo_view_library === Constant.MAGOWORLD)
	{
		this.magoWorld.goto(parseFloat(longitude),
			parseFloat(latitude),
			parseFloat(altitude) + 10);
	}
	*/
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
				parseFloat(altitude)),
			duration: parseInt(duration)
		});
	}
	else if (MagoConfig.getPolicy().geo_view_library === Constant.WORLDWIND)
	{
		this.wwd.goToAnimator.travelTime = duration * 1000;
		this.wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(altitude)));
	}
	else if (MagoConfig.getPolicy().geo_view_library === Constant.MAGOWORLD)
	{
		this.magoWorld.goto(parseFloat(longitude),
			parseFloat(latitude),
			parseFloat(altitude));
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
	var geoLoc;
	if (geoLocDataManager === undefined)
	{ 
		geoLoc = this.calculate_geoLocDataOfNode(node);
		if (geoLoc === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return; 
		}
	}
	geoLocDataManager = nodeRoot.data.geoLocDataManager;
	geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	var realBuildingPos = node.getBBoxCenterPositionWorldCoord(geoLoc);

	if (realBuildingPos === undefined)
	{ return; }

	this.radiusAprox_aux = nodeRoot.data.bbox.getRadiusAprox();

	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }
	
	this.boundingSphere_Aux.radius = this.radiusAprox_aux;

	if (this.configInformation.geo_view_library === Constant.CESIUM)
	{
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
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
	var geoLocDatamanager = node.getNodeGeoLocDataManager();
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
	if (neoBuilding === undefined)
	{ return; }
	
	var node = neoBuilding.nodeOwner;
	var geoLocDatamanager = node.getNodeGeoLocDataManager();
	if (geoLocDatamanager === undefined)
	{ return; }
	var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
	var dataKey = node.data.nodeId;
	var projectId = node.data.projectId;

	if (MagoConfig.getPolicy().geo_callback_enable === "true") 
	{
		//if (this.objMarkerSC === undefined) { return; }
		var objectId = null;
		if (this.objectSelected !== undefined) { objectId = this.objectSelected.objectId; }
		
		// click object 정보를 표시
		if (this.magoPolicy.getObjectInfoViewEnable()) 
		{
			selectedObjectCallback(		MagoConfig.getPolicy().geo_callback_selectedobject,
				projectId,
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
				projectId,
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
MagoManager.prototype.changeLocationAndRotation = function(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, durationTimeInSeconds) 
{
	var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
	if (node === undefined)
	{ return; }
	this.changeLocationAndRotationNode(node, latitude, longitude, elevation, heading, pitch, roll, durationTimeInSeconds);
};

/**
 * 변환 행렬
 */
MagoManager.prototype.changeLocationAndRotationNode = function(node, latitude, longitude, elevation, heading, pitch, roll, durationTimeInSeconds) 
{
	if (node === undefined)
	{ return; }

	if (durationTimeInSeconds !== undefined)
	{
		if (this.animationManager === undefined)
		{ this.animationManager = new AnimationManager(); }
		this.animationManager.putNode(node);
		node.changeLocationAndRotationAnimated(latitude, longitude, elevation, heading, pitch, roll, this, durationTimeInSeconds);
	}
	else 
	{
		node.changeLocationAndRotation(latitude, longitude, elevation, heading, pitch, roll, this);
	}
	
	var neoBuilding = node.data.neoBuilding;
	
	this.selectedObjectNotice(neoBuilding);
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
	var mapping_type = undefined;
	
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
		mapping_type = jasonObject.mapping_type;
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
		if (!attributes.isReference)
		{
			buildingId = data_key;
			node = this.hierarchyManager.newNode(buildingId, projectId, attributes);
			// set main data of the node.
			node.data.projectFolderName = projectFolderName;
			node.data.projectId = projectId;
			node.data.data_name = data_name;
			node.data.attributes = attributes;
			node.data.mapping_type = mapping_type;
			var tMatrix;
			
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
					tMatrix = ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, heading, pitch, roll, undefined, tMatrix, this);
					
					// now calculate the geographicCoord of the center of the bBox.
					var bboxCenterPoint;

					bboxCenterPoint = buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
					var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
					buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, buildingSeed.geographicCoordOfBBox, this); // original.
				}
			}

			// now, calculate the bbox.***
			node.data.bbox = new BoundingBox();
			
			if (node.data.buildingSeed && node.data.buildingSeed.bBox)
			{ node.data.bbox.copyFrom(buildingSeed.bBox); }
			
			if (node.data.mapping_type && node.data.mapping_type.toLowerCase() === "boundingboxcenter")
			{
				node.data.bbox.translateToOrigin();
			}
			
			// calculate the geographicCoordOfTheBBox.***
			if (tMatrix !== undefined)
			{
				bboxCenterPoint = node.data.bbox.getCenterPoint(bboxCenterPoint);
				var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
				node.data.bbox.geographicCoord = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, node.data.bbox.geographicCoord, this);
			}

			//bbox = node.data.bbox;

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
		}
		else 
		{
			/* static model 사용은 API를 통해서만... 
			attributes.projectId = projectId;
			this.addStaticModel(attributes);
			if (children !== undefined)
			{
				childrenCount = children.length;
				for (var i=0; i<childrenCount; i++)
				{
					var childrenObj = children[i];
					if (!defined(childrenObj.projectId))
					{
						childrenObj.projectId = projectId;
					}
					this.instantiateStaticModel(childrenObj);
				}
			}
			*/
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
			if (node.data.attributes.mapping_type && node.data.attributes.mapping_type === "boundingboxcenter")
			{
				var bboxCenterPoint = buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
				var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
				buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, buildingSeed.geographicCoordOfBBox, this); // original.
			}
			else 
			{
				buildingSeed.geographicCoordOfBBox.setLonLatAlt(longitude, latitude, height);
			}
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
			var nodeBBox = node.data.bbox;
			
			if (nodeBBox)
			{
				if (node.data.attributes)
				{
					if (node.data.attributes.isMain)
					{
						//buildingSeed = node.data.buildingSeed;
						if (bboxStarted === false)
						{
							nodeRoot.data.bbox.copyFrom(nodeBBox);
							bboxStarted = true;
						}
						else 
						{
							nodeRoot.data.bbox.addBox(nodeBBox);
						}
					}
					else 
					{
						if (bboxStarted === false)
						{
							nodeRoot.data.bbox.copyFrom(nodeBBox);
							bboxStarted = true;
						}
						else 
						{
							nodeRoot.data.bbox.addBox(nodeBBox);
						}
					}
				}
				else 
				{
					if (bboxStarted === false)
					{
						nodeRoot.data.bbox.copyFrom(nodeBBox);
						bboxStarted = true;
					}
					else 
					{
						nodeRoot.data.bbox.addBox(nodeBBox);
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
	var targetDepth = 17;
	this.smartTileManager.makeTreeByDepth(targetDepth, physicalNodesArray, this);

	this.buildingSeedList.buildingSeedArray.length = 0; // init.

};

MagoManager.prototype.getNeoBuildingByTypeId = function(buildingType, buildingId)
{
	return this.smartTileManager.getNeoBuildingById(buildingType, buildingId);
};

/**
 * instantiate static model
 * @param {instantiateOption} attributes
 */
MagoManager.prototype.instantiateStaticModel = function(attributes)
{
	if (!defined(attributes.projectId))
	{
		throw new Error('projectId is required.');
	}

	if (!defined(attributes.instanceId))
	{
		throw new Error('instanceId is required.');
	}

	if (!defined(attributes.longitude))
	{
		throw new Error('longitude is required.');
	}
	if (!defined(attributes.latitude))
	{
		throw new Error('latitude is required.');
	}

	if (!attributes.isReference)
	{
		attributes.isReference = true;
	}

	if (!attributes.isPhysical)
	{
		attributes.isPhysical = true;
	}

	if (!attributes.nodeType)
	{
		attributes.nodeType = "TEST";
	}

	//var nodesMap = this.hierarchyManager.getNodesMap(projectId, undefined);
	//var existentNodesCount = Object.keys(nodesMap).length;
	//var instanceId = defaultValue(attributes.instanceId, projectId + "_" + existentNodesCount.toString());
	var projectId = attributes.projectId;
	var instanceId = attributes.instanceId;
	
	var longitude = attributes.longitude;
	var latitude = attributes.latitude;
	var altitude = defaultValue(attributes.height, 0);
	var heading = defaultValue(attributes.heading, 0);
	var pitch = defaultValue(attributes.pitch, 0);
	var roll = defaultValue(attributes.roll, 0);
	
	var node = this.hierarchyManager.getNodeByDataKey(projectId, instanceId);
	if (node === undefined)
	{
		node = this.hierarchyManager.newNode(instanceId, projectId, undefined);

		var geoCoord = new GeographicCoord();
		geoCoord.latitude = latitude;
		geoCoord.longitude = longitude;
		geoCoord.altitude = altitude;

		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLocData = geoLocDataManager.newGeoLocationData("noName");
		geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, heading, pitch, roll, geoLocData, this);

		// Now, create the geoLocdataManager of node.***
		node.data.projectId = projectId;
		node.data.attributes = attributes;
		node.data.geographicCoord = geoCoord;
		node.data.rotationsDegree = new Point3D(pitch, roll, heading);
		node.data.geoLocDataManager = geoLocDataManager;

		// Now, insert node into smartTile.***
		var targetDepth = defaultValue(this.smartTileManager.targetDepth, 17);
		this.smartTileManager.putNode(targetDepth, node, this);
	}
	else 
	{
		this.changeLocationAndRotation(projectId, instanceId, latitude, longitude, altitude, heading, pitch, roll);
	}
};
/**
 * add static model
 * @param {staticModelOption} attributes
 */
MagoManager.prototype.addStaticModel = function(attribute)
{
	if (!defined(attribute.projectId))
	{
		throw new Error('projectId is required.');
	}

	if (!defined(attribute.projectFolderName))
	{
		throw new Error('projectFolderName is required.');
	}

	if (!defined(attribute.buildingFolderName))
	{
		throw new Error('buildingFolderName is required.');
	}
	var projectId = attribute.projectId;
	var staticModelsManager = this.hierarchyManager.getStaticModelsManager();

	var staticModel = new StaticModel();
	staticModel.guid = projectId;
	staticModel.projectFolderName = attribute.projectFolderName;
	staticModel.buildingFolderName = attribute.buildingFolderName;
	staticModel.neoBuilding = new NeoBuilding();
	
	staticModelsManager.addStaticModel(projectId, staticModel);
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
	else if (apiName === "changeOrigin")
	{
		this.magoPolicy.setShowOrigin(api.getShowOrigin());
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
		// delete "aditionalMove" of the objects.***
		var moveHistoryMap = MagoConfig.getAllMovingHistory(); // get colorHistoryMap.***
		if (moveHistoryMap === undefined)
		{
			MagoConfig.clearMovingHistory();
			return;
		}
		
		for (var key_projectId in moveHistoryMap)
		{
			if (Object.prototype.hasOwnProperty.call(moveHistoryMap, key_projectId))
			{
				var projectId = key_projectId;
				var buildingsMap = moveHistoryMap[projectId];
				if (buildingsMap === undefined)
				{ continue; }
				
				for (var key_dataKey in buildingsMap)
				{
					if (Object.prototype.hasOwnProperty.call(buildingsMap, key_dataKey))
					{
						var dataKey = key_dataKey;
						var dataValue = buildingsMap[key_dataKey];
						
						if (dataValue === undefined)
						{ continue; }
						
						for (var objectIdx in dataValue)
						{
							if (Object.prototype.hasOwnProperty.call(dataValue, objectIdx))
							{
								var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
								if (node === undefined || node.data === undefined)
								{ continue; }
								
								var neoBuilding = node.data.neoBuilding;
								if (neoBuilding === undefined)
								{ continue; }
								
								var refObject = neoBuilding.getReferenceObject(objectIdx);
								if (refObject)
								{
									refObject.moveVector = undefined;
									refObject.moveVectorRelToBuilding = undefined;
								}	
							}
						}	
					}
				}	
			}
		}
		
		MagoConfig.clearMovingHistory();
	}
	else if (apiName === "deleteAllChangeColor") 
	{
		// 1rst, must delete the aditionalColors of objects.***
		var colorHistoryMap = MagoConfig.getAllColorHistory(); // get colorHistoryMap.***
		
		if (colorHistoryMap === undefined)
		{
			MagoConfig.clearColorHistory();
			return;
		}
		
		for (var key_projectId in colorHistoryMap)
		{
			if (Object.prototype.hasOwnProperty.call(colorHistoryMap, key_projectId))
			{
				var projectId = key_projectId;
				var buildingsMap = colorHistoryMap[projectId];
				if (buildingsMap === undefined)
				{ continue; }
				
				for (var key_dataKey in buildingsMap)
				{
					if (Object.prototype.hasOwnProperty.call(buildingsMap, key_dataKey))
					{
						var dataKey = key_dataKey;
						var dataValue = buildingsMap[key_dataKey];
						if (dataValue === undefined)
						{ continue; }
						
						for (var objectId in dataValue)
						{
							if (Object.prototype.hasOwnProperty.call(dataValue, objectId))
							{
								var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
								if (node === undefined || node.data === undefined)
								{ continue; }
							
								node.isColorChanged = false;
								
								var neoBuilding = node.data.neoBuilding;
								if (neoBuilding === undefined)
								{ continue; }
							
								var refObjectArray = neoBuilding.getReferenceObjectsArrayByObjectId(objectId);
								if (refObjectArray === undefined)
								{ continue; }
								
								var refObjectsCount = refObjectArray.length;
								for (var i=0; i<refObjectsCount; i++)
								{
									var refObject = refObjectArray[i];
									if (refObject)
									{
										refObject.aditionalColor = undefined;
									}
								}	
							}
						}	
					}
				}	
			}
		}
		
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
		var neoBuilding = this.selectionManager.currentBuildingSelected;
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
				var camera = this.scene.camera;

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
				this.scene.camera = Cesium.Camera.clone(this.cameraFPV._cameraBAK, this.scene.camera);
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
		
		if (node === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var dataName = node.data.data_name;
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (dataName === undefined || geoLocDataManager === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		
		if (geoLocdata === undefined || geoLocdata.geographicCoord === undefined)
		{
			apiResultCallback( MagoConfig.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var projectId = node.data.projectId;
		var latitude = geoLocdata.geographicCoord.latitude;
		var longitude = geoLocdata.geographicCoord.longitude;
		var altitude = geoLocdata.geographicCoord.altitude;
		var heading = geoLocdata.heading;
		var pitch = geoLocdata.pitch;
		var roll = geoLocdata.roll;
		
		dataInfoCallback(		MagoConfig.getPolicy().geo_callback_dataInfo,
			projectId,
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
		if (Object.keys(nodeMap).length === 0)
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
	else if (apiName === "gotoFly")
	{
		this.flyTo(api.getLongitude(), api.getLatitude(), api.getElevation(), api.getDuration());
	}
	else if (apiName === "getCoordinateRelativeToBuilding") 
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		var worldPoint = api.getInputPoint();
		var resultPoint = api.getResultPoint();
		
		if (projectId === undefined || dataKey === undefined || worldPoint === undefined)
		{ return undefined; }
		
		if (resultPoint === undefined)
		{ resultPoint = new Point3D(); }
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		
		if (node === undefined)
		{ return undefined; }
		
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (geoLocDataManager === undefined)
		{ return undefined; }
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		resultPoint = geoLocdata.worldCoordToLocalCoord(worldPoint, resultPoint);
		return resultPoint;
	}
	else if (apiName === "getAbsoluteCoodinateOfBuildingPoint") 
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		var localPoint = api.getInputPoint();
		var resultPoint = api.getResultPoint();
		
		if (projectId === undefined || dataKey === undefined || localPoint === undefined)
		{ return undefined; }
		
		if (resultPoint === undefined)
		{ resultPoint = new Point3D(); }
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		
		if (node === undefined)
		{ return undefined; }
		
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (geoLocDataManager === undefined)
		{ return undefined; }
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		resultPoint = geoLocdata.localCoordToWorldCoord(localPoint, resultPoint);
		return resultPoint;
	}
	else if (apiName === "changeMagoMode") 
	{
		var hola = 0;
	}
	else if (apiName === "getCameraCurrentPosition")
	{
		var unit = api.getUnit();
		if (this.configInformation.geo_view_library === Constant.CESIUM)
		{
			var position = this.scene.camera.position;
		
			switch (unit)
			{
			case CODE.units.METRE : return position;
			case CODE.units.RADIAN : return Cesium.Cartographic.fromCartesian(position);
			case CODE.units.DEGREE : {
				var cartographicPosition = Cesium.Cartographic.fromCartesian(position);
				return {
					lat : Cesium.Math.toDegrees(cartographicPosition.latitude),
					lon : Cesium.Math.toDegrees(cartographicPosition.longitude),
					alt : cartographicPosition.height
				};
			}
			}
		}
	}
	else if (apiName === "getCameraCurrentOrientaion")
	{
		if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
		{
			var camera = this.scene.camera;
			if (!camera)
			{
				throw new Error('Camera is broken.');
			}
			return {
				heading : Cesium.Math.toDegrees(camera.heading),
				pitch   : Cesium.Math.toDegrees(camera.pitch),
				roll    : Cesium.Math.toDegrees(camera.roll)
			};
		}
	}
	else if (apiName === "changeCameraOrientation")
	{	
		var heading = defaultValue(api.getHeading(), Cesium.Math.toDegrees(camera.heading));
		var pitch = defaultValue(api.getPitch(), Cesium.Math.toDegrees(camera.pitch));
		var roll = defaultValue(api.getRoll(), Cesium.Math.toDegrees(camera.roll));
		var duration = defaultValue(api.getDuration(), 0);

		if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
		{
			var camera = this.scene.camera;
			if (!camera)
			{
				throw new Error('Camera is broken.');
			}

			camera.flyTo({
				destination : camera.position,
				orientation : {
					heading : Cesium.Math.toRadians(heading),
					pitch   : Cesium.Math.toRadians(pitch),
					roll    : Cesium.Math.toRadians(roll)
				},
				duration: parseInt(duration)
			});
		}
	}
	else if (apiName === "instantiateStaticModel")
	{
		var attributes = api.getInstantiateObj();

		if (!defined(attributes.projectId))
		{
			throw new Error('projectId is required.');
		}

		if (!defined(attributes.instanceId))
		{
			throw new Error('instanceId is required.');
		}

		if (!defined(attributes.longitude))
		{
			throw new Error('longitude is required.');
		}
		if (!defined(attributes.latitude))
		{
			throw new Error('latitude is required.');
		}

		if (!attributes.isReference)
		{
			attributes.isReference = true;
		}

		if (!attributes.isPhysical)
		{
			attributes.isPhysical = true;
		}

		if (!attributes.nodeType)
		{
			attributes.nodeType = "TEST";
		}

		//var nodesMap = this.hierarchyManager.getNodesMap(projectId, undefined);
		//var existentNodesCount = Object.keys(nodesMap).length;
		//var instanceId = defaultValue(attributes.instanceId, projectId + "_" + existentNodesCount.toString());
		var projectId = attributes.projectId;
		var instanceId = attributes.instanceId;
		
		var longitude = attributes.longitude;
		var latitude = attributes.latitude;
		var altitude = defaultValue(attributes.height, 0);
		var heading = defaultValue(attributes.heading, 0);
		var pitch = defaultValue(attributes.pitch, 0);
		var roll = defaultValue(attributes.roll, 0);
		
		var node = this.hierarchyManager.getNodeByDataKey(projectId, instanceId);
		if (node === undefined)
		{
			node = this.hierarchyManager.newNode(instanceId, projectId, undefined);

			var geoCoord = new GeographicCoord();
			geoCoord.latitude = latitude;
			geoCoord.longitude = longitude;
			geoCoord.altitude = altitude;

			var geoLocDataManager = geoCoord.getGeoLocationDataManager();
			var geoLocData = geoLocDataManager.newGeoLocationData("noName");
			geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude+1, heading, pitch, roll, geoLocData, this);

			// Now, create the geoLocdataManager of node.***
			node.data.projectId = projectId;
			node.data.attributes = attributes;
			node.data.geographicCoord = geoCoord;
			node.data.rotationsDegree = new Point3D(pitch, roll, heading);
			node.data.geoLocDataManager = geoLocDataManager;
			/*node.data.bbox = new BoundingBox(); // Make a provisional bbox. We dont know size.***
			node.data.bbox.init();
			node.data.bbox.expand(10.0);*/ // we dont know the bbox size, so set as 10,10,10.***

			// Now, insert node into smartTile.***
			var targetDepth = defaultValue(this.smartTileManager.targetDepth, 17);
			this.smartTileManager.putNode(targetDepth, node, this);
		}
		else 
		{
			this.changeLocationAndRotation(projectId, instanceId, latitude, longitude, altitude, heading, pitch, roll);
		}
	}
	else if (apiName === "addStaticModel")
	{
		var attribute = api.getStaticModelAttributeObj();
		this.addStaticModel(attribute);
	}
};

MagoManager.prototype.deleteAll = function ()
{
	// deselect.
	this.selectionManager.clearCandidates();
	this.selectionManager.clearCurrents();
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
	
	var objects = this.getSelectedObjects(gl, posX, posY, this.arrayAuxSC);
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
};