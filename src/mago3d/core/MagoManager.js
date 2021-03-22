'use strict';

/**
 * Main Mago class.
 * @class MagoManager
 * @constructor
 */
var MagoManager = function (config) 
{
	if (!(this instanceof MagoManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	Emitter.call(this);

	/**
	 * mago config.
	 * @type {MagoConfig}
	 * @default MagoConfig.
	 * 
	 * @private
	 */
	this.config = config;

	/**
	 * Auxiliary renderer.
	 * @type {Renderer}
	 * @default Renderer.
	 * 
	 * @private
	 */
	this.renderer = new Renderer(this);
	
	/**
	 * Manages the selected objects.
	 * @type {SelectionManager}
	 * @default SelectionManager.
	 * 
	 * @private
	 */
	this.selectionManager = undefined;
	
	/**
	 * Manages the shaders.
	 * @type {PostFxShadersManager}
	 * @default PostFxShadersManager.
	 * 
	 * @private
	 */
	this.postFxShadersManager = new PostFxShadersManager();

	this.configInformation = this.config.getPolicy();
	/**
	 * Manages the request & loading files.
	 * @type {ReaderWriter}
	 * @default ReaderWriter.
	 * 
	 * @private
	 */
	this.readerWriter = new ReaderWriter(this.configInformation);
	
	/**
	 * Contains the Mago3D policy data.
	 * @type {Policy}
	 * @default Policy
	 * 
	 * @private
	 */
	this.magoPolicy = new Policy(this.configInformation);
	
	/**
	 * Manages & controls the movement of the objects in the scene.
	 * @type {AnimationManager}
	 * @default undefined
	 * 
	 * @private
	 */
	this.animationManager; 
	
	/**
	 * Manages & controls all the textures.
	 * @type {texturesStore}
	 * @default texturesStore
	 * 
	 * @private
	 */
	this.texturesStore = new TexturesStore(this);

	//this._inputInteraction = new InputInteraction(this);
	
	/**
	 * Manages & controls the tiles.
	 * @type {SmartTileManager}
	 * @default SmartTileManager
	 * 
	 * @private
	 */
	this.smartTileManager = new SmartTileManager({magoManager : this});
	
	/**
	 * Manages & controls the deleting objects queue.
	 * @type {ProcessQueue}
	 * @default ProcessQueue
	 * 
	 * @private
	 */
	this.processQueue = new ProcessQueue();
	
	/**
	 * Manages & controls the parsing of loaded files.
	 * @type {ParseQueue}
	 * @default ParseQueue
	 * 
	 * @private
	 */
	this.parseQueue = new ParseQueue();
	
	/**
	 * Manages & controls the creation of the nodes (node = main object in Mago3D).
	 * @type {HierarchyManager}
	 * @default HierarchyManager
	 * 
	 * @private
	 */
	this.hierarchyManager = new HierarchyManager();

	/**
	 * Depth framebuffer object.
	 * @type {FBO}
	 * @default undefined
	 * 
	 * @private
	 */
	this.depthFboNeo;
	
	/**
	 * Depth framebuffer object for auxiliary and test use.
	 * @type {FBO}
	 * @default undefined
	 * 
	 * @private
	 */
	this.depthFboAux;
	
	/**
	 * Framebuffer object used for color coding selection.
	 * @type {FBO}
	 * @default undefined
	 * 
	 * @private
	 */
	this.selectionFbo; 
	
	/**
	 * Current x position of the mouse in screen coordinates.
	 * @type {Number}
	 * @default 0
	 * 
	 * @private
	 */
	this.mouse_x = 0;
	
	/**
	 * Current y position of the mouse in screen coordinates.
	 * @type {Number}
	 * @default 0
	 * 
	 * @private
	 */
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
	
	
	this.cameraFPV = new FirstPersonView();
	this.myCameraSCX;
	// var to delete.*********************************************
	this.loadQueue = new LoadQueue(this); // Old. delete.***

	// Vars.****************************************************************
	this.sceneState = new SceneState(this.config); // this contains all scene mtrices and camera position.***
	this.sceneState.setApplySunShadows(false);

	

	this.magoPolicy.objectMoveMode = CODE.moveMode.NONE;

	this.selectionColor = new SelectionColor();
	this.vboMemoryManager = new VBOMemoryManager(this.configInformation);
	
	if (this.configInformation !== undefined)
	{
		this.magoPolicy.setLod0DistInMeters(this.configInformation.lod0);
		this.magoPolicy.setLod1DistInMeters(this.configInformation.lod1);
		this.magoPolicy.setLod2DistInMeters(this.configInformation.lod2);
		this.magoPolicy.setLod3DistInMeters(this.configInformation.lod3);
		this.magoPolicy.setLod4DistInMeters(this.configInformation.lod4);
		this.magoPolicy.setLod5DistInMeters(this.configInformation.lod5);

		if (this.configInformation.ssaoRadius)
		{
			this.sceneState.ssaoRadius[0] = Number(this.configInformation.ssaoRadius);
		}
	}

	this.fileRequestControler = new FileRequestControler();
	this.visibleObjControlerOctrees = new VisibleObjectsController(); 
	this.visibleObjControlerNodes = new VisibleObjectsController(); 
	this.visibleObjControlerTerrain = new VisibleObjectsController(); 
	
	this.frustumVolumeControl = new FrustumVolumeControl();
	
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

	this.frustumVolumeControl = new FrustumVolumeControl();

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

	this.resultRaySC = new Float32Array(3);
	this.matrix4SC = new Matrix4();
	this.axisXYZ = new AxisXYZ();

	this.demoBlocksLoaded = false;

	this.objMarkerManager = new ObjectMarkerManager(this);
	
	// renderWithTopology === 0 -> render only CityGML.***
	// renderWithTopology === 1 -> render only IndoorGML.***
	// renderWithTopology === 2 -> render both.***
	this.tempSettings = {};
	this.tempSettings.renderWithTopology = 1;
	this.tempSettings.renderSpaces = true;
	this.tempSettings.spacesAlpha = 0.6;
	
	/**
	 * This class contains general settings.
	 * @type {Settings}
	 * @private
	 */
	this._settings = new Settings();
	
	this.tinTerrainManager;
	
	/**
	 * Modeler
	 * @type {Modeler}
	 */
	this.modeler = new Modeler(this);
	this.materialsManager = new MaterialsManager(this);
	this.idManager = new IdentifierManager();
	this.processCounterManager = new ProcessCounterManager();

	
	this.f4dController = new F4dController(this);
	this.effectsManager = new EffectsManager();
	
	//CODE.magoCurrentProcess = {
	//"Unknown"  : 0,
	//"DepthRendering"  : 1,
	//"ColorRendering" : 2,
	//"ColorCodeRendering" : 3,
	//"DepthShadowRendering" : 4

	this.currentProcess = CODE.magoCurrentProcess.Unknown;

	/**
	 * Interaction collection.
	 * @type {InteractionCollection}
	 */
	this.interactionCollection = new InteractionCollection(this);
	this.defaultSelectInteraction = new PointSelectInteraction();
	this.defaultTranslateInteraction = new TranslateInteraction();
	this.interactionCollection.add(this.defaultTranslateInteraction);
	this.interactionCollection.add(this.defaultSelectInteraction);
	

	/**
     * Control collection.
     * @type {ControlCollection}
     */
	this.controls = new ControlCollection(this);

	/**
	 * MagoLayer collection
	 * @type {MagoLayerCollection}
	 */
	this.magoLayerCollection = new MagoLayerCollection();

	//height 변경 적용필요한 f4d 목록
	this._needValidHeightNodeArray = [];
	//height 변경 적용필요한 native 목록
	this._needValidHeightNativeArray = [];
	this._changeCanvasSizeEvent = new CustomEvent('changeCanvasSize');

	if (Mago3D['WeatherStation'] && this.weatherStation === undefined)
	{ 
		this.weatherStation = new Mago3D.WeatherStation(this);
	}
};
MagoManager.prototype = Object.create(Emitter.prototype);
MagoManager.prototype.constructor = MagoManager;

MagoManager.EVENT_TYPE = {
	'CLICK'                  	: 'click',
	'DBCLICK'                	: 'dbclick',
	'RIGHTCLICK'             	: 'rightclick',
	'MOUSEMOVE'              	: 'mousemove',
	'LEFTDOWN'              		: 'leftdown',
	'LEFTUP'                		: 'leftup',
	'MIDDLEDOWN'            		: 'middledown',
	'MIDDLEUP'              		: 'middleup',
	'RIGHTDOWN'             		: 'rightdown',
	'RIGHTUP'               		: 'rightup',
	'WHEEL'                 		: 'wheel',
	'SMARTTILELOADSTART'     	: 'smarttileloadstart',
	'SMARTTILELOADEND'       	: 'smarttileloadend',
	'F4DLOADSTART'           	: 'f4dloadstart',
	'F4DLOADEND'            		: 'f4dloadend',
	'F4DRENDERREADY'        		: 'f4drenderready',
	'SELECTEDF4D'          	 	: 'selectedf4d',
	'SELECTEDF4DMOVED'        : 'selectedf4dmoved',
	'SELECTEDF4DOBJECT'      	: 'selectedf4dobject',
	'SELECTEDGENERALOBJECT'   : 'selectedgeneralobject',
	'DESELECTEDF4D'        	 	: 'deselectedf4d',
	'DESELECTEDF4DOBJECT'    	: 'deselectedf4dobject',
	'DESELECTEDGENERALOBJECT' : 'deselectedgeneralobject',
	'CAMERACHANGED'           : 'camerachanged',
	'CAMERAMOVEEND'           : 'cameramoveend',
	'CAMERAMOVESTART'         : 'cameramovestart',
	'ANIMATIONEND'         : 'animationEnd',
	'ANIMATIONING'         : 'animationing',
	'VALIDHEIGHTEND'         : 'validHeightEnd'
};

/**
 * object 를 그리는 두가지 종류의 function을 호출
 * @private
 */
MagoManager.prototype.init = function(gl) 
{
	this.bInit = true;
	
	/*
	var canvas = this.scene.canvas;
	var glAttrs = {antialias          : true, 
		stencil            : true,
		premultipliedAlpha : false};
	var gl = canvas.getContext("webgl", glAttrs);
	if (!gl)
	{ gl = canvas.getContext("experimental-webgl", glAttrs); }
	*/
	
	if (this.sceneState.gl === undefined)
	{ this.sceneState.gl = gl; }
	if (this.vboMemoryManager.gl === undefined)
	{ this.vboMemoryManager.gl = gl; }
	if (this.effectsManager.gl === undefined)
	{ this.effectsManager.gl = gl; }

	this.selectionManager = new SelectionManager(this);
};

/**
 * object 를 그리는 두가지 종류의 function을 호출
 * @param scene 변수 Cesium Scene.
 * @param pass 변수
 * @param frustumIdx 변수
 * @param numFrustums 변수
 * 
 * @private
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

	if (this.configInformation === undefined)
	{
		this.configInformation = this.config.getPolicy();
	}


	if (!this.bInit)
	{ 
		var gl = scene ? scene.context._gl : this.sceneState.gl;
		gl.getExtension("EXT_frag_depth");
		this.init(gl); 

		if (gl.isContextLost())
		{ return; }
	}

	this.startRender(isLastFrustum, this.currentFrustumIdx, numFrustums);
};
/**
 * changed container size. call this method.
 */
MagoManager.prototype.updateSize = function() 
{
	var sceneState = this.sceneState;
	var canvas = sceneState.canvas;
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	sceneState.setDrawingBufferSize(canvas.offsetWidth, canvas.offsetHeight);
};


MagoManager.prototype.isCesiumGlobe = function() 
{
	return this.configInformation.basicGlobe === Constant.CESIUM;
};

/**
 * handle browser event
 * @param {BrowserEvent} browserEvent 
 */
MagoManager.prototype.handleBrowserEvent = function(browserEvent) 
{
	this.emit(browserEvent.type, browserEvent);
	var interactionArray = this.interactionCollection.array;

	for (var i=interactionArray.length - 1; i>=0;i--)
	{
		var interaction = interactionArray[i];

		/**
		 * @example 
		 * interaction can be pointSelectInteraction.
		 */
		if (!interaction.getActive())
		{
			continue;
		}

		interaction.handle(browserEvent);
	}
	this.setMouseStatus(browserEvent.type);
	
	/*if (browserEvent.type === 'click')
	{
		//
		var infoPromise = loadWithXhr('./persistence/json/mago3d-building_4326');

		infoPromise.done(function(e)
		{
			
			var pbf = new Pbf(e);
			console.info(pbf);
			var c = MBTile.read(pbf);
			console.info(c);
		});
	}*/
};

/**
 * set mouse status by event type
 * @param {string} type mouse event type 
 */
MagoManager.prototype.setMouseStatus = function(type)
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	switch(type)
	{
		case 'leftdown' :{
			this.mouseLeftDown = true;
			this.isCameraMoving = true;
			break;
		}
		case 'leftup' :{
			this.isCameraMoving = false;
			this.mouseLeftDown = false;
			break;
		}
		case 'middledown' :{
			this.mouseMiddleDown = true;
			this.isCameraMoving = true;
			break;
		}
		case 'middleup' :{
			this.isCameraMoving = false;
			this.mouseMiddleDown = false;
			break;
		}
		case 'rightdown' :{
			this.mouseRightDown = true;
			this.isCameraMoving = true;
			break;
		}
		case 'rightup' :{
			this.mouseRightDown = false;
			this.isCameraMoving = false;
			break;
		}
		case 'mousemove' :{
			if(this.mouseMiddleDown || this.mouseLeftDown)
			{
				this.isCameraMoving = true;
			}
			break;
		}
	}
}

/**
 * Swaps the current rendering Phase.
 * 중복 그리기를 방지하기 위하여... (각기 다른 frustum에 걸쳤을 때 여러번 그리는 것을 방지하기 위하여.)
 * @private
 */
MagoManager.prototype.swapRenderingFase = function() 
{
	this.renderingFase += 1;
	if(this.renderingFase > 100)
	this.renderingFase = 1;
};

/**
 * 빌딩을 준비(새버전)
 * staticModel manage
 * @param {gl} gl
 * @private
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

	var counter = 0;

	var currentVisibleNodes = [].concat(visibleObjControlerNodes.currentVisibles0, 
		visibleObjControlerNodes.currentVisibles2, 
		visibleObjControlerNodes.currentVisibles3, 
		visibleObjControlerNodes.currentVisibles0Transparents, 
		visibleObjControlerNodes.currentVisibles2Transparents, 
		visibleObjControlerNodes.currentVisibles3Transparents,
		visibleObjControlerNodes.currentVisiblesAux,
		visibleObjControlerNodes.currentVisiblesToPrepare);
	for (var i=0, length = currentVisibleNodes.length; i<length; i++) 
	{
		node = currentVisibleNodes[i];
		
		// Check if the node is a referenceNode.***
		var attributes = node.data.attributes;
		if (attributes === undefined)
		{ continue; }
	
		neoBuilding = node.data.neoBuilding;
		
		if (attributes.projectId !== undefined && attributes.isReference !== undefined && attributes.isReference === true)
		{
			StaticModelsManager.manageStaticModel(node, this);
		}
		
		var fromSmartTile = node.data.attributes.fromSmartTile;
		if (fromSmartTile === undefined)
		{ fromSmartTile = false; }

		// check if this building is ready to render.***
		if (neoBuilding)
		{
			// 1) MetaData
			var metaData = neoBuilding.metaData;
			if (metaData.fileLoadState === CODE.fileLoadState.READY) 
			{
				if (!fromSmartTile) // load only if this no is NO from a smartTile.***
				{
					projectFolderName = neoBuilding.projectFolderName;
					if (this.fileRequestControler.isFullHeaders())	{ return; }
					var neoBuildingHeaderPath = geometryDataPath + "/" + projectFolderName + "/" + neoBuilding.buildingFileName + "/HeaderAsimetric.hed";
					
					this.readerWriter.getNeoHeaderAsimetricVersion(gl, neoBuildingHeaderPath, neoBuilding, this.readerWriter, this); // Here makes the tree of octree.***
				}
			}
			else if (metaData.fileLoadState === CODE.fileLoadState.LOADING_FINISHED) 
			{
				var bytesReaded = 0;
				neoBuilding.parseHeader(neoBuilding.headerDataArrayBuffer, bytesReaded);
				//헤더 파싱 후 높이 보정 대상 확인
				if (node.isNeedValidHeight(this)) { this._needValidHeightNodeArray.push(node); }

				counter++;
				if (counter > 60)
				{ break; }
			}
		}
		
	}
	currentVisibleNodes.length = 0;
};

/**
 * Here updates the modelView matrices.
 * @param {SceneState} sceneState
 * @private
 */
MagoManager.prototype.upDateSceneStateMatrices = function(sceneState) 
{
	if (this.myCameraSCX === undefined) 
	{ this.myCameraSCX = new Camera({name: "cameraSCX"}); }

	if (this.configInformation === undefined) 
	{
		// We are on MagoWorld. No need update matrices.***
		return;
	}

	if (this.isCesiumGlobe())
	{
		// * if this is in Cesium:
		var scene = this.scene;
		var uniformState = scene._context.uniformState;
		
		//if(!Matrix4.areEqualArrays(sceneState.modelViewMatrixLast, uniformState.modelView) || !Matrix4.areEqualArrays(sceneState.projectionMatrixLast, uniformState._projection))
		//{
		//	// calculate matrices.
		//	Matrix4.copyArray(uniformState.modelView, sceneState.modelViewMatrixLast);
		//	Matrix4.copyArray(uniformState.modelView, sceneState.modelViewMatrixLast);
		//}
		
		// ModelViewMatrix.
		//sceneState.modelViewMatrix._floatArrays = Cesium.Matrix4.clone(uniformState.modelView, sceneState.modelViewMatrix._floatArrays);
		
		// Calculate modelViewMatrix.
		if (this.isFarestFrustum())
		{
			var camera = scene.camera;
			var camPosX = camera.positionWC.x;
			var camPosY = camera.positionWC.y;
			var camPosZ = camera.positionWC.z;
			var camDirX = camera.directionWC.x;
			var camDirY = camera.directionWC.y;
			var camDirZ = camera.directionWC.z;
			var camUpX = camera.upWC.x;
			var camUpY = camera.upWC.y;
			var camUpZ = camera.upWC.z;
		
			var tergetX = camPosX + camDirX * 1000;
			var tergetY = camPosY + camDirY * 1000;
			var tergetZ = camPosZ + camDirZ * 1000;
		
			var modelViewMatrix = this.sceneState.modelViewMatrix;																	
			modelViewMatrix._floatArrays = Matrix4.lookAt(modelViewMatrix._floatArrays, [camPosX, camPosY, camPosZ], 
				[tergetX, tergetY, tergetZ], 
				[camUpX, camUpY, camUpZ]);
		}
		
		// ProjectionMatrix.***
		Cesium.Matrix4.toArray(uniformState._projection, sceneState.projectionMatrix._floatArrays); // original.***

		// test keeping projectionMatrix for each frustum.*********************************
		/*
		var currFrustumIdx = this.currentFrustumIdx;
		if(sceneState.projectionMatrixInvMap === undefined)
		sceneState.projectionMatrixInvMap = [];

		if(!sceneState.projectionMatrixInvMap[currFrustumIdx])
		{
			var projMatAux = new Matrix4();
			sceneState.projectionMatrixInvMap[currFrustumIdx] = projMatAux;
		}

		sceneState.projectionMatrixInvMap[currFrustumIdx].copyFromMatrix4(sceneState.getProjectionMatrixInv());
		*/
		// End test.-----------------------------------------------------------------------

		// Given ModelViewMatrix & ProjectionMatrix, calculate all sceneState matrix.
		sceneState.projectionMatrixInv = undefined;
		var modelViewMatrixInv = sceneState.getModelViewMatrixInv();
		modelViewMatrixInv._floatArrays = glMatrix.mat4.invert(modelViewMatrixInv._floatArrays, sceneState.modelViewMatrix._floatArrays);
	
		// normalMat.***
		sceneState.normalMatrix4._floatArrays = glMatrix.mat4.transpose(sceneState.normalMatrix4._floatArrays, modelViewMatrixInv._floatArrays);
			
		// modelViewRelToEye.***
		sceneState.modelViewRelToEyeMatrix._floatArrays = glMatrix.mat4.copy(sceneState.modelViewRelToEyeMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);
		sceneState.modelViewRelToEyeMatrix._floatArrays[12] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[13] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[14] = 0;
		sceneState.modelViewRelToEyeMatrix._floatArrays[15] = 1;
		
		sceneState.modelViewRelToEyeMatrixInv._floatArrays = glMatrix.mat4.invert(sceneState.modelViewRelToEyeMatrixInv._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);
			
		// modelViewProjection.***
		sceneState.modelViewProjMatrix._floatArrays = glMatrix.mat4.multiply(sceneState.modelViewProjMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewMatrix._floatArrays);

		// modelViewProjectionRelToEye.***
		sceneState.modelViewProjRelToEyeMatrix._floatArrays = glMatrix.mat4.multiply(sceneState.modelViewProjRelToEyeMatrix._floatArrays, sceneState.projectionMatrix._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);

		// Large far projection for lighting.
		if(sceneState.applyLightsShadows)
		{
			var farForLighting = 20000.0; // 20km
			var nearForLighting = 0.1;
			var fovyRad = sceneState.camera.frustum.fovyRad[0];
			var aspectRatio = sceneState.camera.frustum.aspectRatio[0];
			var projectionMatrixLighting = sceneState.projectionMatrixLighting; // No used.
			projectionMatrixLighting._floatArrays = glMatrix.mat4.perspective(projectionMatrixLighting._floatArrays, fovyRad, aspectRatio, nearForLighting, farForLighting);

			var modelViewProjRelToEyeMatrixLighting = sceneState.modelViewProjRelToEyeMatrixLighting;
			modelViewProjRelToEyeMatrixLighting._floatArrays = glMatrix.mat4.multiply(modelViewProjRelToEyeMatrixLighting._floatArrays, projectionMatrixLighting._floatArrays, sceneState.modelViewRelToEyeMatrix._floatArrays);
		}
		
		// Check camera.
		var cameraPosition = scene.context._us._cameraPosition;
		ManagerUtils.calculateSplited3fv([cameraPosition.x, cameraPosition.y, cameraPosition.z], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);

		var frustumCommandsList = this.scene._frustumCommandsList;
		if (frustumCommandsList === undefined)
		{ frustumCommandsList = this.scene.frustumCommandsList; }

		if (this.isFarestFrustum())
		{
			var camPosX = this.scene.camera.positionWC.x;
			var camPosY = this.scene.camera.positionWC.y;
			var camPosZ = this.scene.camera.positionWC.z;
			var camDirX = this.scene.camera.direction.x;
			var camDirY = this.scene.camera.direction.y;
			var camDirZ = this.scene.camera.direction.z;
			var camUpX = this.scene.camera.up.x;
			var camUpY = this.scene.camera.up.y;
			var camUpZ = this.scene.camera.up.z;
			if (sceneState.camera.isCameraMoved(camPosX, camPosY, camPosZ, camDirX, camDirY, camDirZ, camUpX, camUpY, camUpZ ))
			{
				this.isCameraMoved = true;
				this.emit('isCameraMoved');
			}

			sceneState.camera.calculateSpeed(camPosX, camPosY, camPosZ, this.getCurrentTime());
		}
		
		// Update sceneState camera.***
		this.upDateCamera(sceneState.camera);

		if(sceneState.drawingBufferWidth[0] !== scene.drawingBufferWidth || sceneState.drawingBufferHeight[0] !== scene.drawingBufferHeight)
		{
			sceneState.drawingBufferWidth[0] = scene.drawingBufferWidth;
			sceneState.drawingBufferHeight[0] = scene.drawingBufferHeight;

			var canvas = this.getObjectLabel();
			canvas.width = scene.drawingBufferWidth;
			canvas.height = scene.drawingBufferHeight;
			window.dispatchEvent(this._changeCanvasSizeEvent);
		}

		// set nearfar-array.***
		var currFrustumIdx = this.currentFrustumIdx;
		var projectionMat = this.sceneState.projectionMatrix;
		var n = Matrix4.getNearFromPerspectiveMatrix(projectionMat);
		var f = Matrix4.getFarFromPerspectiveMatrix(projectionMat);
		this.frustumVolumeControl.nearFarArray[currFrustumIdx*2] = n;
		this.frustumVolumeControl.nearFarArray[currFrustumIdx*2+1] = f;
	}
	else/* if (this.configInformation.basicGlobe === Constant.MAGOWORLD)*/
	{
		var camera = sceneState.camera;
		var camPos = camera.position;
		var frustum0 = camera.getFrustum(0);

		// determine frustum near & far.***
		var camHeight = camera.getCameraElevation();
		var eqRadius = Globe.equatorialRadius();
		
		// Calculate near - far.*******************************************
		if (camHeight < 0){ camHeight *= -1; }
		
		var degToRad = Math.PI/180;
		var d = eqRadius + camHeight;
		var alfaRad = Math.acos(eqRadius / d);
		var far = d*Math.sin(alfaRad)*0.8;
		if (camHeight > 50000)
		{ far *= 1.5; }

		if (far < 100000.0)
		{ far = 100000.0; }

		frustum0.near[0] = 0.0001;
		
		if (camHeight > 10000)
		{
			frustum0.near[0] = 0.1 + camHeight*0.8;
		}
		else
		{
			frustum0.near[0] = 0.1;
		}
		
		frustum0.far[0] = far;

		if (this.postFxShadersManager.bUseLogarithmicDepth)
		{
			frustum0.near[0] = 1e-6;
		}
		// End-------------------------------------------------------------
		
		ManagerUtils.calculateSplited3fv([camPos.x, camPos.y, camPos.z], sceneState.encodedCamPosHigh, sceneState.encodedCamPosLow);
		
		// projection.***
		// consider near as zero provisionally.***
		var projectionMatrix = sceneState.projectionMatrix;
		projectionMatrix = Frustum.getProjectionMatrix(frustum0, projectionMatrix);

		// perspective for reverseDepthRange:
		/*
		projectionMatrix.set(2, 2, -projectionMatrix.get(2, 2));
		projectionMatrix.set(2, 3, -projectionMatrix.get(2, 3));
		var frustum0 = this.myCameraSCX.getFrustum(0);
		var sceneCamFurustum0 = sceneState.camera.getFrustum(0);
		frustum0.near[0] = sceneCamFurustum0.near[0];
		frustum0.far[0] = sceneCamFurustum0.far[0];
		frustum0.fovyRad[0] = sceneCamFurustum0.fovyRad[0];
		frustum0.tangentOfHalfFovy[0] = sceneCamFurustum0.tangentOfHalfFovy[0];
		frustum0.fovRad[0] = sceneCamFurustum0.fovRad[0];
		frustum0.aspectRatio[0] = sceneCamFurustum0.aspectRatio[0];

		var t = 1.0 / (Math.tan(sceneCamFurustum0.fovRad[0] * 0.5));
		var a = t;
		var b = (t * sceneCamFurustum0.aspectRatio[0]);
		projectionMatrix.setByFloat32Array(new Float32Array([
			a, 0.0, 0.0, 0.0,
			0.0, b, 0.0, 0.0,
			0.0, 0.0, -frustum0.near[0], 1.0,
			0.0, 0.0, 1.0, 0.0]));
			*/
		
		// Large far projection for sky.
		var farSky = eqRadius + camHeight * 1.5;
		var projectionMatrixSky = sceneState.projectionMatrixSky;
		projectionMatrixSky._floatArrays = glMatrix.mat4.perspective(projectionMatrixSky._floatArrays, frustum0.fovyRad[0], frustum0.aspectRatio[0], frustum0.near[0], farSky);
		
		// modelView.***
		var modelViewMatrix = sceneState.modelViewMatrix;
		var modelViewMatrixInv = sceneState.getModelViewMatrixInv();
		modelViewMatrixInv._floatArrays = glMatrix.mat4.invert(modelViewMatrixInv._floatArrays, modelViewMatrix._floatArrays);
	
		// normalMat.***
		var normalMatrix4 = sceneState.normalMatrix4;
		normalMatrix4._floatArrays = glMatrix.mat4.transpose(normalMatrix4._floatArrays, modelViewMatrixInv._floatArrays);
		
		// modelViewRelToEye.***
		var modelViewRelToEyeMatrix = sceneState.modelViewRelToEyeMatrix;
		modelViewRelToEyeMatrix._floatArrays = glMatrix.mat4.copy(modelViewRelToEyeMatrix._floatArrays, modelViewMatrix._floatArrays);
		modelViewRelToEyeMatrix._floatArrays[12] = 0;
		modelViewRelToEyeMatrix._floatArrays[13] = 0;
		modelViewRelToEyeMatrix._floatArrays[14] = 0;
		modelViewRelToEyeMatrix._floatArrays[15] = 1;
		
		var modelViewRelToEyeMatrixInv = sceneState.modelViewRelToEyeMatrixInv;
		modelViewRelToEyeMatrixInv._floatArrays = glMatrix.mat4.invert(modelViewRelToEyeMatrixInv._floatArrays, modelViewRelToEyeMatrix._floatArrays);
		
		// modelViewProjection.***
		var modelViewProjMatrix = sceneState.modelViewProjMatrix;
		modelViewProjMatrix._floatArrays = glMatrix.mat4.multiply(modelViewProjMatrix._floatArrays, projectionMatrix._floatArrays, modelViewMatrix._floatArrays);
		
		// modelViewProjectionRelToEye.***
		var modelViewProjRelToEyeMatrix = sceneState.modelViewProjRelToEyeMatrix;
		modelViewProjRelToEyeMatrix._floatArrays = glMatrix.mat4.multiply(modelViewProjRelToEyeMatrix._floatArrays, projectionMatrix._floatArrays, modelViewRelToEyeMatrix._floatArrays);
		
		// Large far modelViewProjectionRelToEyeSky.***
		var modelViewProjRelToEyeMatrixSky = sceneState.modelViewProjRelToEyeMatrixSky;
		modelViewProjRelToEyeMatrixSky._floatArrays = glMatrix.mat4.multiply(modelViewProjRelToEyeMatrixSky._floatArrays, projectionMatrixSky._floatArrays, modelViewRelToEyeMatrix._floatArrays);

		// Parameters for logarithmic depth buffer.
		sceneState.fCoef_logDepth[0] = 2.0 / Math.log2(frustum0.far[0] + 1.0);

		// set nearfar-array.***
		var currFrustumIdx = this.currentFrustumIdx;
		this.frustumVolumeControl.nearFarArray[currFrustumIdx*2] = frustum0.near[0];
		this.frustumVolumeControl.nearFarArray[currFrustumIdx*2+1] = frustum0.far[0];
	}
	
	
	sceneState.modelViewProjMatrixInv = undefined; // init. Calculate when necessary.***
	sceneState.projectionMatrixInv = undefined; // init.Calculate when necessary.***
	
	if (this.depthFboNeo !== undefined)
	{
		var noiseTexture = this.texturesStore.getNoiseTexture4x4();
		sceneState.ssaoNoiseScale2[0] = this.depthFboNeo.width[0]/noiseTexture.width;
		sceneState.ssaoNoiseScale2[1] = this.depthFboNeo.height[0]/noiseTexture.height;
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

	
	
	// Test.***************************
	/*
	var currFrustumIdx = this.currentFrustumIdx;
	var frustumFar = sceneState.camera.frustumsArray[currFrustumIdx].far[0];
	
	var point = ManagerUtils.geographicCoordToWorldPoint(126.61342381397036, 37.57615052829767, 10, undefined, this);
	var cartesian = [point.x, point.y, point.z, 1.0];
	
	var transformedPoint_MVP = sceneState.modelViewProjMatrix.transformPoint4D__test(cartesian);
	var xDivW = transformedPoint_MVP[0]/transformedPoint_MVP[3];
	var yDivW = transformedPoint_MVP[1]/transformedPoint_MVP[3];
	var zDivW = transformedPoint_MVP[2]/transformedPoint_MVP[3];
	var transformedPoint_MVP_divW = [xDivW, yDivW, zDivW, 1.0];
	var camera = sceneState.camera;
	var frustum = camera.bigFrustum;
		
	var zDivW_divFar = zDivW/frustum.far[0];
	var transformedPoint_MV = sceneState.modelViewMatrix.transformPoint4D__test(cartesian);
	var transformedPoint_P = sceneState.projectionMatrix.transformPoint4D__test(cartesian);
	*/


	// update sun if exist.
	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (sceneState.sunSystem && sceneState.applySunShadows && this.isFarestFrustum())
		{
			sceneState.sunSystem.updateSun(this);
		}
	}

	// Now, calculate sunDirCC.
	var normalMatrix4 = sceneState.normalMatrix4;
	var sunDirWCPoint = new Point3D(sceneState.sunSystem.sunDirWC[0], sceneState.sunSystem.sunDirWC[1], sceneState.sunSystem.sunDirWC[2]);
	var sunDirCC = normalMatrix4.rotatePoint3D(sunDirWCPoint, undefined);

	sceneState.sunSystem.sunDirCC[0] = sunDirCC.x;
	sceneState.sunSystem.sunDirCC[1] = sunDirCC.y;
	sceneState.sunSystem.sunDirCC[2] = sunDirCC.z;
};

/**
 * Here updates the camera's parameters and frustum planes.
 * @param {Camera} camera
 * @private
 */
MagoManager.prototype.upDateCamera = function(resultCamera) 
{
	if (this.isCesiumGlobe())
	{
		var scene = this.scene;
		var frustumCommandsList = scene.frustumCommandsList;
		var frustumIdx = this.currentFrustumIdx;
		var camera = this.sceneState.camera;
		//var currentFrustumFar = frustumCommandsList[frustumIdx].far;
		//var currentFrustumNear = frustumCommandsList[frustumIdx].near;

		// find near and far by projectionMatrix.***
		var projectionMat = this.sceneState.projectionMatrix;
		var n = Matrix4.getNearFromPerspectiveMatrix(projectionMat);
		var f = Matrix4.getFarFromPerspectiveMatrix(projectionMat);
		var currentFrustumFar = f;
		var currentFrustumNear = n;
		
		// take all frustums near-far distances.***
		// In Cesium: If useLogDepth opaqueFrustumNearOffset = 0.9. Else opaqueFrustumNearOffset = 0.9999;
		var nearOffset = scene.opaqueFrustumNearOffset;
		var numFrustums = frustumCommandsList.length;
		var distancesArray = [];
		var tanHalfFovy = undefined;
		for (var i=0; i<numFrustums; i++)
		{
			distancesArray[i*2] = frustumCommandsList[i].near;
			distancesArray[i*2+1] = frustumCommandsList[i].far;
			
			if ( i !== 0 )
			{ distancesArray[i*2] *= nearOffset; }
			
			// Set frustum parameters.***
			var frustum = camera.getFrustum(i);
			frustum.far[0] = frustumCommandsList[i].far; 
			frustum.near[0] = frustumCommandsList[i].near;
			frustum.fovRad[0] = scene.camera.frustum._fov;
			frustum.fovyRad[0]= scene.camera.frustum._fovy;
			frustum.aspectRatio[0] = scene.camera.frustum._aspectRatio;
			if (tanHalfFovy === undefined)
			{ tanHalfFovy = Math.tan(frustum.fovyRad/2); }
			frustum.tangentOfHalfFovy[0] = tanHalfFovy;
		}
		
		// Set cam dir & up by modelViewMatrix.***
		var sceneState = this.sceneState;
		var modelViewMatInv = sceneState.getModelViewMatrixInv();
		//var camPosX = modelViewMatInv._floatArrays[12]; // No enough precision. 
		//var camPosY = modelViewMatInv._floatArrays[13]; // No enough precision. 
		//var camPosZ = modelViewMatInv._floatArrays[14]; // No enough precision. 
		
		var camPosX = scene.camera.positionWC.x;
		var camPosY = scene.camera.positionWC.y;
		var camPosZ = scene.camera.positionWC.z;
		
		var camDirX = -modelViewMatInv._floatArrays[8];
		var camDirY = -modelViewMatInv._floatArrays[9];
		var camDirZ = -modelViewMatInv._floatArrays[10];
		
		var camUpX = modelViewMatInv._floatArrays[4];
		var camUpY = modelViewMatInv._floatArrays[5];
		var camUpZ = modelViewMatInv._floatArrays[6];
		
		resultCamera.position.set(camPosX, camPosY, camPosZ);
		resultCamera.direction.set(camDirX, camDirY, camDirZ);
		resultCamera.up.set(camUpX, camUpY, camUpZ);
		
		var aspectRatio = frustum.aspectRatio[0];
		var fovy = frustum.fovyRad[0];	
		
		frustum = resultCamera.getFrustum(frustumIdx);
		resultCamera.frustum.near[0] = currentFrustumNear;
		resultCamera.frustum.far[0] = currentFrustumFar;
		resultCamera.setFrustumsDistances(numFrustums, distancesArray);
		resultCamera.setAspectRatioAndFovyRad(aspectRatio, fovy);
		resultCamera.calculateFrustumsPlanes();
		
		//resultCamera.currentFrustumFar
	}
	else/* if (this.configInformation.basicGlobe === Constant.MAGOWORLD)*/
	{
		var camera = this.sceneState.camera;
		
		camera.doInertialMovement(this);
		
		var frustumIdx = 0;
		var camera = this.sceneState.camera;
		var frustum = camera.getFrustum(frustumIdx);
		var aspectRatio = frustum.aspectRatio[0];
		var fovy = frustum.fovyRad[0];

		var currentFrustumFar = frustum.far[0];
		var currentFrustumNear = frustum.near[0];
		
		this.sceneState.camera.frustum.near[0] = currentFrustumNear;
		this.sceneState.camera.frustum.far[0] = currentFrustumFar;
		this.sceneState.camera.frustum.aspectRatio[0] = aspectRatio;
		
		// take all frustums near-far distances.***
		var numFrustums = 1;
		var distancesArray = [];
		for (var i=0; i<numFrustums; i++)
		{
			distancesArray[i*2] = frustum.near[0];
			distancesArray[i*2+1] = frustum.far[0];
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
 * @private
 */
MagoManager.prototype.getCurrentTime = function() 
{
	if (this.currTime === undefined) 
	{
		this.dateSC = new Date();
		this.currTime = this.dateSC.getTime();
	}
	return this.currTime;
};

/**
 * Returns WebGL Rendering Context.
 * @private
 */
MagoManager.prototype.getGl = function() 
{
	if (this.sceneState === undefined)
	{ return undefined; }
	
	return this.sceneState.gl;
};

/**
 * Loads necessary data.
 * @private
 */
MagoManager.prototype.loadAndPrepareData = function() 
{
	var gl = this.getGl();
	
	// 1) LOD 0.***********************************************************************************
	this.visibleObjControlerOctrees.initArrays(); // init.******

	var node;
	// lod 0 & lod 1.
	var visibles0 = this.visibleObjControlerNodes.getOpaquesTransparentsByLod(0);
	var visibles2 = this.visibleObjControlerNodes.getOpaquesTransparentsByLod(2);
	var visibles3 = this.visibleObjControlerNodes.getOpaquesTransparentsByLod(3);

	this.checkPropertyFilters(visibles0);
	this.checkPropertyFilters(visibles2);
	this.checkPropertyFilters(visibles3);

	// Lod0 opaques.***
	var nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
	for (var i=0; i<nodesCount; i++) 
	{
		node = this.visibleObjControlerNodes.currentVisibles0[i];
		var attributes = node.data.attributes;
		if (attributes.objectType === "basicF4d")
		{
			// lod0 일시 카메라에 들어오는 옥트리들을 추출
			if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 0))
			{
				// any octree is visible.
				this.visibleObjControlerNodes.currentVisibles0.splice(i, 1);
				i--;
				nodesCount = this.visibleObjControlerNodes.currentVisibles0.length;
			}
		}
	}

	// Lod0 transparents.***
	nodesCount = this.visibleObjControlerNodes.currentVisibles0Transparents.length;
	for (var i=0; i<nodesCount; i++) 
	{
		node = this.visibleObjControlerNodes.currentVisibles0Transparents[i];
		var attributes = node.data.attributes;
		if (attributes.objectType === "basicF4d")
		{
			// lod0 일시 카메라에 들어오는 옥트리들을 추출
			if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 0))
			{
				// any octree is visible.
				this.visibleObjControlerNodes.currentVisibles0Transparents.splice(i, 1);
				i--;
				nodesCount = this.visibleObjControlerNodes.currentVisibles0Transparents.length;
			}
		}
	}
	
	this.prepareVisibleOctreesSortedByDistance(gl, this.visibleObjControlerOctrees); 
	this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles0); 
	this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles1); 
	this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles2); 
	
	// lod 2.
	// TODO : maxRequest count to settings
	if (this.readerWriter.referencesList_requested < 5)
	{
		// Opaques.***
		nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
		for (var i=0; i<nodesCount; i++) 
		{
			node = this.visibleObjControlerNodes.currentVisibles2[i];
			var attributes = node.data.attributes;
			if (attributes.objectType === "basicF4d")
			{
				if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 2))
				{
					// any octree is visible.
					this.visibleObjControlerNodes.currentVisibles2.splice(i, 1);
					i--;
					nodesCount = this.visibleObjControlerNodes.currentVisibles2.length;
				}
			}
		}

		// Transparents.***
		nodesCount = this.visibleObjControlerNodes.currentVisibles2Transparents.length;
		for (var i=0; i<nodesCount; i++) 
		{
			node = this.visibleObjControlerNodes.currentVisibles2Transparents[i];
			var attributes = node.data.attributes;
			if (attributes.objectType === "basicF4d")
			{
				if (!this.getRenderablesDetailedNeoBuildingAsimetricVersion(gl, node, this.visibleObjControlerOctrees, 2))
				{
					// any octree is visible.
					this.visibleObjControlerNodes.currentVisibles2Transparents.splice(i, 1);
					i--;
					nodesCount = this.visibleObjControlerNodes.currentVisibles2Transparents.length;
				}
			}
		}

		this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles2); 

	}
	
	// lod3, lod4, lod5.***
	this.readerWriter.skinLegos_requested = 0;
	this.prepareVisibleLowLodNodes(visibles0);
	this.prepareVisibleLowLodNodes(visibles2);
	this.prepareVisibleLowLodNodes(visibles3);
	
	// Init the pCloudPartitionsMother_requested.***
	this.readerWriter.pCloudPartitionsMother_requested = 0;

	// project type 10 prepare
	var pt10Array = this.visibleObjControlerNodes.currentVisiblesPT10;
	if(pt10Array.length > 0)
	{
		var pt10Octrees = [];
		for(var i=0,len=pt10Array.length;i<len;i++)
		{
			var pt10 = pt10Array[i];
			pt10Octrees.push(pt10.data.neoBuilding.octree);
		}
		this.visibleObjControlerOctrees.currentVisibles0 = pt10Octrees;
		this.prepareVisibleOctreesSortedByDistance(gl, this.visibleObjControlerOctrees); 
		//this.prepareVisibleOctreesSortedByDistanceLOD2(gl, this.visibleObjControlerOctrees.currentVisibles0); 
	}

	// TinTerrain.*******************************************************************************************************************************
	if (this.isFarestFrustum())
	{
		var camera = this.sceneState.camera;
		if (this.cameraLastPosition === undefined)
		{ 
			this.cameraLastPosition = new Point3D(0.0, 0.0, 0.0); 
		}

		if (this.cameraLastTime === undefined)
		{ 
			this.cameraLastTime = this.getCurrentTime(); 
		}

		if (this.cameraLastTimeForMesh === undefined)
		{ 
			this.cameraLastTimeForMesh = this.getCurrentTime(); 
		}

		if (this.cameraStopped === undefined)
		{
			this.cameraStopped = true;
		}

		if (this.cameraStoppedForMesh === undefined)
		{
			this.cameraStoppedForMesh = true;
		}


		if (this.tinTerrainManager !== undefined && this.tinTerrainManager.ready)
		{ 
			var dist = camera.position.distToPoint(this.cameraLastPosition);
			if (dist < 4.0)
			{
				var timeDiff = this.getCurrentTime() - this.cameraLastTimeForMesh;
				if (!this.cameraStoppedForMesh && timeDiff > 500)
				{
					this.cameraStoppedForMesh = true;
				}

				if (this.cameraStoppedForMesh)
				{
					this.tinTerrainManager.prepareVisibleTinTerrains(this); 
					this.cameraLastTimeForMesh = this.getCurrentTime();
				}
				
			}
			else
			{
				this.cameraStoppedForMesh = false;
			}
		}

		if (this.fileRequestControler.tinTerrainTexturesRequested < 6)
		{ 
			// 1rst, check cameraPosition vs cameraLastPosition.
			var dist = camera.position.distToPoint(this.cameraLastPosition);

			if (dist < 4.0)
			{
				// Now, check the time-difference.
				var timeDiff = this.getCurrentTime() - this.cameraLastTime;
				if (!this.cameraStopped && timeDiff > 500)
				{
					this.cameraStopped = true;
				}

				if (this.cameraStopped)
				{
					if (this.tinTerrainManager !== undefined && this.tinTerrainManager.ready)
					{ 
						this.tinTerrainManager.prepareVisibleTinTerrainsTextures(this); 
						this.cameraLastTime = this.getCurrentTime();
					}
				}

			}
			else
			{
				this.cameraStopped = false;
			}
		}

		this.cameraLastPosition.set(camera.position.x, camera.position.y, camera.position.z);
	}

	this.manageQueue();
	
};

