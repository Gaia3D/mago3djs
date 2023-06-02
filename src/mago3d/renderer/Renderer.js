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

	// test debugging vars:
	this._screenRectangleRenderType = 0; // test var.***
};

Renderer.prototype.renderMgSets = function (mgSetsArray, shader, renderTexture, renderType, maxSizeToRender) 
{
	// This function renders the MgSets.***
	var gl = this.magoManager.getGl();
	var mgSetsCount = mgSetsArray.length;
	for (var i=0; i<mgSetsCount; i++)
	{
		var mgSet = mgSetsArray[i];
		mgSet.render(gl, shader);
	}
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
Renderer.prototype.renderNodes = function (gl, visibleNodesArray, magoManager, shader, renderTexture, renderType, maxSizeToRender, refMatrixIdxKey) 
{
	// do render.
	var node;
	var nodesCount = visibleNodesArray.length;

	if (nodesCount === 0)
	{ return; }

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1); // necessary for mobile devices.***
	
	var sceneState = magoManager.sceneState;
	var bApplyShadow = sceneState.applySunShadows;
	if (bApplyShadow && renderType === 1)
	{
		var light0 = sceneState.sunSystem.getLight(0);
		//var light0MaxDistToCam = light0.maxDistToCam;
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
				var distToLight0 = light0CenterPoint.distToPoint(bboxAbsoluteCenterPos);//+radiusAprox;
				if (distToLight0 < light0Radius*0.5)
				{
					gl.uniform1i(shader.sunIdx_loc, 0); // original.***
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
Renderer.prototype.renderPCloud = function (gl, pCloud, magoManager, shader, renderType, distToCam) 
{
	// Note: "pCloud" is "Lego" class.
	if (pCloud.vbo_vicks_container.vboCacheKeysArray.length === 0) 
	{
		return;
	}
	
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

Renderer.prototype.beginRenderSilhouetteDepth = function ()
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
	var clippingBox = magoManager.modeler.clippingBox;
	if (clippingBox !== undefined)
	{
		var geoLocData = clippingBox.getCurrentGeoLocationData();
		gl.uniform3fv(currentShader.uniformsLocations["clippingBoxSplittedPos[0]"], geoLocData.positionSplitted);
		var planesPosFloat32Array = clippingBox.getPlanesPositionsFloat32Array();
		var planesNorFloat32Array = clippingBox.getPlanesNormalsFloat32Array();

		gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
		gl.uniform1i(currentShader.clippingPlanesCount_loc, 4);
		var clippingBoxPlanesPosLC_loc = currentShader.uniformsLocations["clippingBoxPlanesPosLC[0]"];
		var clippingBoxPlanesNorLC_loc = currentShader.uniformsLocations["clippingBoxPlanesNorLC[0]"];
		gl.uniform3fv(clippingBoxPlanesPosLC_loc, planesPosFloat32Array);
		gl.uniform3fv(clippingBoxPlanesNorLC_loc, planesNorFloat32Array);
		
		gl.uniformMatrix4fv(currentShader.uniformsLocations.clippingBoxRotMatrix, false, geoLocData.rotMatrix._floatArrays);
	}
	else 
	{
		gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
	}

	if (magoManager.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 1);
	}

};

Renderer.prototype.endRenderSilhouetteDepth = function(silhouetteDepthFbo)
{
	silhouetteDepthFbo.unbind(); 
};

Renderer.prototype.renderSilhouetteDepth = function ()
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
		var gl = magoManager.getGl();

		// 1rst, check if exist objects selected.
		//var nativeSelectedArray = selectionManager.getSelectedGeneralArray();
		//var nodes = selectionManager.getSelectedF4dNodeArray();
		//var selectedRefs = selectionManager.getSelectedF4dObjectArray();

		if (selectionManager.existSelectedObjects())
		{
			// Begin render.
			this.beginRenderSilhouetteDepth();
		}
		else 
		{
			return;
		}

		var currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); 
		var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();
		

		var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1); // necessary for mobile devices.***

		
		var nodes = selectionManager.getSelectedF4dNodeArray();
		var selectedRefs = selectionManager.getSelectedF4dObjectArray();
		if (nodes.length > 0 && selectedRefs.length === 0) // test code.***
		{
			gl.uniform3fv(currentShader.aditionalMov_loc, [0, 0, 0]); //.
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
			}
		}

		// Now check native objects.
		var renderType = 0;
		var nativeSelectedArray = selectionManager.getSelectedGeneralArray();
		for (var i = 0; i < nativeSelectedArray.length; i++)
		{
			var renderableObject = nativeSelectedArray[i];
			renderableObject.render(magoManager, currentShader, renderType, gl.TRIANGLES);
		}

		// End render.
		this.endRenderSilhouetteDepth(silhouetteDepthFbo);
		gl.enable(gl.CULL_FACE);
	}
};

/**
 * This function renders the sunPointOfView depth.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderDepthSunSystem = function (visibleObjControlerNodes) 
{
	var magoManager = this.magoManager;

	if (!magoManager.depthFboNeo) { return; }
	
	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;

	visibleObjControlerNodes.calculateBoundingFrustum(sceneState.camera);
	
	gl.clearColor(1, 1, 1, 1);
	gl.clearDepth(1);
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
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}
		else
		{
			gl.clear(gl.DEPTH_BUFFER_BIT);
		}
		gl.viewport(0, 0, imageWidth, imageHeight);
		
		this._renderDepthSunPointOfView(gl, visibleObjControlerNodes, sunLight, sunSystem);
		
		sunLight.depthFbo.unbind();
	}
	
	magoManager.depthFboNeo.bind(); 
	gl.clearColor(0, 0, 0, 1);
	gl.viewport(0, 0, magoManager.sceneState.drawingBufferWidth[0], magoManager.sceneState.drawingBufferHeight[0]);
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
	var shaderName = "orthogonalDepth"; // (OrthogonalDepthShaderVS, OrthogonalDepthShaderFS)
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

	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0Transparents, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2Transparents, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3Transparents, magoManager, currentShader, renderTexture, renderType, minSize, 0, refTMatrixIdxKey);
	
	// Mago native geometries.
	var options = {
		bRenderOpaques      : true,
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
	var currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth"); // (RenderShowDepthVS, RenderShowDepthFS)
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
	gl.uniformMatrix4fv(currentShader.mvRelToEyeMatrix_loc, false, camMVRelToEyeMat._floatArrays);//
	//gl.uniformMatrix4fv(currentShader.mvMat4RelToEye, false, camMVRelToEyeMat._floatArrays);
	gl.uniform3fv(currentShader.encodedCameraPositionMCHigh_loc, encodedCamPos.high);
	gl.uniform3fv(currentShader.encodedCameraPositionMCLow_loc, encodedCamPos.low);
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
	gl.uniform1f(currentShader.frustumFar_loc, bigFrustum.far[0]);

	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.bHasTexture_loc, false);
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
		bRenderOpaques      : true,
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

		var currentShader = magoManager.postFxShadersManager.getShader("modelRefSsao"); 
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
		gl.enable(gl.BLEND);

		for (var i=0; i<lightSourcesCount; i++)
		{
			lightSourcesArray[i].render(magoManager, currentShader, renderType, glPrimitive);
		}

		gl.disable(gl.BLEND);
	}
};

/**
 * This function renders provisional ParametricMesh objects that has no self render function.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderNativeObjects = function (gl, shader, renderType, visibleObjControlerNodes, options) 
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var glPrimitive = undefined;

	var bRenderOpaques = false;
	var bRenderTransparents = false;

	if (options)
	{
		if (options.bRenderOpaques)
		{ bRenderOpaques = options.bRenderOpaques; }

		if (options.bRenderTransparents)
		{ bRenderTransparents = options.bRenderTransparents; }
	}


	gl.uniform1i(shader.refMatrixType_loc, 0); // init referencesMatrix.
	gl.uniform3fv(shader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
	gl.uniform4fv(shader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
	gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1); // necessary for mobile devices.***

	// 1rst, opaques.
	if (bRenderOpaques)
	{
		var opaquesArray = visibleObjControlerNodes.currentVisibleNativeObjects.opaquesArray;
		var nativeObjectsCount = opaquesArray.length;
		for (var i=0; i<nativeObjectsCount; i++)
		{
			opaquesArray[i].render(magoManager, shader, renderType, glPrimitive);
		}

		// ThickLines only in transparentPass.
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

		// ThickLines only in transparentPass.
		/*
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
		*/
	}
	
	// render vectorType objects as opaques.
	if (bRenderOpaques && renderType === 1)
	{
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
				{ 
					gl.enable(gl.DEPTH_TEST);
				}
				else
				{ 
					gl.disable(gl.DEPTH_TEST);
				}

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

	gl.enable(gl.DEPTH_TEST);
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
Renderer.prototype.renderSilhouette = function () 
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
	gl.activeTexture(gl.TEXTURE2); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	gl.activeTexture(gl.TEXTURE3); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	gl.activeTexture(gl.TEXTURE4); 
	gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);

	currentShader.last_tex_id = textureAux1x1;
			
	gl.depthMask(false);
	gl.depthRange(0.0, 0.01);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);



	var screenQuad = this.getScreenQuad();
	screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.depthMask(true);
	gl.depthRange(0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
	
	// Restore magoManager rendering phase.
	//magoManager.renderingFase = currRenderingPhase;
};

