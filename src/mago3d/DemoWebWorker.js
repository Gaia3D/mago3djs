// http://www.smartjava.org/content/html5-easily-parallelize-jobs-using-web-workers-and-threadpool
/*
 * 









 * 
 */



var i = 0;

function timedCount() {
	i = i + 1;
	postMessage(i);
	setTimeout("timedCount()",500);
}

timedCount();