/**
 * Manages the selection process.
 * @private
 */
MagoManager.prototype.getSelectionFBO = function() 
{
	if (this.selectionFbo === undefined) 
	{ 
		var texturesManager = this.getTexturesManager();
		var gl = this.getGl();
		this.selectionFbo = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); 
		this.selectionFbo.colorBuffer = texturesManager.texturesMergerFbo.colorBuffersArray[3];
	}

	return this.selectionFbo;
};


/**
 * Manages the selection process.
 * @private
 */
MagoManager.prototype.managePickingProcess = function () 
{
	var gl = this.getGl();
	
	var selectionFbo = this.getSelectionFBO();
	
	
	if (this.currentFrustumIdx === 0)
	{
		if ( this.bPicking === true)
		{
			// this is the closest frustum.***
			var selectionManager = this.selectionManager;
			var selectedGeneralObject = selectionManager.currentGeneralObjectSelected ? true : false;
			this.bPicking = false;
			this.arrayAuxSC.length = 0;
			selectionManager.clearCurrents();
			var bSelectObjects = true;

			this.objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC, bSelectObjects);
			
			var auxBuildingSelected = this.arrayAuxSC[0];
			var auxOctreeSelected = this.arrayAuxSC[1];
			var auxNodeSelected = this.arrayAuxSC[3]; 

			var mode = this.magoPolicy.getObjectMoveMode();

			if (mode === CODE.moveMode.ALL) 
			{
				if (auxBuildingSelected && auxNodeSelected) 
				{
					this.emit(MagoManager.EVENT_TYPE.SELECTEDF4D, {
						type      : MagoManager.EVENT_TYPE.SELECTEDF4D, 
						f4d       : auxNodeSelected, 
						timestamp : new Date()
					});
				}
				else if ((this.buildingSelected && !auxBuildingSelected) && (this.nodeSelected && !auxNodeSelected))
				{
					this.emit(MagoManager.EVENT_TYPE.DESELECTEDF4D, {
						type: MagoManager.EVENT_TYPE.DESELECTEDF4D
					});
				}
			}
			else if (mode === CODE.moveMode.OBJECT) 
			{
				if (auxOctreeSelected && this.objectSelected) 
				{
					this.emit(MagoManager.EVENT_TYPE.SELECTEDF4DOBJECT, {
						type      : MagoManager.EVENT_TYPE.SELECTEDF4DOBJECT,
						octree    : auxBuildingSelected,
						object    : this.objectSelected,
						timestamp : new Date()
					});
				}
				else if (this.octreeSelected && !auxOctreeSelected)
				{
					this.emit(MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT, {
						type: MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT
					});
				}
			}

			this.buildingSelected = auxBuildingSelected;
			this.octreeSelected = auxOctreeSelected;
			this.nodeSelected = auxNodeSelected;
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

			if (selectionManager.currentGeneralObjectSelected) 
			{
				this.emit(MagoManager.EVENT_TYPE.SELECTEDGENERALOBJECT, {
					type          : MagoManager.EVENT_TYPE.SELECTEDGENERALOBJECT,
					generalObject : selectionManager.currentGeneralObjectSelected,
					timestamp     : new Date()
				});
			}
			else if (selectedGeneralObject && !selectionManager.currentGeneralObjectSelected)
			{
				this.emit(MagoManager.EVENT_TYPE.DESELECTEDGENERALOBJECT, {
					type: MagoManager.EVENT_TYPE.DESELECTEDGENERALOBJECT
				});
			}
		}
		
		this.selectionColor.init(); // selection colors manager.***
	}
	
	selectionFbo.unbind();
	gl.enable(gl.CULL_FACE);
};

/**
 * Provisional function.
 * @private
 */
MagoManager.prototype.getSilhouetteDepthFbo = function() 
{
	// Provisional function.***
	// Provisional function.***
	// Provisional function.***
	var gl = this.getGl();
	
	if (this.silhouetteDepthFboNeo === undefined) { this.silhouetteDepthFboNeo = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }
	
	return this.silhouetteDepthFboNeo;
};

/**
 * Main rendering function.
 * @private
 */
MagoManager.prototype.TEST__cameraLaser = function() 
{
	// this function tests camera laser.
	var geoCoordsList = this.modeler.getGeographicCoordsList();
	var geoCoordsCount = geoCoordsList.getGeoCoordsCount();
	if(geoCoordsCount < 2)
	return;

	//var geoCoord_start = new GeographicCoord(126.75740, 37.54302, 29.133160613985577);
	//var geoCoord_end = new GeographicCoord(126.75719736534053, 37.54493737467032, 44.055231264041986);

	var geoCoord_start = geoCoordsList.getGeoCoord(geoCoordsCount - 2);
	var geoCoord_end = geoCoordsList.getGeoCoord(geoCoordsCount - 1);

	var posWC = Camera.intersectPointByLaser(geoCoord_start, geoCoord_end, undefined, undefined, this, undefined) ;

	if(posWC)
	{
		var geoCoord = Mago3D.ManagerUtils.pointToGeographicCoord(posWC, undefined);
		geoCoord.makeDefaultGeoLocationData();
		var geoCoordsList = this.modeler.getGeographicCoordsList();
		geoCoordsList.addGeoCoord(geoCoord);
	}
};

/**
 * Main rendering function.
 * @private
 */
MagoManager.prototype.bindMainFramebuffer = function() 
{
	this.scene._context._currentFramebuffer._bind();
};

/**
 * Main rendering function.
 * @private
 */
MagoManager.prototype.getTexturesManager = function () 
{
	if(!this.texturesManager)
	{
		var gl = this.getGl();

		// 1rst, Create a simpleFramebufferAux.***
		if (this.framebufferAux === undefined) { this.framebufferAux = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }

		// Now, create the texturesMerger.***
		this.texturesManager = new TexturesManager(this);
		var bufferWidth = this.sceneState.drawingBufferWidth[0];
		var bufferHeight = this.sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = this.postFxShadersManager.bUseMultiRenderTarget;
		this.texturesManager.texturesMergerFbo = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 5}); 
	}

	return this.texturesManager;
};

/**
 * Main rendering function.
 * @private
 */
MagoManager.prototype.doRender = function (frustumVolumenObject) 
{
	if(!this.isCesiumGlobe())
	{
		this.doRenderMagoWorld(frustumVolumenObject);
		return;
	}

	var gl = this.getGl();
	
	// 1) The depth render.**********************************************************************************************************************
	var renderType = 0; // 0= depth. 1= color.***
	this.renderType = 0;
	var sceneState = this.sceneState;

	// 1.1) render sunDepth.
	if (sceneState.applySunShadows && !this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		this.renderer.renderDepthSunSystem(this.visibleObjControlerNodes);
		this.swapRenderingFase();
	}
	
	var lightsArray = this.visibleObjControlerNodes.currentVisibleNativeObjects.lightSourcesArray;
	var lightCount = lightsArray.length;
	var currentTime = this.getCurrentTime();
	if(lightCount > 0 && sceneState.applyLightsShadows && !this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		// for each visible lightSources, make cubeMap depthTextures if no exist.
		var visiblesArray = this.visibleObjControlerNodes.getAllVisibles();
		var nativeVisiblesArray = this.visibleObjControlerNodes.getAllNatives();
		var lightCullingsCount = 0;
		for(var i=0; i<lightCount; i++)
		{
			var light = lightsArray[i];

			if(!light.cullingUpdatedTime)
				light.cullingUpdatedTime = 0;
			
			if(currentTime !== light.cullingUpdatedTime) 
			{
				var timeDiffSec = (currentTime - light.cullingUpdatedTime)/1000.0;
				if(timeDiffSec < 3)
				continue;

				light.clearIntersectedObjects();
			}

			// In one frame, do only one intersectionCulling for lights.
			if(light.doIntersectedObjectsCulling(visiblesArray, nativeVisiblesArray))
			{
				light.cullingUpdatedTime = currentTime;
				lightCullingsCount ++;
			}

			if(lightCullingsCount > 0)
			break;
		}
	}
	

	// 1.2) render selected silhouetteDepth.
	var selectionManager = this.selectionManager;
	if(selectionManager.existSelectedObjects())
	{
		this.renderer.renderSilhouetteDepth(); // note: integrate this in the gBuffer. TODO:
	}
	
	// Take the depFrameBufferObject of the current frustumVolume.***
	// Create a simpleFramebufferAux.***
	if (this.framebufferAux === undefined) { this.framebufferAux = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }
	if (this.ssaoFromDepthFbo === undefined) { this.ssaoFromDepthFbo = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }

	var bUseMultiRenderTarget = this.postFxShadersManager.bUseMultiRenderTarget;
	
	var texturesManager = this.getTexturesManager();
	this.depthFboNeo = texturesManager.texturesMergerFbo;

	this.depthTex = this.depthFboNeo.colorBuffersArray[0];
	this.normalTex = this.depthFboNeo.colorBuffersArray[1];
	this.albedoTex = this.depthFboNeo.colorBuffersArray[2];
	this.selColorTex = this.depthFboNeo.colorBuffersArray[3];

	var selFBO = this.getSelectionFBO();

	// prev 2) ready to color frame buffer
	this.postFxShadersManager.useProgram(null); // init current bind shader.***

	var bApplyShadow = false;
	if (this.sceneState.sunSystem !== undefined && this.sceneState.applySunShadows)
	{ bApplyShadow = true; }

	if (this.isCesiumGlobe())
	{
		var scene = this.scene;

		// Test to copy terrain.******************************************************************************************
		if(!this.extbuffers)
			this.extbuffers = gl.getExtension("WEBGL_draw_buffers");

		// Take cesium colorBuffer.**********************
		scene._context._currentFramebuffer._bind();
		this.cesiumColorBuffer = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
		// End taking cesium colorBuffer.-------------------

		this.texturesManager.texturesMergerFbo.bind();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.depthTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.normalTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);
		

		if (this.isCameraMoved || this.bPicking)
		{
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.selColorTex, 0);

			this.extbuffers.drawBuffersWEBGL([
				this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
				this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - normal
				this.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - albedo
				this.extbuffers.COLOR_ATTACHMENT3_WEBGL  // gl_FragData[4] - selColor4
				]);

				if(this.isFarestFrustum())
				{
					this.selectionManager.clearCandidates();
				}
				
		}
		else
		{
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
			this.extbuffers.drawBuffersWEBGL([
				this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
				this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - normal
				this.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - albedo
				this.extbuffers.NONE  // gl_FragData[4] - selColor4
				]);
		}

		
		
		if(this.isFarestFrustum())
		{
			gl.clearColor(1.0, 1.0, 1.0, 1.0);
			gl.clearDepth(1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.clearColor(0, 0, 0, 1);

			//this.selectionManager.clearCandidates();
		}
		else
		{
			gl.clear(gl.DEPTH_BUFFER_BIT);
		}

		this.extbuffers.drawBuffersWEBGL([
			this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
			this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - normal
			this.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - albedo
			this.extbuffers.NONE  // gl_FragData[4] - selColor4
			]);
		
		this.renderer.renderTerrainCopy();
		
		// end test.---------------------------------------------------------------------------------------------------

		if (scene && scene._context && scene._context._currentFramebuffer) 
		{
			this.bindMainFramebuffer();
			
			// MRT on cesium.**************************************************
			if(!this.extbuffers)
			this.extbuffers = gl.getExtension("WEBGL_draw_buffers");

			/*
			// Bind mago colorTextures:
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.depthTex, 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTex, 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);

			this.extbuffers.drawBuffersWEBGL([
				this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
				this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
				this.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
				this.extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
			  ]);
			  */
			  
			if(this.isCameraMoved)
			{
				// Attach the selColorBuffer.***
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.depthTex, 0);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTex, 0);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.selColorTex, 0);

				this.extbuffers.drawBuffersWEBGL([
					this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
					this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
					this.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
					this.extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
					this.extbuffers.COLOR_ATTACHMENT4_WEBGL // gl_FragData[4] - selColor4
					]);
			}
			else
			{
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.depthTex, 0);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTex, 0);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);

				this.extbuffers.drawBuffersWEBGL([
					this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
					this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
					this.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
					this.extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
					this.extbuffers.NONE // gl_FragData[3] - albedoTex
				]);
			}
			
			// End mrt.---------------------------------------------------------------------------------------------------------------
			
		}
	}


	// 2) gBuffer render.*****************************************************************************************************************
	renderType = 1;
	this.renderType = 1;
	gl.frontFace(gl.CCW);
	this.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControlerNodes);

	if (this.weatherStation)
	{
		this.weatherStation.renderWeather(this);
	}

	// Render transparents.****************************************************************************************************************
	if (this.isCesiumGlobe())
	{
		this.bindMainFramebuffer();
		// Deactive depth & normals for transparent pass.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
		this.extbuffers.drawBuffersWEBGL([
			this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
			this.extbuffers.NONE, // gl_FragData[1] - depthTex
			this.extbuffers.NONE, // gl_FragData[2] - normalTex
			this.extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
			this.extbuffers.COLOR_ATTACHMENT4_WEBGL // gl_FragData[4] - selColor4
			]);
	}

	renderType = 1;
	this.renderType = 1;
	this.renderer.renderGeometryBufferTransparents(gl, renderType, this.visibleObjControlerNodes);

	if (this.weatherStation)
	{
		this.weatherStation.renderWeatherTransparents(this);
	}

	// check if must render boundingBoxes.
	if (this.magoPolicy.getShowBoundingBox())
	{
		var bRenderLines = true;
		//var currentVisiblesArray = visibleObjControlerNodes.currentVisibles0.concat(visibleObjControlerNodes.currentVisibles2,);
		var visibles0 = this.visibleObjControlerNodes.getOpaquesTransparentsByLod(0);
		var visibles2 = this.visibleObjControlerNodes.getOpaquesTransparentsByLod(2);
		var visibles3 = this.visibleObjControlerNodes.getOpaquesTransparentsByLod(3);
		this.renderer.renderBoundingBoxesNodes(visibles0, undefined, bRenderLines);
		this.renderer.renderBoundingBoxesNodes(visibles2, undefined, bRenderLines);
		this.renderer.renderBoundingBoxesNodes(visibles3, undefined, bRenderLines);
		this.renderer.renderBoundingBoxesNodes(this.visibleObjControlerNodes.currentVisiblesAux, undefined, bRenderLines);
	}

	// Once all frustums was rendered, then set the camera moved = false.*****************************
	if (this.currentFrustumIdx === 0)
	{
		this.isCameraMoved = false;
	}
	//------------------------------------------------------------------------------------------------

	// Finally do screenSpaceObjects render.
	this.renderer.renderScreenSpaceObjects(gl);

	if (this.isCesiumGlobe())
	{
		this.bindMainFramebuffer();
		// unbind mago colorTextures:
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
		gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0); // selColor4.
		this.extbuffers.drawBuffersWEBGL([
			this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
			this.extbuffers.NONE, // gl_FragData[1]
			this.extbuffers.NONE, // gl_FragData[2]
			this.extbuffers.NONE, // gl_FragData[3]
			this.extbuffers.NONE, // gl_FragData[4]
			]);
	}

	// DEBUG.Render fisically lights sources.*************************************************************************
	//this.renderer.renderNativeLightSources(renderType, this.visibleObjControlerNodes) ; // debug component.
	//------------------------------------------------------------------------------------------------------
	// End rendering transparents.----------------------------------------------------------------------------------------------------------

	if (sceneState.applyLightsShadows)
	{
		// if exist lightSources, the store all lightSources of all frustums.
		var lightSourcesArray = this.visibleObjControlerNodes.currentVisibleNativeObjects.lightSourcesArray;
		if(!this.lightSourcesMap)
		{ this.lightSourcesMap = {}; }

		var lightCount = lightSourcesArray.length;
		for(var i=0; i<lightCount; i++)
		{
			var light = lightSourcesArray[i];
			var lightGuid = light._guid;
			this.lightSourcesMap[lightGuid] = light;
		}

		if (this.currentFrustumIdx === 0) 
		{
			// now, make the lightSourcesArray.
			if(!this.lightSourcesArray)
			{ this.lightSourcesArray = []; }

			// 1rst, init the array.
			this.lightSourcesArray.length = 0;

			for(var key in this.lightSourcesMap)
			{
				if(this.lightSourcesMap.hasOwnProperty(key))
				{
					this.lightSourcesArray.push(this.lightSourcesMap[key]);
				}
			}

			// finally init the lightSourcesMap.
			this.lightSourcesMap = {};
		}
	}

	// 1.1) ssao and other effects from depthBuffer render.*****************************************************************************
	if (this.currentFrustumIdx === 0) 
	{
		// Render the lightBuffer.*****************************************
		if (sceneState.applyLightsShadows)
		{
			// Create lightBufferFBO if no exist.
			if(!this.texturesManager.lBuffer)
			{
				// create a lBuffer with 2 colorTextures : diffuseLighting & specularLighting.
				var bufferWidth = this.sceneState.drawingBufferWidth[0];
				var bufferHeight = this.sceneState.drawingBufferHeight[0];
				var bUseMultiRenderTarget = this.postFxShadersManager.bUseMultiRenderTarget;
				this.texturesManager.lBuffer = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 3}); 
			}
			this.lBuffer = this.texturesManager.lBuffer;
			this.diffuseLightTex = this.lBuffer.colorBuffersArray[0];
			this.specularLightTex = this.lBuffer.colorBuffersArray[1];
			this.LightFogTex = this.lBuffer.colorBuffersArray[2];
			
			// Render the lightBuffer.
			this.renderer.renderLightDepthCubeMaps(this.lightSourcesArray); // active this code for shadows.
			this.renderer.renderLightBuffer(this.lightSourcesArray);

			if (this.isCesiumGlobe())
			{
				this.bindMainFramebuffer();
				// unbind mago colorTextures:
				
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
				gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
				this.extbuffers.drawBuffersWEBGL([
					this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
					this.extbuffers.NONE, // gl_FragData[1]
					this.extbuffers.NONE, // gl_FragData[2]
					this.extbuffers.NONE, // gl_FragData[3]
					]);
					
			}

			// End rendering lightBuffer.--------------------------------------------
		}

		// Do ssaoFromDepth render.
		this.renderer.renderSsaoFromDepth(gl);

		if (this.isCesiumGlobe())
		{
			this.bindMainFramebuffer();
		}

		// Final render output.**************************************************************
		this.renderer.renderScreenQuad(gl); // 1rst screenQuad. (ssao, lighting, shadows)
		this.renderer.renderScreenQuad2(gl); // 2nd screenQuad. (lightFog)

		this.renderCluster();

		if (this.selectionManager)
		{
			if(this.selectionManager.existSelectedObjects())
			{
				this.renderer.renderSilhouette();
			}
		}

		// Debug component.******************************************
		/*
		var lightAux;
		if(lightsArray)
		{
			var lightsCount = lightsArray.length;
			lightAux = lightsArray[lightsCount - 1];
		}
		var options = {
			lightSource : lightAux
		};
		
		this.renderer.renderScreenRectangle(gl, options); // debug component.
		*/
		//-----------------------------------------------------------

	} 

	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
		
	this.swapRenderingFase();
	/*
	// Delete after test!!!!!!!!!!!!!!
	if(!this.test_speechBubble)
	{
		this.objMarkerManager.TEST__ObjectMarker_toNeoReference();
		this.test_speechBubble = true;
	}
	*/
};

