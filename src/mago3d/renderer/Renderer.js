'use strict';

/**
 * This class contains the current objects that are rendering. 
 * @class CurrentObjectsRendering
 * @constructor
 */
var CurrentObjectsRendering = function() 
{
	if (!(this instanceof CurrentObjectsRendering)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The current node that is in rendering process.
	 * @type {Node}
	 * @default undefined
	 */
	this.curNode = undefined;
	
	/**
	 * The current building that is in rendering process.
	 * @type {NeoBuilding}
	 * @default undefined
	 */
	this.curBuilding = undefined;
	
	/**
	 * The current octree (octree of a building) that is in rendering process.
	 * @type {Octree}
	 * @default undefined
	 */
	this.curOctree = undefined;
	
	/**
	 * The current object that is in rendering process.
	 * @type {NeoReference}
	 * @default undefined
	 */
	this.curObject = undefined;
};


/**
 * This class manages the rendering of all classes.
 * @class Renderer
 * @constructor
 */
var Renderer = function(manoManager) 
{
	if (!(this instanceof Renderer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The current objects that is in rendering process.
	 * @type {CurrentObjectsRendering}
	 * @default CurrentObjectsRendering
	 */
	this.currentObjectsRendering = new CurrentObjectsRendering();
	
	/**
	 * This parameter indicates that if is using normals in the shader.
	 * @type {Boolean}
	 * @default true
	 */
	this.renderNormals = true;
	
	/**
	 * This parameter indicates that if is using textures in the shader.
	 * @type {Boolean}
	 * @default true
	 */
	this.renderTexture = true;
	
	/**
	 * The main mago3d class. This object manages the main pipe-line of the Mago3D.
	 * @type {ManoManager}
	 * @default ManoManager
	 */
	this.magoManager = manoManager;
};

/**
 * This function renders all nodes of "visibleNodesArray".
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Array} visibleNodesArray Array that contains the nodes to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Boolean} renderTexture This parameter indicates that if is using textures in the shader.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {Number} maxSizeToRender This parameter limites the minimum size in the rendering process.
 * @param {Number} refMatrixIdxKey Indicates the references transformation matrix index.
 */
Renderer.prototype.renderNodes = function(gl, visibleNodesArray, magoManager, shader, renderTexture, renderType, maxSizeToRender, refMatrixIdxKey) 
{
	// do render.
	var node;
	var nodesCount = visibleNodesArray.length;
	
	var sceneState = magoManager.sceneState;
	var bApplyShadow = sceneState.applySunShadows;
	if (bApplyShadow && renderType === 1)
	{
		var light0 = sceneState.sunSystem.getLight(0);
		var light0MaxDistToCam = light0.maxDistToCam;
		var light0BSphere = light0.bSphere;
		if (light0BSphere === undefined)
		{ return; }
	
		var light0Radius = light0BSphere.getRadius();
		
		var light0CenterPoint = light0BSphere.getCenterPoint();
		for (var i=0; i<nodesCount; i++)
		{
			node = visibleNodesArray[i];
			
			// now check if the node is inside of the light0 bSphere.
			var bboxAbsoluteCenterPos = node.bboxAbsoluteCenterPos;
			if (bboxAbsoluteCenterPos === undefined)
			{ 
				gl.uniform1i(shader.sunIdx_loc, 1);
			}
			else
			{
				var bbox = node.data.bbox;
				var radiusAprox = bbox.getRadiusAprox();
				var distToLight0 = light0CenterPoint.distToPoint(bboxAbsoluteCenterPos);//+radiusAprox;
				
				if (distToLight0 < light0Radius*0.5)
				{
					gl.uniform1i(shader.sunIdx_loc, 0); // original.***
					//gl.uniform1i(shader.sunIdx_loc, 1);
				}
				else
				{
					gl.uniform1i(shader.sunIdx_loc, 1);
				}
			}
			node.renderContent(magoManager, shader, renderType, refMatrixIdxKey);
		}
	}
	else
	{
		for (var i=0; i<nodesCount; i++)
		{
			node = visibleNodesArray[i];
			node.renderContent(magoManager, shader, renderType, refMatrixIdxKey);
		}
	}
};

/**
 * This function returns the vertices count recommended to render for determined distance to camera.
 * @param {Number} distToCam WebGL Rendering Context.
 * @param {Number} realPointsCount The real current points count.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 */
Renderer.prototype.getPointsCountForDistance = function(distToCam, realPointsCount, magoManager) 
{
	var vertices_count = realPointsCount;
	var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
		
	if (distToCam <= 10)
	{
		// Render all points.
		vertices_count =  Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCam0m * realPointsCount);
	}
	else if (distToCam < 100)
	{
		vertices_count = Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCam100m * realPointsCount);
	}
	else if (distToCam < 200)
	{
		vertices_count = Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCam200m * realPointsCount);
	}
	else if (distToCam < 400)
	{
		vertices_count = Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCam400m * realPointsCount);
	}
	else if (distToCam < 800)
	{
		vertices_count = Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCam800m * realPointsCount);
	}
	else if (distToCam < 1600)
	{
		vertices_count = Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCam1600m * realPointsCount);
	}
	else
	{
		vertices_count = Math.floor(pCloudSettings.maxPerUnitPointsRenderDistToCamMoreThan1600m * realPointsCount);
	}
	
	return vertices_count;
};

/**
 * This function renders the pCloud object. The pCloud object is "Lego" class.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Lego} pCloud The points cloud data to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {Number} distToCam The current distance to camera.
 */
Renderer.prototype.renderPCloud = function(gl, pCloud, magoManager, shader, renderType, distToCam) 
{
	// Note: "pCloud" is "Lego" class.
	if (pCloud.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	gl.frontFace(gl.CCW);
	
	var vbo_vicky = pCloud.vbo_vicks_container.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;
	
	if (vertices_count === 0) 
	{ return; }
	
	var pointsCountToDraw = this.getPointsCountForDistance(distToCam, vertices_count, magoManager);
	
	if (magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
	{
		pointsCountToDraw = Math.floor(pointsCountToDraw/5);
	}

	if (pointsCountToDraw <= 0)
	{ return; }

	if (renderType === 0) // depth.
	{
		// 1) Position.
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		gl.drawArrays(gl.POINTS, 0, pointsCountToDraw);
	}
	else if (renderType === 1) // color.
	{
		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
		{ return false; }
		
		gl.drawArrays(gl.POINTS, 0, pointsCountToDraw);
		
		magoManager.sceneState.pointsRenderedCount += pointsCountToDraw;
		
	}
	
	
};

/**
 * This function renders the neoBuildings as points-cloud projects.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Array} visibleNodesArray Array that contains the nodes to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Boolean} renderTexture This parameter indicates that if is using textures in the shader.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 */
Renderer.prototype.renderNeoBuildingsPCloud = function(gl, visibleNodesArray, magoManager, shader, renderTexture, renderType) 
{
	var node;
	var rootNode;
	var geoLocDataManager;
	var neoBuilding;
	var lowestOctreesCount;
	var lowestOctree;
	var lastExtureId;
	
	// Do some gl settings.
	//gl.uniform1i(shader.bUse1Color_loc, false);
	gl.uniform1f(shader.fixPointSize_loc, 1.0);
	gl.uniform1i(shader.bUseFixPointSize_loc, false);
	
	var nodesCount = visibleNodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		node = visibleNodesArray[i];
		
		var attributes = node.data.attributes;
		if (attributes)
		{
			if (attributes.isVisible !== undefined && attributes.isVisible === false) 
			{
				continue;
			}
		}

		rootNode = node.getRoot();
		geoLocDataManager = rootNode.data.geoLocDataManager;
		neoBuilding = node.data.neoBuilding;
		
		if (neoBuilding === undefined)
		{ continue; }
		
		if (neoBuilding.octree === undefined)
		{ continue; }

		var projectDataType = neoBuilding.metaData.projectDataType;
		
		var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocation.rotMatrix._floatArrays);
		gl.uniform3fv(shader.buildingPosHIGH_loc, buildingGeoLocation.positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, buildingGeoLocation.positionLOW);
		
		if (projectDataType !== undefined && projectDataType === 5)
		{
			if (magoManager.myCameraRelative === undefined)
			{ magoManager.myCameraRelative = new Camera(); }

			var relativeCam = magoManager.myCameraRelative;
			relativeCam.frustum.copyParametersFrom(magoManager.myCameraSCX.bigFrustum);
			relativeCam = buildingGeoLocation.getTransformedRelativeCamera(magoManager.sceneState.camera, relativeCam);
			relativeCam.calculateFrustumsPlanes();
			var renderType = renderType;// testing.
			var bPrepareData = true;
			
			neoBuilding.octree.test__renderPCloud(magoManager, neoBuilding, renderType, shader, relativeCam, bPrepareData);
		}
	}
	
	shader.disableVertexAttribArrayAll();
};

/**
 * This function enables the webgl stencil-test option.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.enableStencilBuffer = function(gl)
{
	// Active stencil if the object is selected.
	gl.enable(gl.STENCIL_TEST);
	
	gl.stencilFunc(gl.ALWAYS, 1, 1);
	// (stencil-fail: replace), (stencil-pass & depth-fail: replace), (stencil-pass & depth-pass: replace).
	//gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
	gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
	gl.enable(gl.POLYGON_OFFSET_FILL);
};

/**
 * This function disables the webgl stencil-test option.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.disableStencilBuffer = function(gl)
{
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
	gl.disable(gl.POLYGON_OFFSET_FILL);
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {ParametricMesh} renderable ParametricMesh type object to render.
 * @param {ManoManager} magoManager The main mago3d class. This object manages the main pipe-line of the Mago3D.
 * @param {PostFxShader} shader The PostFxShader class object.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {Boolean} bRenderLines Optional boolean. Indicates if render edges.
 */
