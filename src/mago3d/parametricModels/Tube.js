'use strict';

/**
 * Tube.
 * @class Tube
 */
var Tube = function(interiorRadius, exteriorRadius, height, options) 
{
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
Tube.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
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
	//this.mesh.render(magoManager, shader, renderType, glPrimitive);

	gl.disable(gl.BLEND);
};

/**
 * Renders the factory.
 */
Tube.prototype.renderRaw = function(magoManager, shader, renderType, glPrimitive)
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
		if (selectionManager.isObjectSelected(this))
		{
			gl.disable(gl.BLEND);
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
		}
		else 
		{
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
		}
		
	}

	this.mesh.render(magoManager, shader, renderType, glPrimitive);

	gl.disable(gl.BLEND);
};













































