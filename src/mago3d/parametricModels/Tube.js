'use strict';

/**
 * Tube.
 * @class Tube
 */
var Tube = function(interiorRadius, exteriorRadius, height, options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof Tube)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.intRadius = 10;
	this.extRadius = 20;
	this.height = 5;
	
	if (interiorRadius !== undefined)
	{ this.intRadius = interiorRadius; }
	
	if (exteriorRadius !== undefined)
	{ this.extRadius = exteriorRadius; }
	
	if (height !== undefined)
	{ this.height = height; }
	
	this.dirty = true;
	this.mesh;
	this.bbox;
	
	/**
	 * The geographic location of the factory.
	 * @type {GeoLocationDataManager}
	 * @default undefined
	 */
	this.geoLocDataManager;
	this.color4;
	
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
Tube.prototype = Object.create(MagoRenderable.prototype);
Tube.prototype.constructor = Tube;

/**
 * Returns the bbox.
 */
Tube.prototype.getBoundingBox = function()
{
	if (this.bbox === undefined)
	{
		this.bbox = new BoundingBox();
		var maxRadius = this.extRadius;
		if (maxRadius < this.intRadius)
		{ maxRadius = this.intRadius; }
		
		this.bbox.set(-maxRadius, -maxRadius, 0.0, maxRadius, maxRadius, this.height);
	}
	return this.bbox;
};

/**
 * Makes the geometry mesh.
 */
Tube.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	var circle;
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();
	circle = outerRing.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(this.extRadius);
	
	// Now create interior ring.***
	var innerRing = profileAux.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(0, 0);
	circle.setRadius(this.intRadius);
	
	var extrusionDist = this.height;
	var extrudeSegmentsCount = 1;
	var extrusionVector; // undefined.
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	
	this.mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	
	this.dirty = false;
};



/**
 * Renders the factory.
 */
Tube.prototype.render = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
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
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	
	this.renderAsChild(magoManager, shader, renderType, glPrimitive, bIsSelected);

	gl.disable(gl.BLEND);
};

/**
 * Renders the factory.
 */
Tube.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive, bIsSelected)
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
		gl.uniform1i(shader.bApplySsao_loc, true);
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
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
		}
		else 
		{
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
		}
	} 
	/*
	else if (renderType === 2)
	{
		// Selection render.***
		var selectionColor = magoManager.selectionColor;
		var colorAux = magoManager.selectionColor.getAvailableColor(undefined);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 0.7]);
		gl.disable(gl.BLEND);
	}
	*/
	if (this.tMat) 
	{
		gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.tMat._floatArrays);
	}
	this.mesh.render(magoManager, shader, renderType, glPrimitive, bIsSelected);

	gl.disable(gl.BLEND);
};













































