/* eslint-disable strict */
describe("MagoLayer", function () 
{
	var mockLayer = {};
	var layer;
	describe('생성자 테스트 : ', function () 
	{
		it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
		{
			expect(function () 
			{
				layer = MagoLayer();
			}).toThrowError(Messages.CONSTRUCT_ERROR);
		});
		describe('필수속성이 없을 경우 : ', function () 
		{
			it('empty', function () 
			{
				expect(function()
				{
					layer = new MagoLayer(mockLayer);
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
			});

			it('dataGroupKey', function () 
			{
				expect(function()
				{
					mockLayer.dataGroupId = 'abc';
					layer = new MagoLayer(mockLayer);
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupKey'));
			});
			it('dataGroupName', function ()
			{
				expect(function()
				{
					mockLayer.dataGroupId = 'abc';
					mockLayer.dataGroupKey = 'abc';
					layer = new MagoLayer(mockLayer);
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupName'));
			});
			it('dataGroupPath', function ()
			{
				expect(function()
				{
					mockLayer.dataGroupId = 'abc';
					mockLayer.dataGroupKey = 'abc';
					mockLayer.dataGroupName = 'abc';
					layer = new MagoLayer(mockLayer);
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupPath'));
			});
		});
	});

});