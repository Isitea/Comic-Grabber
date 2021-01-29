"use strict";
const moduleList = [
    {
        moduleName: "marumaru",
        buildDate: "2020-12-24 18:00",
        matchPattern: /marumaru.*\.\w+\//,
        uri: "/modules/marumaru.js",//for Dev.
    },
    {
        moduleName: "manatoki",
        buildDate: "2021-01-07 16:00",
        matchPattern: /manatoki.*\.\w+\//,
        uri: "/modules/manatoki.js",
    },
    {
        moduleName: "naver comic",
        buildDate: "2021-01-06 18:00",
        matchPattern: /comic\.naver\.com\/.+?\/detail\.nhn.+?titleId/,
        uri: "/modules/naverComic.js",
    },
    {
        moduleName: "daum webtoon",
        buildDate: "2021-01-17 18:00",
        matchPattern: /webtoon\.daum\.net\/(?:webtoon|league)\/viewer\/\d+/,
        uri: "/modules/daumWebtoon.js",
    },
    {
        moduleName: "11toonn",
        buildDate: "2021-01-06 20:00",
        matchPattern: /11toon.*?\/content\/(?<id>\d+)\/(?<parent>\d+)\?.*page=toon/,
        uri: "/modules/11toonn.js",
    },
    {
        moduleName: "jmana",
        buildDate: "2021-01-17 18:00",
        matchPattern: /jmana.*\.\w+\//,
        uri: "/modules/jmana.js",
    },
//    {
//        moduleName: "dcinside",
//        buildDate: "2021-01-28 18:00",
//        matchPattern: /\.dcinside\./,
//        uri: "/modules/dcinside.js",
//    },
    {
        moduleName: "kakao page",
        buildDate: "2021-01-29 20:00",
        matchPattern: /page\.kakao\.com\/viewer\?productId/,
        uri: "/modules/kakaoPage.js",
    },
    {
        moduleName: "universalTool",
        buildDate: "2021-01-21 16:00",
        matchPattern: /.+/,
        uri: "/modules/universal.js",
    },
];

export { moduleList };