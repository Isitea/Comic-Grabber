"use strict";
import { wRList } from "./wRList.js";
const moduleList = [
    {
        moduleName: "manatoki",
        buildDate: "2021-01-07 16:00",
        matchPattern: /(mana|new)toki.*\.\w+\//,
        uri: "/modules/manatoki.js",
    },
    {
        moduleName: "naver comic",
        buildDate: "2021-01-06 18:00",
        matchPattern: /comic\.naver\.com\/.+?\/detail(\.nhn)?.+?titleId/,
        uri: "/modules/naverComic.js",
    },
    {
        moduleName: "daum webtoon",
        buildDate: "2021-01-17 18:00",
        matchPattern: /webtoon\.daum\.net\/(?:webtoon|league)\/viewer\/\d+/,
        uri: "/modules/daumWebtoon.js",
    },
];

export { moduleList };