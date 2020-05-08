/* eslint-disable strict */
describe("MagoLayerCollection", function () 
{
    describe('생성자 테스트 : ', function () 
	{
        it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
        {
            expect(function () 
            {
                MagoLayerCollection();
            }).toThrowError(Messages.CONSTRUCT_ERROR);
        });
    });

    describe('메소드 테스트 : ', function () {
        var collection = new MagoLayerCollection();
        describe('add ', function () {
            it('empty', function () 
            {
                expect(function () 
                {
                    collection.add();
                }).toThrowError(Messages.REQUIRED_EMPTY_ERROR('layer'));
                
            });
            it('invalid case', function () 
            {
                expect(function () 
                {
                    collection.add({});
                }).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
            });
            it('standard', function () 
            {
                var layer = {
                    dataGroupId :1,
                    dataGroupKey :'edc',
                    dataGroupName :'이디시',
                    dataGroupPath :'abc/edc/'
                }
                collection.add(layer);
            });
        });
    });
});