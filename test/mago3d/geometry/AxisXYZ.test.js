/* eslint-disable strict */

describe('AxisXYZ', function() 
{
	var testAxisXYZ;
	var test2AxisXYZ;
    var length = 10.0;

	beforeEach(function()
	{
		testAxisXYZ = new AxisXYZ();
		test2AxisXYZ = new AxisXYZ(70);
	});

	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 한다.', function()
	{
		expect(function ()
		{
			return AxisXYZ();
		}).not.toThrowError('이 객체는 new 키워드를 사용하여 생성해야 합니다.');
	});

	it('객체 생성시 기본값은 60의 값을 갖는다.', function() 
	{
		expect(testAxisXYZ.length).toEqual(60);
	});
	
	it('객체 생성시 매개변수의 값을 갖는다.', function()
	{
		expect(test2AxisXYZ.length).toEqual(70);
	});
    
    describe('setDimension(length)', function()
    {
        if('입력된 값으로 설정 ', function()
        {
            testAxisXYZ.setDimension(10);
            expect(testAxisXYZ.length).toEqual(10);
        });
	});

});