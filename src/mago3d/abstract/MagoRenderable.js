'use strict';

var MagoRenderable = function (options) 
{
	this.objectsArray = [];
	this._guid = createGuid();

	this.id;
	this.name;
	this.owner;

	this.attributes = {
		isVisible                   : true,
		isDeletableByFrustumCulling : false // if frustum culled, then this is deleted.
	};
	// Use this matrix if this is child.
	this.tMat;
	this.tMatOriginal;

	// use this geoLocDataManager if this is no child.
	this.geoLocDataManager;
	
	this.dirty = true;
	this.color4 =  new Color(1, 1, 1, 1);
	this.orgColor4 =  new Color(1, 1, 1, 1);
	this.wireframeColor4;
	this.selectedColor4;
	this.objectType = MagoRenderable.OBJECT_TYPE.MESH; // Init as mesh type.

	this.terrainHeight = 0;
	this.eventObject = {};

	this.fromDate = new Date();
	this.toDate = new Date();
	
	this.options = options;
	if (options !== undefined)
	{
		if (options.color && options.color instanceof Color) 
		{
			this.color4 = defaultValue(options.color, new Color(1, 1, 1, 1));
			this.orgColor4 = new Color(this.color4.r, this.color4.g, this.color4.b, this.color4.a);

			if (this.color4.a < 1) 
			{
				this.setOpaque(false);
			}
			else 
			{
				this.setOpaque(true);
			}
		}

		if (options.wireframeColor4 && options.wireframeColor4 instanceof Color) 
		{
			this.wireframeColor4 = options.wireframeColor4;
		}
	}
};

MagoRenderable.EVENT_TYPE = {
	'RENDER_END'   : 'renderEnd',
	'RENDER_START' : 'renderStart',
	'MOVE_END'     : 'moveEnd',
	'MOVE_START'   : 'moveStart'
};

MagoRenderable.OBJECT_TYPE = {
	'MESH'        : 0,
	'VECTORMESH'  : 1,
	'POINTMESH'   : 2,
	'LIGHTSOURCE' : 3
};
Object.defineProperties(MagoRenderable.prototype, {
	guid: {
		get: function()
		{
			return this._guid;
		}
	},
});
/**
 * 이벤트 등록
 * @param {MagoEvent} event 
 */
MagoRenderable.prototype.addEventListener = function (event) 
{
	if (!event instanceof MagoEvent) 
	{
		throw new Error('args event must MagoEvent!');
	}

	var type = event.getType();

	if (!MagoRenderable.EVENT_TYPE[type]) 
	{
		throw new Error('this type is not support.');
	}

	if (!this.eventObject[type]) 
	{
		this.eventObject[type] = [];
	}

	this.eventObject[type].push(event);
};

/**
 * 이벤트 실행
 * @param {String} type 
 */
MagoRenderable.prototype.dispatchEvent = function (type, magoManager) 
{
	if (!MagoRenderable.EVENT_TYPE[type]) 
	{
		throw new Error('this type is not support.');
	}

	var events = this.eventObject[type];

	if (!events || !Array.isArray(events)) { return; } 
	
	for (var i=0, len=events.length;i<len;i++) 
	{
		var event = events[i];
		var listener = event.getListener();
		if (typeof listener === 'function') 
		{
			listener.apply(this, [this, magoManager]);
		}
	}
};

MagoRenderable.prototype.init = function(magoManager) 
{
	// 1rst delete all objects.
	var vboMemManager = magoManager.vboMemoryManager;
	this.deleteObjects(vboMemManager);

	if (this instanceof MagoPolyline) 
	{
		this.knotGeoCoordsArray.length = 0;
	}
	// Now set dirty true.
	this.setDirty(true);
};

