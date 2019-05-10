
'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class Excavation
 */
var Excavation = function() 
{
	if (!(this instanceof Excavation)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geoCoordsList; // class : GeographicCoordsList.***
	this.geoLocDataManager;
	this.excavationDepthInMeters;
	
	this.vtxProfilesList;
	this.vboKeysContainer;
	this.vboKeysContainerEdges;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.getGeographicCoordsList = function() 
{
	if (this.geoCoordsList === undefined)
	{
		this.geoCoordsList = new GeographicCoordsList();
		this.geoCoordsList.owner = this;
	}
	
	return this.geoCoordsList;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.renderPoints = function(magoManager, shader, renderType) 
{
	if (this.geoCoordsList === undefined)
	{ return false; }
	
	if (this.meshPositive !== undefined)
	{
		this.renderExcavation(magoManager, shader, renderType);
	}
	
	this.geoCoordsList.renderPoints(magoManager, shader, renderType, false);
	this.geoCoordsList.renderLines(magoManager, shader, renderType, false, false);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.renderExcavation = function(magoManager, shader, renderType) 
{
	if (this.meshPositive === undefined)
	{ return; }
	
	//if(magoManager.currentFrustumIdx !== 0)
	//	return;
	
	var gl = magoManager.sceneState.gl;
	
	shader.useProgram();
	shader.resetLastBuffersBinded();

	shader.enableVertexAttribArray(shader.position3_loc);
	shader.disableVertexAttribArray(shader.color4_loc);
	shader.enableVertexAttribArray(shader.normal3_loc); 
	shader.disableVertexAttribArray(shader.texCoord2_loc); // provisionally has no texCoords.***
	
	shader.bindUniformGenerals();
	/*
	// Note: in this case, we must modify the modelViewProjectionRelToEyeMatrix, to change the farClip of the frustums.*********************************************
	var scene = magoManager.scene;
	var uniformState = scene._context.uniformState;
	
	var sceneState = magoManager.sceneState;
	var camera = magoManager.sceneState.camera;
	var frustum0 = sceneState.camera.getFrustum(0);
	var aspectRatio = frustum0.aspectRatio;
	var fovyRad = frustum0.fovyRad[0];
	var tangentOfHalfFovy = frustum0.tangentOfHalfFovy;
	//frustum0.far[0]; 
	//frustum0.near[0];
	
	// projection.*********************************************************************************************************
	var projectionMatrix = new Matrix4();
	var far = camera.frustum.far[0];
	var near = camera.frustum.near[0];
	
	// By Perspective.***
	var projectionMatrix2 = new Matrix4();
	projectionMatrix2._floatArrays = mat4.perspective(projectionMatrix2._floatArrays, fovyRad, aspectRatio, near, far);
	
	// By Frustum.***
	var cesiumOffCenterFrustum = scene.camera.frustum._offCenterFrustum;
	var left = cesiumOffCenterFrustum._left;
	var right = cesiumOffCenterFrustum._right;
	var bottom = cesiumOffCenterFrustum._bottom;
	var top = cesiumOffCenterFrustum._top;
	//var near = cesiumOffCenterFrustum._near;
	//var far = cesiumOffCenterFrustum._far;
	
	//if(magoManager.currentFrustumIdx === 1)
	{
		//near = scene.camera.frustum.near;
		//far += 500.0;
	}
	
	
	// calculate nearTop.***
	//if(magoManager.currentFrustumIdx !== 0)
	//near *= 0.99;
	var nearTop = near * tangentOfHalfFovy;
	var nearRight = nearTop * aspectRatio;
	var nearBottom = -nearTop;
	var nearLeft = -nearRight;
	
	//if(magoManager.currentFrustumIdx !== 0)
	//	near *= 0.9;

	projectionMatrix._floatArrays = mat4.frustum(projectionMatrix._floatArrays, nearLeft, nearRight, nearBottom, nearTop, near, far);
	
	
	
	// modelView.************************************************************************************************************
	var camPos = camera.position;
	var camDir = camera.direction;
	var camUp = camera.up;
	var far = camera.frustum.far[0];
	
	camPos.set(0.0, 0.0, 0.0);// test.***
	
	var tergetX = camPos.x + camDir.x * far;
	var tergetY = camPos.y + camDir.y * far;
	var tergetZ = camPos.z + camDir.z * far;
	
	// test comprovation (posModul must be small than tergetModul).***
	var posModul = camPos.getModul();
	var targetModul = Math.sqrt(tergetX*tergetX, tergetY*tergetY, tergetZ*tergetZ);
	
	if (posModul < targetModul)
	{ var hola = 0; }
	// End test comprobation.-------------------------------------------

	var modelViewMatrix = new Matrix4();																	
	modelViewMatrix._floatArrays = Matrix4.lookAt(modelViewMatrix._floatArrays, [camPos.x, camPos.y, camPos.z], 
		[tergetX, tergetY, tergetZ], 
		[camUp.x, camUp.y, camUp.z]);
		
	//mat4.invert(modelViewMatrix._floatArrays, modelViewMatrix._floatArrays);
		
	var modelViewRelToEyeMatrix = new Matrix4();	
	modelViewRelToEyeMatrix.copyFromMatrix4(modelViewMatrix);
	modelViewRelToEyeMatrix._floatArrays[12] = 0.0;
	modelViewRelToEyeMatrix._floatArrays[13] = 0.0;
	modelViewRelToEyeMatrix._floatArrays[14] = 0.0;
	modelViewRelToEyeMatrix._floatArrays[15] = 1.0;
	
	var modelViewProjectionRelToEyeMat = new Matrix4();
	modelViewProjectionRelToEyeMat._floatArrays = mat4.multiply(modelViewProjectionRelToEyeMat._floatArrays, projectionMatrix._floatArrays, modelViewRelToEyeMatrix._floatArrays);
	
	if(magoManager.currentFrustumIdx === 0)
	{
		var hola = 0;
	}
	else if(magoManager.currentFrustumIdx === 1)
	{
		var hola = 0;
	}
	else if(magoManager.currentFrustumIdx === 2)
	{
		var hola = 0;
	}

	
	var mvpRelToEyeMat_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	gl.uniformMatrix4fv(mvpRelToEyeMat_loc, false, modelViewProjectionRelToEyeMat._floatArrays);
	
	// End modify the modelViewProjectionRelToEyeMatrix, to change the farClip of the frustums.--------------------------------------------------------------------
	*/
	
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 0.0]); //.***
	
	gl.uniform1i(shader.bApplySsao_loc, false); // apply ssao.***
	gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.***
	gl.uniform1i(shader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.***
	gl.uniform1i(shader.bApplySpecularLighting_loc, true); // turn on/off specular lighting.***
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.depthRange(0, 1);
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.***
		
	
	// STENCIL SETTINGS.**********************************************************************************
	gl.colorMask(false, false, false, false);
	gl.depthMask(false);
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	//gl.polygonOffset(1.0, 2.0); // Original.***
	//gl.polygonOffset(0.0, 0.0); 
	
	gl.clearStencil(0);
	var glPrimitive = undefined;
	
	
	//if(magoManager.currentFrustumIdx !== 5)
	{
		// First pass.****************************************************************************************************
		gl.cullFace(gl.FRONT); // 1rstPass.***
		gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
		//gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP); // stencilOp(fail, zfail, zpass)
		gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP); // stencilOp(fail, zfail, zpass)
		this.meshPositive.render(magoManager, shader, renderType, glPrimitive);
	}
	
	
	//if(magoManager.currentFrustumIdx === 5)
	{
		// Second pass.****************************************************************************************************
		gl.cullFace(gl.BACK); // 2ndPass.***
		gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
		//gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP); // stencilOp(fail, zfail, zpass)
		gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP); // stencilOp(fail, zfail, zpass)
		this.meshPositive.render(magoManager, shader, renderType, glPrimitive);// Original.***
	}
	

	// Render the hole.*********************************************************************************************
	//shader.bindUniformGenerals();
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	gl.uniform4fv(shader.oneColor4_loc, [222/255, 184/255, 135/255, 1.0]); //.***
	
	//gl.disable(gl.POLYGON_OFFSET_FILL);
	//gl.disable(gl.CULL_FACE);
	gl.colorMask(true, true, true, true);
	//gl.depthMask(false); // original.***
	gl.depthMask(true);
	gl.stencilMask(0x00);

	//gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);
	gl.stencilFunc(gl.LEQUAL, 1, 0xff);
	//gl.stencilFunc(gl.LESS, 0, 0xff);
	//gl.stencilFunc(gl.EQUAL, 1, 0xff);
	gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE); // stencilOp(fail, zfail, zpass)

	//gl.disable(gl.DEPTH_TEST);

	gl.cullFace(gl.BACK);

	gl.depthFunc(gl.ALWAYS);

	//gl.disable(gl.DEPTH_TEST);
	//gl.disable(gl.STENCIL_TEST);
	
	//if (magoManager.currentFrustumIdx === 0)
	//{
	//	
	//}
	
	this.meshNegative.render(magoManager, shader, renderType, glPrimitive);

	
	//gl.disable(gl.STENCIL_TEST);
	//gl.depthFunc(gl.LEQUAL);
	//this.meshPositive.render(magoManager, shader, renderType, glPrimitive);// Original.***


	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	//gl.disable(gl.BLEND);
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // stencilOp(fail, zfail, zpass)
	gl.disable(gl.POLYGON_OFFSET_FILL);
	gl.depthRange(0, 1);// return to the normal value.***
	gl.useProgram(null);
	
	gl.depthMask(true); //sets whether writing into the depth buffer is enabled or disabled. Default value: true, meaning that writing is enabled.***
	gl.stencilMask(0xff);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.getGeoLocationData = function() 
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	
	var geoLoc = this.geoLocDataManager.getCurrentGeoLocationData();
	if (geoLoc === undefined)
	{
		geoLoc = this.geoLocDataManager.newGeoLocationData("default");
	}
	
	return geoLoc;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.makeExtrudeObject = function(magoManager) 
{
	if (this.geoCoordsList === undefined)
	{ return false; }
	
	// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.***
	// Another possibility is calculate the average point of geoCoords.***
	var geoLoc = this.getGeoLocationData();

	// Take the 1rst geographicCoord's geoLocation.***
	var geoCoord = this.geoCoordsList.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);
	
	
	// Now, make the down & up profiles.***
	if (this.vtxProfilesList === undefined)
	{ this.vtxProfilesList = new VtxProfilesList(); }
	
	// Project the geoCoordList into a plane. Remember that the local coordinate is the 1rst geoCoord.***
	// Calculate down & up points of the extrude object.***
	var points3dArrayDown = [];
	var points3dArrayUp = [];
	
	if (this.excavationDepthInMeters === undefined)
	{ this.excavationDepthInMeters = 80.0; }
	
	var cartesianAux;
	var geoCoord;
	var geoCoordsCount = this.geoCoordsList.getGeoCoordsCount();
	for (var i=0; i<geoCoordsCount; i++)
	{
		// Current geoCoord.***
		geoCoord = this.geoCoordsList.getGeoCoord(i);
		
		// Down & Up absolute points.***
		var point3DDown = new Point3D();
		var point3DUp = new Point3D();
		cartesianAux = Globe.geographicToCartesianWgs84(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude - this.excavationDepthInMeters, cartesianAux);
		point3DDown.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
		
		cartesianAux = Globe.geographicToCartesianWgs84(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude + 100.0, cartesianAux);
		point3DUp.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
		
		// Down & Up relative points.***
		var point3DDownRel = new Point3D();
		var point3DUpRel = new Point3D();
		point3DDownRel = geoLoc.getTransformedRelativePosition(point3DDown, point3DDownRel);
		point3DUpRel = geoLoc.getTransformedRelativePosition(point3DUp, point3DUpRel);
		
		point3DDownRel.pointType = 1;
		point3DUpRel.pointType = 1;
		
		points3dArrayDown[i] = point3DDownRel;
		points3dArrayUp[i] = point3DUpRel;
	}
	
	// Now, make vertexProfiles (down_vtxProfile & up_vtxProfile).***
	var vertexProfileDown = this.vtxProfilesList.newVtxProfile();
	var vertexProfileUp = this.vtxProfilesList.newVtxProfile();
	
	vertexProfileDown.makeByPoints3DArray(points3dArrayDown, undefined);
	vertexProfileUp.makeByPoints3DArray(points3dArrayUp, undefined);
	
	// Now, make the mesh.***
	if (this.meshPositive === undefined)
	{
		//this.meshTest = 
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		this.mesh = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		
		// positive mesh.***
		this.meshPositive = this.mesh.getCopySurfaceIndependentMesh(this.meshPositive);
		this.meshPositive.calculateVerticesNormals();
	
		this.meshPositive.setColor(0.1, 0.5, 0.5, 1.0);

		this.meshPositive.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshPositive.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
		
		// negative mesh.***
		this.meshNegative = this.mesh.getCopySurfaceIndependentMesh(this.meshNegative);
		this.meshNegative.reverseSense(); // here calculates vertices normals.***
	
		this.meshNegative.setColor(0.1, 0.5, 0.5, 1.0);

		this.meshNegative.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshNegative.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.remakeExtrudeObject = function(magoManager) 
{
	if (this.vtxProfilesList === undefined)
	{ return false; }
	
	// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.***
	// Another possibility is calculate the average point of geoCoords.***
	var geoLoc = this.getGeoLocationData();

	// Take the 1rst geographicCoord's geoLocation.***
	var geoCoord = this.geoCoordsList.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);
	

	// Project the geoCoordList into a plane. Remember that the local coordinate is the 1rst geoCoord.***
	// Calculate down & up points of the extrude object.***
	var points3dArrayDown = [];
	var points3dArrayUp = [];
	
	if (this.excavationDepthInMeters === undefined)
	{ this.excavationDepthInMeters = 80.0; }
	
	var cartesianAux;
	var geoCoord;
	var geoCoordsCount = this.geoCoordsList.getGeoCoordsCount();
	for (var i=0; i<geoCoordsCount; i++)
	{
		// Current geoCoord.***
		geoCoord = this.geoCoordsList.getGeoCoord(i);
		
		// Down & Up absolute points.***
		var point3DDown = new Point3D();
		var point3DUp = new Point3D();
		cartesianAux = Globe.geographicToCartesianWgs84(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude - this.excavationDepthInMeters, cartesianAux);
		point3DDown.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
		
		cartesianAux = Globe.geographicToCartesianWgs84(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude + 100.0, cartesianAux);
		point3DUp.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
		
		// Down & Up relative points.***
		var point3DDownRel = new Point3D();
		var point3DUpRel = new Point3D();
		point3DDownRel = geoLoc.getTransformedRelativePosition(point3DDown, point3DDownRel);
		point3DUpRel = geoLoc.getTransformedRelativePosition(point3DUp, point3DUpRel);
		
		point3DDownRel.pointType = 1;
		point3DUpRel.pointType = 1;
		
		points3dArrayDown[i] = point3DDownRel;
		points3dArrayUp[i] = point3DUpRel;
	}
	
	// Now, update vertexProfiles (down_vtxProfile & up_vtxProfile).***
	var vertexProfileDown = this.vtxProfilesList.getVtxProfile(0);
	var vertexProfileUp = this.vtxProfilesList.getVtxProfile(1);
	
	vertexProfileDown.updateByPoints3DArray(points3dArrayDown, undefined);
	vertexProfileUp.updateByPoints3DArray(points3dArrayUp, undefined);
	
	var vboMemManager = magoManager.vboMemoryManager;
	//this.meshPositive.deleteVbos(vboMemManager);
	//this.meshNegative.deleteVbos(vboMemManager);
	
	if (this.meshPositive !== undefined)
	{ this.meshPositive.deleteObjects(vboMemManager); }
	
	if (this.meshNegative !== undefined)
	{ this.meshNegative.deleteObjects(vboMemManager); }
	
	this.meshPositive = undefined;
	this.meshNegative = undefined;
	
	// Now, make the mesh.***
	
	if (this.meshPositive === undefined)
	{
		//this.meshTest = 
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		this.mesh = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		
		// positive mesh.***
		this.meshPositive = this.mesh.getCopySurfaceIndependentMesh(this.meshPositive);
		this.meshPositive.calculateVerticesNormals();
		this.meshPositive.setColor(0.1, 0.5, 0.5, 1.0);
		this.meshPositive.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshPositive.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
		
		// negative mesh.***
		this.meshNegative = this.mesh.getCopySurfaceIndependentMesh(this.meshNegative);
		this.meshNegative.reverseSense(); // here calculates vertices normals.***
		this.meshNegative.setColor(0.1, 0.5, 0.5, 1.0);
		this.meshNegative.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshNegative.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
		
	}
	
};








































