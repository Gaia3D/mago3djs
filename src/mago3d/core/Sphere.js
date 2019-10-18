'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Sphere
 */
var Sphere = function(options) 
{
	if (!(this instanceof Sphere)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.r = 0.0;
	this.centerPoint = new Point3D();
	
	this.geoLocDataManager;
	this.color4;
	
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeyContainer.
	this.dirty = true;
	
	if (options !== undefined)
	{
		var color = options.color;
		if (color)
		{
			this.color4 = new Color();
			this.color4.setRGBA(color.r, color.g, color.b, color.a);
		}
	}
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.setCenterPoint = function(x, y, z) 
{
	this.centerPoint.set(x, y, z);
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.setRadius = function(radius) 
{
	this.r = radius;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.deleteObjects = function() 
{
	this.r = undefined;
	this.centerPoint.deleteObjects();
	this.centerPoint = undefined;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.distToPoint3D = function(point3d) 
{
	return this.centerPoint.distToPoint(point3d) - this.r;
};

/**
 */
Sphere.prototype.getVbo = function(resultVboContainer, bTexCoords)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	var pMesh;

	// make vbo.
	pMesh = this.makePMesh(pMesh);
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	
	var surfIndepMesh = pMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	
	// now rotate in X axis.
	var rotMatAux = new Matrix4();
	rotMatAux.rotationAxisAngDeg(90.0, 1.0, 0.0, 0.0);
	surfIndepMesh.transformByMatrix4(rotMatAux);
	
	surfIndepMesh.setColor(0.0, 0.5, 0.9, 0.3);
	surfIndepMesh.calculateVerticesNormals();
	if (bTexCoords !== undefined && bTexCoords === true)
	{
		// calculate spherical texCoords.
		surfIndepMesh.calculateTexCoordsSpherical();
	}
	surfIndepMesh.getVbo(resultVboContainer);

	return resultVboContainer;
};

/**
 * Renders the Sphere.
 */
Sphere.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.mesh === undefined)
	{ return false; }

	var gl = magoManager.getGl();
	/*
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	*/
	if (renderType === 2)
	{
		// Selection render.***
		var selectionColor = magoManager.selectionColor;
		var colorAux = magoManager.selectionColor.getAvailableColor(undefined);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
		gl.disable(gl.BLEND);
	}
	
	this.renderRaw(magoManager, shader, renderType, glPrimitive);

};

/**
 * Renders the factory.
 */
Sphere.prototype.renderRaw = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
{
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.mesh === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	this.renderLocal(magoManager, shader, renderType, glPrimitive, bIsSelected);
	/*
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.enable(gl.BLEND);
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
		
		// Check if is selected.***
		var selectionManager = magoManager.selectionManager;
		if (bIsSelected !== undefined && bIsSelected)
		{
			//gl.disable(gl.BLEND);
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
		}
		else if (selectionManager.isObjectSelected(this))
		{
			//gl.disable(gl.BLEND);
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
		}
		else 
		{
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
		}
		
	}
	*/
	this.mesh.render(magoManager, shader, renderType, glPrimitive, bIsSelected);

	gl.disable(gl.BLEND);
};

/**
 * Renders the factory.
 */
Sphere.prototype.renderLocal = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
{
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.mesh === undefined)
	{ return false; }
	var gl = magoManager.getGl();
	
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.enable(gl.BLEND);
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
		
		// Check if is selected.***
		var selectionManager = magoManager.selectionManager;
		if (bIsSelected !== undefined && bIsSelected)
		{
			//gl.disable(gl.BLEND);
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
		}
		else if (selectionManager.isObjectSelected(this))
		{
			//gl.disable(gl.BLEND);
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
		}
		else 
		{
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
		}
		
	}

	this.mesh.render(magoManager, shader, renderType, glPrimitive, bIsSelected);

	gl.disable(gl.BLEND);
};

/**
 * Makes the geometry mesh.
 */
Sphere.prototype.makeMesh = function()
{
	var profile2dAux = new Profile2D();
	
	// Outer ring.**
	var outerRing = profile2dAux.newOuterRing();
	
	var startAngDeg = 91.00;
	var endAngDeg = 270.00;
	var arc = outerRing.newElement("ARC");
	this.sweepSense = 1;
	arc.setCenterPosition(0.0, 0.0);
	arc.setRadius(this.r);
	arc.setStartAngleDegree(startAngDeg);
	arc.setSweepAngleDegree(endAngDeg - startAngDeg);
	arc.numPointsFor360Deg = 8;
	
	var revolveAngDeg = 360;
	var revolveSegmentsCount = 8;
	var revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(0, -1);
	var endPoint2d = new Point2D(0, 1);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	this.mesh = Modeler.getRevolvedSolidMesh(profile2dAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d, bIncludeBottomCap, bIncludeTopCap, undefined);
	
	this.dirty = false;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.makePMesh = function(resultPMesh) 
{
	// Old. delete.
	if (resultPMesh === undefined)
	{ resultPMesh = new ParametricMesh(); }

	resultPMesh.profile = new Profile(); 
	var profileAux = resultPMesh.profile; 
	
	// Outer ring.**
	var outerRing = profileAux.newOuterRing();
	var polyLine, point3d, arc;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-this.r*0.01, -this.r); // 0
	point3d = polyLine.newPoint2d(-this.r*0.01, this.r); // 1
	
	var startAngDeg = 95.00;
	var endAngDeg = 265.00;
	arc = outerRing.newElement("ARC");
	this.sweepSense = 1;
	arc.setCenterPosition(0.0, 0.0);
	arc.setRadius(this.r);
	arc.setStartAngleDegree(startAngDeg);
	arc.setSweepAngleDegree(endAngDeg - startAngDeg);
	arc.numPointsFor360Deg = 48;
	
	// now revolve.
	var revolveAngDeg, revolveSegmentsCount, revolveSegment2d;
	revolveAngDeg = 360;
	revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(0, -1);
	var endPoint2d = new Point2D(0, 1);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	revolveSegmentsCount = 48;
	resultPMesh.revolve(profileAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d);
	/*
	var extrusionVector
	var extrudeSegmentsCount = 2;
	var extrusionDist = 15.0;
		resultPMesh.extrude(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector);
	*/
	
	return resultPMesh;
};

Sphere.prototype.intersectionSphere = function(sphere) 
{
	if (sphere === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	var dist = this.centerPoint.distToPoint(sphere.centerPoint);
	if (dist < this.r)
	{
		return Constant.INTERSECTION_INSIDE;
	}
	else if (dist < sphere.r)
	{
		return Constant.INTERSECTION_INSIDE;
	}
	else if (dist < (this.r + sphere.r))
	{
		return Constant.INTERSECTION_INTERSECT;
	}
	
	return Constant.INTERSECTION_OUTSIDE;
};










































