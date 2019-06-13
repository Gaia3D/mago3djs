'use strict';

/**
 * Factory method 패턴을 사용해서 cesium, worldwind 등을 wrapping 해 주는 클래스
 * @class ManagerFactory
 */
var ManagerFactory2 = function(containerId, policyPath) 
{
	var that = this;
	this.target = containerId;
	this.policyPath = policyPath;

	var ready = new Promise( function ()
	{
		that.init();
	});
	console.info(ready);
	ready.then(function(e){
		console.info('end');
	})
};
ManagerFactory2.prototype = new Observer();
ManagerFactory2.prototype.constructor = ManagerFactory2;

ManagerFactory2.prototype.init = function ()
{
	var that = this;

	var serverPolicy = getPromiseXHR(that.policyPath);
	that.notify('policyloadstart' ,'loat start!');

	serverPolicy.then(function(e){
		that.notify('policyloadend', e);
	});
}; 
