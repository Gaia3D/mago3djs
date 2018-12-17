'use strict';

var Slice = function() 
{
	// Image2D. numCols x numRows data.***
	this.dataArray;
	this.width;
	this.height;
};

Slice.prototype.getValue = function(col, row)
{
	if(this.dataArray === undefined || this.dataArray.length === 0)
		return undefined;
	
	var idx = Image3D.getIndexOfArray(this.width, col, row);
	return this.dataArray[idx];
};
//------------------------------------------------------------------------------

var Stack = function() 
{
	this.slicesArray;
};

Stack.prototype.newSlice = function()
{
	if(this.slicesArray === undefined)
		this.slicesArray = [];
	
	var slice = new Slice();
	this.slicesArray.push(slice);
	return slice;
};

Stack.prototype.getSlicesCount = function()
{
	if(this.slicesArray === undefined)
		return 0;
	
	return this.slicesArray.length;
};

Stack.prototype.getSlice = function(idx)
{
	if(this.slicesArray === undefined)
		return undefined;
	
	if(idx >= this.slicesArraylength)
		return undefined;
	
	return this.slicesArray[idx];
};
//------------------------------------------------------------------------------

var Image3D = function() 
{
	this.stacksArray;
	this.numSlicesPerStack;
};

Image3D.getIndexOfArray = function(numCols, col, row) 
{
	// function valid if numStacks = 1.***
	return col + row * numCols;
};

Image3D.getIndexOfArray3D = function(numCols, numRows, numSlices, numStacks, col, row, slice, stack)
{
	var idx = -1;
	
	// 1rst, calculate x,y for an uniqueSlice.***
	var x = stack * numCols + col;
	var y = slice * numRows + row;
	
	// x,y are the coordenates for an uniqueSlice image.***
	var uniqueSliceNumCols = numStacks * numCols;
	//var uniqueSliceNumRows = numSlices * numRows; // no necessary.***
	idx = Image3D.getIndexOfArray(uniqueSliceNumCols, x, y);
	
	return idx;
};

Image3D.getStack = function(idx) 
{
	if(this.stacksArray === undefined)
		return undefined;
	
	if(idx >= this.stacksArray.length)
		return undefined;
	
	return this.stacksArray[idx];
};

Image3D.getStacksCount = function() 
{
	if(this.stacksArray === undefined)
		return 0;
	
	return this.stacksArray.length;
};

Image3D.prototype.newStack = function()
{
	if(this.stacksArray === undefined)
		this.stacksArray = [];
	
	var stack = new Stack();
	this.stacksArray.push(stack);
	return stack;
};

Image3D.prototype.reverseSlicesOfStacks = function()
{
	if(this.stacksArray === undefined)
		return;
	
	var stacksCount = this.stacksArray.length;
	for(var i=0; i<stacksCount; i++)
	{
		var stack = this.stacksArray[i];
		stack.slicesArray.reverse();
	}
};

Image3D.prototype.getAnUniqueSlice = function(resultSlice)
{
	if(resultSlice === undefined)
		resultSlice = new Slice();
	
	// Put all stacks into the resultSlice.***
	// 1rst, calculate the width & height of resultSlice.***

	var numStacks = this.stacksArray.length;
	var aStack = this.stacksArray[0];
	
	// Note: in the last stack, the numSlices can be minor than other stacks.***
	if(this.numSlicesPerStack === undefined)
		this.numSlicesPerStack = aStack.slicesArray.length;
	
	var numSlices = this.numSlicesPerStack;
	var aSlice = aStack.slicesArray[0];
	var sliceWidth = aSlice.width;
	var sliceHeight = aSlice.height;
	
	var resultSliceWidth = sliceWidth * numStacks;
	var resultSliceHeight = sliceHeight * numSlices;
	resultSlice.width = resultSliceWidth;
	resultSlice.height = resultSliceHeight;
	var resultSliceSize = resultSliceWidth * resultSliceHeight;
	resultSlice.dataArray = new Uint8Array(resultSliceSize);
	
	// now, fill the resultSlice.***
	var idx = -1;
	var value;
	for(var t=0; t<numStacks; t++)
	{
		aStack = this.stacksArray[t];
		var slicesCount = aStack.slicesArray.length;
		for(var s=0; s<slicesCount; s++)
		{
			aSlice = aStack.slicesArray[s];
			var numRows = aSlice.height;
			var numCols = aSlice.width;
			for(var j=0; j<numRows; j++)
			{
				for(var i=0; i<numCols; i++)
				{
					if(i >= sliceWidth -1)
						var hola = 0;
					
					value = aSlice.getValue(i, j);
					idx = Image3D.getIndexOfArray3D(numCols, numRows, numSlices, numStacks, i, j, s, t);
					resultSlice.dataArray[idx] = value;
				}
			}
		}
	}
	
	return resultSlice;
};


