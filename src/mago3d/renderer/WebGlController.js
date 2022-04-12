'use strict';

/**
 * Controls the webgl parameters.
 * @class WebGlController
 */
var WebGlController = function(gl) 
{
	if (!(this instanceof WebGlController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Each gl_parameters has 2 vars: curr_param & keep_param
	// For each gl_parameter there are 4 functions to control : enable_param, disable_param, keepCurrent_param & restore_param.
	
	this.gl = gl;
	this.mapRestoringFunctions = {};
	this.mapParameterNames = {};
};

// colorMaks : boolArray(4).***************************************************************
WebGlController.prototype.colorMask = function (red, green, blue, alpha)
{
	var m = this.mapParameterNames;
	if (m.keep_GL_COLOR_WRITEMASK === undefined)
	{
		this._keepCurrent_GL_COLOR_WRITEMASK();
	}

	if (red !== m.curr_GL_COLOR_WRITEMASK[0] || green !== m.curr_GL_COLOR_WRITEMASK[1] || blue !== m.curr_GL_COLOR_WRITEMASK[2] || alpha !== m.curr_GL_COLOR_WRITEMASK[3])
	{
		this.gl.colorMask(red, green, blue, alpha);
		m.curr_GL_COLOR_WRITEMASK = [red, green, blue, alpha];
	}
};

WebGlController.prototype._keepCurrent_GL_COLOR_WRITEMASK = function ()
{
	var m = this.mapParameterNames;
	m.keep_GL_COLOR_WRITEMASK = this.gl.getParameter(this.gl.COLOR_WRITEMASK);
	m.curr_GL_COLOR_WRITEMASK = [m.keep_GL_COLOR_WRITEMASK[0], m.keep_GL_COLOR_WRITEMASK[1], m.keep_GL_COLOR_WRITEMASK[2], m.keep_GL_COLOR_WRITEMASK[3]];

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_COLOR_WRITEMASK = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_COLOR_WRITEMASK[0] !== map.keep_GL_COLOR_WRITEMASK[0] || map.curr_GL_COLOR_WRITEMASK[1] !== map.keep_GL_COLOR_WRITEMASK[1] || 
			map.curr_GL_COLOR_WRITEMASK[2] !== map.keep_GL_COLOR_WRITEMASK[2] || map.curr_GL_COLOR_WRITEMASK[3] !== map.keep_GL_COLOR_WRITEMASK[3] )
		{
			webglController.gl.colorMask(map.keep_GL_COLOR_WRITEMASK[0], map.keep_GL_COLOR_WRITEMASK[1], map.keep_GL_COLOR_WRITEMASK[2], map.keep_GL_COLOR_WRITEMASK[3]);
		}
	};
};

// depthMask : bool.***********************************************************************
WebGlController.prototype.depthMask = function (flag)
{
	var m = this.mapParameterNames;
	if (m.keep_GL_DEPTH_WRITEMASK === undefined)
	{
		this._keepCurrent_GL_DEPTH_WRITEMASK();
	}

	if (flag !== m.curr_GL_DEPTH_WRITEMASK)
	{
		this.gl.depthMask(flag);
		m.curr_GL_DEPTH_WRITEMASK = flag;
	}
};

WebGlController.prototype._keepCurrent_GL_DEPTH_WRITEMASK = function ()
{
	var m = this.mapParameterNames;
	m.keep_GL_DEPTH_WRITEMASK = this.gl.getParameter(this.gl.DEPTH_WRITEMASK);
	m.curr_GL_DEPTH_WRITEMASK = m.keep_GL_DEPTH_WRITEMASK;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_DEPTH_WRITEMASK = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_DEPTH_WRITEMASK !== map.keep_GL_DEPTH_WRITEMASK)
		{
			webglController.gl.depthMask(map.keep_GL_DEPTH_WRITEMASK);
		}
	};
};

