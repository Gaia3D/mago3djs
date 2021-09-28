'use strict';

/**
 *
 * @param {*} value The object.
 * @returns {Boolean} Returns true if the object is defined, returns false otherwise.
 */
var createWorker = function (url) 
{
	var worker = null;
	try 
	{
		worker = new Worker(url);
		worker.onerror = function (event) 
		{
			event.preventDefault();
			worker = createWorkerFallback(url);
		};
	}
	catch (e) 
	{
		worker = createWorkerFallback(url);
	}

	function createWorkerFallback (workerUrl) 
	{
		var _worker = null;
		try 
		{
			var blob;
			try 
			{
				blob = new Blob(["importScripts('" + workerUrl + "');"], { "type": 'application/javascript' });
			}
			catch (e) 
			{
				var blobBuilder = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
				blobBuilder.append("importScripts('" + workerUrl + "');");
				blob = blobBuilder.getBlob('application/javascript');
			}
			var urlInterface = window.URL || window.webkitURL;
			var blobUrl = urlInterface.createObjectURL(blob);
			_worker = new Worker(blobUrl);
		}
		catch (e1) 
		{
			//if it still fails, there is nothing much we can do
		}
		return _worker;
	}
};