/**
 * Binds the magoWorld frameBuffer.
 * @private
 */
MagoManager.prototype.bindMagoFbo = function () 
{
	var gl = this.getGl();

	var texturesManager = this.getTexturesManager();
	this.depthFboNeo = texturesManager.texturesMergerFbo;

	this.depthTex = this.depthFboNeo.colorBuffersArray[0];
	this.normalTex = this.depthFboNeo.colorBuffersArray[1];
	this.albedoTex = this.depthFboNeo.colorBuffersArray[2];
	this.selColorTex = this.depthFboNeo.colorBuffersArray[3];

	var selFBO = this.getSelectionFBO();

	
	texturesManager.texturesMergerFbo.bind();
	
	// MRT on mago.**************************************************
	if(!this.extbuffers)
	this.extbuffers = gl.getExtension("WEBGL_draw_buffers");
	/*
	if(!this.aqwse)
	{
		// Do this if screenSize changes.***
		gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffersArray[0]);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 

		gl.bindTexture(gl.TEXTURE_2D, this.depthTex);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 

		gl.bindTexture(gl.TEXTURE_2D, this.normalTex);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 

		gl.bindTexture(gl.TEXTURE_2D, this.albedoTex);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 

		gl.bindTexture(gl.TEXTURE_2D, this.depthFboNeo.colorBuffersArray[4]);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferWidth, bufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 

		gl.bindTexture(gl.TEXTURE_2D, null);  
		this.aqwse = true;
	}
	*/

	// Bind mago colorTextures:
	gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.depthFboNeo.colorBuffersArray[4], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.depthTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.selColorTex, 0);

	this.extbuffers.drawBuffersWEBGL([
		this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		this.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
		this.extbuffers.COLOR_ATTACHMENT2_WEBGL,// gl_FragData[2] - normalTex
		this.extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
		this.extbuffers.COLOR_ATTACHMENT4_WEBGL // gl_FragData[4] - selColorTex
		]);
};

/**
 * Main rendering function.
 * @private
 */
MagoManager.prototype.doRenderMagoWorld = function (frustumVolumenObject) 
{
	var gl = this.getGl();
	var renderType = 0; // 0= depth. 1= color.***
	this.renderType = 0;
	var sceneState = this.sceneState;
	

	// 1.1) render sunDepth.
	if (sceneState.applySunShadows && !this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		this.renderer.renderDepthSunSystem(this.visibleObjControlerNodes);
		this.swapRenderingFase();
	}
	
	var lightsArray = this.visibleObjControlerNodes.currentVisibleNativeObjects.lightSourcesArray;
	var lightCount = lightsArray.length;
	if(lightCount > 0 && sceneState.applyLightsShadows && !this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		// for each visible lightSources, make cubeMap depthTextures if no exist.
		var visiblesArray = this.visibleObjControlerNodes.getAllVisibles();
		var nativeVisiblesArray = this.visibleObjControlerNodes.getAllNatives();
		
		for(var i=0; i<lightCount; i++)
		{
			var light = lightsArray[i];
			light.doIntersectedObjectsCulling(visiblesArray, nativeVisiblesArray);
		}
	}

	// 1.2) render selected silhouetteDepth.
	var selectionManager = this.selectionManager;
	if(selectionManager.existSelectedObjects())
	{
		this.renderer.renderSilhouetteDepth(); 
	}
	
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);

	this.bindMagoFbo();
	var extbuffers = this.extbuffers;

	gl.clearColor(0, 0, 0, 1);
	gl.clearDepth(1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//gl.clearStencil(0); // provisionally here.***

	// 1rst, render atmosphere & the earth.
	// TinTerrain.**************************************************************************
	if (this.tinTerrainManager !== undefined)
	{
		// Atmosphere.**************************************************
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
			extbuffers.NONE, // gl_FragData[1] - depthTex
			extbuffers.NONE,// gl_FragData[2] - normalTex
			extbuffers.NONE, // gl_FragData[3] - albedoTex
			extbuffers.NONE // gl_FragData[4] - selColorTex
			]);
		this.renderer.renderAtmosphere(gl, renderType);

		// Terrain.*****************************************************
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, this.depthFboNeo.colorBuffersArray[4], 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, this.depthTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, this.normalTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, this.albedoTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, this.selColorTex, 0);
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
			extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
			extbuffers.COLOR_ATTACHMENT2_WEBGL,// gl_FragData[2] - normalTex
			extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
			extbuffers.COLOR_ATTACHMENT4_WEBGL // gl_FragData[4] - selColorTex
			]);
		var bDepthRender = false; // magoManager is no depth render.***
		var renderType = 1;
		this.tinTerrainManager.render (this, bDepthRender, renderType);
	}
	

	// 2) gBuffer render.*****************************************************************************************************************
	renderType = 1;
	this.renderType = 1;
	gl.frontFace(gl.CCW);
	this.renderer.renderGeometryBuffer(gl, renderType, this.visibleObjControlerNodes);
	
	
	// Render transparents.****************************************************************************************************************
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		extbuffers.NONE, // gl_FragData[1]
		extbuffers.NONE, // gl_FragData[2]
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
		extbuffers.COLOR_ATTACHMENT4_WEBGL // gl_FragData[4] - selColor4
		]);

	renderType = 1;
	this.renderType = 1;
	this.renderer.renderGeometryBufferTransparents(gl, renderType, this.visibleObjControlerNodes);
	// End rendering transparents.----------------------------------------------------------------------------------------------------------
		
	// check if must render boundingBoxes.
	if (this.magoPolicy.getShowBoundingBox())
	{
		var bRenderLines = true;
		//var currentVisiblesArray = visibleObjControlerNodes.currentVisibles0.concat(visibleObjControlerNodes.currentVisibles2,);
		this.renderer.renderBoundingBoxesNodes(this.visibleObjControlerNodes.currentVisibles0, undefined, bRenderLines);
		this.renderer.renderBoundingBoxesNodes(this.visibleObjControlerNodes.currentVisibles2, undefined, bRenderLines);
		this.renderer.renderBoundingBoxesNodes(this.visibleObjControlerNodes.currentVisibles3, undefined, bRenderLines);
		this.renderer.renderBoundingBoxesNodes(this.visibleObjControlerNodes.currentVisiblesAux, undefined, bRenderLines);
	}

	if (sceneState.applyLightsShadows)
	{
		// if exist lightSources, the store all lightSources of all frustums.
		var lightSourcesArray = this.visibleObjControlerNodes.currentVisibleNativeObjects.lightSourcesArray;
		if(!this.lightSourcesMap)
		{ this.lightSourcesMap = {}; }

		var lightCount = lightSourcesArray.length;
		for(var i=0; i<lightCount; i++)
		{
			var light = lightSourcesArray[i];
			var lightGuid = light._guid;
			this.lightSourcesMap[lightGuid] = light;
		}

		if (this.currentFrustumIdx === 0) 
		{
			// now, make the lightSourcesArray.
			if(!this.lightSourcesArray)
			{ this.lightSourcesArray = []; }

			// 1rst, init the array.
			this.lightSourcesArray.length = 0;

			for(var key in this.lightSourcesMap)
			{
				if(this.lightSourcesMap.hasOwnProperty(key))
				{
					this.lightSourcesArray.push(this.lightSourcesMap[key]);
				}
			}

			// finally init the lightSourcesMap.
			this.lightSourcesMap = {};
		}
	}
	
	// 1.1) ssao and other effects from depthBuffer render.*****************************************************************************
	if (this.currentFrustumIdx === 0) 
	{
		// Render the lightBuffer.*****************************************
		if (sceneState.applyLightsShadows)
		{
			
			// Create lightBufferFBO if no exist.
			if(!this.texturesManager.lBuffer)
			{
				// create a lBuffer with 2 colorTextures : diffuseLighting & specularLighting.
				var bufferWidth = this.sceneState.drawingBufferWidth[0];
				var bufferHeight = this.sceneState.drawingBufferHeight[0];
				var bUseMultiRenderTarget = this.postFxShadersManager.bUseMultiRenderTarget;
				this.texturesManager.lBuffer = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget : bUseMultiRenderTarget, numColorBuffers : 2}); 
			}
			this.lBuffer = this.texturesManager.lBuffer;
			this.diffuseLightTex = this.lBuffer.colorBuffersArray[0];
			this.specularLightTex = this.lBuffer.colorBuffersArray[1];
			
			// Render the lightBuffer.
			this.renderer.renderLightDepthCubeMaps(this.lightSourcesArray); // active this code for shadows.
			this.renderer.renderLightBuffer(this.lightSourcesArray);
			

			//if (this.isCesiumGlobe())
			{
				//scene._context._currentFramebuffer._bind();
				// unbind mago colorTextures:
				
				//gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
				//gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
				//gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
				//this.extbuffers.drawBuffersWEBGL([
				//	this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
				//	this.extbuffers.NONE, // gl_FragData[1]
				//	this.extbuffers.NONE, // gl_FragData[2]
				//	this.extbuffers.NONE, // gl_FragData[3]
				//	]);
					
			}

			// End rendering lightBuffer.--------------------------------------------
		}
		if (this.ssaoFromDepthFbo === undefined) { this.ssaoFromDepthFbo = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }
		this.renderer.renderSsaoFromDepth(gl);

		// Final render output.
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		//gl.clearColor(1, 0.5, 0.5, 1);
		//gl.clearDepth(1);
		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//gl.clearStencil(0); // provisionally here.***

		this.renderer.renderScreenQuad(gl);
		//this.renderer.renderScreenQuad2(gl);
		//this.renderCluster();

		
		/*
		if (this.selectionManager)
		{
			if(this.selectionManager.existSelectedObjects())
			{
				this.renderer.renderSilhouette();
			}
		}
		*/

		// Debug component.******************************************
		/*
		var lightAux;
		if(lightsArray)
		{
			var lightsCount = lightsArray.length;
			lightAux = lightsArray[lightsCount - 1];
		}
		var options = {
			lightSource : lightAux
		};
		gl.disable(gl.BLEND);
		this.renderer.renderScreenRectangle(gl, options); // debug component.
		*/
		//-----------------------------------------------------------

	}

	// DEBUG.Render lights sources.*************************************************************************
	//this.renderer.renderNativeLightSources(renderType, this.visibleObjControlerNodes) ; // debug component.
	//------------------------------------------------------------------------------------------------------

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	/*
	if (this.weatherStation)
	{
		//if (this.isCesiumGlobe())
		{
			//scene._context._currentFramebuffer._bind();
			// unbind mago colorTextures:
			
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
			gl.framebufferTexture2D(gl.FRAMEBUFFER, this.extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0); // albedoTex.
			this.extbuffers.drawBuffersWEBGL([
				this.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
				this.extbuffers.NONE, // gl_FragData[1]
				this.extbuffers.NONE, // gl_FragData[2]
				this.extbuffers.NONE, // gl_FragData[3]
				]);
				
		}

		//this.weatherStation.renderWindMultiLayers(this);
		//this.weatherStation.test_renderWindLayer(this);
		//this.weatherStation.test_renderTemperatureLayer(this);
		//this.weatherStation.test_renderCuttingPlanes(this, renderType);
		this.weatherStation.renderWeather(this);
	}
	*/
	gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
		
	this.swapRenderingFase();
};

/**
 * cluster 데이터 설정
 * @param {Cluster} cluster 
 */
MagoManager.prototype.addCluster = function(cluster) 
{
	if (!cluster || !cluster instanceof Cluster) 
	{
		throw new Error('cluster is required.');
	}
	
	this.cluster = cluster;
};

/**
 * cluster 데이터 삭제
 */
MagoManager.prototype.clearCluster = function() 
{
	if (this.objMarkerManager)
	{
		this.objMarkerManager.setMarkerByCondition(function(om)
		{
			return !om.tree;
		});
	}
	
	this.cluster = undefined;
};

MagoManager.prototype.renderCluster = function() 
{
	if (this.cluster && this.cluster.quatTree) 
	{
		var qtree = this.cluster.quatTree;
		var camPosWc = this.sceneState.camera.getPosition();
		var result = qtree.getDisplayPoints();
		var trees = qtree.getQuatTreeByCamDistance(undefined, camPosWc);

		if (trees && trees.length > 0) 
		{
			this.cluster.renderFunction.call(this.cluster, trees, this);
		}
	}
};

/**
 * @private
 */
MagoManager.prototype.initCounters = function() 
{
	this.processCounterManager.reset();
};

/**
 * Main loop function. This function contains all Mago3D Pipe-Line.
 * @param {Boolean} isLastFrustum Indicates if this is the last frustum in the render pipe-line.
 * @param {Number} frustumIdx Current frustum indice.
 * @param {Number} numFrustums Total frustums count in current rendering pipe-line.
 * 
 * @private
 */
MagoManager.prototype.startRender = function (isLastFrustum, frustumIdx, numFrustums) 
{
	// Update the current frame's frustums count.
	this.numFrustums = numFrustums;
	this.isLastFrustum = isLastFrustum;
	var camera = this.sceneState.camera;
	
	var gl = this.getGl();
	this.upDateSceneStateMatrices(this.sceneState);
	
	if (this.isFarestFrustum())
	{
		this.dateSC = new Date();
		this.prevTime = this.currTime;
		this.currTime = this.dateSC.getTime();
		
		this.initCounters();
		
		// Before of multiFrustumCullingSmartTile, do animation check, bcos during animation some object can change smartTile-owner.***
		if (this.animationManager !== undefined)
		{ this.animationManager.checkAnimation(this); }

		if (this.myCameraSCX === undefined) 
		{ this.myCameraSCX = new Camera({name: "cameraSCX"}); }
		
		if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
		{
			this.upDateCamera(this.myCameraSCX);
			this.doMultiFrustumCullingSmartTiles(this.myCameraSCX);
			this.smartTileManager.doPendentProcess(this);
		}

		gl.clearStencil(0); // provisionally here.***
		gl.clear(gl.STENCIL_BUFFER_BIT);

		// If mago camera has track node, camera look track node.
		camera.doTrack(this);
		
		// reset stadistics data.
		this.sceneState.resetStadistics();
		
		// clear canvas.
		this.clearCanvas2D();
	}
	
	var cameraPosition = camera.position;
	
	// Take the current frustumVolumenObject.***
	var frustumVolumenObject = this.frustumVolumeControl.getFrustumVolumeCulling(frustumIdx); 
	this.myCameraSCX.setCurrentFrustum(frustumIdx);
	camera.setCurrentFrustum(frustumIdx);
	var visibleNodes = frustumVolumenObject.visibleNodes; // class: VisibleObjectsController.

	if (!this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
	{
		if (this.frustumVolumeControl === undefined)
		{ return; }
	
		var frustumVolume = this.myCameraSCX.bigFrustum;
		this.tilesMultiFrustumCullingFinished(frustumVolumenObject.intersectedTilesArray, visibleNodes, cameraPosition, frustumVolume);
		this.prepareNeoBuildingsAsimetricVersion(gl, visibleNodes); 
	}

	var currentShader = undefined;
	this.visibleObjControlerNodes = visibleNodes; // set the current visible nodes.***

	// prepare data if camera is no moving.***
	//var camMoveType = camera.lastMovement.movementType;// = CODE.movementType.NO_MOVEMENT
	if (!this.isCameraMoving && !this.mouseMiddleDown)// && camMoveType === CODE.movementType.NO_MOVEMENT)
	{
		this.loadAndPrepareData();
	}

	
	// Render process.***
	this.doRender(frustumVolumenObject);

	if (frustumIdx === 0)
	{
		this.selectionColor.init();
		this.emit('lastFrustum');
	}

	//valid date height by height reference
	this.validateHeight(frustumVolumenObject);

	this.drawSelectedExtruionBuildingLabel();

	// test. Draw the buildingNames.***
	if (this.magoPolicy.getShowLabelInfo())
	{
		if (this.currentFrustumIdx === 0)
		{ this.clearCanvas2D(); }
		this.drawBuildingNames(this.visibleObjControlerNodes) ;
		this.canvasDirty = true;
	}
	// Do stadistics.
	var displayStadistics = false;
	if (this.currentFrustumIdx === 0 && displayStadistics)
	{
		if (this.stadisticsDisplayed === undefined)
		{ this.stadisticsDisplayed = 0; }

		if (this.stadisticsDisplayed === 0)
		{
			var timePerFrame = this.getCurrentTime() - this.prevTime;
			this.sceneState.fps = Math.floor(1000.0/timePerFrame);
			this.clearCanvas2D();
			this.drawStadistics();
		}

		this.stadisticsDisplayed+= 1;
		
		if (this.stadisticsDisplayed > 5)
		{ this.stadisticsDisplayed = 0; }
	
		this.canvasDirty = true;
	}


	
};

/**
 * valid date height by height reference
 * @param {frustumObject} frustumObject 
 */
MagoManager.prototype.validateHeight = function(frustumObject)
{
	//console.info(frustumObject);
	var visibleNodes = frustumObject.visibleNodes.getAllVisibles();
	
	if (this._needValidHeightNodeArray.length > 0 && visibleNodes.length > 0) 
	{
		var terrainProvider = this.scene.globe.terrainProvider;
		var isBasicTerrainProvider = terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
		var maxZoom = 20;
		if (!isBasicTerrainProvider) 
		{
			if (!terrainProvider._layers || !terrainProvider._layers[0])
			{
				return;
			}
			maxZoom = terrainProvider._layers[0].availability._maximumLevel - 1;
		}

		var process = [];
		var next = [];
		for (var i=this._needValidHeightNodeArray.length - 1;i>=0;i--) 
		{
			var needValidHeightNode = this._needValidHeightNodeArray[i];
			
			if (visibleNodes.indexOf(needValidHeightNode) > -1 && process.length < 10)
			{
				this._needValidHeightNodeArray[i].data.validHeightReference = true;
				process.push(needValidHeightNode);
			}
			else 
			{
				next.push(needValidHeightNode);
			}
		}
		if (process.length > 0){
			var that = this;
			new Promise(function(resolve) 
			{
				resolve({mm: that, nArray: process});
			}).then(function(obj)
			{
				var cartographics = [];
				var nArray = obj.nArray;
				var nArrayLength = nArray.length;
				for (var j=0;j<nArrayLength;j++ )
				{
					var node = nArray[j];
					var geographic;
					if (node.data.mapping_type === 'origin') 
					{
						geographic = ManagerUtils.pointToGeographicCoord(node.bboxAbsoluteCenterPos);
					}
					else 
					{
						geographic = node.getCurrentGeoLocationData().geographicCoord;
					}
					cartographics.push(Cesium.Cartographic.fromDegrees(geographic.longitude, geographic.latitude));
				}
				
				Cesium.sampleTerrain(terrainProvider, maxZoom, cartographics).then(function(samplePositions)
				{
					if (samplePositions.length === nArrayLength) 
					{
						for (var k=0, slen=samplePositions.length;k<slen;k++) 
						{
							var n = nArray[k];
							var currentGeoLocationData = n.getCurrentGeoLocationData();
							var cp = currentGeoLocationData.geographicCoord;
							n.changeLocationAndRotation(cp.latitude, cp.longitude, n.caculateHeightByReference(samplePositions[k].height), currentGeoLocationData.heading, currentGeoLocationData.pitch, currentGeoLocationData.roll, obj.mm);
						}
						obj.mm.emit(MagoManager.EVENT_TYPE.VALIDHEIGHTEND, {
							type   : MagoManager.EVENT_TYPE.VALIDHEIGHTEND,
							validDataArray : nArray,
							timestamp: new Date()
						});
					}
				});
			});
		}

		this._needValidHeightNodeArray = next;
	}

	var visibleNatives = frustumObject.visibleNodes.getAllNatives();
	if (this._needValidHeightNativeArray.length > 0 && visibleNatives.length > 0) 
	{
		var terrainProvider = this.scene.globe.terrainProvider;
		var isBasicTerrainProvider = terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
		var maxZoom = 20;
		if (!isBasicTerrainProvider) 
		{
			if (!terrainProvider._layers || !terrainProvider._layers[0])
			{
				return;
			}
			maxZoom = terrainProvider._layers[0].availability._maximumLevel - 1;
		}

		var process = [];
		var next = [];
		for (var i=this._needValidHeightNativeArray.length - 1;i>=0;i--) 
		{
			var needValidNative = this._needValidHeightNativeArray[i];
			
			if (visibleNatives.indexOf(needValidNative) > -1 && process.length < 10)
			{
				process.push(needValidNative);
			}
			else 
			{
				next.push(needValidNative);
			}
		}
		
		if (process.length > 0) { 
			var that = this;
			new Promise(function(resolve) 
			{
				resolve({mm: that, nArray: process});
			}).then(function(obj)
			{
				var cartographics = [];
				var nArray = obj.nArray;
				var nArrayLength = nArray.length;
				for (var j=0;j<nArrayLength;j++ )
				{
					var native = nArray[j];
					var geographic = native.getCurrentGeoLocationData().geographicCoord;
		
					cartographics.push(Cesium.Cartographic.fromDegrees(geographic.longitude, geographic.latitude));
				}
				
				Cesium.sampleTerrain(terrainProvider, maxZoom, cartographics).then(function(samplePositions)
				{
					if (samplePositions.length === nArrayLength) 
					{
						for (var k=0, slen=samplePositions.length;k<slen;k++) 
						{
							var n = nArray[k];
							var vHeight = samplePositions[k].height;
							n.setTerrainHeight(vHeight);
						}
						obj.mm.emit(MagoManager.EVENT_TYPE.VALIDHEIGHTEND, {
							type   : MagoManager.EVENT_TYPE.VALIDHEIGHTEND,
							validDataArray : nArray,
							timestamp: new Date()
						});
					}
				});
			});
		}
		
		this._needValidHeightNativeArray = next;
	}
};

/**
 * Prepare current visibles low LOD nodes.***
 */
MagoManager.prototype.clearCanvas2D = function() 
{
	if (this.canvasDirty === undefined)
	{ this.canvasDirty = true; }
	
	if (this.canvasDirty)
	{
		var canvas = this.getObjectLabel();
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
		this.canvasDirty = false;
	}
};


/**
 * Prepare current visibles low LOD nodes
 * @private
 */
MagoManager.prototype.prepareVisibleLowLodNodes = function (lowLodNodesArray) 
{
	var maxParsesCount = 300; 

	var camMoveType = this.sceneState.camera.lastMovement.movementType;// = CODE.movementType.NO_MOVEMENT
	var camIsMoving = false;
	if (camMoveType !== CODE.movementType.NO_MOVEMENT)
	{
		camIsMoving = true;
		maxParsesCount = 200; 
	}

	if (this.readerWriter.skinLegos_requested > maxParsesCount)
	{ return; }
	
	// Prepare lod3, lod4 and lod5 meshes.***
	// check "this.visibleObjControlerNodes.currentVisibles3".***
	var node;
	var neoBuilding;
	
	var lowLodNodesCount = lowLodNodesArray.length;
	for (var i=0; i<lowLodNodesCount; i++) 
	{
		node = lowLodNodesArray[i];
		
		var attributes = node.data.attributes;
		if (attributes.objectType === "basicF4d")
		{
			neoBuilding = node.data.neoBuilding;

			if (!neoBuilding.currentLod)
			{ neoBuilding.currentLod = neoBuilding.nodeOwner.data.currentLod; }

			var lodBuildingData = neoBuilding.getLodBuildingData(neoBuilding.currentLod);
			if (lodBuildingData === undefined)
			{ return false; }

			if (lodBuildingData.isModelRef)
			{ 
				if(neoBuilding.octree) {
					neoBuilding.octree.prepareSkinData(this);
				}
			} else {
				if (neoBuilding.metaData && neoBuilding.metaData.fileLoadState === CODE.fileLoadState.PARSE_FINISHED)
				{ neoBuilding.prepareSkin(this); }
			}
		}
		else if (attributes.objectType === "multiBuildingsTile")
		{
			// Load data if necessary.
			var multiBuildings = node.data.multiBuildings;
			
			if (multiBuildings)
			{ multiBuildings.prepareData(this); }
		}
		
		if (this.readerWriter.skinLegos_requested > maxParsesCount)
		{ return; }

		if(camIsMoving && i > maxParsesCount)
		{ return; }
	}
};

/**
 * Draw building names on scene.
 * @private
 */
MagoManager.prototype.drawStadistics = function() 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");
	
	if (this.isFarestFrustum())
	{ this.clearCanvas2D(); }

	var screenCoord = new Point2D(130, 60);
	var sceneState = this.sceneState;
	
	ctx.font = "13px Arial";

	ctx.strokeText("Triangles : " + sceneState.trianglesRenderedCount, screenCoord.x, screenCoord.y);
	ctx.fillText("Triangles : " + sceneState.trianglesRenderedCount, screenCoord.x, screenCoord.y);
	
	ctx.strokeText("Points : " + sceneState.pointsRenderedCount, screenCoord.x, screenCoord.y + 30);
	ctx.fillText("Points : " + sceneState.pointsRenderedCount, screenCoord.x, screenCoord.y + 30);
	
	ctx.strokeText("FPS : " + sceneState.fps, screenCoord.x, screenCoord.y+60);
	ctx.fillText("FPS : " + sceneState.fps, screenCoord.x, screenCoord.y+60);

	ctx.restore(); 
};