/**
 * This function renders ssao
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenQuad = function (gl) 
{
	// We are using a quadScreen.***
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var camera = sceneState.camera;

	var bApplySsao = true;
	var bApplyShadow = false; // cesium terrain sun shadows. here always "false".
	var bApplyMagoShadow = false; // mago objects sun shadows.
	var bSilhouette = false;
	var bFxaa = false;

	if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
	{ bApplyMagoShadow = true; }

	if (!bApplySsao)
	{ return; }

	// Render in the shadedColorFbo.*************************************************
	var shadedColorFbo = magoManager.shadedColorFbo;

	// bind ssaoFromDepthBuffer.***
	shadedColorFbo.bind(); 

	// If exist bloom, then bind the brightColotTex.***
	//var texturesManager = magoManager.getTexturesManager();
	//magoManager.brightColorTex_A = texturesManager.bloomBufferFBO.colorBuffersArray[1];
	//magoManager.brightColorTex_B = texturesManager.bloomBufferFBO.colorBuffersArray[0];
	var extbuffers = magoManager.extbuffers;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.brightColorTex, 0);
	//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.debugTex, 0);

	// Attach the brightColorBuffer.***
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - brightColorBuffer
		extbuffers.NONE, // gl_FragData[2] - debugTex
		extbuffers.NONE, // gl_FragData[3] - 
		extbuffers.NONE // gl_FragData[4] - 
	]);


	//if (magoManager.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 1);// original.***
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	// ------------------------------------------------------------------------------

	var postFxShadersManager = magoManager.postFxShadersManager;
	currentShader = postFxShadersManager.getShader("screenQuad"); // (ScreenQuadVS, ScreenQuadFS)
	postFxShadersManager.useProgram(currentShader);
	currentShader.bindUniformGenerals();

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
	gl.uniform3fv(currentShader.uAmbientLight_loc, sceneState.ambientColor);
	gl.uniform3fv(currentShader.uBrightnessContrastSaturation_loc, sceneState.brightnessContrastSaturation);
	gl.uniform1i(currentShader.uBrightnessContrastType_loc, sceneState.brightnessContrastType);
	

	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);

	var dayNightLightingFactor = sunSystem.getDayNightLightingFactorOfPosition(camera.position);
	if (dayNightLightingFactor < 0.0)
	{ dayNightLightingFactor = 0.0; }

	//dayNightLightingFactor = 1.0; // delete.!!!!!!!!!!!!!!!!!!!!!!!!

	gl.uniform1f(currentShader.uSceneDayNightLightingFactor_loc, dayNightLightingFactor);

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();

	var sunDirWC = sunSystem.getSunDirWC();
	gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
	var sunDirCC = sunSystem.getSunDirCC();
	gl.uniform3fv(currentShader.sunDirCC_loc, sunDirCC);
	if (bApplyMagoShadow)
	{
		// Set sunMatrix uniform.***
		var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
		var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
		var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
		
		if (sunLight.tMatrix!== undefined)
		{
			gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
			gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
			gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
			gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
			gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
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
	if (albedoTex)
	{
		gl.bindTexture(gl.TEXTURE_2D, albedoTex);  // original.***
	}
	else
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	

	if (bApplySsao)
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, depthTex);  // original.***

		var ssaoFromDepthFbo = magoManager.ssaoFromDepthFbo;
		gl.activeTexture(gl.TEXTURE5); // ssaoTex.***
		//gl.bindTexture(gl.TEXTURE_2D, ssaoFromDepthFbo.colorBuffersArray[1]); // active this if apply blur for ssao.***
		gl.bindTexture(gl.TEXTURE_2D, ssaoFromDepthFbo.colorBuffersArray[0]);
		gl.uniform2fv(currentShader.ussaoTexSize_loc, new Float32Array([ssaoFromDepthFbo.getWidth(), ssaoFromDepthFbo.getHeight()]));

		gl.activeTexture(gl.TEXTURE1); // normalTex.***
		gl.bindTexture(gl.TEXTURE_2D, normalTex);
	}
	else
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);  // original.***

		gl.activeTexture(gl.TEXTURE5); // ssaoTex.***
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);

		gl.activeTexture(gl.TEXTURE1); // normalTex.***
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}

	gl.activeTexture(gl.TEXTURE6);
	if (diffuseLightTex)
	{ 
		gl.bindTexture(gl.TEXTURE_2D, diffuseLightTex);  // original.***
	}
	else
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}
	
	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Original.***

	var screenQuad = this.getScreenQuad();
	screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);

	shadedColorFbo.unbind(); 
};

/**
 * This function renders ssao
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenQuad2 = function (gl) 
{
	// We are using a quadScreen.***
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var camera = sceneState.camera;

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
	currentShader = postFxShadersManager.getShader("screenQuad2"); 
	postFxShadersManager.useProgram(currentShader);
	currentShader.bindUniformGenerals();

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
	gl.uniform3fv(currentShader.uAmbientLight_loc, sceneState.ambientColor);
	

	var sunSystem = sceneState.sunSystem;
	var sunLight = sunSystem.getLight(0);

	var dayNightLightingFactor = sunSystem.getDayNightLightingFactorOfPosition(camera.position);
	if (dayNightLightingFactor < 0.0)
	{ dayNightLightingFactor = 0.0; }

	//dayNightLightingFactor = 1.0; // delete.!!!!!!!!!!!!!!!!!!!!!!!!

	gl.uniform1f(currentShader.uSceneDayNightLightingFactor_loc, dayNightLightingFactor);

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();

	var sunDirWC = sunSystem.getSunDirWC();
	gl.uniform3fv(currentShader.sunDirWC_loc, sunDirWC);
	var sunDirCC = sunSystem.getSunDirCC();
	gl.uniform3fv(currentShader.sunDirCC_loc, sunDirCC);
	if (bApplyMagoShadow)
	{
		// Set sunMatrix uniform.***
		var sunMatFloat32Array = sunSystem.getLightsMatrixFloat32Array();
		var sunPosLOWFloat32Array = sunSystem.getLightsPosLOWFloat32Array();
		var sunPosHIGHFloat32Array = sunSystem.getLightsPosHIGHFloat32Array();
		
		if (sunLight.tMatrix!== undefined)
		{
			gl.uniformMatrix4fv(currentShader.sunMatrix_loc, false, sunMatFloat32Array);
			gl.uniform3fv(currentShader.sunPosHigh_loc, sunPosHIGHFloat32Array);
			gl.uniform3fv(currentShader.sunPosLow_loc, sunPosLOWFloat32Array);
			gl.uniform1f(currentShader.shadowMapWidth_loc, sunLight.targetTextureWidth);
			gl.uniform1f(currentShader.shadowMapHeight_loc, sunLight.targetTextureHeight);
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

	var depthTex = magoManager.depthTex;
	var normalTex = magoManager.normalTex;

	// DepthTex & NormalTex for edge detection.***
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTex);  

	gl.activeTexture(gl.TEXTURE1); 
	gl.bindTexture(gl.TEXTURE_2D, normalTex);
	
	var bLightFogTex = true;
	gl.activeTexture(gl.TEXTURE2); 
	if (magoManager.LightFogTex)
	{ 
		gl.bindTexture(gl.TEXTURE_2D, magoManager.LightFogTex);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}

	var bScreenSpaceObjectsTex = false;
	var screenSpaceFBO = magoManager.screenSpaceFBO;
	gl.activeTexture(gl.TEXTURE3); 
	if (screenSpaceFBO)
	{
		bScreenSpaceObjectsTex = true;
		gl.bindTexture(gl.TEXTURE_2D, screenSpaceFBO.colorBuffersArray[0]);
	}
	else 
	{
		gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
	}

	var shadedColorFbo = magoManager.shadedColorFbo;
	gl.activeTexture(gl.TEXTURE4); // shadedTex.***
	gl.bindTexture(gl.TEXTURE_2D, shadedColorFbo.colorBuffer);

	// Now, the brightColorTex.***
	gl.activeTexture(gl.TEXTURE5); 
	if (sceneState.applyBloomEffect && magoManager.brightColorTex_A)
	{
		gl.bindTexture(gl.TEXTURE_2D, magoManager.brightColorTex_A);
	}
	else
	{
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	// Now, volumetric renderTex if exist.***
	gl.activeTexture(gl.TEXTURE6);
	//gl.bindTexture(gl.TEXTURE_2D, null);

	var bSoundVolumetricTex = false;
	if (magoManager.soundManager)
	{
		// check if exist soundVolumetricTex.***
		if (magoManager.soundManager.soundLayersArray.length > 0)
		{
			var soundLayer = magoManager.soundManager.soundLayersArray[0];
			if (soundLayer.volumRenderTex)
			{
				gl.bindTexture(gl.TEXTURE_2D, soundLayer.volumRenderTex);
				bSoundVolumetricTex = true;
			}
		}
	}

	gl.uniform1iv(currentShader.u_activeTex_loc, [bLightFogTex, bScreenSpaceObjectsTex, 0, 0, 0, 0, bSoundVolumetricTex, 0]);

	gl.depthMask(false);
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var screenQuad = this.getScreenQuad();
	screenQuad.render(magoManager, currentShader);

	// Restore settings.***
	gl.depthMask(true);
	gl.disable(gl.BLEND);
};

Renderer.prototype.getScreenQuad = function () 
{
	if (this.screenQuad === undefined) 
	{
		this.screenQuad = new ScreenQuad(this.magoManager.vboMemoryManager);
	}

	return this.screenQuad;
};

/**
 * This function renders the gaussian blur for the brightColorBuffer
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenQuadGaussianBlur = function (gl) 
{
	 // This function makes the bloom effect texture (glow effect).***
	 // We are using a quadScreen.***
	 var currentShader;
	 var magoManager = this.magoManager;
	 var texturesManager = magoManager.getTexturesManager();
	 var sceneState = magoManager.sceneState;
 
	 magoManager.brightColorTex_A = texturesManager.bloomBufferFBO.colorBuffersArray[1];
	 magoManager.brightColorTex_B = texturesManager.bloomBufferFBO.colorBuffersArray[0];
 
	 var tex_A = magoManager.brightColorTex_A; // reduced size texture.***
	 var tex_B = magoManager.brightColorTex_B; // reduced size texture.***
	 var brightColorTex = magoManager.brightColorTex; // screen size texture.***
 
	 var postFxShadersManager = magoManager.postFxShadersManager;
	 currentShader = postFxShadersManager.getShader("gaussianBlur"); 
	 postFxShadersManager.useProgram(currentShader);
	 currentShader.bindUniformGenerals();
 
	 var bloomBufferFBO = texturesManager.bloomBufferFBO;
 
	 // bind ssaoFromDepthBuffer.***
	 bloomBufferFBO.bind(); 
 
	 var extbuffers = magoManager.extbuffers;
	 extbuffers.drawBuffersWEBGL([
		 extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		 extbuffers.NONE, // gl_FragData[1] - depthTex
		 extbuffers.NONE, // gl_FragData[2] - normalTex
		 extbuffers.NONE, // gl_FragData[3] - albedoTex
		 extbuffers.NONE // gl_FragData[4] - selColor4
	 ]);
	 
	 gl.disable(gl.DEPTH_TEST);
 
	 var screenQuad = this.getScreenQuad();
 
	 gl.activeTexture(gl.TEXTURE0);
 
	 var iterationsCount = 8;
	 var bHorizontal = true;
	 var imageWidth = bloomBufferFBO.getWidth();
	 var imageHeight = bloomBufferFBO.getHeight();
 
	 gl.uniform2fv(currentShader.uImageSize_loc, new Float32Array([imageWidth, imageHeight]));
	 for (var i=0; i<iterationsCount; i++)
	 {
		 // Set texture output.***
		 gl.uniform1i(currentShader.u_bHorizontal_loc, bHorizontal);
		 if (i === 0)
		 {
			 gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_A, 0); 
			 gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); 
			 gl.bindTexture(gl.TEXTURE_2D, brightColorTex); 
		 }
		 else
		 {
			 if (bHorizontal)
			 {
				 gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_A, 0); 
				 gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); 
				 gl.bindTexture(gl.TEXTURE_2D, tex_B);  
			 }
			 else
			 {
				 gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_B, 0); 
				 gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); 
				 gl.bindTexture(gl.TEXTURE_2D, tex_A);  
			 }
		 }
		 
		 
		 screenQuad.render(magoManager, currentShader);
 
		 bHorizontal = !bHorizontal;
	 }
	 
	 gl.enable(gl.DEPTH_TEST);
	 bloomBufferFBO.unbind();
};

/**
 * This function renders the blur for the brightColorBuffer
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenQuadBlur_ssaoTex = function (gl) 
{
	// This function makes the bloom effect texture (glow effect).***
	// We are using a quadScreen.***
	var currentShader;
	var magoManager = this.magoManager;
	var texturesManager = magoManager.getTexturesManager();
	var sceneState = magoManager.sceneState;
	var camera = sceneState.camera;
	var bufferWidth = sceneState.drawingBufferWidth[0];
	var bufferHeight = sceneState.drawingBufferHeight[0];

	var ssaoFromDepthFbo = magoManager.ssaoFromDepthFbo;

	var tex_A = ssaoFromDepthFbo.colorBuffersArray[1]; // possibily reduced size texture.***
	var tex_B = ssaoFromDepthFbo.colorBuffersArray[0]; // possibily reduced size texture.***

	var postFxShadersManager = magoManager.postFxShadersManager;

	var bGaussianBlur = true;
	var shaderName = "screenQuadBlur"; // (ScreenQuadVS, ScreenQuadBlurFS)
	if (bGaussianBlur)
	{
		shaderName = "gaussianBlur"; // (ScreenQuadVS, ScreenQuadGaussianBlurFS)
	}

	currentShader = postFxShadersManager.getShader(shaderName); 
	postFxShadersManager.useProgram(currentShader);
	currentShader.bindUniformGenerals();

	// bind ssaoFromDepthBuffer.***
	ssaoFromDepthFbo.bind(); 

	var extbuffers = magoManager.extbuffers;
	
	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.NONE, // gl_FragData[1] - depthTex
		extbuffers.NONE, // gl_FragData[2] - normalTex
		extbuffers.NONE, // gl_FragData[3] - albedoTex
		extbuffers.NONE // gl_FragData[4] - selColor4
	]);
	
	
	gl.disable(gl.DEPTH_TEST);

	var screenQuad = this.getScreenQuad();

	gl.activeTexture(gl.TEXTURE0);

	var imageWidth = ssaoFromDepthFbo.getWidth();
	var imageHeight = ssaoFromDepthFbo.getHeight();
	gl.uniform2fv(currentShader.uImageSize_loc, new Float32Array([imageWidth, imageHeight]));

	
	if (bGaussianBlur)
	{
		var iterationsCount = 3;
	 	var bHorizontal = true;

		for (var i=0; i<iterationsCount; i++)
		{
			// Set texture output.***
			gl.uniform1i(currentShader.u_bHorizontal_loc, bHorizontal);

			if (bHorizontal)
			{
				gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_A, 0); 
				gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); 
				gl.bindTexture(gl.TEXTURE_2D, tex_B);  
			}
			else
			{
				gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_B, 0); 
				gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); 
				gl.bindTexture(gl.TEXTURE_2D, tex_A);  
			}

			screenQuad.render(magoManager, currentShader);
			bHorizontal = !bHorizontal;
		}
	}
	else
	{
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_A, 0); 
		gl.bindTexture(gl.TEXTURE_2D, tex_B);  
		screenQuad.render(magoManager, currentShader);
	}
	
	gl.enable(gl.DEPTH_TEST);
	gl.bindTexture(gl.TEXTURE_2D, null); 

	// Now, return the default framebuffer attachment0.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_B, 0);
	ssaoFromDepthFbo.unbind();
};

/**
 * This function renders the ssao by depthBuffer.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderSsaoFromDepth = function (gl) 
{
	// render the ssao to texture, and then apply blur.
	var magoManager = this.magoManager;
	var texManager = magoManager.texturesManager;

	if (!texManager)
	{ return; }

	var sceneState = magoManager.sceneState;
	var bufferWidth = sceneState.drawingBufferWidth[0];
	var bufferHeight = sceneState.drawingBufferHeight[0];

	var ssaoFromDepthFbo = magoManager.ssaoFromDepthFbo;

	// bind ssaoFromDepthBuffer.***
	ssaoFromDepthFbo.bind(); 

	//if (magoManager.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 0);// original.***
		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	var currentShader = magoManager.postFxShadersManager.getShader("ssaoFromDepth"); // (ScreenQuadVS, ssaoFromDepthFS)
	currentShader.useProgram();
	currentShader.bindUniformGenerals();

	gl.viewport(0, 0, bufferWidth, bufferHeight);
	
	if (magoManager.isCesiumGlobe())
	{
		//gl.uniform1f(currentShader.frustumFar_loc, 40000.0); // only in cesium.***
	}

	var bApplySsao = true;
	gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); // apply ssao default.***

	var projectionMatrixInv = sceneState.getProjectionMatrixInv();
	gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);

	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);

	// Must set screenWidth & screenHeight bcos usually ssaoTex are smaller than screen.***
	gl.uniform1f(currentShader.screenWidth_loc, ssaoFromDepthFbo.getWidth());
	gl.uniform1f(currentShader.screenHeight_loc, ssaoFromDepthFbo.getHeight());

	var texManager = magoManager.texturesManager;
	var texturesMergerFbo = texManager.texturesMergerFbo;
	var noiseTexture = magoManager.texturesStore.getNoiseTexture4x4();

	var depthTex = magoManager.depthTex;
	var normalTex = magoManager.normalTex;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTex);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, normalTex);

	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);

	var screenQuad = this.getScreenQuad();
	screenQuad.render(magoManager, currentShader);

	// unbind the ssaoFromDepthBuffer.***
	ssaoFromDepthFbo.unbind(); 

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, null);

	// restore gl settings.***
	gl.clearColor(0, 0, 0, 1);
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
};

Renderer.prototype.copyTexture = function (webGlTextureOriginal, webGlTextureDest, bTextureFlipXAxis, bTextureFlipYAxis) 
{
	// this function copies the textureOriginal to textureDest.
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();

	currentShader = magoManager.postFxShadersManager.getShader("textureCopy"); 
	currentShader.useProgram();
	currentShader.bindUniformGenerals();
	if (bTextureFlipYAxis === undefined)
	{
		bTextureFlipYAxis = false;
	}
	if (bTextureFlipXAxis === undefined)
	{
		bTextureFlipXAxis = false;
	}

	gl.uniform1i(currentShader.u_textureFlipXAxis_loc, bTextureFlipXAxis);
	gl.uniform1i(currentShader.u_textureFlipYAxis_loc, bTextureFlipYAxis);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, webGlTextureOriginal);  // cesium globeDepthTexture.***

	// we are in ORT (one rendering target).*********************************************************************************
	magoManager.texturesManager.texturesMergerFbo.bind();

	var extbuffers = magoManager.extbuffers;

	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, webGlTextureDest, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, null, 0);

	// If we are in ORT (one rendering target), then must set the "u_textureTypeToCopy" uniform.***
	//gl.uniform1i(currentShader.u_textureTypeToCopy_loc, i); // if MRT, then this var has NO effect.

	if (extbuffers)
	{
		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
			extbuffers.NONE, // gl_FragData[1] - normal
			extbuffers.NONE, // gl_FragData[2] - albedo
			extbuffers.NONE, // gl_FragData[3] - selColor4
			extbuffers.NONE  // gl_FragData[4] - any
		]);
	}

	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);

	// Now render.***
	var screenQuad = this.getScreenQuad();
	screenQuad.render(magoManager, currentShader);

	magoManager.texturesManager.texturesMergerFbo.unbind();

	// restore gl settings.***
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, null);
};

/**
 * This function renders the shadows of the scene on terrain.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderTerrainCopy = function () 
{
	var magoManager = this.magoManager;
	if (!magoManager.depthTex || !magoManager.normalTex)
	{
		return;
	}

	var currentShader;
	
	var sceneState = magoManager.sceneState;
	var gl = magoManager.getGl();

	var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;

	magoManager.czm_globeDepthText = magoManager.scene._context._us.globeDepthTexture._texture; 

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
	gl.uniform1f(currentShader.frustumFar_loc, magoManager.sceneState.camera.frustum.far[0]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.czm_globeDepthText);  // cesium globeDepthTexture.***

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.cesiumColorBuffer); 
	
	var screenQuad = this.getScreenQuad();

	if (magoManager.isCameraMoved || magoManager.bPicking)
	{
		if (magoManager.isFarestFrustum()) 
		{
			magoManager.selectionManager.clearCandidates();
		}
	}

	if (bUseMultiRenderTarget)
	{
		// Bind the frameBuffer.*******************************************************************************
		// Must know if MRT.***
		var extbuffers = magoManager.extbuffers;
		magoManager.texturesManager.texturesMergerFbo.bind();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0); // original.***
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // NO copy albedo here.***
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.selColorTex, 0);

		if (magoManager.isCameraMoved || magoManager.bPicking)
		{
			extbuffers.drawBuffersWEBGL([
				extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
				extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - normal
				extbuffers.NONE, // gl_FragData[2] - albedo
				extbuffers.COLOR_ATTACHMENT3_WEBGL,  // gl_FragData[3] - selColor4
			]);	
		}
		else
		{
			extbuffers.drawBuffersWEBGL([
				extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
				extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - normal
				extbuffers.NONE, // gl_FragData[2] - albedo
				extbuffers.NONE,  // gl_FragData[3] - selColor4
			]);
		}

		if (magoManager.isFarestFrustum())
		{
			gl.clearColor(1.0, 1.0, 1.0, 1.0);
			gl.clearDepth(1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}
		else
		{
			gl.clear(gl.DEPTH_BUFFER_BIT);
		}
		// End binding frameBuffer.----------------------------------------------------------------------------

		// Now render.***
		screenQuad.render(magoManager, currentShader);
	}
	else
	{
		// we are in ORT (one rendering target).*********************************************************************************
		magoManager.texturesManager.texturesMergerFbo.bind();
		// Render depth, normal & albedo separately.***
		for (var i=0; i<2; i++)
		{
			if (i === 0)
			{
				// depth.***
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, magoManager.depthTex, 0);
			}
			else if (i === 1)
			{
				// normal.***
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, magoManager.normalTex, 0);
			}
			//else if (i === 2) // No necessary copy cesium albedo, bcos this is copied in finalPass(frustumIdx = 0).
			//{
			//	// albedo.***
			//	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, magoManager.albedoTex, 0);
			//}
			//else if (i === 3) // In terrain Copy mode, there are NO selection objects.***
			//{ 
			//	// selColorTex.***
			//	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, magoManager.selColorTex, 0);
			//}

			// If we are in ORT (one rendering target), then must set the "u_textureTypeToCopy" uniform.***
			gl.uniform1i(currentShader.u_textureTypeToCopy_loc, i); // if MRT, then this var has NO effect.
			
			if (magoManager.isFarestFrustum())
			{
				gl.clearColor(1.0, 1.0, 1.0, 1.0);
				gl.clearDepth(1.0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			}
			else
			{
				gl.clear(gl.DEPTH_BUFFER_BIT);
			}

			// Now render.***
			screenQuad.render(magoManager, currentShader);
		}
	}

	magoManager.texturesManager.texturesMergerFbo.unbind();

	// restore gl settings.***
	gl.clearColor(0.0, 0.0, 0.0, 1.0);



	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, null); 
	}
	
};

Renderer.prototype.renderScreenRectangle = function (gl, options) 
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];
	var aspectRatio = screenWidth / screenHeight;

	if (this.quadBuffer === undefined)
	{

		//var data = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1,  1]); // total screen.
		//-----------------------------------------------------------------------------------------------------------------
		var data = new Float32Array([0, 0,   0.5, 0,   0, 0.5,       0, 0.5,   0.5, 0,   0.5, 0.5]); // rightUp screen.
		//-----------------------------------------------------------------------------------------------------------------
		//var data = new Float32Array([0, 0,   0.5, 0,   0, 1,       0, 1,   0.5, 0,   0.5, 1]); // right half screen.
		//-----------------------------------------------------------------------------------------------------------------
		this.quadBuffer = FBO.createBuffer(gl, data);

		// create texCoords.
		var texCoords = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1,  1]); // total screen.
		//var texCoords = new Float32Array([0, 0,   0.5, 0,   0, 0.5,       0, 0.5,   0.5, 0,   0.5, 0.5]); // rightUp screen.
		this.texCoordBuffer = FBO.createBuffer(gl, texCoords);

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
	var shader =  postFxShadersManager.getShader("rectangleScreen"); // (rectangleScreenVS, rectangleScreenFS)very simple shader.
	postFxShadersManager.useProgram(shader);

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();

	gl.enableVertexAttribArray(shader.position2_loc);
	FBO.bindAttribute(gl, this.quadBuffer, shader.position2_loc, 2);

	if (shader.normal3_loc !== -1)
	{
		gl.enableVertexAttribArray(shader.normal3_loc); // only for cubeMaps.***
		FBO.bindAttribute(gl, this.normalBuffer, shader.normal3_loc, 3);
	}

	gl.enableVertexAttribArray(shader.texCoord2_loc);
	FBO.bindAttribute(gl, this.texCoordBuffer, shader.texCoord2_loc, 2);

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

	gl.uniform1i(shader.uTextureType_loc, 0);

	if (magoManager.depthTex)
	{
		//texture = magoManager.depthTex;
		texture = magoManager.scene._context.defaultNormalTexture._texture;
	}

	if (magoManager.cesiumColorBuffer)
	{
		//texture = magoManager.cesiumColorBuffer;
	}

	if (magoManager.brightColorTex_A)
	{
		//texture = magoManager.brightColorTex_A;
	}
	var depthFboNeo = magoManager.depthFboNeo;
	if (depthFboNeo.colorBuffer)
	{
		//texture = depthFboNeo.colorBuffer;
	}
	
	if (magoManager.framebufferAux.colorBuffer)
	{
		//texture = magoManager.framebufferAux.colorBuffer;
	}

	if (magoManager.normalTex)
	{
		//texture = magoManager.normalTex;
	}

	if (magoManager.albedoTex)
	{
		//texture = magoManager.albedoTex;
	}

	if (magoManager.diffuseLightTex)
	{
		//texture = magoManager.diffuseLightTex;
	}

	if (magoManager.specularLightTex)
	{
		//texture = magoManager.specularLightTex;
	}

	if (magoManager.specularLightTex)
	{
		//texture = magoManager.LightFogTex;
	}

	if (magoManager.debugTex)
	{
		//texture = magoManager.debugTex;
	}

	if (magoManager.windPlaneDepthTex)
	{
		//texture = magoManager.windPlaneDepthTex;
	}

	if (magoManager.windPngTex)
	{
		//texture = magoManager.windPngTex;
	}

	if (magoManager.windPlaneNormalTex)
	{
		//texture = magoManager.windPlaneNormalTex;
	}

	
	if (magoManager.windVolumeRearNormalTex)
	{
		//texture = magoManager.windVolumeRearNormalTex;
	}

	if (magoManager.selectionFbo)
	{
		//texture = magoManager.selectionFbo.colorBuffer;
	}

	if (magoManager.selColorTex)
	{
		//texture = magoManager.selColorTex;
	}

	if (magoManager.ssaoFromDepthFbo)
	{
		//texture = magoManager.ssaoFromDepthFbo.colorBuffersArray[0]; // ssao (with noise).***
		//texture = magoManager.ssaoFromDepthFbo.colorBuffersArray[1]; // ssao with blur.***
	}

	// weatherStation.*** weatherStation.*** weatherStation.*** weatherStation.*** weatherStation.*** weatherStation.*** weatherStation.*** weatherStation.*** 
	if (magoManager.weatherStation)
	{
		var weatherStation = magoManager.weatherStation;
		if (weatherStation.windVolumesArray && weatherStation.windVolumesArray.length > 0)
		{
			var windVolume = weatherStation.windVolumesArray[0];
			
			// Front.***
			var windVolumeFrontFBO = windVolume._getVolumeFrontFBO(magoManager);
			if (windVolumeFrontFBO)
			{
				var depthTex = windVolumeFrontFBO.colorBuffersArray[1]; // [1] = depth, [2] = normal
				if (depthTex)
				{
					//texture = depthTex;
				}
			}
			

			// Rear.***
			var windVolumeRearFBO = windVolume._getVolumeRearFBO(magoManager);
			if (windVolumeRearFBO)
			{
				var depthTex = windVolumeRearFBO.colorBuffersArray[1]; // [1] = depth, [2] = normal
				if (depthTex)
				{
					//texture = depthTex;
				}
			}

		}
		
	}

	// soundManager.*** soundManager.*** soundManager.***soundManager.*** soundManager.*** soundManager.***soundManager.*** soundManager.*** soundManager.***
	if (magoManager.soundManager)
	{
		if (this.lastIdx === undefined)
		{
			this.lastIdx = 0;
		}

		if (magoManager.soundManager.soundLayersArray.length > 0)
		{
			var soundLayer = magoManager.soundManager.soundLayersArray[0];
			if (soundLayer.demWithBuildingsTex && soundLayer.demWithBuildingsTex.texId)
			{
				//texture = soundLayer.demWithBuildingsTex.texId;
			}

			if (soundLayer.soundSourceRealTexture3d)
			{
				if (soundLayer.soundSourceRealTexture3d.texturesArray.length > 0)
				{
					if (this.lastIdx >= soundLayer.soundSourceRealTexture3d.texturesArray.length)
					{
						this.lastIdx = 0;
					}
					//texture = soundLayer.soundSourceRealTexture3d.texturesArray[this.lastIdx];
					this.lastIdx += 1;
				}
			}

			if (soundLayer.soundSourceMosaicTexture3d)
			{
				if (soundLayer.soundSourceMosaicTexture3d.texturesArray.length > 0)
				{
					//texture = soundLayer.soundSourceMosaicTexture3d.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 4); // This decodes 4byte color4.***
				}
			}

			if (soundLayer.pressureMosaicTexture3d_A)
			{
				if (soundLayer.pressureMosaicTexture3d_A.texturesArray.length > 0)
				{
					//texture = soundLayer.pressureMosaicTexture3d_A.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 4); // This decodes 4byte color4.***
				}
			}

			if (soundLayer.pressureMosaicTexture3d_B)
			{
				if (soundLayer.pressureMosaicTexture3d_B.texturesArray.length > 0)
				{
					//texture = soundLayer.pressureMosaicTexture3d_B.texturesArray[0];
				}
			}

			if (soundLayer.fluxRFUMosaicTexture3d_HIGH_A)
			{
				if (soundLayer.fluxRFUMosaicTexture3d_HIGH_A.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxRFUMosaicTexture3d_HIGH_A.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.fluxRFUMosaicTexture3d_HIGH_B)
			{
				if (soundLayer.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxRFUMosaicTexture3d_HIGH_B.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.fluxRFUMosaicTexture3d_LOW_A)
			{
				if (soundLayer.fluxRFUMosaicTexture3d_LOW_A.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxRFUMosaicTexture3d_LOW_A.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // 
				}
			}

			if (soundLayer.fluxLBDMosaicTexture3d_HIGH_B)
			{
				if (soundLayer.fluxLBDMosaicTexture3d_HIGH_B.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxLBDMosaicTexture3d_HIGH_B.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.fluxLBDMosaicTexture3d_LOW_A)
			{
				if (soundLayer.fluxLBDMosaicTexture3d_LOW_A.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxLBDMosaicTexture3d_LOW_A.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.auxMosaicTexture3d_forFluxCalculation)
			{
				if (soundLayer.auxMosaicTexture3d_forFluxCalculation.texturesArray.length > 0)
				{
					//texture = soundLayer.auxMosaicTexture3d_forFluxCalculation.texturesArray[0];
				}
			}

			if (soundLayer.airVelocity_B)
			{
				if (soundLayer.airVelocity_B.texturesArray.length > 0)
				{
					//texture = soundLayer.airVelocity_B.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 5); // if want to see velocity.***
				}
			}

			if (soundLayer.shaderLogTexture)
			{
				if (soundLayer.shaderLogTexture.texturesArray.length > 0)
				{
					//texture = soundLayer.shaderLogTexture.texturesArray[0];
				}
			}

			if (soundLayer.shaderLogTexture_vel)
			{
				if (soundLayer.shaderLogTexture_vel.texturesArray.length > 0)
				{
					//texture = soundLayer.shaderLogTexture_vel.texturesArray[0];
				}
			}

			if (soundLayer.simulBoxdoubleDepthTex)
			{
				//texture = soundLayer.simulBoxdoubleDepthTex;
			}

			if (soundLayer.simulBoxDoubleNormalTex)
			{
				//texture = soundLayer.simulBoxDoubleNormalTex;
			}

			if (soundLayer.volumRenderTex)
			{
				//texture = soundLayer.volumRenderTex;
			}

			if (soundLayer.auxTex3d_yDirection)
			{
				if (soundLayer.auxTex3d_yDirection.texturesArray || soundLayer.auxTex3d_yDirection.texturesArray.length > 0)
				{
					//texture = soundLayer.auxTex3d_yDirection.texturesArray[1];
				}
				
			}

			if (soundLayer.mosaic_partial_ydirection)
			{
				if (soundLayer.mosaic_partial_ydirection.texturesArray || soundLayer.mosaic_partial_ydirection.texturesArray.length > 0)
				{
					//texture = soundLayer.mosaic_partial_ydirection.texturesArray[0];
				}
				
			}
		}
	}

	// waterManager.*** waterManager.*** waterManager.*** waterManager.*** waterManager.*** waterManager.*** waterManager.*** waterManager.*** waterManager.***
	if (magoManager.waterManager)
	{
		if (magoManager.waterManager.waterLayersArray.length > 0)
		{
			var waterLayer = magoManager.waterManager.waterLayersArray[0];
			if (waterLayer.waterHeightTexA && waterLayer.waterHeightTexA.texId)
			{
				//texture = waterLayer.waterHeightTexA.texId;
			}

			if (waterLayer.waterSourceTex && waterLayer.waterSourceTex.texId)
			{
				//texture = waterLayer.waterSourceTex.texId;
			}

			if (waterLayer.waterFluxTexA_HIGH && waterLayer.waterFluxTexA_HIGH.texId)
			{
				//texture = waterLayer.waterFluxTexA_HIGH.texId;
			}

			if (waterLayer.waterFluxTexA_LOW && waterLayer.waterFluxTexA_LOW.texId)
			{
				//texture = waterLayer.waterFluxTexA_LOW.texId;
			}

			if (waterLayer.waterVelocityTexA && waterLayer.waterVelocityTexA.texId)
			{
				//texture = waterLayer.waterVelocityTexA.texId;
			}

			if (waterLayer.demWithBuildingsTex && waterLayer.demWithBuildingsTex.texId)
			{
				//texture = waterLayer.demWithBuildingsTex.texId;
			}

			if (waterLayer.dem_texture && waterLayer.dem_texture.texId)
			{
				//texture = waterLayer.dem_texture.texId;
			}

			if (waterLayer.shaderLogTexA && waterLayer.shaderLogTexA.texId)
			{
				//texture = waterLayer.shaderLogTexA.texId;
			}

			if (waterLayer.shaderLogParticlesPos_TexA && waterLayer.shaderLogParticlesPos_TexA.texId)
			{
				//texture = waterLayer.shaderLogParticlesPos_TexA.texId;
			}

			if (waterLayer.shaderLogTex_Flux_A && waterLayer.shaderLogTex_Flux_A.texId)
			{
				//texture = waterLayer.shaderLogTex_Flux_A.texId; // LOG.*** LOG.*** LOG.*** LOG.*** LOG.*** LOG.*** LOG.*** LOG.*** LOG.***
			}

			if (waterLayer.particlesPosTex_A && waterLayer.particlesPosTex_A.texId)
			{
				//texture = waterLayer.particlesPosTex_A.texId;
			}

			if (waterLayer.particlesTex_A && waterLayer.particlesTex_A.texId)
			{
				//texture = waterLayer.particlesTex_A.texId;
			}

			if (waterLayer.contaminationTex_A && waterLayer.contaminationTex_A.texId)
			{
				//texture = waterLayer.contaminationTex_A.texId;
			}

			if (waterLayer.contaminantSourceTex && waterLayer.contaminantSourceTex.texId)
			{
				//texture = waterLayer.contaminantSourceTex.texId;
			}

			if (waterLayer.terrainMaxSlippageTex && waterLayer.terrainMaxSlippageTex.texId)
			{
				//texture = waterLayer.terrainMaxSlippageTex.texId;
			}

			if (waterLayer.terrainFluxTexA_HIGH && waterLayer.terrainFluxTexA_HIGH.texId)
			{
				//texture = waterLayer.terrainFluxTexA_HIGH.texId;
			}

			if (waterLayer.terrainFluxTexA_LOW && waterLayer.terrainFluxTexA_LOW.texId)
			{
				//texture = waterLayer.terrainFluxTexA_LOW.texId;
			}

			if (waterLayer.waterAditionTex && waterLayer.waterAditionTex.texId)
			{
				//texture = waterLayer.waterAditionTex.texId;
			}

			if (waterLayer.original_dem_texture && waterLayer.original_dem_texture.texId)
			{
				//texture = waterLayer.original_dem_texture.texId;
			}//

			if (waterLayer.qSurfaceMesh_dem_texture && waterLayer.qSurfaceMesh_dem_texture.texId)
			{
				//texture = waterLayer.qSurfaceMesh_dem_texture.texId;
			}
		}
	}
	
	var sunSystem = sceneState.sunSystem;
	if (sunSystem)
	{
		var sunLight = sunSystem.getLight(1);
		if (sunLight && sunLight.depthFbo && sunLight.depthFbo.colorBuffer)
		{
			//texture = sunLight.depthFbo.colorBuffer;
		}
		
	}
	
	if (magoManager.scene && magoManager.scene._context._us.globeDepthTexture._texture)
	{
		//texture = magoManager.scene._context._us.globeDepthTexture._texture;
	}

	if (magoManager.screenSpaceFBO)
	{
		//texture = magoManager.screenSpaceFBO.colorBuffersArray[0];
	}
	

	if (texture === undefined)
	{ return; }

	gl.activeTexture(gl.TEXTURE0 + 0); 
	gl.bindTexture(gl.TEXTURE_2D, texture);

	 // 0= texture tal qual. 1= decoding depth 4 bytes.***

	if (!this.auxCubeMap)
	{
		//**********************************************************************************************
		// Note : this "if" is creted only for openGl ES (smartPhone devices).
		// In openGl ES, must bind all sampler2d of the shader, even if the sampler2d is NOT used.
		// So, created a very small cubeMap (1x1 pixels)and bind it.
		//----------------------------------------------------------------------------------------------
		this.auxCubeMap = magoManager.texturesStore.getCubeMapAux1x1();
	}
	gl.activeTexture(gl.TEXTURE0 + 1); 
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.auxCubeMap);

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
	var webglController = new WebGlController(gl);

	webglController.frontFace(gl.CCW);
	webglController.depthMask(false);
	webglController.disable_GL_DEPTH_TEST();

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	postFxShadersManager.useProgram(null);
	webglController.restoreAllParameters();

	gl.activeTexture(gl.TEXTURE0 + 0); 
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE0 + 1);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

};

/**
 * This function is debug function
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenRectangleMosaic = function (gl, options) 
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var screenWidth = sceneState.drawingBufferWidth[0];
	var screenHeight = sceneState.drawingBufferHeight[0];
	var aspectRatio = screenWidth / screenHeight;

	if (this.quadBuffer_mosaic === undefined)
	{

		//var data = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1,  1]); // total screen.
		//-----------------------------------------------------------------------------------------------------------------
		//var data = new Float32Array([0, 0,   0.5, 0,   0, 0.5,       0, 0.5,   0.5, 0,   0.5, 0.5]); // rightUp screen.
		//-----------------------------------------------------------------------------------------------------------------
		//var data = new Float32Array([0, 0,   0.5, 0,   0, 1,       0, 1,   0.5, 0,   0.5, 1]); // right half screen.
		//-----------------------------------------------------------------------------------------------------------------
		var data = new Float32Array([0, 0.5,   0.5, 0.5,   0, 1,       0, 1,   0.5, 0.5,   0.5, 1]); // rightDown screen.
		//-----------------------------------------------------------------------------------------------------------------
		this.quadBuffer_mosaic = FBO.createBuffer(gl, data);

		// create texCoords.
		var texCoords = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1,  1]); // total screen.
		//var texCoords = new Float32Array([0, 0,   0.5, 0,   0, 0.5,       0, 0.5,   0.5, 0,   0.5, 0.5]); // rightUp screen.
		this.texCoordBuffer = FBO.createBuffer(gl, texCoords);

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


		var nor = new Float32Array([normal_0.x, normal_0.y, normal_0.z,   normal_1.x, normal_1.y, normal_1.z,   normal_3.x, normal_3.y, normal_3.z,
			normal_3.x, normal_3.y, normal_3.z,   normal_1.x, normal_1.y, normal_1.z,   normal_2.x, normal_2.y, normal_2.z]);
		this.normalBuffer = FBO.createBuffer(gl, nor);
	}

	// use a simple shader.
	
	var postFxShadersManager = magoManager.postFxShadersManager;

	if (postFxShadersManager === undefined)
	{ return; }
	
	var currShader = postFxShadersManager.getCurrentShader(); // to restore current active shader.
	var shader =  postFxShadersManager.getShader("rectangleScreenMosaic"); // (rectangleScreenVS, rectangleScreenMosaicFS)very simple shader.
	postFxShadersManager.useProgram(shader);

	var textureAux1x1 = magoManager.texturesStore.getTextureAux1x1();

	gl.enableVertexAttribArray(shader.position2_loc);
	FBO.bindAttribute(gl, this.quadBuffer_mosaic, shader.position2_loc, 2);

	if (shader.normal3_loc !== -1)
	{
		gl.enableVertexAttribArray(shader.normal3_loc); // only for cubeMaps.***
		FBO.bindAttribute(gl, this.normalBuffer, shader.normal3_loc, 3);
	}

	gl.enableVertexAttribArray(shader.texCoord2_loc);
	FBO.bindAttribute(gl, this.texCoordBuffer, shader.texCoord2_loc, 2);

	// If you want to see selectionBuffer.
	//var texture = magoManager.selectionFbo.colorBuffer; // framebuffer for color selection.***

	// If you want to see silhouetteDepthBuffer.
	var silhouetteDepthFbo = magoManager.getSilhouetteDepthFbo();
	var texture = silhouetteDepthFbo.colorBuffer;
	var tex3d;

	//if(magoManager.laserCamera)
	//{
	//	var options = {};
	//	var laserCamDepthFBO = magoManager.laserCamera.getDepthBufferFBO(magoManager, options);
	//	texture = laserCamDepthFBO.colorBuffer;
	//}

	gl.uniform1i(shader.uTextureType_loc, 0);
	//gl.uniform1i(shader.uSliceIdx_loc, 102); // frontier in 102 to 103.***
	gl.uniform1i(shader.uSliceIdx_loc, 11); 
	//gl.uniform1i(shader.uSliceIdx_loc, 67); 
	 

	// soundManager.*** soundManager.*** soundManager.***soundManager.*** soundManager.*** soundManager.***soundManager.*** soundManager.*** soundManager.***
	if (magoManager.soundManager)
	{
		if (this.lastIdx === undefined)
		{
			this.lastIdx = 0;
		}

		if (magoManager.soundManager.soundLayersArray.length > 0)
		{
			var soundLayer = magoManager.soundManager.soundLayersArray[0];
			if (soundLayer.demWithBuildingsTex && soundLayer.demWithBuildingsTex.texId)
			{
				texture = soundLayer.demWithBuildingsTex.texId;
			}

			if (soundLayer.soundSourceRealTexture3d)
			{
				if (soundLayer.soundSourceRealTexture3d.texturesArray.length > 0)
				{
					if (this.lastIdx >= soundLayer.soundSourceRealTexture3d.texturesArray.length)
					{
						this.lastIdx = 0;
					}
					//texture = soundLayer.soundSourceRealTexture3d.texturesArray[this.lastIdx];
					this.lastIdx += 1;
				}
			}

			if (soundLayer.soundSourceMosaicTexture3d)
			{
				if (soundLayer.soundSourceMosaicTexture3d.texturesArray.length > 0)
				{
					//texture = soundLayer.soundSourceMosaicTexture3d.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 4); // This decodes 4byte color4.***
				}
			}

			if (soundLayer.pressureMosaicTexture3d_A)
			{
				if (soundLayer.pressureMosaicTexture3d_A.texturesArray.length > 0)
				{
					//tex3d = soundLayer.pressureMosaicTexture3d_A;
					//gl.uniform1i(shader.uTextureType_loc, 4); 
				}
			}

			if (soundLayer.pressureMosaicTexture3d_B)
			{
				if (soundLayer.pressureMosaicTexture3d_B.texturesArray.length > 0)
				{
					//tex3d = soundLayer.pressureMosaicTexture3d_B;
					//gl.uniform1i(shader.uTextureType_loc, 4); 
				}
			}

			if (soundLayer.maxPressureMosaicTexture3d_A)
			{
				if (soundLayer.maxPressureMosaicTexture3d_A.texturesArray.length > 0)
				{
					//tex3d = soundLayer.maxPressureMosaicTexture3d_A;
					//gl.uniform1i(shader.uTextureType_loc, 4); 
				}
			}

			if (soundLayer.fluxRFUMosaicTexture3d_HIGH_A && soundLayer.fluxRFUMosaicTexture3d_LOW_A && soundLayer.fluxLBDMosaicTexture3d_HIGH_A && soundLayer.fluxLBDMosaicTexture3d_LOW_A)
			{
				/*
				if (soundLayer.fluxRFUMosaicTexture3d_HIGH_A.texturesArray.length > 0 && soundLayer.fluxRFUMosaicTexture3d_LOW_A.texturesArray.length > 0 &&
					soundLayer.fluxLBDMosaicTexture3d_HIGH_A.texturesArray.length > 0 && soundLayer.fluxLBDMosaicTexture3d_LOW_A.texturesArray.length > 0)
				{
					tex3d = soundLayer.fluxRFUMosaicTexture3d_HIGH_A; // this texture is binded at avobe.***
					gl.uniform1f(shader.u_maxFlux_loc, soundLayer.soundManager.maxFlux);
					gl.uniform1i(shader.uTextureType_loc, 1); // To see flux (encoded in 4 textures).***

					var texture_RFU_LOW_A = soundLayer.fluxRFUMosaicTexture3d_LOW_A.texturesArray[0];
					gl.activeTexture(gl.TEXTURE0 + 1); 
					gl.bindTexture(gl.TEXTURE_2D, texture_RFU_LOW_A);

					var texture_LBD_HIGH_A = soundLayer.fluxLBDMosaicTexture3d_HIGH_A.texturesArray[0];
					gl.activeTexture(gl.TEXTURE0 + 2); 
					gl.bindTexture(gl.TEXTURE_2D, texture_LBD_HIGH_A);

					var texture_LBD_LOW_A = soundLayer.fluxLBDMosaicTexture3d_LOW_A.texturesArray[0];
					gl.activeTexture(gl.TEXTURE0 + 3); 
					gl.bindTexture(gl.TEXTURE_2D, texture_LBD_LOW_A);
				}
				*/
			}

			if (soundLayer.fluxRFUMosaicTexture3d_HIGH_A)
			{
				if (soundLayer.fluxRFUMosaicTexture3d_HIGH_A.texturesArray.length > 0)
				{
					//tex3d = soundLayer.fluxRFUMosaicTexture3d_LOW_A;
					//gl.uniform1i(shader.uTextureType_loc, 2); 
				}
			}

			if (soundLayer.fluxRFUMosaicTexture3d_HIGH_B)
			{
				if (soundLayer.fluxRFUMosaicTexture3d_HIGH_B.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxRFUMosaicTexture3d_HIGH_B.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.fluxRFUMosaicTexture3d_LOW_A)
			{
				if (soundLayer.fluxRFUMosaicTexture3d_LOW_A.texturesArray.length > 0)
				{
					//tex3d = soundLayer.fluxRFUMosaicTexture3d_LOW_A;
					//gl.uniform1i(shader.uTextureType_loc, 0); 
				}
			}

			if (soundLayer.fluxLBDMosaicTexture3d_HIGH_B)
			{
				if (soundLayer.fluxLBDMosaicTexture3d_HIGH_B.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxLBDMosaicTexture3d_HIGH_B.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.fluxLBDMosaicTexture3d_LOW_A)
			{
				if (soundLayer.fluxLBDMosaicTexture3d_LOW_A.texturesArray.length > 0)
				{
					//texture = soundLayer.fluxLBDMosaicTexture3d_LOW_A.texturesArray[0];
					//gl.uniform1i(shader.uTextureType_loc, 2); // if want to see scene voxelization.***
				}
			}

			if (soundLayer.auxMosaicTexture3d_forFluxCalculation)
			{
				if (soundLayer.auxMosaicTexture3d_forFluxCalculation.texturesArray.length > 0)
				{
					//texture = soundLayer.auxMosaicTexture3d_forFluxCalculation.texturesArray[0];
				}
			}

			if (soundLayer.airVelocity_B)
			{
				if (soundLayer.airVelocity_B.texturesArray.length > 0)
				{
					//tex3d = soundLayer.airVelocity_B;
					//gl.uniform1i(shader.uTextureType_loc, 5); 
				}
			}

			if (soundLayer.shaderLogTexture)
			{
				if (soundLayer.shaderLogTexture.texturesArray.length > 0)
				{
					//texture = soundLayer.shaderLogTexture.texturesArray[0];
				}
			}

			if (soundLayer.shaderLogTexture_vel)
			{
				if (soundLayer.shaderLogTexture_vel.texturesArray.length > 0)
				{
					//texture = soundLayer.shaderLogTexture_vel.texturesArray[0];
				}
			}

			if (soundLayer.simulBoxdoubleDepthTex)
			{
				//texture = soundLayer.simulBoxdoubleDepthTex;
			}

			if (soundLayer.simulBoxDoubleNormalTex)
			{
				//texture = soundLayer.simulBoxDoubleNormalTex;
			}

			if (soundLayer.volumRenderTex)
			{
				//texture = soundLayer.volumRenderTex;
			}

			if (soundLayer.auxTex3d_yDirection)
			{
				if (soundLayer.auxTex3d_yDirection.texturesArray || soundLayer.auxTex3d_yDirection.texturesArray.length > 0)
				{
					//texture = soundLayer.auxTex3d_yDirection.texturesArray[1];
				}
				
			}

			if (soundLayer.mosaic_partial_ydirection)
			{
				if (soundLayer.mosaic_partial_ydirection.texturesArray || soundLayer.mosaic_partial_ydirection.texturesArray.length > 0)
				{
					//texture = soundLayer.mosaic_partial_ydirection.texturesArray[0];
				}
				
			}
		}
	}

	if (tex3d === undefined)// && texture === undefined)
	{
		//return;
	}

	//texture = tex3d.texturesArray[0];
	if (tex3d)
	{
		gl.uniform1iv(shader.u_mosaicSize_loc, [tex3d.mosaicXCount, tex3d.mosaicYCount, tex3d.finalSlicesCount]); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	}
	else 
	{
		gl.uniform1iv(shader.u_mosaicSize_loc, [1, 1, 1]);
	}

	if (texture === undefined)
	{ return; }

	gl.activeTexture(gl.TEXTURE0 + 0); 
	gl.bindTexture(gl.TEXTURE_2D, texture);

	var webglController = new WebGlController(gl);

	webglController.frontFace(gl.CCW);
	webglController.depthMask(false);
	webglController.disable_GL_DEPTH_TEST();

	gl.drawArrays(gl.TRIANGLES, 0, 6);

	postFxShadersManager.useProgram(null);
	webglController.restoreAllParameters();

	gl.activeTexture(gl.TEXTURE0 + 0); 
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.activeTexture(gl.TEXTURE0 + 1);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

};

