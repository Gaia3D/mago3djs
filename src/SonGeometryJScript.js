// Color.************************************************************************************* //
  var f4d_color = function()
  {
	  this.r = 1.0;
	  this.g = 1.0;
	  this.b = 1.0;
	  this.a = 1.0;
	  
  };
  
  f4d_color.prototype.set = function(_r, _g, _b, _a)
  {
  	this.r = _r; this.g = _g; this.b = _b; this.a = _a;
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
  var f4d_point3d = function()
  {
	  this.x = 0.0;
	  this.y = 0.0;
	  this.z = 0.0;
  	
	  this._idx_in_list = undefined;
  };
  
  f4d_point3d.prototype.destroy = function()
  {
	  this.x = null;
	  this.y = null;
	  this.z = null;
  	
	  this._idx_in_list = null;
  };
  
  f4d_point3d.prototype.squareDistTo = function(px, py, pz)
  {
	  var dx = this.x - px;
	  var dy = this.y - py;
	  var dz = this.z - pz;
	  
	  return dx*dx + dy*dy + dz*dz;
  };

  f4d_point3d.prototype.set = function(_x, _y, _z)
  {
  	this.x = _x; this.y = _y; this.z = _z;
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

f4d_boundingBox.prototype.get_zLength = function()
{
  var dim_z = this._maxZ - this._minZ;
  
  return dim_z;
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
	var f4d_FittedBox = function()
	{

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
		var idx = this.getIndexOfArray(col, row);
		return this._floatArrays[idx];
	};
	
	f4d_Matrix4.prototype.transformPoint3D = function(point3d)
	{
		var transformedPoint3d = new f4d_point3d();
//		t.x= q.x*m[0][0] + q.y*m[1][0] + q.z*m[2][0] + m[3][0];
//		t.y= q.x*m[0][1] + q.y*m[1][1] + q.z*m[2][1] + m[3][1];
//		t.z= q.x*m[0][2] + q.y*m[1][2] + q.z*m[2][2] + m[3][2];
		
		transformedPoint3d.x = point3d.x*this.get(0,0) + point3d.y*this.get(1,0) + point3d.z*this.get(2,0) + this.get(3,0);
		transformedPoint3d.y = point3d.x*this.get(0,1) + point3d.y*this.get(1,1) + point3d.z*this.get(2,1) + this.get(3,1);
		transformedPoint3d.z = point3d.x*this.get(0,2) + point3d.y*this.get(1,2) + point3d.z*this.get(2,2) + this.get(3,2);
		
		return transformedPoint3d;
	};
	
	f4d_Matrix4.prototype.getMultipliedByMatrix = function(matrix)
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
		
		var resultMat = new f4d_Matrix4();
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
	
	// F4D_OcclusionCullingOctree.****************************************************************************************************************** //
	var f4d_OcclusionCullingOctree = function()
	{
		this._ocCulling_box = new f4d_OcclusionCullingOctree_Cell(null);
		this._infinite_ocCulling_box = new f4d_OcclusionCullingOctree_Cell(null);
		
	};
	

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
		this._VBO_ByteColorsCacheKeys_Container_idx = -1; // Test.***
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
	/*
	
	f4d_Reference.prototype.make_ColorVBO_V4_0 = function(GL)
	{
		// make the VBO cacheKeys.***
		// Float version.***
		
		//var meshArraysCount = this._byteColorsVBO_ArraysContainer._meshArrays.length;
		//for(var i=0; i<meshArraysCount; i++)
		//{
		//	var mesh_array = this._byteColorsVBO_ArraysContainer._meshArrays[i];
//
		//	mesh_array.MESH_COLORS_cacheKey = GL.createBuffer ();
		//	GL.bindBuffer(GL.ARRAY_BUFFER, mesh_array.MESH_COLORS_cacheKey);
		//	GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(mesh_array.mesh_colors), GL.STATIC_DRAW);
		//}
		

		// byte version.***
		var meshArraysCount = this._byteColorsVBO_ArraysContainer._meshArrays.length;
		for(var i=0; i<meshArraysCount; i++)
		{
			var mesh_array = this._byteColorsVBO_ArraysContainer._meshArrays[i];

			mesh_array.MESH_COLORS_cacheKey = GL.createBuffer ();
			GL.bindBuffer(GL.ARRAY_BUFFER, mesh_array.MESH_COLORS_cacheKey);
			GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(mesh_array.mesh_colors), GL.STATIC_DRAW);
			//---------------------------------------------------------------------------------------------
			
			// Now, free memory.***
			this._byteColorsVBO_ArraysContainer._meshArrays[i].mesh_colors = null;
		}
	};
	*/
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
  

  // ByteColors VBO.*********************************************************************************************************** //
  var ByteColorsVBO_Arrays = function()
  {
	  this.MESH_COLORS_cacheKey= null;
  };
  
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
  /*
  // VBO VertexIdxCacheKeys.*************************************************************************************************** //
  var VBO_VertexIdxCacheKey = function()
  {
	  this.indices_count = -1;
	  
	  this.MESH_VERTEX_cacheKey= null;
	  this.MESH_FACES_cacheKey= null;
  };
  
  // VBO VertexIdxCacheKeysContainer.****************************************************************************************** //
  var VBO_VertexIdxCacheKeys_Container = function()
  {
	  this._vbo_cacheKeysArray = [];
  }; 
  
  VBO_VertexIdxCacheKeys_Container.prototype.new_VBO_VertexIdxCacheKey = function()
  {
	  var vbo_VIcacheKey = new VBO_VertexIdxCacheKey();
	  this._vbo_cacheKeysArray.push(vbo_VIcacheKey);
	  return vbo_VIcacheKey;
	  
  };
  
  // VBO ByteColorCacheKey.**************************************************************************************************** //
  VBO_ByteColorCacheKey = function()
  {
	  this.MESH_COLORS_cacheKey= null;
  };
  
  // VBO_ByteColorCacheKeys_Container ***************************************************************************************** //
  var VBO_ByteColorCacheKeys_Container = function()
  {
	  this._vbo_byteColors_cacheKeysArray = [];
  };

  VBO_ByteColorCacheKeys_Container.prototype.new_VBO_ByteColorsCacheKey = function()
  {
	  var vbo_byteCol_cacheKey = new VBO_ByteColorCacheKey();
	  this._vbo_byteColors_cacheKeysArray.push(vbo_byteCol_cacheKey);
	  return vbo_byteCol_cacheKey;
  };
  */
  // F4D Block.**************************************************************************************************************** //
  var f4d_Block = function()
  {
	  // This has "VertexIdxVBO_ArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.***
	  this._vbo_VertexIdx_CacheKeys_Container = new VBO_VertexIdxCacheKeys_Container(); // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".***
	  this.mIFCEntityType = -1;
	  
	  // Stadistic vars. This is provisional, for debug.*****************
	  this._triangles_count = 0;
  };
  
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
  
  // F4D_VertexTexcoordsArrayLists_Container.*********************************************************************************** //
  /*
  var f4d_VertexTexcoordsArrays_Container = function()
  {
	  this.vertexTexcoordsLists_array = [];
  };
  
  f4d_VertexTexcoordsArrays_Container.prototype.new_VertexTexcoordsArray = function()
  {
	  var vt_array = new f4d_VertexTexcoords_Arrays();
	  this.vertexTexcoordsLists_array.push(vt_array);
	  return vt_array;
  };
  */
  
  // F4D_VertexTexcoordsArrays_cacheKey.**************************************************************************************** //
  var f4d_VertexTexcoordsArrays_cacheKeys = function()
  {
	  this._verticesArray_cacheKey = null;
	  this._texcoordsArray_cacheKey = null;
	  this._vertices_count = 0;
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

	// For webworldwind frustum culling.********************************
	// We create segments that covers the tile.***
	this.segments_array = [];
	var segments_count = 16;
	for(var i=0; i<segments_count; i++)
	{
		var f4dSegment = new F4d_Segment(); 
		this.segments_array.push(f4dSegment);
	}
	//------------------------------------------------------------------
	
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
	
	// Set the frustum culling segments.************************************************
	// www dependency.***
	var tercio_dx = (Max_X - Min_X)/3.0; 
	var tercio_dy = (Max_Y - Min_Y)/3.0; 
	var tercio_dz = (Max_Z - Min_Z)/3.0; 
	
	// 4 smalls bottom.***
	this.segments_array[0].set_points(Min_X, Min_Y, Min_Z,   Min_X+tercio_dx, Min_Y, Min_Z);
	this.segments_array[1].set_points(Max_X, Min_Y, Min_Z,   Max_X, Min_Y+tercio_dy, Min_Z);
	this.segments_array[2].set_points(Max_X, Max_Y, Min_Z,   Max_X-tercio_dx, Max_Y, Min_Z);
	this.segments_array[3].set_points(Min_X, Max_Y, Min_Z,   Min_X, Max_Y-tercio_dy, Min_Z);
	
	// 4 smalls top.***
	this.segments_array[4].set_points(Min_X, Min_Y, Max_Z,   Min_X+tercio_dx, Min_Y, Max_Z);
	this.segments_array[5].set_points(Max_X, Min_Y, Max_Z,   Max_X, Min_Y+tercio_dy, Max_Z);
	this.segments_array[6].set_points(Max_X, Max_Y, Max_Z,   Max_X-tercio_dx, Max_Y, Max_Z);
	this.segments_array[7].set_points(Min_X, Max_Y, Max_Z,   Min_X, Max_Y-tercio_dy, Max_Z);
	
	// 4 diagonals.***
	this.segments_array[8].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Max_X, Min_Y, Min_Z);
	this.segments_array[9].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Min_X, Max_Y, Min_Z);
	this.segments_array[10].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Min_X, Min_Y, Max_Z);
	this.segments_array[11].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Max_X, Max_Y, Max_Z);
	
	// 4 another diagonals.***
	this.segments_array[12].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Min_X, Min_Y, Min_Z);
	this.segments_array[13].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Max_X, Max_Y, Min_Z);
	this.segments_array[14].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Max_X, Min_Y, Max_Z);
	this.segments_array[15].set_points(this.centerPos.x, this.centerPos.y, this.centerPos.z,   Min_X, Max_Y, Max_Z);
	
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
  
  f4d_octree.prototype.getFrustumVisibleCRefListArray = function(www_cullingVolume, result_CRefListsArray, cesium_boundingSphere_scratch, eye_x, eye_y, eye_z)
  {
	  var visibleOctreesArray = [];
	  var excludedOctArray = [];
	  var sortedOctreesArray = [];
	  var distAux = 0.0;
	  
	  //this.getAllSubOctrees(visibleOctreesArray); // Test.***
	  this.getFrustumVisibleOctrees(www_cullingVolume, visibleOctreesArray, cesium_boundingSphere_scratch);
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

  f4d_octree.prototype.getFrustumVisibleOctrees = function(www_cullingVolume, result_octreesArray, cesium_boundingSphere_scratch)
  {
	  // this function has Cesium dependence.***
	  if(result_octreesArray == undefined)
		  result_octreesArray = [];
	  /*
	  if(cesium_boundingSphere_scratch == undefined)
		  cesium_boundingSphere_scratch = new Cesium.BoundingSphere(); // Cesium dependency.***
	  
	  cesium_boundingSphere_scratch.center.x = this.centerPos.x;
	  cesium_boundingSphere_scratch.center.y = this.centerPos.y;
	  cesium_boundingSphere_scratch.center.z = this.centerPos.z;
	  if(this.subOctrees_array.length == 0)
	  {
		cesium_boundingSphere_scratch.radius = this.getRadiusAprox()*0.7;
	  }
	  else{
		  cesium_boundingSphere_scratch.radius = this.getRadiusAprox();
	  }
	  */
	  // Now, check if this tile intersects with frustum.***
	var intersects = false;
	var finished = false;
	var intersection_type = 0; // 0 = outside. 1 = inside. 2 = intersected. ***
	var segments_intersected = 0;
	var segments_noIntersected = 0;
	var i=0;
	var segments_count = this.segments_array.length; // length = 12 or 16.***
	while(!finished && i<segments_count)
	{
		if(www_cullingVolume.intersectsSegment(this.segments_array[i].point_1, this.segments_array[i].point_2))
		{
			segments_intersected++;
			if(segments_noIntersected > 0)
			{
				finished = true;
				intersection_type = 2; // Intersected.***
			}
		}
		else
		{
			segments_noIntersected++;
			if(segments_intersected > 0)
			{
				finished = true;
				intersection_type = 2; // Intersected.***
			}
		}
		i++;
	}
	
	if(segments_intersected == segments_count)
		intersection_type = 1; // Inside.***
	
	  
		if(intersection_type == 1 ) 
		{
			//result_octreesArray.push(this);
			this.getAllSubOctrees(result_octreesArray);
		}
		else if(intersection_type == 2  ) 
		{
			if(this.subOctrees_array.length == 0 && this._compRefsList_Array.length > 0)
			{
				result_octreesArray.push(this);
			}
			else
			{
				for(var i=0; i<this.subOctrees_array.length; i++ )
				{
					this.subOctrees_array[i].getFrustumVisibleOctrees(www_cullingVolume, result_octreesArray, cesium_boundingSphere_scratch);
				}
			}
		}
	  // else if(intersection_type == Cesium.Intersect.OUTSIDE) => do nothing.***
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
	  }
  };
  
  
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
	this.textureArrayBuffer_lod0 = undefined; // This is a test.***
  
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
	  
	  this.f4d_shadersManager = undefined; // Only for www.***
	  
	// For webworldwind frustum culling.********************************
	// We create 1 segment that covers the tile.***
	this.segments_array = [];
	var segments_count = 1;
	for(var i=0; i<segments_count; i++)
	{
		var f4dSegment = new F4d_Segment(); 
		this.segments_array.push(f4dSegment);
	}
	//------------------------------------------------------------------
	
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
  
