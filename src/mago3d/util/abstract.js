'use strict';

function abstract() 
{
	return  ((function() 
	{
		throw new Error('Unimplemented abstract method.');
	})());
}