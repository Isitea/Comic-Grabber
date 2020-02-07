"use strict";
import '/App/library/extendVanilla.js';
import { $extensionDefault } from 'extensionDefault.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';

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

    get list () {
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
        const $api = ( () => {
            try { browser; return $client.downloads.download; }
            catch ( e ) { return ( download ) => new Promise( resolve => $client.downloads.download( download, resolve ) ) }
        } )();
        
        this.save = function ( contents ) {
            function fetchImage ( result, item, index, source ) {
                let name = `${index.toString().padStart( 3, "0" )}.${ type.groups.extension.replace( /jpeg/gi, 'jpg' ) }`
                let blob = fetch( item, { method: 'post', headers: {} } )
                            .then( body => {
                                if ( body.status !== 200 ) {
                                    
                                    return contents.onError( item );
                                }
                                else return body.blob();
                            } );
                result.push( { blob, name } );

                return result;
                
            }
            contents.list
            apiParameter;
            
            contents.list.reduce( fetchImage, [] );

            ( await targets.reduce( async ( list, item, index ) => {
                let blob = await item.binaryData, type;
                if ( type = blob.type.match( /image\/(?<extension>\w+);?/ ) ) {
                    ( await list ).push( {
                        blob,
                        name: `${index.toString().padStart( 3, "0" )}.${ type.groups.extension.replace( /jpeg/gi, 'jpg' ) }`
                    } );
                }
                else {
                    console.log( blob, item.src );
                }
                return list;
            }, [] ) ).reduce( ( zip, { blob, name } ) => zip.file( name, blob ), new JSZip() )


            return $api( apiParameter ).then( id => new Promise( ( resolve, reject ) => {
                let onComplete = ( item ) => {
                    if ( item.id === id && item.state ) {
                        switch ( item.state.current ) {
                            case "complete": {
                                if ( item.state.current === "complete" ) {
                                    URL.revokeObjectURL( apiParameter.url )
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
    if ( header.modified ) return { requestHeaders: header.list };
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
    if ( header.modified ) return { responseHeaders: header.list };
}
$client.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    { urls: [ '*://*/*' ] },
    [ 'blocking', 'responseHeaders' ]
);

async function loadDefault ( { reason, previousVersion, id } ) {
    if ( reason === "install" || reason === "update" ) {
        console.log( `%cReset configuration`, $log );
        try {
            browser;
            await $client.storage.local.clear();
            await $client.storage.local.set( $extensionDefault );
        }
        catch ( e ) {
            await new Promise( resolve => $client.storage.local.clear( resolve ) );
            await new Promise( resolve => $client.storage.local.set( $extensionDefault, resolve ) );
        }
        location.reload();
    }
}

async function retrieveRules () {
    console.log( `%cRetrieve http request modification rules from extension storage.`, $log );
    const $memory = await new Promise( resolve => $client.storage.local.get( null, resolve ) );
    console.log( `%cSuccessfully retrieved.`, $log );
    console.log( `%cApply rules.`, $log );
    $extensionDefault.session.imageType = ( storage => {
        try { return storage.session.imageType; }
        catch ( e ) { return "png" }
    } )( $memory );
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

retrieveRules().catch( () => loadDefault( { reason: "install" } ) ).then( () => $client.runtime.onInstalled.addListener( loadDefault ) );

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
