1 프로젝트명
 - maog3djs 

2 디렉토리
 - data 					: f4d 데이터가 저장됨
 - build 					: gulp를 이용해서 project를 build 하면 자동 생성되는 디렉토리.... git ignore
   build/mago3d 			: javascript 파일을 압축 혹은 통합한 min 파일이 저장되는
   build/documentaion 		: jsdoc으로 자동 생성
 - external					: 외부 javascript library를 저장
   external/jasime			: jasmine 테스트 라이브러리
 - sample 					: 우리 프로젝트 사용예제들을 저장
 - node_modules 			: node package......... git ignore
 - src/engine				: cesium
   src/engine/cesium		: cesium customizing source
   src/mago3d				: javascript 소스
   src/mago3d/images		: 이미지 폴더
 - test						: 테스트 소스..... jasmine은 spec 이란 이름을 사용하지만... 범용적으로 테스트라고 함

2 개발환경
 - java8
 - eclipse neon(필수)
 - node
 
3 아키텍처
 gulp, karma, jasmine(mocha + chai), jsdoc, eslint 
 
4 웹서버 설정
apache lounge를 다운 받아서 설치 했음

1 httpd.conf
 - 아파치 홈 디렉토리
 ServerRoot "c:/apache"

ServerName localhost:80

 DocumentRoot "C:\git\repository\geomartian"



eclipse node plugin을 사용하는 경우
server.js를 cesium 꺼 복사해서 돌려 보니 잘 된다.
port만 80번으로 변경 했는데...

나중에 어떤걸 사용할지 결정해야 함