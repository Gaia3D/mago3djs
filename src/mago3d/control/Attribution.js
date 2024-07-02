'use strict';
/**
 * 줌 컨트롤
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class Attribution
 * @param {Attribution~Options} options position info. coordinate. required.
 *  
 * @extends AbsControl
 * 
 */
var Attribution = function(options) 
{
	if (!(this instanceof Attribution)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	var element = document.createElement('div');
	options = options ? options : {};
	options.element = element;
    
	AbsControl.call(this, options);
};

Attribution.prototype = Object.create(AbsControl.prototype);
Attribution.prototype.constructor = Attribution;


Attribution.prototype.setControl = function(magoManager)
{
	this.magoManager = magoManager;

	if (this.magoManager.isCesiumGlobe())
	{
		//var creditDisplay = this.magoManager.scene.frameState.creditDisplay;
		//var mago3d_credit = new Cesium.Credit('<a href="http://www.mago3d.com/" target="_blank"><img class="mago3d_logo" src="/images/logo_mago3d.png" title="Mago3D" alt="Mago3D" /></a>', true);
		//creditDisplay.addDefaultCredit(mago3d_credit);
	}
	else 
	{
		var target = this.target ? this.target : this.magoManager.overlayContainer;
	    target.appendChild(this.element);
	}
};