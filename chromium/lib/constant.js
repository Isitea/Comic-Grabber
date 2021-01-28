"use strict";
const constant = {
    __loaded__: "loaded",
    __ready__: "ready",
    __download__: "download",
    __downloading__: "downloading",
    __downloaded__: "downloaded",
    __nothing__: "(no image detected)",
    __caution__: "something to notify",
    autoCategorize: true,
    includeTitle: false,
    autoRename: false,
};
Object.freeze( constant );
const genEx = /^(?<title>.+?|(?:[\(\[]?단편[\]?\)]?.+?))\s*(?<episode>(?:\d[.\d\s\-\∼\~화권전후편상중하]+|(?:번외|특별).+)|(?:\#\d+)|(stage\s*\d+))?$/i

export { constant, genEx };