/**
 * This function renders screenSpaceObjects.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 */
Renderer.prototype.renderScreenSpaceObjects = function(gl) 
{
	// Render screenSpaceObjects, as speechBubbles.
	// Create screenSpaceFBO if no exist.
	var magoManager = this.magoManager;
	if (!magoManager.screenSpaceFBO)
	{
		// create a lBuffer with 2 colorTextures : diffuseLighting & specularLighting.
		var bufferWidth = magoManager.sceneState.drawingBufferWidth[0];
		var bufferHeight = magoManager.sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		magoManager.screenSpaceFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 3}); 
	}

	var screenSpaceFBO = magoManager.screenSpaceFBO;
	var extbuffers = magoManager.extbuffers;

	screenSpaceFBO.bind();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, screenSpaceFBO.colorBuffersArray[0], 0); // depth.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, screenSpaceFBO.colorBuffersArray[1], 0); // normal.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, screenSpaceFBO.colorBuffersArray[2], 0); // albedo.

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - depth
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - normal
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - albedo
		extbuffers.NONE //
	]);

		
	if (magoManager.isFarestFrustum())
	{
		gl.clearColor(0, 0, 0, 0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);

	}
	gl.clear(gl.DEPTH_BUFFER_BIT);

	// 1) Render ObjectMarkers.********************************************************************************************************
	gl.enable(gl.BLEND);	
	var renderType = 1;
	magoManager.objMarkerManager.render(magoManager, renderType); 

	//---------------------------------------------------------------------------------------------------------------------------------
	gl.disable(gl.BLEND);	

};