/**
 * Draw building names on scene.
 * @private
 */
MagoManager.prototype.drawBuildingNames = function(visibleObjControlerNodes) 
{
	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");

	// lod2.
	var gl = this.getGl();
	var node;
	var nodeRoot;
	var geoLocDataManager;
	var geoLoc;
	var worldPosition;
	var screenCoord;
	
	// 1rst, collect rootNodes.
	var rootNodesMap = {};
	var currentVisiblesArray = visibleObjControlerNodes.currentVisibles1.concat(visibleObjControlerNodes.currentVisibles2, visibleObjControlerNodes.currentVisibles3);
	var nodesCount = currentVisiblesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = currentVisiblesArray[i];
		nodeRoot = node.getRoot();
		if (node.data === undefined || node.data.neoBuilding === undefined)
		{ continue; }
	
		if (node.data.distToCam > 3000.0)
		{ continue; }
		
		var key = node.data.neoBuilding.buildingId;
		rootNodesMap[key] = nodeRoot;
	}
	

	for (var key in rootNodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(rootNodesMap, key))
		{
			nodeRoot = rootNodesMap[key];
			var label = nodeRoot.data.attributes.label;

			if(nodeRoot.data.attributes.isVisible === false) continue;
			geoLocDataManager = nodeRoot.data.geoLocDataManager;
			geoLoc = geoLocDataManager.getCurrentGeoLocationData();

			worldPosition = nodeRoot.getBBoxCenterPositionWorldCoord(geoLoc);
			screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, this);

			if(isNaN(screenCoord.x) || isNaN(screenCoord.y)) continue;

			if(!label) {
				var dataName = nodeRoot.data.data_name;
				if(!dataName || dataName.length === 0) continue;
				var elemFromPoints = document.elementsFromPoint(screenCoord.x, screenCoord.y);
				if (elemFromPoints.length > 0 && elemFromPoints[0].nodeName === 'CANVAS' && screenCoord.x >= 0 && screenCoord.y >= 0)
				{
					ctx.font = "13px Arial";
					ctx.strokeStyle = 'MidnightBlue';
					ctx.fillStyle= "PapayaWhip";

					ctx.fillText(dataName, screenCoord.x, screenCoord.y);
					ctx.strokeText(dataName, screenCoord.x, screenCoord.y);
				}
			} else {
				if(label instanceof Array)
				{
					for(var j=0,labelLen=label.length;j<labelLen;j++)
					{
						var lb = label[j];
						ctx.fillStyle = lb.backgroundFillColor ;
						ctx.strokeStyle = lb.backgroundStrokeColor ;
						var backgroundOffset = lb.backgroundOffset;
						var backgroundSize = lb.backgroundSize;
						roundRect(ctx, screenCoord.x+backgroundOffset[0], screenCoord.y + backgroundOffset[1], backgroundSize[0], backgroundSize[1], 10, true,true);
						ctx.font = "13px Arial";
						ctx.fillStyle = "white";
						ctx.strokeStyle = "white";
						ctx.textAlign = "center";
						var textOffset = lb.textOffset;
						ctx.fillText(lb.text, screenCoord.x+textOffset[0], screenCoord.y+textOffset[1]);
					}
				} else {
					ctx.fillStyle = label.backgroundFillColor ;
					ctx.strokeStyle = label.backgroundStrokeColor ;
					var backgroundOffset = label.backgroundOffset;
					var backgroundSize = label.backgroundSize;
					roundRect(ctx, screenCoord.x+backgroundOffset[0], screenCoord.y + backgroundOffset[1], backgroundSize[0], backgroundSize[1], 10, true,true);
					ctx.font = label.font ? label.font :"13px Arial";
					ctx.fillStyle = "white";
					ctx.strokeStyle = "white";
					ctx.textAlign = "center";
					var textOffset = label.textOffset;
					var text = label.text;
					if(text.indexOf('\n') > -1) {
						var splitTexts = text.split('\n');
						var yoffset = textOffset[1];
						var ypos = screenCoord.y + yoffset;
						for(var k=0,textLen=splitTexts.length;k<textLen;k++) {
							var splitText = splitTexts[k];
							ypos = ypos + k*-2*yoffset;
							if(k>0) ypos += 3;
							ctx.fillText(splitText, screenCoord.x+textOffset[0], ypos);
						}
					} else {
						ctx.fillText(text, screenCoord.x+textOffset[0], screenCoord.y+textOffset[1]);
					}
				}
			}
		}
	}
	
	rootNodesMap = {};

	ctx.restore(); 

	function roundRect(context, x, y, width, height, radius, fill, stroke) {
		if (typeof stroke === 'undefined') {
		  stroke = true;
		}
		if (typeof radius === 'undefined') {
		  radius = 5;
		}
		if (typeof radius === 'number') {
		  radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
		  var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
		  for (var side in defaultRadius) {
			if(defaultRadius.hasOwnProperty(side)) {
				radius[side] = radius[side] || defaultRadius[side];
			}
		  }
		}
		context.beginPath();
		context.moveTo(x + radius.tl, y);
		context.lineTo(x + width - radius.tr, y);
		context.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		context.lineTo(x + width, y + height - radius.br);
		context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		context.lineTo(x + radius.bl, y + height);
		context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		context.lineTo(x, y + radius.tl);
		context.quadraticCurveTo(x, y, x + radius.tl, y);
		context.closePath();
		if (fill) {
			context.fill();
		}
		if (stroke) {
			context.stroke();
		}
	  
	}
};

/**
 * Draw building names on scene.
 * @private
 */
MagoManager.prototype.drawSelectedExtruionBuildingLabel = function() 
{
	var selected = this.selectionManager.getSelectedGeneralArray();
	var selectedLength = selected.length;
	if(selectedLength === 0) return;

	var canvas = this.getObjectLabel();
	var ctx = canvas.getContext("2d");

	// lod2.
	var gl = this.getGl();
	var worldPosition;
	var screenCoord;

	for(var i=0;i<selectedLength;i++)
	{
		var nativeModel = selected[i];

		if(!(nativeModel instanceof ExtrusionBuilding) || this.modeler.objectsArray.indexOf(nativeModel) < 0) continue;

		var center = nativeModel.getCenter();
		var centerInBuilding = false;
		var labelGeoCoord;

		var listLength = nativeModel.geographicCoordListsArray.length;
		for(var j=0;j<listLength;j++) {
			var geographicCoordList = nativeModel.geographicCoordListsArray[j];
			var extent = geographicCoordList.getGeographicExtent();
			if(extent.intersects2dWithGeoCoord(center)) {
				centerInBuilding = true;
				break;
			}
		}

		if(centerInBuilding) {
			labelGeoCoord = center;
		} else {
			var geographicCoordList = nativeModel.geographicCoordListsArray[Math.floor(listLength/2)];
			var extent = geographicCoordList.getGeographicExtent();
			labelGeoCoord = new GeographicCoord(extent.getCenterLongitude(), extent.getCenterLatitude(), extent.getCenterAltitude()); 
		}

		labelGeoCoord.altitude = nativeModel.getRealHeight() + 2;
		var worldPosition = ManagerUtils.geographicCoordToWorldPoint(labelGeoCoord.longitude,labelGeoCoord.latitude,labelGeoCoord.altitude);
		screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, this);

		if(isNaN(screenCoord.x) || isNaN(screenCoord.y)) continue;
		
		var elemFromPoints = document.elementsFromPoint(screenCoord.x, screenCoord.y);
		if (elemFromPoints.length === 0) { continue; }

		if (elemFromPoints[0].nodeName === 'CANVAS' && screenCoord.x >= 0 && screenCoord.y >= 0)
		{
			ctx.font = "normal normal bolder 18px Helvetica";
			var text = nativeModel.getLevel();
			ctx.strokeText(text, screenCoord.x, screenCoord.y);
			ctx.fillText(text, screenCoord.x, screenCoord.y);
		}
	}
	ctx.restore(); 
};

/**
 * The camera was moved.
 * @private
 */
MagoManager.prototype.cameraMoved = function() 
{
	this.sceneState.camera.setDirty(true);
	var selectionFbo = this.getSelectionFBO();

	if (selectionFbo)
	{
		selectionFbo.dirty = true;
	}
};

/**
 * @private
 */
MagoManager.prototype.TEST__RenderGeoCoords = function() 
{
	if (this.test_geoCoords === undefined)
	{
		this.test_geoCoords = true;
		//--------------------------------
		var options = {};

		var geoCoordsList = this.modeler.getGeographicCoordsList();
		var geoCoordsArray = geoCoordsList.geographicCoordsArray;
		
		var renderable = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsArray, this, undefined);
		this.modeler.addObject(renderable, 12);

		geoCoordsList.geographicCoordsArray.length = 0;
	}
};

/**
 * @private
 */
MagoManager.prototype.TEST__shader = function() 
{
	// try to debug shader code here.***
	var sceenWidth = this.sceneState.drawingBufferWidth[0];
	var sceenHeight = this.sceneState.drawingBufferHeight[0];

	var screenCoordX = 268/sceenWidth;
	var screenCoordY = 631/sceenHeight;

	screenCoordX = 0.0;
	screenCoordY = 0.0;

	screenCoordX = 0.5;
	screenCoordY = 0.5;

	var linearDepth = 0.0024; // 0.0 = near, 1.0 = far.***

	var pixelX = sceenWidth/2;
	var pixelY = Math.floor(sceenHeight/2);
	var currFrustumIdx = this.currentFrustumIdx;

	// try to read depth texture of the terrain of cesium.******************************************************************************
	//magoManager.czm_globeDepthText
	var gl = this.getGl();
	

	if(this.czm_globeDepthText)
	{
		if(!this.auxFbo)
		{
			this.auxFbo = new FBO(gl, sceenWidth, sceenHeight, {matchCanvasSize: true}); 
			this.auxFbo.setColorBuffer(this.czm_globeDepthText);
		}
	}
	else
		return;


	if(this.auxFbo.colorBuffer)
	{
		this.auxFbo.bind();
		gl.viewport(0, 0, sceenWidth, sceenHeight);

		var depthPixels = new Uint8Array(4 * 1 * 1); // 4 x 1x1 pixel.
		gl.readPixels(pixelX, sceenHeight - pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, depthPixels);

		//return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
		
		var floatDepthPixels = new Float32Array(([depthPixels[0]/256.0, depthPixels[1]/256.0, depthPixels[2]/256.0, depthPixels[3]/256.0]));
		var zDepth = floatDepthPixels[0] + floatDepthPixels[1]/255 + floatDepthPixels[2]/65025.0 + floatDepthPixels[3]/16581375.0;
		linearDepth = zDepth;// [0.0, 1.0] range depth.

		// now, return to main framebuffer.***
		this.auxFbo.unbind();
	}
	

	//---------------------------------------------------------------------------------------------------------------------------------

	

	var depthRange_near = 0.0;
	var depthRange_far = 1.0;
	var x_ndc = 2.0 * screenCoordX - 1.0;
	var y_ndc = 2.0 * screenCoordY - 1.0;
	var z_ndc = (2.0 * linearDepth - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);
	
	// Calculate near & far from projectionMatrix.*********************
	var projectionMat = this.sceneState.projectionMatrix;
	var n = Matrix4.getNearFromPerspectiveMatrix(projectionMat);
	var f = Matrix4.getFarFromPerspectiveMatrix(projectionMat);
	// End calculing near & far from projectionMatrix.--------------------

	var projectionMatrixInv = this.sceneState.getProjectionMatrixInv();
	var viewPosHcartesian = projectionMatrixInv.transformPoint4D([x_ndc, y_ndc, z_ndc, 1.0], undefined)
	///var viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);
	var viewPosH = new Point3D(viewPosHcartesian[0], viewPosHcartesian[1], viewPosHcartesian[2]);
	var posCC = new Point3D(viewPosHcartesian[0]/viewPosHcartesian[3], viewPosHcartesian[1]/viewPosHcartesian[3], viewPosHcartesian[2]/viewPosHcartesian[3]);
	///var posCC = viewPosH.xyz/viewPosH.w;
	//var posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);
	
	
	// Another way.***
	var camera = this.sceneState.camera;
	var currFrustum = camera.frustumsArray[currFrustumIdx];
	var tangentOfHalfFovy = camera.frustum.tangentOfHalfFovy[0];
	var far = currFrustum.far[0];
	var aspectRatio = camera.frustum.aspectRatio[0];
	var hfar = 2.0 * tangentOfHalfFovy * far;
    var wfar = hfar * aspectRatio;    
	var ray = new Point3D(wfar * (screenCoordX - 0.5), hfar * (screenCoordY - 0.5), -far);  
	var origin = new Point3D(ray.x, ray.y, ray.z);
	origin.scale(linearDepth);
	var zAux = linearDepth*(f-n);

	var ratioX = posCC.x/origin.x;
	var ratioY = posCC.y/origin.y;
	var ratioZ = posCC.z/origin.z;
	var ratioZInv = 1.0/ratioZ;

	



	if (this.isCesiumGlobe())
	{
		// https://cesium.com/docs/cesiumjs-ref-doc/Globe.html
		

		var cesiumScene = this.scene; 
		var cesiumGlobe = cesiumScene.globe;
		var cesiumCamera = cesiumScene.camera;
		var fovy = cesiumCamera.frustum._fovy;
		var tangentOfHalfFovy_cesium = Math.tan(fovy/2.0);
		var windowCoordinates = new Cesium.Cartesian2(pixelX, pixelY);
		var ray2 = cesiumCamera.getPickRay(windowCoordinates);
		var intersection = cesiumGlobe.pick(ray2, cesiumScene);
		return intersection;
	}


};

/**
 * @private
 */
MagoManager.prototype.TEST__splittedExtrudedBuilding = function() 
{
	var polygon = {
		"type": "FeatureCollection",
		"name": "polygon",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { "id": 26 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 127.007156778934217, 37.451560023041928 ], [ 127.007460564737684, 37.451040386226865 ], [ 127.00744861308273, 37.451014222695612 ], [ 127.00741694547871, 37.451002455751151 ], [ 127.006967071123384, 37.450835291596306 ], [ 127.006934253008012, 37.450844820064908 ], [ 127.006828575012591, 37.451025584925794 ], [ 127.006920766653792, 37.451059841707512 ], [ 127.006959916298669, 37.45099287523324 ], [ 127.006998483134424, 37.451007205953346 ], [ 127.007032475979713, 37.45094906015845 ], [ 127.00728902455549, 37.45104438837059 ], [ 127.007263482357018, 37.451088079341183 ], [ 127.007310295354259, 37.451105474010767 ], [ 127.007097217797622, 37.451469950027445 ], [ 127.006802613819659, 37.451360481183009 ], [ 127.006878979501849, 37.451229856553653 ], [ 127.006786787668318, 37.451195599739314 ], [ 127.006672178936796, 37.451391639069755 ], [ 127.00667759315165, 37.451403491647312 ], [ 127.007092593098307, 37.451557697325363 ], [ 127.007124260885604, 37.451569464355593 ], [ 127.007156778934217, 37.451560023041928 ] ] ] ] } }
		]
	};

	var polygon2 = {
		"type": "FeatureCollection",
		"name": "polygon",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { "id": 26 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [[127.00715678,37.45156002],[127.00746056,37.45104039],[127.00744861,37.45101422],[127.00741695,37.45100246],[127.00696707,37.45083529],[127.00693425,37.45084482],[127.00682858,37.45102558],[127.00692077,37.45105984],[127.00695992,37.45099288],[127.00699848,37.45100721],[127.00703248,37.45094906],[127.00728902,37.45104439],[127.00726348,37.45108808],[127.0073103,37.45110547],[127.00709722,37.45146995],[127.00680261,37.45136048],[127.00687898,37.45122986],[127.00678679,37.4511956],[127.00667218,37.45139164],[127.00667759,37.45140349],[127.00709259,37.4515577],[127.00712426,37.45156946],[127.00715678,37.45156002]]] ] } }
		]
	};

	var polygon3 = {
		"type": "FeatureCollection",
		"name": "polygon",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { "id": 26 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [[127.00624431,37.45311893],
		[127.00654177,37.45261149],
		[127.00652793,37.45258185],
		[127.00604714,37.45240348],
		[127.00601203,37.45241478],
		[127.00590635,37.45259555],
		[127.00599854,37.4526298],
		[127.00603769,37.45256284],
		[127.00607626,37.45257717],
		[127.00611025,37.45251902],
		[127.0063668,37.45261435],
		[127.00634126,37.45265804],[127.00638807,37.45267544],[127.00622799,37.45294118],[127.00599713,37.45283828],[127.00592387,37.45296367],[127.00595887,37.45297503],[127.00597467,37.4529813],[127.0059889,37.45298769],[127.00606894,37.45302214],[127.00608174,37.45302778],[127.00609454,37.45303275],[127.00611732,37.45304678],[127.00611974,37.45304806],[127.00612294,37.45305001],[127.00612875,37.45305315],[127.0061422,37.45306056],[127.00616388,37.4530727],[127.00622159,37.45310691],[127.00624431,37.45311893]]] ] } }
		]
	};

	var polygon4 = {
		"type": "FeatureCollection",
		"name": "polygon",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { "id": 26 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [[127.00712426088562, 37.45156946435559, 30.834664859310234],
		[127.00709259309828, 37.45155769732531, 30.834664859310234],
		[127.00667759315165, 37.451403491647234, 30.834664859310234],
		[127.0066721789368, 37.45139163906972, 30.834664859310234],
		[127.00678678766829, 37.451195599739265, 30.834664859310234],
		[127.00687897950189, 37.451229856553624, 30.834664859310234],
		[127.00680261381964, 37.45136048118296, 30.834664859310234],
		[127.00709721779768, 37.45146995002743, 30.834664859310234],
		[127.00731029535426, 37.451105474010745, 30.834664859310234],
		[127.007263482357, 37.451088079341126, 30.834664859310234],
		[127.00728902455552, 37.451044388370505, 30.834664859310234],
		[127.00703247597968, 37.45094906015843, 30.834664859310234],
		[127.0069984831344, 37.45100720595332, 30.834664859310234],
		[127.00695991629873, 37.45099287523322, 30.834664859310234],
		[127.00692076665378, 37.4510598417075, 30.834664859310234],
		[127.00682857501259, 37.45102558492573, 30.834664859310234],
		[127.00693425300804, 37.45084482006482, 30.834664859310234],
		[127.00696707112338, 37.450835291596256, 30.834664859310234],
		[127.00741694547875, 37.45100245575113, 30.834664859310234],
		[127.00744861308276, 37.4510142226956, 30.834664859310234],
		[127.00746056473766, 37.45104038622685, 30.834664859310234],
		[127.00715677893419, 37.45156002304188, 30.834664859310234]]] ] } }
		]
	};

	var polygon5 = {
		"type": "FeatureCollection",
		"name": "polygon",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { "id": 26 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [[127.00712426088562, 37.45156946435559],
		[127.00709259309828, 37.45155769732531],
		[127.00667759315165, 37.451403491647234],
		[127.0066721789368, 37.45139163906972],
		[127.00678678766829, 37.451195599739265],
		[127.00687897950189, 37.451229856553624],
		[127.00680261381964, 37.45136048118296],
		[127.00709721779768, 37.45146995002743],
		[127.00731029535426, 37.451105474010745],
		[127.007263482357, 37.451088079341126],
		[127.00728902455552, 37.451044388370505],
		[127.00703247597968, 37.45094906015843],
		[127.0069984831344, 37.45100720595332],
		[127.00695991629873, 37.45099287523322],
		[127.00692076665378, 37.4510598417075],
		[127.00682857501259, 37.45102558492573],
		[127.00693425300804, 37.45084482006482],
		[127.00696707112338, 37.450835291596256],
		[127.00741694547875, 37.45100245575113],
		[127.00744861308276, 37.4510142226956],
		[127.00746056473766, 37.45104038622685],
		[127.00715677893419, 37.45156002304188]]] ] } }
		]
	};

	

	var segments = {
		"type": "FeatureCollection",
		"name": "line",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.00680258194113, 37.451361285269734 ], [ 127.006761027785558, 37.451435659267922 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007096637143917, 37.451470331843581 ], [ 127.007056141692942, 37.451548940660174 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007310230797074, 37.451105608108712 ], [ 127.007406308239581, 37.451143721474331 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007289321381194, 37.451044203241878 ], [ 127.007332331255597, 37.450969829243697 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007032453177501, 37.450949184503962 ], [ 127.007075463051905, 37.450873751801183 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007032056163283, 37.450949713856282 ], [ 127.006902364849708, 37.450898896035454 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.006960064250435, 37.450993120744904 ], [ 127.006868486302494, 37.450955536731584 ] ] } }
		]
	};

	var segments2 = {
		"type": "FeatureCollection",
		"name": "26",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": [
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.006806753742254, 37.451359602856371 ], [ 127.006709447420434, 37.451321237588523 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.006854763909828, 37.451375356192607 ], [ 127.006809325715508, 37.451458302330344 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.00699836575032, 37.451427438651173 ], [ 127.006955021671715, 37.451510921356906 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007095029078798, 37.451464196435744 ], [ 127.00705280585106, 37.451549285884532 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007117560636246, 37.451433386339353 ], [ 127.007208653897578, 37.451474539685165 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007177466180138, 37.451327721104477 ], [ 127.007274718919035, 37.451371712563827 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007236719758637, 37.45122818379366 ], [ 127.00732923315249, 37.451269762847076 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007291812004411, 37.4511356703998 ], [ 127.007384325398277, 37.451176209976886 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007309360183939, 37.451106075950335 ], [ 127.00737738351846, 37.450977905949415 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007228403947948, 37.45102236747924 ], [ 127.00727102247771, 37.450940248848731 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007095029078798, 37.450974449860347 ], [ 127.007136930030427, 37.450891393460971 ] ] } },
		{ "type": "Feature", "properties": { }, "geometry": { "type": "LineString", "coordinates": [ [ 127.007034909203824, 37.450952346965117 ], [ 127.006900724536308, 37.450896406546654 ] ] } }
		]
		}

	this.sceneState.sunSystem.setDate(new Date('2020-09-21 03:00'));
	// make geographicsCoordsArray.***
	var geoCoordsArray = [];
	var coordsArray = polygon4.features[0].geometry.coordinates[0][0];
	var coordsCount = coordsArray.length;
	for(var i=0; i<coordsCount; i++)
	{
		var coord = coordsArray[i];
		var geoCoord = new GeographicCoord(coord[0], coord[1], 0.0);
		geoCoordsArray.push(geoCoord);
	}

	// make segments array.***
	var segments2dArray = [];
	
	var segmentsArray = segments.features;
	var segmentsCount = segmentsArray.length;
	for(var i=0; i<segmentsCount; i++)
	{
		var segment = segmentsArray[i].geometry.coordinates;
		var strPoint2D = new Point2D(segment[0][0], segment[0][1]);
		var endPoint2D = new Point2D(segment[1][0], segment[1][1]);
		var segment2d = new Segment2D(strPoint2D, endPoint2D);
		segments2dArray.push(segment2d);
	}
	

	// make the polygon by geoCoordsArray.***
	var polygon2d = Polygon2D.makePolygonByGeographicCoordArray(geoCoordsArray) ;
	var resultConcavePointsIdxArray = polygon2d.calculateNormal(undefined);
	if(polygon2d.normal < 0)
	{
		polygon2d.reverseSense();
	}

	// now, split the polygon2d by the segments.***
	var error = 1E-5;
	var resultSplittedPolygons = Polygon2D.splitPolygonByMultipleSegments(polygon2d, segments2dArray, resultSplittedPolygons, error);

	// Finally in "resultSplittedPolygons" there are all splitted polygons.***
	var splittedPolygonsCount = resultSplittedPolygons.length;
	var height = 100.0;
	var options = {};
	var geoCoordsListsArray = [];
	for(var i=0; i<splittedPolygonsCount; i++)
	{
		var polygon2d = resultSplittedPolygons[i];
		var geographicCoordsArray = [];
		var coordsCount = polygon2d.point2dList.getPointsCount();
		for(var j=0; j<coordsCount; j++)
		{
			var point2d = polygon2d.point2dList.getPoint(j);
			var geoCoord = new GeographicCoord(point2d.x, point2d.y, 0.0);
			geographicCoordsArray.push(geoCoord);
		}
		var geoCoordList = new GeographicCoordsList(geographicCoordsArray);
		geoCoordsListsArray.push(geoCoordList);
		
	}

	

	// make a limitation polygon2d.****************************************
	//limitationPolygon2d
	
	var limiGeoCoord1 = new GeographicCoord(127.00677393677276, 37.4515568669093, 0.0);
	var limiGeoCoord2 = new GeographicCoord(127.00670285098234, 37.451149160635964, 0.0);
	var limiGeoCoord3 = new GeographicCoord(127.00701725187915, 37.45116161039015, 0.0);
	var limiGeoCoord4 = new GeographicCoord(127.00699905445235, 37.4510234587059, 0.0);
	var limiGeoCoord5 = new GeographicCoord(127.00676113458148, 37.45101249247572, 0.0);
	var limiGeoCoord6 = new GeographicCoord(127.0068275878695, 37.4507608835301, 0.0);
	var limiGeoCoord7 = new GeographicCoord(127.00753105267508, 37.45075685056917, 0.0);
	var limiGeoCoord8 = new GeographicCoord(127.00746746612433, 37.45159376615369, 0.0);
	//options.limitationGeographicCoords = [limiGeoCoord1, limiGeoCoord2, limiGeoCoord3, limiGeoCoord4, limiGeoCoord5, limiGeoCoord6, limiGeoCoord7, limiGeoCoord8];
	
	
	var limiGeoCoord9 = new GeographicCoord(127.00707561793477, 37.45181817281961, 0.0);
	var limiGeoCoord10 = new GeographicCoord(127.00711848788578, 37.45045648607603, 0.0);
	var limiGeoCoord11 = new GeographicCoord(127.00838475802502, 37.45048859811164, 0.0);
	var limiGeoCoord12 = new GeographicCoord(127.00826935498984, 37.45181503770476, 0.0);
	//options.limitationGeographicCoords = [limiGeoCoord9, limiGeoCoord10,  limiGeoCoord11, limiGeoCoord12];
	//options.limitationGeographicCoords = [limiGeoCoord11, limiGeoCoord12, limiGeoCoord9, limiGeoCoord10];

	var limiGeoCoord13 = new GeographicCoord(127.00705650749205, 37.451801378084006, 0.0);
	var limiGeoCoord14 = new GeographicCoord(127.00704836209083, 37.45114871921257, 0.0);
	var limiGeoCoord15 = new GeographicCoord(127.00791679734688, 37.451123869212154, 0.0);
	var limiGeoCoord16 = new GeographicCoord(127.00790742409, 37.451849349156944, 0.0);
	//options.limitationGeographicCoords = [limiGeoCoord13, limiGeoCoord14, limiGeoCoord15, limiGeoCoord16];

	// End making limitation polygon2d.------------------------------------
	var minHeight = 0.0;
	var maxHeight = 60.0;
	//options.limitationHeights = new Float32Array([minHeight, maxHeight]);

	options.color = new Color(Math.random(),Math.random(),Math.random(),1);
	options.renderWireframe = true;
	options.wireframeColor4 = new Color(1.0, 0.5, 0.0, 1.0);
	options.limitationInfringingDynamicColor4 = new DynamicColor(1.0, 0.5, 1.0, 1.0);
	//var extrudedBuilding = new ExtrusionBuilding(geoCoordsListsArray, height, options);
	//this.modeler.addObject(extrudedBuilding, 5);

	// Wall test.***
	var extrudeDirWC = undefined;
	var height = 200.0;
	var geoCoordList = geoCoordsListsArray[0];
	var options= {};
	options.doubleFace = true;
	var resultRenderableObject = geoCoordList.getExtrudedWallRenderableObject(height, undefined, this, extrudeDirWC, options, undefined);
	this.modeler.addObject(resultRenderableObject, 5);

	// Now, create a clippingPlane.***
	/*
	var options = {};
	options.position = {
		longitude : 127.0068,
		latitude : 37.45136,
		altitude : 120.0
	};
	options.color = new Color(0.3, 0.8, 0.8, 0.5);
	options.isMovable = true;
	//options.limitationGeographicCoords = undefined;

	var clippingPlane = new ClippingPlane(options);
	this.modeler.addObject(clippingPlane, 5);
	*/

};

/**
 * @private
 */
MagoManager.prototype.TEST__SelectionBuffer = function() 
{
	if (this.selectionFbo === undefined)
	{ return; }
	
	var gl = this.getGl();
	
	this.selectionFbo.bind(); // framebuffer for color selection.***
	///////////////////////////////////////////////////////////////////////
	var mouseX = 500;
	var mouseY = 500;
	var mosaicWidth = 9;
	var mosaicHeight = 9;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 4 x 3x3 pixel, total 9 pixels select.***
	var pixelX = mouseX - Math.floor(mosaicWidth/2);
	var pixelY = this.sceneState.drawingBufferHeight[0] - mouseY - Math.floor(mosaicHeight/2); // origin is bottom.***
	
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***
	
	//this.selectionManager.clearCurrents();

	// now, select the object.***
	// The center pixel of the selection is 12, 13, 14.***
	var centerPixel = Math.floor(totalPixelsCount/2);
	var idx = this.selectionColor.decodeColor3(pixels[centerPixel*3], pixels[centerPixel*3+1], pixels[centerPixel*3+2]);
	//////////////////////////////////////////////////////////////////////////////
	this.selectionFbo.unbind();
};

/**
 * Selects an object of the current visible objects that's under mouse.
 * @param {GL} gl.
 * @param {int} mouseX Screen x position of the mouse.
 * @param {int} mouseY Screen y position of the mouse.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 * @returns {Array} resultSelectedArray 
 * 
 * @private
 */
