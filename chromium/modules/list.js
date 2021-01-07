"use strict";
const moduleList = [
    {
        moduleName: "marumaru",
        buildDate: "2020-12-24 18:00",
        matchPattern: /marumaru.*\.\w+\//,
        uri: "/modules/marumaru.js",//for Dev.
    },
    {
        moduleName: "naver comic",
        buildDate: "2021-01-06 18:00",
        matchPattern: /comic\.naver\.com\/.+?\/detail\.nhn.+?titleId/,
        uri: "/modules/naverComic.js",
    },
    {
        moduleName: "daum webtoon",
        buildDate: "2021-01-06 18:00",
        matchPattern: /webtoon\.daum\.net\/webtoon\/viewer\/\d+/,
        uri: "/modules/daumWebtoon.js",
    },
    {
        moduleName: "11toonn",
        buildDate: "2021-01-06 20:00",
        matchPattern: /11toon.*?\/content\/(?<id>\d+)\/(?<parent>\d+)\?.*page=toon/,
        uri: "/modules/11toonn.js",
    },
];

export { moduleList };