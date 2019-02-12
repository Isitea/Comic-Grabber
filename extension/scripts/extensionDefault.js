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
            name: "mangashow",
            RegExp: "mangashow.+me/bbs/board.php.+?wr_id",
            HTTPMod: {
                redirections: {
                    type: 'cancel',
                    filter: "mangashow.+me.+?viewer.+?js"
                }
            },
            rule: {
                moveNext: ".chapter_next",
                movePrev: ".chapter_prev",
                subject: {
                    title: {
                        selector: ".head .subject h1",
                        propertyChain: ".textContent",
                    },
                    subTitle: {
                        selector: ".chapter_selector [selected]",
                        propertyChain: ".textContent",
                    },
                },
                images: ".view-content img",
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
            name: "marumaru - ur18",
            RegExp: "marumaru\\d+.com(.+bo_table=maru_view|.+wr_id){2,2}",
            rule: {
                moveNext: ".btn-group > a[title*=다음]",
                movePrev: ".btn-group > a[title*=이전]",
                subject: {
                    title: {
                        selector: ".view-wrap strong",
                        propertyChain: ".textContent"
                    },
                },
                images: ".view-content img",
            }
        },
        {
            name: "marumaru - r18",
            RegExp: "marumaru01.com(.+bo_table=manga|.+wr_id){2,2}",
            rule: {
                moveNext: null,
                movePrev: null,
                subject: {
                    title: {
                        selector: ".view-wrap h1:first-child",
                        propertyChain: ".textContent"
                    },
                    subTitle: {
                        selector: ".view-wrap h1:first-child",
                        propertyChain: ".textContent"
                    },
                },
                images: ".view-content img",
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