// FrontFace : GLenum.*********************************************************************
WebGlController.prototype.frontFace = function (mode)
{
	var m = this.mapParameterNames;
	if (m.keep_GL_FRONT_FACE === undefined)
	{
		this._keepCurrent_GL_FRONT_FACE();
	}

	if (mode !== m.curr_GL_FRONT_FACE)
	{
		this.gl.frontFace(mode);
		m.curr_GL_FRONT_FACE = mode;
	}
};

WebGlController.prototype._keepCurrent_GL_FRONT_FACE = function ()
{
	var m = this.mapParameterNames;
	m.keep_GL_FRONT_FACE = this.gl.getParameter(this.gl.FRONT_FACE);
	m.curr_GL_FRONT_FACE = m.keep_GL_FRONT_FACE;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_FRONT_FACE = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_FRONT_FACE !== map.keep_GL_FRONT_FACE)
		{
			webglController.gl.frontFace(map.keep_GL_FRONT_FACE);
		}
	};
};

// Viewport : Int32Array(4).***************************************************************
WebGlController.prototype.viewport = function (x, y, width, height)
{
	var m = this.mapParameterNames;
	if (m.keep_GL_VIEWPORT === undefined)
	{
		this._keepCurrent_GL_VIEWPORT();
	}

	if (x !== m.curr_GL_VIEWPORT[0] || y !== m.curr_GL_VIEWPORT[1] || width !== m.curr_GL_VIEWPORT[2] || height !== m.curr_GL_VIEWPORT[3])
	{
		this.gl.viewport(x, y, width, height);
		m.curr_GL_VIEWPORT[0] = x;
		m.curr_GL_VIEWPORT[1] = y;
		m.curr_GL_VIEWPORT[2] = width;
		m.curr_GL_VIEWPORT[3] = height;
	}
};

WebGlController.prototype._keepCurrent_GL_VIEWPORT = function ()
{
	var m = this.mapParameterNames;
	m.keep_GL_VIEWPORT = this.gl.getParameter(this.gl.VIEWPORT);
	m.curr_GL_VIEWPORT = new Int32Array(4);
	m.curr_GL_VIEWPORT[0] = m.keep_GL_VIEWPORT[0];
	m.curr_GL_VIEWPORT[1] = m.keep_GL_VIEWPORT[1];
	m.curr_GL_VIEWPORT[2] = m.keep_GL_VIEWPORT[2];
	m.curr_GL_VIEWPORT[3] = m.keep_GL_VIEWPORT[3];

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_VIEWPORT = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_VIEWPORT[0] !== map.keep_GL_VIEWPORT[0] || map.curr_GL_VIEWPORT[1] !== map.keep_GL_VIEWPORT[1] || map.curr_GL_VIEWPORT[2] !== map.keep_GL_VIEWPORT[2] || map.curr_GL_VIEWPORT[3] !== map.keep_GL_VIEWPORT[3])
		{
			webglController.gl.viewport(map.keep_GL_VIEWPORT[0], map.keep_GL_VIEWPORT[1], map.keep_GL_VIEWPORT[2], map.keep_GL_VIEWPORT[3]);
		}
	};
};

// ClearDepth : GlFloat.*******************************************************************
WebGlController.prototype.clearDepth = function(depthValue)
{
	var m = this.mapParameterNames;
	if (m.keep_GL_DEPTH_CLEAR_VALUE === undefined)
	{
		this._keepCurrent_GL_DEPTH_CLEAR_VALUE();
	}

	if (depthValue !== m.curr_GL_DEPTH_CLEAR_VALUE)
	{
		this.gl.clearDepth(depthValue);
		m.curr_GL_DEPTH_CLEAR_VALUE = depthValue;
	}
};

