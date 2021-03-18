'use strict';

var worker = self;

// Pass object by reference from/to webworker
// https://developers.redhat.com/blog/2014/05/20/communicating-large-objects-with-web-workers-in-javascript/

worker.onmessage = function (e) 
{
    var dataArrayBuffer = e.data.dataArrayBuffer;
	var bytesReaded = 0;


};