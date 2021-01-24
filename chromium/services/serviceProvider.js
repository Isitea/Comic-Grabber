"use strict";
function imports ( list = [] ) {
    let promises = [];
    for ( const module of list ) promises.push( import( module ) );

    return Promise.all( promises );
}

async function getExtension ( blob ) {
    switch ( blob.type ) {
        case "image/x-icon":
        case "image/vnd.microsoft.icon": { return "ico"; }
        case "image/tiff": { return ".tif"; }
        case "image/svg+xml": { return "svg"; }
        case "image/jpeg": { return "jpg"; }
        default: {
            if ( blob.type.match( /image/i ) ) return blob.type.split( "/" ).pop();
            else if ( blob.type.length ) return Promise.reject( "Not an image file" );
        }
        case "application/octet-stream": {
            const signatures = {
                "png": /89504e470d0a1a0a/i,
                "jpg": /ffd8ff(db|ee)|ffd8ffe(000104a4649460001|1.{4,4}457869660000)/i,
                "gif": /474946383(7|9)61/i,
                "tif": /49492a00|4d4d002a/i,
                "bmp": /424d/i,
                "psd": /38425053/i,
                "webp": /52494646.{8,8}57454250/i,
            };
            const binSign = ( new Uint8Array( await blob.slice( 0, 24 ).arrayBuffer() ) )
                .reduce( ( hex, bin ) => hex + bin.toString( 16 ).padStart( 2, "0" ), "" );
            let ext = Object.entries( signatures ).find( ( [ , hexHeader ] ) => binSign.match( hexHeader ) )?.[0];
            if ( ext ) return ext;
            else return Promise.reject( "Not an image file" );
        }
    }
}

async function main () {
    async function downloadImages ( { filename, conflictAction = "overwrite", images, uri, referer }, tab ) {
        let list = await Promise.allSettled(
            images.map(
                uri => fetch( uri )
                .then( response => {
                    if ( response.status !== 200 ) return Promise.reject( "Access denied" );
                    return response.blob();
                } )
                .then( blob => ( { blob, uri } ) )
                .catch( reason => Promise.reject( { reason, uri } ) )
            )
        );
        let zip = new JSZip();
        await Promise.allSettled(
            list.map(
                async ( { status, value, reason }, n ) => {
                    if ( value ) {
                        return getExtension( value.blob )
                            .then( ext => zip.file( `${n.toString().padStart( 3, "0" )}0.${ext}`, value.blob ) )
                            .catch( reason => Promise.reject( { reason, uri: value.uri } ) );
                    }
                    else return Promise.reject( reason );
                }
            )
        ).then( list => list.map( ( { reason } ) => {
            if ( reason ) $client.tabs.sendMessage( tab.id, { action: constant.__caution__, data: { brief: reason.reason, src: reason.uri } } );
        } ) );
        zip.file( 'Downloaded from.txt', text2Blob( uri, "text/plain" ) );
        let url = URL.createObjectURL( await zip.generateAsync( { type: "blob" } ) );
        
        return $client.dl.download( { url, filename, conflictAction } )
            .then( id => new Promise( resolve => {
                function onComplete ( item ) {
                    if ( item.id === id && item.state ) {
                        switch ( item.state.current ) {
                            case "interrupted":
                            case "complete": {
                                $client.dl.onChanged.removeListener( onComplete );
                                URL.revokeObjectURL( url );
                                resolve( { result: item.state.current, filename } );
                                break;
                            }
                            default:
                        }
                    }
                }
                $client.dl.onChanged.addListener( onComplete );
            } ) )
            .catch( msg => ( { result: "Invalid filename", filename } ) )
    }

    const [ { $client }, { logger, text2Blob, uid }, { constant }, {} ]
    = await imports( [
        "/lib/browserUnifier.js",
        "/lib/extendVanilla.js",
        "/lib/constant.js",
        "/3rdParty/jszip.js"
    ] );

    $client.runtime.onMessage.addListener(
        async ( { message, action, clientUid, data }, sender ) => {
            let result = undefined;
            switch ( action ) {
                case constant.__download__: {
                    result = await downloadImages( data, sender.tab ).catch( data => data );
                    break;
                }
            }
            $client.tabs.sendMessage( sender.tab.id, { action, clientUid, data: result } );
        }
    );

    $client.browserAction.onClicked.addListener( function ( tab ) { $client.tabs.sendMessage( tab.id, { action: "toggleMode" } ); } );
    
    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );