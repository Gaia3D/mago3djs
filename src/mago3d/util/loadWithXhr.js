'use strict';

/**
 *
 * @param {String} url Required.
 * @param {XMLHttpRequest} xhr Optional.
 * @param {number} timeOut Optional. timeout time. milliseconds
 * @param {String} responseType Optional. Default is 'arraybuffer'
 * @param {String} method Optional. Default is 'GET'
 * 
 * @returns {Promise} Promise.js object
 *
 * @example
 * loadWithXhr('url', undefined, undefined, 'json', 'GET').done(function(res) {
 * 	TODO
 * });
 */
var loadWithXhr = function (url, xhr, timeOut, responseType, method) 
{
	if (!defined(url))
	{
		throw new Error('url required');
	}

	return new Promise(
		function (resolve, reject) 
		{
			if (xhr === undefined)
			{ xhr = new XMLHttpRequest(); }

			method = method ? method : 'GET';
			xhr.open(method, url, true);
			xhr.responseType = responseType ? responseType : 'arraybuffer';

			if (url.endsWith('.geojson') || url.endsWith('layer.json')) 
			{
				xhr.overrideMimeType("application/json");
				  //xhr.setRequestHeader("Accept-Encoding", "gzip");
			}

			var isJson = responseType === 'json';
			var userAgent = window.navigator.userAgent;
			var isIE = userAgent.indexOf('Trident') > -1;
			 // time in milliseconds
			if (timeOut !== undefined)
			{ xhr.timeout = timeOut; }
			
			// 이벤트 핸들러를 등록한다.
			xhr.onload = function() 
			{
				if (xhr.status < 200 || xhr.status >= 300) 
				{
					reject(xhr.status);
				}
				else 
				{
					var response = (isJson && isIE) ? JSON.parse(xhr.response) : xhr.response;
					// 3.1) DEFERRED를 해결한다. (모든 done()...을 동작시킬 것이다.)
					resolve(response);
				} 
			};
			
			xhr.ontimeout = function (e) 
			{
				// XMLHttpRequest timed out.***
				reject(-1);
			};
			
			xhr.onerror = function(e) 
			{
				console.log("Invalid XMLHttpRequest response type.");
				reject(xhr.status);
			};

			// 작업을 수행한다.
			xhr.send(null);
		}
	);
};