Renderer.prototype.renderObject = function(gl, renderable, magoManager, shader, renderType, bRenderLines)
{
	// This function actually is used for axis (origin) object.
	var vbo_vicks_container = renderable.getVboKeysContainer();
	
	if (vbo_vicks_container === undefined)
	{ return; }
	
	if (vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{ return; }
	
	if (bRenderLines === undefined)
	{ bRenderLines = false; }

	var vbosCount = vbo_vicks_container.getVbosCount();
	for (var i=0; i<vbosCount; i++)
	{
		// 1) Position.
		var vbo_vicky = vbo_vicks_container.vboCacheKeysArray[i]; // there are only one.

		var vertices_count = vbo_vicky.vertexCount;
		if (vertices_count === 0) 
		{ return; }

		if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (renderType === 1) // ssao.
		{
			if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }

			if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
			{ return false; }
			
			// TexCoords todo:
		}
		
		if (bRenderLines === false)
		{
			if (vbo_vicky.indicesCount > 0)
			{
				if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
				{ return false; }

				gl.drawElements(gl.TRIANGLES, vbo_vicky.indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
			}
			else 
			{
				gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
			}
		}
		else 
		{
			gl.drawArrays(gl.LINE_STRIP, 0, vertices_count);
			//gl.drawArrays(gl.TRIANGLES, 0, vertices_count);
		}
	}
};


/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryDepth = function(gl, renderType, visibleObjControlerNodes) 
{
	var currentShader;
	var shaderProgram;
	var renderTexture = false;
	
	var magoManager = this.magoManager;
	var sceneState = this.magoManager.sceneState;
	var renderType = 0;
	magoManager.currentProcess = CODE.magoCurrentProcess.DepthRendering;
	
	// Test Modeler Rendering.********************************************************************
	// Test Modeler Rendering.********************************************************************
	// Test Modeler Rendering.********************************************************************
	// tin terrain.***
	if (magoManager.tinTerrainManager !== undefined)
	{
		var bDepth = true;
		magoManager.tinTerrainManager.render(magoManager, bDepth, renderType);
		gl.useProgram(null);
	}
	
	if (magoManager.modeler !== undefined)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		currentShader.resetLastBuffersBinded();
		shaderProgram = currentShader.program;

		currentShader.useProgram();
		magoManager.effectsManager.setCurrentShader(currentShader);
		currentShader.disableVertexAttribArrayAll();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
		gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
		gl.uniform1i(currentShader.bHasTexture_loc , false);
		gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
		gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);

		currentShader.bindUniformGenerals();
		gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
		gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao.***

		var refTMatrixIdxKey = 0;
		var minSizeToRender = 0.0;
		
		var refMatrixIdxKey = 0; // provisionally set this var here.***
		magoManager.modeler.render(magoManager, currentShader, renderType);

		currentShader.disableVertexAttribArrayAll();
		gl.useProgram(null);

	}

	if (visibleObjControlerNodes.hasRenderables())
	{
		// Make depth for all visible objects.***
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		currentShader.resetLastBuffersBinded();
		shaderProgram = currentShader.program;

		currentShader.useProgram();
		currentShader.disableVertexAttribArrayAll();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		gl.uniform1i(currentShader.bHasTexture_loc , false);

		currentShader.bindUniformGenerals();
		gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		gl.uniform1i(currentShader.bHasTexture_loc , false);
		gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
		gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
		gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);

		// check if exist clippingPlanes.
		if (magoManager.modeler.clippingBox !== undefined)
		{
			var planesVec4Array = magoManager.modeler.clippingBox.getPlanesRelToEyevec4Array(magoManager);
			var planesVec4FloatArray = new Float32Array(planesVec4Array);
			
			//shader.bApplyClippingPlanes_loc = gl.getUniformLocation(shader.program, "bApplyClippingPlanes");
			//shader.clippingPlanesCount_loc = gl.getUniformLocation(shader.program, "clippingPlanesCount");
			//shader.clippingPlanes_loc = gl.getUniformLocation(shader.program, "clippingPlanes");
			
			gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
			gl.uniform1i(currentShader.clippingPlanesCount_loc, 6);
			gl.uniform4fv(currentShader.clippingPlanes_loc, planesVec4FloatArray);
		}
		else 
		{
			gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
		}
			

		// RenderDepth for all buildings.***
		var refTMatrixIdxKey = 0;
		var minSize = 0.0;
		// excavation objects.
		this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);

		this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
		this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
		this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
		// native objects.
		var bIncludeTransparentObjects = false;
		this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, bIncludeTransparentObjects);

		currentShader.disableVertexAttribArray(currentShader.position3_loc); 
		gl.useProgram(null);

	}

	// PointsCloud.****************************************************************************************
	// PointsCloud.****************************************************************************************
	var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
	if (nodesPCloudCount > 0)
	{
		currentShader = magoManager.postFxShadersManager.getShader("pointsCloudDepth");
		currentShader.useProgram();
		
		currentShader.resetLastBuffersBinded();
		currentShader.disableVertexAttribArrayAll();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		
		currentShader.bindUniformGenerals();
		var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
		gl.uniform1f(currentShader.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
		gl.uniform1f(currentShader.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
		gl.uniform1f(currentShader.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
		gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);

		gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
		gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
		gl.uniform1i(currentShader.clippingType_loc, 0);
		
		// Test to load pCloud.***
		if (magoManager.visibleObjControlerPCloudOctrees === undefined)
		{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
		magoManager.visibleObjControlerPCloudOctrees.clear();

		this.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShader, renderTexture, renderType); 
		currentShader.disableVertexAttribArrayAll();
		
		gl.useProgram(null);
		
		// Load pCloud data.***
		var visiblesSortedOctreesArray = magoManager.visibleObjControlerPCloudOctrees.currentVisibles0;
		var octreesCount = visiblesSortedOctreesArray.length;

		var loadCount = 0;
		if (!magoManager.isCameraMoving && !magoManager.mouseLeftDown && !magoManager.mouseMiddleDown)
		{
			for (var i=0; i<octreesCount; i++)
			{
				var octree = visiblesSortedOctreesArray[i];
				if (octree.preparePCloudData(magoManager))
				{
					loadCount++;
				}
				
				if (loadCount > 1)
				{ break; }
			}
		}

	}
	
	
	// Render cuttingPlanes of temperaturalayers if exist.***
	if (magoManager.weatherStation)
	{ magoManager.weatherStation.test_renderCuttingPlanes(magoManager, renderType); }
	
	var selectionManager = magoManager.selectionManager;

	if(selectionManager.existSelectedObjects())
	this.renderSilhouetteDepth();
	
};

Renderer.prototype.beginRenderSilhouetteDepth = function()
{
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();

	magoManager.currentProcess = CODE.magoCurrentProcess.SilhouetteDepthRendering;
	var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();
	silhouetteDepthFbo.bind(); 
		
	if (magoManager.isFarestFrustum())
	{
		gl.clearColor(1, 1, 1, 1);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	else
	{
		gl.clearDepth(1);
		gl.clear(gl.DEPTH_BUFFER_BIT);
	}
		
	magoManager.swapRenderingFase();
		
	var currentShader;
	currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
	currentShader.resetLastBuffersBinded();

	currentShader.useProgram();
	currentShader.disableVertexAttribArrayAll();
	currentShader.enableVertexAttribArray(currentShader.position3_loc);

	currentShader.bindUniformGenerals();
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
		
	// check if exist clippingPlanes.
	if (magoManager.modeler.clippingBox !== undefined)
	{
		var planesVec4Array = magoManager.modeler.clippingBox.getPlanesRelToEyevec4Array(magoManager);
		var planesVec4FloatArray = new Float32Array(planesVec4Array);
			
		gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
		gl.uniform1i(currentShader.clippingPlanesCount_loc, 6);
		gl.uniform4fv(currentShader.clippingPlanes_loc, planesVec4FloatArray);
	}
	else 
	{
		gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
	}

};

Renderer.prototype.endRenderSilhouetteDepth = function(silhouetteDepthFbo)
{
	silhouetteDepthFbo.unbind(); 
};

Renderer.prototype.renderSilhouetteDepth = function()
{
// Depth for silhouette.***************************************************************************************
	// Check if there are node selected.***********************************************************
	//if (magoManager.nodeSelected && magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.ALL && magoManager.buildingSelected)
	//{
	
	/*
	*	TODO: MUST BE CHANGE WITHOUT YOUR AUTHORIZATION, YOU AND ME
	*/
	var magoManager = this.magoManager;
	var selectionManager = magoManager.selectionManager;
	var selectType = magoManager.interactionCollection.getSelectType();
	var renderTexture = false;
	if (selectionManager)
	{
		// 1rst, check if exist objects selected.
		//var nativeSelectedArray = selectionManager.getSelectedGeneralArray();
		//var nodes = selectionManager.getSelectedF4dNodeArray();
		//var selectedRefs = selectionManager.getSelectedF4dObjectArray();

		if(selectionManager.existSelectedObjects())
		{
			// Begin render.
			this.beginRenderSilhouetteDepth();
		}
		else{
			return;
		}

		var currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();

		var gl = magoManager.getGl();
		var nodes = selectionManager.getSelectedF4dNodeArray();
		var selectedRefs = selectionManager.getSelectedF4dObjectArray();
		if (nodes.length > 0 && selectedRefs.length === 0) // test code.***
		{

			var renderType = 0;
			var refMatrixIdxKey = 0;
			for (var i=0, len=nodes.length;i<len;i++) 
			{
				var node = nodes[i];
				node.renderContent(magoManager, currentShader, renderType, refMatrixIdxKey);
			}
			magoManager.swapRenderingFase();
		}
		

		// Check if there are a object selected.**********************************************************************
		//if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.OBJECT && magoManager.selectionManager.currentReferenceSelected)
		if (selectionManager.currentReferenceSelected)
		{
			var node = selectionManager.getSelectedF4dNode();
			var neoBuilding = selectionManager.getSelectedF4dBuilding();
			if (selectionManager.currentReferenceSelected instanceof NeoReference && node !== undefined && neoBuilding !== undefined) // test code.***
			{
				magoManager.currentProcess = CODE.magoCurrentProcess.SilhouetteDepthRendering;
				var geoLocDataManager = node.getNodeGeoLocDataManager();

				var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
				var glPrimitive = gl.POINTS;
				glPrimitive = gl.TRIANGLES;
				var maxSizeToRender = 0.0;
				var refMatrixIdxKey = 0;
				
				buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

				glPrimitive = gl.TRIANGLES;
				var localRenderType = 0; // only need positions.***
				var minSizeToRender = 0.0;
				var offsetSize = 3/1000;
				
				gl.disable(gl.CULL_FACE);
				
				selectionManager.getSelectedF4dObject().render(magoManager, neoBuilding, localRenderType, renderTexture, currentShader, refMatrixIdxKey, minSizeToRender);
				//silhouetteDepthFbo.unbind(); 
				
				gl.enable(gl.CULL_FACE);
			}
		}

		// Now check native objects.
		var renderType = 0;
		var nativeSelectedArray = selectionManager.getSelectedGeneralArray();
		for(var i=0; i<nativeSelectedArray.length; i++)
		{
			var renderableObject = nativeSelectedArray[i];
			renderableObject.render(magoManager, currentShader, renderType, gl.TRIANGLES);
		}

		// End render.
		this.endRenderSilhouetteDepth(silhouetteDepthFbo);
	}
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderDepthSunSystem = function(visibleObjControlerNodes) 
{
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;

	visibleObjControlerNodes.calculateBoundingFrustum(sceneState.camera);
		
	var sunSystem = sceneState.sunSystem;
	var sunLightsCount = sunSystem.lightSourcesArray.length;
	for (var i=0; i<sunLightsCount; i++)
	{
		var sunLight = sunSystem.getLight(i);
		var imageWidth = sunLight.targetTextureWidth;
		var imageHeight = sunLight.targetTextureHeight;
		
		if (sunLight.depthFbo === undefined) 
		{ 
			sunLight.depthFbo = new FBO(gl, imageWidth, imageHeight ); 
		}
		
		// Must swap rendering phase before render depth from the sun.***
		magoManager.swapRenderingFase();
		
		sunLight.depthFbo.bind();
		if (magoManager.isFarestFrustum())
		{
			gl.clearColor(1, 1, 1, 1);
			gl.clearDepth(1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}
		else
		{
			gl.clearDepth(1);
			gl.clear(gl.DEPTH_BUFFER_BIT);
		}
		gl.viewport(0, 0, imageWidth, imageHeight);
		
		this._renderDepthSunPointOfView(gl, visibleObjControlerNodes, sunLight, sunSystem);
		
		sunLight.depthFbo.unbind();
	}
	
	magoManager.depthFboNeo.bind(); 
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
	gl.clearColor(0, 0, 0, 1); // alpha must be 1 in preMultiplied gl.***
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype._renderDepthSunPointOfView = function(gl, visibleObjControlerNodes, sunLight, sunSystem) 
{
	if (sunLight.tMatrix === undefined)
	{ return; }

	// collect all shadowCaster's nodes.
	//var resultVisiblesArray = [].concat(visibleObjControlerNodes.currentVisibles0, visibleObjControlerNodes.currentVisibles2, visibleObjControlerNodes.currentVisibles3);
	//var 
	
	var magoManager = this.magoManager;
	magoManager.currentProcess = CODE.magoCurrentProcess.DepthShadowRendering;

	// Do the depth render.***
	var shaderName = "orthogonalDepth";
	var currentShader = magoManager.postFxShadersManager.getShader(shaderName); 
	currentShader.resetLastBuffersBinded();
	//var shaderProgram = currentShader.program;

	currentShader.useProgram();
	magoManager.effectsManager.setCurrentShader(currentShader);
	currentShader.disableVertexAttribArrayAll();
	currentShader.enableVertexAttribArray(currentShader.position3_loc);

	currentShader.bindUniformGenerals();
	
	//var sunGeoLocData = sunSystem.sunGeoLocDataManager.getCurrentGeoLocationData();
	//var sunTMatrix = sunGeoLocData.getRotMatrixInv();

	//gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEye_loc, false, sunTMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrixRelToEye_loc, false, sunLight.tMatrix._floatArrays);
	gl.uniform3fv(currentShader.encodedCameraPositionMCHigh_loc, sunLight.positionHIGH);
	gl.uniform3fv(currentShader.encodedCameraPositionMCLow_loc, sunLight.positionLOW);
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
	
	gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao.***
	gl.disable(gl.CULL_FACE);
	var renderType = 0;
	
	// Do render.***
	var refTMatrixIdxKey = 0;
	var minSize = 0.0;
	var renderTexture = false;

	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	
	// Mago native geometries.
	var options = {
		bRenderOpaques : true,
		bRenderTransparents : true
	};
	this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
	
	// tin terrain.***
	if (magoManager.tinTerrainManager !== undefined)
	{
		var bDepth = true;
		//magoManager.tinTerrainManager.render(magoManager, bDepth, renderType, currentShader);
		//gl.useProgram(null);
	}
	
	gl.enable(gl.CULL_FACE);
	currentShader.disableVertexAttribArrayAll();
	gl.useProgram(null);
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderDepthCameraPointOfView = function(camera, visibleObjControlerNodes) 
{
	if (camera === undefined)
	{ return; }
	
	var magoManager = this.magoManager;
	magoManager.currentProcess = CODE.magoCurrentProcess.DepthShadowRendering;

	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;

	// Do the depth render.***
	var currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
	currentShader.resetLastBuffersBinded();

	currentShader.useProgram();
	magoManager.effectsManager.setCurrentShader(currentShader);
	currentShader.disableVertexAttribArrayAll();
	currentShader.enableVertexAttribArray(currentShader.position3_loc);

	currentShader.bindUniformGenerals();

	//gl.viewport(0, 0, 512, 512);
	//gl.viewport(0, 0, this.sceneState.drawingBufferWidth[0], this.sceneState.drawingBufferHeight[0]);
	
	// get camera's encodedPositions high & low.
	var encodedCamPos = camera.getEncodedCameraPosition();
	var camMVRelToEyeMat = camera.getModelViewMatrixRelToEye();

	var bigFrustum = camera.getBigFrustum();
	var projectionMat = Frustum.getProjectionMatrix(bigFrustum, undefined);

	var modelViewProjMatrix = new Matrix4();
	modelViewProjMatrix._floatArrays = glMatrix.mat4.multiply(modelViewProjMatrix._floatArrays, projectionMat._floatArrays, camMVRelToEyeMat._floatArrays);
	var mvpMatRelToEye_loc = gl.getUniformLocation(currentShader.program, "ModelViewProjectionMatrixRelToEye");

	gl.uniformMatrix4fv(mvpMatRelToEye_loc, false, modelViewProjMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEye, false, camMVRelToEyeMat._floatArrays);
	gl.uniform3fv(currentShader.encodedCameraPositionMCHigh, encodedCamPos.high);
	gl.uniform3fv(currentShader.encodedCameraPositionMCLow, encodedCamPos.low);
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
	gl.uniform1f(currentShader.frustumFar_loc, bigFrustum.far[0]);

	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.bHasTexture_loc , false);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	var bUseMultiRenderTarget = false;
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, bUseMultiRenderTarget);
	
	gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao.***
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	var renderType = 0;
	
	// Do render.***
	var refTMatrixIdxKey = 0;
	var minSize = 0.0;
	var renderTexture = false;
	
	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	
	// Mago native geometries.
	var options = {
		bRenderOpaques : true,
		bRenderTransparents : true
	};
	this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
	
	// tin terrain.***
	if (magoManager.tinTerrainManager !== undefined)
	{
		var bDepth = true;
		//magoManager.tinTerrainManager.render(magoManager, bDepth, renderType, currentShader);
		//gl.useProgram(null);
	}
	
	gl.enable(gl.CULL_FACE);
	currentShader.disableVertexAttribArrayAll();
	gl.useProgram(null);

	//gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
};


/**
 * Test function.
 */
Renderer.prototype.renderImageViewRectangle = function(gl, magoManager, depthFbo) 
{
	// Render a test quad to render created textures.***
	if (magoManager.imageViewerRectangle === undefined)
	{
		magoManager.imageViewerRectangle = new ImageViewerRectangle(100, 100);
		magoManager.imageViewerRectangle.geoLocDataManager = new GeoLocationDataManager();
		var geoLocDataManager = magoManager.imageViewerRectangle.geoLocDataManager;
		var geoLocData = geoLocDataManager.newGeoLocationData("noName");
		geoLocData = ManagerUtils.calculateGeoLocationData(126.61673801297405, 37.580105647225956, 50, undefined, undefined, undefined, geoLocData, magoManager);
	}

		
	if (depthFbo !== undefined)
	{
		var shaderName = "imageViewerRectangle";
		var currentShader = magoManager.postFxShadersManager.getShader(shaderName); 
		currentShader.useProgram();
		var bApplySsao = false;
			
		gl.uniform1i(currentShader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
			
		gl.enableVertexAttribArray(currentShader.texCoord2_loc);
		gl.enableVertexAttribArray(currentShader.position3_loc);
		//gl.disableVertexAttribArray(currentShader.normal3_loc);
		//gl.disableVertexAttribArray(currentShader.color4_loc); 
			
		currentShader.bindUniformGenerals();
		gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
		gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(currentShader.oneColor4_loc, [0.1, 0.8, 0.99, 1.0]); //.***
			
		gl.uniform3fv(currentShader.buildingPosHIGH_loc, [0.0, 0.0, 0.0]);
		gl.uniform3fv(currentShader.buildingPosLOW_loc, [0.0, 0.0, 0.0]);

			
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, depthFbo.colorBuffer);
		currentShader.last_tex_id = depthFbo.colorBuffer;
			
		magoManager.imageViewerRectangle.render(magoManager, currentShader);
			
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, null);
			
		currentShader.disableVertexAttribArrayAll();
		gl.useProgram(null);
	}
		
	
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderAtmosphere = function(gl, renderType) 
{
	// Atmosphere.*******************************************************************************
	// Test render sky.***
	var magoManager = this.magoManager;
	if (magoManager.sky === undefined)
	{ magoManager.sky = new Sky(); }
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var currentShader = magoManager.postFxShadersManager.getShader("atmosphere"); 
	currentShader.useProgram();
	var bApplySsao = false;
	
	gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
	
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, false);
	gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.disableVertexAttribArray(currentShader.normal3_loc);
	//gl.disableVertexAttribArray(currentShader.color4_loc); 
	
	currentShader.bindUniformGenerals();
	gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
	gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
	gl.uniform4fv(currentShader.oneColor4_loc, [0.1, 0.8, 0.99, 1.0]); //.***
	
	gl.uniform3fv(currentShader.buildingPosHIGH_loc, [0.0, 0.0, 0.0]);
	gl.uniform3fv(currentShader.buildingPosLOW_loc, [0.0, 0.0, 0.0]);
	
	var refTMatrixIdxKey = 0;
	var minSizeToRender = 0.0;
	var renderType = 1;
	var refMatrixIdxKey =0; // provisionally set magoManager var here.***
	var glPrimitive = undefined;

	magoManager.sky.render(magoManager, currentShader, renderType, glPrimitive);
	
	currentShader.disableVertexAttribArrayAll();
	gl.useProgram(null);
	
	// Render a test quad to render created textures.***
	if (magoManager.sunDepthFbo !== undefined)
	{
		this.renderImageViewRectangle(gl, magoManager, magoManager.sunDepthFbo);
	}
	
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderNativeLightSources = function(renderType, visibleObjControlerNodes) 
{
	var magoManager = this.magoManager;

	var lightSourcesArray = visibleObjControlerNodes.currentVisibleNativeObjects.lightSourcesArray;
	var lightSourcesCount = lightSourcesArray.length;
	if (lightSourcesCount > 0)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;

		var currentShader = magoManager.postFxShadersManager.getShader("gBuffer"); 
		currentShader.useProgram();

		var bApplySsao = false;
		var bApplyShadow = false;
		magoManager.effectsManager.setCurrentShader(currentShader);
		gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
		gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
		gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
		gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
		gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
		gl.uniform1i(currentShader.clippingType_loc, 0);
		gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
		gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);

		var projectionMatrixInv = sceneState.getProjectionMatrixInv();
		gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
		var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
		gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

		var glPrimitive = undefined;

		for (var i=0; i<lightSourcesCount; i++)
		{
			lightSourcesArray[i].render(magoManager, currentShader, renderType, glPrimitive);
		}
	}
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderNativeObjects = function(gl, shader, renderType, visibleObjControlerNodes, options) 
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var glPrimitive = undefined;

	var bRenderOpaques = false;
	var bRenderTransparents = false;

	if(options)
	{
		if(options.bRenderOpaques)
		bRenderOpaques = options.bRenderOpaques;

		if(options.bRenderTransparents)
		bRenderTransparents = options.bRenderTransparents;
	}

	// 1rst, opaques.
	if (bRenderOpaques)
	{
		var opaquesArray = visibleObjControlerNodes.currentVisibleNativeObjects.opaquesArray;
		var nativeObjectsCount = opaquesArray.length;
		for (var i=0; i<nativeObjectsCount; i++)
		{
			opaquesArray[i].render(magoManager, shader, renderType, glPrimitive);
		}
	}
	
	// transparents.
	if (bRenderTransparents)
	{
		var transparentsArray = visibleObjControlerNodes.currentVisibleNativeObjects.transparentsArray;
		nativeObjectsCount = transparentsArray.length;
		for (var i=0; i<nativeObjectsCount; i++)
		{
			transparentsArray[i].render(magoManager, shader, renderType, glPrimitive);
		}
	}
	
	// render vectorType objects as opaques.
	if (bRenderOpaques && renderType === 1)
	{
		var vectorTypeObjectsArray = visibleObjControlerNodes.currentVisibleNativeObjects.vectorTypeArray;
		var vectorTypeObjectsCount = vectorTypeObjectsArray.length;
		if (vectorTypeObjectsCount > 0)
		{
			// change shader. use "thickLines" shader.
			var thickLineShader = magoManager.postFxShadersManager.getShader("thickLine"); 
			thickLineShader.useProgram();
			thickLineShader.bindUniformGenerals();
			
			gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
			gl.uniform1i(thickLineShader.colorType_loc, 0);
			gl.uniform2fv(thickLineShader.viewport_loc, [sceneState.drawingBufferWidth, sceneState.drawingBufferHeight]);
			gl.uniform1f(thickLineShader.thickness_loc, 5.0);
				
			for (var i=0; i<vectorTypeObjectsCount; i++)
			{
				vectorTypeObjectsArray[i].render(magoManager, thickLineShader, renderType, glPrimitive);
			}
			
			// return to the current shader.
			shader.useProgram();
		}

		// Test. Check pointsTypeObjectsArray. Test.***
		var pointTypeObjectsArray = visibleObjControlerNodes.currentVisibleNativeObjects.pointTypeArray;
		if (pointTypeObjectsArray)
		{
			var pointTypeObjectsCount = pointTypeObjectsArray.length;
			if (pointTypeObjectsCount > 0)
			{

				// For the moment, never enters here.
				//var sceneState = magoManager.sceneState;
				var shaderLocal = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); // provisional. Use the currentShader of argument.
				shaderLocal.useProgram();
				shaderLocal.disableVertexAttribArrayAll();
				shaderLocal.resetLastBuffersBinded();
				shaderLocal.enableVertexAttribArray(shaderLocal.position3_loc);
				shaderLocal.bindUniformGenerals();
				
				gl.uniform1i(shaderLocal.bPositionCompressed_loc, false);
				gl.uniform1i(shaderLocal.bUse1Color_loc, true);
				gl.uniform4fv(shaderLocal.oneColor4_loc, [1.0, 1.0, 0.1, 1.0]); //.
				gl.uniform1f(shaderLocal.fixPointSize_loc, 10.0);
				gl.uniform1i(shaderLocal.bUseFixPointSize_loc, 1);

				/////////////////////////////////////////////////////////////
				var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
				gl.uniform1i(currentShader.bUseColorCodingByHeight_loc, true);
				gl.uniform1f(currentShader.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
				gl.uniform1f(currentShader.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
				gl.uniform1f(currentShader.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
				gl.uniform1f(currentShader.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
				gl.uniform1f(currentShader.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
				gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
				gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
				gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
				gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
				gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
				///////////////////////////////////////////////////////////////////
				
				var bEnableDepth = true;
				if (bEnableDepth === undefined)
				{ bEnableDepth = true; }
				
				if (bEnableDepth)
				{ gl.enable(gl.DEPTH_TEST); }
				else
				{ gl.disable(gl.DEPTH_TEST); }

				// Render pClouds.
				var geoCoord;
				for (var i=0; i<pointTypeObjectsCount; i++)
				{
					geoCoord = pointTypeObjectsArray[i];
					geoCoord.renderPoint(magoManager, shaderLocal, gl, renderType);
				}
				
				// return to the current shader.
				shader.useProgram();
			}
		}
	}
};

/**
 * This function renders Excavation type objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderExcavationObjects = function(gl, shader, renderType, visibleObjControlerNodes) 
{
	var magoManager = this.magoManager;
	var glPrimitive = undefined;
	
	// excavation
	var excavationsArray = visibleObjControlerNodes.currentVisibleNativeObjects.excavationsArray;
	var nativeObjectsCount = excavationsArray.length;
	for (var i=0; i<nativeObjectsCount; i++)
	{
		excavationsArray[i].render(magoManager, shader, renderType, glPrimitive);
	}
};

/**
 * This function renders the silhouette of an object by the depthTexture of the object.***
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderSilhouette = function() 
{
	// Render screenQuad with effects.
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	
	// Now render screenQuad with the silhouette effect.***
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	
	var currentShader = magoManager.postFxShadersManager.getShader("screenQuad"); 
	currentShader.useProgram();
	
	currentShader.bindUniformGenerals();
	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	
	var bApplyShadow = false;
	var bSilhouette = true;
	var bFxaa = false;
	var bApplySsao = false;

	gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
	gl.uniform1i(currentShader.bSilhouette_loc, bSilhouette);
	gl.uniform1i(currentShader.bFxaa_loc, bFxaa);
	gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao);
	gl.uniform1f(currentShader.uSceneDayNightLightingFactor_loc, 1.0);
	
	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);
	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, silhouetteDepthFbo.colorBuffer);  // silhouette depth texture.***
	gl.activeTexture(gl.TEXTURE3); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	gl.activeTexture(gl.TEXTURE4); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);

	currentShader.last_tex_id = textureAux1x1;
			
	gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.disable(gl.CULL_FACE);
	gl.colorMask(true, true, true, true);
	gl.depthMask(false);
	gl.depthRange(0.0, 0.01);

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.cullFace(gl.FRONT);

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}
	
	this.screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);
	
	// Restore magoManager rendering phase.
	//magoManager.renderingFase = currRenderingPhase;
};

/**
 * This function renders ssao
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenQuadSsao = function(gl) 
{
	// We are using a quadScreen.***
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var camera = sceneState.camera;
	var bufferWidth = sceneState.drawingBufferWidth[0];
	var bufferHeight = sceneState.drawingBufferHeight[0];

	var bApplySsao = true;
	var bApplyShadow = false; // cesium terrain sun shadows. here always "false".
	var bApplyMagoShadow = false; // mago objects sun shadows.
	var bSilhouette = false;
	var bFxaa = false;

	if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
	{ bApplyMagoShadow = true; }


	if (!bApplySsao)
	{ return; }

	var postFxShadersManager = magoManager.postFxShadersManager;
	currentShader = postFxShadersManager.getShader("screenQuad"); 
	postFxShadersManager.useProgram(currentShader);
	currentShader.bindUniformGenerals();

	//gl.uniform1i(currentShader.ssaoTex_loc, 5);
	//gl.uniform1i(currentShader.normalTex_loc, 1);
	//gl.uniform1i(currentShader.albedoTex_loc, 2);

	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	
	gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
	gl.uniform1i(currentShader.bApplyMagoShadow_loc, bApplyMagoShadow);
	gl.uniform1i(currentShader.bSilhouette_loc, bSilhouette);
	gl.uniform1i(currentShader.bFxaa_loc, bFxaa);
	gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao);
	gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	

	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);

	var dayNightLightingFactor = sunSystem.getDayNightLightingFactorOfPosition(camera.position);
	if(dayNightLightingFactor < 0.0)
	dayNightLightingFactor = 0.0;

	gl.uniform1f(currentShader.uSceneDayNightLightingFactor_loc, dayNightLightingFactor);

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();

	if (bApplyMagoShadow)
	{
		// Set sunMatrix uniform.***
		
		var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
		var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
		var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
		var sunDirWC = sunSystem.getSunDirWC();
		
		if (sunLight.tMatrix!== undefined)
		{
			gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
			gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
			gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
			gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
			gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
			gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
			gl.uniform1i(currentShader.sunIdx_loc, 1);
		}
	}

	

	// Bind textures.***
	/*
	for(var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	*/
	
	//gl.bindTexture(gl.TEXTURE_2D, null);  // cesium globeDepthTexture.***
	gl.activeTexture(gl.TEXTURE3); 
	if (bApplyMagoShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(0);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	gl.activeTexture(gl.TEXTURE4); 
	if (bApplyMagoShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(1);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	currentShader.last_tex_id = textureAux1x1;
	
	var depthTex = magoManager.depthTex;
	var normalTex = magoManager.normalTex;
	var albedoTex = magoManager.albedoTex;
	var diffuseLightTex = magoManager.diffuseLightTex;
	var specularLightTex = magoManager.specularLightTex;

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, albedoTex);  // original.***

	if(bApplySsao)
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, depthTex);  // original.***

		var ssaoFromDepthFbo = magoManager.ssaoFromDepthFbo;
		gl.activeTexture(gl.TEXTURE5); // ssaoTex.***
		gl.bindTexture(gl.TEXTURE_2D, ssaoFromDepthFbo.colorBuffer);
		

		gl.activeTexture(gl.TEXTURE1); // normalTex.***
		gl.bindTexture(gl.TEXTURE_2D, normalTex);
	}

	gl.activeTexture(gl.TEXTURE6);
	gl.bindTexture(gl.TEXTURE_2D, diffuseLightTex);  // original.***
	
	//gl.disable(gl.POLYGON_OFFSET_FILL);
	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	//gl.disable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}
	
	this.screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	
	for(var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0+i); // ssaoTex.***
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
};

/**
 * This function renders the ssao by depthBuffer.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderSsaoFromDepth = function(gl) 
{
	// render the ssao to texture, and then apply blur.
	var magoManager = this.magoManager;
	var texManager = magoManager.texturesManager;

	if(!texManager)
	return;

	var sceneState = magoManager.sceneState;
	var bufferWidth = sceneState.drawingBufferWidth[0];
	var bufferHeight = sceneState.drawingBufferHeight[0];

	var ssaoFromDepthFbo = magoManager.ssaoFromDepthFbo;

	// bind ssaoFromDepthBuffer.***
	ssaoFromDepthFbo.bind(); 

	//if (magoManager.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
	}

	var currentShader = magoManager.postFxShadersManager.getShader("ssaoFromDepth"); 
	currentShader.useProgram();
	currentShader.bindUniformGenerals();

	gl.viewport(0, 0, bufferWidth, bufferHeight);
	if (magoManager.isCesiumGlobe())
	{
		gl.uniform1f(currentShader.frustumFar_loc, 40000.0); // only in cesium.***
	}

	var bApplySsao = true;
	gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***

	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);

	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);

	var texManager = magoManager.texturesManager;
	var texturesMergerFbo = texManager.texturesMergerFbo;
	var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
	//var depthTex = magoManager.depthFboNeo.colorBuffer;
	//var normalTex = texManager.generalNormalTexture;

	//var depthTex = texturesMergerFbo.colorBuffer; // original.
	//var normalTex = texturesMergerFbo.colorBuffer1; // original.

	var depthTex = magoManager.depthTex;
	var normalTex = magoManager.normalTex;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTex);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, normalTex);
	

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}

	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);
	
	this.screenQuad.render(magoManager, currentShader);

	// unbind the ssaoFromDepthBuffer.***
	ssaoFromDepthFbo.unbind(); 

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, null);

	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
};

/**
 * This function renders a fast antiAlias.***
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderFastAntiAlias = function(gl) 
{
	// Render screenQuad with effects.
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	
	// Now render screenQuad with the silhouette effect.***
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	
	var currentShader = magoManager.postFxShadersManager.getShader("screenQuad"); 
	currentShader.useProgram();
	
	currentShader.bindUniformGenerals();
	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	
	var bApplyShadow = false;
	var bSilhouette = false;
	var bFxaa = true;
	gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
	gl.uniform1i(currentShader.bSilhouette_loc, bSilhouette);
	gl.uniform1i(currentShader.bFxaa_loc, bFxaa);
	
	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);
	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.colorFbo.colorBuffer);  // silhouette depth texture.***
	gl.activeTexture(gl.TEXTURE3); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	gl.activeTexture(gl.TEXTURE4); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);

	currentShader.last_tex_id = textureAux1x1;
			
	gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.disable(gl.CULL_FACE);
	gl.colorMask(true, true, true, true);
	gl.depthMask(false);
	gl.depthRange(0.0, 0.01);

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.cullFace(gl.FRONT);

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}
	
	this.screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);
};

/**
 * This function renders the shadows of the scene on terrain.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderTerrainCopy = function() 
{
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();
	
	if (magoManager.czm_globeDepthText === undefined)
	{ magoManager.czm_globeDepthText = magoManager.scene._context._us.globeDepthTexture._texture; }

	if (!magoManager.czm_globeDepthText)
	{ return; }

	currentShader = magoManager.postFxShadersManager.getShader("screenCopyQuad"); 
	currentShader.useProgram();
	
	currentShader.bindUniformGenerals();
	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, magoManager.sceneState.normalMatrix4._floatArrays);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform1f(currentShader.far_loc, magoManager.sceneState.camera.frustum.far);
	
	var bApplyShadow = false;
	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);
	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	/*
	if (bApplyShadow)
	{
		// Set sunMatrix uniform.***
		
		var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
		var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
		var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
		var sunDirWC = sunSystem.getSunDirWC();
		
		if (sunLight.tMatrix!== undefined)
		{
			gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
			gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
			gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
			gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
			gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
			gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
			gl.uniform1i(currentShader.sunIdx_loc, 1);
		}
	}
	*/
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.czm_globeDepthText);  // cesium globeDepthTexture.***
	
	gl.activeTexture(gl.TEXTURE3); 
	if (bApplyShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(0);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	gl.activeTexture(gl.TEXTURE4); 
	if (bApplyShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(1);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	currentShader.last_tex_id = textureAux1x1;
			
	
	//gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.disable(gl.CULL_FACE);
	//gl.colorMask(true, true, true, true);
	//gl.depthMask(false);

	//gl.disable(gl.DEPTH_TEST);
	//gl.enable(gl.BLEND);
	//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.cullFace(gl.FRONT);

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}
	
	this.screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	for(var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	//gl.colorMask(true, true, true, true);
	//gl.depthMask(true);
	gl.disable(gl.BLEND);
	//gl.depthRange(0.0, 1.0);	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * This function renders the shadows of the scene on terrain.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderTerrainShadow = function(gl) 
{
	// This function renders shadows on terrain in cesium.***
	// We are using a quadScreen.***
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	
	if (magoManager.czm_globeDepthText === undefined)
	{ magoManager.czm_globeDepthText = magoManager.scene._context._us.globeDepthTexture._texture; }

	if(!magoManager.czm_globeDepthText)
	return;

	var bApplyShadow = false;
	if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
	{ bApplyShadow = true; }

	if (!bApplyShadow || !magoManager.czm_globeDepthText)
	{ return; }

	currentShader = magoManager.postFxShadersManager.getShader("screenQuad"); 
	currentShader.useProgram();
	
	currentShader.bindUniformGenerals();
	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	
	var bSilhouette = false;
	var bFxaa = false;
	var bApplySsao = false;
	var bApplyMagoShadow = false;
	
	gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
	gl.uniform1i(currentShader.bApplyMagoShadow_loc, bApplyMagoShadow);
	gl.uniform1i(currentShader.bSilhouette_loc, bSilhouette);
	gl.uniform1i(currentShader.bFxaa_loc, bFxaa);
	gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao);
	gl.uniform1f(currentShader.uSceneDayNightLightingFactor_loc, 1.0);
	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);
	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	
	if (bApplyShadow)
	{
		// Set sunMatrix uniform.***
		
		var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
		var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
		var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
		var sunDirWC = sunSystem.getSunDirWC();
		
		if (sunLight.tMatrix!== undefined)
		{
			gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
			gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
			gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
			gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
			gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
			gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
			gl.uniform1i(currentShader.sunIdx_loc, 1);
		}
	}
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.czm_globeDepthText);  // cesium globeDepthTexture.***
	gl.activeTexture(gl.TEXTURE3); 
	if (bApplyShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(0);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	gl.activeTexture(gl.TEXTURE4); 
	if (bApplyShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(1);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	currentShader.last_tex_id = textureAux1x1;
			
	
	gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.disable(gl.CULL_FACE);
	gl.colorMask(true, true, true, true);
	gl.depthMask(false);

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.cullFace(gl.FRONT);

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}
	
	this.screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	//gl.depthRange(0.0, 1.0);	
	gl.enable(gl.DEPTH_TEST);
};

/**
 * This function renders the stencil shadows meshes of the scene.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderScreenQuadShadow = function(gl, depthTex) 
{
	// Function no used yet.***
	// Function no used yet.***
	// Function no used yet.***
	//------------------------------------------------
	var currentShader;
	var shaderProgram;
	var neoBuilding;
	var node;
	var rootNode;
	var geoLocDataManager;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;

	var bApplyShadow = false;
	if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
	{ bApplyShadow = true; }

	bApplyShadow = true;

	//if (!bApplyShadow)
	//{ return; }

	currentShader = magoManager.postFxShadersManager.getShader("screenQuad"); 
	currentShader.useProgram();
	
	currentShader.bindUniformGenerals();
	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	
	if (!projectionMatrixInv._floatArrays)
	{ return; }
	
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);
	
	gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);
	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	
	if (bApplyShadow)
	{
		// Set sunMatrix uniform.***
		
		var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
		var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
		var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
		var sunDirWC = sunSystem.getSunDirWC();
		
		if (sunLight.tMatrix!== undefined)
		{
			gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
			gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
			gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
			gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
			gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
			gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
			gl.uniform1i(currentShader.sunIdx_loc, 1);
		}
	}
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTex);  
	gl.activeTexture(gl.TEXTURE3); 
	if (bApplyShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(0);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	gl.activeTexture(gl.TEXTURE4); 
	if (bApplyShadow && sunLight.depthFbo)
	{
		var sunSystem = sceneState.sunSystem;
		var sunLight = sunSystem.getLight(1);
		gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	currentShader.last_tex_id = textureAux1x1;
			
	
	gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.disable(gl.CULL_FACE);
	gl.colorMask(true, true, true, true);
	gl.depthMask(false);

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
	//gl.cullFace(gl.FRONT);

	if (this.screenQuad === undefined)
	{
		this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
	}
	
	this.screenQuad.render(magoManager, currentShader);
		
	
	
	// Restore settings.***
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);	
};

/**
 * This function renders the stencil shadows meshes of the scene.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryStencilShadowMeshes__original = function(gl, renderType, visibleObjControlerNodes) 
{
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	//return;
	
	var currentShader;
	var shaderProgram;
	var neoBuilding;
	var node;
	var rootNode;
	var geoLocDataManager;
	var magoManager = this.magoManager;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	var renderTexture = false;
	//gl.clearStencil(0);
	
	//if (renderType === 3) 
	{
		// SHADOW SETTINGS.**********************************************************************************
		gl.colorMask(false, false, false, false);
		gl.depthMask(false);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.STENCIL_TEST);
		//gl.enable(gl.POLYGON_OFFSET_FILL);
		//gl.polygonOffset(1.0, 2.0); // Original.***
		
		//gl.clear(gl.STENCIL_BUFFER_BIT);
		if (magoManager.isFarestFrustum())
		{ gl.clearStencil(0); }
	
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
		

		var bApplySsao = false;
		var bApplyShadow = false;
		var bApplySpecularLighting = false;
			
		// ssao render.************************************************************************************************************
		var visibleObjectControllerHasRenderables = visibleObjControlerNodes.hasRenderables();
		//if (visibleObjectControllerHasRenderables || magoManager.modeler !== undefined)
		//if (visibleObjControlerNodes.currentVisibles3.length > 0)
		//if (magoManager.currentFrustumIdx === 1)
		{
			
			gl.enable(gl.BLEND);
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, bApplySpecularLighting);

			
			// check if exist clippingPlanes.
			if (magoManager.modeler.clippingBox !== undefined)
			{
				var planesVec4Array = magoManager.modeler.clippingBox.getPlanesRelToEyevec4Array(magoManager);
				var planesVec4FloatArray = new Float32Array(planesVec4Array);
				
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
				gl.uniform1i(currentShader.clippingPlanesCount_loc, 6);
				gl.uniform4fv(currentShader.clippingPlanes_loc, planesVec4FloatArray);
			}
			else 
			{
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
			}
			
			gl.disableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			gl.disableVertexAttribArray(currentShader.color4_loc); 
			
			currentShader.bindUniformGenerals();
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
			gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
			
			// Test sphericalKernel for ssao.************************
			//gl.uniform3fv(currentShader.kernel32_loc, magoManager.sceneState.ssaoSphereKernel32);
			// End test.---------------------------------------------

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			currentShader.last_tex_id = textureAux1x1;
			

			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			
			// temp test excavation, thickLines, etc.***.
			//magoManager.modeler.render(magoManager, currentShader, renderType);
			// excavation objects.
			
			//this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			//this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			gl.stencilMask(0xff);
			
			
			// First pas.****************************************************************************************************
			gl.cullFace(gl.FRONT);
			gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
			gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP);

			////this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);

			
			// Second pass.****************************************************************************************************
			gl.cullFace(gl.BACK);
			gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
			gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP);
			
			////this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);

			
			// native objects.
			//this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);
			
			// 3rd pass.********************************************************************************************************
			// Once finished rendering shadow meshes, then render the screenQuad.
			
			currentShader = magoManager.postFxShadersManager.getShader("screenQuad"); 
			currentShader.useProgram();
			
			gl.disable(gl.POLYGON_OFFSET_FILL);
			//gl.disable(gl.CULL_FACE);
			gl.colorMask(true, true, true, true);
			gl.depthMask(false);
			gl.stencilMask(0x00);

			gl.stencilFunc(gl.EQUAL, 1, 0xff);
			//gl.stencilFunc(gl.LEQUAL, 1, 0xff);
			//gl.stencilFunc(gl.LESS, 1, 0xff);
			//gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE); // stencilOp(fail, zfail, zpass)
			gl.stencilOp(gl.REPLACE, gl.KEEP, gl.REPLACE); // stencilOp(fail, zfail, zpass)

			gl.disable(gl.DEPTH_TEST);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***
			//gl.cullFace(gl.FRONT);
	
			if (this.screenQuad === undefined)
			{
				this.screenQuad = new ScreenQuad(magoManager.vboMemoryManager);
			}
			
			this.screenQuad.render(magoManager, currentShader);

			gl.stencilMask(0xff);
		}
	}
	
	// Restore settings.***
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.disable(gl.STENCIL_TEST);
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);	
};

/**
 * This function is debug function
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenRectangle = function(gl, options) 
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];
	var aspectRatio = screenWidth / screenHeight;

	if (this.quadBuffer === undefined)
	{

		//var data = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1,  1]);
		var data = new Float32Array([0, 0,   0.5, 0,   0, 0.5,   
									 0, 0.5,   0.5, 0,   0.5, 0.5]);
		this.quadBuffer = FBO.createBuffer(gl, data);

		// now, create normalBuffer for use with cubeMaps.
		// zNegative face = 5.
		var normal_3 = new Point3D(1, -1, -1);
		normal_3.unitary();
		var normal_2 = new Point3D(-1, -1, -1);
		normal_2.unitary();
		var normal_1 = new Point3D(-1, 1, -1);
		normal_1.unitary();
		var normal_0 = new Point3D(1, 1, -1);
		normal_0.unitary();
		//--------------------------------------------

		// yPositive face = 2.
		normal_3 = new Point3D(1, 1, 1);
		normal_3.unitary();
		normal_2 = new Point3D(-1, 1, 1);
		normal_2.unitary();
		normal_1 = new Point3D(-1, 1, -1);
		normal_1.unitary();
		normal_0 = new Point3D(1, 1, -1);
		normal_0.unitary();
		//------------------------------------------
		/*
		// yNegative face = 3.
		normal_3 = new Point3D(1, 1, 1);
		normal_3.unitary();
		normal_2 = new Point3D(-1, 1, 1);
		normal_2.unitary();
		normal_1 = new Point3D(-1, 1, -1);
		normal_1.unitary();
		normal_0 = new Point3D(1, 1, -1);
		normal_0.unitary();
		*/
		//------------------------------------------

		var nor = new Float32Array([normal_0.x, normal_0.y, normal_0.z,   normal_1.x, normal_1.y, normal_1.z,   normal_3.x, normal_3.y, normal_3.z,
									normal_3.x, normal_3.y, normal_3.z,   normal_1.x, normal_1.y, normal_1.z,   normal_2.x, normal_2.y, normal_2.z]);
		this.normalBuffer = FBO.createBuffer(gl, nor);
	}

	// use a simple shader.
	
	var postFxShadersManager = magoManager.postFxShadersManager;

	if (postFxShadersManager === undefined)
	{ return; }
	
	var currShader = postFxShadersManager.getCurrentShader(); // to restore current active shader.
	var shader =  postFxShadersManager.getShader("rectangleScreen"); // very simple shader.
	postFxShadersManager.useProgram(shader);

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i); 
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	gl.enableVertexAttribArray(shader.position2_loc);
	FBO.bindAttribute(gl, this.quadBuffer, shader.position2_loc, 2);

	gl.enableVertexAttribArray(shader.normal3_loc);
	FBO.bindAttribute(gl, this.normalBuffer, shader.normal3_loc, 3);

	// If you want to see selectionBuffer.
	//var texture = magoManager.selectionFbo.colorBuffer; // framebuffer for color selection.***

	// If you want to see silhouetteDepthBuffer.
	var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();
	var texture = silhouetteDepthFbo.colorBuffer;

	//if(magoManager.laserCamera)
	//{
	//	var options = {};
	//	var laserCamDepthFBO = magoManager.laserCamera.getDepthBufferFBO(magoManager, options);
	//	texture = laserCamDepthFBO.colorBuffer;
	//}

	

	if(magoManager.depthTex)
	{
		texture = magoManager.depthTex;
	}

	
	var depthFboNeo = magoManager.depthFboNeo;
	if(depthFboNeo.colorBuffer)
	{
		//texture = depthFboNeo.colorBuffer;
	}
	

	if(magoManager.normalTex)
	{
		texture = magoManager.normalTex;
	}

	if(magoManager.albedoTex)
	{
		//texture = magoManager.albedoTex;
	}

	if(magoManager.diffuseLightTex)
	{
		//texture = magoManager.diffuseLightTex;
	}

	if(magoManager.specularLightTex)
	{
		//texture = magoManager.specularLightTex;
	}

	/*
	var sunSystem = sceneState.sunSystem;
	if(sunSystem)
	{
		var sunLight = sunSystem.getLight(0);
		if(sunLight && sunLight.depthFbo && sunLight.depthFbo.colorBuffer)
		{
			texture = sunLight.depthFbo.colorBuffer;
		}
		
	}
	*/
	if(magoManager.scene._context._us.globeDepthTexture._texture)
	{
		//texture = magoManager.scene._context._us.globeDepthTexture._texture;
	}
	

	if (texture === undefined)
	{ return; }

	gl.activeTexture(gl.TEXTURE0 + 0); 
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.uniform1i(shader.uTextureType_loc, 0); // 2dTexture.

	///////////////////////////////////////////////////////////////////////////
	/*
	if(options)
	{
		var light = options.lightSource;
		if(light)
		{
			var lightFbo = light._getCubeMapFrameBuffer(gl);
			if(lightFbo)
			{
				texture = lightFbo.colorBuffer;
				gl.activeTexture(gl.TEXTURE0 + 1); 
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
				gl.uniform1i(shader.uTextureType_loc, 1); // cubeMap.
			}
		}
	};
	*/
	///////////////////////////////////////////////////////////////////////////


	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);
	//gl.enable(gl.BLEND);

	gl.drawArrays(gl.TRIANGLES, 0, 6);


	postFxShadersManager.useProgram(null);
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	gl.bindTexture(gl.TEXTURE_2D, null);

};

