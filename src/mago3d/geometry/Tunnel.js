
'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class Tunnel
 */
var Tunnel = function() 
{
	if (!(this instanceof Tunnel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// This is a loft object, so need a path & a profile.***
	
	this.geoCoordsListPath; // class : GeographicCoordsList.***
	this.geoCoordsListProfile; // class : GeographicCoordsList.***
	this.geoLocDataManager;
	
	this.vtxProfilesList;
	this.vboKeysContainer;
	this.vboKeysContainerEdges;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.getGeoLocationData = function() 
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
Tunnel.prototype.getPathGeographicCoordsList = function() 
{
	if (this.geoCoordsListPath === undefined)
	{
		this.geoCoordsListPath = new GeographicCoordsList();
		this.geoCoordsListPath.owner = this;
	}
	return this.geoCoordsListPath;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.getProfileGeographicCoordsList = function() 
{
	if (this.geoCoordsListProfile === undefined)
	{
		this.geoCoordsListProfile = new GeographicCoordsList();
		this.geoCoordsListProfile.owner = this;
	}

	return this.geoCoordsListProfile;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.renderPoints = function(magoManager, shader, renderType) 
{
	if (this.geoCoordsListPath === undefined)
	{ return false; }

	//this.renderMesh(magoManager, shader, renderType);
	this.renderTunnel(magoManager, shader, renderType);

	//if(this.meshPositive !== undefined)
	//{
	//	this.renderExcavation(magoManager, shader, renderType);
	//}
	
	this.geoCoordsListPath.renderPoints(magoManager, shader, renderType, false);
	this.geoCoordsListPath.renderLines(magoManager, shader, renderType, false, false);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.renderMesh = function(magoManager, shader, renderType) 
{
	if(this.meshPositive === undefined)
		return;
	
	var gl = magoManager.sceneState.gl;
	var buildingGeoLocation = this.getGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
	this.meshPositive.render(magoManager, shader, renderType);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.renderTunnel = function(magoManager, shader, renderType) 
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
Tunnel.prototype.makeMesh = function(magoManager) 
{
	if (this.geoCoordsListPath === undefined || this.geoCoordsListProfile === undefined)
	{ return false; }
	
	// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.***
	// Another possibility is calculate the average point of geoCoords.***
	var geoLoc = this.getGeoLocationData();

	// Take the 1rst geographicCoord's geoLocation of the path.***
	var geoCoord = this.geoCoordsListPath.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);

	// Now, make the profiles ( 1 vtxProfile for each point of the path).***
	if (this.vtxProfilesList === undefined)
	{ this.vtxProfilesList = new VtxProfilesList(); }
	
	// Transform pathGeoCoordsList to cartesianPath(points3DList).***
	var wgs84Point3DArray = this.geoCoordsListPath.getWgs84Points3D(undefined);
	var relativePoints3dArray = geoLoc.getTransformedRelativePositionsArray(wgs84Point3DArray, undefined);
	
	var pathPoints3dList = new Point3DList(relativePoints3dArray);
	var bLoop = false; // this is a stringTypePath, no loopTypePath.***
	
	// Provisionally make an circular profile in the 1rst point3d-plane.***
	var bisectionPlane = pathPoints3dList.getBisectionPlane(0, undefined, bLoop);
	// Note: "bisectionPlane" is in local coordinate "geoLoc".***
			
	var profile2d = new Profile2D();
	//profile2d.TEST__setFigureHole_2();
	//profile2d.TEST__setFigure_1();
	//profile2d.TEST__setFigure_2holes();
	
	var ring = profile2d.newOuterRing();
	var circle = ring.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(15);
	var resultPoints2dArray = [];
	var pointsCountFor360Deg = 24;
	ring.getPoints(resultPoints2dArray, pointsCountFor360Deg);

	// Now, calculate the rotMatrix of the bisectionPlane, & calculate points3ds of the circle points2d.***
	var rotMat4 = bisectionPlane.getRotationMatrix(undefined);
	var firstPoint3d = pathPoints3dList.getPoint(0);
	rotMat4.setTranslation(firstPoint3d.x, firstPoint3d.y, firstPoint3d.z);

	// Make the loft vtxProfilesList.***
	//bLoop = true;
	
	if(this.meshPositive === undefined)
	{
		this.vtxProfilesList.makeLoft(profile2d, pathPoints3dList, bLoop);
		
		// positive mesh.***
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		var meshAux = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap, bLoop);
		this.meshPositive = meshAux.getCopySurfaceIndependentMesh(this.meshPositive);
		var bForceRecalculatePlaneNormal = false;
		this.meshPositive.calculateVerticesNormals(bForceRecalculatePlaneNormal);
		this.meshPositive.setColor(0.1, 0.5, 0.5, 1.0);
		
		// negative mesh.***
		this.meshNegative = meshAux.getCopySurfaceIndependentMesh(this.meshNegative);
		this.meshNegative.reverseSense(); // here calculates vertices normals.***
		this.meshNegative.setColor(0.1, 0.5, 0.5, 1.0);
		this.meshNegative.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshNegative.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Tunnel.prototype.remakeMesh = function(magoManager) 
{
	if (this.vtxProfilesList === undefined)
	{ return false; }
	
	// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.***
	// Another possibility is calculate the average point of geoCoords.***
	var geoLoc = this.getGeoLocationData();

	// Take the 1rst geographicCoord's geoLocation of the path.***
	var geoCoord = this.geoCoordsListPath.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);

	// Now, make the profiles ( 1 vtxProfile for each point of the path).***
	
	// Transform pathGeoCoordsList to cartesianPath(points3DList).***
	var wgs84Point3DArray = this.geoCoordsListPath.getWgs84Points3D(undefined);
	var relativePoints3dArray = geoLoc.getTransformedRelativePositionsArray(wgs84Point3DArray, undefined);
	
	var pathPoints3dList = new Point3DList(relativePoints3dArray);
	var bLoop = false; // this is a stringTypePath, no loopTypePath.***
	
	// Provisionally make an circular profile in the 1rst point3d-plane.***
	var bisectionPlane = pathPoints3dList.getBisectionPlane(0, undefined, bLoop);
	// Note: "bisectionPlane" is in local coordinate "geoLoc".***
			
	var profile2d = new Profile2D();
	//profile2d.TEST__setFigureHole_2();
	//profile2d.TEST__setFigure_1();
	//profile2d.TEST__setFigure_2holes();
	
	var ring = profile2d.newOuterRing();
	var circle = ring.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(15);
	var resultPoints2dArray = [];
	var pointsCountFor360Deg = 24;
	ring.getPoints(resultPoints2dArray, pointsCountFor360Deg);

	// Now, calculate the rotMatrix of the bisectionPlane, & calculate points3ds of the circle points2d.***
	var rotMat4 = bisectionPlane.getRotationMatrix(undefined);
	var firstPoint3d = pathPoints3dList.getPoint(0);
	rotMat4.setTranslation(firstPoint3d.x, firstPoint3d.y, firstPoint3d.z);

	// Make the loft vtxProfilesList.***
	//bLoop = true;
	this.meshPositive = undefined;
	this.meshNegative = undefined;
	
	this.vtxProfilesList.deleteObjects();
	this.vtxProfilesList = new VtxProfilesList();
	
	if(this.meshPositive === undefined)
	{
		this.vtxProfilesList.makeLoft(profile2d, pathPoints3dList, bLoop);
		
		// positive mesh.***
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		var meshAux = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap, bLoop);
		this.meshPositive = meshAux.getCopySurfaceIndependentMesh(this.meshPositive);
		var bForceRecalculatePlaneNormal = false;
		this.meshPositive.calculateVerticesNormals(bForceRecalculatePlaneNormal);
		this.meshPositive.setColor(0.1, 0.5, 0.5, 1.0);
		
		// negative mesh.***
		this.meshNegative = meshAux.getCopySurfaceIndependentMesh(this.meshNegative);
		this.meshNegative.reverseSense(); // here calculates vertices normals.***
		this.meshNegative.setColor(0.1, 0.5, 0.5, 1.0);
		this.meshNegative.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshNegative.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
	}
};














































