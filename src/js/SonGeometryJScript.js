// Color.************************************************************************************* //
  var f4d_color = function()
  {
	  this.r = 0;
	  this.g = 0;
	  this.b = 0;
	  this.a = 0;
	  
  };
  
  f4d_color.prototype.set = function(_r, _g, _b, _a)
  {
  	this.r = _r; this.g = _g; this.b = _b; this.a = _a;
  };
  
  f4d_color.prototype.setRGB = function(_r, _g, _b)
  {
  	this.r = _r; this.g = _g; this.b = _b; 
  };
  
  f4d_color.prototype.setRGBA = function(_r, _g, _b, _alpha)
  {
  	this.r = _r; this.g = _g; this.b = _b;  this.a = _alpha;
  };
  
  // ByteColor .******************************************************************************* //
  var f4d_ByteColor = function()
  {
	  this._byte_r = 0;
	  this._byte_g = 0;
	  this._byte_b = 0;
	  this._byte_alfa = 255;
  };
  
  f4d_ByteColor.prototype.destroy = function()
  {
	  this._byte_r = null;
	  this._byte_g = null;
	  this._byte_b = null;
	  this._byte_alfa = null;
  };
  
  f4d_ByteColor.prototype.set = function(byteRed, byteGreen, byteBlue)
  {
	  this._byte_r = byteRed;
	  this._byte_g = byteGreen;
	  this._byte_b = byteBlue;
  };
  
  // f4d_Point3dAux.*************************************************************************** //
  var f4d_point3dAux = function()
  {
	  this.x = 0.0;
	  this.y = 0.0;
	  this.z = 0.0;
  	
	  //this._idx_in_list = undefined;
  };
  
// Point3D.********************************************************************************** //
var f4d_point2d = function()
{
  this.x = 0.0;
  this.y = 0.0;

  this._idx_in_list = undefined;
};
  


// ******************************************************************************************* //
// TTriangles.******************************************************************************* //
var f4d_tTriangle = function() // topological triangle.***
{
	this.m_vertex_1 = undefined;
  	this.m_vertex_2 = undefined;
  	this.m_vertex_3 = undefined;
	
};

f4d_tTriangle.prototype.set_vertices = function(vtx_1, vtx_2, vtx_3)
{
	this.m_vertex_1 = vtx_1;
  	this.m_vertex_2 = vtx_2;
  	this.m_vertex_3 = vtx_3;
};

f4d_tTriangle.prototype.invert = function()
{
	var vertexAux = this.m_vertex_2;
  	this.m_vertex_2 = this.m_vertex_3;
  	this.m_vertex_3 = vertexAux;
};

// ******************************************************************************************* //
// TTrianglesList.**************************************************************************** //
var f4d_tTrianglesList = function() // topological triangles.***
{
	this.tTrianglesArray = [];
	
};

f4d_tTrianglesList.prototype.new_tTriangle = function()
{
	var tTri = new f4d_tTriangle();
	this.tTrianglesArray.push(tTri);
	return tTri;
};

f4d_tTrianglesList.prototype.invert_trianglesSense= function()
{
	var tri_count = this.tTrianglesArray.length;
	for(var i=0; i<tri_count; i++)
	{
		this.tTrianglesArray[i].invert();
	}
};

f4d_tTrianglesList.prototype.get_tTriangle = function(idx)
{
	if(idx >=0 && idx < this.tTrianglesArray.length)
	{
		return this.tTrianglesArray[idx];
	}
	else{
		return undefined;
	}
};

// ******************************************************************************************* //
// TTrianglesMatrix.************************************************************************** //
var f4d_tTrianglesMatrix = function() // topological triangles.***
{
	this.tTrianglesListsArray = [];
	
	// SCRATX.*********************
	this.totalTTrianglesArraySC = [];
	
};

f4d_tTrianglesMatrix.prototype.new_tTrianglesList = function()
{
	var tTrianglesList = new f4d_tTrianglesList();
	this.tTrianglesListsArray.push(tTrianglesList);
	return tTrianglesList;
};

f4d_tTrianglesMatrix.prototype.invert_trianglesSense = function()
{
	var tTriLists_count = this.tTrianglesListsArray.length;
	for(var i=0; i<tTriLists_count; i++)
	{
		this.tTrianglesListsArray[i].invert_trianglesSense();
	}
};

f4d_tTrianglesMatrix.prototype.get_totalTTrianglesArray = function(resultTotalTTrianglesArray)
{
	var tTriangles_count = undefined;
	var tTriangle = undefined;
	var tTriLists_count = this.tTrianglesListsArray.length;
	for(var i=0; i<tTriLists_count; i++)
	{
		tTriangles_count = this.tTrianglesListsArray[i].tTrianglesArray.length;
		for(var j=0; j<tTriangles_count; j++)
		{
			tTriangle = this.tTrianglesListsArray[i].get_tTriangle(j);
			resultTotalTTrianglesArray.push(tTriangle);
		}
	}
	
	return resultTotalTTrianglesArray;
};

f4d_tTrianglesMatrix.prototype.get_vbo_indices_ShortArray = function()
{
	this.totalTTrianglesArraySC.length = 0;
	this.totalTTrianglesArraySC = this.get_totalTTrianglesArray(this.totalTTrianglesArraySC);
	
	var tTriangle = undefined;
	var tTriangles_count = this.totalTTrianglesArraySC.length;
	var shortArray = new Uint16Array(tTriangles_count*3);
	for(var i=0; i<tTriangles_count; i++)
	{
		tTriangle = this.totalTTrianglesArraySC[i];
		shortArray[i*3] = tTriangle.m_vertex_1.m_idx_inList;
		shortArray[i*3+1] = tTriangle.m_vertex_2.m_idx_inList;
		shortArray[i*3+2] = tTriangle.m_vertex_3.m_idx_inList;
	}
	
	return shortArray;
};
  
//***********************************************************************************************//
// F4D Vertex.***********************************************************************************//
var f4d_vertex = function()
{
	this.point3d = new f4d_point3d();
	this.normal = undefined;
	this.texCoord = undefined;
	this.color4 = undefined;
	this.m_idx_inList = -1;
};

f4d_vertex.prototype.set_position = function(x, y, z)
{
	this.point3d.set(x, y, z);
};

f4d_vertex.prototype.set_colorRGB = function(r, g, b)
{
	if(this.color4 == undefined)
		this.color4 = new f4d_color();
	
	this.color4.setRGB(r, g, b);
};

f4d_vertex.prototype.set_colorRGBA = function(r, g, b, alpha)
{
	if(this.color4 == undefined)
		this.color4 = new f4d_color();
	
	this.color4.setRGBA(r, g, b, alpha);
};

f4d_vertex.prototype.translate = function(dir_x, dir_y, dir_z, distance)
{
	this.point3d.add(dir_x*distance, dir_y*distance, dir_z*distance);
};

//***********************************************************************************************//
// F4D VertexList.*******************************************************************************//
var f4d_vertexList = function()
{
	this.vertexArray = [];
};

f4d_vertexList.prototype.new_vertex = function()
{
	var vertex = new f4d_vertex();
	this.vertexArray.push(vertex);
	return vertex;
};

f4d_vertexList.prototype.get_vertex = function(idx)
{
	return this.vertexArray[idx];
};

f4d_vertexList.prototype.get_vertexCount = function()
{
	return this.vertexArray.length;
};

f4d_vertexList.prototype.create_nVertex = function(vertexCount)
{
	for(var i=0; i<vertexCount; i++)
	{
		this.new_vertex();
	}
};

f4d_vertexList.prototype.translate_vertices = function(dir_x, dir_y, dir_z, distance)
{
	var vertex_count = this.vertexArray.length;
	for(var i=0; i<vertex_count; i++)
	{
		vertex = this.vertexArray[i].translate(dir_x, dir_y, dir_z, distance);
	}
};

f4d_vertexList.prototype.get_boundingBox = function(resultBox)
{
	if(resultBox == undefined)
		resultBox = new f4d_boundingBox();
	
	var vertex_count = this.vertexArray.length;
	for(var i=0; i<vertex_count; i++)
	{
		if(i==0)
		resultBox.setInit (this.vertexArray[i].point3d);
		else
			resultBox.addPoint3D(this.vertexArray[i].point3d);
	}
	return resultBox;
};

f4d_vertexList.prototype.transformPoints_byMatrix4 = function(transformMatrix)
{
	var vertex = undefined;
	
	var vertex_count = this.vertexArray.length;
	for(var i=0; i<vertex_count; i++)
	{
		vertex = this.vertexArray[i];
		transformMatrix.transformPoint3D(vertex.point3d, vertex.point3d);
	}
};

//***********************************************************************************************//
// F4D VertexMatrix.*******************************************************************************//
var f4d_vertexMatrix = function()
{
	this.vertexListsArray = [];
	
	// SCTRATXH.******************
	this.totalVertexArraySC = [];
};

f4d_vertexMatrix.prototype.new_vertexList = function()
{
	var vertexList = new f4d_vertexList();
	this.vertexListsArray.push(vertexList);
	return vertexList;
};

f4d_vertexMatrix.prototype.get_vertexList = function(idx)
{
	if(idx >= 0 && idx < this.vertexListsArray.length)
	{
		return this.vertexListsArray[idx];
	}
	else{
		return undefined;
	}
};

f4d_vertexMatrix.prototype.get_boundingBox = function(resultBox)
{
	if(resultBox == undefined)
		resultBox = new f4d_boundingBox();
	
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.get_totalVertexArray(this.totalVertexArraySC);
	var total_vertex_count = this.totalVertexArraySC.length;
	
	for(var i=0; i<total_vertex_count; i++)
	{
		if(i==0)
		resultBox.setInit (this.totalVertexArraySC[i].point3d);
		else
			resultBox.addPoint3D(this.totalVertexArraySC[i].point3d);
		
	}
	return resultBox;
};

f4d_vertexMatrix.prototype.set_vertexIdxInList = function()
{
	var idx_in_list = 0;
	var vertex = undefined;
	var vtxList = undefined;
	var vertexLists_count = this.vertexListsArray.length;
	for(var i=0; i<vertexLists_count; i++)
	{
		vtxList = this.vertexListsArray[i];
		vertex_count = vtxList.vertexArray.length;
		for(var j=0; j<vertex_count; j++)
		{
			vertex = vtxList.get_vertex(j);
			vertex.m_idx_inList = idx_in_list;
			idx_in_list++;
		}
	}
};

f4d_vertexMatrix.prototype.get_vertexCount = function()
{
	var vertexCount = 0;
	var vertexLists_count = this.vertexListsArray.length;
	for(var i=0; i<vertexLists_count; i++)
	{
		vertexCount += this.vertexListsArray[i].get_vertexCount();
	}
	
	return vertexCount;
};

f4d_vertexMatrix.prototype.get_totalVertexArray = function(resultTotalVertexArray)
{
	var vertexLists_count = this.vertexListsArray.length;
	for(var i=0; i<vertexLists_count; i++)
	{
		vtxList = this.vertexListsArray[i];
		vertex_count = vtxList.vertexArray.length;
		for(var j=0; j<vertex_count; j++)
		{
			vertex = vtxList.get_vertex(j);
			resultTotalVertexArray.push(vertex);
		}
	}
	
	return resultTotalVertexArray;
};

f4d_vertexMatrix.prototype.get_vbo_vertexColor_FloatArray = function(resultFloatArray)
{
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.get_totalVertexArray(this.totalVertexArraySC);
	
	var total_vertex_count = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined)
		resultFloatArray = new Float32Array(total_vertex_count*6);
	
	var vertex = undefined;
	for(var i=0; i<total_vertex_count; i++)
	{
		vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*6] = vertex.point3d.x;
		resultFloatArray[i*6+1] = vertex.point3d.y;
		resultFloatArray[i*6+2] = vertex.point3d.z;
		
		resultFloatArray[i*6+3] = vertex.color4.r;
		resultFloatArray[i*6+4] = vertex.color4.g;
		resultFloatArray[i*6+5] = vertex.color4.b;
	}
	
	return resultFloatArray;
};

f4d_vertexMatrix.prototype.get_vbo_vertexColorRGBA_FloatArray = function(resultFloatArray)
{
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.get_totalVertexArray(this.totalVertexArraySC);
	
	var total_vertex_count = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined)
		resultFloatArray = new Float32Array(total_vertex_count*7);
	
	var vertex = undefined;
	for(var i=0; i<total_vertex_count; i++)
	{
		vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*7] = vertex.point3d.x;
		resultFloatArray[i*7+1] = vertex.point3d.y;
		resultFloatArray[i*7+2] = vertex.point3d.z;
		
		resultFloatArray[i*7+3] = vertex.color4.r;
		resultFloatArray[i*7+4] = vertex.color4.g;
		resultFloatArray[i*7+5] = vertex.color4.b;
		resultFloatArray[i*7+6] = vertex.color4.a;
	}
	
	return resultFloatArray;
};

f4d_vertexMatrix.prototype.get_vbo_vertex_FloatArray = function(resultFloatArray)
{
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.get_totalVertexArray(this.totalVertexArraySC);
	
	var total_vertex_count = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined)
		resultFloatArray = new Float32Array(total_vertex_count*3);
	
	var vertex = undefined;
	for(var i=0; i<total_vertex_count; i++)
	{
		vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*3] = vertex.point3d.x;
		resultFloatArray[i*3+1] = vertex.point3d.y;
		resultFloatArray[i*3+2] = vertex.point3d.z;
	}
	
	return resultFloatArray;
};

f4d_vertexMatrix.prototype.translate_vertices = function(dir_x, dir_y, dir_z, distance)
{
	var vertexLists_count = this.vertexListsArray.length;
	for(var i=0; i<vertexLists_count; i++)
	{
		this.vertexListsArray[i].translate_vertices(dir_x, dir_y, dir_z, distance);
	}
};