WebGlController.prototype._keepCurrent_GL_DEPTH_CLEAR_VALUE = function ()
{
	var m = this.mapParameterNames;
	m.keep_GL_DEPTH_CLEAR_VALUE = this.gl.getParameter(this.gl.DEPTH_CLEAR_VALUE);
	m.curr_GL_DEPTH_CLEAR_VALUE = m.keep_GL_DEPTH_CLEAR_VALUE;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_DEPTH_CLEAR_VALUE = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_DEPTH_CLEAR_VALUE !== map.keep_GL_DEPTH_CLEAR_VALUE)
		{
			webglController.gl.clearDepth(map.keep_GL_DEPTH_CLEAR_VALUE);
		}
	};
};

// ClearColor : Float32Array(4).***********************************************************
WebGlController.prototype.clearColor = function (r, g, b, a)
{
	var m = this.mapParameterNames;
	if (m.keep_GL_COLOR_CLEAR_VALUE === undefined)
	{
		this._keepCurrent_GL_COLOR_CLEAR_VALUE();
	}

	if (r !== m.curr_GL_COLOR_CLEAR_VALUE[0] || g !== m.curr_GL_COLOR_CLEAR_VALUE[1] || b !== m.curr_GL_COLOR_CLEAR_VALUE[2] || a !== m.curr_GL_COLOR_CLEAR_VALUE[3] )
	{
		this.gl.clearColor(r, g, b, a);
		m.curr_GL_COLOR_CLEAR_VALUE[0] = r;
		m.curr_GL_COLOR_CLEAR_VALUE[1] = g;
		m.curr_GL_COLOR_CLEAR_VALUE[2] = b;
		m.curr_GL_COLOR_CLEAR_VALUE[3] = a;
	}
	
};

WebGlController.prototype._keepCurrent_GL_COLOR_CLEAR_VALUE = function ()
{
	var m = this.mapParameterNames;
	m.keep_GL_COLOR_CLEAR_VALUE = this.gl.getParameter(this.gl.COLOR_CLEAR_VALUE);
	m.curr_GL_COLOR_CLEAR_VALUE = new Float32Array(4);
	m.curr_GL_COLOR_CLEAR_VALUE[0] = m.keep_GL_COLOR_CLEAR_VALUE[0];
	m.curr_GL_COLOR_CLEAR_VALUE[1] = m.keep_GL_COLOR_CLEAR_VALUE[1];
	m.curr_GL_COLOR_CLEAR_VALUE[2] = m.keep_GL_COLOR_CLEAR_VALUE[2];
	m.curr_GL_COLOR_CLEAR_VALUE[3] = m.keep_GL_COLOR_CLEAR_VALUE[3];

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_COLOR_CLEAR_VALUE = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if ( map.curr_GL_COLOR_CLEAR_VALUE[0] !== map.keep_GL_COLOR_CLEAR_VALUE[0] || map.curr_GL_COLOR_CLEAR_VALUE[1] !== map.keep_GL_COLOR_CLEAR_VALUE[1] || 
			map.curr_GL_COLOR_CLEAR_VALUE[2] !== map.keep_GL_COLOR_CLEAR_VALUE[2] || map.curr_GL_COLOR_CLEAR_VALUE[3] !== map.keep_GL_COLOR_CLEAR_VALUE[3] )
		{
			webglController.gl.clearColor(map.keep_GL_COLOR_CLEAR_VALUE[0], map.keep_GL_COLOR_CLEAR_VALUE[1], map.keep_GL_COLOR_CLEAR_VALUE[2], map.keep_GL_COLOR_CLEAR_VALUE[3]);
		}
	};
	
};

// BlendFunc.******************************************************************************
WebGlController.prototype.blendFunc = function(sfactor, dfactor) 
{
	var m = this.mapParameterNames;
	if (m.keep_GL_BLEND_SRC_FUNC === undefined)
	{
		this._keepCurrent_GL_BLEND_FUNC();
	}

	if (m.curr_GL_BLEND_SRC_FUNC !== sfactor || m.curr_GL_BLEND_DST_FUNC !== dfactor )
	{
		this.gl.blendFunc(sfactor, dfactor);
		m.curr_GL_BLEND_SRC_FUNC = sfactor;
		m.curr_GL_BLEND_DST_FUNC = dfactor;
	}
};