f4d_BR_buildingProject.prototype.render = function(dc)
{
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
    // Function for WebWorldWind.*********************************************************************************************************
	// Function for WebWorldWind.*********************************************************************************************************
    // Note: In WebWorldWind, a "f4d_BR_buildingProject" is a "Layer".***
    //this._compRefList_Container;
    //this._interiorCompRefList_Container; 
    //orderedRenderable.layer = dc.currentLayer;
    dc.addOrderedRenderable(this, 1000.0); // No, make a global f4d renderable layer and use it.***
    
    //this.render_F4D_compRefListWWW(dc, this._compRefList_Container._compRefsList_Array, this, this.f4d_shadersManager);
};

f4d_BR_buildingProject.prototype.renderOrdered = function(dc)
{
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
    // Function for WebWorldWind.*********************************************************************************************************
	// Function for WebWorldWind.*********************************************************************************************************
    
    this.render_F4D_compRefListWWW(dc, this._compRefList_Container._compRefsList_Array, this, this.f4d_shadersManager);
	
	// Test .*****************************************
	//var GL = dc.currentGlContext;
	//dc.findAndBindProgram(dc.currentProgram);
	//dc.bindProgram(dc.currentProgram);
    //GL.enableVertexAttribArray(dc.currentProgram.vertexPointLocation);
};
  