MagoManager.prototype.getSelectedObjects = function (gl, mouseX, mouseY, resultSelectedArray, bSelectObjects) 
{
	var selectionManager = this.selectionManager;
	if (!selectionManager)
	{ return resultSelectedArray; }

	if (bSelectObjects === undefined)
	{ bSelectObjects = false; }

	this.selectionFbo.bind(); // framebuffer for color selection.***
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	gl.disable(gl.CULL_FACE);
	
	// Read the picked pixel and find the object.*********************************************************
	var mosaicWidth = 1;
	var mosaicHeight = 1;
	var totalPixelsCount = mosaicWidth*mosaicHeight;
	var pixels = new Uint8Array(4 * mosaicWidth * mosaicHeight); // 4 x 3x3 pixel, total 9 pixels select.***
	var pixelX = mouseX - Math.floor(mosaicWidth/2);
	var pixelY = this.sceneState.drawingBufferHeight[0] - mouseY - Math.floor(mosaicHeight/2); // origin is bottom.***
	
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }
	
	gl.readPixels(pixelX, pixelY, mosaicWidth, mosaicHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind framebuffer.***
	
	

	// now, select the object.***
	// The center pixel of the selection is 12, 13, 14.***
	var centerPixel = Math.floor(totalPixelsCount/2);
	var idx = this.selectionColor.decodeColor3(pixels[centerPixel*3], pixels[centerPixel*3+1], pixels[centerPixel*3+2]);
	
	// Provisionally.***
	if (bSelectObjects)
	{ selectionManager.selectObjects(idx); }
	else 
	{
		selectionManager.currentReferenceSelected = selectionManager.referencesMap[idx];
		selectionManager.currentOctreeSelected = selectionManager.octreesMap[idx];
		selectionManager.currentBuildingSelected = selectionManager.buildingsMap[idx];
		selectionManager.currentNodeSelected = selectionManager.nodesMap[idx];
	}
	
	var selectedObject = selectionManager.currentReferenceSelected;

	resultSelectedArray[0] = selectionManager.currentBuildingSelected;
	resultSelectedArray[1] = selectionManager.currentOctreeSelected;
	resultSelectedArray[2] = selectionManager.currentReferenceSelected;
	resultSelectedArray[3] = selectionManager.currentNodeSelected;
	
	// Additionally check if selected an edge of topology.***
	var selNetworkEdges = selectionManager.getSelectionCandidatesFamily("networkEdges");
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
	var selGeneralObjects = selectionManager.getSelectionCandidatesFamily("general");
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
	
	// Check general objects.***
	if (selectedObject === undefined)
	{ selectedObject = selectionManager.selCandidatesMap[idx]; }
	selectionManager.setSelectedGeneral(selectionManager.selCandidatesMap[idx]);
	
	return selectedObject;
};

/**
 * Calculates the plane on move an object.
 * @param {GL} gl 변수
 * @param {int} pixelX Screen x position of the pixel.
 * @param {int} pixelY Screen y position of the pixel.
 * @returns {Plane} resultSelObjMovePlane Calculated plane.
 * 
 * @private
 */
MagoManager.prototype.calculateSelObjMovePlaneAsimetricMode = function(gl, pixelX, pixelY, resultSelObjMovePlane) 
{
	if (this.pointSC === undefined)
	{ this.pointSC = new Point3D(); }
	
	if (this.pointSC2 === undefined)
	{ this.pointSC2 = new Point3D(); }
	
	var geoLocDataManager = this.selectionManager.getSelectedF4dNode().getNodeGeoLocDataManager();
	
	ManagerUtils.calculatePixelPositionWorldCoord(gl, pixelX, pixelY, this.pointSC2, undefined, undefined, undefined, this);
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
 * Returns true if is dragging.
 * pointer interaction으로 대체 soon
 * @returns {Boolean} 드래그 여부
 * 
 * @private
 */
MagoManager.prototype.isDragging = function() 
{
	if (!this.selectionFbo)
	{
		return false;
	}
	
	var bIsDragging = false;
	var gl = this.sceneState.gl;
	
	this.arrayAuxSC.length = 0;
	if (!this.selectionFbo)
	{
		return false;
	}

	var selectionManager = this.selectionManager;
	if (!selectionManager)
	{ return false; }

	this.selectionFbo.bind();
	var current_objectSelected = this.getSelectedObjects(gl, this.mouse_x, this.mouse_y, this.arrayAuxSC);
	

	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL)	// Moving all
	{
		var currentBuildingSelected = this.selectionManager.getSelectedF4dBuilding();
		var currentNodeSelected = this.selectionManager.getSelectedF4dNode();
		var currentRootNodeSelected;
		if (currentNodeSelected)
		{
			currentRootNodeSelected = currentNodeSelected.getRoot();
		}
		this.arrayAuxSC.length = 0;

		if (currentRootNodeSelected !== undefined && currentRootNodeSelected === this.rootNodeSelected) 
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
		if (current_objectSelected === undefined)
		{ bIsDragging = false; }
		else if (current_objectSelected === this.selectionManager.getSelectedF4dObject()) 
		{
			bIsDragging = true;
		}
		else 
		{
			bIsDragging = false;
		}
	}
	/*
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS) 
	{
		// Compare currentSelectedObject with the nowSelectedObject.***
		var currSelected = this.selectionManager.getSelectedGeneral();

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
	*/
	else
	{
		if (this.weatherStation)
		{
			// check if there are cuttingPlanes to move.***
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
	
	// General objects.***
	if (!bIsDragging)
	{
		if (current_objectSelected instanceof MagoRenderable) 
		{
			current_objectSelected = current_objectSelected.getRootOwner();
		}
		if (current_objectSelected !== undefined && current_objectSelected === this.selectionManager.getSelectedGeneral())
		{
			bIsDragging = true;
		}
	}
	
	// Finally.***
	if (!bIsDragging)
	{
		this.selectionManager.clearCandidates();
	}
	
	this.selectionFbo.unbind();

	return bIsDragging;
};

/**
 * 카메라 motion 활성 또는 비활성
 * 
 * @param {Boolean} state 카메라 모션 활성화 여부
 * 
 * @private
 */
MagoManager.prototype.setCameraMotion = function(state)
{
	if (this.config.isTwoDimension()) 
	{
		return;
	}
	if (this.isCesiumGlobe())
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
 * 
 * @private
 */
MagoManager.prototype.mouseActionLeftUp = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	if (this.objectMoved)
	{
		this.objectMoved = false;
		var nodeSelected = this.selectionManager.currentNodeSelected;
		if (nodeSelected === undefined)
		{ return; }
		
		this.saveHistoryObjectMovement(this.selectionManager.getSelectedF4dObject(), nodeSelected);
	}

	var eventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(this.getGl(), mouseX, mouseY, undefined, undefined, undefined, this);
	if (eventCoordinate) 
	{
		this.emit(MagoManager.EVENT_TYPE.LEFTUP, {
			type      : MagoManager.EVENT_TYPE.LEFTUP,
			point     : eventCoordinate,
			timestamp : new Date()
		});
	}
	
	/*if (!this.isCameraMoving) 
	{
		this.getSelectedObjects(this.getGl(), this.mouse_x, this.mouse_y, this.arrayAuxSC, true);
			
		var auxBuildingSelected = this.arrayAuxSC[0];
		var auxOctreeSelected = this.arrayAuxSC[1];
		var auxReferenceSelected = this.arrayAuxSC[2];
		var auxNodeSelected = this.arrayAuxSC[3]; 

		var mode = this.magoPolicy.getObjectMoveMode();

		if (mode === CODE.moveMode.ALL) 
		{
			if (!auxBuildingSelected && !auxNodeSelected) 
			{
				this.emit(MagoManager.EVENT_TYPE.DESELECTEDF4D, {
					type: MagoManager.EVENT_TYPE.DESELECTEDF4D
				});
			}
		}
		else if (mode === CODE.moveMode.OBJECT) 
		{
			if (!auxOctreeSelected && !auxReferenceSelected) 
			{
				this.emit(MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT, {
					type: MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT
				});
			}
		}
	}*/

	this.isCameraMoving = false;
	this.mouseLeftDown = false;
	this.mouseDragging = false;
	this.selObjMovePlane = undefined;
	this.selObjMovePlaneCC = undefined;
	this.startGeoCoordDif = undefined;
	this.mustCheckIfDragging = true;
	this.thereAreStartMovePoint = false;

	//this.setBPicking(mouseX, mouseY);

	this.setCameraMotion(true);
	
	// Clear startPositions of mouseAction.***
	var mouseAction = this.sceneState.mouseAction;
	mouseAction.clearStartPositionsAux(); // provisionally only clear the aux.***
	
	if (this.sceneState.sunSystem && this.sceneState.applySunShadows && this.currentFrustumIdx === 0)
	{
		this.sceneState.sunSystem.updateSun(this);
	}
};
MagoManager.prototype.setBPicking = function(mouseX, mouseY) 
{
	this.bPicking = false;
	this.dateSC = new Date();
	this.currentTimeSC = this.dateSC.getTime();
	var miliSecondsUsed = this.currentTimeSC - this.startTimeSC;
	if (miliSecondsUsed < 1500) 
	{
		if (this.mouse_x === mouseX && this.mouse_y === mouseY) 
		{
			this.bPicking = true;
			//this.renderToSelectionBuffer(); // debug: delete this.!!!!!!!!!!
		}
	}
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.keyDown = function(key) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	if (this.modeler === undefined)
	{ this.modeler = new Modeler(this); }
	
	if (key === 32) // 32 = 'space'.***
	{
		var renderingSettings = this._settings.getRenderingSettings();
		var pointsCloudColorRamp = renderingSettings.getPointsCloudInColorRamp();
		renderingSettings.setPointsCloudInColorRamp(!pointsCloudColorRamp);
	}
	else if (key === 37) // 37 = 'left'.***
	{
		//this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_PLANEGRID;
		//this.modeler.mode = CODE.modelerMode.DRAWING_EXCAVATIONPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_TUNNELPOINTS;
		//this.modeler.mode = CODE.modelerMode.DRAWING_PIPE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_SPHERE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_BOX;
		//this.modeler.mode = CODE.modelerMode.DRAWING_CLIPPINGBOX;
		//this.modeler.mode = CODE.modelerMode.DRAWING_CONCENTRICTUBES;
		//this.modeler.mode = CODE.modelerMode.DRAWING_TUBE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
		//this.modeler.mode = 50;
		
		if (this.counterAux === undefined)
		{ this.counterAux = -1; }
		
		if (this.counterAux === -1)
		{
			//this.modeler.mode = CODE.modelerMode.DRAWING_CLIPPINGBOX;
			//this.modeler.mode = CODE.modelerMode.DRAWING_CYLYNDER;
			this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
			//this.modeler.mode = CODE.modelerMode.DRAWING_EXCAVATIONPOINTS;
			this.counterAux++;
		}
		else if (this.counterAux === 0)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_BOX;
			this.counterAux++;
		}
		else if (this.counterAux === 1)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_TUBE;
			this.counterAux++;
		}
		else if (this.counterAux === 2)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_CONCENTRICTUBES;
			this.counterAux++;
		}
		else if (this.counterAux === 3)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
			this.counterAux++;
		}
		else if (this.counterAux === 4)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_SPHERE;
			this.counterAux++;
		}
		else if (this.counterAux === 5)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_CLIPPINGBOX;
			this.counterAux ++;
		}
		else if (this.counterAux === 6)
		{
			this.modeler.mode = CODE.modelerMode.DRAWING_FREECONTOURWALL;//
			this.counterAux = 0;
		}
		
	}
	else if (key === 38) // 38 = 'up'.***
	{
		this.modeler.mode = CODE.modelerMode.DRAWING_STATICGEOMETRY;
	}
	else if (key === 39) // 39 = 'right'.***
	{
		this.modeler.mode = CODE.modelerMode.DRAWING_BSPLINE;
		//this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;
		//this.modeler.mode = 51;
	}
	else if (key === 40) // 40 = 'down'.***
	{
		this.modeler.mode = CODE.modelerMode.DRAWING_BASICFACTORY;
	}
	else if (key === 49) // 49 = '1'.***
	{
		if (this.pointsCloudWhite === undefined)
		{ this.pointsCloudWhite = true; }
		
		if (this.pointsCloudWhite)
		{ this.pointsCloudWhite = false; }
		else
		{ this.pointsCloudWhite = true; }
	}
	else if (key === 80) // 80 = 'p'.***
	{
		var projectId = "AutonomousBus";
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
		
		var latitude;
		var longitude;
		var elevation;
		
		var heading = 45;
		var pitch = 45;
		var roll;
		

		// Test 2: moving by a path.***
		var bSplineCubic3d = this.modeler.bSplineCubic3d;
		var geographicCoordsArray = bSplineCubic3d.geoCoordsList.geographicCoordsArray;
		var path3d = new Path3D(geographicCoordsArray);
		if (bSplineCubic3d !== undefined)
		{
			// do animation by path.***
			var animationOption = {
				animationType                : CODE.animationType.PATH,
				path                         : path3d,
				linearVelocityInMetersSecond : 30,
				autoChangeRotation           : true
			};
			this.changeLocationAndRotation(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, animationOption);
		}
	}
	else if (key === 83) // 83 = 's'.***
	{
		// active or deactive shadows.
		if (this.sceneState.applySunShadows)
		{ this.sceneState.setApplySunShadows(false); }
		else
		{ this.sceneState.setApplySunShadows(true); }
	}
	else if (key === 84) // 84 = 't'.***
	{

		//if (this.magoPolicy.issueInsertEnable)
		//{ this.magoPolicy.issueInsertEnable = false; }
		//else
		//{ this.magoPolicy.issueInsertEnable = true; }
		
		
		// Stencil shadow mesh making test.********************
		/*
		var nodeSelected = this.selectionManager.currentNodeSelected;
		if (nodeSelected)
		{
			var geoLocDataManager = nodeSelected.data.geoLocDataManager;
			var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
			var sunSystem = this.sceneState.sunSystem;
			var sunDirWC = sunSystem.getSunDirWC();
			var sunDirLC = geoLocData.getRotatedRelativeVector(sunDirWC, sunDirLC);
			
			var neoBuilding = nodeSelected.data.neoBuilding;
			var lodBuilding = neoBuilding.lodBuildingMap.lod3;
			if (lodBuilding)
			{ lodBuilding.skinLego.makeStencilShadowMesh(sunDirLC); }
		}
		*/
		// End test----------------------------------------------------
		
		// another test.***
		if (this.modeler !== undefined)
		{
			
			var geoCoordsList = this.modeler.getGeographicCoordsList();
			if (geoCoordsList !== undefined)
			{
				// test make thickLine.
				//geoCoordsList.test__makeThickLines(this);
				if (geoCoordsList.getGeoCoordsCount() > 0)
				{
					var renderableObject = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsList.geographicCoordsArray, this);
					this.modeler.addObject(renderableObject, 15);
					
					geoCoordsList.geographicCoordsArray.length = 0;
				}
			}
			
			//var excavation = this.modeler.getExcavation();
			//if (excavation !== undefined)
			//{
			//	excavation.makeExtrudeObject(this);
			//}
			/*
			if (geoCoordsList !== undefined && geoCoordsList.geographicCoordsArray.length > 0)
			{
				// test make thickLine.
				var options = {
					geoCoordsArray: geoCoordsList.geographicCoordsArray
				};
				var excavation = new Excavation(options);
				this.modeler.addObject(excavation, 12);
			}
			
			
			var tunnel = this.modeler.getTunnel();
			if (tunnel !== undefined)
			{
				tunnel.getProfileGeographicCoordsList(); // executed this only to create the profile.*** TEST.***
				tunnel.makeMesh(this);
				
			}
			*/
			/*
			// Another test: Change color by projectId & objectId.***
			var api = new API();
			api.apiName = "changeColor";
			api.setProjectId("AutonomousBus");
			api.setDataKey("AutonomousBus_0");
			api.setObjectIds("13");
			api.setColor("220,150,20");
			this.callAPI(api);
			
			// Another test: BSplineCubic3d.***
			var bSplineCubic3d = this.modeler.bSplineCubic3d;
			if (bSplineCubic3d !== undefined)
			{
				if (bSplineCubic3d.geoCoordsList === undefined)
				{ bSplineCubic3d.geoCoordsList = new GeographicCoordsList(); }
				
				var maxLengthDegree = 0.001;
				Path3D.insertPointsOnLargeSegments(bSplineCubic3d.geoCoordsList.geographicCoordsArray, maxLengthDegree, this);
				
				var coordsCount = bSplineCubic3d.geoCoordsList.geographicCoordsArray.length;
				for (var i=0; i<coordsCount; i++)
				{
					var geoCoord = bSplineCubic3d.geoCoordsList.geographicCoordsArray[i];
					var geoLocDataManager = geoCoord.getGeoLocationDataManager();
					var geoLocData = geoLocDataManager.newGeoLocationData("noName");
					geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
				}
				
				var geoCoordsList = bSplineCubic3d.getGeographicCoordsList();
				geoCoordsList.makeLines(this);
			
				// Make the controlPoints.***
				var controlPointArmLength = 0.2;
				bSplineCubic3d.makeControlPoints(controlPointArmLength, this);
				bSplineCubic3d.makeInterpolatedPoints();
			}
			*/
		}
		
		// Another test.***
		
		if (this.smartTile_f4d_tested === undefined)
		{
			this.smartTile_f4d_tested = 1;
			//var projectFolderName = "smartTile_f4d_Korea";
			//var projectFolderName = "SejongParkJinWoo_20191101";
			var projectFolderName = "SmartTilesF4D_WorkFolder";
			var fileName = this.readerWriter.geometryDataPath + "/" + projectFolderName + "/" + "smartTile_f4d_indexFile.sii";
			this.readerWriter.getObjectIndexFileSmartTileF4d(fileName, projectFolderName, this);

		}
		
		//else if (this.smartTile_f4d_tested === 1)
		//{
		//	this.smartTile_f4d_tested ++;
		//	var projectFolderName = "smartTile_f4d_Korea";
		//	var fileName = this.readerWriter.geometryDataPath + "/" + projectFolderName + "/" + "smartTile_f4d_indexFile.sii";
		//	this.readerWriter.getObjectIndexFileSmartTileF4d(fileName, projectFolderName, this);
		//}

		
		// Another test. make collisionCheckOctree.***
		/*
		if (this.selectionManager.currentNodeSelected !== undefined)
		{
			// make collisionCheckOctree.***
			var selNode = this.selectionManager.currentNodeSelected;
			var neoBuilding = selNode.data.neoBuilding;
			if (neoBuilding !== undefined)
			{
				var attributeKey = "isDeletable";
				var attributeValue = false;
				neoBuilding.setAttribute(attributeKey, attributeValue);
				neoBuilding.setAttribute("keepDataArrayBuffers", true);
				// make collisionCheckOctree.***
				if (neoBuilding.allModelsAndReferencesAreParsed(this))
				{
					var desiredMinOctreeSize = 0.25;
					neoBuilding.makeCollisionCheckOctree(desiredMinOctreeSize);
				}
				else 
				{
					neoBuilding.forceToLoadModelsAndReferences(this);
				}
			}
		}
		
		// Moviment restriction test.***
		if (this.modeler !== undefined)
		{
			
			var geoCoordsList = this.modeler.getGeographicCoordsList();
			var geoCoordSegment = geoCoordsList.getGeoCoordSegment(0);
			
			
			var className = "ConcentricTubes";
			var objectsArray = this.modeler.extractObjectsByClassName(className);
			if (objectsArray !== undefined && objectsArray.length > 0)
			{
				var concentricTubes = objectsArray[0];
				if (concentricTubes.attributes === undefined)
				{ concentricTubes.attributes = {}; }
				
				var attributes = concentricTubes.attributes;
				if (attributes.movementRestriction === undefined)
				{ attributes.movementRestriction = {}; }
				
				
				if (attributes.movementRestriction.element === undefined)
				{
					attributes.movementRestriction.element = geoCoordSegment;
				}
				
			}
		}
		*/
		
	}
	else if (key === 87) // 87 = 'w'.***
	{
		// do wind test.
		if (this.windTest === undefined)
		{
			if (this.weatherStation === undefined)
			{ this.weatherStation = new WeatherStation(); }
		
			var geometryDataPath = this.readerWriter.geometryDataPath;
			var windDataFilesNamesArray = ["OBS-QWM_2016062000.grib2_wind_000", "OBS-QWM_2016062001.grib2_wind_000", "OBS-QWM_2016062002.grib2_wind_000", "OBS-QWM_2016062003.grib2_wind_000",
				"OBS-QWM_2016062004.grib2_wind_000", "OBS-QWM_2016062005.grib2_wind_000", "OBS-QWM_2016062006.grib2_wind_000", "OBS-QWM_2016062007.grib2_wind_000",
				"OBS-QWM_2016062008.grib2_wind_000", "OBS-QWM_2016062009.grib2_wind_000", "OBS-QWM_2016062010.grib2_wind_000", "OBS-QWM_2016062011.grib2_wind_000",
				"OBS-QWM_2016062012.grib2_wind_000", "OBS-QWM_2016062013.grib2_wind_000", "OBS-QWM_2016062014.grib2_wind_000", "OBS-QWM_2016062015.grib2_wind_000",
				"OBS-QWM_2016062016.grib2_wind_000", "OBS-QWM_2016062017.grib2_wind_000", "OBS-QWM_2016062018.grib2_wind_000", "OBS-QWM_2016062019.grib2_wind_000",
				"OBS-QWM_2016062020.grib2_wind_000", "OBS-QWM_2016062021.grib2_wind_000", "OBS-QWM_2016062022.grib2_wind_000", "OBS-QWM_2016062023.grib2_wind_000"];

			var windDataFilesNamesArray = ["OBS-QWM_2019090700.grib2_wind_000", "OBS-QWM_2019090701.grib2_wind_000", "OBS-QWM_2019090702.grib2_wind_000", "OBS-QWM_2019090703.grib2_wind_000",
				"OBS-QWM_2019090704.grib2_wind_000", "OBS-QWM_2019090705.grib2_wind_000", "OBS-QWM_2019090706.grib2_wind_000", "OBS-QWM_2019090707.grib2_wind_000",
				"OBS-QWM_2019090708.grib2_wind_000", "OBS-QWM_2019090709.grib2_wind_000", "OBS-QWM_2019090710.grib2_wind_000", "OBS-QWM_2019090711.grib2_wind_000",
				"OBS-QWM_2019090712.grib2_wind_000", "OBS-QWM_2019090713.grib2_wind_000", "OBS-QWM_2019090714.grib2_wind_000", "OBS-QWM_2019090715.grib2_wind_000",
				"OBS-QWM_2019090716.grib2_wind_000", "OBS-QWM_2019090717.grib2_wind_000", "OBS-QWM_2019090718.grib2_wind_000", "OBS-QWM_2019090719.grib2_wind_000",
				"OBS-QWM_2019090720.grib2_wind_000", "OBS-QWM_2019090721.grib2_wind_000", "OBS-QWM_2019090722.grib2_wind_000", "OBS-QWM_2019090723.grib2_wind_000"];
				
			//var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_Airport";
			//var windMapFilesFolderPath = geometryDataPath +"/JeJu_wind_GolfPark_NineBridge1";
			var windMapFilesFolderPath = geometryDataPath +"/SeoulWind/200907";
			
			this.weatherStation.test_loadWindData3d(this, windDataFilesNamesArray, windMapFilesFolderPath);
			this.TEST__golfPark();
			this.windTest = true;
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
 * 마우스 클릭 이벤트 처리
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.TEST__golfPark = function() 
{
	// create 3 golfHoleFlags.
	var geoCoord = new GeographicCoord(126.40310387701689, 33.34144078912163, 34.0);
	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
	
	var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
	
	var golfHoleFlag = new GolfHoleFlag(0.3, 20, options);
	golfHoleFlag.geoLocDataManager = geoLocDataManager;
	if (golfHoleFlag.attributes === undefined)
	{ golfHoleFlag.attributes = {}; }
	golfHoleFlag.attributes.isMovable = true;
	
	this.modeler.addObject(golfHoleFlag, 15);
	
	// 2nd golfHoleFlag.
	var geoCoord = new GeographicCoord(126.39837002777193, 33.341987673830694, 23.8);
	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
	
	var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
	
	var golfHoleFlag = new GolfHoleFlag(0.3, 20, options);
	golfHoleFlag.geoLocDataManager = geoLocDataManager;
	if (golfHoleFlag.attributes === undefined)
	{ golfHoleFlag.attributes = {}; }
	golfHoleFlag.attributes.isMovable = true;
	
	this.modeler.addObject(golfHoleFlag, 15);
	
	// 3rd golfHoleFlag.
	var geoCoord = new GeographicCoord(126.39794580151037, 33.341476458307255, 18.5);
	var geoLocDataManager = geoCoord.getGeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData("noName");
	geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, undefined, undefined, undefined, geoLocData, this);
	
	var options = {color: {r: 0.2, g: 0.5, b: 0.9, a: 0.5}};
	
	var golfHoleFlag = new GolfHoleFlag(0.3, 20, options);
	golfHoleFlag.geoLocDataManager = geoLocDataManager;
	if (golfHoleFlag.attributes === undefined)
	{ golfHoleFlag.attributes = {}; }
	golfHoleFlag.attributes.isMovable = true;
	
	this.modeler.addObject(golfHoleFlag, 15);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.mouseActionLeftClick = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }

	var eventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(this.getGl(), mouseX, mouseY, undefined, undefined, undefined, this);
	if (eventCoordinate) 
	{
		this.emit(MagoManager.EVENT_TYPE.CLICK, {type: MagoManager.EVENT_TYPE.CLICK, clickCoordinate: eventCoordinate, timestamp: this.getCurrentTime()});
	}
		
	//if (!this.isDragging()) 
	//	{
		
	//	}

	var currSelObject = this.selectionManager.getSelectedGeneral();
	if (currSelObject instanceof(TinTerrain))
	{
		var hola = 0;
	}
	// Check modeler mode.
	//this.magoMode = CODE.magoMode.DRAWING; // DEBUG. Delete this line.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	if (this.magoMode === CODE.magoMode.DRAWING)// then process to draw.***
	{
		if (this.modeler === undefined)
		{ this.modeler = new Modeler(this); }

		this.modeler.mode = CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS;

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
		if (strWorldPoint === undefined)
		{ return; }

		// create a geoCoord on click position.
		geoCoord = Globe.CartesianToGeographicWgs84(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z, undefined, true);
		geoCoord.absolutePoint = strWorldPoint;

		if (this.modeler.mode === CODE.modelerMode.DRAWING_GEOGRAPHICPOINTS)
		{
			geoCoord.makeDefaultGeoLocationData();

			var geoCoordsList = this.modeler.getGeographicCoordsList();
			geoCoordsList.addGeoCoord(geoCoord);
		}
	}
	
};



/**
 * 마우스 더블 클릭 이벤트 처리
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.mouseActionLeftDoubleClick = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }

	if (!this.isDragging()) 
	{
		var eventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(this.getGl(), mouseX, mouseY, undefined, undefined, undefined, this);
		if (eventCoordinate) 
		{
			this.emit(MagoManager.EVENT_TYPE.DBCLICK, {
				type            : MagoManager.EVENT_TYPE.DBCLICK, 
				clickCoordinate : eventCoordinate, 
				timestamp       : this.getCurrentTime()
			});
		}
	}
};


/**
 * 마우스 더블 클릭 이벤트 처리
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.mouseActionRightClick = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }

	if (!this.isDragging()) 
	{
		var eventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(this.getGl(), mouseX, mouseY, undefined, undefined, undefined, this);
		if (eventCoordinate) 
		{
			this.emit(MagoManager.EVENT_TYPE.RIGHTCLICK, {type: MagoManager.EVENT_TYPE.RIGHTCLICK, clickCoordinate: eventCoordinate, timestamp: this.getCurrentTime()});
		}
	}
};

MagoManager.prototype.cameraChanged = function(e) 
{
	this.emit(MagoManager.EVENT_TYPE.CAMERACHANGED, {
		type      : MagoManager.EVENT_TYPE.CAMERACHANGED,
		timestamp : new Date()
	});
};

MagoManager.prototype.cameraMoveStart = function() 
{
	this.emit(MagoManager.EVENT_TYPE.CAMERAMOVESTART, {
		type      : MagoManager.EVENT_TYPE.CAMERAMOVESTART,
		timestamp : new Date()
	});
};

MagoManager.prototype.cameraMoveEnd = function() 
{
	this.emit(MagoManager.EVENT_TYPE.CAMERAMOVEEND, {
		type      : MagoManager.EVENT_TYPE.CAMERAMOVEEND,
		timestamp : new Date()
	});
};



/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.mouseActionLeftDown = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
	this.dateSC = new Date();
	this.startTimeSC = this.dateSC.getTime();

	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	this.mouseLeftDown = true;
	//this.isCameraMoving = true;
	MagoWorld.updateMouseStartClick(mouseX, mouseY, this);

	var eventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(this.getGl(), mouseX, mouseY, undefined, undefined, undefined, this);
	if (eventCoordinate) 
	{
		this.emit(MagoManager.EVENT_TYPE.LEFTDOWN, {
			type      : MagoManager.EVENT_TYPE.LEFTDOWN,
			point     : eventCoordinate,
			timestamp : new Date()
		});
	}
	
	this.setBPicking(mouseX, mouseY);
};

/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.saveHistoryObjectMovement = function (refObject, node) 
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
	this.config.saveMovingHistory(projectId, dataKey, objectIndex, changeHistory);
};



/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * 
 * @private
 */
MagoManager.prototype.mouseActionMiddleDown = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
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
 * 
 * @private
 */