MagoRenderable.prototype.deleteObjects = function(vboMemManager) 
{
	if (this.texture) { this.texture.deleteObjects(vboMemManager.gl); } 
	
	if (this.objectsArray) 
	{
		var objectsCount = this.objectsArray.length;
		for (var i=0; i<objectsCount; i++)
		{
			this.objectsArray[i].deleteObjects(vboMemManager);
			this.objectsArray[i] = undefined;
		}
		delete this.objectsArray;
	}

	// Now delete the general objects.***
	delete this._guid;
	delete this.id;
	delete this.name;
	this.owner = undefined;

	delete this.attributes;
	if (this.tMat) 
	{
		this.tMat.deleteObjects();
		this.tMat = undefined;
	}

	if (this.tMatOriginal) 
	{
		this.tMatOriginal.deleteObjects();
		this.tMatOriginal = undefined;
	}

	if (this.geoLocDataManager) 
	{
		this.geoLocDataManager.deleteObjects();
		this.geoLocDataManager = undefined;
	}
	
	delete this.dirty;
	if (this.color4) 
	{
		this.color4.deleteObjects();
		this.color4 = undefined;
	}

	if (this.orgColor4) 
	{
		this.orgColor4.deleteObjects();
		this.orgColor4 = undefined;
	}

	if (this.wireframeColor4)
	{
		this.wireframeColor4.deleteObjects();
		delete this.wireframeColor4;
	}

	if (this.selectedColor4) 
	{
		this.selectedColor4.deleteObjects();
		this.selectedColor4 = undefined;
	}

	delete this.objectType; // Init as mesh type.

	delete this.terrainHeight;
	delete this.eventObject;

	delete this.fromDate;
	delete this.toDate;
	
	delete this.options;

};

MagoRenderable.prototype.getRootOwner = function() 
{
	if (this.owner === undefined)
	{ return this; }
	else 
	{
		return this.owner.getRootOwner();
	}
};

MagoRenderable.prototype.getObject = function(idx) 
{
	if (idx > this.objectsArray.length-1) 
	{
		throw new Error('out of bound range.');
		//return undefined;
	}

	return this.objectsArray[idx];
};

