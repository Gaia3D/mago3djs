/* eslint-disable strict */

describe("MagoManager 테스트", function () 
{
	var magoManager = new MagoManager();
	MagoConfig.serverPolicy = {};
	describe('메소드 테스트 : ', function () 
	{
		describe('getObjectIndexFile(projectId, projectDataFolder)', function()
		{
			var rw;
			beforeEach(function()
			{
				rw = magoManager.readerWriter;
				spyOn(rw, 'getObjectIndexFileForSmartTile');
			});

			it(' 실행 시 readerwriter.getObjectIndexFileForSmartTile 수행 여부 체크', function()
			{
				magoManager.getObjectIndexFile('', '');
				expect(rw.getObjectIndexFileForSmartTile).toHaveBeenCalled();
			});
		});
	});
});