MagoManager.prototype.mouseActionMiddleUp = function(mouseX, mouseY) 
{
	if (!this.magoPolicy.getMagoEnable()) { return; }
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
 * 
 * @private
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
 * 
 * @private
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
 * @param {Point2D} newPixel
 * @param {Point2D} oldPixel
 * 
 * @private
 */
MagoManager.prototype.mouseActionMove = function(newPixel, oldPixel) 
{
	if (this.mouseLeftDown) 
	{
		if (newPixel.x !== oldPixel.x || newPixel.y !== oldPixel.y) 
		{
			this.manageMouseDragging(newPixel.x, newPixel.y);
			this.cameraMoved();
		}
	}
	else
	{
		this.mouseDragging = false;
		if (this.isCesiumGlobe()) 
		{
			this.setCameraMotion(true);
			//disableCameraMotion(this.scene.screenSpaceCameraController, true);
		}
		
		if (this.mouseMiddleDown || this.mouseRightDown)
		{
			this.isCameraMoving = true;
			this.cameraMoved();
		}
	}
	var gl = this.getGl();
	
	var startEventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(gl, oldPixel.x, oldPixel.y, undefined, undefined, undefined, this);
	var endEventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(gl, newPixel.x, newPixel.y, undefined, undefined, undefined, this);
	if (startEventCoordinate && endEventCoordinate) 
	{
		this.emit(MagoManager.EVENT_TYPE.MOUSEMOVE, {type: MagoManager.EVENT_TYPE.MOUSEMOVE, startEvent: startEventCoordinate, endEvent: endEventCoordinate, timestamp: this.getCurrentTime() });
	}

	/*function disableCameraMotion(screenSpaceCameraController, state)
	{
		screenSpaceCameraController.enableRotate = state;
		screenSpaceCameraController.enableZoom = state;
		screenSpaceCameraController.enableLook = state;
		screenSpaceCameraController.enableTilt = state;
		screenSpaceCameraController.enableTranslate = state;
	}
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
		
	}*/
};


/**
 * 선택 객체를 asimetric mode 로 이동
 * @param gl 변수
 * @param scene 변수
 * @param renderables_neoRefLists_array 변수
 * 
 * @private
 */
MagoManager.prototype.manageMouseDragging = function(mouseX, mouseY) 
{
	this.sceneState.camera.setDirty(true);
	
	this.mouse_x = mouseX;
	this.mouse_y = mouseY;
	
	// distinguish 2 modes.******************************************************
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // blocks move.***
	{
		
		if (this.selectionManager.getSelectedF4dBuilding() !== undefined && this.selectionManager.getSelectedF4dNode()) 
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
			
			this.emit(MagoManager.EVENT_TYPE.SELECTEDF4DMOVED, {
				type   : MagoManager.EVENT_TYPE.SELECTEDF4DMOVED,
				result : {
					projectId : nodeOwner.data.projectId,
					dataKey   : nodeOwner.data.nodeId,
					latitude  : geographicCoords.latitude,
					longitude : geographicCoords.longitude,
					altitude  : geographicCoords.altitude, 
					heading   : geoLocation.heading, 
					pitch     : geoLocation.pitch, 
					roll      : geoLocation.roll
				},
				timestamp: new Date()
			});

			/*movedDataCallback(	MagoConfig.getPolicy().geo_callback_moveddata,
				nodeOwner.data.projectId,
				nodeOwner.data.nodeId,
				null,
				geographicCoords.latitude,
				geographicCoords.longitude,
				geographicCoords.altitude,
				geoLocation.heading,
				geoLocation.pitch,
				geoLocation.roll
			);*/				
		}
		else 
		{
			this.isCameraMoving = true; // if no object is selected.***
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		if (this.selectionManager.getSelectedF4dObject() !== undefined && this.selectionManager.currentOctreeSelected) 
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

	
	// General objects.***
	if (!this.mouseDragging) 
	{
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
 * @param {WebGLRenderingContext} gl WebGLRenderingContext.
 * 
 * @private
 */
MagoManager.prototype.moveSelectedObjectGeneral = function(gl, object) 
{
	if (object === undefined)
	{ return; }

	if (object instanceof ObjectMarker)
	{ return; }

	object = object.getRootOwner();

	var attributes = object.attributes;
	if (attributes === undefined)
	{ return; }

	var isMovable = attributes.isMovable;
	if (isMovable === undefined || isMovable === false)
	{ return; }
	
	var geoLocDataManager = object.getGeoLocDataManager();
	if (geoLocDataManager === undefined)
	{ return; }
	
	var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
	
	var mouseAction = this.sceneState.mouseAction;

	
	if (this.selObjMovePlaneCC === undefined) 
	{
		this.selObjMovePlaneCC = new Plane();
		// calculate the pixelPos in camCoord.
		var geoLocMatrix = geoLocationData.geoLocMatrix;
		var mvMat = this.sceneState.modelViewMatrix;
		var mvMatRelToEye = this.sceneState.modelViewRelToEyeMatrix;
		var pixelPosCC = mvMat.transformPoint3D(mouseAction.strWorldPoint, undefined);

		if (attributes.movementInAxisZ)
		{
			// movement in plane XZ.
			var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
			var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeYaxisWC, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
		}
		else 
		{
			// movement in plane XY.
			var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
			var globeZaxisCC = mvMatRelToEye.transformPoint3D(globeZaxisWC, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeZaxisCC.x, globeZaxisCC.y, globeZaxisCC.z); 
		}
	}

	
	if (this.lineCC === undefined)
	{ this.lineCC = new Line(); }
	var camRay = ManagerUtils.getRayCamSpace(this.mouse_x, this.mouse_y, camRay, this);
	this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);
	
	
	// Calculate intersection cameraRay with planeCC.
	var intersectionPointCC = new Point3D();
	intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
	//------------------------------------------------------------------------------------------------

	var mvMat = this.sceneState.getModelViewMatrixInv();
	var intersectionPointWC = mvMat.transformPoint3D(intersectionPointCC, intersectionPointWC);

	
	// register the movement.***
	if (!this.thereAreStartMovePoint) 
	{
		var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);
		this.thereAreStartMovePoint = true;
		
		var buildingGeoCoord = geoLocationData.geographicCoord;
		this.startGeoCoordDif = new GeographicCoord(cartographic.longitude-buildingGeoCoord.longitude, cartographic.latitude-buildingGeoCoord.latitude, cartographic.altitude-buildingGeoCoord.altitude);

	}
	else 
	{
		var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);

		var difX = cartographic.longitude - this.startGeoCoordDif.longitude;
		var difY = cartographic.latitude - this.startGeoCoordDif.latitude;
		var difZ = cartographic.altitude - this.startGeoCoordDif.altitude;
		
		var newLongitude = difX;
		var newlatitude = difY;
		var newAltitude = difZ;
		
		// Must check if there are restrictions.***
		var attributes = object.attributes;
		
		if (attributes.minAltitude !== undefined)
		{
			if (newAltitude < attributes.minAltitude)
			{ newAltitude = attributes.minAltitude; }
		}
		
		if (attributes.maxAltitude !== undefined)
		{
			if (newAltitude > attributes.maxAltitude)
			{ newAltitude = attributes.maxAltitude; }
		}
		
		if (attributes && attributes.movementRestriction)
		{
			var movementRestriction = attributes.movementRestriction;
			if (movementRestriction)
			{
				var movementRestrictionType = movementRestriction.restrictionType;
				var movRestrictionElem = movementRestriction.element;
				if (movRestrictionElem && movRestrictionElem.constructor.name === "GeographicCoordSegment")
				{
					// restriction.***
					var geoCoordSegment = movRestrictionElem;
					var newGeoCoord = new GeographicCoord(newLongitude, newlatitude, 0.0);
					var projectedCoord = GeographicCoordSegment.getProjectedCoordToLine(geoCoordSegment, newGeoCoord, undefined);
					
					// check if is inside.***
					if (!GeographicCoordSegment.intersectionWithGeoCoord(geoCoordSegment, projectedCoord))
					{
						var nearestGeoCoord = GeographicCoordSegment.getNearestGeoCoord(geoCoordSegment, projectedCoord);
						newLongitude = nearestGeoCoord.longitude;
						newlatitude = nearestGeoCoord.latitude;
					}
					else 
					{
						newLongitude = projectedCoord.longitude;
						newlatitude = projectedCoord.latitude;
					}
				}
			}
		}
		if (attributes && attributes.hasStaticModel)
		{
			var projectId = attributes.projectId;
			var dataKey = attributes.instanceId;
			if (!defined(projectId))
			{
				return false;
			}
			if (!defined(dataKey))
			{
				return false;
			}
			var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
			if (node !== undefined)
			{
				node.changeLocationAndRotation(newlatitude, newLongitude, 0, attributes.f4dHeading, 0, 0, this);
			}
		}
		
		if (attributes.movementInAxisZ)
		{
			geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, newAltitude, undefined, undefined, undefined, geoLocationData, this);
		}
		else 
		{
			geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
		}

	}
	
	object.moved();
};


/**
 * Moves an object.
 * @param {WebGLRenderingContext} gl WebGLRenderingContext.
 * 
 * @private
 */
MagoManager.prototype.moveSelectedObjectAsimetricMode = function (gl) 
{
	if (!this.magoPolicy.isModelMovable()) { return; }

	var currSelected = this.selectionManager.getSelectedGeneral();
	var currSelectedClassName = "";
	if (currSelected)
	{ currSelectedClassName = currSelected.constructor.name; }
	
	if (this.magoPolicy.objectMoveMode === CODE.moveMode.ALL) // buildings move.***
	{
		if (this.selectionManager.getSelectedF4dNode() === undefined)
		{ return; }
		
		var geoLocDataManager = this.selectionManager.getSelectedF4dNode().getNodeGeoLocDataManager();
		var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
		
		var mouseAction = this.sceneState.mouseAction;
	
		var attributes = {};
		
		if (this.selObjMovePlaneCC === undefined) 
		{
			this.selObjMovePlaneCC = new Plane();
			// calculate the pixelPos in camCoord.
			var geoLocMatrix = geoLocationData.geoLocMatrix;
			var mvMat = this.sceneState.modelViewMatrix;
			var mvMatRelToEye = this.sceneState.modelViewRelToEyeMatrix;
			var pixelPosCC = mvMat.transformPoint3D(mouseAction.strWorldPoint, undefined);

			if (attributes.movementInAxisZ)
			{
				// movement in plane XZ.
				var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
				var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeYaxisWC, undefined);
				this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
			}
			else 
			{
				// movement in plane XY.
				var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
				var globeZaxisCC = mvMatRelToEye.transformPoint3D(globeZaxisWC, undefined);
				this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeZaxisCC.x, globeZaxisCC.y, globeZaxisCC.z); 
			}
		}

		if (this.lineCC === undefined)
		{ this.lineCC = new Line(); }
		var camRay = ManagerUtils.getRayCamSpace(this.mouse_x, this.mouse_y, camRay, this);
		this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);
		
		
		// Calculate intersection cameraRay with planeCC.
		var intersectionPointCC = new Point3D();
		intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
		//------------------------------------------------------------------------------------------------

		var mvMat = this.sceneState.getModelViewMatrixInv();
		var intersectionPointWC = mvMat.transformPoint3D(intersectionPointCC, intersectionPointWC);
	
		// register the movement.***
		if (!this.thereAreStartMovePoint) 
		{
			var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);
			this.thereAreStartMovePoint = true;
			
			var buildingGeoCoord = geoLocationData.geographicCoord;
			this.startGeoCoordDif = new GeographicCoord(cartographic.longitude-buildingGeoCoord.longitude, cartographic.latitude-buildingGeoCoord.latitude, cartographic.altitude-buildingGeoCoord.altitude);
		}
		else 
		{
			var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);

			var difX = cartographic.longitude - this.startGeoCoordDif.longitude;
			var difY = cartographic.latitude - this.startGeoCoordDif.latitude;
			var difZ = cartographic.altitude - this.startGeoCoordDif.altitude;
			
			var newLongitude = difX;
			var newlatitude = difY;
			var newAltitude = difZ;

			if (attributes.movementInAxisZ)
			{
				//geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, newAltitude, undefined, undefined, undefined, geoLocationData, this);
				this.changeLocationAndRotationNode(this.selectionManager.getSelectedF4dNode(), undefined, undefined, newAltitude, undefined, undefined, undefined);
			}
			else 
			{
				//geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
				this.changeLocationAndRotationNode(this.selectionManager.getSelectedF4dNode(), newlatitude, newLongitude, undefined, undefined, undefined, undefined);
			}
			
			this.displayLocationAndRotation(this.buildingSelected);
		}
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.OBJECT) // objects move.***
	{
		var selectedObjtect= this.selectionManager.getSelectedF4dObject();
		if (selectedObjtect === undefined)
		{ return; }
	
		if (selectedObjtect.constructor.name !== "NeoReference")
		{ return; }

		// create a XY_plane in the selected_pixel_position.***
		if (this.selObjMovePlane === undefined) 
		{
			this.selObjMovePlane = this.calculateSelObjMovePlaneAsimetricMode(gl, this.mouse_x, this.mouse_y, this.selObjMovePlane);
		}
		
		var geoLocDataManager = this.selectionManager.getSelectedF4dNode().getNodeGeoLocDataManager();

		// world ray = camPos + lambda*camDir.***
		if (this.lineSC === undefined)
		{ this.lineSC = new Line(); }
		
		this.lineSC = ManagerUtils.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, this.lineSC, this); // rayWorldSpace.***
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
		
		if (selectedObjtect.moveVectorRelToBuilding === undefined)
		{ selectedObjtect.moveVectorRelToBuilding = new Point3D(); }
	
		// move vector rel to building.
		if (!this.thereAreStartMovePoint) 
		{
			this.startMovPoint = intersectionPoint;
			this.startMovPoint.add(-selectedObjtect.moveVectorRelToBuilding.x, -selectedObjtect.moveVectorRelToBuilding.y, -selectedObjtect.moveVectorRelToBuilding.z);
			this.thereAreStartMovePoint = true;
		}
		else 
		{
			var difX = intersectionPoint.x - this.startMovPoint.x;
			var difY = intersectionPoint.y - this.startMovPoint.y;
			var difZ = intersectionPoint.z - this.startMovPoint.z;

			selectedObjtect.moveVectorRelToBuilding.set(difX, difY, difZ);
			selectedObjtect.moveVector = buildingGeoLocation.tMatrix.rotatePoint3D(selectedObjtect.moveVectorRelToBuilding, selectedObjtect.moveVector); 
		}
		
		var projectId = this.selectionManager.getSelectedF4dNode().data.projectId;
		var data_key = this.selectionManager.getSelectedF4dNode().data.nodeId;
		var objectIndexOrder = selectedObjtect._id;
		
		this.config.deleteMovingHistoryObject(projectId, data_key, objectIndexOrder);
		this.objectMoved = true; // this provoques that on leftMouseUp -> saveHistoryObjectMovement
		
	}
	else if (this.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS && currSelectedClassName === "GeographicCoord") 
	{
		// Move the current geographic point selected.***
		if (currSelected)
		{
			//if (currSelectedClassName === "GeographicCoord")
			{
				var geoLocDataManager = currSelected.getGeoLocationDataManager();
				var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
				
				var geoCoord;
				var strWorldPoint;
				if (this.isCesiumGlobe())
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
						var camRay = ManagerUtils.getRayWorldSpace(gl, this.mouse_x, this.mouse_y, undefined, this); // rayWorldSpace.***
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
		var selectionManager = this.selectionManager;
		var generalObjectSelected = selectionManager.getSelectedGeneral();
		if (generalObjectSelected)
		{
			// Move the object.***
			this.moveSelectedObjectGeneral(gl, generalObjectSelected);
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
		this.depthFboAux = new FBO(gl, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0], {matchCanvasSize: true});
	}

	this.depthFboAux.bind(); 
	
	if (this.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	gl.disable(gl.BLEND);
	
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	// Now, renderDepth the selected object. Fix the frustumFar for adequate precision on depthPacking.***
	var shader = this.postFxShadersManager.getShader("modelRefDepth"); 
	if (!shader.uniformsMapGeneral.frustumFar)
	{ return; }

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
 * 
 * @private
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
		//var frustum0 = data.myCameraRelative.bigFrustum;
		var frustum0 = data.myCameraRelative.frustum;
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
 * 
 * @private
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
	this.parseQueue.parseArrayOctreesLod0References(this.visibleObjControlerOctrees.currentVisibles0, this);
	this.parseQueue.parseArrayOctreesLod0References(this.visibleObjControlerOctrees.currentVisibles1, this);


	// parse octrees lod0 & lod1 models.***
	this.parseQueue.parseArrayOctreesLod0Models(this.visibleObjControlerOctrees.currentVisibles0, this);
	this.parseQueue.parseArrayOctreesLod0Models(this.visibleObjControlerOctrees.currentVisibles1, this);
	
	
	// parse octrees lod2 (lego).***
	this.parseQueue.parseArrayOctreesLod2Legos(this.visibleObjControlerOctrees.currentVisibles2, this);

	// parse PCloud octree.***
	this.parseQueue.parseArrayOctreesPCloud(gl, this.visibleObjControlerOctrees.currentVisiblesAux, this);
	this.parseQueue.parseArrayOctreesPCloudPartition(gl, this.visibleObjControlerOctrees.currentVisiblesAux, this);

	// parse skin-lego.***
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles0, this);
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles2, this);
	this.parseQueue.parseArraySkins(gl, this.visibleObjControlerNodes.currentVisibles3, this);
	
	// parse multiBuildings.
	this.parseQueue.parseMultiBuildings(gl, this.visibleObjControlerNodes.currentVisibles0, this);
	this.parseQueue.parseMultiBuildings(gl, this.visibleObjControlerNodes.currentVisibles2, this);
	this.parseQueue.parseMultiBuildings(gl, this.visibleObjControlerNodes.currentVisibles3, this);

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
 * @private
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
 * 
 * @private
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
		
		// Check if the lod2 is modelRef type data.
		var lodBuildingData = neoBuilding.getLodBuildingData(2);
		if (lodBuildingData.isModelRef === true)
		{
			// 1rst, check if lod2 is loaded. If lod2 is no loaded yet, then load first lod2.***
			if (this.readerWriter.octreesSkinLegos_requested < 5)
			{
				if (lowestOctree.lego === undefined || !lowestOctree.lego.isReadyToRender())
				{
					lowestOctree.prepareSkinData(this);
				}
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
					// This is a no used partitionsBlocksLists version. Delete it.
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
 * 
 * @private
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
		
		// Check if the lod2 is modelRef type data.
		var lodBuildingData = lowestOctree.neoBuildingOwner.getLodBuildingData(2);
		if (!lodBuildingData.isModelRef)
		{ continue; }

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
 * 
 * @private
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
		moveHistoryMap = this.config.getMovingHistoryObjects(projectId, dataKey);
		if (moveHistoryMap)
		{
			node.data.moveHistoryMap = moveHistoryMap;
			/*
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
			*/
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @private
 */
MagoManager.prototype.checkPropertyFilters = function(nodesArray) 
{
	if (this.propertyFilterSC === undefined)
	{ return; }
	
	var nodesCount = nodesArray.length;
	if(nodesCount === 0)
	return;

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
					if (visible === true)
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
					if (visible === true)
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
 * @private
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

		colorChangedHistoryMap = this.config.getColorHistorys(projectId, dataKey);
		if (colorChangedHistoryMap)
		{
			var data = node.data;
			
			// Set the colorChangedHistoryMap into data of the node.***
			data.colorChangedHistoryMap = colorChangedHistoryMap;
		}
	}
	
	var allColorHistoryMap = this.config.getAllColorHistory();
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
												
												data.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
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
													
													data.aditionalColor.setRGBA(changeHistory.color[0], changeHistory.color[1], changeHistory.color[2], changeHistory.color[3]);
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


/**
 * Draw building names on scene.
 * @private
 */
MagoManager.prototype.getObjectLabel = function() 
{
	if (this.canvasObjectLabel === undefined)
	{
		this.canvasObjectLabel = document.createElement('canvas');

		var magoDiv = document.getElementById(this.config.getContainerId());
		var offsetLeft = magoDiv.offsetLeft;
		var offsetTop = magoDiv.offsetTop;
		var canvasStyleLeft = offsetLeft.toString()+"px";
		var canvasStyleTop = offsetTop.toString()+"px";
		var offsetWidth = magoDiv.offsetWidth;
		var offsetHeight = magoDiv.offsetHeight;
		
		this.canvasObjectLabel.className = 'mago3d-object-label';
		
		this.canvasObjectLabel.width = this.sceneState.drawingBufferWidth;
		this.canvasObjectLabel.height = this.sceneState.drawingBufferHeight;

		this.canvasObjectLabel.style.left = '0';
		this.canvasObjectLabel.style.top = '0';
		this.canvasObjectLabel.style.width = "100%";
		this.canvasObjectLabel.style.height = '100%';
		this.canvasObjectLabel.style.position = "absolute";
		this.canvasObjectLabel.style.opacity = 1.0;
		this.canvasObjectLabel.style.backgroundColor = 'transparent';
		this.canvasObjectLabel.style.pointerEvents = 'none';

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

		var parent = this.isCesiumGlobe() ? magoDiv.getElementsByClassName('cesium-viewer')[0] : magoDiv;
		parent.appendChild(this.canvasObjectLabel);
	}
	
	return this.canvasObjectLabel;
};

/**
 * Draw building names on scene.
 * @private
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
		//screenCoord = this.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord);
		screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, worldPosition.x, worldPosition.y, worldPosition.z, screenCoord, this);
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
 * 데이터 표출 컨디션 설정
 * @param {string} projectId required.
 * @param {string} dataKey option. 키 존재 시 해당 노드만 컨디션 들어감.
 * @param {function} condition required.
 * 
 * @private
 */
MagoManager.prototype.setRenderCondition = function(projectId, dataKey, condition) 
{
	if (!condition || typeof condition !== 'function') 
	{
		throw new Error('renderCondition is required.');
	}

	if (!projectId) 
	{
		throw new Error('projectId is required.');
	}
	if (!this.hierarchyManager.existProject(projectId)) 
	{
		throw new Error(projectId + ' project is not exist.');
	}

	var nodeMap = this.hierarchyManager.getNodesMap(projectId);
	if (!dataKey) 
	{
		for (var i in nodeMap) 
		{
			if (nodeMap.hasOwnProperty(i)) 
			{
				checkAndSetCondition(nodeMap[i], condition);
			}
		}
	}
	else 
	{
		checkAndSetCondition(nodeMap[dataKey], condition);
	}
	
	function checkAndSetCondition(node, cond)
	{
		if (node instanceof Node && node.data.attributes.isPhysical) 
		{
			node.setRenderCondition(cond);
		}
	}
};


/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * 
 * @private
 */
MagoManager.prototype.createDefaultShaders = function (gl) 
{
	var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	var glVersion = gl.getParameter(gl.VERSION);
	
	if (!this.isCesiumGlobe())
	{
		var supportEXT = gl.getSupportedExtensions().indexOf("EXT_frag_depth");
		if (supportEXT > -1)
		{
			gl.getExtension("EXT_frag_depth");
		}
		this.EXTENSIONS_init = true;
		use_linearOrLogarithmicDepth = "USE_LOGARITHMIC_DEPTH";

		this.postFxShadersManager.bUseLogarithmicDepth = true;
	}

	this.postFxShadersManager.bUseMultiRenderTarget = false;
	var supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
	if (supportEXT > -1)
	{
		var extbuffers = gl.getExtension("WEBGL_draw_buffers");
		this.postFxShadersManager.bUseMultiRenderTarget = true;
		use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}

	var userAgent = window.navigator.userAgent;
	var isIE = userAgent.indexOf('Trident') > -1;
	if (isIE) 
	{
		use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
		this.postFxShadersManager.bUseLogarithmicDepth = false;	
	}

	// here creates the necessary shaders for mago3d.***
	// 0.0) gBuffer Shader.********************************************************************************************
	var shaderName = "gBuffer";
	var ssao_vs_source = ShaderSource.GBufferVS;
	var ssao_fs_source = ShaderSource.GBufferFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	// 0.1) lBuffer Shader.********************************************************************************************
	var shaderName = "lBuffer";
	var ssao_vs_source = ShaderSource.LBufferVS;
	var ssao_fs_source = ShaderSource.LBufferFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.bApplyShadows_loc = gl.getUniformLocation(shader.program, "bApplyShadows");
	shader.lightDirWC_loc = gl.getUniformLocation(shader.program, "lightDirWC");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.uLightColorAndBrightness_loc = gl.getUniformLocation(shader.program, "uLightColorAndBrightness");
	shader.ModelViewProjectionMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.buildingRotMatrixInv_loc = gl.getUniformLocation(shader.program, "buildingRotMatrixInv");
	shader.u_processType_loc = gl.getUniformLocation(shader.program, "u_processType");

	shader.uLightParameters_loc = gl.getUniformLocation(shader.program, "uLightParameters");// 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.
	shader.uLightIntensity_loc = gl.getUniformLocation(shader.program, "uLightIntensity");

	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	shader.light_depthCubeMap_loc = gl.getUniformLocation(shader.program, "light_depthCubeMap");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.light_depthCubeMap_loc, 2);

	// 0.2) ScreenQuad shader.***********************************************************************************
	var shaderName = "screenQuad";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuadFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.ssaoTex_loc = gl.getUniformLocation(shader.program, "ssaoTex");
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	shader.albedoTex_loc = gl.getUniformLocation(shader.program, "albedoTex");
	shader.silhouetteDepthTex_loc = gl.getUniformLocation(shader.program, "silhouetteDepthTex");
	shader.diffuseLightTex_loc = gl.getUniformLocation(shader.program, "diffuseLightTex");
	shader.specularLightTex_loc = gl.getUniformLocation(shader.program, "specularLightTex");
	//diffuseLightTex; 
	//specularLightTex; 
	//albedoTex
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.ssaoTex_loc, 5);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.albedoTex_loc, 2);
	gl.uniform1i(shader.diffuseLightTex_loc, 6);
	gl.uniform1i(shader.specularLightTex_loc, 7);
	gl.uniform1i(shader.silhouetteDepthTex_loc, 8);
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uSceneDayNightLightingFactor_loc = gl.getUniformLocation(shader.program, "uSceneDayNightLightingFactor");
	shader.uAmbientLight_loc = gl.getUniformLocation(shader.program, "uAmbientLight");

	// 0.2) ScreenQuad shader.***********************************************************************************
	var shaderName = "screenCopyQuad";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenCopyQuadFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_GL_EXT_FRAGDEPTH%/g, "USE_GL_EXT_FRAGDEPTH"); // only in this shader use extension GL_EXT_frag_depth.
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.ssaoTex_loc = gl.getUniformLocation(shader.program, "ssaoTex");
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	shader.albedoTex_loc = gl.getUniformLocation(shader.program, "albedoTex");
	shader.silhouetteDepthTex_loc = gl.getUniformLocation(shader.program, "silhouetteDepthTex");
	shader.diffuseLightTex_loc = gl.getUniformLocation(shader.program, "diffuseLightTex");
	shader.specularLightTex_loc = gl.getUniformLocation(shader.program, "specularLightTex");
	//diffuseLightTex; 
	//specularLightTex; 
	//albedoTex
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.ssaoTex_loc, 5);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.albedoTex_loc, 2);
	gl.uniform1i(shader.diffuseLightTex_loc, 6);
	gl.uniform1i(shader.specularLightTex_loc, 7);
	gl.uniform1i(shader.silhouetteDepthTex_loc, 8);
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");

	// 0.2) ScreenQuad shader.***********************************************************************************
	var shaderName = "screenQuad2";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuad2FS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.lightFogTex_loc = gl.getUniformLocation(shader.program, "lightFogTex");
	shader.screenSpaceObjectsTex_loc = gl.getUniformLocation(shader.program, "screenSpaceObjectsTex");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.lightFogTex_loc, 0);
	gl.uniform1i(shader.screenSpaceObjectsTex_loc, 1);

	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uSceneDayNightLightingFactor_loc = gl.getUniformLocation(shader.program, "uSceneDayNightLightingFactor");
	shader.u_activeTex_loc = gl.getUniformLocation(shader.program, "u_activeTex");

	// 1) ModelReferences ssaoShader.******************************************************************************
	var shaderName = "modelRefSsao";
	var ssao_vs_source = ShaderSource.ModelRefSsaoVS;
	var ssao_fs_source = ShaderSource.ModelRefSsaoFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uModelOpacity_loc = gl.getUniformLocation(shader.program, "uModelOpacity");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	// 1.1) ModelReferences depthShader.******************************************************************************
	var shaderName = "modelRefDepth";
	var showDepth_vs_source = ShaderSource.RenderShowDepthVS;
	var showDepth_fs_source = ShaderSource.RenderShowDepthFS;
	showDepth_fs_source = showDepth_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	showDepth_fs_source = showDepth_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");

	shader.mvpRelToEyeMatrix_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.mvRelToEyeMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.normalMatrix_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.encodedCameraPositionMCHigh_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.encodedCameraPositionMCLow_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");

	// 2) ModelReferences colorCoding shader.***********************************************************************
	var shaderName = "modelRefColorCoding";
	var showDepth_vs_source = ShaderSource.ColorSelectionSsaoVS;
	var showDepth_fs_source = ShaderSource.ColorSelectionSsaoFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this);
	
	// 3) TinTerrain shader.****************************************************************************************
	shaderName = "tinTerrain";
	ssao_vs_source = ShaderSource.TinTerrainVS;
	ssao_fs_source = ShaderSource.TinTerrainFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	shader.bExistAltitudes_loc = gl.getUniformLocation(shader.program, "bExistAltitudes");
	shader.uMinMaxAltitudes_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudes");
	shader.uTileDepth_loc = gl.getUniformLocation(shader.program, "uTileDepth");
	shader.altitude_loc = gl.getAttribLocation(shader.program, "altitude");
	shader.uSeaOrTerrainType_loc = gl.getUniformLocation(shader.program, "uSeaOrTerrainType");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.bApplyCaustics_loc = gl.getUniformLocation(shader.program, "bApplyCaustics");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");

	shader.uTileGeoExtent_loc = gl.getUniformLocation(shader.program, "uTileGeoExtent");
	shader.uGeoRectangles_loc = gl.getUniformLocation(shader.program, "uGeoRectangles");
	shader.uGeoRectanglesCount_loc = gl.getUniformLocation(shader.program, "uGeoRectanglesCount");

	shader.uTileGeoExtent_loc = gl.getUniformLocation(shader.program, "uTileGeoExtent");
	shader.uTileDepthOfBindedTextures_loc = gl.getUniformLocation(shader.program, "uTileDepthOfBindedTextures");
	shader.uTileGeoExtentOfBindedTextures_loc = gl.getUniformLocation(shader.program, "uTileGeoExtentOfBindedTextures");

	shader.uDebug_texCorrectionFactor_loc = gl.getUniformLocation(shader.program, "uDebug_texCorrectionFactor");
	
	shader.uActiveTextures_loc = gl.getUniformLocation(shader.program, "uActiveTextures");
	shader.externalAlphasArray_loc = gl.getUniformLocation(shader.program, "externalAlphasArray");

	var uniformLocation;
	var uniformDataPair;
	
	// reassign samplers2d locations.
	//uniformDataPair = shader.getUniformDataPair("shadowMapTex");
	//uniformDataPair.intValue = 0; // reassign.***
	
	//uniformDataPair = shader.getUniformDataPair("shadowMapTex2");
	//uniformDataPair.intValue = 1; // reassign.***
	
	uniformDataPair = shader.getUniformDataPair("diffuseTex");
	uniformDataPair.intValue = 2; // reassign.***
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_1");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_1");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 3;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_2");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_2");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 4;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_3");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_3");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 5;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_4");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_4");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 6;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_5");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_5");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 7;
	}
	
	
	// 3.1) TinTerrain Altitudes shader.****************************************************************************************
	shaderName = "tinTerrainAltitudes";
	ssao_vs_source = ShaderSource.TinTerrainAltitudesVS;
	ssao_fs_source = ShaderSource.TinTerrainAltitudesFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	//shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	//shader.bExistAltitudes_loc = gl.getUniformLocation(shader.program, "bExistAltitudes");
	//shader.altitude_loc = gl.getAttribLocation(shader.program, "altitude");
	
	// 4) PointsCloud shader.****************************************************************************************
	shaderName = "pointsCloud";
	ssao_vs_source = ShaderSource.PointCloudVS;
	ssao_fs_source = ShaderSource.PointCloudFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.uStrokeColor_loc = gl.getUniformLocation(shader.program, "uStrokeColor");
	shader.uStrokeSize_loc = gl.getUniformLocation(shader.program, "uStrokeSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");

	// 5) Test Quad shader.****************************************************************************************
	shaderName = "testQuad"; // used by temperatura layer.***
	ssao_vs_source = ShaderSource.Test_QuadVS;
	ssao_fs_source = ShaderSource.Test_QuadFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 6) Filter silhouette shader.*************************************************************************************
	shaderName = "filterSilhouette"; 
	ssao_vs_source = ShaderSource.wgs84_volumVS; // simple screen quad v-shader.***
	ssao_fs_source = ShaderSource.filterSilhouetteFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 7) PointsCloud Depth shader.****************************************************************************************
	shaderName = "pointsCloudDepth";
	ssao_vs_source = ShaderSource.PointCloudDepthVS;
	ssao_fs_source = ShaderSource.PointCloudDepthFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");

	// 8) PointsCloud shader.****************************************************************************************
	shaderName = "pointsCloudSsao";
	ssao_vs_source = ShaderSource.PointCloudVS;
	ssao_fs_source = ShaderSource.PointCloudSsaoFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.normalTex_loc, 6);
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");

	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	// 9) PointsCloud shader RAINBOW.****************************************************************************************
	shaderName = "pointsCloudSsao_rainbow";
	ssao_vs_source = ShaderSource.PointCloudVS_rainbow;
	ssao_fs_source = ShaderSource.PointCloudSsaoFS_rainbow;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.bUseColorCodingByHeight_loc = gl.getUniformLocation(shader.program, "bUseColorCodingByHeight");
	shader.minHeight_rainbow_loc = gl.getUniformLocation(shader.program, "minHeight_rainbow");
	shader.maxHeight_rainbow_loc = gl.getUniformLocation(shader.program, "maxHeight_rainbow");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	
	// 10) Atmosphere shader.****************************************************************************************
	shaderName = "atmosphere";
	ssao_vs_source = ShaderSource.atmosphereVS;
	ssao_fs_source = ShaderSource.atmosphereFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	shader.equatorialRadius_loc = gl.getUniformLocation(shader.program, "equatorialRadius");
	// Note: for the atmosphere, change the modelViewProjectionRelToEyeMatrix.
	var uniformDataPair = shader.getUniformDataPair("mvpMat4RelToEye");
	uniformDataPair.matrix4fv = this.sceneState.modelViewProjRelToEyeMatrixSky._floatArrays;
	
	// 11) ImageViewerRectangle Shader.******************************************************************************
	var shaderName = "imageViewerRectangle";
	var ssao_vs_source = ShaderSource.ImageViewerRectangleShaderVS;
	var ssao_fs_source = ShaderSource.ImageViewerRectangleShaderFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);

	// 12) OrthogonalDepth Shader.******************************************************************************
	var shaderName = "orthogonalDepth";
	var ssao_vs_source = ShaderSource.OrthogonalDepthShaderVS;
	var ssao_fs_source = ShaderSource.OrthogonalDepthShaderFS;
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// OrthogonalShader locations.***
	shader.modelViewProjectionMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.encodedCameraPositionMCHigh_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.encodedCameraPositionMCLow_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	
	// 13) ThickLine Shader.******************************************************************************
	var shaderName = "thickLine";
	var ssao_vs_source = ShaderSource.thickLineVS;
	var ssao_fs_source = ShaderSource.thickLineFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;

	// 13) ThickLine Shader.******************************************************************************
	var shaderName = "windStreamThickLine";
	var ssao_vs_source = ShaderSource.windStreamThickLineVS;
	var ssao_fs_source = ShaderSource.windStreamThickLineFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uElemIndex_loc = gl.getUniformLocation(shader.program, "uElemIndex");
	shader.uTotalPointsCount_loc = gl.getUniformLocation(shader.program, "uTotalPointsCount");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	gl.bindAttribLocation(shader.program, 4, "index");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;
	shader.index_loc = 4;

	// 13) ThickLine Shader.******************************************************************************
	var shaderName = "thickLineDepth";
	var ssao_vs_source = ShaderSource.thickLineDepthVS;
	var ssao_fs_source = ShaderSource.PointCloudDepthFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;

	// 13) ThickLine Shader.******************************************************************************
	var shaderName = "thickLineExtruded";
	var ssao_vs_source = ShaderSource.thickLineExtrudedVS;
	var ssao_fs_source = ShaderSource.thickLineFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;
	
	
	
	// 15) Pin shader.******************************************************************************************
	var shaderName = "pin";
	var ssao_vs_source = ShaderSource.PngImageVS;
	var ssao_fs_source = ShaderSource.PngImageFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.position4_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.scale2d_loc = gl.getUniformLocation(shader.program, "scale2d");
	shader.size2d_loc = gl.getUniformLocation(shader.program, "size2d");
	shader.imageSize_loc = gl.getUniformLocation(shader.program, "imageSize");
	shader.bUseOriginalImageSize_loc = gl.getUniformLocation(shader.program, "bUseOriginalImageSize");
	shader.aditionalOffset_loc = gl.getUniformLocation(shader.program, "aditionalOffset");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	// TexturesMerger shader.******************************************************************************************
	var shaderName = "texturesMerger";
	var ssao_vs_source = ShaderSource.texturesMergerVS;
	var ssao_fs_source = ShaderSource.texturesMergerFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.position2_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.uActiveTextures_loc = gl.getUniformLocation(shader.program, "uActiveTextures");
	shader.externalAlphasArray_loc = gl.getUniformLocation(shader.program, "externalAlphasArray");
	shader.uExternalTexCoordsArray_loc = gl.getUniformLocation(shader.program, "uExternalTexCoordsArray");
	shader.uMinMaxAltitudes_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudes");
	shader.uMinMaxAltitudesBathymetryToGradient_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudesBathymetryToGradient");
	shader.uGradientSteps_loc = gl.getUniformLocation(shader.program, "uGradientSteps");
	shader.uGradientStepsCount_loc = gl.getUniformLocation(shader.program, "uGradientStepsCount");
	shader.tex_0_loc = gl.getUniformLocation(shader.program, "texture_0");
	shader.tex_1_loc = gl.getUniformLocation(shader.program, "texture_1");
	shader.tex_2_loc = gl.getUniformLocation(shader.program, "texture_2");
	shader.tex_3_loc = gl.getUniformLocation(shader.program, "texture_3");
	shader.tex_4_loc = gl.getUniformLocation(shader.program, "texture_4");
	shader.tex_5_loc = gl.getUniformLocation(shader.program, "texture_5");
	shader.tex_6_loc = gl.getUniformLocation(shader.program, "texture_6");
	shader.tex_7_loc = gl.getUniformLocation(shader.program, "texture_7");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.tex_0_loc, 0);
	gl.uniform1i(shader.tex_1_loc, 1);
	gl.uniform1i(shader.tex_2_loc, 2);
	gl.uniform1i(shader.tex_3_loc, 3);
	gl.uniform1i(shader.tex_4_loc, 4);
	gl.uniform1i(shader.tex_5_loc, 5);
	gl.uniform1i(shader.tex_6_loc, 6);
	gl.uniform1i(shader.tex_7_loc, 7);

	// TexturesMerger shader.******************************************************************************************
	var shaderName = "rectangleScreen";
	var ssao_vs_source = ShaderSource.rectangleScreenVS;
	var ssao_fs_source = ShaderSource.rectangleScreenFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.position2_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "a_nor");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "a_tex");
	shader.tex_0_loc = gl.getUniformLocation(shader.program, "texture_0");
	shader.texture_cube_loc = gl.getUniformLocation(shader.program, "texture_cube");
	shader.uTextureType_loc = gl.getUniformLocation(shader.program, "uTextureType");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.tex_0_loc, 0);
	gl.uniform1i(shader.texture_cube_loc, 1);


	/*
	// TexturesMerger shader.******************************************************************************************
	var shaderName = "depthTexturesMerger";
	var ssao_vs_source = ShaderSource.texturesMergerVS;
	var ssao_fs_source = ShaderSource.depthTexturesMergerFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.position2_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.uNumFrustums_loc = gl.getUniformLocation(shader.program, "uNumFrustums");
	shader.depthTexture_0_loc = gl.getUniformLocation(shader.program, "depthTexture_0");
	shader.normalTexture_0_loc = gl.getUniformLocation(shader.program, "normalTexture_0");
	shader.depthTexture_1_loc = gl.getUniformLocation(shader.program, "depthTexture_1");
	shader.normalTexture_1_loc = gl.getUniformLocation(shader.program, "normalTexture_1");
	shader.depthTexture_2_loc = gl.getUniformLocation(shader.program, "depthTexture_2");
	shader.normalTexture_2_loc = gl.getUniformLocation(shader.program, "normalTexture_2");
	shader.depthTexture_3_loc = gl.getUniformLocation(shader.program, "depthTexture_3");
	shader.normalTexture_3_loc = gl.getUniformLocation(shader.program, "normalTexture_3");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.depthTexture_0_loc, 0);
	gl.uniform1i(shader.normalTexture_0_loc, 1);
	gl.uniform1i(shader.depthTexture_1_loc, 2);
	gl.uniform1i(shader.normalTexture_1_loc, 3);
	gl.uniform1i(shader.depthTexture_2_loc, 4);
	gl.uniform1i(shader.normalTexture_2_loc, 5);
	gl.uniform1i(shader.depthTexture_3_loc, 6);
	gl.uniform1i(shader.normalTexture_3_loc, 7);
	*/
	
	// ssaoFromDepth shader.***********************************************************************************
	var shaderName = "ssaoFromDepth";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ssaoFromDepthFS;
	var shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uNumFrustums_loc = gl.getUniformLocation(shader.program, "uNumFrustums");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");

	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	this.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.depthTex_loc, 0);
	gl.uniform1i(shader.noiseTex_loc, 1);
	gl.uniform1i(shader.normalTex_loc, 3);
	
	// 13) ThickLine clampToTerrain shader.******************************************************************************
	var shaderName = "thickLineClampToTerrain";
	var ssao_vs_source = ShaderSource.vectorMeshClampToTerrainVS;
	var ssao_fs_source = ShaderSource.vectorMeshClampToTerrainFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	shader = this.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;

	// 1.1) GroundStencilPrimitives.******************************************************************************
	var shaderName = "groundStencilPrimitives";
	var showDepth_vs_source = ShaderSource.GroundStencilPrimitivesVS;
	var showDepth_fs_source = ShaderSource.GroundStencilPrimitivesFS;
	showDepth_fs_source = showDepth_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	shader = this.postFxShadersManager.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
};