//------------------------------------------------------------------------------

var Image3DManager = function() 
{
	
};

Image3DManager.calculateNumStacks = function(maxTextureSizeAllowed, imageWidth, imageHeight, imageSlices) 
{
	// Note: if the image is very big, is possible that there are no solution.***
	//  (e.g. GTX480) reports MAX_TEXTURE_SIZE = 16384.
	var resultNumStacks = -1;
	if(imageWidth > maxTextureSizeAllowed)
		return -1;
	
	// The limitation is from webgl gl.MAX_TEXTURE_SIZE.***
	var finished = false;
	var candidateNumStacks = 1;
	while(!finished)
	{
		var totalHeight = imageHeight * Math.ceil(imageSlices / candidateNumStacks);
		if(totalHeight < maxTextureSizeAllowed)
		{
			finished = true;
			
			// But, once finished, must check if the resultWidth is inferior to gl.MAX_TEXTURE_SIZE.***
			if(imageWidth * candidateNumStacks > maxTextureSizeAllowed)
			{
				return -1;
			}
			
			resultNumStacks = candidateNumStacks;
		}
		
		candidateNumStacks++;
		
		if(candidateNumStacks >= imageSlices)
			return -1;
	}
	
	return resultNumStacks;
};

Image3DManager.convertMonoStackImage3DToMultiStackImage3D = function(image3d, resultImage3d, maxTextureSizeAllowed)
{
	// Note: the image3d must have only one stack.***
	// This function converts a monoStackImage3d to a multiStackImage3d.***
	if(image3d === undefined || image3d.stacksArray === undefined || image3d.stacksArray.length === 0)
		return;
	
	if(resultImage3d === undefined)
		resultImage3d = new Image3D();
	
	// Must check the webgl limitations of gl.getParameter(gl.MAX_TEXTURE_SIZE).***
	var stack = image3d.stacksArray[0];
	var slice = stack.slicesArray[0]; // take any slice.***
	var imageWidth = slice.width;
	var imageHeight = slice.height;
	var numSlices = stack.slicesArray.length;
	var resultNumStacks = Image3DManager.calculateNumStacks(maxTextureSizeAllowed, imageWidth, imageHeight, numSlices);
	var resultNumSlices = Math.ceil(numSlices/resultNumStacks);
	// Note: in the last stack, the numSlices can be minor than other stacks.***
	resultImage3d.numSlicesPerStack = resultNumSlices;
	
	var resultSlicesCounter = 0;
	var resultStack = resultImage3d.newStack();
	resultStack.slicesArray = [];
	for(var s=0; s<numSlices; s++)
	{
		if(resultSlicesCounter >= resultNumSlices)
		{
			resultStack = resultImage3d.newStack();
			resultStack.slicesArray = [];
			resultSlicesCounter = 0;
		}
		
		var slice = stack.slicesArray[s];
		resultStack.slicesArray.push(slice);
		
		resultSlicesCounter++;
	}
	
	// Reverse slices of stacks.***
	resultImage3d.reverseSlicesOfStacks();
	
	return resultImage3d;
};














