/**
 * This function renders lightBuffer.
 * @param {Array} lightSourcesArray .
 */
Renderer.prototype.renderLightDepthCubeMaps = function (lightSourcesArray) 
{
	var magoManager = this.magoManager;
	var lightSourcesCount = lightSourcesArray.length;

	if (lightSourcesCount === 0)
	{ return; }

	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;
	
	var currentShader = magoManager.postFxShadersManager.getShader("modelRefDepth");  
	currentShader.resetLastBuffersBinded();
	//shaderProgram = currentShader.program;

	currentShader.useProgram();
	magoManager.effectsManager.setCurrentShader(currentShader);
	currentShader.disableVertexAttribArrayAll();
	currentShader.enableVertexAttribArray(currentShader.position3_loc);
	// magoManager.postFxShadersManager.bUseLogarithmicDepth
	var bUseLogarithmicDepth = false; // for lightMap no necessary logDepth precision.***
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.bHasTexture_loc, false);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	//gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, false);

	//currentShader.bindUniformGenerals();
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
	gl.uniform1i(currentShader.bApplySsao_loc, false); // apply ssao.***
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***

	gl.depthRange(0.0, 1.0);
	gl.depthMask(true);
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);

	var light;
	var objects;
	var renderTexture = undefined;
	var renderType = 0;
	var minSizeToRender = undefined;
	var refTMatrixIdxKey = 0;

	var options = {
		bRenderOpaques      : true,
		bRenderTransparents : false
	};

	for (var i=0; i<lightSourcesCount; i++)
	{
		light = lightSourcesArray[i];

		if (light.bCubeMapMade)
		{ continue; }

		var visibleObjectsControler = light.visibleObjectsControler;

		if (!visibleObjectsControler)
		{ continue; }

		var visibleNodesCount = visibleObjectsControler.currentVisibles0.length;
		var visibleNativesCount = visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.length;

		//if(visibleNodesCount === 0 && visibleNativesCount === 0)
		//continue;

		var geoLocDataManager = light.getGeoLocDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();

		gl.uniform3fv(currentShader.encodedCameraPositionMCHigh_loc, geoLocData.positionHIGH);
		gl.uniform3fv(currentShader.encodedCameraPositionMCLow_loc, geoLocData.positionLOW);

		var cubeMapFbo = light._getCubeMapFrameBuffer(gl);
		gl.viewport(0, 0, cubeMapFbo.width[0], cubeMapFbo.width[0]);
		gl.clearColor(1, 1, 1, 1);
		gl.clearDepth(1.0);
		
		// Take the cubeMap of the light.
		for (var face = 0; face<6; face++)
		{
			light.bindCubeMapFrameBuffer(face, magoManager);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
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

		// return gl settings.***
		gl.clearColor(0, 0, 0, 1);

		light.bCubeMapMade = true;
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

Renderer.prototype.renderLightBuffer = function (lightSourcesArray) 
{
	var magoManager = this.magoManager;
	var lightSourcesCount = lightSourcesArray.length;

	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;

	var lBuffer = magoManager.lBuffer;
	lBuffer.bind();

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var extbuffers = lBuffer.extbuffers;
	
	// Bind mago colorTextures:
	gl.framebufferTexture2D(gl.FRAMEBUFFER, lBuffer.extbuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, magoManager.diffuseLightTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, lBuffer.extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.specularLightTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, lBuffer.extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.LightFogTex, 0);

	extbuffers.drawBuffersWEBGL([
		lBuffer.extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - diffuseLighting
		lBuffer.extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - specularLighting
		lBuffer.extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - lightFog
	]);
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
	gl.clearColor(0, 0, 0, 0);
	gl.clearDepth(1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0, 0, 0, 1);

	if (lightSourcesCount === 0)
	{ return; }

	// bind LBuffer shader.
	var bApplySsao = false;
	var bApplyShadow = sceneState.applyLightsShadows;

	var currentShader = magoManager.postFxShadersManager.getShader("lBuffer"); 
	magoManager.postFxShadersManager.useProgram(currentShader);
	magoManager.effectsManager.setCurrentShader(currentShader);
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth); // lBufferRender NO uses logDepth, but the depthBuffer can be in logDepth.
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform2fv(currentShader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform1i(currentShader.bApplyShadows_loc, bApplyShadow);

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

	// Note : The "frontFace" MUST be "CW", bcos "CCW" no iluminates when camera is inside of the light-volume.
	gl.frontFace(gl.CW);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
	gl.depthMask(false);
	gl.disable(gl.DEPTH_TEST);
	
	var light;
	var renderType = 1;
	var glPrimitive = undefined;
	var bIsSelected = undefined;
	for (var i=0; i<lightSourcesCount; i++)
	{
		light = lightSourcesArray[i];
		var lightDirWC = light.getLightDirectionWC();
		var cubeMapFbo = light._getCubeMapFrameBuffer(gl); // light's depthCubeMap
		var geoLoc = light.geoLocDataManager.getCurrentGeoLocationData();
		var buildingRotMatInv = geoLoc.getRotMatrixInv();
		gl.uniformMatrix4fv(currentShader.buildingRotMatrixInv_loc, false, buildingRotMatInv._floatArrays);
		
		// set the light direction WC.
		gl.uniform3fv(currentShader.lightDirWC_loc, [lightDirWC.x, lightDirWC.y, lightDirWC.z]); //.
		gl.uniform3fv(currentShader.uLightColorAndBrightness_loc, [light.color.r, light.color.g, light.color.b] ); //.
		gl.uniform1f(currentShader.uLightIntensity_loc, light.intensity);
		var lightParams = light.getLightParameters(); //uLightParameters[4]; // 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.

		if (!lightParams) { continue; }

		gl.uniform1fv(currentShader.uLightParameters_loc, lightParams);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapFbo.colorBuffer);


		// 1rst, do light pass.**************************************************************
		gl.uniform1i(currentShader.u_processType_loc, 1); // light pass.
		gl.frontFace(gl.CW);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		light.render(magoManager, currentShader, renderType, glPrimitive, bIsSelected);

		// Now, do light-fog pass.***********************************************************
		gl.uniform1i(currentShader.u_processType_loc, 2); // light-fog pass.
		gl.frontFace(gl.CCW);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		light.render(magoManager, currentShader, renderType, glPrimitive, bIsSelected);
	}
	

	magoManager.postFxShadersManager.useProgram(null);

	lBuffer.unbind();

	// restore gl settings.***
	gl.frontFace(gl.CCW);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
};

Renderer.prototype.renderGeometryBufferORT = function (gl, renderType, visibleObjControlerNodes, options) 
{
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	var currentShader;
	var renderTexture = false;

	gl.disable(gl.BLEND); // No blend in GBuffer.
	
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
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes);
			
		// ssao render.************************************************************************************************************
		var visibleObjectControllerHasRenderables = visibleObjControlerNodes.hasRenderables();
		if (visibleObjectControllerHasRenderables || magoManager.modeler !== undefined)
		{
			var shaderManager = magoManager.postFxShadersManager;
			currentShader = shaderManager.getShader("gBufferORT");
			// --------------------------------------------------------------------------------

			shaderManager.useProgram(currentShader);
			magoManager.effectsManager.setCurrentShader(currentShader);
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, shaderManager.bUseLogarithmicDepth);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform1i(currentShader.clippingType_loc, 0);
			gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, shaderManager.bUseMultiRenderTarget);

			var projectionMatrixInv = sceneState.getProjectionMatrixInv();
			gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
			var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
			gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

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
			if (currentShader.normal3_loc !== -1) 
			{
				gl.enableVertexAttribArray(currentShader.normal3_loc);
			}
			
			if (currentShader.color4_loc !== -1)
			{ 
				gl.disableVertexAttribArray(currentShader.color4_loc); 
			}
			
			currentShader.bindUniformGenerals();
			//gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
			gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
			gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
			gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
			

			gl.enable(gl.CULL_FACE);
			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			
			// temp test excavation, thickLines, etc.***.
			//magoManager.modeler.render(magoManager, currentShader, renderType);
			// excavation objects.
			
			// after render native geometries, set current shader.
			currentShader = shaderManager.getShader("gBufferORT"); 
			shaderManager.useProgram(currentShader);
			gl.uniform1i(currentShader.clippingType_loc, 0);
			
			
			
			// we are in ORT (one rendering target).*********************************************************************************
			//magoManager.texturesManager.texturesMergerFbo.bind();
			magoManager.bindMainFramebuffer();
			// Render depth, normal & albedo separately.***
			// check options:
			var bRenderDepth = true;
			var bRenderNormal = true;
			var bRenderAlbedo = true;
			var bRenderSelColor = true;

			// Ouput textures.***
			var depthTex = magoManager.depthTex;
			var normalTex = magoManager.normalTex;
			var albedoTex = magoManager.cesiumColorBuffer;
			var selColorTex = magoManager.selColorTex;

			if (options)
			{
				if (options.bRenderDepth !== undefined)
				{
					bRenderDepth = options.bRenderDepth;
				}

				if (options.bRenderNormal !== undefined)
				{
					bRenderNormal = options.bRenderNormal;
				}

				if (options.bRenderAlbedo !== undefined)
				{
					bRenderAlbedo = options.bRenderAlbedo;
				}

				if (options.bRenderSelColor !== undefined)
				{
					bRenderSelColor = options.bRenderSelColor;
				}

				// Check for textures.***
				if (options.ouputDepthTex !== undefined)
				{
					depthTex = options.ouputDepthTex;
				}

				if (options.ouputNormalTex !== undefined)
				{
					normalTex = options.ouputNormalTex;
				}

				if (options.ouputAlbedoTex !== undefined)
				{
					albedoTex = options.ouputAlbedoTex;
				}

				if (options.ouputSelColorTex !== undefined)
				{
					selColorTex = options.ouputSelColorTex;
				}
			}

			for (var i=0; i<4; i++)
			{
				if (i === 0)
				{
					// depth.***
					if (!bRenderDepth)
					{
						continue;
					}
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthTex, 0);
				}
				else if (i === 1)
				{
					// normal.***
					if (!bRenderNormal)
					{
						continue;
					}
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, normalTex, 0);
				}
				else if (i === 2)
				{
					// albedo.***
					if (!bRenderAlbedo)
					{
						continue;
					}
					// In ORT mode, the albedoTex = cesiumColorBuffer.***
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, albedoTex, 0);
				}
				else if (i === 3)
				{
					// selColorTex.***
					if (!bRenderSelColor)
					{
						continue;
					}
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, selColorTex, 0);
					if (magoManager.isFarestFrustum())
					{
						gl.clearColor(1, 1, 1, 1);
						gl.clearDepth(1);
						gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
						gl.clearColor(0, 0, 0, 1);
					}
					else
					{
						gl.clearDepth(1);
						gl.clear(gl.DEPTH_BUFFER_BIT);
					}
				}
				gl.uniform1i(currentShader.u_outputTarget_loc, i); 
			
				//this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
				if (i === 2 && visibleObjControlerNodes.currentVisibles0.length > 0)
				{
					var hola = 0;
				}
				this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
				
				gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 
				
				this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
				this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
				
				// native objects.
				var options = {
					bRenderOpaques      : true,
					bRenderTransparents : false
				};

				
				this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
				gl.uniform1i(currentShader.clippingType_loc, 0); // 0= no clipping.***

				// MgSets.***
				//if (visibleObjControlerNodes.mgSetsArray.length > 0)
				//{
				//	this.renderMgSets(visibleObjControlerNodes.mgSetsArray, currentShader, renderTexture, renderType, minSizeToRender);
				//}

				magoManager.swapRenderingFase();
			}
			
			//currentShader.disableVertexAttribArrayAll();
			shaderManager.useProgram(null);
		}

		// draw the axis.***
		//if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
		//{
		//	this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
		//}
		

		// PointsCloud opaque.****************************************************************************************
		// PointsCloud opaque.****************************************************************************************
		// https://publik.tuwien.ac.at/files/publik_252607.pdf
		var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			magoManager.sceneState.camera.setCurrentFrustum(0);
			var frustumIdx = magoManager.currentFrustumIdx;
			magoManager.sceneState.camera.frustum.near[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].near[0];
			magoManager.sceneState.camera.frustum.far[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].far[0];
			var currentShaderPc;
			if (renderingSettings.getApplySsao())
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } 
				else
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			else
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } // change this for "pointsCloud_rainbow" todo:
				else
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			currentShaderPc.useProgram();
			currentShaderPc.resetLastBuffersBinded();
			currentShaderPc.enableVertexAttribArray(currentShaderPc.position3_loc);
			currentShaderPc.enableVertexAttribArray(currentShaderPc.color4_loc);
			currentShaderPc.bindUniformGenerals();
			
			gl.uniform1f(currentShaderPc.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShaderPc.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (magoManager.pointsCloudWhite !== undefined && magoManager.pointsCloudWhite)
			{
				gl.uniform1i(currentShaderPc.bUse1Color_loc, true);
				gl.uniform4fv(currentShaderPc.oneColor4_loc, [0.99, 0.99, 0.99, 1.0]); //.***
			}
			else 
			{
				gl.uniform1i(currentShaderPc.bUse1Color_loc, false);
			}
			var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
			gl.uniform1i(currentShaderPc.bUseColorCodingByHeight_loc, true);
			gl.uniform1f(currentShaderPc.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
			gl.uniform1f(currentShaderPc.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
			gl.uniform1f(currentShaderPc.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
			gl.uniform1f(currentShaderPc.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
			gl.uniform1f(currentShaderPc.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
			gl.uniform1i(currentShaderPc.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShaderPc.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
			gl.uniform1f(currentShaderPc.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform2fv(currentShaderPc.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
			gl.uniform1i(currentShaderPc.uFrustumIdx_loc, magoManager.currentFrustumIdx);

			// Test to load pCloud.***
			if (magoManager.visibleObjControlerPCloudOctrees === undefined)
			{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			magoManager.visibleObjControlerPCloudOctrees.clear();
			this.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShaderPc, renderTexture, renderType); // lod0.***
			currentShaderPc.disableVertexAttribArrayAll();
			
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
					if (octree.preparePCloudData(magoManager)) 
					{
						loadCount++;
					}
		
					if (loadCount > 1) 
					{
						break;
					}
				}
			}

		}
	}

	// In ORT mode, must return the framebufferTexture2D of the cesium.***
	// Return the cesiumColorBuffer.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, magoManager.cesiumColorBuffer, 0);
	gl.depthRange(0.0, 1.0);
};

/**
 * This function renders geometryBuffer.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryBuffer = function (gl, renderType, visibleObjControlerNodes) 
{	
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND); // No blend in GBuffer.
	
	var currentShader;
	var renderTexture = false;
	
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

		var bApplySsao = false;
		var bApplyShadow = false;
		if (magoManager.currentFrustumIdx < 2)
		{ bApplySsao = sceneState.getApplySsao(); }
	
		if (sceneState.sunSystem !== undefined && sceneState.applySunShadows)
		{ bApplyShadow = true; }

	
		
		// check changesHistory.
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes);
			
		// ssao render.************************************************************************************************************
		var visibleObjectControllerHasRenderables = visibleObjControlerNodes.hasRenderables();
		var mgSetsArray = visibleObjControlerNodes.mgSetsArray;
		if (mgSetsArray && mgSetsArray.length > 0)
		{
			var hola = 0;
		}

		if (visibleObjectControllerHasRenderables || magoManager.modeler !== undefined)
		{
			var shaderManager = magoManager.postFxShadersManager;
			currentShader = shaderManager.getShader("gBuffer"); // (GBufferVS, GBufferFS).***
			// --------------------------------------------------------------------------------

			shaderManager.useProgram(currentShader);
			magoManager.effectsManager.setCurrentShader(currentShader);
			gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, shaderManager.bUseLogarithmicDepth);
			gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform1i(currentShader.clippingType_loc, 0);
			gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, shaderManager.bUseMultiRenderTarget);

			var projectionMatrixInv = sceneState.getProjectionMatrixInv();
			gl.uniformMatrix4fv(currentShader.projectionMatrixInv_loc, false, projectionMatrixInv._floatArrays);
			var modelViewMatrixRelToEyeInv = sceneState.getModelViewRelToEyeMatrixInv();
			gl.uniformMatrix4fv(currentShader.modelViewMatrixRelToEyeInv_loc, false, modelViewMatrixRelToEyeInv._floatArrays);

			// check if exist clippingPlanes.
			var clippingBox = magoManager.modeler.clippingBox;
			if (clippingBox !== undefined)
			{
				var geoLocData = clippingBox.getCurrentGeoLocationData();
				gl.uniform3fv(currentShader.uniformsLocations["clippingBoxSplittedPos[0]"], geoLocData.positionSplitted);
				var planesPosFloat32Array = clippingBox.getPlanesPositionsFloat32Array();
				var planesNorFloat32Array = clippingBox.getPlanesNormalsFloat32Array();
				var planesCount = clippingBox.getPlanesCount();

				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
				gl.uniform1i(currentShader.clippingPlanesCount_loc, planesCount);
				var clippingBoxPlanesPosLC_loc = currentShader.uniformsLocations["clippingBoxPlanesPosLC[0]"];
				var clippingBoxPlanesNorLC_loc = currentShader.uniformsLocations["clippingBoxPlanesNorLC[0]"];
				gl.uniform3fv(clippingBoxPlanesPosLC_loc, planesPosFloat32Array);
				gl.uniform3fv(clippingBoxPlanesNorLC_loc, planesNorFloat32Array);
				
				gl.uniformMatrix4fv(currentShader.uniformsLocations.clippingBoxRotMatrix, false, geoLocData.rotMatrix._floatArrays);
			}
			else 
			{
				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, false);
			}
			
			gl.enableVertexAttribArray(currentShader.texCoord2_loc);
			gl.enableVertexAttribArray(currentShader.position3_loc);
			if (currentShader.normal3_loc !== -1) 
			{
				gl.enableVertexAttribArray(currentShader.normal3_loc);
			}
			
			if (currentShader.color4_loc !== -1)
			{ 
				gl.disableVertexAttribArray(currentShader.color4_loc); 
			}
			
			currentShader.bindUniformGenerals();
			//gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
			gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
			gl.uniform1i(currentShader.refMatrixType_loc, 0); // init referencesMatrix.
			gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
			gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
			gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.

			var refTMatrixIdxKey = 0;
			var minSizeToRender = 0.0;
			var renderType = 1;
			var refMatrixIdxKey =0; // provisionally set magoManager var here.***
			
			// temp test excavation, thickLines, etc.***.
			//magoManager.modeler.render(magoManager, currentShader, renderType);
			// excavation objects.
			
			// after render native geometries, set current shader with "modelRefSsao" shader.
			currentShader = shaderManager.getShader("gBuffer"); 
			shaderManager.useProgram(currentShader);
			gl.uniform1i(currentShader.clippingType_loc, 0);
			
			//this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 
			
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			// native objects.
			var options = {
				bRenderOpaques      : true,
	 			bRenderTransparents : false
			};

			
			
			this.renderNativeObjects(gl, currentShader, renderType, visibleObjControlerNodes, options);
			gl.uniform1i(currentShader.clippingType_loc, 0); // 0= no clipping.***

			// MgSets.***
			if (visibleObjControlerNodes.mgSetsArray.length > 0)
			{
				this.renderMgSets(visibleObjControlerNodes.mgSetsArray, currentShader, renderTexture, renderType, minSizeToRender);
			}
			
			currentShader.disableVertexAttribArrayAll();
			shaderManager.useProgram(null);
		}

		// draw the axis.***
		if (magoManager.magoPolicy.getShowOrigin() && visibleObjControlerNodes.getAllVisibles().length > 0)
		{
			this.renderAxisNodes(visibleObjControlerNodes.getAllVisibles(), renderType);
		}
		
		

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
		
		// PointsCloud opaque.****************************************************************************************
		// PointsCloud opaque.****************************************************************************************
		// https://publik.tuwien.ac.at/files/publik_252607.pdf
		var nodesPCloudCount = magoManager.visibleObjControlerNodes.currentVisiblesAux.length;
		if (nodesPCloudCount > 0)
		{
			magoManager.sceneState.camera.setCurrentFrustum(0);
			var frustumIdx = magoManager.currentFrustumIdx;
			magoManager.sceneState.camera.frustum.near[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].near[0];
			magoManager.sceneState.camera.frustum.far[0] = magoManager.sceneState.camera.frustumsArray[frustumIdx].far[0];
			var currentShaderPc;
			if (renderingSettings.getApplySsao())
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } 
				else
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			else
			{ 
				if (renderingSettings.getPointsCloudInColorRamp())
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao_rainbow"); } // change this for "pointsCloud_rainbow" todo:
				else
				{ currentShaderPc = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); } 
			}
			currentShaderPc.useProgram();
			currentShaderPc.resetLastBuffersBinded();
			currentShaderPc.enableVertexAttribArray(currentShaderPc.position3_loc);
			currentShaderPc.enableVertexAttribArray(currentShaderPc.color4_loc);
			currentShaderPc.bindUniformGenerals();
			
			gl.uniform1f(currentShaderPc.externalAlpha_loc, 1.0);
			var bApplySsao = true;
			gl.uniform1i(currentShaderPc.bApplySsao_loc, bApplySsao); // apply ssao default.***
			
			if (magoManager.pointsCloudWhite !== undefined && magoManager.pointsCloudWhite)
			{
				gl.uniform1i(currentShaderPc.bUse1Color_loc, true);
				gl.uniform4fv(currentShaderPc.oneColor4_loc, [0.99, 0.99, 0.99, 1.0]); //.***
			}
			else 
			{
				gl.uniform1i(currentShaderPc.bUse1Color_loc, false);
			}
			var pCloudSettings = magoManager.magoPolicy.getPointsCloudSettings();
			gl.uniform1i(currentShaderPc.bUseColorCodingByHeight_loc, true);
			gl.uniform1f(currentShaderPc.minHeight_rainbow_loc, parseInt(pCloudSettings.minHeightRainbow));
			gl.uniform1f(currentShaderPc.maxHeight_rainbow_loc, parseInt(pCloudSettings.maxHeightRainbow));
			gl.uniform1f(currentShaderPc.maxPointSize_loc, parseInt(pCloudSettings.maxPointSize));
			gl.uniform1f(currentShaderPc.minPointSize_loc, parseInt(pCloudSettings.minPointSize));
			gl.uniform1f(currentShaderPc.pendentPointSize_loc, parseInt(pCloudSettings.pendentPointSize));
			gl.uniform1i(currentShaderPc.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(currentShaderPc.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
			gl.uniform1f(currentShaderPc.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
			gl.uniform2fv(currentShaderPc.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
			gl.uniform1i(currentShaderPc.uFrustumIdx_loc, magoManager.currentFrustumIdx);

			// Test to load pCloud.***
			if (magoManager.visibleObjControlerPCloudOctrees === undefined)
			{ magoManager.visibleObjControlerPCloudOctrees = new VisibleObjectsController(); }
			
			magoManager.visibleObjControlerPCloudOctrees.clear();
			this.renderNeoBuildingsPCloud(gl, magoManager.visibleObjControlerNodes.currentVisiblesAux, magoManager, currentShaderPc, renderTexture, renderType); // lod0.***
			currentShaderPc.disableVertexAttribArrayAll();
			
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
					if (octree.preparePCloudData(magoManager)) 
					{
						loadCount++;
					}
		
					if (loadCount > 1) 
					{
						break;
					}
				}
			}

		}
	}

	//gl.depthRange(0.0, 1.0);	


};

/**
 * This function renders geometryBuffer for transparent objects.
 * @param {WebGLRenderingContext} gl WebGL Rendering Context.
 * @param {Number} renderType If renderType = 0 (depth render), renderType = 1 (color render), renderType = 2 (colorCoding render).
 * @param {VisibleObjectsController} visibleObjControlerNodes This object contains visible objects for the camera frustum.
 */
Renderer.prototype.renderGeometryBufferTransparents = function (gl, renderType, visibleObjControlerNodes) 
{
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	
	var currentShader;
	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var renderingSettings = magoManager._settings.getRenderingSettings();

	var renderTexture = false;
	var selectionManager = magoManager.selectionManager;

	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
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
		magoManager.checkChangesHistoryMovements(visibleObjControlerNodes);
		magoManager.checkChangesHistoryColors(visibleObjControlerNodes);
			
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
			var clippingBox = magoManager.modeler.clippingBox;
			if (clippingBox !== undefined)
			{
				var geoLocData = clippingBox.getCurrentGeoLocationData();
				gl.uniform3fv(currentShader.uniformsLocations["clippingBoxSplittedPos[0]"], geoLocData.positionSplitted);
				var planesPosFloat32Array = clippingBox.getPlanesPositionsFloat32Array();
				var planesNorFloat32Array = clippingBox.getPlanesNormalsFloat32Array();
				var planesCount = clippingBox.getPlanesCount();

				gl.uniform1i(currentShader.bApplyClippingPlanes_loc, true);
				gl.uniform1i(currentShader.clippingPlanesCount_loc, planesCount);
				var clippingBoxPlanesPosLC_loc = currentShader.uniformsLocations["clippingBoxPlanesPosLC[0]"];
				var clippingBoxPlanesNorLC_loc = currentShader.uniformsLocations["clippingBoxPlanesNorLC[0]"];
				gl.uniform3fv(clippingBoxPlanesPosLC_loc, planesPosFloat32Array);
				gl.uniform3fv(clippingBoxPlanesNorLC_loc, planesNorFloat32Array);
				
				gl.uniformMatrix4fv(currentShader.uniformsLocations.clippingBoxRotMatrix, false, geoLocData.rotMatrix._floatArrays);
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

			gl.activeTexture(gl.TEXTURE2); 
			gl.bindTexture(gl.TEXTURE_2D, textureAux1x1);
			
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

			// Init uniforms.
			gl.uniform1i(currentShader.clippingType_loc, 0);
			gl.uniform1f(currentShader.uModelOpacity_loc, 1.0);
			
			this.renderExcavationObjects(gl, currentShader, renderType, visibleObjControlerNodes);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles0Transparents, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			gl.uniform1i(currentShader.bApplySsao_loc, bApplySsao); 
			
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles2Transparents, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			this.renderNodes(gl, visibleObjControlerNodes.currentVisibles3Transparents, magoManager, currentShader, renderTexture, renderType, minSizeToRender, refTMatrixIdxKey);
			
			// native objects.
			var options = {
				bRenderOpaques      : false,
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
		
		// PointsCloud transparent.****************************************************************************************
		// PointsCloud transparent.****************************************************************************************
		/*
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

		/*
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
		
					if (octree.preparePCloudData(magoManager)) 
					{
				  loadCount++;
					}
		
					if (loadCount > 1) 
					{
				  break;
					}
			  }
			}
			

		}
		*/
	}
	
	// restore gl settings.***
	gl.disable(gl.BLEND);
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
	
	//gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	//gl.activeTexture(gl.TEXTURE1);
	//gl.bindTexture(gl.TEXTURE_2D, null);
	//gl.activeTexture(gl.TEXTURE2); 
	//gl.bindTexture(gl.TEXTURE_2D, null);
	
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
	var shaderManager = magoManager.postFxShadersManager;
	var currentShader = shaderManager.getUnitaryBBoxShader(magoManager); // box ssao.***
	var shaderProgram = currentShader.program;

	currentShader.useProgram();
	currentShader.disableVertexAttribArrayAll();
	currentShader.disableTextureImagesUnitsAll();

	gl.uniformMatrix4fv(currentShader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniform3fv(currentShader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
	gl.uniform3fv(currentShader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
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
		this.renderObject(gl, magoManager.unitaryBoxSC, magoManager, currentShader, ssao_idx, bRenderLines);
	}

	currentShader.resetLastBuffersBinded();
	currentShader.disableVertexAttribArrayAll();
	currentShader.disableTextureImagesUnitsAll();
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
	
	//gl.activeTexture(gl.TEXTURE0);
	//gl.bindTexture(gl.TEXTURE_2D, null);  // original.***
	//gl.activeTexture(gl.TEXTURE1);
	//gl.bindTexture(gl.TEXTURE_2D, null);
	//gl.activeTexture(gl.TEXTURE2); 
	//gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.disable(gl.BLEND);
	
};