/**
 * This function renders screenSpaceObjects.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenSpaceObjects = function(gl) 
{
	var magoManager = this.magoManager;
	var modeler = magoManager.modeler;
	var sceenSpaceObjectsCount = modeler.screenSpaceObjectsArray.length;

	for(var i=0; i<sceenSpaceObjectsCount; i++)
	{
		var screenSpaceObject = modeler.screenSpaceObjectsArray[i];

		
	}
};

/**
 * This function renders lightBuffer.
 * @param {Array} lightSourcesArray .
 */
Renderer.prototype.renderLightDepthCubeMaps = function (lightSourcesArray) 
{
	var magoManager = this.magoManager;
	var lightSourcesCount = lightSourcesArray.length;

	if(lightSourcesCount === 0)
	return;

	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;
	
	var currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
	//var currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
	currentShader.resetLastBuffersBinded();
	//shaderProgram = currentShader.program;

	currentShader.useProgram();
	magoManager.effectsManager.setCurrentShader(currentShader);
	currentShader.disableVertexAttribArrayAll();
	currentShader.enableVertexAttribArray(currentShader.position3_loc);
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.bHasTexture_loc , false);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	//gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, false);

	//currentShader.bindUniformGenerals();
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
	gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao.***
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	gl.depthRange(0.0, 1.0);
	//gl.depthFunc(gl.LEQUAL);
	gl.depthMask(true);
	gl.disable(gl.BLEND);

	var light;
	var objects;
	var renderTexture = undefined;
	var renderType = 0;
	var minSizeToRender = undefined;
	var refTMatrixIdxKey = 0;

	var options = {
		bRenderOpaques : true,
		bRenderTransparents : false
	};

	for (var i=0; i<lightSourcesCount; i++)
	{
		light = lightSourcesArray[i];

		if(light.bCubeMapMade)
		continue;

		var visibleObjectsControler = light.visibleObjectsControler;

		if(!visibleObjectsControler)
		continue;

		var visibleNodesCount = visibleObjectsControler.currentVisibles0.length;
		var visibleNativesCount = visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;

		//if(visibleNodesCount === 0 && visibleNativesCount === 0)
		//continue;

		var geoLocDataManager = light.getGeoLocDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();

		gl.uniform3fv(currentShader.encodedCameraPositionMCHigh_loc, geoLocData.positionHIGH);
		gl.uniform3fv(currentShader.encodedCameraPositionMCLow_loc, geoLocData.positionLOW);

		// Take the cubeMap of the light.
		for(var face = 0; face<6; face++)
		{

			light.bindCubeMapFrameBuffer(face, magoManager);
			var mvpMatRelToEye = light.getModelViewProjectionMatrixRelToEye(face);
			var mvMatRelToEye = light.getModelViewMatrixRelToEye(face);

			var refMatrixType = 0;
  			gl.uniform1i(currentShader.refMatrixType_loc, refMatrixType);

			gl.uniformMatrix4fv(currentShader.mvpRelToEyeMatrix_loc, false, mvpMatRelToEye._floatArrays);
			gl.uniformMatrix4fv(currentShader.mvRelToEyeMatrix_loc, false, mvMatRelToEye._floatArrays);
			gl.uniform1f(currentShader.frustumFar_loc, light.falloffDistance);
			
			magoManager.swapRenderingFase();
			this.renderNodes(gl, visibleObjectsControler.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			// native objects.
			this.renderNativeObjects(gl, currentShader, renderType, visibleObjectsControler, options);
		}

		light.bCubeMapMade = true;
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.enable(gl.CULL_FACE);
};

/**
 * This function renders lightBuffer.
 * @param {Array} lightSourcesArray .
 */
Renderer.prototype.renderLightBuffer = function(lightSourcesArray) 
{
	var magoManager = this.magoManager;
	var lightSourcesCount = lightSourcesArray.length;

	if(lightSourcesCount === 0)
	return;

	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;

	var lBuffer = magoManager.lBuffer;
	lBuffer.bind();

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var extbuffers = lBuffer.extbuffers;

	gl.bindTexture(gl.TEXTURE_2D, magoManager.diffuseLightTex);  
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0], 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 

	gl.bindTexture(gl.TEXTURE_2D, magoManager.specularLightTex);  
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0], 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
	

	// Bind mago colorTextures:
	gl.framebufferTexture2D(gl.FRAMEBUFFER, lBuffer.extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, magoManager.diffuseLightTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, lBuffer.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.specularLightTex, 0);

	extbuffers.drawBuffersWEBGL([
		lBuffer.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - diffuseLighting
		lBuffer.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - specularLighting
	]);
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
	gl.clearColor(0, 0, 0, 0);
	gl.clearDepth(1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0, 0, 0, 1);

	// bind LBuffer shader.
	var bApplySsao = false;
	var bApplyShadow = sceneState.applyLightsShadows;

	var currentShader = magoManager.postFxShadersManager.getShader("lBuffer"); 
	magoManager.postFxShadersManager.useProgram(currentShader);
	magoManager.effectsManager.setCurrentShader(currentShader);
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform1i(currentShader.bApplyShadows_loc, bApplyShadow);

	//var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	//gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
	//var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	//gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

	gl.enableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	gl.enableVertexAttribArray(currentShader.normal3_loc);
	if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
	
	currentShader.bindUniformGenerals();
	// After bindUniformsGenerals, must bind a large projectionMatrix-mvpMatRelToEye.
	gl.uniformMatrix4fv(currentShader.ModelViewProjectionMatrixRelToEye_loc, false, sceneState.modelViewProjRelToEyeMatrixLighting._floatArrays);
	var mvMatRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
	gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, mvMatRelToEyeInv._floatArrays);

	gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
	gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
	gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.

	gl.uniform1i(currentShader.normalTex_loc, 1);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.normalTex);

	gl.frontFace(gl.CW);	
	//gl.enable(gl.DEPTH_TEST);
	//gl.depthFunc(gl.GREATER);
	//gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE);
	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);

	var light;
	var renderType = 1;
	var glPrimitive = undefined;
	var bIsSelected = undefined;
	for(var i=0; i<lightSourcesCount; i++)
	{
		light = lightSourcesArray[i];
		var lightDirWC = light.getLightDirectionWC();
		//var lightDist = light.getLightHotDistance();
		//var maxSpotDot = light.getMaxSpotDot();
		var cubeMapFbo = light._getCubeMapFrameBuffer(gl); // light's depthCubeMap
		var geoLoc = light.geoLocDataManager.getCurrentGeoLocationData();
		var buildingRotMatInv = geoLoc.getRotMatrixInv();
		gl.uniformMatrix4fv(currentShader.buildingRotMatrixInv_loc, false, buildingRotMatInv._floatArrays);
		
		// set the light direction WC.
		gl.uniform3fv(currentShader.lightDirWC_loc, [lightDirWC.x, lightDirWC.y, lightDirWC.z]); //.
		gl.uniform3fv(currentShader.uLightColorAndBrightness_loc, [1.0, 1.0, 1.0]); //.
		var lightParams = light.getLightParameters(); //uLightParameters[4]; // 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.
		gl.uniform1fv(currentShader.uLightParameters_loc, lightParams);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapFbo.colorBuffer);
		
		light.render(magoManager, currentShader, renderType, glPrimitive, bIsSelected);
	}

	magoManager.postFxShadersManager.useProgram(null);

	gl.disable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthMask(true);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	//gl.depthFunc(gl.LEQUAL);

	lBuffer.unbind();
};

