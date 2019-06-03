/* eslint-disable strict */

describe("SmartTileManager 테스트", function () 
{
    var smartTileManager;

    describe('객체 생성 시', function()
    {
        it('new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
        {
            expect(function () 
            {
                return SmartTileManager();
            }).toThrowError(Error);
        });

        beforeEach(function()
		{
            smartTileManager = new SmartTileManager();
        });

        it('createMainTiles가 실행되어 tilesArray의 길이가 2여야함.', function()
        {
            expect(smartTileManager.tilesArray.length === 2).toBeTruthy();
        });
    });

    describe('메소드 검사 : ', function()
    {
        
        describe('newSmartTile(smartTileName) 테스트', function()
        {
            var orgTileLength = 0;
            var totalLength = 0;
            var newSmartTileCallCnt = 5;
            var tileNameTemplate = 'noname';

            beforeEach(function()
            {
                smartTileManager = new SmartTileManager();
                orgTileLength = smartTileManager.tilesArray.length; 
                for(var i=0;i<newSmartTileCallCnt;i++)
                {
                    smartTileManager.newSmartTile(tileNameTemplate+i);
                }

                totalLength = orgTileLength + newSmartTileCallCnt;
            });

            it('this.tilesArray 길이 체크', function(){
                expect(smartTileManager.tilesArray.length).toEqual(totalLength);
            });

            it('this.tilesArray 요소 체크', function(){
                for(var i=orgTileLength; i<totalLength; i++){
                    var tile = smartTileManager.tilesArray[i];
                    expect(tile instanceof SmartTile).toBeTruthy();
                }
            });
        })
    });
});