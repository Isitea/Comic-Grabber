"use strict";
import './../scripts/library.extend.js';
import { $extensionDefault } from './../scripts/extensionDefault.js';
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
            if ( download.blob instanceof Blob && download.blob.size ) {
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
function onBeforeRequest ( { url, ...details } ) {
    for ( const item of redirections ) {
        if ( url.match( item.filter ) ) {
            switch ( item.type ) {
                case 'redirect': {
                    let [ pattern, replace ] = item.redirectTo;
                    return { redirectUrl: url.replace( RegExp( pattern ), replace ) };
                }
                case 'cancel': {
                    return { cancel: true };
                }
            }
        }
    }
}
$client.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    { urls: [ '*://*/*' ] },
    [ 'blocking' ]
);

const requestHeadersModifier = [
    {
        filter: ( { url, type, ...details } ) => type === 'xmlhttprequest' && url.match( /dcinside/ ),
        fields: [
            ( { documentUrl, initiator, ...details }, header ) => {
                const origin = documentUrl || initiator;
                if ( origin.match( /dcinside.com/ ) ) return { name: 'DoNothing', value: '' };
                header.write( { name: 'Referer', value: "http://gall.dcinside.com/mgallery/board/lists?id=kizunaai" } );
                return { name: 'Origin', value: "http://gall.dcinside.com" };
            }
        ]
    },
];
function onBeforeSendHeaders ( details ) {
    const header = new Header( details.requestHeaders );
    for ( const modifier of requestHeadersModifier ) {
        if ( modifier.filter( details, header ) ) {
            for ( const field of modifier.fields ) {
                header.write( ( field instanceof Function ? field( details, header ) : field ) );
            }
        }
    }
    if ( header.modified ) return { requestHeaders: header.arrayform };
}
$client.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    { urls: [ '*://*/*' ] },
    [ 'blocking', 'requestHeaders' ]
)

const responseHeadersModifier = [
    {
        filter: ( { type, details }, header ) => type === "xmlhttprequest" || type === "image",
        fields: [
            ( { documentUrl, initiator, ...details }, header ) => {
                const origin = documentUrl || initiator;
                let value;
                if ( header.read( "Access-Control-Allow-Credentials" ) === "true" ) value = header.read( "Access-Control-Allow-Origin" ) || origin;
                else value = "*";
                return { name: "Access-Control-Allow-Origin", value };
            },
        ]
    },
    {
        filter: ( { type, ...details }, { location } ) => Boolean( location ) && type === "xmlhttprequest",
        fields: [
            ( { documentUrl, initiator, ...details }, { location } ) => {
                const origin = documentUrl || initiator;
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
$client.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    { urls: [ '*://*/*' ] },
    [ 'blocking', 'responseHeaders' ]
);

async function loadDefault ( { reason, previousVersion, id } ) {
    if ( reason === "install" || reason === "update" ) {
        console.log( `%cReset configuration`, $log );
        const $memory = await new Promise( resolve => $client.storage.local.get( null, resolve ) );
        let $Default = Object.assign( {}, $extensionDefault, { session: { imageType: $memory.session.imageType } } );
        try {
            browser;
            await $client.storage.local.clear();
            await $client.storage.local.set( $Default );
        }
        catch ( e ) {
            await new Promise( resolve => $client.storage.local.clear( resolve ) );
            await new Promise( resolve => $client.storage.local.set( $Default, resolve ) );
        }
        location.reload();
    }
}

async function retrieveRules () {
    console.log( `%cRetrieve http request modification rules from extension storage.`, $log );
    const $memory = await new Promise( resolve => $client.storage.local.get( null, resolve ) );
    console.log( `%cSuccessfully retrieved.`, $log );
    console.log( `%cApply rules.`, $log );
    console.log( $memory );
    for ( const site of $memory.rules ) {
        if ( "HTTPMod" in site ) {
            for ( const [ key, value ] of Object.entries( site.HTTPMod ) ) {
                switch ( key ) {
                    case "redirections": {
                        redirections.push( value );
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
                console.log( message );
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
