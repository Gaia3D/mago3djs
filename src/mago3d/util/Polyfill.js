'use strict';

var Polyfill = (function(w) 
{
	Math.log2 = Math.log2 || function(x) 
	{
		return Math.log(x) * Math.LOG2E;
	};
	Math.cbrt = Math.cbrt || function(x) 
	{
		var y = Math.pow(Math.abs(x), 1/3);
		return x < 0 ? -y : y;
	};
    
	w.URLSearchParams = w.URLSearchParams || function (searchString) 
	{
		var self = this;
		self.searchString = searchString;
		self.get = function (name) 
		{
			var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(self.searchString);
			if (results === null) 
			{
				return null;
			}
			else 
			{
				return decodeURI(results[1]) || 0;
			}
		};
	};
})(window);