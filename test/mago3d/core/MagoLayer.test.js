/* eslint-disable strict */
describe("MagoLayer", function () 
{
    var mockLayer = {};
    describe('생성자 테스트 : ', function () 
	{
        it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
        {
            expect(function () 
            {
                MagoLayer();
            }).toThrowError(Messages.CONSTRUCT_ERROR);
        });
        describe('필수속성이 없을 경우 : ', function () {
            it('empty', function () 
            {
                expect(function(){
                    new MagoLayer(mockLayer);
                }).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
            });

            it('dataGroupKey', function () 
            {
                expect(function(){
                    mockLayer.dataGroupId = 'abc';
                    new MagoLayer(mockLayer);
                }).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupKey'));
            });
            it('dataGroupName', function ()
            {
                expect(function(){
                    mockLayer.dataGroupId = 'abc';
                    mockLayer.dataGroupKey = 'abc';
                    new MagoLayer(mockLayer);
                }).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupName'));
            });
            it('dataGroupPath', function ()
            {
                expect(function(){
                    mockLayer.dataGroupId = 'abc';
                    mockLayer.dataGroupKey = 'abc';
                    mockLayer.dataGroupName = 'abc';
                    new MagoLayer(mockLayer);
                }).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupPath'));
            });
        });
    });

});