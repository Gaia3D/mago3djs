
'use strict';

/**
 * VertexOctree
 * @see Vertex
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class VertexOctree
 */
var VertexOctree = function(octreeOwner) 
{
	if (!(this instanceof VertexOctree)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.octree_owner = octreeOwner;
	this.octree_level = 0;
	this.octree_number_name = 0;
	this.subOctrees_array;
	this.vertexArray;
	
	/**
	 * The center position in local coordinates of the octree.
	 * @type {Point3D}
	 * @default (0,0,0)
	 */
	this.centerPos = new Point3D();
	
	/**
	 * The half width of the octree in x-axis.
	 * @type {Number}
	 * @default 0.0
	 */
	this.half_dx = 0.0; 
	
	/**
	 * The half width of the octree in y-axis.
	 * @type {Number}
	 * @default 0.0
	 */
	this.half_dy = 0.0; 
	
	/**
	 * The half width of the octree in z-axis.
	 * @type {Number}
	 * @default 0.0
	 */
	this.half_dz = 0.0; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
VertexOctree.prototype.setBoxSize = function(minX, maxX, minY, maxY, minZ, maxZ) 
{
	this.centerPos.x = (maxX + minX)/2.0;
	this.centerPos.y = (maxY + minY)/2.0;
	this.centerPos.z = (maxZ + minZ)/2.0;

	this.half_dx = (maxX - minX)/2.0; // half width.
	this.half_dy = (maxY - minY)/2.0; // half length.
	this.half_dz = (maxZ - minZ)/2.0; // half height.
};

/**
 * Creates a child octree.
 * @returns {Octree} subOctree Returns the created child octree.
 */
VertexOctree.prototype.new_subOctree = function() 
{
	var subOctree = new VertexOctree(this);
	subOctree.octree_level = this.octree_level + 1;
	this.subOctrees_array.push(subOctree);
	return subOctree;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VertexOctree.prototype.setSizesSubBoxes = function() 
{
	// Octree number name.**
	// Bottom                      Top
	// +-----+-----+     +-----+-----+
	// |  3  |  2  |     |  7  |  6  |       Y
	// +-----+-----+     +-----+-----+       |
	// |  0  |  1  |     |  4  |  5  |       |
	// +-----+-----+     +-----+-----+       +---------> X

	if (this.subOctrees_array && this.subOctrees_array.length > 0) 
	{
		var half_x = this.centerPos.x;
		var half_y = this.centerPos.y;
		var half_z = this.centerPos.z;

		var min_x = this.centerPos.x - this.half_dx;
		var min_y = this.centerPos.y - this.half_dy;
		var min_z = this.centerPos.z - this.half_dz;

		var max_x = this.centerPos.x + this.half_dx;
		var max_y = this.centerPos.y + this.half_dy;
		var max_z = this.centerPos.z + this.half_dz;

		this.subOctrees_array[0].setBoxSize(min_x, half_x, min_y, half_y, min_z, half_z);
		this.subOctrees_array[1].setBoxSize(half_x, max_x, min_y, half_y, min_z, half_z);
		this.subOctrees_array[2].setBoxSize(half_x, max_x, half_y, max_y, min_z, half_z);
		this.subOctrees_array[3].setBoxSize(min_x, half_x, half_y, max_y, min_z, half_z);

		this.subOctrees_array[4].setBoxSize(min_x, half_x, min_y, half_y, half_z, max_z);
		this.subOctrees_array[5].setBoxSize(half_x, max_x, min_y, half_y, half_z, max_z);
		this.subOctrees_array[6].setBoxSize(half_x, max_x, half_y, max_y, half_z, max_z);
		this.subOctrees_array[7].setBoxSize(min_x, half_x, half_y, max_y, half_z, max_z);

		for (var i=0; i<8; i++) 
		{
			this.subOctrees_array[i].setSizesSubBoxes();
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
VertexOctree.prototype.createChildren = function() 
{
	this.subOctrees_array = []; // Init array.
	
	for (var i=0; i<8; i++) 
	{
		var subOctree = this.new_subOctree();
		subOctree.octree_number_name = this.octree_number_name * 10 + (i+1);
	}

	this.setSizesSubBoxes();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
VertexOctree.prototype.makeTreeByMinSize = function(targetMinSize) 
{
	if (this.vertexArray === undefined || this.vertexArray.length === 0)
	{ return; }
	
	var minSize = Math.min.apply(null, [this.half_dx, this.half_dy, this.half_dz]);
	
	if (minSize*2 > targetMinSize)
	{
		// descend 1 depth.
		this.createChildren();
		
		// now, insert vertices into subOctrees.
		var vertexCount = this.vertexArray.length;
		for (var i=0; i<vertexCount; i++)
		{
			this.insertVertexToChildren(this.vertexArray[i]);
		}
		this.vertexArray.length = 0; // init to save memory.
		
		for (var i=0; i<8; i++)
		{
			this.subOctrees_array[i].makeTreeByMinSize(targetMinSize);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
VertexOctree.prototype.extractOctreesWithData = function(resultOctreesArray) 
{
	if (resultOctreesArray === undefined)
	{ resultOctreesArray = []; }
	
	if (this.vertexArray !== undefined && this.vertexArray.length > 0)
	{ resultOctreesArray.push(this); }
	
	if (this.subOctrees_array)
	{
		var subOctreesCount = this.subOctrees_array.length; // must be 8 always.
		for (var i=0; i<subOctreesCount; i++)
		{
			this.subOctrees_array[i].extractOctreesWithData(resultOctreesArray);
		}
	}
	
	return resultOctreesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
VertexOctree.prototype.insertVertexToChildren = function(vertex) 
{
	// Octree number name.**
	// Bottom                      Top
	// +-----+-----+     +-----+-----+
	// |  3  |  2  |     |  7  |  6  |       Y
	// +-----+-----+     +-----+-----+       |
	// |  0  |  1  |     |  4  |  5  |       |
	// +-----+-----+     +-----+-----+       +---------> X
	
	var idx = -1;
	var point3d = vertex.getPosition();
	if (point3d.x < this.centerPos.x)
	{
		// idx = 0,3,4,7.
		if (point3d.y < this.centerPos.y)
		{
			// idx = 0,4.
			if (point3d.z < this.centerPos.z)
			{
				idx = 0;
			}
			else
			{
				idx = 4;
			}
		}
		else
		{
			// idx = 3,7.
			if (point3d.z < this.centerPos.z)
			{
				idx = 3;
			}
			else
			{
				idx = 7;
			}
		}
	}
	else
	{
		// idx = 1,2,5,6.
		if (point3d.y < this.centerPos.y)
		{
			// idx = 2,6.
			if (point3d.z < this.centerPos.z)
			{
				idx = 2;
			}
			else
			{
				idx = 6;
			}
		}
		else
		{
			// idx = 1,5.
			if (point3d.z < this.centerPos.z)
			{
				idx = 1;
			}
			else
			{
				idx = 5;
			}
		}
	}
	
	var subOctree = this.subOctrees_array[idx];
	if (subOctree.vertexArray === undefined)
	{ subOctree.vertexArray = []; }
	
	vertex.vertexIndexingOctree = subOctree; // assign provisionally the vertexOctree.
	subOctree.vertexArray.push(vertex);
};



































