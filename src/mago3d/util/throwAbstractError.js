'use strict';

var throwAbstractError =function () 
{
	return  ((function() 
	{
		throw new Error('Unimplemented abstract method.');
	})());
};