WebGlController.prototype._keepCurrent_GL_BLEND_FUNC = function() 
{
	var m = this.mapParameterNames;
	m.keep_GL_BLEND_SRC_FUNC = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
	m.curr_GL_BLEND_SRC_FUNC = m.keep_GL_BLEND_SRC_FUNC;

	m.keep_GL_BLEND_DST_FUNC = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);
	m.curr_GL_BLEND_DST_FUNC = m.keep_GL_BLEND_DST_FUNC;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_BLEND_FUNC = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_BLEND_SRC_FUNC !== map.keep_GL_BLEND_SRC_FUNC || map.curr_GL_BLEND_DST_FUNC !== map.keep_GL_BLEND_DST_FUNC)
		{
			webglController.gl.blendFunc(map.keep_GL_BLEND_SRC_FUNC, map.keep_GL_BLEND_DST_FUNC);
		}
	};
};

// GL_DEPTH_RANGE : Float32Array(2).*******************************************************
WebGlController.prototype.depthRange = function(near, far) 
{
	var m = this.mapParameterNames;
	if (m.keep_GL_DEPTH_RANGE === undefined)
	{
		this._keepCurrent_GL_DEPTH_RANGE();
	}

	if (m.curr_GL_DEPTH_RANGE[0] !== near || m.curr_GL_DEPTH_RANGE[1] !== far )
	{
		this.gl.depthRange(near, far);
		m.curr_GL_DEPTH_RANGE[0] = near;
		m.curr_GL_DEPTH_RANGE[1] = far;
	}
};

WebGlController.prototype._keepCurrent_GL_DEPTH_RANGE = function() 
{
	var m = this.mapParameterNames;
	m.keep_GL_DEPTH_RANGE = this.gl.getParameter(this.gl.DEPTH_RANGE);
	m.curr_GL_DEPTH_RANGE = new Float32Array([m.keep_GL_DEPTH_RANGE[0], m.keep_GL_DEPTH_RANGE[1]]);

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_DEPTH_RANGE = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_DEPTH_RANGE[0] !== map.keep_GL_DEPTH_RANGE[0] || map.curr_GL_DEPTH_RANGE[1] !== map.keep_GL_DEPTH_RANGE[1])
		{
			webglController.gl.depthRange(map.keep_GL_DEPTH_RANGE[0], map.keep_GL_DEPTH_RANGE[1]);
		}
	};
};

// GL_BLEND : boolenan.*******************************************************
WebGlController.prototype.enable_GL_BLEND = function() 
{
	var m = this.mapParameterNames;
	if (m.keep_GL_BLEND === undefined)
	{
		this._keepCurrent_GL_BLEND();
	}

	if (!m.curr_GL_BLEND)
	{
		this.gl.enable(this.gl.BLEND);
		m.curr_GL_BLEND = true;
	}
};

WebGlController.prototype.disable_GL_BLEND = function() 
{
	var m = this.mapParameterNames;
	if (m.keep_GL_BLEND === undefined)
	{
		this._keepCurrent_GL_BLEND();
	}

	if (m.curr_GL_BLEND)
	{
		this.gl.disable(this.gl.BLEND);
		m.curr_GL_BLEND = false;
	}
};

WebGlController.prototype._keepCurrent_GL_BLEND = function() 
{
	var m = this.mapParameterNames;
	m.keep_GL_BLEND = this.gl.getParameter(this.gl.BLEND);
	m.curr_GL_BLEND = m.keep_GL_BLEND;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_BLEND = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_BLEND !== map.keep_GL_BLEND)
		{
			if (map.keep_GL_BLEND)
			{
				webglController.gl.enable(webglController.gl.BLEND);
			}
			else 
			{
				webglController.gl.disable(webglController.gl.BLEND);
			}
		}
	};
};