f4d_vertexMatrix.prototype.make_tTriangles_lateralSidesLOOP = function(tTrianglesMatrix)
{
	// condition: all the vertex lists must have the same number of vertex.***
	//--------------------------------------------------------------------------
	var vtxList_1 = undefined;
	var vtxList_2 = undefined;
	var tTrianglesList = undefined;
	var tTriangle_1 = undefined;
	var tTriangle_2 = undefined;
	var vertex_count = 0;
	
	var vertexLists_count = this.vertexListsArray.length;
	for(var i=0; i<vertexLists_count-1; i++)
	{
		vtxList_1 = this.vertexListsArray[i];
		vtxList_2 = this.vertexListsArray[i+1];
		tTrianglesList = tTrianglesMatrix.new_tTrianglesList();
		
		vertex_count = vtxList_1.vertexArray.length;
		for(var j=0; j<vertex_count; j++)
		{
			tTriangle_1 = tTrianglesList.new_tTriangle();
			tTriangle_2 = tTrianglesList.new_tTriangle();
			
			if(j == vertex_count-1)
			{
				tTriangle_1.set_vertices(vtxList_1.get_vertex(j), vtxList_2.get_vertex(j), vtxList_2.get_vertex(0)); 
				tTriangle_2.set_vertices(vtxList_1.get_vertex(j), vtxList_2.get_vertex(0), vtxList_1.get_vertex(0)); 
			}
			else
			{
				tTriangle_1.set_vertices(vtxList_1.get_vertex(j), vtxList_2.get_vertex(j), vtxList_2.get_vertex(j+1)); 
				tTriangle_2.set_vertices(vtxList_1.get_vertex(j), vtxList_2.get_vertex(j+1), vtxList_1.get_vertex(j+1)); 
			}
		}
	}
};

f4d_vertexMatrix.prototype.transformPoints_byMatrix4 = function(transformMatrix)
{
	var vtxList = undefined;
	var vertexLists_count = this.vertexListsArray.length;
	for(var i=0; i<vertexLists_count; i++)
	{
		vtxList = this.vertexListsArray[i];
		vtxList.transformPoints_byMatrix4(transformMatrix);
	}
};


  
//***********************************************************************************************//
// F4D BoundingBox.**************************************************************************** //
var f4d_boundingBox = function()
{
	this._minX = 1000000.0; 
	this._minY = 1000000.0;
	this._minZ = 1000000.0;
  
	this._maxX = -1000000.0; 
	this._maxY = -1000000.0;
	this._maxZ = -1000000.0;
  
};

f4d_boundingBox.prototype.setInit = function(point3d)
{
  this._minX = point3d.x;
  this._minY = point3d.y;
  this._minZ = point3d.z;
  
  this._maxX = point3d.x; 
  this._maxY = point3d.y;
  this._maxZ = point3d.z;
};

f4d_boundingBox.prototype.addPoint3D = function(point3d)
{
  if(point3d.x < this._minX)this._minX = point3d.x;
  else if(point3d.x > this._maxX)this._maxX = point3d.x;
  
  if(point3d.y < this._minY)this._minY = point3d.y;
  else if(point3d.y > this._maxY)this._maxY = point3d.y;
  
  if(point3d.z < this._minZ)this._minZ = point3d.z;
  else if(point3d.z > this._maxZ)this._maxZ = point3d.z;
};
  
f4d_boundingBox.prototype.addBox = function(boundingBox)
{
  if(boundingBox._minX < this._minX)this._minX = boundingBox._minX;
  if(boundingBox._maxX > this._maxX)this._maxX = boundingBox._maxX;
  
  if(boundingBox._minY < this._minY)this._minY = boundingBox._minY;
  if(boundingBox._maxY > this._maxY)this._maxY = boundingBox._maxY;
  
  if(boundingBox._minZ < this._minZ)this._minZ = boundingBox._minZ;
  if(boundingBox._maxZ > this._maxZ)this._maxZ = boundingBox._maxZ;
};

f4d_boundingBox.prototype.get_maxLength = function()
{
  var result = this._maxX - this._minX;
  var dim_y = this._maxY - this._minY;
  var dim_z = this._maxZ - this._minZ;
  if(dim_y > result)result = dim_y;
  if(dim_z > result)result = dim_z;
  
  return result;
};

f4d_boundingBox.prototype.get_centerPoint3d = function(resultPoint3d)
{
	if(resultPoint3d == undefined)
		resultPoint3d = new f4d_point3d();
	
	resultPoint3d.set((this._maxX + this._minX)/2, (this._maxY + this._minY)/2, (this._maxZ + this._minZ)/2);
	return resultPoint3d;
};

f4d_boundingBox.prototype.isPoint3dInside = function(x, y, z)
{
  if(x < this._minX || x > this._maxX)
  {
	  return false;
  }
  else if(y < this._minY || y > this._maxY)
  {
	  return false;
  }
  else if(z < this._minZ || z > this._maxZ)
  {
	  return false;
  }
  
  return true;
};


  
  // ******************************************************************************************* //
  // FTriangles.******************************************************************************* //
  var f4d_triangle= function()
  {
	 this.m_point_1 = null;
  	this.m_point_2 = null;
  	this.m_point_3 = null;
  	this.m_normal = null;
  	
  	this.m_point_1_idx = -1;
  	this.m_point_2_idx = -1;
  	this.m_point_3_idx = -1;
  	
  	this.m_color_1 = null;
  	this.m_color_2 = null;
  	this.m_color_3 = null;
  	
  };
  
  f4d_triangle.prototype.destroy = function()
  {
	  // No destroy Points3d here, only assign NULL value. Points3d must be destroyed for the owner(ftrianglesSurface).***
	//if(this.m_point_1!=null)this.m_point_1.destroy();
  	//if(this.m_point_2!=null)this.m_point_2.destroy();
  	//if(this.m_point_3!=null)this.m_point_3.destroy();
  	//if(this.m_normal!=null)this.m_normal.destroy();

  	if(this.m_color_1!=null)this.m_color_1.destroy();
  	if(this.m_color_2!=null)this.m_color_2.destroy();
  	if(this.m_color_3!=null)this.m_color_3.destroy();
	//--------------------------
	
	this.m_point_1 = null;
  	this.m_point_2 = null;
  	this.m_point_3 = null;
  	this.m_normal = null;
	
	this.m_point_1_idx = null;
  	this.m_point_2_idx = null;
  	this.m_point_3_idx = null;
  	
  	this.m_color_1 = null;
  	this.m_color_2 = null;
  	this.m_color_3 = null;
  };
  
  f4d_triangle.prototype.setPoints3DIndices = function(point_1_idx, point_2_idx, point_3_idx)
  {
	  this.m_point_1_idx = point_1_idx;
  	this.m_point_2_idx = point_2_idx;
  	this.m_point_3_idx = point_3_idx;
  };

  f4d_triangle.prototype.setPoints3D = function(point_1, point_2, point_3)
  {
	  this.m_point_1 = point_1;
  	this.m_point_2 = point_2;
  	this.m_point_3 = point_3;
  };
  
  f4d_triangle.prototype.setColors = function(color_1, color_2, color_3)
  {
	  this.m_color_1 = color_1;
  	this.m_color_2 = color_2;
  	this.m_color_3 = color_3;
  };

	// F4D_Polygon.************************************************************************************************************ //
	var f4d_Polygon = function()
	{
		this.mPoint3DArray = [];

	};

	f4d_Polygon.prototype.addPoint3D = function(point3d)
	  {
		  this.mPoint3DArray.push(point3d);
	  };

	f4d_Polygon.prototype.newPoint3D = function()
	  {
		  var point3d = new f4d_point3d();
		  this.mPoint3DArray.push(point3d);
		  return point3d;
	  };

  // FTrianglesSurfaces.******************************************************************************************************* //
  var f4d_trianglesSurface= function()
  {
	  this.mPoint3DArray = [];
	  this.mTrianglesArray = [];
  	
  };
  
  f4d_trianglesSurface.prototype.destroy = function()
  {
	  // 1rst, destroy ftriangles.**********************************
	  var ftriangles_count = this.mTrianglesArray.length;
	  for(var i=0; i<ftriangles_count; i++)
	  {
		  var ftriangle = this.mTrianglesArray[i];
		  if(ftriangle!=null)ftriangle.destroy();
		  ftriangle = null;
	  }
	  this.mTrianglesArray = null;
	  
	  // 2nd, destroy points3d.*************************************
	  var points_count = this.mPoint3DArray.length;
	  for(var i=0; i<points_count; i++)
	  {
		  var point = this.mPoint3DArray[i];
		  if(point!=null)point.destroy();
		  point = null;
	  }
	  this.mPoint3DArray = null;
  };
  
  f4d_trianglesSurface.prototype.getVertexColorsIndicesArrays = function(generalVBOArraysContainer)
  {
	  var current_meshArrays = null;
	  var meshArrays_count = generalVBOArraysContainer.meshArrays.length;
	  if(meshArrays_count == 0)
	  {
		  current_meshArrays = generalVBOArraysContainer.newVertexColorIdx_Array();
	  }
	  else
	  {
		  current_meshArrays = generalVBOArraysContainer.meshArrays[meshArrays_count-1]; // take the last.***
	  }
	  
	  // max unsigned short =  65,535
	  var max_indices = 65000;
	  
	  var ftriangles_count = this.mTrianglesArray.length;
	  for(var i=0; i<ftriangles_count; i++)
	  {
		  if(current_meshArrays.mesh_vertices.length/3 >= max_indices)
		  {
			  current_meshArrays = generalVBOArraysContainer.newVertexColorIdx_Array();
		  }
		  
		  var ftriangle = this.mTrianglesArray[i];
		  var idx_p1 = ftriangle.m_point_1_idx;
		  var idx_p2 = ftriangle.m_point_2_idx;
		  var idx_p3 = ftriangle.m_point_3_idx;
		  
		  var color_p1 = ftriangle.m_color_1;
		  var color_p2 = ftriangle.m_color_2;
		  var color_p3 = ftriangle.m_color_3;
		  
		  var p1 = this.mPoint3DArray[idx_p1];
		  var p2 = this.mPoint3DArray[idx_p2];
		  var p3 = this.mPoint3DArray[idx_p3];
		  
		  
		  // Point 1.***
		  current_meshArrays.mesh_vertices.push(p1.x);
		  current_meshArrays.mesh_vertices.push(p1.y);
		  current_meshArrays.mesh_vertices.push(p1.z);
		  current_meshArrays.mesh_tri_indices.push(current_meshArrays.mesh_vertices.length/3 - 1);
		  current_meshArrays.mesh_colors.push(color_p1.r);
		  current_meshArrays.mesh_colors.push(color_p1.g);
		  current_meshArrays.mesh_colors.push(color_p1.b);
		  
		  // Point 2.***
		  current_meshArrays.mesh_vertices.push(p2.x);
		  current_meshArrays.mesh_vertices.push(p2.y);
		  current_meshArrays.mesh_vertices.push(p2.z);
		  current_meshArrays.mesh_tri_indices.push(current_meshArrays.mesh_vertices.length/3 - 1);
		  current_meshArrays.mesh_colors.push(color_p2.r);
		  current_meshArrays.mesh_colors.push(color_p2.g);
		  current_meshArrays.mesh_colors.push(color_p2.b);
		  
		  // Point 3.***
		  current_meshArrays.mesh_vertices.push(p3.x);
		  current_meshArrays.mesh_vertices.push(p3.y);
		  current_meshArrays.mesh_vertices.push(p3.z);
		  current_meshArrays.mesh_tri_indices.push(current_meshArrays.mesh_vertices.length/3 - 1);
		  current_meshArrays.mesh_colors.push(color_p3.r);
		  current_meshArrays.mesh_colors.push(color_p3.g);
		  current_meshArrays.mesh_colors.push(color_p3.b);
		  
	  }
  };
  
  f4d_trianglesSurface.prototype.getVertexIndicesArrays = function(general_VertexIdxVBO_ArraysContainer)
  {
	  var current_meshArrays = null;
	  var meshArrays_count = general_VertexIdxVBO_ArraysContainer._meshArrays.length;
	  if(meshArrays_count == 0)
	  {
		  current_meshArrays = general_VertexIdxVBO_ArraysContainer.newVertexIdx_Array();
	  }
	  else
	  {
		  current_meshArrays = general_VertexIdxVBO_ArraysContainer._meshArrays[meshArrays_count-1]; // take the last.***
	  }
	  
	  // max unsigned short =  65,535
	  var max_indices = 65000;
	  
	  var ftriangles_count = this.mTrianglesArray.length;
	  var curr_vtx_count = current_meshArrays.mesh_vertices.length/3;
	  var vtx_count = this.mPoint3DArray.length;
	  for(var i=0; i<vtx_count; i++)
	  {
		  var point = this.mPoint3DArray[i];
		  current_meshArrays.mesh_vertices.push(point.x);
		  current_meshArrays.mesh_vertices.push(point.y);
		  current_meshArrays.mesh_vertices.push(point.z);
	  }
	  
	  for(var i=0; i<ftriangles_count; i++)
	  {
		  if(current_meshArrays.mesh_vertices.length/3 >= max_indices)
		  {
			  current_meshArrays = general_VertexIdxVBO_ArraysContainer.newVertexIdx_Array();
			  curr_vtx_count = 0;
		  }
		  
		  var ftriangle = this.mTrianglesArray[i];
		  var idx_p1 = ftriangle.m_point_1_idx;
		  var idx_p2 = ftriangle.m_point_2_idx;
		  var idx_p3 = ftriangle.m_point_3_idx;

		  current_meshArrays.mesh_tri_indices.push(idx_p1 + curr_vtx_count);
		  current_meshArrays.mesh_tri_indices.push(idx_p2 + curr_vtx_count);
		  current_meshArrays.mesh_tri_indices.push(idx_p3 + curr_vtx_count);
	  }
  };
  
  f4d_trianglesSurface.prototype.getVertexIndicesArrays_original = function(general_VertexIdxVBO_ArraysContainer)
  {
	  var current_meshArrays = null;
	  var meshArrays_count = general_VertexIdxVBO_ArraysContainer._meshArrays.length;
	  if(meshArrays_count == 0)
	  {
		  current_meshArrays = general_VertexIdxVBO_ArraysContainer.newVertexIdx_Array();
	  }
	  else
	  {
		  current_meshArrays = general_VertexIdxVBO_ArraysContainer._meshArrays[meshArrays_count-1]; // take the last.***
	  }
	  
	  // max unsigned short =  65,535
	  var max_indices = 65000;
	  
	  var ftriangles_count = this.mTrianglesArray.length;
	  for(var i=0; i<ftriangles_count; i++)
	  {
		  if(current_meshArrays.mesh_vertices.length/3 >= max_indices)
		  {
			  current_meshArrays = general_VertexIdxVBO_ArraysContainer.newVertexIdx_Array();
		  }
		  
		  var ftriangle = this.mTrianglesArray[i];
		  var idx_p1 = ftriangle.m_point_1_idx;
		  var idx_p2 = ftriangle.m_point_2_idx;
		  var idx_p3 = ftriangle.m_point_3_idx;
		  
		  var p1 = this.mPoint3DArray[idx_p1];
		  var p2 = this.mPoint3DArray[idx_p2];
		  var p3 = this.mPoint3DArray[idx_p3];
		  
		  
		  // Point 1.***
		  current_meshArrays.mesh_vertices.push(p1.x);
		  current_meshArrays.mesh_vertices.push(p1.y);
		  current_meshArrays.mesh_vertices.push(p1.z);
		  current_meshArrays.mesh_tri_indices.push(current_meshArrays.mesh_vertices.length/3 - 1);
		  
		  // Point 2.***
		  current_meshArrays.mesh_vertices.push(p2.x);
		  current_meshArrays.mesh_vertices.push(p2.y);
		  current_meshArrays.mesh_vertices.push(p2.z);
		  current_meshArrays.mesh_tri_indices.push(current_meshArrays.mesh_vertices.length/3 - 1);
		  
		  // Point 3.***
		  current_meshArrays.mesh_vertices.push(p3.x);
		  current_meshArrays.mesh_vertices.push(p3.y);
		  current_meshArrays.mesh_vertices.push(p3.z);
		  current_meshArrays.mesh_tri_indices.push(current_meshArrays.mesh_vertices.length/3 - 1);
		  
	  }
  };
  
  
  
  f4d_trianglesSurface.prototype.newPoint3D = function()
  {
	  var point3d = new f4d_point3d();
	  this.mPoint3DArray.push(point3d);
	  return point3d;
  };
  
  f4d_trianglesSurface.prototype.newTriangle = function()
  {
	  var ftriangle = new f4d_triangle();
	  this.mTrianglesArray.push(ftriangle);
	  return ftriangle;
  };
  
  f4d_trianglesSurface.prototype.getTransformedTrianglesSurface = function(matrix4)
  {
	  var transformedTrianglesSurface = new f4d_trianglesSurface();
	  
	  // 1) copy and transform the points3d.***
	  var points_count = this.mPoint3DArray.length;
	  for(var i=0; i<points_count; i++)
	  {
		  var point3d = this.mPoint3DArray[i];
		  var transformed_point = matrix4.transformPoint3D(point3d);
		  transformedTrianglesSurface.mPoint3DArray.push(transformed_point);
	  }
	  
	  // 2) copy the triangles.***
	  var tri_count = this.mTrianglesArray.length;
	  for(var i=0; i<tri_count; i++)
	  {
		  var tri = this.mTrianglesArray[i];
		  var transformed_tri = transformedTrianglesSurface.newTriangle();
		  transformed_tri.setPoints3DIndices(tri.m_point_1_idx, tri.m_point_2_idx, tri.m_point_3_idx);
	  }
	  return transformedTrianglesSurface;
  };
  
  f4d_trianglesSurface.prototype.getBoundingBox = function()
  {
	  var points_count = this.mPoint3DArray.length;
	  if(points_count == 0)
		  return null;
	  
	  var bb = new f4d_boundingBox();
	  var first_point3d = this.mPoint3DArray[0];
	  bb.setInit(first_point3d);
	  
	  for(var i=1; i<points_count; i++)
	  {
		  var point3d = this.mPoint3DArray[i];
		  bb.addPoint3D(point3d);
	  }
	  
	  return bb;
  };
  
  // FPolyhedron.***************************************************************************************************************** //
  var f4d_fpolyhedron= function()
  {
	  this.mFTrianglesSurfacesArray = [];
	  this.mIFCEntityType = -1;
  };
  
  f4d_fpolyhedron.prototype.destroy = function()
  {
	  var ftriSurfaces_count = this.mFTrianglesSurfacesArray.length;
	  for(var i=0; i<ftriSurfaces_count; i++)
	  {
		  var ftriangles_surface = this.mFTrianglesSurfacesArray[i];
		  if(ftriangles_surface!=null)ftriangles_surface.destroy();
		  ftriangles_surface = null;
	  }
	  this.mFTrianglesSurfacesArray = null;
	  
	  this.mIFCEntityType = null;
  };
  
  f4d_fpolyhedron.prototype.getVertexColorsIndicesArrays = function(generalVBOArraysContainer)
  {
	  var ftriSurfaces_count = this.mFTrianglesSurfacesArray.length;
	  for(var i=0; i<ftriSurfaces_count; i++)
	  {
		  var ftriangles_surface = this.mFTrianglesSurfacesArray[i];
		  ftriangles_surface.getVertexColorsIndicesArrays(generalVBOArraysContainer);
	  }
  };
  
  f4d_fpolyhedron.prototype.getVertexIndicesArrays = function(general_VertexIdxVBO_ArraysContainer)
  {
	  var ftriSurfaces_count = this.mFTrianglesSurfacesArray.length;
	  for(var i=0; i<ftriSurfaces_count; i++)
	  {
		  var ftriangles_surface = this.mFTrianglesSurfacesArray[i];
		  ftriangles_surface.getVertexIndicesArrays(general_VertexIdxVBO_ArraysContainer);
	  }
  };
  
  
  f4d_fpolyhedron.prototype.newFTrianglesSurface = function()
  {
	  var ftrianglesSurface = new f4d_trianglesSurface();
	  this.mFTrianglesSurfacesArray.push(ftrianglesSurface);
	  return ftrianglesSurface;
  };
  
  f4d_fpolyhedron.prototype.getTransformedFPolyhedron = function(matrix4)
  {
	  var transformedFPolyhedron = new f4d_fpolyhedron();
	  
	  var ftriSurfaces_count = this.mFTrianglesSurfacesArray.length;
	  for(var i=0; i<ftriSurfaces_count; i++)
	  {
		  var ftriangles_surface = this.mFTrianglesSurfacesArray[i];
		  var transformed_ftriangles_surface = ftriangles_surface.getTransformedTrianglesSurface(matrix4);
		  transformedFPolyhedron.mFTrianglesSurfacesArray.push(transformed_ftriangles_surface);
	  }
	  
	  return transformedFPolyhedron;
  };
  
  f4d_fpolyhedron.prototype.getBoundingBox = function()
  {
	  var ftriSurfaces_count = this.mFTrianglesSurfacesArray.length;
	  if(ftriSurfaces_count == 0)
		  return null;
	  
	  var bb = null;
	  
	  for(var i=0; i<ftriSurfaces_count; i++)
	  {
		  var ftriangles_surface = this.mFTrianglesSurfacesArray[i];
		  var current_bb = ftriangles_surface.getBoundingBox();
		  if(bb == null)
		  {
			  if(current_bb != null)
				  bb = current_bb;
		  }
		  else
		  {
			  if(current_bb != null)
				  bb.addBox(current_bb);
		  }
	  }
	  
	  return bb;
  };
  
  // FPolyhedronsList.**************************************************************************************************************** //
  var f4d_fpolyhedronsList= function()
  {
	  this.mFPolyhedronsArray = [];
  };
  
  f4d_fpolyhedronsList.prototype.getVertexColorsIndicesArrays = function(generalVBOArraysContainer)
  {
	  var fpolyhedrons_count = this.mFPolyhedronsArray.length;
	  for(var i=0; i<fpolyhedrons_count; i++)
	  {
		  var fpolyhedron = this.mFPolyhedronsArray[i];
		  if(fpolyhedron.mIFCEntityType != 27 && fpolyhedron.mIFCEntityType != 26) // 27 = ifc_space, 26 = ifc_windows.***
			  fpolyhedron.getVertexColorsIndicesArrays(generalVBOArraysContainer);
	  }
  };

  f4d_fpolyhedronsList.prototype.newFPolyhedron = function()
  {
	  var fpolyhedron = new f4d_fpolyhedron();
	  this.mFPolyhedronsArray.push(fpolyhedron);
	  return fpolyhedron;
  };

  // F4D Fitted Box.************************************************************************************************************* //