/**
 * 카메라 영역에 벗어난 오브젝트의 렌더링은 비 활성화
 * @private
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
 * @private
 */
MagoManager.prototype.doMultiFrustumCullingSmartTiles = function(camera) 
{
	// Here uses a frustum that is the sum of all frustums.***
	var frustumVolume = this.myCameraSCX.bigFrustum;
	
	// This makes the visible buildings array.
	var smartTile1 = this.smartTileManager.tilesArray[0]; // America side tile.
	var smartTile2 = this.smartTileManager.tilesArray[1]; // Asia side tile.
	
	if (this.intersectedTilesArray === undefined)
	{ this.intersectedTilesArray = []; }
	
	if (this.lastIntersectedLowestTilesArray === undefined)
	{ this.lastIntersectedLowestTilesArray = []; }
	
	// save the last frustumCulled lowestTiles to delete if necessary.
	this.lastIntersectedLowestTilesArray = this.intersectedTilesArray;
	this.intersectedTilesArray = [];
	
	// mark all last_tiles as "no visible".
	var lastLowestTilesCount = this.lastIntersectedLowestTilesArray.length;
	var lowestTile;
	for (var i=0; i<lastLowestTilesCount; i++)
	{
		lowestTile = this.lastIntersectedLowestTilesArray[i];
		lowestTile.isVisible = false;
	}
	
	// do frustum culling for Asia_side_tile and America_side_tile.
	var maxDistToCamera = 5000;
	smartTile1.getFrustumIntersectedLowestTiles(camera, frustumVolume, this.intersectedTilesArray, maxDistToCamera);
	smartTile2.getFrustumIntersectedLowestTiles(camera, frustumVolume, this.intersectedTilesArray, maxDistToCamera);
	
	
	// Now, store the culled tiles into corresponding frustums, and mark all current_tiles as "visible".***
	this.frustumVolumeControl.initArrays(); // init.***
	var frustumsCount = this.myCameraSCX.frustumsArray.length;
	var frustum;
	var lowestTile;
	var currentLowestTilesCount = this.intersectedTilesArray.length;
	for (var i=0; i<currentLowestTilesCount; i++)
	{
		lowestTile = this.intersectedTilesArray[i];
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
	
		// Now, if the "lowestOctree" is inside of deletingQueue, then erase from deletingQueue.
		this.processQueue.eraseSmartTileToDelete(lowestTile);
	
		lowestTile.isVisible = true;
		for (var j=frustumsCount-1; j>= 0 ; j--)
		{
			frustum = this.myCameraSCX.frustumsArray[j];
			if (frustum.intersectionNearFarSphere(lowestTile.sphereExtent) !== Constant.INTERSECTION_OUTSIDE)
			{
				var frustumVolumeControlObject = this.frustumVolumeControl.getFrustumVolumeCulling(j); 
				frustumVolumeControlObject.intersectedTilesArray.push(lowestTile);
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
			//if (lowestTile.distToCamera > 2000)
			{ 
				//this.processQueue.putNodesArrayToDelete(lowestTile.nodesArray); 
				this.processQueue.putSmartTileToDelete(lowestTile, 0);
				///lowestTile.clearNodesArray();
			}
			
		}
	}
	
	this.lastIntersectedLowestTilesArray.length = 0;
	
	
	// TinTerranTiles.*************************************************************************
	// Provisionally:
	if (this.tinTerrainManager !== undefined && this.tinTerrainManager.ready)
	{ 
		this.tinTerrainManager.doFrustumCulling(frustumVolume, camera, this); 
	}
};

/**
 * dataKey 이용해서 data 검색
 * @param dataKey
 * @private
 */
MagoManager.prototype.tilesMultiFrustumCullingFinished = function (intersectedLowestTilesArray, visibleNodes, cameraPosition, frustumVolume) 
{
	var tilesCount = intersectedLowestTilesArray.length;
	
	if (tilesCount === 0)
	{ return; }
	
	var distToCamera;
	var magoPolicy = this.magoPolicy;
	
	var lowestTile;
	var neoBuilding;
	var node;
	var nodeRoot;
	var geoLoc;
	
	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }

	var frustumFar = magoPolicy.getFrustumFarDistance();
	var doFrustumCullingToBuildings = false;

	for (var i=0; i<tilesCount; i++)
	{
		lowestTile = intersectedLowestTilesArray[i];
		
		if (lowestTile.sphereExtent === undefined)
		{ continue; }
	
		distToCamera = cameraPosition.distToSphere(lowestTile.sphereExtent);
		if (lowestTile.intersectionType === Constant.INTERSECTION_INSIDE)
		{
			doFrustumCullingToBuildings = false;
		}
		else 
		{
			doFrustumCullingToBuildings = true;
		}

		// Check the smartTile state: (1- is all updated), (2- need make geometries from objectsSeeds).
		if (lowestTile.nodesArray && lowestTile.nodesArray.length > 0)
		{
			// the neoBuildings are made.
			var nodesCount = lowestTile.nodesArray.length;
			for (var j=0; j<nodesCount; j++)
			{
				// determine LOD for each building.
				node = lowestTile.nodesArray[j];
				nodeRoot = node.getRoot();

				var data = node.data;				
				neoBuilding = node.data.neoBuilding;
				if (neoBuilding === undefined) // attributes.isReference === true
				{
					// This node is a reference node.***
					visibleNodes.currentVisiblesToPrepare.push(node);
					continue;
				}

				if(neoBuilding.headerDataArrayBuffer && neoBuilding.metaData !== undefined && neoBuilding.metaData.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED) 
				{
					neoBuilding.metaData.parseFileHeaderAsimetricVersion(neoBuilding.headerDataArrayBuffer, 0);
				}

				//check if parsed header.***
				if (neoBuilding.metaData !== undefined && neoBuilding.metaData.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
				{
					visibleNodes.currentVisiblesToPrepare.push(node);
					continue;
				}

				// now, create a geoLocDataManager for node if no exist.
				if (nodeRoot.data.geoLocDataManager === undefined)
				{
					geoLoc = node.calculateGeoLocData(this);
					continue;
				}

				distToCamera = node.getDistToCamera(cameraPosition, this.boundingSphere_Aux);
				var lodByDist = magoPolicy.getLod(distToCamera);
				
				// Set the current LOD of node.
				data.distToCam = distToCamera;
				data.currentLod = magoPolicy.getLod(data.distToCam);
				
				
				if (distToCamera > frustumFar)// || distToCamera > 1500)
				{ 
					// put this node to delete into queue.***
					//this.processQueue.putNodeToDelete(node, 0);
					continue; 
				}
				
				// If necessary do frustum culling.**********************************************************
				if (doFrustumCullingToBuildings)
				{
					var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
					// intersect with Frustum
					if (frustumCull === Constant.INTERSECTION_OUTSIDE) 
					{
						// put this node to delete into queue.***
						////this.processQueue.putNodeToDeleteModelReferences(node, 0);
						//this.processQueue.putNodeToDeleteLessThanLod3(node, 0);
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
					visibleNodes.putNodeByLod(node, lodByDist);
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
						// 4, 5 = pointsCloud data type.***
						// 10 = tree data type.***
						visibleNodes.putNodeToArraySortedByDist(visibleNodes.currentVisiblesAux, node);
					}
					// end provisional test.-----------------------------
					else
					{
						//when projectsType 10 and near, prepare model and ref data, ignore lod. 
						if(projectsType === 10 && distToCamera < 1500) {
							visibleNodes.putNodeByProjectType(node);
						}

						visibleNodes.putNodeByLod(node, lodByDist);						
					}
				}
			}
		}
		
		// Check native objects.
		var currVisibleNativeObjects = visibleNodes.currentVisibleNativeObjects;
		var nativeObjects = lowestTile.nativeObjects;

		// native opaques & transparents.
		var nativeObjectsCount = nativeObjects.generalObjectsArray.length;
		for(var j=0; j<nativeObjectsCount; j++)
		{
			var native = nativeObjects.generalObjectsArray[j];
			this.boundingSphere_Aux = native.getBoundingSphereWC(this.boundingSphere_Aux);

			var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
			// intersect with Frustum
			if (frustumCull !== Constant.INTERSECTION_OUTSIDE) 
			{
				if(native.isOpaque())
				{ currVisibleNativeObjects.opaquesArray.push(native);}
				else
				{
					currVisibleNativeObjects.transparentsArray.push(native);
				}
			}
		}

		// native excavations.
		nativeObjectsCount = nativeObjects.excavationsArray.length;
		for(var j=0; j<nativeObjectsCount; j++)
		{
			var native = nativeObjects.excavationsArray[j];
			this.boundingSphere_Aux = native.getBoundingSphereWC(this.boundingSphere_Aux);

			var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
			// intersect with Frustum
			if (frustumCull !== Constant.INTERSECTION_OUTSIDE) 
			{
				currVisibleNativeObjects.excavationsArray.push(native);
			}
		}

		// native vectorType objects.
		nativeObjectsCount = nativeObjects.vectorTypeArray.length;
		for(var j=0; j<nativeObjectsCount; j++)
		{
			var native = nativeObjects.vectorTypeArray[j];
			this.boundingSphere_Aux = native.getBoundingSphereWC(this.boundingSphere_Aux);

			var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
			// intersect with Frustum
			if (frustumCull !== Constant.INTERSECTION_OUTSIDE) 
			{
				currVisibleNativeObjects.vectorTypeArray.push(native);
			}
		}

		// native lightSources.
		nativeObjectsCount = nativeObjects.lightSourcesArray.length;
		for(var j=0; j<nativeObjectsCount; j++)
		{
			var native = nativeObjects.lightSourcesArray[j];
			this.boundingSphere_Aux = native.getBoundingSphereWC(this.boundingSphere_Aux);

			var frustumCull = frustumVolume.intersectionSphere(this.boundingSphere_Aux); // cesium.***
			// intersect with Frustum
			if (frustumCull !== Constant.INTERSECTION_OUTSIDE) 
			{
				currVisibleNativeObjects.lightSourcesArray.push(native);
			}
		}
		
		//Array.prototype.push.apply(currVisibleNativeObjects.opaquesArray, nativeObjects.opaquesArray);
		//Array.prototype.push.apply(currVisibleNativeObjects.transparentsArray, nativeObjects.transparentsArray);
		//Array.prototype.push.apply(currVisibleNativeObjects.excavationsArray, nativeObjects.excavationsArray);
		//Array.prototype.push.apply(currVisibleNativeObjects.vectorTypeArray, nativeObjects.vectorTypeArray);
		if (nativeObjects.pointTypeArray)
		{ Array.prototype.push.apply(currVisibleNativeObjects.pointTypeArray, nativeObjects.pointTypeArray); }

		if (lowestTile.isNeededToCreateGeometriesFromSeeds())
		{
			lowestTile.createGeometriesFromSeeds(this);
		}
	}
};

/**
 * @private
 */
MagoManager.prototype.flyToTopology = function(worldPoint3d, duration) 
{
	if (this.isCesiumGlobe()) 
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
	else if (MagoConfig.getPolicy().basicGlobe === Constant.WORLDWIND)
	{
		this.wwd.goToAnimator.travelTime = duration * 1000;
		this.wwd.goTo(new WorldWind.Position(parseFloat(latitude), parseFloat(longitude), parseFloat(altitude) + 50));
	}
	else if (MagoConfig.getPolicy().basicGlobe === Constant.MAGOWORLD)
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
	if (this.isCesiumGlobe()) 
	{
		this.scene.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(parseFloat(longitude),
				parseFloat(latitude),
				parseFloat(altitude)),
			duration: parseInt(duration)
		});
	}
	else/* if (MagoConfig.getPolicy().basicGlobe === Constant.MAGOWORLD)*/
	{
		this.magoWorld.goto(parseFloat(longitude),
			parseFloat(latitude),
			parseFloat(altitude),
			parseInt(duration));
	}
};
/**
 * 주어진 3차원 점을 포함하는 영역으로 이동
 * @param {Point3D} pointsArray 3차원 점
 */
