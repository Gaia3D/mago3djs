


'use strict';

/**
 * 영역 박스
 * @class TriPolyhedron
 */
var TriPolyhedron = function() {
	if(!(this instanceof TriPolyhedron)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.vertexList = new VertexList(); 
	this.triSurfacesArray = [];
};

TriPolyhedron.prototype.newTriSurface = function()
{
	var triSurface = new TriSurface();
	this.triSurfacesArray.push(triSurface);
	return triSurface;
};

TriPolyhedron.prototype.getVBOArrayModePosNorCol = function(resultVBOVertexIdxCacheKey)
{
	// there are "arrayMode" and the "elementMode". "elementMode" uses indices.***
	if(resultVBOVertexIdxCacheKey == undefined)
		resultVBOVertexIdxCacheKey = new VBOVertexIdxCacheKey();
	
	if(resultVBOVertexIdxCacheKey.pos_vboDataArray == undefined)
		resultVBOVertexIdxCacheKey.pos_vboDataArray = [];
	
	if(resultVBOVertexIdxCacheKey.nor_vboDataArray == undefined)
		resultVBOVertexIdxCacheKey.nor_vboDataArray = [];
	
	if(resultVBOVertexIdxCacheKey.col_vboDataArray == undefined)
		resultVBOVertexIdxCacheKey.col_vboDataArray = [];
	
	var positionArray = [];
	var normalsArray = [];
	var colorsArray = [];
	
	
	resultVBOVertexIdxCacheKey.vertexCount = 0;
	
	var vertex0, vertex1, vertex2;
	var triangle;
	var trianglesCount;
	var triSurface;
	var triSurfacesCount = this.triSurfacesArray.length;
	for(var i=0; i<triSurfacesCount; i++)
	{
		triSurface = this.triSurfacesArray[i];
		trianglesCount = triSurface.trianglesArray.length;
		for(var j=0; j<trianglesCount; j++)
		{
			triangle = triSurface.trianglesArray[j];
			if(triangle.normal == undefined)
				triangle.calculatePlaneNormal();
			
			// position.***
			vertex0 = triangle.vertex0;
			vertex1 = triangle.vertex1;
			vertex2 = triangle.vertex2;
			
			positionArray.push(vertex0.point3d.x);
			positionArray.push(vertex0.point3d.y);
			positionArray.push(vertex0.point3d.z);
			
			positionArray.push(vertex1.point3d.x);
			positionArray.push(vertex1.point3d.y);
			positionArray.push(vertex1.point3d.z);
			
			positionArray.push(vertex2.point3d.x);
			positionArray.push(vertex2.point3d.y);
			positionArray.push(vertex2.point3d.z);
			
			// normal (use planeNormal).***
			normalsArray.push(triangle.normal.x);
			normalsArray.push(triangle.normal.y);
			normalsArray.push(triangle.normal.z);
			
			normalsArray.push(triangle.normal.x);
			normalsArray.push(triangle.normal.y);
			normalsArray.push(triangle.normal.z);
			
			normalsArray.push(triangle.normal.x);
			normalsArray.push(triangle.normal.y);
			normalsArray.push(triangle.normal.z);
			
			// colors.***
			if(vertex0.color4 == undefined)
			{
				colorsArray.push(255);
				colorsArray.push(255);
				colorsArray.push(255);
				colorsArray.push(255);
				
				colorsArray.push(255);
				colorsArray.push(255);
				colorsArray.push(255);
				colorsArray.push(255);
				
				colorsArray.push(255);
				colorsArray.push(255);
				colorsArray.push(255);
				colorsArray.push(255);
			}
			else
			{
				colorsArray.push(vertex0.color4.r);
				colorsArray.push(vertex0.color4.g);
				colorsArray.push(vertex0.color4.b);
				colorsArray.push(vertex0.color4.a);
				
				colorsArray.push(vertex1.color4.r);
				colorsArray.push(vertex1.color4.g);
				colorsArray.push(vertex1.color4.b);
				colorsArray.push(vertex1.color4.a);
				
				colorsArray.push(vertex2.color4.r);
				colorsArray.push(vertex2.color4.g);
				colorsArray.push(vertex2.color4.b);
				colorsArray.push(vertex2.color4.a);
			}
			
			resultVBOVertexIdxCacheKey.vertexCount += 3;
		}
	}
	
	var vertexCount = resultVBOVertexIdxCacheKey.vertexCount;
	resultVBOVertexIdxCacheKey.nor_vboDataArray = new Int8Array(vertexCount*3);
	resultVBOVertexIdxCacheKey.col_vboDataArray = new Uint8Array(vertexCount*4);
	resultVBOVertexIdxCacheKey.pos_vboDataArray = new Float32Array(vertexCount*3); 
	for(var i=0; i<vertexCount*3; i++)
	{
		resultVBOVertexIdxCacheKey.pos_vboDataArray[i] = positionArray[i];
		resultVBOVertexIdxCacheKey.nor_vboDataArray[i] = normalsArray[i];
	}
	for(var i=0; i<vertexCount*4; i++)
	{
		resultVBOVertexIdxCacheKey.col_vboDataArray[i] = colorsArray[i];
	}
	
	//resultVBOVertexIdxCacheKey.nor_vboDataArray = Int8Array.from(normalsArray);
	//resultVBOVertexIdxCacheKey.col_vboDataArray = Uint8Array.from(colorsArray);
	positionArray = undefined;
	normalsArray = undefined;
	colorsArray = undefined;
	
	return resultVBOVertexIdxCacheKey;
};
