MagoRenderable.prototype.render = function (magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	if (this.attributes) 
	{
		if (this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
		{
			return;
		}
	}

	if (this.dirty)
	{ this.makeMesh(magoManager); }
	
	if (!this.objectsArray || this.objectsArray.length === 0)
	{ return false; }

	var gl = magoManager.getGl();
	if (this.attributes.opacity !== undefined)
	{
		gl.uniform1f(shader.externalAlpha_loc, this.attributes.opacity);
	}

	// Set geoLocation uniforms.***
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.

	//shader.clippingPolygon2dPoints_loc = gl.getUniformLocation(shader.program, "clippingPolygon2dPoints");
	//shader.clippingConvexPolygon2dPointsIndices_loc = gl.getUniformLocation(shader.program, "clippingConvexPolygon2dPointsIndices");

	if (this.attributes.doubleFace)
	{
		gl.disable(gl.CULL_FACE);
	}
	else 
	{
		gl.enable(gl.CULL_FACE);
	}

	var executedEffects = false;
	if (renderType !== 2 && magoManager.currentProcess !== CODE.magoCurrentProcess.StencilSilhouetteRendering)
	{ executedEffects = magoManager.effectsManager.executeEffects(this.guid, magoManager); }

	if (renderType === 1)
	{
		if (this.options && this.options.limitationGeographicCoords)
		{
			if (this.options.limitationHeights)
			{
				gl.uniform2fv(shader.limitationHeights_loc, this.options.limitationHeights);
				gl.uniform1i(shader.clippingType_loc, 4); // 2= clipping locally by polygon2d.***
			}
			else
			{
				gl.uniform1i(shader.clippingType_loc, 2); // 2= clipping locally by polygon2d.***
			}
			
			gl.uniform2fv(shader.clippingPolygon2dPoints_loc, this.uniformPoints2dArray);
			gl.uniform1iv(shader.clippingConvexPolygon2dPointsIndices_loc, this.uniformPolygonPointsIdx);

			var dynCol4 = this.options.limitationInfringingDynamicColor4;
			if (dynCol4)
			{
				if (dynCol4 instanceof DynamicColor) { dynCol4.updateColorAlarm(magoManager.getCurrentTime()); }
				gl.uniform4fv(shader.limitationInfringedColor4_loc, new Float32Array([dynCol4.r, dynCol4.g, dynCol4.b, dynCol4.a]));
			}
			else
			{
				gl.uniform4fv(shader.limitationInfringedColor4_loc, new Float32Array([1.0, 0.5, 0.2, 1.0]));
			}
		}
		else
		{
			if (this.options && this.options.limitationHeights)
			{
				gl.uniform2fv(shader.limitationHeights_loc, this.options.limitationHeights);
				gl.uniform1i(shader.clippingType_loc, 3); // 3= clipping locally by heights.***
				var dynCol4 = this.options.limitationInfringingDynamicColor4;
				if (dynCol4)
				{
					if (dynCol4 instanceof DynamicColor) { dynCol4.updateColorAlarm(magoManager.getCurrentTime()); }
					gl.uniform4fv(shader.limitationInfringedColor4_loc, new Float32Array([dynCol4.r, dynCol4.g, dynCol4.b, dynCol4.a]));
				}
				else 
				{
					gl.uniform4fv(shader.limitationInfringedColor4_loc, new Float32Array([1.0, 0.5, 0.2, 1.0]));
				}
			}
			else 
			{
				gl.uniform1i(shader.clippingType_loc, 0); // 0= no clipping.***
			}
		}
	}
	
	var renderShaded = true;
	if (this.options && this.options.renderShaded === false)
	{
		renderShaded = false;
	}
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);


	if (renderShaded)
	{ 
		gl.frontFace(gl.CW);
		this.renderAsChild(magoManager, shader, renderType, glPrimitive, bIsSelected, this.options); 

		gl.frontFace(gl.CCW);
		this.renderAsChild(magoManager, shader, renderType, glPrimitive, bIsSelected, this.options); 
	}


	// Return the opacity to 1.
	gl.uniform1f(shader.externalAlpha_loc, 1.0);
	// delete specularLighting
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	// return clippingType to 0 (0= no clipping).***
	gl.uniform1i(shader.clippingType_loc, 0);
	
	if (executedEffects)
	{
		// must return all uniforms changed for effects.
		gl.uniform3fv(shader.aditionalOffset_loc, [0.0, 0.0, 0.0]); // init referencesMatrix.
		gl.uniform3fv(shader.scaleLC_loc, [1.0, 1.0, 1.0]);   
		if (renderType === 1)
		{
			gl.uniform4fv(shader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
		}
	}

	// check options provisionally here.
	if (this.options)
	{
		var selectionManager = magoManager.selectionManager;
		var bIsSelected = false;
		if (selectionManager.isObjectSelected(this))
		{ bIsSelected = true; }

		if (bIsSelected || this.options.renderWireframe)
		{
			var shaderThickLine = magoManager.postFxShadersManager.getShader("thickLine");
			magoManager.postFxShadersManager.useProgram(shaderThickLine);
			shaderThickLine.bindUniformGenerals();
			var gl = magoManager.getGl();
			gl.uniform1i(shaderThickLine.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(shaderThickLine.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
			gl.uniform1i(shaderThickLine.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.disable(gl.CULL_FACE);
			
			gl.enableVertexAttribArray(shaderThickLine.prev_loc);
			gl.enableVertexAttribArray(shaderThickLine.current_loc);
			gl.enableVertexAttribArray(shaderThickLine.next_loc);
			
			var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
			geoLocData.bindGeoLocationUniforms(gl, shaderThickLine);

			var sceneState = magoManager.sceneState;
			var drawingBufferWidth = new Float32Array([sceneState.drawingBufferWidth[0]]);
			var drawingBufferHeight = new Float32Array([sceneState.drawingBufferHeight[0]]);
			if (this.wireframeColor4)
			{ gl.uniform4fv(shaderThickLine.oneColor4_loc, [this.wireframeColor4.r, this.wireframeColor4.g, this.wireframeColor4.b, this.wireframeColor4.a]); }
			else
			{ gl.uniform4fv(shaderThickLine.oneColor4_loc, [0.6, 0.8, 0.9, 1.0]); }
			gl.uniform2fv(shaderThickLine.viewport_loc, new Float32Array([drawingBufferWidth[0], drawingBufferHeight[0]]));
			
			var bWireframe = true;
			this.renderAsChild(magoManager, shaderThickLine, renderType, glPrimitive, bIsSelected, this.options, bWireframe);
			
			// Return to the currentShader.
			magoManager.postFxShadersManager.useProgram(shader);
		}
	}
};

MagoRenderable.prototype.renderAsChild = function (magoManager, shader, renderType, glPrimitive, bIsSelected, options, bWireframe) 
{
	if (this.dirty) 
	{ 
		this.makeMesh(magoManager); 
		return;
	}

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
		
		// Check if is selected.***
		var selectionManager = magoManager.selectionManager;

		if (selectionManager.isObjectSelected(this))
		{ bIsSelected = true; }
		
		if (bIsSelected)
		{
			var selColor = [0.9, 0.1, 0.1, 1.0];
			if (bWireframe)
			{
				selColor = [0.6, 0.6, 0.99, 1.0];
			}
			else
			{
				if (this.attributes.selectedColor4)
				{
					var selectedColor = this.attributes.selectedColor4;
					selColor = [selectedColor.r, selectedColor.g, selectedColor.b, selectedColor.a];
				}
			}
			
			gl.uniform4fv(shader.oneColor4_loc, selColor);
		}
		else 
		{
			if (bWireframe)
			{
				if (this.wireframeColor4) 
				{
					gl.uniform4fv(shader.oneColor4_loc, [this.wireframeColor4.r, this.wireframeColor4.g, this.wireframeColor4.b, this.wireframeColor4.a]); 
				}
			}
			else
			{
				if (this.color4) 
				{
					gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
				}
			}
		}

		if (magoManager.isCameraMoved && !magoManager.isCameraMoving )
		{
			//if (this.attributes.isSelectable !== undefined && this.attributes.isSelectable === false) 
			// Selection render.***
			var selectionColor = magoManager.selectionColor;
			var colorAux = selectionColor.getAvailableColor(undefined);
			var idxKey = selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
			magoManager.selectionManager.setCandidateGeneral(idxKey, this);
			gl.uniform4fv(shader.uSelColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
		}

	}

	if (this.tMat) 
	{
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.tMat._floatArrays);
	}
	
	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		var object = this.objectsArray[i];
		if (object instanceof VectorMesh || object instanceof VectorExtrudedMesh)
		{
			var shaderThickLine;
			if (renderType === 0)
			{
				//shaderThickLine = magoManager.postFxShadersManager.getShader("thickLineDepth");
				// do not renderDepth for thickLine objects.
				continue;
			}
			else if (renderType === 1)
			{
				var shaderName = "thickLine";
				if (object instanceof VectorExtrudedMesh)
				{ shaderName = "thickLineExtruded"; } // provisional.!!!
				shaderThickLine = magoManager.postFxShadersManager.getShader(shaderName);
			}
			magoManager.postFxShadersManager.useProgram(shaderThickLine);
			shaderThickLine.bindUniformGenerals();
			
			var gl = magoManager.getGl();
			gl.uniform1i(shaderThickLine.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
			gl.uniform1i(shaderThickLine.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
			gl.uniform1i(shaderThickLine.uFrustumIdx_loc, magoManager.currentFrustumIdx);

			gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.disable(gl.CULL_FACE);
			
			gl.enableVertexAttribArray(shaderThickLine.prev_loc);
			gl.enableVertexAttribArray(shaderThickLine.current_loc);
			gl.enableVertexAttribArray(shaderThickLine.next_loc);
			
			var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
			geoLocData.bindGeoLocationUniforms(gl, shaderThickLine);

			var sceneState = magoManager.sceneState;
			var drawingBufferWidth = sceneState.drawingBufferWidth;
			var drawingBufferHeight = sceneState.drawingBufferHeight;
			if (this.wireframeColor4)
			{ gl.uniform4fv(shaderThickLine.oneColor4_loc, [this.wireframeColor4.r, this.wireframeColor4.g, this.wireframeColor4.b, this.wireframeColor4.a]); }
			else
			{ gl.uniform4fv(shaderThickLine.oneColor4_loc, [0.2, 0.4, 0.9, 1.0]); }
			gl.uniform2fv(shaderThickLine.viewport_loc, [drawingBufferWidth[0], drawingBufferHeight[0]]);

			object.renderAsChild(magoManager, shaderThickLine, renderType, glPrimitive, bIsSelected, options, bWireframe);

			gl.enable(gl.CULL_FACE);

			// Return to the currentShader.
			magoManager.postFxShadersManager.useProgram(shader);
		}
		else if (object instanceof PointMesh)
		{
			var shaderLocal; 
			if (renderType === 0)
			{
				shaderLocal = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); 
			}
			else if (renderType === 1)
			{
				shaderLocal = magoManager.postFxShadersManager.getShader("pointsCloudSsao"); 
			}
			
			magoManager.postFxShadersManager.useProgram(shaderLocal);
			
			shaderLocal.disableVertexAttribArrayAll();
			shaderLocal.resetLastBuffersBinded();
			shaderLocal.enableVertexAttribArray(shaderLocal.position3_loc);
			shaderLocal.bindUniformGenerals();
			
			var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
			geoLocData.bindSplitedPositionUniforms(gl, shaderLocal);
			
			gl.uniform1i(shaderLocal.bPositionCompressed_loc, false);
			gl.uniform1i(shaderLocal.bUse1Color_loc, true);
			gl.uniform1i(shaderLocal.bUseFixPointSize_loc, 1);
			gl.uniform1i(shaderLocal.uStrokeSize_loc, this.style.strokeSize);
			gl.uniform1i(shaderLocal.uFrustumIdx_loc, magoManager.currentFrustumIdx);
			gl.depthRange(0, 0);
			object.renderAsChild(magoManager, shaderLocal, renderType, glPrimitive, bIsSelected, options, bWireframe);
			gl.depthRange(0, 1);
			// Return to the currentShader.
			magoManager.postFxShadersManager.useProgram(shader);
		}
		else
		{
			object.renderAsChild(magoManager, shader, renderType, glPrimitive, bIsSelected, options, bWireframe);
		}
	}

	this.dispatchEvent('RENDER_END', magoManager);
};

MagoRenderable.prototype.makeMesh = function(magoManager) 
{
	return throwAbstractError();
};

MagoRenderable.prototype.moved = function() 
{
	// do something.
	// delete boundingSphereWC, etc.
	this.boundingSphereWC = undefined;
};

MagoRenderable.prototype.updateMatrix = function(ownerMatrix) 
{
	if (!ownerMatrix) 
	{
		if (this.geoLocDataManager === undefined || this.geoLocDataManager === null) 
		{
			return;
		}

		var geoLocDataManager = this.geoLocDataManager;
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
		this.tMat = geoLocData.rotMatrix;
	}
	else 
	{
		this.tMat = this.tMatOriginal.getMultipliedByMatrix(ownerMatrix, this.tMat);
	}
    
	if (this.objectsArray === undefined)
	{ return; }
	for (var i=0, len=this.objectsArray.length; i <len;++i) 
	{
		var object = this.objectsArray[i];
		if (object instanceof MagoRenderable)
		{
			this.objectsArray[i].updateMatrix(this.tMat);
		}
	}
};

MagoRenderable.prototype.setDeleted = function(bDeleted) 
{
	// If a object.atributtes._deleted === true, then this object must be deleted.
	// objects marked sa "deleted" will be deleted in "magoManager.tilesMultiFrustumCullingFinished()" function.
	this.attributes._deleted = bDeleted;
};

MagoRenderable.prototype.setDirty = function(dirty) 
{
	this.dirty = dirty;
};
/**
 * Set the unique one color of the box
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b 
 * @param {Number} a
 */
MagoRenderable.prototype.setOneColor = function(r, g, b, a)
{
	// This function sets the unique one color of the mesh.***
	if (this.color4 === undefined)
	{ this.color4 = new Color(); }
	
	this.color4.setRGBA(r, g, b, a);

	//TODO : 좀 더 정교한 근사값 구하기로 변경
	if (a < 1) 
	{
		this.setOpaque(false);
	}
	else 
	{
		this.setOpaque(true);
	}
};
/**
 * restore color
 */
MagoRenderable.prototype.restoreColor = function()
{
	this.setOneColor(this.orgColor4.r, this.orgColor4.g, this.orgColor4.b, this.orgColor4.a);
	if (this.orgColor4.a < 1) 
	{
		this.setOpaque(false);
	}
	else 
	{
		this.setOpaque(true);
	}
};
/**
 * Set the unique one color of the box
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b 
 * @param {Number} a
 */
MagoRenderable.prototype.setWireframeColor = function(r, g, b, a)
{
	// This function sets the unique one color of the mesh.***
	if (this.wireframeColor4 === undefined)
	{ this.wireframeColor4 = new Color(); }
	
	this.wireframeColor4.setRGBA(r, g, b, a);

	//TODO : 좀 더 정교한 근사값 구하기로 변경
	if (a < 1) 
	{
		this.setOpaque(false);
	}
	else 
	{
		this.setOpaque(true);
	}
};

MagoRenderable.prototype.setOpaque = function(opaque)
{
	this.attributes.opaque = opaque;
};
MagoRenderable.prototype.isOpaque = function()
{
	if (this.attributes.opaque === undefined) 
	{
		return true;
	}

	return this.attributes.opaque;
};

MagoRenderable.prototype.setObjectType = function(objectType)
{
	this.objectType = objectType; 
};

MagoRenderable.prototype.getGeoLocDataManager = function()
{
	return this.geoLocDataManager;
};

MagoRenderable.prototype.getCurrentGeoLocationData = function()
{
	if (!this.geoLocDataManager) 
	{
		throw new Error('this data is not ready to use.');
	}
	var geoLoDataManager = this.getGeoLocDataManager();
	return geoLoDataManager.getCurrentGeoLocationData();
};

MagoRenderable.prototype.getBoundingSphereWC = function(resultBSphereWC)
{
	if (!this.boundingSphereWC)
	{
		this.boundingSphereWC = new BoundingSphere();

		// provisionally return an aproximate bsphere.***
		var geoLocationData = this.getCurrentGeoLocationData();
		var positionWC = geoLocationData.position;

		var radiusAprox = 200.0; // calculate it : TODO.
		this.boundingSphereWC.setCenterPoint(positionWC.x, positionWC.y, positionWC.z);
		this.boundingSphereWC.setRadius(radiusAprox);
	}

	if (!resultBSphereWC)
	{ resultBSphereWC = new BoundingSphere(); }

	var centerPoint = this.boundingSphereWC.centerPoint;
	resultBSphereWC.setCenterPoint(centerPoint.x, centerPoint.y, centerPoint.z);
	resultBSphereWC.setRadius(this.boundingSphereWC.r);
	return resultBSphereWC;
};

MagoRenderable.prototype.changeLocationAndRotation = function(latitude, longitude, elevation, heading, pitch, roll, magoManager)
{
	var geoLocationData = this.getCurrentGeoLocationData();
	ManagerUtils.calculateGeoLocationData(longitude, latitude, elevation, heading, pitch, roll, geoLocationData, magoManager);

	this.moved();
};

/**
 * set model position
 * @param {GeographicCoord} geographicCoord 
 */
MagoRenderable.prototype.setGeographicPosition = function(geographicCoord, heading, pitch, roll) 
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }

	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	if (geoLocData === undefined)
	{
		geoLocData = this.geoLocDataManager.newGeoLocationData("default");
	}

	heading = (heading === undefined || heading === null) ? 0 : heading;
	pitch = (pitch === undefined || pitch === null) ? 0 : pitch;
	roll = (roll === undefined || roll === null) ? 0 : roll;

	geoLocData = ManagerUtils.calculateGeoLocationData(geographicCoord.longitude, geographicCoord.latitude, geographicCoord.altitude, heading, pitch, roll, geoLocData);
};

/**
 * set model position
 * @param {Polygon2D} polygon2D 
 * @return {boolean}
 */
MagoRenderable.prototype.intersectionWithPolygon2D = function(polygon2D) 
{
	var result = false;
	if (this.geographicCoordList) 
	{
		result = intersectionWithPolygon2D(polygon2D, this.geographicCoordList.geographicCoordsArray);
	}
	else if (this.geographicCoordListsArray)
	{
		for (var i=0, len=this.geographicCoordListsArray.length;i<len;i++)
		{
			if (intersectionWithPolygon2D(polygon2D, this.geographicCoordListsArray[i].geographicCoordsArray)) 
			{
				result = true;
				break;
			}
		}
	}

	return result;

	function intersectionWithPolygon2D(target, gcList)
	{
		return target.intersectionWithPolygon2D(Polygon2D.makePolygonByGeographicCoordArray(gcList));
	}
};

/**
 * set terrain height. fire makemesh
 * @param {number} height terrain height
 */
MagoRenderable.prototype.setTerrainHeight = function(height)
{
	if (height === undefined || height === null) { height = 0; }
	this.terrainHeight = height;
	//this.setDirty(true);
	this.validTerrainHeight();
};

/**
 * set terrain height. fire makemesh
 * @param {number} height terrain height
 */
MagoRenderable.prototype.validTerrainHeight = function()
{
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	var validHeight = this.terrainHeight;
	if (this.relativeHeight && !isNaN(this.relativeHeight)) 
	{
		validHeight += this.relativeHeight;
	}
	geoLocData = ManagerUtils.calculateGeoLocationData(undefined, undefined, validHeight, undefined, undefined, undefined, geoLocData);
};

/**
 * attribute height reference에 따라 높이를 보정
 * @param {MagoManager} magoManager
 */
MagoRenderable.prototype.isNeedValidHeight = function(magoManager) 
{
	if (!magoManager.isCesiumGlobe()
	|| !this.attributes 
	|| !this.attributes.heightReference 
	|| this.attributes.heightReference === HeightReference.NONE)
	{
		return false;
	}

	return true;
};

/**
 * set From date
 * @param {Date} fromDate 
 */
MagoRenderable.prototype.setFromDate = function(fromDate) 
{
	if (!fromDate || !(fromDate instanceof Date)) 
	{
		throw new Error('fromDate is required(Date Type).');
	}
	this.fromDate = fromDate;
};
/**
 * get From date
 * @return {Date}
 */
MagoRenderable.prototype.getFromDate = function() 
{
	return this.fromDate;
};

/**
 * set To date
 * @param {Date} toDate 
 */
MagoRenderable.prototype.setToDate = function(toDate) 
{
	if (!toDate || !(toDate instanceof Date)) 
	{
		throw new Error('toDate is required(Date Type).');
	}
	this.toDate = toDate;
};
/**
 * get To date
 * @return {Date}
 */
MagoRenderable.prototype.getToDate = function() 
{
	return this.toDate;
};