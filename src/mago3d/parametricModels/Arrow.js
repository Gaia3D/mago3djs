'use strict';


var Arrow = function(width, length, height, option) 
{
	MagoRenderable.call(this);
	this.color4 = new Color();
	this.color4.setRGBA(0.2, 0.2, 0.25, 1);

	this.type = 'extruded';

	this.totalLength = 10;
	if (length) 
	{
		this.totalLength = length;
	}

	this.bodyWidth = 1;
	if (width) 
	{
		this.bodyWidth = width * 0.5;
	}
	this.headWidth = 1.5;
	if (width) 
	{
		this.headWidth = width;
	}

	this.extrude = 1;
	if (height) 
	{
		this.extrude = height;
	}
	
	this.tailLength = this.totalLength * 0.7;

	if (option) 
	{
		var bodyWidth = option.bodyWidth;
		if (bodyWidth) 
		{
			this.bodyWidth = bodyWidth;
		}
        
		var headWidth = option.headWidth;
		if (headWidth) 
		{
			this.headWidth = headWidth;
		}
        
		var headLength = option.headLength;
		if (headLength) 
		{
			this.headLength = headLength;
		}
        
		var totalLength = option.totalLength;
		if (totalLength) 
		{
			this.totalLength = totalLength;
		}
        
		var tailLength = option.tailLength;
		if (tailLength) 
		{
			this.tailLength = tailLength;
		}

		var extrude = option.extrude;
		if (extrude) 
		{
			this.extrude = extrude;
		}
	}

	if (this.headWidth < this.bodyWidth) 
	{
		this.headWidth = this.bodyWidth * 1.5;
	}

	if (!this.headLength) 
	{
		this.headLength = this.totalLength *0.3;
	}
};
Arrow.prototype = Object.create(MagoRenderable.prototype);
Arrow.prototype.constructor = Arrow;

Arrow.prototype.makeMesh = function() 
{
	var profile2dAux = new Profile2D();
	
	// Outer ring.**
	var outerRing = profile2dAux.newOuterRing();
 
	var halfBodyWidth = this.bodyWidth * 0.5;
	var halfHeadWidth = this.headWidth * 0.5;
	var bodyLengthWithoutHead = this.totalLength - this.headLength;

	var polyline = outerRing.newElement("POLYLINE");
	
	if (this.tailLength)
	{
		polyline.newPoint2d(0, 0);
		polyline.newPoint2d(halfBodyWidth, this.tailLength);
		polyline.newPoint2d(halfBodyWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(halfHeadWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(0, this.totalLength);
		polyline.newPoint2d(-halfHeadWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(-halfBodyWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(-halfBodyWidth, this.tailLength);
	}
	else 
	{
		polyline.newPoint2d(-halfBodyWidth, 0);    
		polyline.newPoint2d(halfBodyWidth, 0);    
		polyline.newPoint2d(halfBodyWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(halfHeadWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(0, this.totalLength);
		polyline.newPoint2d(-halfHeadWidth, bodyLengthWithoutHead);
		polyline.newPoint2d(-halfBodyWidth, bodyLengthWithoutHead);
	}

	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
    
	var mesh = Modeler.getExtrudedMesh(profile2dAux, this.extrude, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, mesh);
	this.mesh = mesh;
	this.dirty = false;
};

/**
 * Renders the factory.
 */
Arrow.prototype.render = function(magoManager, shader, renderType, glPrimitive)
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
	/*
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	*/
	
	this.renderRaw(magoManager, shader, renderType, glPrimitive);
	//this.mesh.render(magoManager, shader, renderType, glPrimitive);

	gl.disable(gl.BLEND);
};

Arrow.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive, bIsSelected) 
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
	if (this.tMat && this.tMat instanceof Matrix4) 
	{
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.tMat._floatArrays);
	}
	
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
 * Renders the factory.
 */
Arrow.prototype.renderRaw = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
{
	if (this.dirty)
	{ this.makeMesh(); }
	
	if (this.mesh === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
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