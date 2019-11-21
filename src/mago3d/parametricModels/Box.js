'use strict';

/**
 * Box geometry.
 * @class Box
 */
var Box = function(width, length, height, name) 
{
	MagoRenderable.call(this);
	if (!(this instanceof Box)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// See MagoRenderable's members.
	// Initially, box centered at the center of the bottom.***
	this.mesh;
	this.centerPoint; // Usually (0,0,0).***
	this.width;
	this.length;
	this.height;
	this.owner;
	this.geoLocDataManager;
	
	if (name !== undefined)
	{ this.name = name; }
	
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }

};
Box.prototype = Object.create(MagoRenderable.prototype);
Box.prototype.contructor = Box;

/**
 * Renders the factory.
 */
Box.prototype.render = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.mesh === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	this.renderAsChild(magoManager, shader, renderType, glPrimitive, bIsSelected);
};

Box.prototype.getGeoLocDataManager = function()
{
	return this.geoLocDataManager;
};

/**
 * Renders the factory.
 */
Box.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
{
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.mesh === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
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
			if (this.color4) 
			{
				gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
			}
			
		}
		else if (selectionManager.isObjectSelected(this))
		{
			//gl.disable(gl.BLEND);
			gl.uniform4fv(shader.oneColor4_loc, [0.9, 0.1, 0.1, 1.0]);
		}
		else 
		{
			if (this.color4) 
			{
				gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
			}
		}
		
	}
	else if (renderType === 2)
	{
		// Selection render.***
		var selectionColor = magoManager.selectionColor;
		var colorAux = magoManager.selectionColor.getAvailableColor(undefined);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
		gl.disable(gl.BLEND);
	}

	if (this.tMat) 
	{
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.tMat._floatArrays);
	}
	
	this.mesh.render(magoManager, shader, renderType, glPrimitive, bIsSelected);

	gl.disable(gl.BLEND);
};

/**
 * Returns the mesh.
 */
Box.prototype.getMesh = function()
{
	if (this.mesh === undefined)
	{
		this.mesh = this.makeMesh(this.width, this.length, this.height);
	}
	
	return this.mesh;
};

/**
 * Makes the box mesh.
 * @param {Number} width
 * @param {Number} length
 * @param {Number} height 
 */
Box.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();

	var halfWidth = this.width * 0.5;
	var halLength = this.length * 0.5;
	var polyline = outerRing.newElement("POLYLINE");

	polyline.newPoint2d(-halfWidth, -halLength);
	polyline.newPoint2d(halfWidth, -halLength);
	polyline.newPoint2d(halfWidth, halLength);
	polyline.newPoint2d(-halfWidth, halLength);

	//var rect = outerRing.newElement("RECTANGLE");
	//rect.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	//rect.setDimensions(this.width, this.length);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this.height;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;

	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.mesh = mesh;
	this.dirty = false;
	return mesh;
};




