//	var f4d_FittedBox = function()
//	{
//
//	};

//*******************************************************************************************************************************//
// F4D_Quaternion.***************************************************************************************************************//
var f4d_Quaternion = function()
{
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.w = 1.0;
};

f4d_Quaternion.prototype.Modul = function()
{
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w );
};

f4d_Quaternion.prototype.Unitary = function()
{
	var modul = this.Modul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
	this.w /= modul;
};

f4d_Quaternion.prototype.Rotation_angDeg = function(angDeg, axis_x, axis_y, axis_z)
{
	var angRad = angDeg*Math.PI/180.0;
	this.Rotation_angRad(angRad, axis_x, axis_y, axis_z);
};

f4d_Quaternion.prototype.Rotation_angRad = function(angRad, axis_x, axis_y, axis_z)
{
	var s = Math.sqrt(axis_x*axis_x + axis_y*axis_y + axis_z*axis_z);
	var error = 10E-13;
	if(!s < error)
	{
		var c = 1.0/s;
		var omega = -0.5 * angRad;
		s = Math.sin(omega);
		this.x = axis_x * c * s;
		this.y = axis_y * c * s;
		this.z = axis_z * c * s;
		this.w = Math.cos(omega);
		this.Unitary();
	}
	else{
		this.x = 0.0;
		this.y = 0.0;
		this.z = 0.0;
		this.w = 1.0;
	}
};
	
// F4D Matrix.************************************************************************************************************** //
var f4d_Matrix4 = function()
{
	this._floatArrays = [];
	
	this._floatArrays.push(1);
	this._floatArrays.push(0);
	this._floatArrays.push(0);
	this._floatArrays.push(0);
	
	this._floatArrays.push(0);
	this._floatArrays.push(1);
	this._floatArrays.push(0);
	this._floatArrays.push(0);
	
	this._floatArrays.push(0);
	this._floatArrays.push(0);
	this._floatArrays.push(1);
	this._floatArrays.push(0);
	
	this._floatArrays.push(0);
	this._floatArrays.push(0);
	this._floatArrays.push(0);
	this._floatArrays.push(1);
	
	
};
	
f4d_Matrix4.prototype.Identity = function()
{
	this._floatArrays[0] = 1;  // Col 0 - Row 0.***
	this._floatArrays[1] = 0;  // Col 0 - Row 1.***
	this._floatArrays[2] = 0;  // Col 0 - Row 2.***
	this._floatArrays[3] = 0;  // Col 0 - Row 3.***
	
	this._floatArrays[4] = 0;  // Col 1 - Row 0.***
	this._floatArrays[5] = 1;  // Col 1 - Row 1.***
	this._floatArrays[6] = 0;  // Col 1 - Row 2.***
	this._floatArrays[7] = 0;  // Col 1 - Row 3.***
	
	this._floatArrays[8] = 0;  // Col 2 - Row 0.***
	this._floatArrays[9] = 0;  // Col 2 - Row 1.***
	this._floatArrays[10] = 1; // Col 2 - Row 2.***
	this._floatArrays[11] = 0; // Col 2 - Row 3.***
	
	this._floatArrays[12] = 0; // Col 3 - Row 0.***
	this._floatArrays[13] = 0; // Col 3 - Row 1.***
	this._floatArrays[14] = 0; // Col 3 - Row 2.***
	this._floatArrays[15] = 1; // Col 3 - Row 3.***
};

f4d_Matrix4.prototype.get_RowMajorMatrix = function()
{
	var rowMajor_matrix = new Float32Array(16);
	
	rowMajor_matrix[0] = this.get(0,0);
	rowMajor_matrix[1] = this.get(1,0);
	rowMajor_matrix[2] = this.get(2,0);
	rowMajor_matrix[3] = this.get(3,0);
	
	rowMajor_matrix[4] = this.get(0,1);
	rowMajor_matrix[5] = this.get(1,1);
	rowMajor_matrix[6] = this.get(2,1);
	rowMajor_matrix[7] = this.get(3,1);
	
	rowMajor_matrix[8] = this.get(0,2);
	rowMajor_matrix[9] = this.get(1,2);
	rowMajor_matrix[10] = this.get(2,2);
	rowMajor_matrix[11] = this.get(3,2);
	
	rowMajor_matrix[12] = this.get(0,3);
	rowMajor_matrix[13] = this.get(1,3);
	rowMajor_matrix[14] = this.get(2,3);
	rowMajor_matrix[15] = this.get(3,3);
	
	return rowMajor_matrix;
};

f4d_Matrix4.prototype.RotationAxis_angDeg = function(angDeg, axis_x, axis_y, axis_z)
{
	var quaternion = new f4d_Quaternion();
	quaternion.Rotation_angDeg(angDeg, axis_x, axis_y, axis_z);
	this.Rotation_byQuaternion(quaternion);
};

f4d_Matrix4.prototype.RotationAxis_angRad = function(angRad, axis_x, axis_y, axis_z)
{
	var quaternion = new f4d_Quaternion();
	quaternion.Rotation_angRad(angRad, axis_x, axis_y, axis_z);
	this.Rotation_byQuaternion(quaternion);
};

f4d_Matrix4.prototype.Rotation_byQuaternion = function(quaternion)
{
	var w = quaternion.w;
	var x = quaternion.x;
	var y = quaternion.y;
	var z = quaternion.z;
	
	this._floatArrays[this.getIndexOfArray(0,0)] = 1 - 2*y*y - 2*z*z;
	this._floatArrays[this.getIndexOfArray(0,1)] = 2*x*y + 2*z*w;
	this._floatArrays[this.getIndexOfArray(0,2)] = 2*x*z - 2*y*w;
	this._floatArrays[this.getIndexOfArray(0,3)] = 0.0;
	
	this._floatArrays[this.getIndexOfArray(1,0)] = 2*x*y - 2*z*w; 
	this._floatArrays[this.getIndexOfArray(1,1)] = 1 - 2*x*x - 2*z*z;
	this._floatArrays[this.getIndexOfArray(1,2)] = 2*y*z + 2*x*w;
	this._floatArrays[this.getIndexOfArray(1,3)] = 0.0;
	
	this._floatArrays[this.getIndexOfArray(2,0)] = 2*x*z + 2*y*w;
	this._floatArrays[this.getIndexOfArray(2,1)] = 2*y*z - 2*x*w;
	this._floatArrays[this.getIndexOfArray(2,2)] = 1 - 2*x*x - 2*y*y;
	this._floatArrays[this.getIndexOfArray(2,3)] = 0.0;
	
	this._floatArrays[this.getIndexOfArray(3,0)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3,1)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3,2)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3,3)] = 1.0;
	
};
	
f4d_Matrix4.prototype.setByFloat32Array = function(float32array)
{
	for(var i=0; i<16; i++)
	{
		this._floatArrays[i] = float32array[i];
	}
};

