'use strict';

/**
 * IE 5.5+, Firefox, Opera, Chrome, Safari XHR object
 * 
 * @param string url
 * @param object callback
 * @param mixed data
 * @param null x
 */
function getPromiseXHR(url, callback, data, x) 
{
	var x = new(XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
	return new Promise( function (resolve, reject)
	{
		try 
		{
			x.open(data ? 'POST' : 'GET', url, 1);
			x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			x.overrideMimeType("application/json");
			x.onreadystatechange = function () 
			{
				x.readyState > 3 && x.statusText === 'OK' && resolve(x.response);
				x.statusText !== 'OK' &&  reject(x);
			};
			x.send(data);
		}
		catch (e) 
		{
			window.console && console.log(e);
		}
	});
};