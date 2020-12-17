"use strict";
const $extensionDefault = {
    keyboard: {
        download: "KeyD",
        moveNext: "ArrowRight",
        movePrev: "ArrowLeft",
    },
    session: {
        saveOnLoad: false,
        moveOnSave: false,
        imageType: "png",
    },
    local: {
        savePath: "Downloaded comics",
        onConflict: "overwrite",
        filenameRule: '${localPath}/${title}${( title !== subTitle ? "/" + subTitle : "" )}',
    },
    lang: "ko-kr",
    generalExpression: "^(?<title>.+)\\s+(?<subTitle>(?:[\\d\\s\\-\\~화권]+)|(?:(?:번외|특별).+)|(?:\\(?\\[?단편\\]?\\)?.+))",
    rules: [
        {
            name: "mana02",
            RegExp: "mana\\d+.com/board/webtoon/view/wr_id",
            rule: {
                moveNext: ".fa.fa-arrow-circle-right",
                movePrev: ".fa.fa-arrow-circle-left",
                subject: {
                    title: {
                        selector: "#topnavi .fa-home",
                        propertyChain: ".textContent",
                        exp: "(.+?)\\s+\\d+화.+\\(.+\\)",
                    },
                    subTitle: {
                        selector: "#topnavi .fa-home",
                        propertyChain: ".textContent",
                        exp: "(?:.+?)\\s+(\\d+화).+\\(.+\\)",
                    },
                },
                images: ".content #about .inner img",
            }
        },
        {
            name: "Naver comic",
            RegExp: "comic\\.naver\\.com/.+?/detail\\.nhn.+?titleId",
            rule: {
                moveNext: ".next a",
                movePrev: ".pre a",
                subject: {
                    title: {
                        selector: ".comicinfo .detail h2:first-child",
                        propertyChain: ".firstChild.textContent",
                    },
                    subTitle: {
                        selector: ".tit_area .view h3",
                        propertyChain: ".textContent",
                    },
                },
                images: ".view_area .wt_viewer img",
            }
        },
        {
            name: "newtoki/brotoon",
            RegExp: "(brotoon|newtoki|nottoki).+\\/.+?(?:\\/\\d+(?:[^\\/]+)?|\\?.+?wr_id)",
            rule: {
                moveNext: "a[alt*=다음]",
                movePrev: "a[alt*=이전]",
                subject: {
                    title: {
                        selector: ".page-desc",
                        propertyChain: ".textContent"
                    },
                },
                images: ".view-padding .view-content img, .view-img img",
            }
        },
        {
            name: "marumaru",
            RegExp: "marumaru.*\\.\\w{3,4}",
            HTTPMod: {
                redirections: {
                    type: 'cancel',
                    filter: "manamoa.+net.+?viewer.+?js"
                }
            },
            rule: {
                moveNext: ".chapter_next",
                movePrev: ".chapter_prev",
                subject: {
                    title: {
                        selector: ".view-wrap h1",
                        propertyChain: ".nextElementSibling.firstChild.textContent",
                    },
                },
                eraser: ".w_banner { display: none !important; }",
                images: ".view-content img, .view-content canvas",
            }
        },
        {
            name: "mana",
            RegExp: "manastaynight[\\w\\d]+.blogspot.com/\\d+/\\d+",
            rule: {
                moveNext: null,
                movePrev: null,
                subject: {
                    title: {
                        selector: "h3.post-title.entry-title",
                        propertyChain: ".firstChild.textContent"
                    },
                },
                images: "a[imageanchor] > img",
            }
        },
        {
            name: "jmana",
            RegExp: "jmana2.com\\/book2\\/",
            HTTPMod: {
                redirections: {
                    type: 'redirect',
                    filter: "jmana3.com\\/book\\/",
                    redirectTo: [ "jmana3.com\\/book\\/", "jmana2.com/book2/" ]
                }
            },
            rule: {
                moveNext: ".col-12 .pull-left a",
                movePrev: ".col-12 .pull-right a",
                subject: {
                    title: {
                        selector: ".breadcrumb .breadcrumb_list",
                        propertyChain: ".textContent"
                    },
                    subTitle: {
                        selector: ".breadcrumb #breadcrumb_detail",
                        propertyChain: ".textContent"
                    },
                },
                images: "#maincontent > img",
            }
        },
        {
            name: "Daum webtoon",
            RegExp: "webtoon\\.daum\\.net/webtoon/viewer/\\d+",
            rule: {
                moveNext: "a.btn_comm.btn_next",
                movePrev: "a.btn_comm.btn_prev",
                subject: {
                    title: {
                        selector: ".list_info .txt_title .link_title",
                        propertyChain: "a.textContent"
                    },
                    subTitle: {
                        selector: ".list_info .txt_episode",
                        propertyChain: ".textContent"
                    },
                },
                images: ".cont_view#imgView > img",
            },
            $delay: 625,
            $await: 
`"use strict";
addEventListener( "message", async ( { data: uri } ) => {
let response = await fetch( uri.replace( /(https:?\\/\\/).+\\/(\\d+)$/, "$1webtoon.daum.net/data/pc/webtoon/viewer/$2" ) );
let blob = await response.blob();
postMessage( blob );
close();
} );`
        },
    ]
};

export { $extensionDefault }