f4d_BR_buildingProject.prototype.render_F4D_compRefListWWW = function(dc, compRefList_array, BR_Project, f4d_shadersManager)
{
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// OBSOLETE.!!!!!!!!!!!!! Delete this method.**********************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	// Function for WebWorldWind.*********************************************************************************************************
	// Function for WebWorldWind.*********************************************************************************************************
	var compRefLists_count = compRefList_array.length;
	if(compRefLists_count == 0)return;

	var GL = dc.currentGlContext;

	//var program = dc.currentProgram;
	//GL.disableVertexAttribArray(program.vertexTexCoordLocation);
	
	// Test using f4d_shaderManager.************************
	var standardShader = f4d_shadersManager.get_f4dShader(3); // 3 = stanrdShader_for_WWW.***
	var shaderProgram = standardShader.SHADER_PROGRAM;
	GL.useProgram(shaderProgram);
	//dc.bindProgram(shaderProgram);
	GL.enableVertexAttribArray(standardShader._color);
	GL.enableVertexAttribArray(standardShader._position);
	//GL.disableVertexAttribArray(standardShader._texcoord);
	//------------------------------------------------------

	GL.enable(GL.DEPTH_TEST);
	GL.depthFunc(GL.LEQUAL); 
	GL.depthRange(0, 1);
	
	//GL.disable(GL.DEPTH_TEST); // Tes. delete this.***
	
		  
	  //if(defined(context._us._modelView))
	  {
			/*
			// http://www.informit.com/articles/article.aspx?p=2111395&seqNum=3
			// Create a rotation matrix
			44    var radian = Math.PI * ANGLE / 180.0; // Convert to radians
			45    var cosB = Math.cos(radian), sinB = Math.sin(radian);
			46
			47     // Note: WebGL is column major order
			48    var xformMatrix = new Float32Array([
			49       cosB, sinB, 0.0, 0.0,
			50       -sinB, cosB, 0.0, 0.0,
			51       0.0, 0.0, 1.0, 0.0,
			52       0.0, 0.0, 0.0, 1.0
			53    ]);
			*/

		  
		  // Matrix.prototype.multiplyByLocalCoordinateTransform = function (origin, globe) // Use this !!!!!!!!!!!!!!!!!!!!
		  
		  /*
		  // code from abstractShape.js.***
		  this.scratchMatrix.copy(dc.navigatorState.modelviewProjection);
            this.scratchMatrix.multiplyMatrix(this.currentData.transformationMatrix);
            dc.currentProgram.loadModelviewProjection(dc.currentGlContext, this.scratchMatrix);
			*/

		  var eyePosition = dc.eyePosition;
		  var heading = dc.navigatorState.heading;
		  var tilt = dc.navigatorState.tilt;
		  var roll = 0.0;
		  var globe = dc.globe;
		  
		  this.scratchMatrix = WorldWind.Matrix.fromIdentity();
		  this.scratchMatrix.copy(dc.navigatorState.modelviewProjection); // Original.***
		  
		  // Calculate modelViewProjectionRelToEye.************************************************
		  var modelViewRelToEye = WorldWind.Matrix.fromIdentity();
		  modelViewRelToEye.copy(dc.navigatorState.modelview);
		  modelViewRelToEye[3] = 0.0;
		  modelViewRelToEye[7] = 0.0;
		  modelViewRelToEye[11] = 0.0;
		  
		  var projection = WorldWind.Matrix.fromIdentity();
		  projection.copy(dc.navigatorState.projection);
		  
		  var modelViewProjectionRelToEye = WorldWind.Matrix.fromIdentity();
		  modelViewProjectionRelToEye.copy(projection);
		  modelViewProjectionRelToEye.multiplyMatrix(modelViewRelToEye);
		  
		  // End Calculate modelViewProjectionRelToEye.--------------------------------------------

		  var columnMajorArrayAux = WorldWind.Matrix.fromIdentity();
		  var columnMajorArray = modelViewProjectionRelToEye.columnMajorComponents(columnMajorArrayAux); // Original.***
		  
		  var move_matrix_aux = new Float32Array(16); 
		  for(var i=0; i<16; i++)
		  {
			move_matrix_aux[i] = columnMajorArray[i]; 
		  }
		  // model view projection matrix relative to eye.***********************************************
		  // model view projection matrix relative to eye.***********************************************
		  // model view projection matrix relative to eye.***********************************************
		  
		  //http://gamedev.stackexchange.com/questions/57968/rendering-artifacts-at-a-large-scale
		  
		  // End model view projection matrix relative to eye.-------------------------------------------
		  
		  GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrix, GL.FALSE, move_matrix_aux);  // dont use this.***.***
		  GL.uniform3fv(standardShader._BuildingPosHIGH, BR_Project._buildingPositionHIGH);
		  GL.uniform3fv(standardShader._BuildingPosLOW, BR_Project._buildingPositionLOW);
		  
		  // Now, calculate the high and low value of the camera position.***
			f4dGeoModifier = new f4d_geometryModifier();
			var eyePoint = dc.navigatorState.eyePoint;
			var eyePosHIGH = new Float32Array(3);
			var eyePosLOW = new Float32Array(3);
			
			var eyePosSplit_x = new f4d_splitValue();
			eyePosSplit_x = f4dGeoModifier.Calculate_splitValues(eyePoint[0], eyePosSplit_x);
			var eyePosSplit_y = new f4d_splitValue();
			eyePosSplit_y = f4dGeoModifier.Calculate_splitValues(eyePoint[1], eyePosSplit_y);
			var eyePosSplit_z = new f4d_splitValue();
			eyePosSplit_z = f4dGeoModifier.Calculate_splitValues(eyePoint[2], eyePosSplit_z);
			
			eyePosHIGH[0] = eyePosSplit_x.high;
			eyePosHIGH[1] = eyePosSplit_y.high;
			eyePosHIGH[2] = eyePosSplit_z.high;
			
			eyePosLOW[0] = eyePosSplit_x.low;
			eyePosLOW[1] = eyePosSplit_y.low;
			eyePosLOW[2] = eyePosSplit_z.low;
			
			GL.uniform3fv(standardShader._encodedCameraPositionMCHigh, eyePosHIGH);
			GL.uniform3fv(standardShader._encodedCameraPositionMCLow, eyePosLOW);
			
			GL.uniformMatrix4fv(standardShader._ModelViewProjectionMatrixRelToEye, GL.FALSE, move_matrix_aux);  
	  }
	
	var cacheKeys_count = undefined;
	var reference = undefined;
	var block_idx = undefined;
	var block = undefined;
	var ifc_entity = undefined;
	var vbo_ByteColorsCacheKeys_Container = undefined;
	  
	// ------------------------------------------------------------------------------------- //  
	for(var j=0; j<compRefLists_count; j++)
	{
		var compRefList = compRefList_array[j];
		var myBlocksList = BR_Project._blocksList_Container._BlocksListsArray[compRefList._lodLevel];  // new for use workers.***
		var compReferences_count = compRefList._compoundRefsArray.length;
		for(var k=0; k<compReferences_count; k++)
		{
			var compReference = compRefList._compoundRefsArray[k];
			var references_count = compReference._referencesList.length;
			for(var m=0; m<references_count; m++)
			{
				reference = compReference._referencesList[m];
				block_idx = reference._block_idx;
				block = myBlocksList.getBlock(block_idx);

				// ifc_space = 27, ifc_window = 26, ifc_plate = 14
				if(block != null)
				{
					ifc_entity = block.mIFCEntityType;
					if( ifc_entity==26 || ifc_entity==27 || ifc_entity==14)
						continue;
					
					cacheKeys_count = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray.length;
					// Must applicate the transformMatrix of the reference object.***
					GL.uniformMatrix4fv(standardShader._RefTransfMatrix, GL.FALSE, reference._matrix4._floatArrays);  // true => transpose, false => NO transpose.***
					
					// for workers.**************************************************************************************************************************
					vbo_ByteColorsCacheKeys_Container = BR_Project._VBO_ByteColorsCacheKeysContainer_List[reference._VBO_ByteColorsCacheKeys_Container_idx];
					// End for workers.----------------------------------------------------------------------------------------------------------------------
					
					for(var n=0; n<cacheKeys_count; n++) // Original.***
					{
						//var mesh_array = block._vi_arrays_Container._meshArrays[n];
						this.vbo_vi_cacheKey_aux = block._vbo_VertexIdx_CacheKeys_Container._vbo_cacheKeysArray[n];
						
						GL.bindBuffer(GL.ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_VERTEX_cacheKey);
						GL.vertexAttribPointer(standardShader._position, 3, GL.FLOAT, false,0,0);
						
						// Colors in float mode.*****************************************************************************************
						//GL.bindBuffer(GL.ARRAY_BUFFER, reference._VBO_ByteColorsCacheKeys_Container._vbo_byteColors_cacheKeysArray[n].MESH_COLORS_cacheKey);
						//GL.vertexAttribPointer(scene._color, 3, GL.FLOAT, false,0,0);
						  
						// Colors in byte mode.******************************************************************************************
						GL.bindBuffer(GL.ARRAY_BUFFER, vbo_ByteColorsCacheKeys_Container._vbo_byteColors_cacheKeysArray[n].MESH_COLORS_cacheKey);// Test for workers.***
						GL.vertexAttribPointer(standardShader._color, 3, GL.UNSIGNED_BYTE, true,0,0); // In "colors" the argument normalized must be TRUE when is in BYTE.***
				
						GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.vbo_vi_cacheKey_aux.MESH_FACES_cacheKey);
						GL.drawElements(GL.TRIANGLES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Fill.***
						//GL.drawElements(GL.LINES, this.vbo_vi_cacheKey_aux.indices_count, GL.UNSIGNED_SHORT, 0); // Wireframe.***
					}
				}
			}
		}
	}
	
	// Restore World Wind's default WebGL state. Code copied from "BoundingBox.js" .****************
	GL.enable(GL.CULL_FACE);
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	//----------------------------------------------------------------------------------------------
				
	
	GL.disableVertexAttribArray(standardShader._color);
	GL.disableVertexAttribArray(standardShader._position);
	//---------------------------------------------------
	
	//---------------------------------------------------
	/*
	GL.useProgram(null);
	GL.bindFramebuffer(GL.FRAMEBUFFER, null);
	GL.bindBuffer(GL.ARRAY_BUFFER, null);
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
	*/
	//---------------------------------------------------
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
	  //var relative_eye_pos_x = absolute_eye_x - buildingPosition.x;
	  //var relative_eye_pos_y = absolute_eye_y - buildingPosition.y;
	  //var relative_eye_pos_z = absolute_eye_z - buildingPosition.z;
	  
	  var relative_eye_pos_x = absolute_eye_x - buildingPosition[0];
	  var relative_eye_pos_y = absolute_eye_y - buildingPosition[1];
	  var relative_eye_pos_z = absolute_eye_z - buildingPosition[2];
		
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

  // BR Building ProjectsList.************************************************************************************************ //
  var f4d_BR_buildingProjectsList = function()
  {
	  this._BR_buildingsArray = [];
	  this._boundingBox = undefined;
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
// Segment.*****************************************************************************************************************//
var F4d_Segment = function()
{
	// WorldWind dependency.***
	// WorldWind dependency.***
	this.point_1 = new WorldWind.Vec3();
	this.point_2 = new WorldWind.Vec3();
};	

F4d_Segment.prototype.set_points = function(point1_x, point1_y, point1_z,   point2_x, point2_y, point2_z)
{
	this.point_1[0] = point1_x;
	this.point_1[1] = point1_y;
	this.point_1[2] = point1_z;
	
	this.point_2[0] = point2_x;
	this.point_2[1] = point2_y;
	this.point_2[2] = point2_z;
};


//**************************************************************************************************************************//
// TerranTile.**************************************************************************************************************//
var f4d_TerranTile = function()
{
	//           +-----+-----+
	//           |  3  |  2  |
	//           +-----+-----+
	//           |  0  |  1  |
	//           +-----+-----+ 
	
	this._depth = 0; // qudtree depth. 0 => mother_quadtree.***
	this._numberName = 1; // mother quadtree.***
	this._terranTile_owner = undefined;
	this._BR_buildingsArray = [];
	this._boundingBox = undefined; // dont use this.***
	this._pCloudMesh_array = []; // 1rst aproximation to the pointCloud data. Test.***
	
	this.position = undefined; // absolute position, for do frustum culling.***
	this.radius = undefined; // aprox radius for this tile.***
	
	// For webworldwind frustum culling.********************************
	// We create 4 segments that covers the tile.***
	this.segments_array = [];
	var segments_count = 6;
	for(var i=0; i<segments_count; i++)
	{
		var f4dSegment = new F4d_Segment(); 
		this.segments_array.push(f4dSegment);
	}
	//------------------------------------------------------------------

	//this.leftDown_position = undefined;
	//this.rightDown_position = undefined;
	//this.rightUp_position = undefined;
	//this.leftUp_position = undefined;
	//this.visibilityType = undefined;
  
	//this.longitude_min = undefined; // delete this.***
	//this.longitude_max = undefined; // delete this.***
	//this.latitude_min = undefined; // delete this.***
	//this.latitude_max = undefined; // delete this.***
	
	// For frustum culling. In www there are no spheres. Only segments can be intersect frustum***
	
	
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

f4d_TerranTile.prototype.calculate_position_byLonLat = function(wwd)
{
	var lon_mid = (this.longitude_max + this.longitude_min)/2.0;
	var lat_mid = (this.latitude_max + this.latitude_min)/2.0;
	
	var globe = wwd.globe;

	if(this.position == undefined)
		this.position = new WorldWind.Vec3();
	
	var result = new WorldWind.Vec3(0, 0, 0);
	this.position = globe.computePointFromPosition(lat_mid, lon_mid, 50.0, this.position); // WebWorldWind version.***
	
	// Test.*****************************************************************
	//var origin = new WorldWind.Vec3(latitude, longitude, height);
	//var result = new WorldWind.Vec3(0, 0, 0);
	//origin = globe.computePointFromPosition(latitude, longitude, height, result);
	//--------------------------------------------------------------------------------
	
	// Now, for the frustum culling, we calculate diagonal segments.***
	// this is like a england flag (one X and one +).***
	
	this.segments_array[0].point_1 = globe.computePointFromPosition(this.latitude_min, this.longitude_min, 0.0, this.segments_array[0].point_1);
	this.segments_array[0].point_2 = globe.computePointFromPosition(this.latitude_max, this.longitude_max, 0.0, this.segments_array[0].point_2);
	
	this.segments_array[1].point_1 = globe.computePointFromPosition(this.latitude_max, this.longitude_min, 0.0, this.segments_array[1].point_1);
	this.segments_array[1].point_2 = globe.computePointFromPosition(this.latitude_min, this.longitude_max, 0.0, this.segments_array[1].point_2);
	
	//this.segments_array[2].point_1 = globe.computePointFromPosition(lat_mid, this.longitude_min, 0.0, this.segments_array[2].point_1);
	//this.segments_array[2].point_2 = globe.computePointFromPosition(lat_mid, this.longitude_max, 0.0, this.segments_array[2].point_2);
	
	//this.segments_array[3].point_1 = globe.computePointFromPosition(this.latitude_max, lon_mid, 0.0, this.segments_array[3].point_1);
	//this.segments_array[3].point_2 = globe.computePointFromPosition(this.latitude_min, lon_mid, 0.0, this.segments_array[3].point_2);
	
	this.segments_array[2].point_1 = globe.computePointFromPosition(this.latitude_min, lon_mid, 0.0, this.segments_array[2].point_1);
	this.segments_array[2].point_2 = globe.computePointFromPosition(this.latitude_min, this.longitude_max, 0.0, this.segments_array[2].point_2);
	
	this.segments_array[3].point_1 = globe.computePointFromPosition(lat_mid, this.longitude_max, 0.0, this.segments_array[3].point_1);
	this.segments_array[3].point_2 = globe.computePointFromPosition(this.latitude_max, this.longitude_max, 0.0, this.segments_array[3].point_2);
	
	this.segments_array[4].point_1 = globe.computePointFromPosition(this.latitude_max, lon_mid, 0.0, this.segments_array[4].point_1);
	this.segments_array[4].point_2 = globe.computePointFromPosition(this.latitude_max, this.longitude_min, 0.0, this.segments_array[4].point_2);
	
	this.segments_array[5].point_1 = globe.computePointFromPosition(lat_mid, this.longitude_min, 0.0, this.segments_array[5].point_1);
	this.segments_array[5].point_2 = globe.computePointFromPosition(this.latitude_min, this.longitude_min, 0.0, this.segments_array[5].point_2);
};

f4d_TerranTile.prototype.calculate_position_byLonLat_subTiles = function(wwd)
{
	this.calculate_position_byLonLat(wwd);
	
	var subTile = undefined;
	var subTiles_count = this.subTiles_array.length; // subTiles_count must be 4.***

	for(var i=0; i<subTiles_count; i++)
	{
		this.subTiles_array[i].calculate_position_byLonLat_subTiles(wwd);
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
	
	header._elevation += 70.0; // delete this. TEST.!!!
	
	// 6) BoundingBox.************************
	header._boundingBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._boundingBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._boundingBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	
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
	// But, this creates www dependency, so this calculs must be do in render pipeline.***
	// 0) PositionMatrix.************************************************************************
	//var height = elevation;
	/*
	//var position = Cesium.Cartesian3.fromDegrees(header._longitude, header._latitude, header._elevation); // Cesium version.***
	var position = new WorldWind.Vec3(0, 0, 0);
	position = globe.computePointFromPosition(header._latitude, header._longitude, header._elevation, position); // www version.***
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
	*/
	
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
	// WebWorldWind dependency.***
	// WebWorldWind dependency.***
	if(boundingSphere_Aux == undefined)
	{
		//boundingSphere_Aux = new Cesium.BoundingSphere();
		// There are no spheres in www.***
		// The frustum culling is doing by segments.***
	}
	/*
	var intersectedPoints_count = 0;
	boundingSphere_Aux.radius = this.radius;
	boundingSphere_Aux.center.x = this.position.x;
	boundingSphere_Aux.center.y = this.position.y;
	boundingSphere_Aux.center.z = this.position.z;
	this.visibilityType = frustumVolume.computeVisibility(boundingSphere_Aux);
	*/
	
	// Now, check if this tile intersects with frustum.***
	var intersects = false;
	var finished = false;
	var intersection_type = 0; // 0 = outside. 1 = inside. 2 = intersected. ***
	var segments_intersected = 0;
	var segments_noIntersected = 0;
	var i=0;
	var segments_count = 6;
	while(!finished && i<segments_count)
	{
		if(frustumVolume.intersectsSegment(this.segments_array[i].point_1, this.segments_array[i].point_2))
		{
			segments_intersected++;
			if(segments_noIntersected > 0)
			{
				finished = true;
				intersection_type = 2;
			}
		}
		else
		{
			segments_noIntersected++;
			if(segments_intersected > 0)
			{
				finished = true;
				intersection_type = 2;
			}
		}
		i++;
	}
	
	if(segments_intersected == segments_count)
		intersection_type = 1; // Inside.***
	
	if(intersection_type == 0)
	{
		// Do nothing.***
		this.visibilityType = 0;
	}
	else if(intersection_type == 1)
	{
		// Inside.***
		intersectedTiles_array.push(this);
		this.visibilityType = 1;
	}
	else
	{
		// Intersected.***
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
		this.visibilityType = 2;
	}

	/*
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
	*/
};
  

