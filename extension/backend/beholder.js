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
            const host = origin.match( /https?:/ )[0].toLowerCase();
            if ( host === "https:" && host !== url.match( /https?:/ )[0].toLowerCase() ) {
                return { redirectUrl: url.replace( /https?:/, "https:" ) };
            }
        }
    },
    { urls: [ '*://*/*' ] },
    [ 'blocking' ]
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

const $downloader = new Downloader();
$client.runtime.onMessage.addListener(
    ( message, sender, sendResponse ) => {
        switch ( message.type ) {
            case "saveToLocal": {
                $downloader.save( message.download )
                    .then( () => $client.tabs.sendMessage( sender.tab.id, { type: "ComicGrabbler.archiveSaved" } ) );
                break;
            }
        }
    }
);

$client.runtime.onInstalled.addListener( ( { reason, previousVersion, id } ) => {
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
                                exp: "(.+)"
                            },
                            subTitle: {
                                selector: ".tit_area .view h3",
                                propertyChain: ".textContent",
                                exp: "(.+)"
                            },
                        },
                        images: ".view_area .wt_viewer img",
                    }
                },
                {
                    name: "001",
                    RegExp: "brotoon\\.com/.+?/\\d+|newtoki\\.com/.+?/\\d+",
                    rule: {
                        moveNext: "a[title=다음글]",
                        movePrev: "a[title=이전글]",
                        subject: {
                            title: {
                                selector: "article h1[content]",
                                propertyChain: ".textContent"
                            },
                            generalExp: "(?<title>.+?)[~\\-\\s]+(?<episode>(\\d[\\d.~\\-\\s]*화)|(단편)|(\\d[\\d.~\\-\\s]*권.*))",
                        },
                        images: ".view-padding .view-content img",
                    }
                },
                {
                    name: "002",
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
                    name: "003",
                    RegExp: "manastaynight009i.blogspot.com",
                    rule: {
                        moveNext: null,
                        movePrev: null,
                        subject: {
                            title: {
                                selector: "h3.post-title.entry-title",
                                propertyChain: ".firstChild.textContent"
                            },
                            generalExp: "(?<title>.+?)[~\\-\\s]+(?<episode>(\\d[\\d.~\\-\\s]*화)|(단편)|(\\d[\\d.~\\-\\s]*권.*))",
                        },
                        images: "a[imageanchor] > img",
                    }
                },
                {
                    name: "004",
                    RegExp: "marumaru01.com",
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
            ]
        } );
    }
} );