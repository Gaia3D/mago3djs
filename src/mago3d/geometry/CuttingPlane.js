'use strict';

/**
 * CuttingPlane on 3D space. 
 * @class CuttingPlane
 */
var CuttingPlane = function() 
{
	if (!(this instanceof CuttingPlane)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.plane;
	this.geoLocDataManager;
	
	// geometric representation.***
	this.mesh; // use to draw a rectangle.***
};
/**
 * Calculate plane.
 * In the transformationMatrix there are the normal of the plane.
 */
CuttingPlane.prototype.getPlane = function()
{
	// Calculate plane.***
	if (this.plane === undefined)
	{ this.plane = new Plane(); }
	
	// In the transformationMatrix there are the normal of the plane.***
	var geoLoc = this.geoLocDataManager.getCurrentGeoLocationData();
	var tMatrix = geoLoc.tMatrix; 
	var pos = geoLoc.position;
	this.plane.setPointAndNormal(pos.x, pos.y, pos.z, tMatrix._floatArrays[8], tMatrix._floatArrays[9], tMatrix._floatArrays[10]);
	
	return this.plane;
};
/**
 * create mesh to draw cutting plane's rectangle
 * @param {Number} width the width of the cutting plane's rectangle
 * @param {Number} height the height of the cutting plane's rectangle
 */
CuttingPlane.prototype.makeRectangle = function(width, height)
{
	// Provisional function.***
	if (this.mesh === undefined)
	{ this.mesh = new Mesh(); }
	
	var vertexList = this.mesh.getVertexList();
	var semiWidth = width/2;
	var semiHeight = height/2;
	var alt = 100;
	
	// 1- left_down vertex.***
	var vertex1 = vertexList.newVertex();
	vertex1.setPosition(-semiWidth, -semiHeight, alt);
	
	// 2- right_down vertex.***
	var vertex2 = vertexList.newVertex();
	vertex2.setPosition(semiWidth, -semiHeight, alt);
	
	// 3- right_up vertex.***
	var vertex3 = vertexList.newVertex();
	vertex3.setPosition(semiWidth, semiHeight, alt);
	
	// 4- left_up vertex.***
	var vertex4 = vertexList.newVertex();
	vertex4.setPosition(-semiWidth, semiHeight, alt);
	
	// now, make triangles.***
	var surfaces = this.mesh.newSurface();
	var face = surfaces.newFace();
	
	face.addVerticesArray([vertex1, vertex2, vertex3, vertex4]);
	
	
};

/**
 * Render cutting plane
 * @param magoManager
 * @param shader
 * @param renderType
 */
CuttingPlane.prototype.render = function(magoManager, shader, renderType)
{
	var gl = magoManager.sceneState.gl;
	var glPrimitive;
	if (renderType === 2)
	{
		// colorCoding selection.***
		var selectionColor = magoManager.selectionColor;
		var selFamilyName = "general";
		var selManager = magoManager.selectionManager;
		var selCandidateNodes = selManager.getSelectionCandidatesFamily(selFamilyName);
		if (selCandidateNodes === undefined)
		{
			selCandidateNodes = selManager.newCandidatesFamily(selFamilyName);
		}
		
		var selColor4 = selectionColor.getAvailableColor(undefined); // new.
		var idxKey = selectionColor.decodeColor3(selColor4.r, selColor4.g, selColor4.b);
		selManager.setCandidateCustom(idxKey, selFamilyName, this);
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
		gl.uniform4fv(shader.oneColor4_loc, [selColor4.r/255.0, selColor4.g/255.0, selColor4.b/255.0, 1.0]);
	}
	else if (renderType === 1)
	{
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
		gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 0.0, 1.0]);
		var refMatrixType = 0; // identity matrix.***
		gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
		glPrimitive = gl.LINE_LOOP;
	}
	else if (renderType === 0)
	{
		var refMatrixType = 0; // identity matrix.***
		gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
	}
	
	this.mesh.render(magoManager, shader, renderType, glPrimitive);
};











