MagoManager.prototype.flyToBox = function(pointsArray) 
{
	var bbox = new BoundingBox();
	bbox.init(pointsArray[0]);
	bbox.addPoint(pointsArray[1]);

	this.boundingSphere_Aux = new Sphere();
	this.boundingSphere_Aux.radius = bbox.getRadiusAprox();
	
	if (this.isCesiumGlobe())
	{
		var bboxCenterPoint = bbox.getCenterPoint();
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone({x: bboxCenterPoint.x, y: bboxCenterPoint.y, z: bboxCenterPoint.z});
		var seconds = 3;
		this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, {duration: seconds});
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
		apiResultCallback( this.config.getPolicy().geo_callback_apiresult, apiName, "-1");
		return; 
	}
	
	var nodeRoot = node.getRoot();
	var geoLocDataManager = nodeRoot.data.geoLocDataManager;
	var geoLoc;
	if (geoLocDataManager === undefined)
	{ 
		geoLoc = node.calculateGeoLocData(this);
		if (geoLoc === undefined)
		{
			apiResultCallback( this.config.getPolicy().geo_callback_apiresult, apiName, "-1");
			return; 
		}
	}
	geoLocDataManager = nodeRoot.data.geoLocDataManager;
	geoLoc = geoLocDataManager.getCurrentGeoLocationData();
	var realBuildingPos = node.getBBoxCenterPositionWorldCoord(geoLoc);

	if (realBuildingPos === undefined)
	{ return; }

	if (!nodeRoot.data.bbox)
	{ return; }
	this.radiusAprox_aux = nodeRoot.data.bbox.getRadiusAprox();

	if (this.boundingSphere_Aux === undefined)
	{ this.boundingSphere_Aux = new Sphere(); }
	
	this.boundingSphere_Aux.radius = this.radiusAprox_aux;

	if (this.isCesiumGlobe())
	{
		this.boundingSphere_Aux.center = Cesium.Cartesian3.clone(realBuildingPos);
		var seconds = 3;
		this.scene.camera.flyToBoundingSphere(this.boundingSphere_Aux, seconds);
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
 * @private
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

	if (this.config.getPolicy().geo_callback_enable === "true") 
	{
		//if (this.objMarkerSC === undefined) { return; }
		var objectId = null;
		var selectedObjtect = this.selectionManager.getSelectedF4dObject();
		if (selectedObjtect !== undefined) { objectId = selectedObjtect.objectId; }
		
		// click object 정보를 표시
		if (this.magoPolicy.getObjectInfoViewEnable()) 
		{
			selectedObjectCallback(		this.config.getPolicy().geo_callback_selectedobject,
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
			//if (this.objMarkerSC === undefined) { return; }
			
			insertIssueCallback(	this.config.getPolicy().geo_callback_insertissue,
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
 * @private
 */
MagoManager.prototype.changeLocationAndRotation = function(projectId, dataKey, latitude, longitude, elevation, heading, pitch, roll, animationOption) 
{
	var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
	if (node === undefined)
	{ return; }
	this.changeLocationAndRotationNode(node, latitude, longitude, elevation, heading, pitch, roll, animationOption);
};

/**
 * 변환 행렬
 * @private
 */
MagoManager.prototype.changeLocationAndRotationNode = function(node, latitude, longitude, elevation, heading, pitch, roll, animationOption) 
{
	if (node === undefined)
	{ return; }

	if (animationOption !== undefined)
	{
		if (this.animationManager === undefined)
		{ this.animationManager = new AnimationManager(); }
		this.animationManager.putNode(node);
		
		//For compatibility with lower versions, lower version parameter is duratiuon(number).
		node.changeLocationAndRotationAnimated(latitude, longitude, elevation, heading, pitch, roll, this, animationOption);
	}
	else 
	{
		node.changeLocationAndRotation(latitude, longitude, elevation, heading, pitch, roll, this);
	}
	
	var neoBuilding = node.data.neoBuilding;
	
	//this.selectedObjectNotice(neoBuilding);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param {string} projectId policy 사용 시 geo_data_default_projects 배열에 있는 값.
 * @param {string} projectDataFolder 해당 프로젝트의 data_key를 의미.
 */
MagoManager.prototype.getObjectIndexFile = function(projectId, projectDataFolder) 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = this.config.getPolicy();
	}
	
	//this.buildingSeedList = new BuildingSeedList();
	
	var geometrySubDataPath = projectDataFolder;
	var fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + new Date().getTime();
	this.readerWriter.getObjectIndexFileForSmartTile(fileName, this, undefined, projectId);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @param {string} projectId policy 사용 시 geo_data_default_projects 배열에 있는 값.
 * @param {Array<object> | object} f4dObject f4d data definition object
 */
MagoManager.prototype.getObjectIndexFileForData = function(projectId, f4dObject) 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = this.config.getPolicy();
	}
	
	var f4dGroupObject = this.config.getData(CODE.PROJECT_ID_PREFIX + projectId);
	var node = this.hierarchyManager.getNodeByDataKey(projectId, f4dGroupObject.dataGroupKey);

	var groupDataFolder = node.data.projectFolderName;
	groupDataFolder = groupDataFolder.replace(/\/+$/, '');
	var newDataKeys = [];
	var children = f4dGroupObject.children;
	// TODO :
	if (Array.isArray(f4dObject)) 
	{
		for (var i=0, len=f4dObject.length;i<len;i++) 
		{
			addChildrend(children, newDataKeys, f4dObject[i]);
		}
	}
	else 
	{
		addChildrend(children, newDataKeys, f4dObject);
	}
	
	var geometrySubDataPath = groupDataFolder;
	var fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + this.config.getPolicy().content_cache_version;
	this.readerWriter.getObjectIndexFileForData(fileName, this, projectId, newDataKeys, f4dObject);

	function addChildrend(childrenArray, dataKeyArray, child) {
		var metaInfo = child.metainfo;
		if (metaInfo && typeof metaInfo !== 'object')
		{
			metaInfo = JSON.parse(metaInfo);
		}
			
		var attributes = child.attributes || metaInfo;
		if (!attributes.isPhysical) 
		{
			throw new Error('f4d member must isPhysical true.'); 
		}
		child.groupDataFolder = groupDataFolder;
		var dataKey = child.data_key || child.dataKey;
		dataKeyArray.push(dataKey);
		childrenArray.push(f4dObject);
	}
};

/**
 * smartTile 의 object index 파일을 읽음
 * @param {string} projectId 프로젝트 고유번호
 * @param {string} projectDataFolder smartTile 의 위치
 */
MagoManager.prototype.getObjectIndexFileSmartTileF4d = function(projectDataFolder) 
{
	if (this.configInformation === undefined)
	{
		this.configInformation = this.config.getPolicy();
	}

	var geometrySubDataPath = projectDataFolder;
	var fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.TILE_INDEX_FILE;
	this.readerWriter.getObjectIndexFileSmartTileF4d(fileName, geometrySubDataPath, this);
};

/**
 * object index 파일을 읽어서 빌딩 개수, 포지션, 크기 정보를 배열에 저장
 * @private
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
	var label = undefined;

	if (jasonObject !== undefined)
	{
		if (!jasonObject.data_key) 
		{
			jasonObject.childrenCnt = jasonObject.children;
			var metaInfo = jasonObject.metainfo;
			if (metaInfo && typeof metaInfo === 'string')
			{
				metaInfo = JSON.parse(metaInfo);
			}
			jasonObject.attributes = jasonObject.attributes || metaInfo;
			
			if (!jasonObject.attributes)
			{
				jasonObject.attributes = {isPhysical: false};
			}

			jasonObject.children = jasonObject.datas;
			
			delete jasonObject.datas;
			
			data_group_id = jasonObject.dataGroupId;
			data_group_name = jasonObject.dataGroupName;
			data_id = jasonObject.dataId;
			data_key = jasonObject.dataKey || jasonObject.dataGroupKey; // folder name.
			data_name = jasonObject.dataName || jasonObject.dataGroupName;
			heading = jasonObject.heading;
			height = jasonObject.altitude;
			latitude = jasonObject.latitude;
			longitude = jasonObject.longitude;
			pitch = jasonObject.pitch;
			roll = jasonObject.roll;
			mapping_type = jasonObject.mappingType || 'origin';
			label = jasonObject.label;
		}
		else 
		{
			data_group_id = jasonObject.data_group_id;
			data_group_name = jasonObject.data_group_name;
			data_id = jasonObject.data_id;
			data_key = jasonObject.data_key; // folder name.
			data_name = jasonObject.data_name;
			heading = jasonObject.heading;
			height = jasonObject.height;
			latitude = jasonObject.latitude;
			longitude = jasonObject.longitude;
			pitch = jasonObject.pitch;
			roll = jasonObject.roll;
			mapping_type = jasonObject.mapping_type;
			label = jasonObject.label;
		}
		attributes = jasonObject.attributes;
		children = jasonObject.children;
	}

	if (heading === undefined)
	{ heading = 0; }

	if (pitch === undefined)
	{ pitch = 0; }

	if (roll === undefined)
	{ roll = 0; }

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
			attributes.objectType = "basicF4d";
			buildingId = data_key;
			node = this.hierarchyManager.newNode(buildingId, projectId, attributes);
			// set main data of the node.
			var data = node.data;
			var relativePath = attributes.relativePath;
			projectFolderName = (relativePath && relativePath.length > 0) ? projectFolderName + relativePath : projectFolderName;
			data.projectFolderName = projectFolderName;
			data.projectId = projectId;
			data.data_name = data_name;
			data.attributes = attributes;
			data.mapping_type = mapping_type;
			data.dataId = data_id;
			data.dataGroupId = data_group_id;
			var tMatrix;
			
			if (attributes.isPhysical)
			{
				// find the buildingSeed.
				if (buildingSeedMap instanceof BuildingSeedMap) 
				{
					buildingSeed = buildingSeedMap.getBuildingSeed(buildingId);
				}
				else 
				{
					buildingSeed = buildingSeedMap[buildingId];
				}
				
				if (buildingSeed)
				{
					data.buildingSeed = buildingSeed;
					resultPhysicalNodesArray.push(node);
				}

				if (!attributes.hasOwnProperty('heightReference') || !attributes.heightReference)
				{
					attributes.heightReference = HeightReference.NONE;
				}

				if(label)
				{
					attributes.label = label;
				}
				attributes.fromDate = new Date();
				attributes.toDate = new Date();
			}

			if (longitude && latitude)
			{
				// this is root node.
				if (height === undefined || height === null)
				{ height = 0; }
				if(attributes.heightReference === HeightReference.RELATIVE_TO_GROUND) {
					data.relativeHeight = height;
				} else {
					data.relativeHeight = 0;
				}
				
				data.geographicCoord = new GeographicCoord();
				data.geographicCoord.setLonLatAlt(longitude, latitude, height);
				
				if (data.rotationsDegree === undefined)
				{ data.rotationsDegree = new Point3D(); }
				data.rotationsDegree.set(pitch, roll, heading);
				
				
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
					
					// Set the altitude as the original. This method has little error.***
					buildingSeed.geographicCoordOfBBox.altitude = buildingSeed.geographicCoord.altitude;
					
				}
			}

			// now, calculate the bbox.***
			data.bbox = new BoundingBox();
			
			if (data.buildingSeed && data.buildingSeed.bBox)
			{ data.bbox.copyFrom(buildingSeed.bBox); }
			
			// calculate the geographicCoordOfTheBBox.***
			if (tMatrix !== undefined)
			{
				if (data.mapping_type.toLowerCase() === "origin")
				{
					bboxCenterPoint = data.bbox.getCenterPoint(bboxCenterPoint);
					var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
					data.bbox.geographicCoord = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, data.bbox.geographicCoord, this);
				}
				else if (data.mapping_type.toLowerCase() === "boundingboxcenter")
				{
					data.bbox.geographicCoord = new GeographicCoord();
					data.bbox.geographicCoord.setLonLatAlt(longitude, latitude, height);
				}
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
 * @private
 */
MagoManager.prototype.calculateBoundingBoxesNodes = function(projectId) 
{
	var node;
	var nodeRoot;
	var buildingSeed;
	var longitude, latitude, height;
	var heading, pitch, roll;
	
	var nodesMap = this.hierarchyManager.getNodesMap(projectId);
	// 1rst, calculate boundingBoxes of buildingSeeds of nodes.

	for (var key in nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(nodesMap, key))
		{
			node = nodesMap[key];
			if (node.data === undefined)
			{ continue; }
			
			buildingSeed = node.data.buildingSeed;
			if (buildingSeed)
			{
				nodeRoot = node.getClosestParentWithData("geographicCoord");
			
				longitude = nodeRoot.data.geographicCoord.longitude; 
				latitude = nodeRoot.data.geographicCoord.latitude; 
				height = nodeRoot.data.geographicCoord.altitude;
			
				heading = nodeRoot.data.rotationsDegree.z;
				pitch = nodeRoot.data.rotationsDegree.x;
				roll = nodeRoot.data.rotationsDegree.y;
			
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
				buildingSeed.geographicCoordOfBBox.setLonLatAlt(longitude, latitude, height);
			}
		}
	}
	
	
	// now, must calculate the bbox of the root nodes.
	var rootNodesArray = [];
	var nodesArray = [];
	this.hierarchyManager.getRootNodes(projectId, rootNodesArray); // original.***
	var bboxStarted = false;
	
	var rootNodesCount = rootNodesArray.length;
	for (var i=0; i<rootNodesCount; i++)
	{
		nodeRoot = rootNodesArray[i];
		
		nodesArray.length = 0; // init.***
		nodeRoot.extractNodesByDataName(nodesArray, "buildingSeed");
		// now, take nodes that is "isMain" = true.
		bboxStarted = false;
		var nodesCount =  nodesArray.length;
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
 * @private
 */
MagoManager.prototype.makeSmartTile = function(buildingSeedMap, projectId, f4dObjectJson, seedMap) 
{
	if (!buildingSeedMap && !seedMap) 
	{
		throw new Error('buildingSeedMap or seedMap is required'); 
	}
	//var realTimeLocBlocksList = MagoConfig.getData().alldata; // original.***
	// "projectId" = json file name.
	var realTimeLocBlocksList = f4dObjectJson || this.config.getData(CODE.PROJECT_ID_PREFIX + projectId);
	var buildingSeed;
	var buildingId;
	var newLocation;

	// now, read all hierarchyJason and make the hierarchy tree.
	var physicalNodesArray = []; // put here the nodes that has geometry data.
	// make a buildingSeedMap.
	/*var buildingSeedMap = seedMap || {};
	var buildingSeedMapLength = Object.keys(buildingSeedMap).length;
	if (buildingSeedMapLength === 0) 
	{
		var buildingSeedsCount = buildingSeedList.buildingSeedArray.length;
		for (var i=0; i<buildingSeedsCount; i++)
		{
			buildingSeed = buildingSeedList.buildingSeedArray[i];
			buildingId = buildingSeed.buildingId;
			buildingSeedMap[buildingId] = buildingSeed;
		}
	}*/
	
	var projectFolderName = getProjectFolderName(realTimeLocBlocksList);
	if (!Array.isArray(realTimeLocBlocksList)) 
	{
		this.makeNode(realTimeLocBlocksList, physicalNodesArray, buildingSeedMap, projectFolderName, projectId);
	}
	else 
	{
		for (var i=0, len=realTimeLocBlocksList.length;i<len;i++) 
		{
			var blocks = realTimeLocBlocksList[i];
			this.makeNode(blocks, physicalNodesArray, buildingSeedMap, projectFolderName, projectId);
		}
	}
	this.calculateBoundingBoxesNodes(projectId);
	

	var auxNodesArray = JSON.parse(JSON.stringify(physicalNodesArray));
	// now, make smartTiles.
	// there are 2 general smartTiles: AsiaSide & AmericaSide.
	// Now, separate physicalNodes by bbox size.
	var map_depth_physicalNodesArray = [];
	var nodesCount = physicalNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		var node = physicalNodesArray[i];
		var bbox = node.data.bbox;
		var bboxMaxSize = bbox.getMaxLength();
		var smartTileDepth = SmartTileManager.getDepthByBoundingBoxMaxSize(bboxMaxSize);

		if (map_depth_physicalNodesArray[smartTileDepth] === undefined)
		{ map_depth_physicalNodesArray[smartTileDepth] = []; }

		map_depth_physicalNodesArray[smartTileDepth].push(node);
	}

	for (var i = 0; i<22; i++)
	{
		if (map_depth_physicalNodesArray[i] && map_depth_physicalNodesArray[i].length > 0)
		{
			var targetDepth = i;
			this.smartTileManager.makeTreeByDepth(targetDepth, map_depth_physicalNodesArray[i], this);
		}
	}

	//var targetDepth = 15;
	//this.smartTileManager.makeTreeByDepth(targetDepth, physicalNodesArray, this);

	////this.buildingSeedList.buildingSeedArray.length = 0; // init.

	
	this.emit(MagoManager.EVENT_TYPE.F4DLOADEND, {
		type      : MagoManager.EVENT_TYPE.F4DLOADEND,
		f4d       : auxNodesArray,
		timestamp : new Date()
	});

	function getProjectFolderName(json) 
	{
		var folderName;
		var f4d = Array.isArray(json) ? json[0] : json;
		if (f4d.data_key) 
		{
			folderName = f4d.groupDataFolder || f4d.data_key;
		}
		else 
		{
			if (f4d.dataGroupPath) 
			{
				folderName = f4d.dataGroupPath;
				folderName = folderName.replace(/\/+$/, '');
			}
			else 
			{
				folderName = f4d.groupDataFolder;
			}
		}

		return folderName;
	}
};


/**
 * instantiate static model
 * @param {instantiateOption} attributes
 * @private
 */
MagoManager.prototype.instantiateStaticModel = function(attributes)
{
	if (!defined(attributes.projectId))
	{
		throw new Error('projectId is required.');
	}

	if (!this.isExistStaticModel(attributes.projectId))
	{
		throw new Error('static model is not exist.');
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

	if (!attributes.heightReference)
	{
		attributes.heightReference = HeightReference.NONE;
	}
	
	attributes.objectType = "basicF4d";

	//var nodesMap = this.hierarchyManager.getNodesMap(projectId, undefined);
	//var existentNodesCount = Object.keys(nodesMap).length;
	//var instanceId = defaultValue(attributes.instanceId, projectId + "_" + existentNodesCount.toString());
	var projectId = attributes.projectId;
	var instanceId = attributes.instanceId;
	
	var longitude = attributes.longitude;
	var latitude = attributes.latitude;
	var altitude = parseFloat(defaultValueCheckLength(attributes.height, 0));
	var heading = parseFloat(defaultValueCheckLength(attributes.heading, 0));
	var pitch = parseFloat(defaultValueCheckLength(attributes.pitch, 0));
	var roll = parseFloat(defaultValueCheckLength(attributes.roll, 0));
	
	var node = this.hierarchyManager.getNodeByDataKey(projectId, instanceId);
	if (node === undefined)
	{
		node = this.hierarchyManager.newNode(instanceId, projectId, undefined);

		var geoCoord = new GeographicCoord();
		geoCoord.latitude = parseFloat(latitude);
		geoCoord.longitude = parseFloat(longitude);
		geoCoord.altitude = parseFloat(altitude);

		var geoLocDataManager = geoCoord.getGeoLocationDataManager();
		var geoLocData = geoLocDataManager.newGeoLocationData("noName");
		geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, heading, pitch, roll, geoLocData, this);

		// Now, create the geoLocdataManager of node.***
		node.data.projectId = projectId;
		node.data.attributes = attributes;
		node.data.geographicCoord = geoCoord;
		node.data.rotationsDegree = new Point3D(pitch, roll, heading);
		node.data.geoLocDataManager = geoLocDataManager;

		if(attributes.heightReference === HeightReference.RELATIVE_TO_GROUND) {
			node.data.relativeHeight = geoCoord.altitude;
		} else {
			node.data.relativeHeight = 0;
		}

		node.data.attributes.fromDate = new Date();
		node.data.attributes.toDate = new Date();
		
		// Now, insert node into smartTile.***
		var targetDepth = 12;
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
 * check static model is exist
 * @param {string} projectId
 * @returns {Boolean} isExist
 */
MagoManager.prototype.isExistStaticModel = function(projectId)
{
	var isExist = false;

	if (!this.hierarchyManager.staticModelsManager || !this.hierarchyManager.staticModelsManager.staticModelsMap)
	{
		return isExist;
	}

	if (this.hierarchyManager.staticModelsManager.staticModelsMap.hasOwnProperty(projectId))
	{
		isExist = true;
	}
	return isExist;
};
/**
 * add image layer
 * @param {WMSLayer|XYZLayer} layer. now support type : wms, xyz
 */
MagoManager.prototype.addLayer = function(layer) 
{
	if (!layer)
	{
		throw new Error('layer is empty'); 
	}

	if (layer instanceof TextureLayer)
	{
		this.tinTerrainManager.addImageryLayer(layer);
	}
	else if (isMagoLayer(layer))
	{

		if (!this.magoLayerCollection)
		{
			this.magoLayerCollection = new MagoLayerCollection();
		}

		this.magoLayerCollection.add(layer);
	}

	function isMagoLayer(l) 
	{
		return l instanceof MagoLayer || (l.hasOwnProperty(dataGroupId) && l.hasOwnProperty(dataGroupKey) && l.hasOwnProperty(dataGroupPath));
	}
};

/**
 * get image layer by id
 * @param {string} id
 */
MagoManager.prototype.getLayerById = function(id) 
{
	//todo
};

/**
 * remove image layer by id
 * @param {string} id
 */
MagoManager.prototype.removeLayerById = function(id) 
{
	this.tinTerrainManager.imagerys = this.tinTerrainManager.imagerys.filter(function(layer, idx)
	{
		return layer._id !== id;
	});
	this.tinTerrainManager.addDeleteTextureId(id);
};

/**
 * add image layer by layer object
 * @param {WMSLayer | XYZLayer} layer
 */
MagoManager.prototype.removeLayer = function(removeLayer) 
{
	var id;
	this.tinTerrainManager.imagerys = this.tinTerrainManager.imagerys.filter(function(layer, idx)
	{
		if (layer === removeLayer) { id = layer._id; }
		return layer !== removeLayer;
	});
	this.tinTerrainManager.addDeleteTextureId(id);
};
/**
 * api gateway
 * @private
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
		var canvas = this.getObjectLabel();
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
		this.sceneState.setApplySunShadows(api.getShowShadow());
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
		var objectMoveMode = api.getObjectMoveMode();
		// CODE MOVEMODE에 왜 GEOGRAPHICPOINTS가 2로 매핑되었는지....;;
		if (objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS || objectMoveMode === CODE.moveMode.NONE) 
		{
			this.emit(MagoManager.EVENT_TYPE.DESELECTEDF4D, {
				type: MagoManager.EVENT_TYPE.DESELECTEDF4D
			});
			this.emit(MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT, {
				type: MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT
			});
		}
		
		this.magoPolicy.setObjectMoveMode(objectMoveMode);
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
		var moveHistoryMap = this.config.getAllMovingHistory(); // get colorHistoryMap.***
		if (moveHistoryMap === undefined)
		{
			this.config.clearMovingHistory();
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
								delete node.data.moveHistoryMap[objectIdx];
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
		
		this.config.clearMovingHistory();
	}
	else if (apiName === "deleteAllChangeColor") 
	{
		// 1rst, must delete the aditionalColors of objects.***
		var colorHistoryMap = this.config.getAllColorHistory(); // get colorHistoryMap.***
		
		if (colorHistoryMap === undefined)
		{
			this.config.clearColorHistory();
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
							
								node.deleteChangeColor(this);
								
								var neoBuilding = node.data.neoBuilding;
								if (neoBuilding === undefined)
								{ continue; }

								neoBuilding.deleteChangeColor(this, objectId);
								/*
								var refObjectArray = neoBuilding.getReferenceObjectsArrayByObjectId(objectId);
								if (refObjectArray === undefined)
								{ continue; }
								
								var refObjectsCount = refObjectArray.length;
								for (var i=0; i<refObjectsCount; i++)
								{
									var refObject = refObjectArray[i];
									if (refObject)
									{
										refObject.deleteChangeColor();
									}
								}
								*/
							}
						}	
					}
				}	
			}
		}
		
		this.config.clearColorHistory();
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
		var ambient = api.getAmbientReflectionCoef();
		var difusse = api.getDiffuseReflectionCoef();
		var specular = api.getSpecularReflectionCoef();
		var specularColor = api.getSpecularColor();
		var ambientColor = api.getAmbientColor();
		
		if (!isNaN(ambient)) 
		{
			this.sceneState.ambientReflectionCoef[0] = Number(ambient); // 0.2.
		}

		if (!isNaN(difusse)) 
		{
			this.sceneState.diffuseReflectionCoef[0] = Number(difusse); // 1.0
		}
		
		if (!isNaN(specular)) 
		{
			this.sceneState.specularReflectionCoef[0] = Number(specular); // 0.7
		}

		if (specularColor) 
		{
			var splitedSpecularColor = specularColor.split(',');
			if (splitedSpecularColor.length === 3) 
			{
				var sr = parseInt(splitedSpecularColor[0]) / 255;
				var sg = parseInt(splitedSpecularColor[1]) / 255;
				var sb = parseInt(splitedSpecularColor[2]) / 255;

				this.sceneState.specularColor[0] = sr; // 0.7
				this.sceneState.specularColor[1] = sg; // 0.7
				this.sceneState.specularColor[2] = sb; // 0.7
			}
		}

		if (ambientColor) 
		{
			var splitedAmbientColor = ambientColor.split(',');
			if (splitedAmbientColor.length === 3) 
			{
				var ar = parseInt(splitedAmbientColor[0]) / 255;
				var ag = parseInt(splitedAmbientColor[1]) / 255;
				var ab = parseInt(splitedAmbientColor[2]) / 255;

				this.sceneState.ambientColor[0] = ar;
				this.sceneState.ambientColor[1] = ag;
				this.sceneState.ambientColor[2] = ab;
			}
		}
	}
	else if (apiName === "changeSsaoRadius")
	{
		var ssaoRadius = api.getSsaoRadius();
		this.magoPolicy.setSsaoRadius(ssaoRadius);
		this.sceneState.ssaoRadius[0] = Number(ssaoRadius);
	}	
	else if (apiName === "changeFPVMode")
	{
		if (api.getFPVMode())
		{
			if (this.cameraFPV._camera !== undefined)	{ return; }

			this.cameraFPV.init();

			 if (this.isCesiumGlobe())
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
			if (this.isCesiumGlobe())
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
			apiResultCallback( this.config.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var dataName = node.data.data_name;
		var geoLocDataManager = node.data.geoLocDataManager;
		
		if (dataName === undefined || geoLocDataManager === undefined)
		{
			apiResultCallback( this.config.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var geoLocdata = geoLocDataManager.getCurrentGeoLocationData();
		
		if (geoLocdata === undefined || geoLocdata.geographicCoord === undefined)
		{
			apiResultCallback( this.config.getPolicy().geo_callback_apiresult, apiName, "-1");
			return;
		}
		
		var projectId = node.data.projectId;
		var latitude = geoLocdata.geographicCoord.latitude;
		var longitude = geoLocdata.geographicCoord.longitude;
		var altitude = geoLocdata.geographicCoord.altitude;
		var heading = geoLocdata.heading;
		var pitch = geoLocdata.pitch;
		var roll = geoLocdata.roll;
		
		return {
			projectId : projectId,
			dataKey   : dataKey,
			dataName  : dataName,
			latitude  : latitude,
			longitude : longitude,
			altitude  : altitude,
			heading   : heading,
			pitch     : pitch,
			roll      : roll
		};
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
		console.log("changeMagoMode");
	}
	else if (apiName === "getCameraCurrentPosition")
	{
		var unit = api.getUnit();
		if (this.isCesiumGlobe())
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
		if (this.isCesiumGlobe())
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
		//수정필요, 카메라가 세슘카메라
		var camera = this.scene.camera;
		var heading = defaultValueCheckLength(api.getHeading(), Cesium.Math.toDegrees(camera.heading));
		var pitch = defaultValueCheckLength(api.getPitch(), Cesium.Math.toDegrees(camera.pitch));
		var roll = defaultValueCheckLength(api.getRoll(), Cesium.Math.toDegrees(camera.roll));
		var duration = defaultValueCheckLength(api.getDuration(), 0);

		if (this.isCesiumGlobe())
		{
			var camera = this.scene.camera;
			if (!camera)
			{
				throw new Error('Camera is broken.');
			}

			camera.flyTo({
				destination : camera.positionWC,
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
		this.instantiateStaticModel(attributes);
	}
	else if (apiName === "addStaticModel")
	{
		var attribute = api.getStaticModelAttributeObj();
		this.addStaticModel(attribute);
	}
	else if (apiName === "setTrackNode")
	{
		var node = this.hierarchyManager.getNodeByDataKey(api.getProjectId(), api.getDataKey());
		if (!defined(node))
		{
			throw new Error("This node is not exist.");
		}

		if (node.isReadyToRender())
		{
			var geoLocDataManager = node.getNodeGeoLocDataManager();
			var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
			var geoCoords = geoLocData.getGeographicCoords();

			var currLon = geoCoords.longitude;
			var currLat = geoCoords.latitude;

			this.flyTo(currLon, currLat, 400, 0);
			var camera = this.sceneState.camera;
			camera.stopTrack(this);
			camera.setTrack(node, api.getTrackOption());
		}
	}
	else if (apiName === "stopTrack")
	{
		this.sceneState.camera.stopTrack(this);
	}
	else if (apiName === "isExistStaticModel")
	{
		return this.isExistStaticModel(api.getProjectId());
	}
	else if (apiName === "isExistData")
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		if (node !== undefined)
		{
			return true;
		}

		return false;
		
	}
	else if (apiName === "isDataReadyToRender")
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);

		if (node !== undefined)
		{
			if (node.isReadyToRender())
			{
				return true;
			}
		}

		return false;
	}
	else if (apiName === "setNodeAttribute")
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		var attribute = api.getNodeAttribute();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);

		if (node !== undefined)
		{
			if (node.data) 
			{
				var nodeData = node.data;
				if (!nodeData.attributes) 
				{
					nodeData.attributes = {};
				}
				var myAttribute = nodeData.attributes;

				for (var key in attribute)
				{
					if (attribute.hasOwnProperty(key)) 
					{
						myAttribute[key] = attribute[key];
					}
				}
			}
		}

		return false;
	}
	else if (apiName === 'togglePointCloudColor') 
	{
		var renderingSettings = this._settings.getRenderingSettings();
		var pointsCloudColorRamp = renderingSettings.getPointsCloudInColorRamp();
		renderingSettings.setPointsCloudInColorRamp(!pointsCloudColorRamp);
	}
	else if (apiName === 'selectF4d')
	{
		var projectId = api.getProjectId();
		var dataKey = api.getDataKey();
		if (!defined(projectId))
		{
			throw new Error("projectId is required.");
		}
		if (!defined(dataKey))
		{
			throw new Error("dataKey is required.");
		}
		var node = this.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		if (!node)
		{
			throw new Error("f4d is not exist.");
		}

		this.magoPolicy.setObjectMoveMode(CODE.moveMode.ALL);

		//this.nodeSelected = node;
		//this.buildingSelected = node.data.neoBuilding;
		//this.rootNodeSelected = this.nodeSelected.getRoot();

		this.selectionManager.selectF4d(node);

		this.emit(MagoManager.EVENT_TYPE.SELECTEDF4D, {
			type      : MagoManager.EVENT_TYPE.SELECTEDF4D, 
			f4d       : node, 
			timestamp : new Date()
		});
	}
};

MagoManager.prototype.getSelectionManager = function ()
{
	if(!this.selectionManager)
	{
		this.selectionManager = new SelectionManager(this);
	}
	return this.selectionManager;
};

MagoManager.prototype.deleteAll = function ()
{
	// deselect.
	var selManager = this.getSelectionManager();
	selManager.clearCandidates();
	selManager.clearCurrents();
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
	
	// delete nodes.
	this.hierarchyManager.deleteNodes(this.sceneState.gl, this.vboMemoryManager);

	// if exist terrain, then delete terrain.***
	if (this.tinTerrainManager)
	{
		this.tinTerrainManager.deleteAll();
		this.tinTerrainManager = undefined;
	}

	if(!this.isCesiumGlobe()) cancelAnimationFrame(magoManager.reqFrameId);
};

MagoManager.prototype.checkCollision = function (position, direction)
{
	var gl = this.sceneState.gl;
	if (gl === undefined)	{ return; }

	var posX = this.sceneState.drawingBufferWidth * 0.5;
	var posY = this.sceneState.drawingBufferHeight * 0.5;
	
	//var objects = this.getSelectedObjects(gl, posX, posY, this.arrayAuxSC);

	this.selectionManager.selectObjectByPixel(gl, posX, posY);
	if (objects === undefined)	{ return; }

	var collisionPosition = new Point3D();
	var bottomPosition = new Point3D();

	ManagerUtils.calculatePixelPositionWorldCoord(gl, posX, posY, collisionPosition, undefined, undefined, undefined, this);
	this.swapRenderingFase();
	ManagerUtils.calculatePixelPositionWorldCoord(gl, posX, this.sceneState.drawingBufferHeight, undefined, undefined, undefined, this);

	//this.buildingSelected = current_building;
	//selectedBuilding = this.selectionManager.currentBuildingSelected;
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
MagoManager.prototype.renderBasicGl_test = function()
{
	var gl = this.getGl();
	if(!this.testShader) 
	{
		var fragCode =
            'void main(void) {' +
               'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);' +
			'}';
			var vertCode =
            'attribute vec3 coordinates;' +
            'void main(void) {' +
               ' gl_Position = vec4(coordinates, 1.0);' +
            '}';

	// 5) Test Quad shader.****************************************************************************************
	
	var shaderName = "renderBasicGl_test"; // used by temperatura layer.***
	var shader = this.postFxShadersManager.createShaderProgram(gl, vertCode, fragCode, shaderName, this);

	this.testShader = shader;
	}
	

	var positions = new Float32Array([0.0,0.0,0,
									0.5,0.5,0,
									1.0,1.0,0]);
	var vboCacheKey = new VBOVertexIdxCacheKey();
	vboCacheKey.setDataArrayPos(positions, this.vboMemoryManager,3);
	vboCacheKey.vboBufferPos.isReady(gl, this.vboMemoryManager);
	
	this.testShader.useProgram();
	//vboCacheKey.bindDataPosition(shader,this.vboMemoryManager);
	gl.bindBuffer(vboCacheKey.vboBufferPos.dataTarget, vboCacheKey.vboBufferPos.key);
	gl.vertexAttribPointer(0, vboCacheKey.vboBufferPos.dataDimensions, vboCacheKey.vboBufferPos.dataGlType, vboCacheKey.vboBufferPos.normalized, vboCacheKey.vboBufferPos.dataStride, vboCacheKey.vboBufferPos.dataOffSet);
	gl.disable(gl.CULL_FACE);
	gl.drawArrays(gl.LINE_STRIP, 0, vboCacheKey.vertexCount);

}