// GL_DEPTH_TEST : boolenan.*******************************************************
WebGlController.prototype.enable_GL_DEPTH_TEST = function() 
{
	var m = this.mapParameterNames;
	if (m.keep_GL_DEPTH_TEST === undefined)
	{
		this._keepCurrent_GL_DEPTH_TEST();
	}

	if (!m.curr_GL_DEPTH_TEST)
	{
		this.gl.enable(this.gl.DEPTH_TEST);
		m.curr_GL_DEPTH_TEST = true;
	}
};

WebGlController.prototype.disable_GL_DEPTH_TEST = function() 
{
	var m = this.mapParameterNames;
	if (m.keep_GL_DEPTH_TEST === undefined)
	{
		this._keepCurrent_GL_DEPTH_TEST();
	}

	if (m.curr_GL_DEPTH_TEST)
	{
		this.gl.disable(this.gl.DEPTH_TEST);
		m.curr_GL_DEPTH_TEST = false;
	}
};

WebGlController.prototype._keepCurrent_GL_DEPTH_TEST = function() 
{
	var m = this.mapParameterNames;
	m.keep_GL_DEPTH_TEST = this.gl.getParameter(this.gl.DEPTH_TEST);
	m.curr_GL_DEPTH_TEST = m.keep_GL_DEPTH_TEST;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_DEPTH_TEST = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_GL_DEPTH_TEST !== map.keep_GL_DEPTH_TEST)
		{
			if (map.keep_GL_DEPTH_TEST)
			{
				webglController.gl.enable(webglController.gl.DEPTH_TEST);
			}
			else 
			{
				webglController.gl.disable(webglController.gl.DEPTH_TEST);
			}
		}
	};
};

// Gl_CULL_FACE : boolean.*********************************************************************
WebGlController.prototype.enable_GL_CULL_FACE = function() 
{
	var m = this.mapParameterNames;
	if (m.keep_Gl_CULL_FACE === undefined)
	{
		this._keepCurrent_GL_CULL_FACE();
	}

	if (!m.curr_Gl_CULL_FACE)
	{
		this.gl.enable(this.gl.CULL_FACE);
		m.curr_Gl_CULL_FACE = true;
	}
};

WebGlController.prototype.disable_GL_CULL_FACE = function() 
{
	var m = this.mapParameterNames;
	if (m.keep_Gl_CULL_FACE === undefined)
	{
		this._keepCurrent_GL_CULL_FACE();
	}

	if (m.curr_Gl_CULL_FACE)
	{
		this.gl.disable(this.gl.CULL_FACE);
		m.curr_Gl_CULL_FACE = false;
	}
};

WebGlController.prototype._keepCurrent_GL_CULL_FACE = function() 
{
	var m = this.mapParameterNames;
	m.keep_Gl_CULL_FACE = this.gl.getParameter(this.gl.CULL_FACE);
	m.curr_Gl_CULL_FACE = m.keep_Gl_CULL_FACE;

	// Now, the restore function.***
	this.mapRestoringFunctions.GL_CULL_FACE = function(webglController) 
	{
		var map = webglController.mapParameterNames;
		if (map.curr_Gl_CULL_FACE !== map.keep_Gl_CULL_FACE)
		{
			if (map.keep_Gl_CULL_FACE)
			{
				webglController.gl.enable(webglController.gl.CULL_FACE);
			}
			else 
			{
				webglController.gl.disable(webglController.gl.CULL_FACE);
			}
		}
	};
};

// Restore.********************************************************************************
WebGlController.prototype.restoreAllParameters = function() 
{
	if (this.mapRestoringFunctions !== undefined)
	{
		for (var key in this.mapRestoringFunctions)
		{
			if (this.mapRestoringFunctions.hasOwnProperty(key) )
			{
				this.mapRestoringFunctions[key](this);
			}
		}
	}
};
