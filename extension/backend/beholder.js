"use strict";
const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
const $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`;
const $client = ( function () { try { return browser; } catch ( e ) { return chrome; } } )();

class Header {
    constructor ( httpHeader ) {
        for ( const field of httpHeader ) this.write( field );
        Object.defineProperties( this, { modified: { value: false, configurable: true } } );
    }

    write ( { name, value } ) {
        Object.defineProperties( this, { modified: { value: true, configurable: true } } );
        let key = name.toLowerCase();
        if ( value ) {
            switch ( key ) {
                case "cache-control":
                    this[key] = ( this[key] ? `${this[key]}, ` : "" ) + value;
                    break;
                case "set-cookie":
                    if ( !this[key] ) this[key] = [];
                    this[key].push( value );
                    break;
                default:
                    this[key] = value;
            }
        }
        else delete this[key];

        return { [key]: this[key] };
    }

    get arrayform () {
        let httpHeader = [];
        for ( const [ name, value ] of Object.entries( this ) ) {
            if ( value instanceof Array ) for ( const item of value ) httpHeader.push( { name, value: item } );
            else httpHeader.push( { name, value } );
        }

        return httpHeader;
    }
}

class Downloader {
    constructor () {
        Object.defineProperties( this, {
            api: { value: $client.downloads },
        } );
    }

    save ( download ) {
        const $api = ( () => {
            try { browser; return this.api.download; }
            catch ( e ) { return ( download ) => new Promise( resolve => this.api.download( download, resolve ) ) }
        } )();
        if ( download.blob ) {
            if ( download.blob instanceof Blob && blob.size ) {
                download.url = URL.createObjectURL( download.blob );
            }
            delete download.blob;
        }
        return $api( download ).then( () => URL.revokeObjectURL( download.url ) );
    }
}

$client.webRequest.onBeforeRequest.addListener(
    ( { url, initiator, originUrl } ) => {
        const origin = initiator || originUrl;
        if ( origin ) {
            try {
                const host = origin.match( /https?:/ )[0].toLowerCase();
                if ( host === "https:" && host !== url.match( /https?:/ )[0].toLowerCase() ) {
                    return { redirectUrl: url.replace( /https?:/, "https:" ) };
                }
            }
            catch ( e ) {
                console.log( `%c${origin}`, $alert );
            }
        }
    },
    { urls: [ '*://*/*' ] },
    [ 'blocking' ]
);

$client.webRequest.onBeforeSendHeaders.addListener(
    ( details ) => {
		const header = new Header( details.requestHeaders );
		for ( const modifier of headerModifier ) {
			if ( modifier.filter( details, header ) ) {
				for ( const field of modifier.fields ) {
					header.write( ( field instanceof Function ? field( details, header ) : field ) );
				}
			}
		}
		if ( header.modified ) return { requestHeaders: header.arrayform };
    },
    { urls: [ '*://*/*' ] },
    [ 'blocking', 'requestHeaders' ]
);

const headerModifier = [
    {
        filter: ( details, header ) => true ,
        fields: [
            ( { initiator, originUrl }, header ) => {
                let value;
                if ( "access-control-allow-credentials" in header ) value = ( initiator || originUrl || "" );
                else value = "*";
                return { name: "Access-Control-Allow-Origin", value };
            },
        ]
    },
    {
        filter: ( details, { location } ) => Boolean( location ),
        fields: [
            ( { url, initiator, originUrl, requestId }, { location } ) => {
                const origin = initiator || originUrl;
                let value = location;
                if ( origin ) {
                    const host = origin.match( /https?:/ )[0].toLowerCase();
                    if ( host === "https:" ) value = location.replace( /https?:/i, "https:" );
                }
                return { name: "Location", value };
            },
        ]
    }
];
$client.webRequest.onHeadersReceived.addListener(
    ( details ) => {
		const header = new Header( details.responseHeaders );
		for ( const modifier of headerModifier ) {
			if ( modifier.filter( details, header ) ) {
				for ( const field of modifier.fields ) {
					header.write( ( field instanceof Function ? field( details, header ) : field ) );
				}
			}
		}
		if ( header.modified ) return { responseHeaders: header.arrayform };
    },
    { urls: [ '*://*/*' ] },
    [ 'blocking', 'responseHeaders' ]
);

function loadDefault ( { reason, previousVersion, id } ) {
    if ( reason === "install" || reason === "update" ) {
        console.log( `%cReset configuration`, $log );
        $client.storage.local.clear();
        $client.storage.local.set( {
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
            },
            lang: "ko-kr",
            generalExpression: "(?<title>.+)\\s+(?<subTitle>(?:\\d+화)|(?:[\\d\\s\\-\\~화권])|(?:\\(?\\[?단편\\]?\\)?.+))",
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
                    RegExp: "(brotoon|newtoki)\\.com/.+?/\\d+$|(brotoon|newtoki)\\.com/.+?\\?.+?spage",
                    rule: {
                        moveNext: "a[title*=다음]",
                        movePrev: "a[title*=이전]",
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
                    RegExp: "mangashow.me/bbs/board.php.+?wr_id",
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
                    RegExp: "jmana2.com/book/\\d+/\\d+",
                    HTTPMod: {
                        onBeforeSendHeaders: {}
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
                        moveNext: ".bottom_nav > .first",
                        movePrev: ".bottom_nav > .last",
                        subject: {
                            title: {
                                selector: ".directory > a",
                                propertyChain: ".textContent"
                            },
                            subTitle: {
                                selector: ".directory",
                                propertyChain: ".lastChild.textContent"
                            },
                        },
                        images: ".view-content > img",
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
                        images: ".view-content > img",
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
        } );
    }
}

const $downloader = new Downloader();
$client.runtime.onMessage.addListener(
    ( message, sender, sendResponse ) => {
        switch ( message.type ) {
            case "saveToLocal": {
                $downloader.save( message.download )
                    .then( () => $client.tabs.sendMessage( sender.tab.id, { type: "ComicGrabber.archiveSaved" } ) );
                break;
            }
            case "resetConfiguration": {
                loadDefault( { reason: "install" } );
                break;
            }
        }
    }
);

$client.runtime.onInstalled.addListener( loadDefault );