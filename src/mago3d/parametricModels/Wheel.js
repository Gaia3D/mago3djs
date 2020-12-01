'use strict';

/**
 * @property {number} interiorRadius
 * @property {number} exteriorRadius
 * @property {number} width
 * @property {object} options
 */

/**
 * @param {*} option 
 * @class Wheel
 */
var Wheel = function(interiorRadius, exteriorRadius, width, options)
{
	MagoRenderable.call(this);
	if (!(this instanceof Wheel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	this.intRadius = 10;
	this.extRadius = 20;
	this.width = 5;
	this.color4 = new Color();
	this.color4.setRGBA(0.2, 0.2, 0.25, 1);
    
	if (interiorRadius !== undefined)
	{ this.intRadius = interiorRadius; }
	
	if (exteriorRadius !== undefined)
	{ this.extRadius = exteriorRadius; }
	
	if (width !== undefined)
	{ this.width = width; }
    
	this.borderRadius = (this.extRadius - this.intRadius ) * 0.2;
    
	if (options !== undefined)
	{
		var color = options.color;
		if (color)
		{
			this.color4.setRGBA(color.r, color.g, color.b, color.a);
		}
		var borderRadius = options.borderRadius;
		if (borderRadius) 
		{
			this.borderRadius = borderRadius;
		}
	}
    
	this.width < this.borderRadius, this.borderRadius = this.width * 0.2;
};
Wheel.prototype = Object.create(MagoRenderable.prototype);
Wheel.prototype.constructor = Wheel;
/**
 * Makes the geometry mesh.
 */
Wheel.prototype.makeMesh = function()
{
	var profile2dAux = new Profile2D();
	
	// Outer ring.**
	var outerRing = profile2dAux.newOuterRing();

	var halfWidth = this.width * 0.5;
	var exteriorRadiusWithoutBorder = this.extRadius - this.borderRadius;

	var polyline = outerRing.newElement("POLYLINE");
	polyline.newPoint2d(-halfWidth, this.intRadius);            
	polyline.newPoint2d(halfWidth, this.intRadius);             
	polyline.newPoint2d(halfWidth, exteriorRadiusWithoutBorder);

	var rightArc = outerRing.newElement("ARC");
	rightArc.setCenterPosition(halfWidth - this.borderRadius, exteriorRadiusWithoutBorder);
	rightArc.setRadius(this.borderRadius);
	rightArc.setStartAngleDegree(0);
	rightArc.setSweepAngleDegree(90);
    
	var polylineUpper = outerRing.newElement("POLYLINE");
	polylineUpper.newPoint2d(halfWidth - this.borderRadius, this.extRadius);
	polylineUpper.newPoint2d(-halfWidth + this.borderRadius, this.extRadius);

	var leftArc = outerRing.newElement("ARC");
	leftArc.setCenterPosition(-halfWidth + this.borderRadius, exteriorRadiusWithoutBorder);
	leftArc.setRadius(this.borderRadius);
	leftArc.setStartAngleDegree(90);
	leftArc.setSweepAngleDegree(90);

	var polylineLeft = outerRing.newElement("POLYLINE");
	polylineLeft.newPoint2d(-halfWidth, exteriorRadiusWithoutBorder);
	
	var revolveAngDeg = 360;
	var revolveSegmentsCount = 18;
	var revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(-1, 0);
	var endPoint2d = new Point2D(1, 0);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	var bIncludeBottomCap = false;
	var bIncludeTopCap = false;
	var mesh = Modeler.getRevolvedSolidMesh(profile2dAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d, bIncludeBottomCap, bIncludeTopCap, undefined);
	this.mesh = mesh.getCopySurfaceIndependentMesh(mesh);
	this.dirty = false;
};

/**
 * Renders the factory.
 */
Wheel.prototype.render = function(magoManager, shader, renderType, glPrimitive)
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
	if (!this.geoLocDataManager) { return; }

	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
	
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
	
	this.mesh.render(magoManager, shader, renderType, glPrimitive);

	gl.disable(gl.BLEND);
};


/**
 * Renders the factory.
 */
Wheel.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive)
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
	var bIsSelected = false;
	if (renderType === 1)
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
	
	this.mesh.render(magoManager, shader, renderType, glPrimitive);

	gl.disable(gl.BLEND);
};