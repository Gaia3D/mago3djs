'use strict';

/**
 * 선
 * @class AxisXYZ
 */
var AxisXYZ = function(length) 
{
	if (!(this instanceof AxisXYZ)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	if(length === undefined)
		this.length = 60;
	else this.length = length;
	
	this.vbo_vicks_container = new VBOVertexIdxCacheKeysContainer();
	//this.vboKey = this.vbo_vicks_container.newVBOVertexIdxCacheKey();
};

AxisXYZ.prototype.setDimension = function(length)
{
	this.length = length;
};

AxisXYZ.prototype.makeMesh = function(length)
{
	if(length !== undefined)
		this.length = length;
	
	var pMesh = new ParametricMesh();
		
	pMesh.profile = new Profile(); 
	var profileAux = pMesh.profile; 
	
	// create a halfArrow profile.***
	var outerRing = profileAux.newOuterRing();
	var arrowLength = this.length;
	var arrowWidth  = this.length*0.1;
	var polyLine = outerRing.newElement("POLYLINE");
	var point3d = polyLine.newPoint2d(0,0); // 0
	point3d = polyLine.newPoint2d(arrowWidth*0.25, arrowLength*0.25); // 1
	point3d = polyLine.newPoint2d(arrowWidth*0.25, arrowLength*0.75); // 2
	point3d = polyLine.newPoint2d(arrowWidth*0.5, arrowLength*0.75); // 3
	point3d = polyLine.newPoint2d(0, arrowLength); // 3
	//--------------------------------------------------------------------
	
	var bIncludeBottomCap, bIncludeTopCap;
	var revolveAngDeg, revolveSegmentsCount, revolveSegment2d;
	revolveAngDeg = 360.0;
	
	// create a rotation axis by a segment.***
	revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(0, -10);
	var endPoint2d = new Point2D(0, 10);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	revolveSegmentsCount = 8;
	
	// rotate the profile and create the Y axis.***
	pMesh.revolve(profileAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d);
	
	bIncludeBottomCap = false;
	bIncludeTopCap = false;
	var mesh = pMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	mesh.setColor(0.1, 1.0, 0.1, 1.0); // set the color.***
	mesh.reverseSense();
	
	// copy & rotate the mesh and create the X axis.***
	var tMatTest = new Matrix4();
	var mesh2 = mesh.getCopy(undefined);
	tMatTest.rotationAxisAngDeg(-90.0, 0,0,1);
	mesh2.transformByMatrix4(tMatTest);
	mesh2.setColor(1.0, 0.1, 0.1, 1.0); // set the color.***
	
	// copy & rotate the mesh and create the Z axis.***
	var mesh3 = mesh.getCopy(undefined);
	tMatTest.rotationAxisAngDeg(90.0, 1,0,0);
	mesh3.transformByMatrix4(tMatTest);
	mesh3.setColor(0.1, 0.1, 1.0, 1.0); // set the color.***

	// Merge all meshes into a one mesh and make a unique vbo.***
	mesh.mergeMesh(mesh2);
	mesh.mergeMesh(mesh3);
	mesh.getVbo(this.vbo_vicks_container);
};

AxisXYZ.prototype.getVboKeysContainer = function()
{
	return this.vbo_vicks_container;
};

AxisXYZ.prototype.getVbo = function(resultVboKey)
{
	if(resultVboKey === undefined)
		resultVboKey = new VBOVertexIdxCacheKey();
	
	if (resultVboKey.posVboDataArray === undefined)
	{ resultVboKey.posVboDataArray = []; }

	if (resultVboKey.colVboDataArray === undefined)
	{ resultVboKey.colVboDataArray = []; }

	if (resultVboKey.norVboDataArray === undefined)
	{ resultVboKey.norVboDataArray = []; }

	var positions = [];
	var normals = [];
	var colors = [];
	
	// xAxis.***
	positions.push(0,0,0, this.length,0,0);
	colors.push(255,0,0,255, 255,0,0,255);
	normals.push(0,0,255, 0,0,255);
	
	// yAxis.***
	positions.push(0,0,0, 0,this.length,0);
	colors.push(0,255,0,255, 0,255,0,255);
	normals.push(0,0,255, 0,0,255);
	
	// zAxis.***
	positions.push(0,0,0, 0,0,this.length);
	colors.push(0,0,255,255, 0,0,255,255);
	normals.push(255,0,0, 255,0,0);

	resultVboKey.posVboDataArray = Float32Array.from(positions);
	resultVboKey.colVboDataArray = Int8Array.from(colors);
	resultVboKey.norVboDataArray = Int8Array.from(normals);
	
	resultVboKey.vertexCount = 6;
	
	return resultVboKey;
};