/**
 * This function renders geometryBuffer.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryBuffer = function(gl, renderType, visibleObjControlerNodes) 
{
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	var renderTexture = false;
	var selectionManager = magoManager.selectionManager;

	gl.disable(gl.BLEND); // No blend in GBuffer.
	
	//if (renderType === 0 ) 
	//{
	//	// Draw the axis.***
	//	if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
	//	{
	//		this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
	//	}
	//	
	//}
	if (renderType === 1 )//&& magoManager.currentFrustumIdx === 1) 
	{
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
		
		magoManager.currentProcess = CODE.magoCurrentProcess.ColorRendering;
		
		// Set default blending setting.
		//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

		var bApplySsao = false;
		var bApplyShadow = false;
		if (magoManager.currentFrustumIdx < 2)
		{ bApplySsao = sceneState.getApplySsao(); }
	
		if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
		{ bApplyShadow = true; }

	
		
		// check changesHistory.
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles0);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles0);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles2);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles3);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles3);
			
		// ssao render.************************************************************************************************************
		var visibleObjectControllerHasRenderables = visibleObjControlerNodes.hasRenderables();
		if (visibleObjectControllerHasRenderables || magoManager.modeler !== undefined)
		{
			currentShader = magoManager.postFxShadersManager.getShader("gBuffer"); 
			magoManager.postFxShadersManager.useProgram(currentShader);
			magoManager.effectsManager.setCurrentShader(currentShader);
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform1i(currentShader.clippingType_loc, 0);
			gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);

			var projectionMatrixInv = sceneState.getProjectionMatrixInv();
			gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
			var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
			gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

			var sunSystem = magoManager.sceneState.sunSystem;
			var sunLight = sunSystem.getLight(0);
			if (bApplyShadow)
			{
				// Set sunMatrix uniform.***
				var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
				var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
				var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
				var sunDirWC = sunSystem.getSunDirWC();
				
				if (sunLight.tMatrix!== undefined)
				{
					gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
					gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
					gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
					gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
					gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
					gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
					gl.uniform1i(currentShader.sunIdx_loc, 1);
				}
			}
			
			// check if exist clippingPlanes.
			if (magoManager.modeler.clippingBox !== undefined)
			{
				var planesVec4Array = magoManager.modeler.clippingBox.getPlanesRelToEyevec4Array(magoManager);
				var planesVec4FloatArray = new Float32Array(planesVec4Array);
				
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
				gl.uniform1i(currentShader.clippingPlanesCount_loc, 6);
				gl.uniform4fv(currentShader.clippingPlanes_loc, planesVec4FloatArray);
			}
			else 
			{
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
			}
			
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
			gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
			gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
			gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
			
			// Test sphericalKernel for ssao.************************
			//gl.uniform3fv(currentShader.kernel32_loc, magoManager.sceneState.ssaoSphereKernel32);
			// End test.---------------------------------------------

			//gl.activeTexture(gl.TEXTURE0);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			//gl.activeTexture(gl.TEXTURE5);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.ssaoFromDepthFbo.colorBuffer);
			currentShader.last_tex_id = textureAux1x1;
			
			gl.activeTexture(gl.TEXTURE3); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(0);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}
			
			gl.activeTexture(gl.TEXTURE4); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(1);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}

			/*
			if (MagoConfig.getPolicy().geo_cull_face_enable === "true") 
			{ gl.enable(gl.CULL_FACE); }
			else 
			{ gl.disable(gl.CULL_FACE); }
			*/
			gl.enable(gl.CULL_FACE);
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			
			// temp test excavation, thickLines, etc.***.
			//magoManager.modeler.render(magoManager, currentShader, renderType);
			// excavation objects.
			
			// after render native geometries, set current shader with "modelRefSsao" shader.
			currentShader = magoManager.postFxShadersManager.getShader("gBuffer"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.clippingType_loc, 0);
			
			//this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 
			
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			// native objects.
			var options = {
				bRenderOpaques : true,
	 			bRenderTransparents : false
			};
			this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
			gl.uniform1i(currentShader.clippingType_loc, 0); // 0= no clipping.***
			
			currentShader.disableVertexAttribArrayAll();
			magoManager.postFxShadersManager.useProgram(null);
		}

		// draw the axis.***
		if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
		{
			this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
		}
		
		// 4) Render ObjectMarkers.********************************************************************************************************
		magoManager.objMarkerManager.render(magoManager, renderType); 

		// test renders.***
		// render cctv.***
		/*
		magoManager.test_cctv();
		var cctvsCount = 0;
		if (magoManager.cctvList !== undefined)
		{
			cctvsCount = magoManager.cctvList.getCCTVCount();
		}
		if (cctvsCount > 0)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			magoManager.cctvList.render(magoManager, currentShader );
		}
		*/
		
		// PointsCloud.****************************************************************************************
		// PointsCloud.****************************************************************************************
		var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			magoManager.sceneState.camera.setCurrentFrustum(0);
			var frustumIdx = magoManager.currentFrustumIdx;
			magoManager.sceneState.camera.frustum.near[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].near[0];
			magoManager.sceneState.camera.frustum.far[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].far[0];
			
			if (renderingSettings.getApplySsao())
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } 
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			else
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } // change this for "pointsCloud_rainbow" todo:
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			currentShader.useProgram();
			currentShader.resetLastBuffersBinded();
			currentShader.enableVertexAttribArray(currentShader.position3_loc);
			currentShader.enableVertexAttribArray(currentShader.color4_loc);
			currentShader.bindUniformGenerals();
			
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (magoManager.pointsCloudWhite !== undefined && magoManager.pointsCloudWhite)
			{
				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [0.99, 0.99, 0.99, 1.0]); //.***
			}
			else 
			{
				gl.uniform1i(currentShader.bUse1Color_loc, false);
			}
			var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
			gl.uniform1i(currentShader.bUseColorCodingByHeight_loc, true);
			gl.uniform1f(currentShader.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
			gl.uniform1f(currentShader.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
			gl.uniform1f(currentShader.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
			gl.uniform1f(currentShader.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
			gl.uniform1f(currentShader.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
			gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			
			// Bind textures.***
			var texManager = magoManager.texturesManager;
			var texturesMergerFbo = texManager.texturesMergerFbo;
			var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
			var depthTex = texturesMergerFbo.colorBuffer;
			var normalTex = texturesMergerFbo.colorBuffer1;
			/*
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			//gl.bindTexture(gl.TEXTURE_2D, depthTex);
			gl.activeTexture(gl.TEXTURE6);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			gl.bindTexture(gl.TEXTURE_2D, normalTex);
			*/
			// Test to load pCloud.***
			if (magoManager.visibleObjControlerPCloudOctrees === undefined)
			{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			magoManager.visibleObjControlerPCloudOctrees.clear();
			this.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShader, renderTexture, renderType); // lod0.***
			currentShader.disableVertexAttribArrayAll();
			
			gl.useProgram(null);

			// Now, load pointsCloud.
			var visiblesSortedOctreesArray = magoManager.visibleObjControlerPCloudOctrees.currentVisibles0; // original.
			var octreesCount = visiblesSortedOctreesArray.length;
			var loadCount = 0;
		
			if (!magoManager.isCameraMoving && !magoManager.mouseLeftDown && !magoManager.mouseMiddleDown) 
			{
			  for (var i = 0; i < octreesCount; i++) 
			  {
				var octree = visiblesSortedOctreesArray[i];
		
				if (octree.preparePCloudData(magoManager)) {
				  loadCount++;
				}
		
				if (loadCount > 1) {
				  break;
				}
			  }
			}

		}
	}

	gl.depthRange(0.0, 1.0);	
};

/**
 * This function renders geometryBuffer for transparent objects.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryBufferTransparents = function(gl, renderType, visibleObjControlerNodes) 
{
	gl.frontFace(gl.CCW);	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	var renderTexture = false;
	var selectionManager = magoManager.selectionManager;

	gl.enable(gl.BLEND); // In this render pass enable blending.
	gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	
	if (renderType === 1 )//&& magoManager.currentFrustumIdx === 1) 
	{
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
		
		magoManager.currentProcess = CODE.magoCurrentProcess.ColorRendering;
		
		var bApplySsao = false;
		var bApplyShadow = false;
		if (magoManager.currentFrustumIdx < 2)
		{ bApplySsao = sceneState.getApplySsao(); }
	
		if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
		{ bApplyShadow = true; }

		// check changesHistory.
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles0);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles0);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles2);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles3);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles3);
			
		// ssao render.************************************************************************************************************
		var visibleObjectControllerHasRenderables = visibleObjControlerNodes.hasRenderables();
		if (visibleObjectControllerHasRenderables || magoManager.modeler !== undefined)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			magoManager.postFxShadersManager.useProgram(currentShader);
			magoManager.effectsManager.setCurrentShader(currentShader);
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform1i(currentShader.clippingType_loc, 0);
			gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);

			var projectionMatrixInv = sceneState.getProjectionMatrixInv();
			gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
			var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
			gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

			var sunSystem = magoManager.sceneState.sunSystem;
			var sunLight = sunSystem.getLight(0);
			if (bApplyShadow)
			{
				// Set sunMatrix uniform.***
				var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
				var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
				var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
				var sunDirWC = sunSystem.getSunDirWC();
				
				if (sunLight.tMatrix!== undefined)
				{
					gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
					gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
					gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
					gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
					gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
					gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
					gl.uniform1i(currentShader.sunIdx_loc, 1);
				}
			}
			
			// check if exist clippingPlanes.
			if (magoManager.modeler.clippingBox !== undefined)
			{
				var planesVec4Array = magoManager.modeler.clippingBox.getPlanesRelToEyevec4Array(magoManager);
				var planesVec4FloatArray = new Float32Array(planesVec4Array);
				
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
				gl.uniform1i(currentShader.clippingPlanesCount_loc, 6);
				gl.uniform4fv(currentShader.clippingPlanes_loc, planesVec4FloatArray);
			}
			else 
			{
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
			}
			
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
			gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
			gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
			gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
			
			// Test sphericalKernel for ssao.************************
			//gl.uniform3fv(currentShader.kernel32_loc, magoManager.sceneState.ssaoSphereKernel32);
			// End test.---------------------------------------------

			//gl.activeTexture(gl.TEXTURE0);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthTex);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			//gl.activeTexture(gl.TEXTURE5);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.ssaoFromDepthFbo.colorBuffer);
			currentShader.last_tex_id = textureAux1x1;
			
			gl.activeTexture(gl.TEXTURE3); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(0);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}
			
			gl.activeTexture(gl.TEXTURE4); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(1);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}


			gl.enable(gl.CULL_FACE);
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			
			// temp test excavation, thickLines, etc.***.
			magoManager.modeler.render(magoManager, currentShader, renderType);
			// excavation objects.
			
			// after render native geometries, set current shader with "modelRefSsao" shader.
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.clippingType_loc, 0);
			
			this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0Transparents, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 
			
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2Transparents, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3Transparents, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			// native objects.
			var options = {
				bRenderOpaques : false,
	 			bRenderTransparents : true
			};
			this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
			gl.uniform1i(currentShader.clippingType_loc, 0); // 0= no clipping.***
			
			currentShader.disableVertexAttribArrayAll();
			magoManager.postFxShadersManager.useProgram(null);
		}

		// draw the axis.***
		if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
		{
			this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
		}
		
		// 4) Render ObjectMarkers.********************************************************************************************************
		magoManager.objMarkerManager.render(magoManager, renderType); 

		// test renders.***
		// render cctv.***
		/*
		magoManager.test_cctv();
		var cctvsCount = 0;
		if (magoManager.cctvList !== undefined)
		{
			cctvsCount = magoManager.cctvList.getCCTVCount();
		}
		if (cctvsCount > 0)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			magoManager.cctvList.render(magoManager, currentShader );
		}
		*/
		
		// PointsCloud.****************************************************************************************
		// PointsCloud.****************************************************************************************
		var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			magoManager.sceneState.camera.setCurrentFrustum(0);
			var frustumIdx = magoManager.currentFrustumIdx;
			magoManager.sceneState.camera.frustum.near[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].near[0];
			magoManager.sceneState.camera.frustum.far[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].far[0];
			
			if (renderingSettings.getApplySsao())
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } 
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			else
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } // change this for "pointsCloud_rainbow" todo:
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			currentShader.useProgram();
			currentShader.resetLastBuffersBinded();
			currentShader.enableVertexAttribArray(currentShader.position3_loc);
			currentShader.enableVertexAttribArray(currentShader.color4_loc);
			currentShader.bindUniformGenerals();
			
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (magoManager.pointsCloudWhite !== undefined && magoManager.pointsCloudWhite)
			{
				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [0.99, 0.99, 0.99, 1.0]); //.***
			}
			else 
			{
				gl.uniform1i(currentShader.bUse1Color_loc, false);
			}
			var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
			gl.uniform1i(currentShader.bUseColorCodingByHeight_loc, true);
			gl.uniform1f(currentShader.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
			gl.uniform1f(currentShader.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
			gl.uniform1f(currentShader.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
			gl.uniform1f(currentShader.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
			gl.uniform1f(currentShader.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
			gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			
			// Bind textures.***
			var texManager = magoManager.texturesManager;
			var texturesMergerFbo = texManager.texturesMergerFbo;
			var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
			var depthTex = texturesMergerFbo.colorBuffer;
			var normalTex = texturesMergerFbo.colorBuffer1;
			/*
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			//gl.bindTexture(gl.TEXTURE_2D, depthTex);
			gl.activeTexture(gl.TEXTURE6);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			gl.bindTexture(gl.TEXTURE_2D, normalTex);
			*/
			// Test to load pCloud.***
			if (magoManager.visibleObjControlerPCloudOctrees === undefined)
			{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			magoManager.visibleObjControlerPCloudOctrees.clear();
			this.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShader, renderTexture, renderType); // lod0.***
			currentShader.disableVertexAttribArrayAll();
			
			gl.useProgram(null);

			// Now, load pointsCloud.
			var visiblesSortedOctreesArray = magoManager.visibleObjControlerPCloudOctrees.currentVisibles0; // original.
			var octreesCount = visiblesSortedOctreesArray.length;
			var loadCount = 0;
		
			if (!magoManager.isCameraMoving && !magoManager.mouseLeftDown && !magoManager.mouseMiddleDown) 
			{
			  for (var i = 0; i < octreesCount; i++) 
			  {
				var octree = visiblesSortedOctreesArray[i];
		
				if (octree.preparePCloudData(magoManager)) {
				  loadCount++;
				}
		
				if (loadCount > 1) {
				  break;
				}
			  }
			}

		}
	}
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);	
};


/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometry = function(gl, renderType, visibleObjControlerNodes) 
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
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	var renderTexture = false;
	var selectionManager = magoManager.selectionManager;
	
	if (renderType === 0 ) 
	{
		gl.disable(gl.BLEND);
		this.renderGeometryDepth(gl, renderType, visibleObjControlerNodes);
		
		// Draw the axis.***
		//if (selectionManager && magoManager.magoPolicy.getShowOrigin() && selectionManager.getSelectedF4dNode() !== undefined)
		if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
		{
			this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
		}

		
		//sceneState.applySunShadows = true;
		// SunLight.***
		if (sceneState.applySunShadows && !this.isCameraMoving && !this.mouseLeftDown && !this.mouseMiddleDown)
		{
			visibleObjControlerNodes.calculateBoundingFrustum(sceneState.camera);
		
			var sunSystem = sceneState.sunSystem;
			var sunLightsCount = sunSystem.lightSourcesArray.length;
			for (var i=0; i<sunLightsCount; i++)
			{
				var sunLight = sunSystem.getLight(i);
				var imageWidth = sunLight.targetTextureWidth;
				var imageHeight = sunLight.targetTextureHeight;
				
				if (sunLight.depthFbo === undefined) 
				{ 
					sunLight.depthFbo = new FBO(gl, imageWidth, imageHeight ); 
				}
				
				// Must swap rendering phase before render depth from the sun.***
				magoManager.swapRenderingFase();
				
				sunLight.depthFbo.bind();
				if (magoManager.isFarestFrustum())
				{
					gl.clearColor(1, 1, 1, 1);
					gl.clearDepth(1);
					gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				}
				gl.viewport(0, 0, imageWidth, imageHeight);
				
				this._renderDepthSunPointOfView(gl, visibleObjControlerNodes, sunLight, sunSystem);
				
				sunLight.depthFbo.unbind();
			}
			
			magoManager.depthFboNeo.bind(); 
			gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
			gl.clearColor(0, 0, 0, 1); // alpha must be 1 in preMultiplied gl.***

			
		}
		
	}
	if (renderType === 1 )//&& magoManager.currentFrustumIdx === 1) 
	{
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
		
		magoManager.currentProcess = CODE.magoCurrentProcess.ColorRendering;
		
		// Set default blending setting.
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		
		// Test TinTerrain.**************************************************************************
		// Test TinTerrain.**************************************************************************
		// render tiles, rendertiles.***
		
		if (magoManager.tinTerrainManager !== undefined)
		{
			gl.enable(gl.BLEND);
			// Atmosphere.*******************************************************************************
			this.renderAtmosphere(gl, renderType);

			//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
			var bDepthRender = false; // magoManager is no depth render.***
			magoManager.tinTerrainManager.render(magoManager, bDepthRender, renderType);
		}

		var bApplySsao = false;
		var bApplyShadow = false;
		if (magoManager.currentFrustumIdx < 2)
		{ bApplySsao = sceneState.getApplySsao(); }
	
		if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
		{ bApplyShadow = true; }

	
		
		// check changesHistory.
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles0);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles0);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles2);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles2);
		
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes.currentVisibles3);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes.currentVisibles3);
			
		// ssao render.************************************************************************************************************
		var visibleObjectControllerHasRenderables = visibleObjControlerNodes.hasRenderables();
		if (visibleObjectControllerHasRenderables || magoManager.modeler !== undefined)
		{
			
			gl.enable(gl.BLEND);
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			magoManager.effectsManager.setCurrentShader(currentShader);
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			gl.uniform1i(currentShader.bApplyShadow_loc, bApplyShadow);
			gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform1i(currentShader.clippingType_loc, 0);

			var projectionMatrixInv = sceneState.getProjectionMatrixInv();
			gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
			var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
			gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

			var sunSystem = magoManager.sceneState.sunSystem;
			var sunLight = sunSystem.getLight(0);
			if (bApplyShadow)
			{
				// Set sunMatrix uniform.***
				var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
				var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
				var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
				var sunDirWC = sunSystem.getSunDirWC();
				
				if (sunLight.tMatrix!== undefined)
				{
					gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
					gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
					gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
					gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
					gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
					gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
					gl.uniform1i(currentShader.sunIdx_loc, 1);
				}
			}
			
			// check if exist clippingPlanes.
			if (magoManager.modeler.clippingBox !== undefined)
			{
				var planesVec4Array = magoManager.modeler.clippingBox.getPlanesRelToEyevec4Array(magoManager);
				var planesVec4FloatArray = new Float32Array(planesVec4Array);
				
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
				gl.uniform1i(currentShader.clippingPlanesCount_loc, 6);
				gl.uniform4fv(currentShader.clippingPlanes_loc, planesVec4FloatArray);
			}
			else 
			{
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
			}
			
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			gl.enableVertexAttribArray(currentShader.normal3_loc);
			if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
			
			currentShader.bindUniformGenerals();
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
			gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
			gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
			gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
			
			// Test sphericalKernel for ssao.************************
			//gl.uniform3fv(currentShader.kernel32_loc, magoManager.sceneState.ssaoSphereKernel32);
			// End test.---------------------------------------------

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			gl.activeTexture(gl.TEXTURE5);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.ssaoFromDepthFbo.colorBuffer);
			currentShader.last_tex_id = textureAux1x1;
			
			gl.activeTexture(gl.TEXTURE3); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(0);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}
			
			gl.activeTexture(gl.TEXTURE4); 
			if (bApplyShadow && sunLight.depthFbo)
			{
				var sunLight = sunSystem.getLight(1);
				gl.bindTexture(gl.TEXTURE_2D, sunLight.depthFbo.colorBuffer);
			}
			else 
			{
				gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			}

			/*
			if (MagoConfig.getPolicy().geo_cull_face_enable === "true") 
			{ gl.enable(gl.CULL_FACE); }
			else 
			{ gl.disable(gl.CULL_FACE); }
			*/
			gl.enable(gl.CULL_FACE);
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			
			// temp test excavation, thickLines, etc.***.
			magoManager.modeler.render(magoManager, currentShader, renderType);
			// excavation objects.
			
			// after render native geometries, set current shader with "modelRefSsao" shader.
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.useProgram();
			gl.uniform1i(currentShader.clippingType_loc, 0);
			
			this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 
			
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			// native objects.
			this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			gl.uniform1i(currentShader.clippingType_loc, 0); // 0= no clipping.***
			
			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);
		}

		// draw the axis.***
		if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
		{
			this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
		}
		
		// Render Animated Man.********************************************************************************************************************
		
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		// Test Modeler Rendering.********************************************************************
		/*
		if (magoManager.modeler !== undefined)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			currentShader.resetLastBuffersBinded();
			shaderProgram = currentShader.program;

			currentShader.useProgram();
			currentShader.disableVertexAttribArrayAll();
			currentShader.enableVertexAttribArray(currentShader.position3_loc);

			currentShader.bindUniformGenerals();
			
			gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao.***

			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set this var here.***
			magoManager.modeler.render(magoManager, currentShader, renderType);

			currentShader.disableVertexAttribArrayAll();
			gl.useProgram(null);

		}
		*/
		
		// 3) now render bboxes.*******************************************************************************************************************
		if (visibleObjectControllerHasRenderables)
		{
			if (magoManager.magoPolicy.getShowBoundingBox())
			{
				
				var bRenderLines = true;
				//var currentVisiblesArray = visibleObjControlerNodes.currentVisibles0.concat(visibleObjControlerNodes.currentVisibles2,);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisibles0, undefined, bRenderLines);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisibles2, undefined, bRenderLines);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisibles3, undefined, bRenderLines);
				this.renderBoundingBoxesNodes(magoManager.visibleObjControlerNodes.currentVisiblesAux, undefined, bRenderLines);
			}
		}
		
		// 4) Render ObjectMarkers.********************************************************************************************************
		magoManager.objMarkerManager.render(magoManager, renderType); 

		// test renders.***
		// render cctv.***
		/*
		magoManager.test_cctv();
		var cctvsCount = 0;
		if (magoManager.cctvList !== undefined)
		{
			cctvsCount = magoManager.cctvList.getCCTVCount();
		}
		if (cctvsCount > 0)
		{
			currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
			magoManager.cctvList.render(magoManager, currentShader );
		}
		*/
		
		// PointsCloud.****************************************************************************************
		// PointsCloud.****************************************************************************************
		var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			magoManager.sceneState.camera.setCurrentFrustum(0);
			var frustumIdx = magoManager.currentFrustumIdx;
			magoManager.sceneState.camera.frustum.near[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].near[0];
			magoManager.sceneState.camera.frustum.far[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].far[0];
			
			if (renderingSettings.getApplySsao())
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } 
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			else
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } // change this for "pointsCloud_rainbow" todo:
				else
				{ currentShader = magoManager.postFxShadersManager.getShader("pointsCloud"); } 
			}
			currentShader.useProgram();
			currentShader.resetLastBuffersBinded();
			currentShader.enableVertexAttribArray(currentShader.position3_loc);
			currentShader.enableVertexAttribArray(currentShader.color4_loc);
			currentShader.bindUniformGenerals();
			
			gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (magoManager.pointsCloudWhite !== undefined && magoManager.pointsCloudWhite)
			{
				gl.uniform1i(currentShader.bUse1Color_loc, true);
				gl.uniform4fv(currentShader.oneColor4_loc, [0.99, 0.99, 0.99, 1.0]); //.***
			}
			else 
			{
				gl.uniform1i(currentShader.bUse1Color_loc, false);
			}
			var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
			gl.uniform1i(currentShader.bUseColorCodingByHeight_loc, true);
			gl.uniform1f(currentShader.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
			gl.uniform1f(currentShader.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
			gl.uniform1f(currentShader.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
			gl.uniform1f(currentShader.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
			gl.uniform1f(currentShader.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
			
			// Bind textures.***
			var texManager = magoManager.texturesManager;
			var texturesMergerFbo = texManager.texturesMergerFbo;
			var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
			var depthTex = texturesMergerFbo.colorBuffer;
			var normalTex = texturesMergerFbo.colorBuffer1;

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			//gl.bindTexture(gl.TEXTURE_2D, depthTex);
			gl.activeTexture(gl.TEXTURE6);
			//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);
			gl.bindTexture(gl.TEXTURE_2D, normalTex);
			
			// Test to load pCloud.***
			if (magoManager.visibleObjControlerPCloudOctrees === undefined)
			{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			magoManager.visibleObjControlerPCloudOctrees.clear();
			this.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShader, renderTexture, renderType); // lod0.***
			currentShader.disableVertexAttribArrayAll();
			
			gl.useProgram(null);

		}
		
		// Test render ssao from depth.****
		//this.renderSsaoFromDepth(gl);
	}

	// Test render screenRectangle.
	//if (renderType === 1)
	//{ this.renderScreenRectangle(gl); }

	
	gl.disable(gl.BLEND);
	gl.depthRange(0.0, 1.0);	
};


/**
 * This function renders the axis coordinates of the nodes.
 * @param {Array} nodesArray Nodes that render the axis.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 */
Renderer.prototype.renderAxisNodes = function(nodesArray, renderType) 
{
	var magoManager = this.magoManager;
	
	if (magoManager.axisXYZ.vbo_vicks_container.vboCacheKeysArray.length === 0)
	{ 
		var mesh = magoManager.axisXYZ.makeMesh(30); 
		mesh.getVboTrianglesConvex(magoManager.axisXYZ.vbo_vicks_container, magoManager.vboMemoryManager);
	}
	
	var gl = magoManager.getGl();
	var color;
	var node;
	var currentShader;
	if (renderType === 0)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		gl.disable(gl.BLEND);
	}
	if (renderType === 1)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		gl.enable(gl.BLEND);
	}
	
	var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
	
	// Test rendering by modelRefShader.****
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.***
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	
	// -------------------------------------
	
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	var shaderProgram = currentShader.program;
	currentShader.bindUniformGenerals();
	gl.enableVertexAttribArray(currentShader.position3_loc);
		
	if (renderType === 1)
	{
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		
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
		gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
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
		
		this.renderObject(gl, magoManager.axisXYZ, magoManager, currentShader, renderType);
	}
	

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
 * This function renders the bounding boxex of nodes included in nodesArray.
 * @param {Array} nodesArray Nodes that render the bbox.
 * @param {Color} color The color of the bounding box.
 * @param {Boolean} bRenderLines Parameter that indicates if render the edges of the bounding box.
 */
Renderer.prototype.renderBoundingBoxesNodes = function(nodesArray, color, bRenderLines) 
{
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	
	if (nodesArray === undefined || nodesArray.length === 0)
	{ return; }
	
	if (magoManager.unitaryBoxSC === undefined)
	{
		magoManager.unitaryBoxSC = new BoxAux();
		magoManager.unitaryBoxSC.makeAABB(1.0, 1.0, 1.0); // make a unitary box.***
		magoManager.unitaryBoxSC.vBOVertexIdxCacheKey = magoManager.unitaryBoxSC.triPolyhedron.getVBOArrayModePosNorCol(magoManager.unitaryBoxSC.vBOVertexIdxCacheKey, magoManager.vboMemoryManager);
	}
	
	var node;
	var currentShader = magoManager.postFxShadersManager.getTriPolyhedronShader(); // box ssao.***
	var shaderProgram = currentShader.program;
	gl.frontFace(gl.CCW);
	gl.useProgram(shaderProgram);
	currentShader.disableVertexAttribArrayAll();
	currentShader.disableTextureImagesUnitsAll();

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewRelToEyeMatrix._floatArrays); // original.***
	gl.uniformMatrix4fv(currentShader.modelViewMatrix4_loc, false, magoManager.sceneState.modelViewMatrix._floatArrays);
	gl.uniformMatrix4fv(currentShader.projectionMatrix4_loc, false, magoManager.sceneState.projectionMatrix._floatArrays);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);

	gl.uniform1f(currentShader.near_loc, magoManager.sceneState.camera.frustum.near);
	gl.uniform1f(currentShader.far_loc, magoManager.sceneState.camera.frustum.far);
	
	gl.uniform1i(currentShader.bApplySsao_loc, false);

	gl.uniformMatrix4fv(currentShader.normalMatrix4_loc, false, magoManager.sceneState.normalMatrix4._floatArrays);
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
	gl.uniform1f(currentShader.fov_loc, magoManager.sceneState.camera.frustum.fovyRad);	// "frustum._fov" is in radians.***
	gl.uniform1f(currentShader.aspectRatio_loc, magoManager.sceneState.camera.frustum.aspectRatio);
	gl.uniform1f(currentShader.screenWidth_loc, magoManager.sceneState.drawingBufferWidth);	
	gl.uniform1f(currentShader.screenHeight_loc, magoManager.sceneState.drawingBufferHeight);

	var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
	gl.uniform2fv(currentShader.noiseScale2_loc, [magoManager.depthFboNeo.width/noiseTexture.width, magoManager.depthFboNeo.height/noiseTexture.height]);
	gl.uniform3fv(currentShader.kernel16_loc, magoManager.sceneState.ssaoKernel16);
	//gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
	
	

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

		magoManager.pointSC = bbox.getCenterPoint(magoManager.pointSC);
		gl.uniform3fv(currentShader.aditionalMov_loc, [magoManager.pointSC.x, magoManager.pointSC.y, magoManager.pointSC.z]); //.***
		//gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		this.renderObject(gl, magoManager.unitaryBoxSC, magoManager, currentShader, ssao_idx, bRenderLines);
	}

	currentShader.resetLastBuffersBinded();
	currentShader.disableVertexAttribArrayAll();
	currentShader.disableTextureImagesUnitsAll();
};

