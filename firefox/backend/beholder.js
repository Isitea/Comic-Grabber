"use strict";
import './../scripts/library.extend.js';
const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
const $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`;
const $client = ( function () { try { return browser; } catch ( e ) { return chrome; } } )();

class Header {
    constructor ( httpHeader ) {
        for ( const field of httpHeader ) this.write( field );
        Object.defineProperties( this, { modified: { value: false, configurable: true } } );
    }

    read ( name ) {
        return this[ name.toLowerCase() ];
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
    save ( download ) {
        const $api = ( () => {
            try { browser; return $client.downloads.download; }
            catch ( e ) { return ( download ) => new Promise( resolve => $client.downloads.download( download, resolve ) ) }
        } )();
        if ( download.blob ) {
            if ( download.blob instanceof Blob && blob.size ) {
                download.url = URL.createObjectURL( download.blob );
            }
            delete download.blob;
        }
        for ( const part of download.filename.split( "/" ) ) {
            if ( part !== part.toFilename() ) return Promise.reject();
        }
        return $api( download ).then( id => new Promise( ( resolve, reject ) => {
            let onComplete = ( item ) => {
                if ( item.id === id && item.state ) {
                    switch ( item.state.current ) {
                        case "complete": {
                            if ( item.state.current === "complete" ) {
                                URL.revokeObjectURL( download.url )
                                $client.downloads.onChanged.removeListener( onComplete );
                                resolve( item.state );
                            }
                            break;
                        }
                        case "interrupted": {
                            $client.downloads.onChanged.removeListener( onComplete );
                            reject( item.state );
                            break;
                        }
                    }
                }
            };
            $client.downloads.onChanged.addListener( onComplete );
        } ) );
    }
}

const redirections = [
];
function onBeforeRequest ( details ) {
    for ( const item of redirections ) {
        if ( item.filter( details ) ) return { redirectUrl: item.redirectTo( details ) }
    }
}
$client.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    { urls: [ '*://*/*' ] },
    [ 'blocking' ]
);

const responseHeadersModifier = [
    {
        filter: ( { type, details }, header ) => type === "xmlhttprequest",
        fields: [
            ( { initiator, originUrl, ...details }, header ) => {
                const origin = initiator || originUrl;
                let value;
                if ( header.read( "Access-Control-Allow-Credentials" ) === "true" ) value = origin || header.read( "Access-Control-Allow-Origin" );
                else value = "*";
                return { name: "Access-Control-Allow-Origin", value };
            },
        ]
    },
    {
        filter: ( { type, ...details }, { location } ) => Boolean( location ) && type === "xmlhttprequest",
        fields: [
            ( { initiator, originUrl, ...details }, { location } ) => {
                const origin = initiator || originUrl;
                let value = location;
                if ( origin && origin.match( /https?:/ ) ) {
                    const host = origin.match( /https?:/ )[0].toLowerCase();
                    if ( host === "https:" ) value = location.replace( /https?:/i, "https:" );
                }
                return { name: "Location", value };
            },
        ]
    }
];
function onHeadersReceived ( details ) {
    const header = new Header( details.responseHeaders );
    for ( const modifier of responseHeadersModifier ) {
        if ( modifier.filter( details, header ) ) {
            for ( const field of modifier.fields ) {
                header.write( ( field instanceof Function ? field( details, header ) : field ) );
            }
        }
    }
    if ( header.modified ) return { responseHeaders: header.arrayform };
}
try {
    $client.webRequest.onHeadersReceived.addListener(
        onHeadersReceived,
        { urls: [ '*://*/*' ] },
        [ 'blocking', 'responseHeaders', 'extraHeaders' ]
    );
}
catch ( e ) {
    $client.webRequest.onHeadersReceived.addListener(
        onHeadersReceived,
        { urls: [ '*://*/*' ] },
        [ 'blocking', 'responseHeaders' ]
    );
}

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
    generalExpression: "^(.+)\\s+((?:[\\d\\s\\-\\~화권]+)|(?:(?:번외|특별).+)|(?:\\(?\\[?단편\\]?\\)?.+))",
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
            RegExp: "(brotoon|newtoki)\\.com/.+?/\\d+(?:[^\/]+)?|(brotoon|newtoki)\\.com/.+?\\?.+?wr_id",
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
            RegExp: "jmana2.com\\/book2\\/",
            HTTPMod: {
                redirections: {
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
                        selector: ".view-wrap > h1",
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
function loadDefault ( { reason, previousVersion, id } ) {
    if ( reason === "install" || reason === "update" ) {
        console.log( `%cReset configuration`, $log );
        $client.storage.local.clear();
        $client.storage.local.set( $extensionDefault );
        location.reload();
    }
}

async function retrieveRules () {
    console.log( `%cRetrieve http request modification rules from extension storage.`, $log );
    const $memory = await new Promise( resolve => $client.storage.local.get( null, resolve ) );
    console.log( `%cSuccessfully retrieved.`, $log );
    console.log( `%cApply rules.`, $log );
    for ( const site of $memory.rules ) {
        if ( "HTTPMod" in site ) {
            for ( const [ key, value ] of Object.entries( site.HTTPMod ) ) {
                switch ( key ) {
                    case "redirections": {
                        redirections.push( {
                            filter: ( { url } ) => url.match( new RegExp( value.filter ) ),
                            redirectTo: ( { url } ) => url.replace( new RegExp( value.redirectTo[0] ), value.redirectTo[1] )
                        } );
                    }
                }
            }
        }
    }
}

$client.runtime.onInstalled.addListener( loadDefault );
retrieveRules()

const $downloader = new Downloader();
$client.runtime.onMessage.addListener(
    ( message, sender, sendResponse ) => {
        switch ( message.type ) {
            case "saveToLocal": {
                console.log( `%cDownload data recieved.`, $inform );
                $downloader.save( message.download )
                    .then( () => $client.tabs.sendMessage( sender.tab.id, { type: "ComicGrabber.archiveSaved" } ) )
                    .catch( err => console.log( err ) );
                break;
            }
            case "resetConfiguration": {
                loadDefault( { reason: "install" } );
                break;
            }
        }
    }
);
