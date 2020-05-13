/* eslint-disable strict */

describe('speed test : ', function() 
{
	// Create two arrays of same length - one to hold keys, one to hold values
	// Keys and values will be randomly generated sequences of characters
	const N = 20000; // The total number of key/value pairs to test
	const keys = [];
	const values = [];


	// Generate a random string of specified number of characters
	function makeid(numChars) 
	{
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

		for (var i = 0; i < numChars; i++) 
		{
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	}

	// Generate test K/V pairs
	for (let i = 0; i < N; i++) 
	{
		keys.push(makeid(7));
		values.push(makeid(7));
	}
    

	// Initiate the test Object and Map
	const testObj = {};
	const testMap = new Map();

	describe('set', function() 
	{
		it('case1 : set map', function()
		{
			let startSetMapTime = new Date().getTime();
			for (let mapWriteIt = 0; mapWriteIt < N; mapWriteIt++) 
			{
				testMap.set(keys[mapWriteIt], values[mapWriteIt]);
			}
			let endSetMapTime = new Date().getTime();
		});
        
		it('case2 : set obj', function()
		{
			let startSetObjTime = new Date().getTime();
			for (let objWriteIt = 0; objWriteIt < N; objWriteIt++) 
			{
				testObj[keys[objWriteIt]] = values[objWriteIt];
			}
			let endSetObjTime = new Date().getTime();
		});
	});
	describe('get', function() 
	{
		it('case1 : get map', function()
		{
			let startGetMapTime = new Date().getTime();
			let mapReader;
			for (let mapReadIt = 0; mapReadIt < N; mapReadIt++) 
			{
				mapReader = testMap.get(keys[mapReadIt]);
			}
			let endGetMapTime = new Date().getTime();
		});
		it('case2 : get obj', function()
		{
			let startGetObjTime = new Date().getTime();
			let objReader;
			for (let objReadIt = 0; objReadIt < N; objReadIt++) 
			{
				objReader = testObj[keys[objReadIt]];
			}
			let endGetObjTime = new Date().getTime();
		});    
	});
});