/**
 * Renders the current frustumVolumen with colorCoding for selection.
 * @param {VisibleObjectsControler} visibleObjControlerBuildings Contains the current visible objects clasified by LOD.
 */
Renderer.prototype.renderGeometryColorCoding = function(visibleObjControlerNodes) 
{
/*
	'F4D' : 'f4d',
	'OBJECT' : 'object',
	'NATIVE' : 'native',
	'ALL'  : 'all'
*/

	var magoManager = this.magoManager;
	var selectType = magoManager.interactionCollection.getSelectType();

	var gl = magoManager.getGl();
	var renderType = 2; // 0 = depthRender, 1= colorRender, 2 = selectionRender.***
	
	magoManager.currentProcess = CODE.magoCurrentProcess.ColorCodeRendering;
	
	// Render mago modeler objects.***
	
	//지금 당장은 필요없음. 테스트용 코드들임.
	/*if (selectType === 'native' && magoManager.modeler !== undefined)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
		currentShader.useProgram();

		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		
		currentShader.bindUniformGenerals();
		
		var refTMatrixIdxKey = 0;
		gl.uniform1i(currentShader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
		magoManager.modeler.render(magoManager, currentShader, renderType);

		currentShader.disableVertexAttribArrayAll();
		gl.useProgram(null);
	}*/
	
	
	// Render f4d objects.***
	//if (magoManager.selectionFbo.dirty) // todo.
	{
		var refTMatrixIdxKey = 0;
		var renderTexture = false;

		var currentShader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
		currentShader.useProgram();
		currentShader.enableVertexAttribArray(currentShader.position3_loc);
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		
		currentShader.bindUniformGenerals();

		  var options = {
			bRenderOpaques : true,
			bRenderTransparents : true
		  };
		
		gl.disable(gl.CULL_FACE);
		// do the colorCoding render.***
		var minSizeToRender = 0.0;
		if (selectType !== 'native')
		{
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
		}
		
		// native objects.
		if (selectType === 'native' || selectType === 'all')
		{
			this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
		}
		
		/*
		var nativeObjectsCount = visibleObjControlerNodes.currentVisibleNativeObjects.length;
		for (var i=0; i<nativeObjectsCount; i++)
		{
			visibleObjControlerNodes.currentVisibleNativeObjects[i].render(magoManager, currentShader, renderType, glPrimitive);
		}
		*/
		gl.enable(gl.CULL_FACE);
		currentShader.disableVertexAttribArray(currentShader.position3_loc);
		gl.useProgram(null);
		
		// Render cuttingPlanes of temperaturalayers if exist.***
		if (magoManager.weatherStation)
		{ magoManager.weatherStation.test_renderCuttingPlanes(magoManager, renderType); }
	}

	if (magoManager.magoPolicy.objectMoveMode === CODE.moveMode.GEOGRAPHICPOINTS)
	{
		// render geographicCoords of the modeler.***
		if (magoManager.modeler !== undefined)
		{
			var shader = magoManager.postFxShadersManager.getShader("modelRefColorCoding"); 
			shader.useProgram();
			shader.enableVertexAttribArray(shader.position3_loc);
			shader.disableVertexAttribArray(shader.texCoord2_loc);
			shader.disableVertexAttribArray(shader.normal3_loc);
		
			shader.bindUniformGenerals();
			
			gl.disable(gl.CULL_FACE);
			magoManager.modeler.render(magoManager, shader, renderType);
		}
	}
	
	// tin terrain.***
	if (magoManager.tinTerrainManager !== undefined && magoManager.tinTerrainManager.selectable)
	{
		var bDepth = false;
		magoManager.tinTerrainManager.render(magoManager, bDepth, renderType);
		gl.useProgram(null);
	}
	
	// pins.**********************************************************************
	magoManager.objMarkerManager.render(magoManager, renderType);
	
}; 


