
'use strict';


/**
 * This class draws an excavation on the grown.
 * @class Excavation
 */
var Excavation = function(options) 
{
	if (!(this instanceof Excavation)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The geographic points that conforms the excavation border.
	 * @type {GeographicCoordsList}
	 * @default undefined
	 */
	this.geoCoordsList; 
	
	this.geoLocDataManager;
	this.excavationDepthInMeters;
	
	this.vtxProfilesList;
	this.vboKeysContainer;
	this.vboKeysContainerEdges;
	
	this.dirty = true;
	
	if (options !== undefined)
	{
		if (options.geoCoordsArray !== undefined)
		{
			this.geoCoordsList = new GeographicCoordsList(options.geoCoordsArray);
			this.geoCoordsList.owner = this;
			
			// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.
			// Another possibility is calculate the average point of geoCoords.
			var geoLoc = this.getGeoLocationData();

			// Take the 1rst geographicCoord's geoLocation.
			var geoCoord = this.geoCoordsList.getGeoCoord(0);
			if (geoCoord)
			{
				var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
				var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
				geoLoc.copyFrom(geoLocFirst);
			}
		}

		if (options.excavationDepthInMeters !== undefined)
		{
			this.excavationDepthInMeters = options.excavationDepthInMeters;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.getGeographicCoordsList = function() 
{
	return this.geoCoordsList;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.renderPoints = function(magoManager, shader, renderType) 
{
	if (this.geoCoordsList === undefined)
	{ return false; }
	
	this.geoCoordsList.renderPoints(magoManager, shader, renderType, false);
	//this.geoCoordsList.renderLines(magoManager, shader, renderType, false, false);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Excavation.prototype.render = function(magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	if (this.dirty)
	{
		this.makeMesh(magoManager);
		return;
	}
	
	if (this.meshPositive === undefined)
	{ return; }

	
	var gl = magoManager.sceneState.gl;
	
	shader.useProgram();
	shader.resetLastBuffersBinded();

	shader.enableVertexAttribArray(shader.position3_loc);
	shader.bindUniformGenerals();

	if (renderType === 1)
	{
		shader.disableVertexAttribArray(shader.color4_loc);
		shader.enableVertexAttribArray(shader.normal3_loc); 
		shader.disableVertexAttribArray(shader.texCoord2_loc); // provisionally has no texCoords.
	
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.1, 0.0]); //.
		gl.uniform1i(shader.bApplySsao_loc, true); // apply ssao.
		gl.uniform1i(shader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform1i(shader.bApplySpecularLighting_loc, true); // turn on/off specular lighting.
	}
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
		
	
	// STENCIL SETTINGS.*
	gl.colorMask(false, false, false, false);
	gl.depthMask(false); // No altere depth buffer.
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	//gl.polygonOffset(1.0, 2.0); // Original.
	//gl.polygonOffset(0.0, 0.0); 
	
	gl.clearStencil(0);
	var glPrimitive = undefined;
	

	// First pass.*
	gl.cullFace(gl.FRONT); // 1rstPass.
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP); // stencilOp(fail, zfail, zpass)
	this.meshPositive.render(magoManager, shader, renderType, glPrimitive);
	

	// Second pass.*
	gl.cullFace(gl.BACK); // 2ndPass.
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP); // stencilOp(fail, zfail, zpass)
	this.meshPositive.render(magoManager, shader, renderType, glPrimitive);// Original.
	

	// Render the hole.
	if (renderType === 1)
	{
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, [222/255, 184/255, 135/255, 1.0]); //.
	}
	
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.stencilMask(0x00);

	//gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);
	gl.stencilFunc(gl.LEQUAL, 1, 0xff);
	gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE); // stencilOp(fail, zfail, zpass)

	gl.cullFace(gl.BACK);
	gl.depthFunc(gl.GREATER);
	
	this.meshNegative.render(magoManager, shader, renderType, glPrimitive);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // stencilOp(fail, zfail, zpass)
	gl.disable(gl.POLYGON_OFFSET_FILL);
	
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
Excavation.prototype.makeMesh = function(magoManager) 
{
	if (this.geoCoordsList === undefined)
	{ return false; }
	
	// 1rst, set position of this extrude object. Take as position the 1rst geoCoord absolute position.
	// Another possibility is calculate the average point of geoCoords.
	var geoLoc = this.getGeoLocationData();

	// Take the 1rst geographicCoord's geoLocation.
	var geoCoord = this.geoCoordsList.getGeoCoord(0);
	var geoLocDataManagerFirst = geoCoord.getGeoLocationDataManager();
	var geoLocFirst = geoLocDataManagerFirst.getCurrentGeoLocationData();
	geoLoc.copyFrom(geoLocFirst);
	
	
	// Now, make the down & up profiles.
	if (this.vtxProfilesList === undefined)
	{ this.vtxProfilesList = new VtxProfilesList(); }
	
	// Project the geoCoordList into a plane. Remember that the local coordinate is the 1rst geoCoord.
	// Calculate down & up points of the extrude object.
	var points3dArrayDown = [];
	var points3dArrayUp = [];
	
	if (this.excavationDepthInMeters === undefined)
	{ this.excavationDepthInMeters = 30.0; }
	
	var cartesianAux;
	var geoCoord;
	var geoCoordsCount = this.geoCoordsList.getGeoCoordsCount();
	for (var i=0; i<geoCoordsCount; i++)
	{
		// Current geoCoord.
		geoCoord = this.geoCoordsList.getGeoCoord(i);
		
		// Down & Up absolute points.
		var point3DDown = new Point3D();
		var point3DUp = new Point3D();
		cartesianAux = Globe.geographicToCartesianWgs84(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude - this.excavationDepthInMeters, cartesianAux);
		point3DDown.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
		
		cartesianAux = Globe.geographicToCartesianWgs84(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude + 70.0, cartesianAux);
		point3DUp.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
		
		// Down & Up relative points.
		var point3DDownRel = new Point3D();
		var point3DUpRel = new Point3D();
		point3DDownRel = geoLoc.getTransformedRelativePosition(point3DDown, point3DDownRel);
		point3DUpRel = geoLoc.getTransformedRelativePosition(point3DUp, point3DUpRel);
		
		point3DDownRel.pointType = 1;
		point3DUpRel.pointType = 1;
		
		points3dArrayDown[i] = point3DDownRel;
		points3dArrayUp[i] = point3DUpRel;
	}
	
	// Now, make vertexProfiles (down_vtxProfile & up_vtxProfile).
	var vertexProfileDown = this.vtxProfilesList.newVtxProfile();
	var vertexProfileUp = this.vtxProfilesList.newVtxProfile();
	
	vertexProfileDown.makeByPoints3DArray(points3dArrayDown, undefined);
	vertexProfileUp.makeByPoints3DArray(points3dArrayUp, undefined);
	
	// Now, make the mesh.
	if (this.meshPositive === undefined)
	{
		//this.meshTest = 
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		this.mesh = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		
		// positive mesh.
		this.meshPositive = this.mesh.getCopySurfaceIndependentMesh(this.meshPositive);
		this.meshPositive.calculateVerticesNormals();
	
		this.meshPositive.setColor(0.1, 0.5, 0.5, 1.0);

		this.meshPositive.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshPositive.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
		
		// negative mesh.
		this.meshNegative = this.mesh.getCopySurfaceIndependentMesh(this.meshNegative);
		this.meshNegative.reverseSense(); // here calculates vertices normals.
	
		this.meshNegative.setColor(0.1, 0.5, 0.5, 1.0);

		this.meshNegative.getVbo(this.vboKeysContainer, magoManager.vboMemoryManager);
		this.meshNegative.getVboEdges(this.vboKeysContainerEdges, magoManager.vboMemoryManager);
		
	}
	
	this.dirty = false;
};









