f4d_Matrix4.prototype.getIndexOfArray = function(col, row)
{
	return 4*col+row;
};

f4d_Matrix4.prototype.get = function(col, row)
{
	return this._floatArrays[this.getIndexOfArray(col, row)];
};

f4d_Matrix4.prototype.transformPoint3D = function(point3d, result_point3d)
{
	if(result_point3d == undefined)
	{
		result_point3d = new f4d_point3d();
	}

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;
	
	result_point3d.x = x*this.get(0,0) + y*this.get(1,0) + z*this.get(2,0) + this.get(3,0);
	result_point3d.y = x*this.get(0,1) + y*this.get(1,1) + z*this.get(2,1) + this.get(3,1);
	result_point3d.z = x*this.get(0,2) + y*this.get(1,2) + z*this.get(2,2) + this.get(3,2);
	
	return result_point3d;
};
	
f4d_Matrix4.prototype.getMultipliedByMatrix = function(matrix, resultMat)
{
	/*
	CKK_Matrix4 operator*(const CKK_Matrix4 &A) 
	{
		// Copied From Carve.***
		CKK_Matrix4 c;
		for (int i = 0; i < 4; i++) {
			for (int j = 0; j < 4; j++) {
				c.m[i][j] = 0.0;
				for (int k = 0; k < 4; k++) {
					c.m[i][j] += A.m[k][j] * m[i][k];
				}
			}
		}
		return c;
	}
	*/
	if(resultMat == undefined)
	 resultMat = new f4d_Matrix4();
 
	for(var i=0; i<4; i++)
	{
		for(var j=0; j<4; j++)
		{
			var idx = this.getIndexOfArray(i, j);
			resultMat._floatArrays[idx] = 0.0;
			for(var k=0; k<4; k++)
			{
				resultMat._floatArrays[idx] += matrix.get(k, j) * this.get(i, k);
			}
		}
	}
	return resultMat;
};
	
	
	//************************************************************************************************************************************************//
	// F4D_OcclusionCullingOctree_Cell.************************************************************************************************************* //
	var f4d_OcclusionCullingOctree_Cell = function(occlusionCullingOctree_Cell_Owner)
	{
		this._ocCulling_Cell_owner = occlusionCullingOctree_Cell_Owner;
		this._minX = 0.0;
		this._maxX = 0.0;
		this._minY = 0.0;
		this._maxY = 0.0;
		this._minZ = 0.0;
		this._maxZ = 0.0;
		this._indicesArray = []; // Visible objects indices.***
		this._subBoxesArray = [];
	
		this._indicesUInt32Array = [];
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.new_subBox = function()
	{
		var subBox = new f4d_OcclusionCullingOctree_Cell(this);
		this._subBoxesArray.push(subBox);
		return subBox;
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.create_8_subBoxes = function()
	{
		this._subBoxesArray.length = 0; // reset the array.***
		
		for(var i=0; i<8; i++)
		{
			this.new_subBox();
		}
	
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.set_dimensions = function(min_x, max_x, min_y, max_y, min_z, max_z)
	{
		this._minX = min_x;
		this._maxX = max_x;
		this._minY = min_y;
		this._maxY = max_y;
		this._minZ = min_z;
		this._maxZ = max_z;
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.set_sizesSubBoxes = function()
	{
		// Bottom                      Top
		// |----------|----------|     |----------|----------|
		// |          |          |     |          |          |       Y
		// |    3     |    2     |	   |    7     |    6     |       ^
		// |          |          |     |          |          |       |
		// |----------|----------|     |----------|----------|       |
		// |          |          |     |          |          |       |
		// |     0    |     1    |     |    4     |    5     |       |
		// |          |          |     |          |          |       -----------------> X
		// |----------|----------|     |----------|----------|  
		
		if(this._subBoxesArray.length > 0)
		{
			var half_x= (this._maxX + this._minX)/2.0;
			var half_y= (this._maxY + this._minY)/2.0;
			var half_z= (this._maxZ + this._minZ)/2.0;
			
			this._subBoxesArray[0].set_dimensions(this._minX, half_x,   this._minY, half_y,   this._minZ, half_z);
			this._subBoxesArray[1].set_dimensions(half_x, this._maxX,   this._minY, half_y,   this._minZ, half_z);
			this._subBoxesArray[2].set_dimensions(half_x, this._maxX,   half_y, this._maxY,   this._minZ, half_z);
			this._subBoxesArray[3].set_dimensions(this._minX, half_x,   half_y, this._maxY,   this._minZ, half_z);

			this._subBoxesArray[4].set_dimensions(this._minX, half_x,   this._minY, half_y,   half_z, this._maxZ);
			this._subBoxesArray[5].set_dimensions(half_x, this._maxX,   this._minY, half_y,   half_z, this._maxZ);
			this._subBoxesArray[6].set_dimensions(half_x, this._maxX,   half_y, this._maxY,   half_z, this._maxZ);
			this._subBoxesArray[7].set_dimensions(this._minX, half_x,   half_y, this._maxY,   half_z, this._maxZ);
			
			for(var i=0; i<this._subBoxesArray.length; i++)
			{
				this._subBoxesArray[i].set_sizesSubBoxes();
			}
			
		}
		
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.intersects_withPoint3D = function(x, y, z)
	{
		var intersects = false;
		
		if(x>this._minX && x<this._maxX)
		{
			if(y>this._minY && y<this._maxY)
			{
				if(z>this._minZ && z<this._maxZ)
				{
					intersects = true;
				}
			}
		}
		
		return intersects;
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.get_IntersectedSubBox_byPoint3D = function(x, y, z)
	{
		var intersectedSubBox = null;
		
		if(this._ocCulling_Cell_owner == null)
		{
			// This is the mother_cell.***
			if(!this.intersects_withPoint3D(x, y, z))
			{
				return null;
			}
		}
		
		var subBoxes_count = this._subBoxesArray.length;
		if(subBoxes_count > 0)
		{
			var center_x = (this._minX + this._maxX)/2.0;
			var center_y = (this._minY + this._maxY)/2.0;
			var center_z = (this._minZ + this._maxZ)/2.0;
			
			var intersectedSubBox_aux = null;
			var intersectedSubBox_idx = undefined;
			
			if(x<center_x)
			{
				// Here are the boxes number 0, 3, 4, 7.***
				if(y<center_y)
				{
					// Here are 0, 4.***
					if(z<center_z) intersectedSubBox_idx = 0;
					else intersectedSubBox_idx = 4;
				}
				else
				{
					// Here are 3, 7.***
					if(z<center_z) intersectedSubBox_idx = 3;
					else intersectedSubBox_idx = 7;
				}
			}
			else 
			{
				// Here are the boxes number 1, 2, 5, 6.***
				if(y<center_y)
				{
					// Here are 1, 5.***
					if(z<center_z) intersectedSubBox_idx = 1;
					else intersectedSubBox_idx = 5;
				}
				else
				{
					// Here are 2, 6.***
					if(z<center_z) intersectedSubBox_idx = 2;
					else intersectedSubBox_idx = 6;
				}
			}
			
			intersectedSubBox_aux = this._subBoxesArray[intersectedSubBox_idx];
			intersectedSubBox = intersectedSubBox_aux.get_IntersectedSubBox_byPoint3D(x, y, z);
			
		}
		else
		{
			intersectedSubBox = this;
		}
		
		return intersectedSubBox;
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.get_IndicesVisiblesForEye = function(eye_x, eye_y, eye_z, result_visibleIndicesArray)
	{
		var intersectedSubBox = this.get_IntersectedSubBox_byPoint3D(eye_x, eye_y, eye_z);
		
		if(intersectedSubBox != null && intersectedSubBox._indicesArray.length > 0)
		{
			result_visibleIndicesArray = intersectedSubBox._indicesArray;
		}
		
		return result_visibleIndicesArray;
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.expandBox = function(expansionDist)
	{
		this._minX -= expansionDist;
		this._maxX += expansionDist;
		this._minY -= expansionDist;
		this._maxY += expansionDist;
		this._minZ -= expansionDist;
		this._maxZ += expansionDist;
	};
	
	f4d_OcclusionCullingOctree_Cell.prototype.parse_arrayBuffer = function(arrayBuffer, bytes_readed, f4dReaderWriter)
	{
		// Important note: this is the version of neoGeometry.***
		// Important note: this is the version of neoGeometry.***
		// Important note: this is the version of neoGeometry.***
		var is_mother_cell = f4dReaderWriter.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		if(is_mother_cell)
		{
			// read the mother dimensions.***
			var minX = f4dReaderWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var maxX = f4dReaderWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var minY = f4dReaderWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var maxY = f4dReaderWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var minZ = f4dReaderWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			var maxZ = f4dReaderWriter.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			this.set_dimensions(minX, maxX, minY, maxY, minZ, maxZ);
		}
		else{
			// do nothing.***
		}
		
		var subBoxes_count = f4dReaderWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		if(subBoxes_count == 0)
		{
			var objects_count = f4dReaderWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var i=0; i<objects_count; i++)
			{
				var objects_idxInList = f4dReaderWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				this._indicesArray.push(objects_idxInList);
			}
		}
		else{
			for(var i=0; i<subBoxes_count; i++)
			{
				var subOcclusionBox = this.new_subBox();
				bytes_readed = this.parse_arrayBuffer(arrayBuffer, bytes_readed, f4dReaderWriter);
			}
		}
		
		return bytes_readed;
	};
	
//******************************************************************************************************************************************************
//******************************************************************************************************************************************************
	// F4D_OcclusionCullingOctree.****************************************************************************************************************** //
	var f4d_OcclusionCullingOctree = function()
	{
		this._ocCulling_box = new f4d_OcclusionCullingOctree_Cell(null);
		this._infinite_ocCulling_box = new f4d_OcclusionCullingOctree_Cell(null);
		
	};
	
//******************************************************************************************************************************************************
//******************************************************************************************************************************************************
	// F4D ReferenceObject.************************************************************************************************************************* // 
	var f4d_Reference = function()
	{
		// 1) Object ID.***
		this._id = 0;
		
		// 2) Block Idx.***
		this._block_idx = -1;
		
		// 3) Transformation Matrix.***
		this._matrix4 = new f4d_Matrix4();
	
		// 4) New. Only save the cache_key, and free geometry data.***
		//this._VBO_ByteColorsCacheKeys_Container = new VBO_ByteColorCacheKeys_Container(); // provisionally delete this.***
		
		// 4') may be only save the cache_key_idx.***
		this._VBO_ByteColorsCacheKeys_Container_idx = -1; // Test. Do this for possibly use with workers.***

	};
	
	f4d_Reference.prototype.multiplyTransformMatrix = function(matrix)
	{
		var multipliedMat = this._matrix4.getMultipliedByMatrix(matrix); // Original.***
		//var multipliedMat = matrix.getMultipliedByMatrix(this._matrix4); // Test.***
		this._matrix4 = multipliedMat;
	};
	
	f4d_Reference.prototype.getBoundingBox = function(blocksList)
	{
		var block = blocksList.getBlock(this._block_idx);
		if(block == null)
			return null;
		
		var block_fpolyhedron = block._fpolyhedron;
		var transformed_fpolyhedron = block_fpolyhedron.getTransformedFPolyhedron(this._matrix4);
		var bb = transformed_fpolyhedron.getBoundingBox();
		return bb;
	};
	
	f4d_Reference.prototype.newByteColorsSurface = function()
	{
		var byteColorsSurface = new f4d_ByteColorsSurface();
		this._ByteColorsSurfacesList.push(byteColorsSurface);
		return byteColorsSurface;
	};

// F4D CompoundReferenceObject.****************************************************************************************** //
var f4d_CompoundReference = function()
{
	this._referencesList = [];
	
};

f4d_CompoundReference.prototype.getBoundingBox = function(blocksList)
{
	var bb = null;
	var references_count = this._referencesList.length;
	for(var i=0; i<references_count; i++)
	{
		var reference = this._referencesList[i];
		var current_bb = reference.getBoundingBox(blocksList);
		if(bb == null)
		{
			if(current_bb != null)
				bb = current_bb;
		}
		else
		{
			if(current_bb != null)
				bb.addBox(current_bb);
		}
	}
	
	return bb;
};

f4d_CompoundReference.prototype.newReference = function()
{
	var ref = new f4d_Reference();
	this._referencesList.push(ref);
	return ref;
};

// ************************************************************************************************************************** //
//F4D CompoundReferenceObject_List.****************************************************************************************** //
var f4d_CompoundReferencesList = function()
{
	this._name = "";
	this._compoundRefsArray = [];
	this._lodLevel = -1;
	this._ocCulling = new f4d_OcclusionCullingOctree();
	this._currentVisibleIndices = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC_2 = []; // Determined by occlusion culling.***
};

f4d_CompoundReferencesList.prototype.update_currentVisibleIndices = function(eye_x, eye_y, eye_z)
{
	this._currentVisibleIndicesSC = this._ocCulling._infinite_ocCulling_box.get_IndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC);
	this._currentVisibleIndicesSC_2 = this._ocCulling._ocCulling_box.get_IndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
	this._currentVisibleIndices = this._currentVisibleIndicesSC.concat(this._currentVisibleIndicesSC_2);
};

f4d_CompoundReferencesList.prototype.update_currentVisibleIndices_Interior = function(eye_x, eye_y, eye_z)
{
	this._currentVisibleIndices = this._ocCulling._ocCulling_box.get_IndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndices);
};


f4d_CompoundReferencesList.prototype.getBoundingBox = function(blocksList)
{
	var bb = null;
	var compRefs_count = this._compoundRefsArray.length;
	for(var i=0; i<compRefs_count; i++)
	{
		var compRef = this._compoundRefsArray[i];
		var current_bb = compRef.getBoundingBox(blocksList);
		if(bb == null)
		{
			if(current_bb != null)
				bb = current_bb;
		}
		else
		{
			if(current_bb != null)
				bb.addBox(current_bb);
		}
	}
	return bb;
};

f4d_CompoundReferencesList.prototype.newCompoundReference = function()
{
	var compRef = new f4d_CompoundReference();
	this._compoundRefsArray.push(compRef);
	
	return compRef;
};

f4d_CompoundReferencesList.prototype.multiplyReferencesMatrices = function(matrix)
{
	var compRefs_count = this._compoundRefsArray.length;
	for(var i=0; i<compRefs_count; i++)
	{
		var compRef = this._compoundRefsArray[i];
		var refs_count = compRef._referencesList.length;
		for(var j=0; j<refs_count; j++)
		{
			var reference = compRef._referencesList[j];
			reference.multiplyTransformMatrix(matrix);
		}
	}
};
	
// ************************************************************************************************************************* //
// F4D CompoundReferencesList Container.************************************************************************************ //
var f4d_CompoundReferencesList_Container = function() // This class must be an octree...
{
	this._compRefsList_Array = [];
	
};

f4d_CompoundReferencesList_Container.prototype.newCompoundRefsList = function(compoundReferenceList_name, lodLevel)
{
	var compoundRefList = new f4d_CompoundReferencesList();
	compoundRefList._name = compoundReferenceList_name;
	compoundRefList._lodLevel = lodLevel;
	this._compRefsList_Array.push(compoundRefList);
	return compoundRefList;
};

f4d_CompoundReferencesList_Container.prototype.update_currentVisibleIndices_ofLists = function(eye_x, eye_y, eye_z)
{
	var compRefLists_count = this._compRefsList_Array.length;
	for(var i=0; i<compRefLists_count; i++)
	{
		this._compRefsList_Array[i].update_currentVisibleIndices(eye_x, eye_y, eye_z);
	}
};

f4d_CompoundReferencesList_Container.prototype.get_CompRefList_byName = function(compRefListsName)
{
	var result_compRefList = undefined;
	var found = false;
	var compRefLists_count = this._compRefsList_Array.length;
	var i=0;
	while(!found && i<compRefLists_count)
	{
		if(this._compRefsList_Array[i]._name == compRefListsName)
		{
			result_compRefList = this._compRefsList_Array[i];
		}
		i++;
	}
	
	return result_compRefList;
};
  
  //----------------------------------------------------------------------------------------------------
  //VBO container.**************************************************************************************************************** //
  /*
  var VertexColorIdx_Arrays = function()
  {
	  this.mesh_vertices = [];
	  this.mesh_colors = [];
	  this.mesh_tri_indices = [];
	  
	  this.MESH_VERTEX_cacheKey= null;
	  this.MESH_COLORS_cacheKey= null;
	  this.MESH_FACES_cacheKey= null;
  };

  var VBO_ArraysContainer = function()
  {
	  this.meshArrays = []; // "VertexColorIdx_Arrays" container.***
  };
  
  VBO_ArraysContainer.prototype.newVertexColorIdx_Array = function()
  {
	  var vci_array = new VertexColorIdx_Arrays();
	  this.meshArrays.push(vci_array);
	  return vci_array;
  };
  */
  
  // F4D Block - Reference with LightMapping.****************************************************************************** //
  // Vertices and Indices VBO.********************************************************************************************* // 
  
  var VertexIdx_Arrays = function() // VertexIdx_cacheKeys.***
  {
	  this.indices_count = -1;
	  
	  this.MESH_VERTEX_cacheKey= null;
	  this.MESH_FACES_cacheKey= null;
  };
  
  var VertexIdxVBO_ArraysContainer = function() // No!!. use "VBO_VertexIdxCacheKeys_Container" instead.***
  {
	  this._meshArrays = [];
  };
  
  VertexIdxVBO_ArraysContainer.prototype.newVertexIdx_Array = function()
  {
	  var vi_array = new VertexIdx_Arrays();
	  this._meshArrays.push(vi_array);
	  return vi_array;
  };
  
//**************************************************************************************************************************** //
// ByteColors VBO.*********************************************************************************************************** //
var ByteColorsVBO_Arrays = function()
{
  this.MESH_COLORS_cacheKey= null;
};

//**************************************************************************************************************************** //
// ByteColorsVBO_ArraysContainer.******************************************************************************************** //
var ByteColorsVBO_ArraysContainer = function()
{
  this._meshArrays = [];
};

ByteColorsVBO_ArraysContainer.prototype.newByteColorsVBO_Array = function() // No!!. use "VBO_ByteColorCacheKeys_Container" instead.***
{
  var byteColors_array = new ByteColorsVBO_Arrays();
  this._meshArrays.push(byteColors_array);
  return byteColors_array;
};

  //**************************************************************************************************************************** //
  // F4D Block.**************************************************************************************************************** //
  var f4d_Block = function()
  {
	  // This has "VertexIdxVBO_ArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.***
	  this._vbo_VertexIdx_CacheKeys_Container = new VBO_VertexIdxCacheKeys_Container(); // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
	  this.mIFCEntityType = -1;
	  this.isSmallObj = false;
	  
	  this.vertex_count = 0; // only for test.*** delete this.***
  };
  
  //**************************************************************************************************************************** //
  // F4D BlocksList.*********************************************************************************************************** //
  var f4d_BlocksList = function()
  {
	  this._name = "";
	  this._blocksArray = [];

  };

  f4d_BlocksList.prototype.newBlock = function()
  {
	  var block = new f4d_Block();
	  this._blocksArray.push(block);
	  return block;
  };
  
  f4d_BlocksList.prototype.getBlock = function(idx)
  {
	  var block = null;
	  
	  if(idx >= 0 && idx <this._blocksArray.length)
	  {
		  block = this._blocksArray[idx];
	  }
	  return block;
  };

	//**************************************************************************************************************************** //
  // F4D BlocksLists Container.********************************************************************************************** //
  var f4d_BlocksLists_Container = function()
  {
	  this._BlocksListsArray = [];
	  
  };
  
  f4d_BlocksLists_Container.prototype.newBlocksList = function(blocksList_name)
  {
	  var f4d_blocksList = new f4d_BlocksList();
	  f4d_blocksList._name = blocksList_name;
	  this._BlocksListsArray.push(f4d_blocksList);
	  return f4d_blocksList;
  };

  f4d_BlocksLists_Container.prototype.get_BlockList = function(blockList_name)
  {
  	var blocksLists_count = this._BlocksListsArray.length;
  	var found = false;
  	var i=0;
  	var blocksList = null;
  	while(!found && i<blocksLists_count)
  	{
  		var current_blocksList = this._BlocksListsArray[i];
  		if(current_blocksList._name == blockList_name)
  		{
  			found = true;
  			blocksList =current_blocksList;
  		}
  		i++;
  	}
  	return blocksList;
  };
  
  //**************************************************************************************************************************** //
  // F4D_VertexTexcoordsArrayList.********************************************************************************************** //
  var f4d_VertexTexcoords_Arrays = function()
  {
	  this._vertices_array = [];
	  this._texcoords_array = [];
  };
  
  //**************************************************************************************************************************** //
  // F4D_VNT_Interleaved_cacheKey.**************************************************************************************** //
  var f4d_VNT_Interleaved_cacheKeys = function()
  {
	  this.VNT_cacheKey = null;
	  this.indices_cacheKey = null;
	  this._vertices_count = 0;
	  this._indices_count = 0;
  };
  
  
  //**************************************************************************************************************************** //
  // F4D_VertexTexcoordsArrays_cacheKey.**************************************************************************************** //
  var f4d_VertexTexcoordsArrays_cacheKeys = function()
  {
	  this._verticesArray_cacheKey = null;
	  this._texcoordsArray_cacheKey = null;
	  this._vertices_count = 0;
	  this._normalsArray_cacheKey = null;
	  
	  // arrayBuffers.***
	  this.verticesArrayBuffer = undefined;
	  this.texCoordsArrayBuffer = undefined;
	  this.normalsArrayBuffer = undefined;
  };
  
  var f4d_VertexTexcoordsArrays_cacheKeys_Container = function()
  {
	  this._vtArrays_cacheKeys_array = [];
  };
  
  f4d_VertexTexcoordsArrays_cacheKeys_Container.prototype.new_VertexTexcoordsArraysCacheKey = function()
  {
	  var vt_cacheKey = new f4d_VertexTexcoordsArrays_cacheKeys();
	  this._vtArrays_cacheKeys_array.push(vt_cacheKey);
	  return vt_cacheKey;
  };
  
  
  
  // **************************************************************************************************************************** //
  // SimpleBuilding.************************************************************************************************************ //
  var f4d_simpleObject = function()
  {
	  this._vtCacheKeys_container = new f4d_VertexTexcoordsArrays_cacheKeys_Container();
  };
  
  var f4d_simpleStorey = function()
  {
	  this._simpleObjects_array = [];
  };
  
  f4d_simpleStorey.prototype.new_simpleObject = function()
  {
	  var simpleObject = new f4d_simpleObject();
	  this._simpleObjects_array.push(simpleObject);
	  return simpleObject;
  };
  
  var f4d_simpleBuilding = function()
  {
	  this._simpleStoreys_list = [];
	  //this._simpleBuildingImage = new Image();
	  this._simpleBuildingTexture = undefined;
	  //this._simpleBuildingImage.onload = function() { handleTextureLoaded(this._simpleBuildingImage, this._simpleBuildingTexture); }
  };
  
  f4d_simpleBuilding.prototype.new_simpleStorey = function()
  {
	  var storey = new f4d_simpleStorey();
	  this._simpleStoreys_list.push(storey);
	  return storey;
  };
  
  
  
  
// **************************************************************************************************************************** //
// f4d_SimpleBuilding_v1.****************************************************************************************************** //
var f4d_simpleBuilding_v1 = function()
{
	// this class is for faster rendering XDO converted projects.***
	this._simpleObjects_array = [];
	this._simpleBuildingTexture = undefined; // Mini texture. Possibly coincident with texture_3.***
	this._texture_0 = undefined; // Biggest texture.***
	this._texture_1 = undefined;
	this._texture_2 = undefined;
	this._texture_3 = undefined; // Smallest texture.***
  
	this.color = undefined;
  
	// arrayBuffers.***
	this.textureArrayBuffer = undefined; // use this for all textures.***
  
	// for SPEED TEST.***
	this._vnt_cacheKeys = undefined;
};

f4d_simpleBuilding_v1.prototype.new_simpleObject = function()
{
  var simpleObject = new f4d_simpleObject();
  this._simpleObjects_array.push(simpleObject);
  return simpleObject;
};

// **************************************************************************************************************************** //
// f4d_Octree.***************************************************************************************************************** //
var f4d_octree = function(octreeOwner)
{
	// Note: an octree is a cube, not a box.***
	this.centerPos = new f4d_point3d();
	this.half_dx = 0.0; // half width.***
	this.half_dy = 0.0; // half length.***
	this.half_dz = 0.0; // half height.***
	
	this.octree_owner = undefined;
	this.octree_level = 0;
	this.octree_number_name = 0;
	this.squareDistToEye = 10000.0;
	  
	if(octreeOwner)
	{
		this.octree_owner = octreeOwner;
		this.octree_level = octreeOwner.octree_level + 1;
	}
	

    this.subOctrees_array = [];
    this._compRefsList_Array = []; // empty if this is not smallest octreeBox.***
	this.neoRefsList_Array = []; // empty if this is not smallest octreeBox.***
};
  
  f4d_octree.prototype.new_subOctree = function()
  {
	  var subOctree = new f4d_octree(this);
	  this.subOctrees_array.push(subOctree);
	  return subOctree;
  };
  
  f4d_octree.prototype.makeTree = function(treeDepth)
  {
	  if(this.octree_level < treeDepth)
	  {
		  for(var i=0; i<8; i++)
		  {
			  var subOctree = this.new_subOctree();
			  subOctree.octree_number_name = this.octree_number_name * 10 + (i+1);
		  }
		  
		  this.setSizesSubBoxes();
		  
		  for(var i=0; i<8; i++)
		  {
			  this.subOctrees_array[i].makeTree(treeDepth);
		  }
		  
	  }
  };
  
  f4d_octree.prototype.getNumberOfDigits = function(intNumber)
  {
	  if(intNumber > 0)
	  {
		  var numDigits = Math.floor(Math.log10(intNumber)+1);
		  return numDigits;
	  }
	  else{
		  return 1;
	  }
  };
  
  f4d_octree.prototype.getMotherOctree = function()
  {
	  if(this.octree_owner == undefined)
	  {
		  return this;
	  }
	  else{
		  return this.octree_owner.getMotherOctree();
	  }
  }
  
  f4d_octree.prototype.getOctree = function(octreeNumberName, numDigits)
  {
	  if(numDigits == 1)
	  {
		  if(octreeNumberName == 0)
			  return this.getMotherOctree();
		  else{
			  return this.subOctrees_array[octreeNumberName-1];
		  }
	  }
	  
	  // determine the next level octree.***
	  var exp = numDigits-1;
	  var denominator = Math.pow(10, exp);
	  var idx = Math.floor(octreeNumberName /denominator) % 10;
	  var rest_octreeNumberName = octreeNumberName - idx * denominator;
	  return this.subOctrees_array[idx-1].getOctree(rest_octreeNumberName, numDigits-1);
  }
  
  f4d_octree.prototype.getOctree_byNumberName = function(octreeNumberName)
  {
	  var motherOctree = this.getMotherOctree();
	  var numDigits = this.getNumberOfDigits(octreeNumberName);
	  
	  if(numDigits == 1)
	  {
		  if(octreeNumberName == 0)
			  return motherOctree;
		  else{
			  return motherOctree.subOctrees_array[octreeNumberName-1];
		  }
	  }
	  
	  // determine the next level octree.***
	  var exp = numDigits-1;
	  var denominator = Math.pow(10, exp);
	  var idx = Math.floor(octreeNumberName /denominator) % 10;
	  var rest_octreeNumberName = octreeNumberName - idx * denominator;
	  return motherOctree.subOctrees_array[idx-1].getOctree(rest_octreeNumberName, numDigits-1);

  };
  
  f4d_octree.prototype.setSizesSubBoxes = function()
  {
	// Octree number name.********************************
	// Bottom                      Top
	// |---------|---------|     |---------|---------|
	// |         |         |     |         |         |       Y
	// |    3    |    2    |     |    7    |    6    |       ^
	// |         |         |     |         |         |       |
	// |---------+---------|     |---------+---------|       |
	// |         |         |     |         |         |       |
	// |    0    |    1    |     |    4    |    5    |       |
	// |         |         |     |         |         |       |-----------> X
	// |---------|---------|     |---------|---------|      
	
	var half_x = this.centerPos.x;
	var half_y = this.centerPos.y;
	var half_z = this.centerPos.z;
	
	var min_x = this.centerPos.x - this.half_dx;
	var min_y = this.centerPos.y - this.half_dy;
	var min_z = this.centerPos.z - this.half_dz;
	
	var max_x = this.centerPos.x + this.half_dx;
	var max_y = this.centerPos.y + this.half_dy;
	var max_z = this.centerPos.z + this.half_dz;
	
	if(this.subOctrees_array.length > 0)
	{
		this.subOctrees_array[0].setBoxSize(min_x, half_x, min_y, half_y, min_z, half_z);
		this.subOctrees_array[1].setBoxSize(half_x, max_x, min_y, half_y, min_z, half_z);
		this.subOctrees_array[2].setBoxSize(half_x, max_x, half_y, max_y, min_z, half_z);
		this.subOctrees_array[3].setBoxSize(min_x, half_x, half_y, max_y, min_z, half_z);
		
		this.subOctrees_array[4].setBoxSize(min_x, half_x, min_y, half_y, half_z, max_z);
		this.subOctrees_array[5].setBoxSize(half_x, max_x, min_y, half_y, half_z, max_z);
		this.subOctrees_array[6].setBoxSize(half_x, max_x, half_y, max_y, half_z, max_z);
		this.subOctrees_array[7].setBoxSize(min_x, half_x, half_y, max_y, half_z, max_z);
		
		for(var i=0; i<8; i++)
		{
			this.subOctrees_array[i].setSizesSubBoxes();
		}
	}
  };
  
  f4d_octree.prototype.setBoxSize = function(Min_X, Max_X, Min_Y, Max_Y, Min_Z, Max_Z)
  { 
	this.centerPos.x = (Max_X + Min_X)/2.0;
	this.centerPos.y = (Max_Y + Min_Y)/2.0;
	this.centerPos.z = (Max_Z + Min_Z)/2.0;
	
	this.half_dx = (Max_X - Min_X)/2.0; // half width.***
	this.half_dy = (Max_Y - Min_Y)/2.0; // half length.***
	this.half_dz = (Max_Z - Min_Z)/2.0; // half height.***
  };
  
  f4d_octree.prototype.getCenterPos = function()
  {
	return this.centerPos;
  };
  
  f4d_octree.prototype.getRadiusAprox = function()
  {
	  return Math.abs(this.half_dx*1.2);
  };
  
f4d_octree.prototype.getCRefListArray = function(result_CRefListsArray)
{
	if(result_CRefListsArray == undefined)
		result_CRefListsArray = [];
  
	if(this.subOctrees_array.length > 0)
	{
		for(var i=0; i<this.subOctrees_array.length; i++)
		{
			this.subOctrees_array[i].getCRefListArray(result_CRefListsArray);
		}
	}
	else
	{
		if(this._compRefsList_Array.length>0)
		{
			result_CRefListsArray.push(this._compRefsList_Array[0]); // there are only 1.***
		}
	}
};

f4d_octree.prototype.getNeoRefListArray = function(result_NeoRefListsArray)
{
	if(result_NeoRefListsArray == undefined)
		result_NeoRefListsArray = [];
  
	if(this.subOctrees_array.length > 0)
	{
		for(var i=0; i<this.subOctrees_array.length; i++)
		{
			this.subOctrees_array[i].getCRefListArray(result_NeoRefListsArray);
		}
	}
	else
	{
		if(this.neoRefsList_Array.length>0)
		{
			result_NeoRefListsArray.push(this.neoRefsList_Array[0]); // there are only 1.***
		}
	}
};
  
  f4d_octree.prototype.getFrustumVisibleCRefListArray = function(cesium_cullingVolume, result_CRefListsArray, cesium_boundingSphere_scratch, eye_x, eye_y, eye_z)
  {
	  var visibleOctreesArray = [];
	  var excludedOctArray = [];
	  var sortedOctreesArray = [];
	  var distAux = 0.0;
	  
	  //this.getAllSubOctrees(visibleOctreesArray); // Test.***
	  this.getFrustumVisibleOctrees(cesium_cullingVolume, visibleOctreesArray, cesium_boundingSphere_scratch);
	  /*
	  // Test. Exclude octrees with little frustum intersection.************************************************
	  // Test: exclude octrees that the center is rear of the near_plane of culling volume.***
	  var octrees_count = visibleOctreesArray.length;
	  for(var i=0; i<octrees_count; i++)
	  {
		  distAux = Cesium.Plane.getPointDistance(cesium_cullingVolume.planes[5], new Cesium.Cartesian3(visibleOctreesArray[i].centerPos.x, visibleOctreesArray[i].centerPos.y, visibleOctreesArray[i].centerPos.z));
		  cesium_boundingSphere_scratch.center.x = visibleOctreesArray[i].centerPos.x;
		  cesium_boundingSphere_scratch.center.y = visibleOctreesArray[i].centerPos.y;
		  cesium_boundingSphere_scratch.center.z = visibleOctreesArray[i].centerPos.z;
		  cesium_boundingSphere_scratch.radius = visibleOctreesArray[i].getRadiusAprox()*0.7;
		  
		  frustumCull = cesium_cullingVolume.computeVisibility(cesium_boundingSphere_scratch);
		  if(frustumCull == Cesium.Intersect.INSIDE || frustumCull == Cesium.Intersect.INTERSECTING) 
		  {
			  excludedOctArray.push(visibleOctreesArray[i]);
		  }
	  }
	  // End test.---------------------------------------------------------------------------------------------
	  */
	  // Now, we must sort the subOctrees near->far from eye.***
	  var visibleOctrees_count = visibleOctreesArray.length;
	  
	  for(var i=0; i<visibleOctrees_count; i++)
	  {
		  visibleOctreesArray[i].setSquareDistToEye(eye_x, eye_y, eye_z);	
		  this.putOctreeInEyeDistanceSortedArray(sortedOctreesArray, visibleOctreesArray[i], eye_x, eye_y, eye_z);
	  }
	  
	  
	  for(var i=0; i<visibleOctrees_count; i++)
	  {
		  sortedOctreesArray[i].getCRefListArray(result_CRefListsArray);
		  //visibleOctreesArray[i].getCRefListArray(result_CRefListsArray);
	  }
	  
	  visibleOctreesArray.length = 0;
	  sortedOctreesArray.length = 0;
	  excludedOctArray.length = 0;
  };
  
  f4d_octree.prototype.getFrustumVisibleNeoRefListArray = function(cesium_cullingVolume, result_NeoRefListsArray, cesium_boundingSphere_scratch, eye_x, eye_y, eye_z)
  {
	  var visibleOctreesArray = [];
	  var excludedOctArray = [];
	  var sortedOctreesArray = [];
	  var distAux = 0.0;
	  
	  if(this.octree_number_name == 535)
	  {
		  var hola=0;
	  }
	  //this.getAllSubOctrees(visibleOctreesArray); // Test.***
	  this.getFrustumVisibleOctrees_NeoBuilding(cesium_cullingVolume, visibleOctreesArray, cesium_boundingSphere_scratch); // Original.***
	
	  // Now, we must sort the subOctrees near->far from eye.***
	  var visibleOctrees_count = visibleOctreesArray.length;
	  
	  for(var i=0; i<visibleOctrees_count; i++)
	  {
		  
		  visibleOctreesArray[i].setSquareDistToEye(eye_x, eye_y, eye_z);	
		  this.putOctreeInEyeDistanceSortedArray(sortedOctreesArray, visibleOctreesArray[i], eye_x, eye_y, eye_z);
	  }
	  
	  
	  for(var i=0; i<visibleOctrees_count; i++)
	  {
		  sortedOctreesArray[i].getNeoRefListArray(result_NeoRefListsArray);
	  }
	  
	  visibleOctreesArray.length = 0;
	  sortedOctreesArray.length = 0;
	  excludedOctArray.length = 0;
	  
  };
  
  f4d_octree.prototype.getFrustumVisibleOctrees_NeoBuilding = function(cesium_cullingVolume, result_octreesArray, cesium_boundingSphere_scratch)
{
	if(this.subOctrees_array.length == 0 && this.neoRefsList_Array.length == 0)
	//if(this.subOctrees_array.length == 0 && this._compRefsList_Array.length == 0) // For use with ifc buildings.***
		return;
	
    // this function has Cesium dependence.***
    if(result_octreesArray == undefined)
	    result_octreesArray = [];
  
    if(cesium_boundingSphere_scratch == undefined)
	    cesium_boundingSphere_scratch = new Cesium.BoundingSphere(); // Cesium dependency.***
  
    cesium_boundingSphere_scratch.center.x = this.centerPos.x;
    cesium_boundingSphere_scratch.center.y = this.centerPos.y;
    cesium_boundingSphere_scratch.center.z = this.centerPos.z;
  
    if(this.subOctrees_array.length == 0)
    {
	    //cesium_boundingSphere_scratch.radius = this.getRadiusAprox()*0.7;
		cesium_boundingSphere_scratch.radius = this.getRadiusAprox();
    }
    else{
	    cesium_boundingSphere_scratch.radius = this.getRadiusAprox();
    }
  
    if(this.octree_level == 3)
    {
	    var hola = 0;
    }
  
    var frustumCull = cesium_cullingVolume.computeVisibility(cesium_boundingSphere_scratch);
	if(frustumCull == Cesium.Intersect.INSIDE ) 
	{
		//result_octreesArray.push(this);
		this.getAllSubOctrees(result_octreesArray);
	}
	else if(frustumCull == Cesium.Intersect.INTERSECTING  ) 
	{
		if(this.subOctrees_array.length == 0 && this.neoRefsList_Array.length > 0) // original, good.***
		{
			result_octreesArray.push(this);
		}
		else
		{
			for(var i=0; i<this.subOctrees_array.length; i++ )
			{
				this.subOctrees_array[i].getFrustumVisibleOctrees_NeoBuilding(cesium_cullingVolume, result_octreesArray, cesium_boundingSphere_scratch);
			}
		}
	}
  // else if(frustumCull == Cesium.Intersect.OUTSIDE) => do nothing.***
};

f4d_octree.prototype.getFrustumVisibleOctrees = function(cesium_cullingVolume, result_octreesArray, cesium_boundingSphere_scratch)
{
	if(this.subOctrees_array.length == 0 && this._compRefsList_Array.length == 0) // For use with ifc buildings.***
		return;
	
    // this function has Cesium dependence.***
    if(result_octreesArray == undefined)
	    result_octreesArray = [];
  
    if(cesium_boundingSphere_scratch == undefined)
	    cesium_boundingSphere_scratch = new Cesium.BoundingSphere(); // Cesium dependency.***
  
    cesium_boundingSphere_scratch.center.x = this.centerPos.x;
    cesium_boundingSphere_scratch.center.y = this.centerPos.y;
    cesium_boundingSphere_scratch.center.z = this.centerPos.z;
  
    if(this.subOctrees_array.length == 0)
    {
	    //cesium_boundingSphere_scratch.radius = this.getRadiusAprox()*0.7;
		cesium_boundingSphere_scratch.radius = this.getRadiusAprox();
    }
    else{
	    cesium_boundingSphere_scratch.radius = this.getRadiusAprox();
    }
  
    if(this.octree_level == 3)
    {
	    var hola = 0;
    }
  
    var frustumCull = cesium_cullingVolume.computeVisibility(cesium_boundingSphere_scratch);
	if(frustumCull == Cesium.Intersect.INSIDE ) 
	{
		//result_octreesArray.push(this);
		this.getAllSubOctrees(result_octreesArray);
	}
	else if(frustumCull == Cesium.Intersect.INTERSECTING  ) 
	{
		if(this.subOctrees_array.length == 0 && this.neoRefsList_Array.length > 0) // original, good.***
		{
			result_octreesArray.push(this);
		}
		else
		{
			for(var i=0; i<this.subOctrees_array.length; i++ )
			{
				this.subOctrees_array[i].getFrustumVisibleOctrees(cesium_cullingVolume, result_octreesArray, cesium_boundingSphere_scratch);
			}
		}
	}
  // else if(frustumCull == Cesium.Intersect.OUTSIDE) => do nothing.***
};
  
  
  f4d_octree.prototype.setSquareDistToEye = function(eye_x, eye_y, eye_z)
  {
	  this.squareDistToEye = (this.centerPos.x - eye_x)*(this.centerPos.x - eye_x) + 
							(this.centerPos.y - eye_y)*(this.centerPos.y - eye_y) + 
							(this.centerPos.z - eye_z)*(this.centerPos.z - eye_z) ;
  };
  
  f4d_octree.prototype.getIndexToInsert_bySquaredDistToEye = function(octreesArray, octree)
  {
	  // lineal implementation. In the future use dicotomic search technique.***
	  var finished = false;
	  var octrees_count = octreesArray.length;
	  var i=0;
	  var result_idx = 0;
	  
	  while(!finished && i<octrees_count)
	  {
		  if(octreesArray[i].squareDistToEye > octree.squareDistToEye)
		  {
			  result_idx = i;
			  finished = true;
		  }
		  i++;
	  }
	  if(!finished)
	  {
		  result_idx = octrees_count;
	  }
	  
	  return result_idx;
  };
  
  f4d_octree.prototype.putOctreeInEyeDistanceSortedArray = function(result_octreesArray, octree, eye_x, eye_y, eye_z)
  {
	  // sorting is from minDist to maxDist.***
	  // http://stackoverflow.com/questions/586182/how-to-insert-an-item-into-an-array-at-a-specific-index
				
		var insert_idx= this.getIndexToInsert_bySquaredDistToEye(result_octreesArray, octree);
		
		result_octreesArray.splice(insert_idx, 0, octree);
  };
  
  f4d_octree.prototype.getAllSubOctrees = function(result_octreesArray)
  {
	  if(result_octreesArray == undefined)
		  result_octreesArray = [];
	  
	  if(this.subOctrees_array.length > 0)
	  {
		  for(var i=0; i<this.subOctrees_array.length; i++)
		  {
			  this.subOctrees_array[i].getAllSubOctrees(result_octreesArray);
		  }
	  }
	  else
	  {
		  if(this._compRefsList_Array.length > 0)
			result_octreesArray.push(this); // there are only 1.***
			else if(this.neoRefsList_Array.length > 0)
				result_octreesArray.push(this); // there are only 1.***
	  }
  };
  
  // **************************************************************************************************************************** //
  // f4d_Header.***************************************************************************************************************** //
  var f4d_header = function()
  {
	this._f4d_version = 1;
	this._version = ""; // provisional for xdo.***
	this._type = -1;
	this._global_unique_id = "";
	
	this._latitude = 0.0;
	this._longitude = 0.0;
	this._elevation = 0.0;
	
	// Dont use this, if possible.***
	//this._yaw = 0.0; 
	//this._pitch = 0.0;
	//this._roll = 0.0;
	
	this._boundingBox = new f4d_boundingBox();
	this._octZerothBox = new f4d_boundingBox(); // Provisionally...
	this._dataFileName = "";
	this._nailImageSize = 0;
	
	// Depending the bbox size, determine the LOD.***
	//this.bbox.maxLegth = 0.0;
	this.isSmall = false;
  };
  
	
  // **************************************************************************************************************************** //
  // BuildingProject.************************************************************************************************************ //
  var f4d_BR_buildingProject = function()
  {
	  this._header = new f4d_header();
	  
	  // Block-Reference version of buildingProjects.***
	  this.move_matrix = new Float32Array(16); // PositionMatrix.***
	  this.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
	  this.buildingPosMat_inv = undefined;
	  this._buildingPosition = undefined;
	  this._buildingPositionHIGH = undefined;
	  this._buildingPositionLOW = undefined;
	  
	  // Blocks data.***************************************************************
	  this._blocksList_Container = new f4d_BlocksLists_Container();
	  this.create_DefaultBlockReferencesLists();
	  
	  // Compound references data.**************************************************
	  this.octree = undefined;
	  this._compRefList_Container = new f4d_CompoundReferencesList_Container(); // Exterior objects lists.***

	  // SimpleBuilding.***************
	  this._simpleBuilding = new f4d_simpleBuilding(); // ifc simple building.***
	  this._simpleBuilding_v1 = undefined;
	  
	  //this._boundingBox = undefined;
	  this.radius_aprox = undefined;
	
	// Test for stadistic. Delete this in the future.***
	this._total_triangles_count = 0;
	
	// Test for use workers.*****************************************************************
	this._VBO_ByteColorsCacheKeysContainer_List = [];
	// End test for use workers.-------------------------------------------------------------
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this._visibleCompRefLists_scratch = new f4d_CompoundReferencesList();
	this.point3d_scratch = new f4d_point3d();
	this.point3d_scratch_2 = new f4d_point3d();
	
	// Header, SimpleBuildingGeometry and nailImage path-strings.**********************************
	this._f4d_rawPathName = ""; // Use only this.***
	
	this._f4d_headerPathName = "";
	this._f4d_header_readed = false;
	this._f4d_header_readed_finished = false;
	
	this._f4d_simpleBuildingPathName = "";
	this._f4d_simpleBuilding_readed = false;
	this._f4d_simpleBuilding_readed_finished = false;
	
	this._f4d_nailImagePathName = "";
	this._f4d_nailImage_readed = false;
	this._f4d_nailImage_readed_finished = false;
	
	this._f4d_lod0ImagePathName = "";
	this._f4d_lod0Image_readed = false;
	this._f4d_lod0Image_readed_finished = false;
	this._f4d_lod0Image_exists = true;
	
	this._f4d_lod1ImagePathName = "";
	this._f4d_lod1Image_readed = false;
	this._f4d_lod1Image_readed_finished = false;
	this._f4d_lod1Image_exists = true;
	
	this._f4d_lod2ImagePathName = "";
	this._f4d_lod2Image_readed = false;
	this._f4d_lod2Image_readed_finished = false;
	this._f4d_lod2Image_exists = true;
	
	this._f4d_lod3ImagePathName = "";
	this._f4d_lod3Image_readed = false;
	this._f4d_lod3Image_readed_finished = false;
	this._f4d_lod3Image_exists = true;
	
	// for SPEEDTEST. Delete after test.***
	this._xdo_simpleBuildingPathName = "";
	this._xdo_simpleBuilding_readed = false;
	this._xdo_simpleBuilding_readed_finished = false;
	
  };
  
  f4d_BR_buildingProject.prototype.calculate_TotalTrianglesCount = function()
  {
	  // This is temp function for debugging.***
	  var compRefList = undefined;
	  var compRefs_count = 0;
	  var interior_compRefLists_count = _interiorCompRefList_Container._compRefsList_Array.length;
	  for(var i=0; i<interior_compRefLists_count; i++)
	  {
		  compRefList = _interiorCompRefList_Container._compRefsList_Array[i];
		  compRefs_count = compRefList._compoundRefsArray.length;
		  for(var j=0; j<compRefs_count; j++)
		  {
			  
		  }
	  }
	  
  };
  
f4d_BR_buildingProject.prototype.getTransformedRelativeEyePosition_toBuilding = function(absolute_eye_x, absolute_eye_y, absolute_eye_z)
{
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this._buildingPosition;
	var relative_eye_pos_x = absolute_eye_x - buildingPosition.x;
	var relative_eye_pos_y = absolute_eye_y - buildingPosition.y;
	var relative_eye_pos_z = absolute_eye_z - buildingPosition.z;
	
	if(this.buildingPosMat_inv == undefined)
	{
		this.buildingPosMat_inv = new f4d_Matrix4();
		this.buildingPosMat_inv.setByFloat32Array(this.move_matrix_inv);
	}

	this.point3d_scratch.set(relative_eye_pos_x, relative_eye_pos_y, relative_eye_pos_z);
	this.point3d_scratch_2 = this.buildingPosMat_inv.transformPoint3D(this.point3d_scratch, this.point3d_scratch_2);
  
	return this.point3d_scratch_2;
};
  
f4d_BR_buildingProject.prototype.isCameraInsideOfBuilding = function(eye_x, eye_y, eye_z)
{
	return this._header._boundingBox.isPoint3dInside(eye_x, eye_y, eye_z);
};
  
f4d_BR_buildingProject.prototype.update_currentVisibleIndices_exterior = function(eye_x, eye_y, eye_z)
{
	this._compRefList_Container.update_currentVisibleIndices_ofLists(eye_x, eye_y, eye_z);
};
  
  f4d_BR_buildingProject.prototype.getVisibleCompRefLists = function(eye_x, eye_y, eye_z)
  {
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  this._visibleCompRefLists_scratch = this._compRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z, this._visibleCompRefLists_scratch);
	  return this._visibleCompRefLists_scratch;
  };
  
  f4d_BR_buildingProject.prototype.getVisibleEXTCompRefLists = function(eye_x, eye_y, eye_z)
  {
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  // Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	  return this._compRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z);
  };
  
  
  f4d_BR_buildingProject.prototype.getAllCompRefLists = function()
  {
	  var allCompRefLists = this._compRefList_Container._compRefsList_Array.concat(this._interiorCompRefList_Container._compRefsList_Array);
	  return allCompRefLists;
  };
  
  f4d_BR_buildingProject.prototype.getRadiusAprox = function()
  {
	  if(this._boundingBox == undefined)
	  {
		  var compRefList = this._compRefList_Container.get_CompRefList_byName("Ref_Skin1");
		  if(compRefList)
		  {
			    this._boundingBox = new f4d_boundingBox();
			    this._boundingBox._minX = compRefList._ocCulling._ocCulling_box._minX;
				this._boundingBox._maxX = compRefList._ocCulling._ocCulling_box._maxX;
				this._boundingBox._minY = compRefList._ocCulling._ocCulling_box._minY;
				this._boundingBox._maxY = compRefList._ocCulling._ocCulling_box._maxY;
				this._boundingBox._minZ = compRefList._ocCulling._ocCulling_box._minZ;
				this._boundingBox._maxZ = compRefList._ocCulling._ocCulling_box._maxZ;
				
				this.radius_aprox = this._boundingBox.get_maxLength() / 2.0;
		  }
	  }
	  
	  return this.radius_aprox;
  };
  
  f4d_BR_buildingProject.prototype.getBoundingBox = function()
  {
	  /*
	  if(this._boundingBox == undefined)
	  {
		  var boundingBox = null;
		  
		  var compRefLists_count = this._compRefList_Container._compRefsList_Array.length;
		  for(var i=0; i<compRefLists_count; i++)
		  {
			  var compRefList = this._compRefList_Container._compRefsList_Array[i];
			  var blocksList = this._blocksList_Container._BlocksListsArray[i];
			  var bb = compRefList.getBoundingBox(blocksList);
			  if(this._boundingBox == undefined)
			  {
				  if(bb != null)
				  this._boundingBox = bb;// malament. s'ha de multiplicar per el matrix de transformacio.***
			  }
			  else
			  {
				  if(bb != null)
					  this._boundingBox.addBox(bb);
			  }
			  
		  }
	  }
	  */
	  
	  // Return the compReflList's occlussionCullingMotherBox.***
	  if(this._boundingBox == undefined)
	  {
		  var compRefList = this._compRefList_Container.get_CompRefList_byName("Ref_Skin1");
		  if(compRefList)
		  {
			    this._boundingBox = new f4d_boundingBox();
			    this._boundingBox._minX = compRefList._ocCulling._ocCulling_box._minX;
				this._boundingBox._maxX = compRefList._ocCulling._ocCulling_box._maxX;
				this._boundingBox._minY = compRefList._ocCulling._ocCulling_box._minY;
				this._boundingBox._maxY = compRefList._ocCulling._ocCulling_box._maxY;
				this._boundingBox._minZ = compRefList._ocCulling._ocCulling_box._minZ;
				this._boundingBox._maxZ = compRefList._ocCulling._ocCulling_box._maxZ;
				
				this.radius_aprox = this._boundingBox.get_maxLength() / 2.0;
		  }
	  }
	  
	  return this._boundingBox;
  };
  
  f4d_BR_buildingProject.prototype.create_DefaultBlockReferencesLists = function()
  {
	  // Create 5 BlocksLists: "Blocks1", "Blocks2", "Blocks3", Blocks4" and "BlocksBone".***
	  this._blocksList_Container.newBlocksList("Blocks1");
	  this._blocksList_Container.newBlocksList("Blocks2");
	  this._blocksList_Container.newBlocksList("Blocks3");
	  
	  this._blocksList_Container.newBlocksList("BlocksBone");
	  this._blocksList_Container.newBlocksList("Blocks4");
	  
  };
  
// ************************************************************************************************************************* //
// f4d geometry from point cloud.******************************************************************************************* //
var f4d_pCloudMesh = function()
{
	// this is a temporary class to render mesh from point cloud.***
	this.move_matrix = new Float32Array(16); // PositionMatrix.***
	this.move_matrix_inv = new Float32Array(16); // Inverse of PositionMatrix.***
	this.pCloudPosMat_inv = undefined;
	this._pCloudPosition = undefined;
	this._pCloudPositionHIGH = undefined;
	this._pCloudPositionLOW = undefined;
	//--------------------------------------------------------------------
	
	this._header = new f4d_header();
	this.vbo_datas = new VBO_VertexIdxCacheKeys_Container(); // temp.***
	
	
	this._f4d_rawPathName = "";
	
	this._f4d_headerPathName = "";
	this._f4d_header_readed = false;
	this._f4d_header_readed_finished = false;
	
	this._f4d_geometryPathName = "";
	this._f4d_geometry_readed = false;
	this._f4d_geometry_readed_finished = false;
	
};

// ************************************************************************************************************************* //
// BR Building ProjectsList.************************************************************************************************ //
var f4d_BR_buildingProjectsList = function()
{
  this._BR_buildingsArray = [];
  this._boundingBox = undefined;
  this._pCloudMesh_array = []; // 1rst aproximation to the pointCloud data. Test.***
  //this.detailed_building = undefined; // Test.***
  //this.compRefList_array = undefined; // Test.***
};

f4d_BR_buildingProjectsList.prototype.new_BR_Project = function()
{
//var titol = "holes a tothom"
  //var br_buildingProject = new f4d_BR_buildingProject({Titol : titol});
  var br_buildingProject = new f4d_BR_buildingProject();
  this._BR_buildingsArray.push(br_buildingProject);
  return br_buildingProject;
};
  
f4d_BR_buildingProjectsList.prototype.getBoundingBox = function()
{
  if(this._boundingBox == undefined)
  {
	  var buildingProjects_count = this._BR_buildingsArray.length;
	  for(var i=0; i<buildingProjects_count; i++)
	  {
		  var buildingProject = this._BR_buildingsArray[i];
		  var current_bb = buildingProject.getBoundingBox();
		  if(this._boundingBox == undefined)
		  {
			  if(current_bb != null)
			  this._boundingBox = current_bb;
		  }
		  else
		  {
			  if(current_bb != null)
				  this._boundingBox.addBox(current_bb);
		  }
	  }
	  
  }
  
  return this._boundingBox;
};
  
//**************************************************************************************************************************//
// TerranTile.**************************************************************************************************************//
var f4d_TerranTile = function()
{
	//           +-----+-----+
	//           |     |     |
	//           |  3  |  2  |
	//           |     |     |
	//           +-----+-----+
	//           |     |     |
	//           |  0  |  1  |
	//           |     |     |
	//           +-----+-----+
	
	this._depth = 0; // qudtree depth. 0 => mother_quadtree.***
	this._numberName = 1; // mother quadtree.***
	this._terranTile_owner = undefined;
	this._BR_buildingsArray = [];
	this._boundingBox = undefined; // dont use this.***
	this._pCloudMesh_array = []; // 1rst aproximation to the pointCloud data. Test.***
	
	this.position = undefined; // absolute position, for do frustum culling.***
	this.radius = undefined; // aprox radius for this tile.***

	this.leftDown_position = undefined;
	this.rightDown_position = undefined;
	this.rightUp_position = undefined;
	this.leftUp_position = undefined;
	this.visibilityType = undefined;
  
	//this.longitude_min = undefined; // delete this.***
	//this.longitude_max = undefined; // delete this.***
	//this.latitude_min = undefined; // delete this.***
	//this.latitude_max = undefined; // delete this.***
	
	this.subTiles_array = [];
	this.terranIndexFile_readed = false;
	this.empty_tile = false;
	
	// File.***************************************************
	this.fileReading_started = false;
	this.fileReading_finished = false;
	this.fileArrayBuffer = undefined;
	this.fileBytesReaded = 0;
	this.fileParsingFinished = false;
	this.projectsParsed_count = 0;
	
	this.current_BRProject_parsing = undefined;
	this.current_BRProject_parsing_state = 0;
	
	this.f4dReadWriter = undefined;
};

f4d_TerranTile.prototype.new_BR_Project = function()
{
  var br_buildingProject = new f4d_BR_buildingProject();
  this._BR_buildingsArray.push(br_buildingProject);
  return br_buildingProject;
};

f4d_TerranTile.prototype.new_subTerranTile = function()
{
	var subTiles_count = this.subTiles_array.length;
	var subTile = new f4d_TerranTile();
	subTile._depth = this._depth + 1;
	subTile._numberName = this._numberName*10 + subTiles_count + 1;
	this.subTiles_array.push(subTile);
	return subTile;
};

f4d_TerranTile.prototype.make_4subTiles = function()
{
	for(var i=0; i<4; i++)
	{
		var subTile = this.new_subTerranTile();
	}
};

f4d_TerranTile.prototype.set_dimensions = function(lon_min, lon_max, lat_min, lat_max)
{
	// Old.***
	this.longitude_min = lon_min;
	this.longitude_max = lon_max;
	this.latitude_min = lat_min;
	this.latitude_max = lat_max;
};

f4d_TerranTile.prototype.make_tree = function(max_depth)
{
	if(this._depth < max_depth)
	{
		var subTile_aux = undefined;
		for(var i=0; i<4; i++)
		{
			subTile_aux = this.new_subTerranTile();
			subTile_aux.make_tree(max_depth);
		}
	}

};

f4d_TerranTile.prototype.calculate_position_byLonLat = function()
{
	var lon_mid = (this.longitude_max + this.longitude_min)/2.0;
	var lat_mid = (this.latitude_max + this.latitude_min)/2.0;
	
	this.position = Cesium.Cartesian3.fromDegrees(lon_mid, lat_mid, 0.0); 
	
	this.leftDown_position = Cesium.Cartesian3.fromDegrees(this.longitude_min, this.latitude_min, 0.0); 
	this.rightDown_position = Cesium.Cartesian3.fromDegrees(this.longitude_max, this.latitude_min, 0.0); 
	this.rightUp_position = Cesium.Cartesian3.fromDegrees(this.longitude_max, this.latitude_max, 0.0); 
	this.leftUp_position = Cesium.Cartesian3.fromDegrees(this.longitude_min, this.latitude_max, 0.0); 
	
	this.radius = Cesium.Cartesian3.distance(this.leftDown_position, this.rightUp_position)/2.0 * 0.9;
};

f4d_TerranTile.prototype.calculate_position_byLonLat_subTiles = function()
{
	this.calculate_position_byLonLat();
	
	var subTile = undefined;
	var subTiles_count = this.subTiles_array.length; // subTiles_count must be 4.***

	for(var i=0; i<subTiles_count; i++)
	{
		this.subTiles_array[i].calculate_position_byLonLat_subTiles();
	}

};

f4d_TerranTile.prototype.parseFile_header = function(BR_Project)
{
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
		return;
	
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch = undefined;
	var header = BR_Project._header;
	var arrayBuffer = this.fileArrayBuffer;
	var bytes_readed = this.fileBytesReaded;
	
	if(this.f4dReadWriter == undefined)
		this.f4dReadWriter = new f4d_ReaderWriter();
	
	// 1) Version(5 chars).***********
	for(var j=0; j<version_string_length; j++){
		header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	header._f4d_version = 2;
	
	// 3) Global unique ID.*********************
	intAux_scratch = this.f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		header._global_unique_id += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Location.*************************
	header._longitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	header._latitude = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0]; bytes_readed += 8;
	header._elevation = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	
	//header._elevation += 70.0; // delete this. TEST.!!!
	
	// 6) BoundingBox.************************
	header._boundingBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
	var semiHeight = (header._boundingBox._maxZ - header._boundingBox._minZ )/2.0;
	header._elevation = 45.0 + semiHeight-0.5;
	
	var isLarge = false;
	if(header._boundingBox._maxX - header._boundingBox._minX > 40.0 || header._boundingBox._maxY - header._boundingBox._minY > 40.0)
	{
		isLarge = true;
	}
	
	if(!isLarge && header._boundingBox._maxZ - header._boundingBox._minZ < 30.0)
	{
		header.isSmall = true;
	}
	
	var imageLODs_count = this.f4dReadWriter.readUInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
	
	// Now, must calculate some params of the project.**********************************************
	// 0) PositionMatrix.************************************************************************
	// Determine the elevation of the position.***********************************************************
	var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation);
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
    var height = cartographic.height;
	// End Determine the elevation of the position.-------------------------------------------------------
	
	//var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation);  // Original.***
	position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, height); 
	
	BR_Project._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	BR_Project._buildingPositionHIGH = new Float32Array(3);
	BR_Project._buildingPositionHIGH[0] = splitVelue_X.high;
	BR_Project._buildingPositionHIGH[1] = splitVelue_Y.high;
	BR_Project._buildingPositionHIGH[2] = splitVelue_Z.high;
	
	BR_Project._buildingPositionLOW = new Float32Array(3);
	BR_Project._buildingPositionLOW[0] = splitVelue_X.low;
	BR_Project._buildingPositionLOW[1] = splitVelue_Y.low;
	BR_Project._buildingPositionLOW[2] = splitVelue_Z.low;
	
	this.fileBytesReaded = bytes_readed;
};


f4d_TerranTile.prototype.parseFile_simpleBuilding = function(BR_Project)
{
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
		return;
	
	if(this.f4dReadWriter == undefined)
		this.f4dReadWriter = new f4d_ReaderWriter();
	
	var bytes_readed = this.fileBytesReaded;
	var startBuff = undefined;
	var endBuff = undefined;
	var arrayBuffer = this.fileArrayBuffer;
	
	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	var vbo_objects_count = this.f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; // Almost allways is 1.***
	
	// single interleaved buffer mode.*********************************************************************************
	for(var i=0; i<vbo_objects_count; i++) // Almost allways is 1.***
	{
		var simpObj = simpBuildingV1.new_simpleObject();
		var vt_cacheKey = simpObj._vtCacheKeys_container.new_VertexTexcoordsArraysCacheKey();
		
		var iDatas_count = this.f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		startBuff = bytes_readed;
		endBuff = bytes_readed + (4*3+2*2+1*4)*iDatas_count; // fPos_usTex_bNor.****
		vt_cacheKey.verticesArrayBuffer = arrayBuffer.slice(startBuff, endBuff);
		
		bytes_readed = bytes_readed + (4*3+2*2+1*4)*iDatas_count; // updating data.***
		
		vt_cacheKey._vertices_count = iDatas_count;
		
	}
	
	// Finally read the 4byte color.***
	var color_4byte_temp = this.f4dReadWriter.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	//var b = color_4byte_temp & 0xFF;
    //var g = (color_4byte_temp & 0xFF00) >>> 8;
    //var r = (color_4byte_temp & 0xFF0000) >>> 16;
    //var a = ( (color_4byte_temp & 0xFF000000) >>> 24 ) / 255 ;
	
	this.fileBytesReaded = bytes_readed;
};


f4d_TerranTile.prototype.parseFile_nailImage = function(BR_Project, f4dManager)
{
	
	//BR_Project._f4d_nailImage_readed = true;

	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
	if(this.f4dReadWriter == undefined)
		this.f4dReadWriter = new f4d_ReaderWriter();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	
	// Read the image.**********************************************************************************
	var bytes_readed = this.fileBytesReaded;
	var arrayBuffer = this.fileArrayBuffer;
	
	var nailImageSize = this.f4dReadWriter.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	var startBuff = bytes_readed;
	var endBuff = bytes_readed + nailImageSize;
	simpBuildingV1.textureArrayBuffer = new Uint8Array(arrayBuffer.slice(startBuff, endBuff));
	
	bytes_readed += nailImageSize;

	this.fileBytesReaded = bytes_readed;
};

f4d_TerranTile.prototype.parseFile_allBuildings = function(f4dManager)
{
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
	{
		this.fileParsingFinished = true;
		return;
	}
	
	
	if(this.f4dReadWriter == undefined)
		this.f4dReadWriter = new f4d_ReaderWriter();
	
	var arrayBuffer = this.fileArrayBuffer;
	var projects_count = this.f4dReadWriter.readInt32(arrayBuffer, 0, 4); this.fileBytesReaded += 4;
	
	if(projects_count == 0)
		this.empty_tile = true;

	for(var i=0; i<projects_count; i++)
	{
		/*
		// 1rst, read the relative rawFile_path.***
		var rawFileNamePath_length = this.f4dReadWriter.readInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;// only debug test.***
		var rawFileNamePath = "";
		
		for(var j=0; j<rawFileNamePath_length; j++){
			rawFileNamePath += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
		}
		*/
		var bytes_readed = this.fileBytesReaded;
		this.fileBytesReaded = bytes_readed;
		
		this.current_BRProject_parsing = this.new_BR_Project();
		//this.current_BRProject_parsing._f4d_rawPathName = rawFileNamePath;
		
		this.parseFile_header(this.current_BRProject_parsing);
		this.parseFile_simpleBuilding(this.current_BRProject_parsing);
		this.parseFile_nailImage(this.current_BRProject_parsing, f4dManager);
	}
	this.fileParsingFinished = true;
	this.fileArrayBuffer = null;
};

f4d_TerranTile.prototype.parseFile_oneBuilding = function(GL, f4dManager)
{
	var fileLegth = this.fileArrayBuffer.byteLength;
	if(this.fileBytesReaded >= fileLegth)
	{
		this.fileParsingFinished = true;
		return;
	}
	
	
	if(this.f4dReadWriter == undefined)
		this.f4dReadWriter = new f4d_ReaderWriter();
	
	var projects_count = this.f4dReadWriter.readInt32(this.fileArrayBuffer, 0, 4); // only debug test.***
	
	
	if(this.projectsParsed_count >= projects_count)
	{
		this.fileParsingFinished = true;
		this.fileBytesReaded = null;
		return;
	}
	
	if(this.current_BRProject_parsing_state == 0)
	{
		if(this.projectsParsed_count == 0)
			this.fileBytesReaded = 4;
		
		this.current_BRProject_parsing = this.new_BR_Project();
	}
	
	var BR_Project = this.current_BRProject_parsing;

	// Read header, simpleBuilding, and the nailImage.***
	if(this.current_BRProject_parsing_state == 0)
	{
		this.parseFile_header(BR_Project);
		this.current_BRProject_parsing_state=1;
	}
	else if(this.current_BRProject_parsing_state == 1)
	{
		if(f4dManager.backGround_imageReadings_count < 1)
		{
			this.parseFile_simpleBuilding_old(GL, BR_Project);
			this.current_BRProject_parsing_state=2;
		}
	}
	else if(this.current_BRProject_parsing_state == 2)
	{
		if(f4dManager.backGround_imageReadings_count < 1)
		{
			this.parseFile_nailImage_old(GL, BR_Project, f4dManager);
			this.current_BRProject_parsing_state=0;
			this.projectsParsed_count++;
			f4dManager.backGround_imageReadings_count ++;
		}
	}
};


f4d_TerranTile.prototype.set_dimensionsSubTiles = function()
{
	var subTile = undefined;
	var subTiles_count = this.subTiles_array.length; // subTiles_count must be 4.***
	if(subTiles_count == 4)
	{
		var lon_mid = (this.longitude_max + this.longitude_min)/2.0;
		var lat_mid = (this.latitude_max + this.latitude_min)/2.0;
		
		subTile = this.subTiles_array[0];
		subTile.set_dimensions(this.longitude_min, lon_mid, this.latitude_min, lat_mid);
		
		subTile = this.subTiles_array[1];
		subTile.set_dimensions(lon_mid, this.longitude_max, this.latitude_min, lat_mid);
		
		subTile = this.subTiles_array[2];
		subTile.set_dimensions(lon_mid, this.longitude_max, lat_mid, this.latitude_max);
		
		subTile = this.subTiles_array[3];
		subTile.set_dimensions(this.longitude_min, lon_mid, lat_mid, this.latitude_max);
		
		for(var i=0; i<subTiles_count; i++)
		{
			this.subTiles_array[i].set_dimensionsSubTiles();
		}
	}
};

f4d_TerranTile.prototype.get_smallestTiles = function(smallestTiles_array)
{
	// this returns smallestTiles, if the smallestTile has buildingd inside.***
	if(this.subTiles_array.length > 0)
	{
		for(var i=0; i<this.subTiles_array.length; i++)
		{
			this.subTiles_array[i].visibilityType = this.visibilityType;
			this.subTiles_array[i].get_smallestTiles(smallestTiles_array);
		}
	}
	else{
		if(!this.empty_tile.length)
			smallestTiles_array.push(this);
	}
};

f4d_TerranTile.prototype.get_intersectedSmallestTiles = function(frustumVolume, intersectedSmallestTiles_array, boundingSphere_Aux)
{
	var intersectedTiles_array = [];
	this.get_intersectedTiles(frustumVolume, intersectedTiles_array, boundingSphere_Aux);
	
	var intersectedTiles_count = intersectedTiles_array.length;
	for(var i=0; i<intersectedTiles_count; i++)
	{
		intersectedTiles_array[i].get_smallestTiles(intersectedSmallestTiles_array);
	}
	intersectedTiles_array.length = 0;
};

f4d_TerranTile.prototype.get_intersectedTiles = function(frustumVolume, intersectedTiles_array, boundingSphere_Aux)
{
	// Cesium dependency.***
	if(boundingSphere_Aux == undefined)
		boundingSphere_Aux = new Cesium.BoundingSphere();
	
	var intersectedPoints_count = 0;
	boundingSphere_Aux.radius = this.radius;
	boundingSphere_Aux.center.x = this.position.x;
	boundingSphere_Aux.center.y = this.position.y;
	boundingSphere_Aux.center.z = this.position.z;
	this.visibilityType = frustumVolume.computeVisibility(boundingSphere_Aux);
	/*
	boundingSphere_Aux.center = this.leftDown_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;
	
	boundingSphere_Aux.center = this.rightDown_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;
	
	boundingSphere_Aux.center = this.rightUp_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;
	
	boundingSphere_Aux.center = this.leftUp_position;
	if(frustumVolume.computeVisibility(boundingSphere_Aux) != Cesium.Intersect.OUTSIDE)
		intersectedPoints_count++;
	*/
	
	if(this.visibilityType == Cesium.Intersect.OUTSIDE)
	{
		// OUTSIDE.***
		// do nothing.***
	}
	else if(this.visibilityType == Cesium.Intersect.INSIDE)
	{
		// INSIDE.***
		intersectedTiles_array.push(this);
	}
	else{
		// INTERSECTED.***
		if(this.subTiles_array.length > 0)
		{
			for(var i=0; i<this.subTiles_array.length; i++)
			{
				this.subTiles_array[i].get_intersectedTiles(frustumVolume, intersectedTiles_array);
			}
		}
		else{
			intersectedTiles_array.push(this);
		}
	}
	
};
  


  