/**
 * Mago geometries generation test.***
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 */
Renderer.prototype.renderMagoGeometries = function(renderType) 
{
	var magoManager = this.magoManager;
	
	// 1rst, make the test object if no exist.***
	//return;
	
	if (magoManager.nativeProjectsArray === undefined)
	{
		magoManager.nativeProjectsArray = [];
		var natProject = new MagoNativeProject();
		magoManager.nativeProjectsArray.push(natProject);
		
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

		mesh.getVbo(pMesh.vboKeyContainer, magoManager.vboMemoryManager);
		mesh.getVboEdges(pMesh.vboKeyContainerEdges, magoManager.vboMemoryManager);
		
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

			ManagerUtils.calculateGeoLocationData(longitude, latitude, altitude, heading, pitch, roll, geoLoc, magoManager);
		}
		
	}
	//---------------------------------------------------------------------------------------------------------------
	var gl = magoManager.sceneState.gl;
	var color;
	var node;
	var currentShader;
	if (renderType === 0)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		gl.disable(gl.BLEND);
	}
	if (renderType === 1)
	{
		currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
		gl.enable(gl.BLEND);
	}
	
	
	// Test rendering by modelRefShader.****
	currentShader.useProgram();
	gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.***
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true); // turn on/off specular lighting & normals.***
	
	// -------------------------------------
	
	currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
	
	var shaderProgram = currentShader.program;
	currentShader.bindUniformGenerals();
	gl.enableVertexAttribArray(currentShader.position3_loc);
		
	if (renderType === 1)
	{
		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();
		
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
		gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
		gl.activeTexture(gl.TEXTURE2); 
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	var neoBuilding;
	var natProject, pMesh;
	var geoLocDataManager;
	var buildingGeoLocation;
	var bRenderLines = false;
	var nativeProjectsCount = magoManager.nativeProjectsArray.length;
	for (var i=0; i<nativeProjectsCount; i++)
	{
		natProject = magoManager.nativeProjectsArray[i];
		geoLocDataManager = natProject.geoLocDataManager;
		
		gl.uniform3fv(currentShader.scale_loc, [1, 1, 1]); //.***
		buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
		buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader);

		gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		
		var meshesCount = natProject.getMeshesCount();
		for (var j=0; j<meshesCount; j++)
		{
			pMesh = natProject.getMesh(j);
			this.renderObject(gl, pMesh, magoManager, currentShader, renderType, bRenderLines);
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





