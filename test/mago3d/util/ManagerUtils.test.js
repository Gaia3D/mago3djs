/* eslint-disable strict */

describe('ManagerUtils test : ', function() 
{
	var testPoint;
	var testGeographicCoord;

	var testResultPointUndefined;
	var testResultGeographicCoordUndefined;

	var testResultPointInstance;
	var testResultGeographicCoordInstance;

	var testLat = 37.581899408197266;
	var testLon = 126.90127536589439;
	var testAlt = -1.4179975027284853e-9;
	var testX = -3038736.4234381397;
	var testY = 4047029.3054877245;
	var testZ = 3868771.59308859;

	/*var customMatchers = {
        checkType: function(util, customEqualityTesters) {
            return {
                compare: function(actual, expected) {
                    var result = {};
                    if (expected === undefined) {
                        result.pass = false;
                        result.message = "Illegal Expected.";
                        
                        return result;
                    }
                    
                    result.pass = actual instanceof expected;
                    if (result.pass) {
                        result.message = "actual type equal expected";
                    } else {
                        result.message = "actual type not equal expected";
                    }
                    return result;
                }
            };
        }
    };*/

	beforeEach(function()
	{
		//jasmine.addMatchers(customMatchers);
		testPoint = new Point3D(testX, testY, testZ);
		testGeographicCoord = new GeographicCoord(testLon, testLat, testAlt);
		testResultPointInstance = new Point3D();
		testResultGeographicCoordInstance = new GeographicCoord();
	});

	describe('pointToGeographicCoord : world coordinate to geographic coordinate', function() 
	{
		var result;
		beforeEach(function()
		{
			result = ManagerUtils.pointToGeographicCoord(testPoint);
		});

		it('case1 : is result GeographicCoord?', function()
		{
			expect(result instanceof GeographicCoord).toEqual(true);
		});

		it('case2 : result value check', function()
		{
			expect(result.longitude).toEqual(testLon);
			expect(result.latitude).toEqual(testLat);
			expect(result.altitude).toEqual(testAlt);
		});

		/*it('case3 : When world coordinate is undefined', function(){
            var captured = null;
            try {
                ManagerUtils.pointToGeographicCoord();
            } catch(e) {
                console.info(e);
                captured = e;
            }
            expect(captured).toBe(null);
        });*/
	});
});