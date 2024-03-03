"use strict";
async function main () {
    const { $client } = await import( '/lib/browserUnifier.js' );
    const { logger, text2Blob, uid, getExtension } = await import( '/lib/extendVanilla.js' );
    const { constant } = await import( '/lib/constant.js' );
    const { webRequest } = await import( '/services/webRequest.js' );
    await import( '/3rdParty/jszip.js' );

    async function downloadContents ( { filename, conflictAction = "overwrite", contents, uri, referer }, tab ) {
        let zip = new JSZip(), partial_complete;
        let list = await Promise.allSettled(
            contents.map(
                ( { uri, content } ) => {
                    if ( uri ) {
                        return fetch( ( uri.match( /^\/\// ) ? "https:" + uri : uri ), ( referer ? { headers: { creferer: referer, [ referer ]: "creferer" } } : {} ) )
                            .then( response => {
                                if ( response.status !== 200 ) return Promise.reject( `Network error ${response.status}` );
                                return response.blob();
                            } )
                            .then( blob => ( { blob, uri } ) )
                            .catch( reason => Promise.reject( { reason, uri } ) )
                    }
                    else if ( content ) {
                        zip.file( content.name, new Blob( [ content.text ], { type: "text/plain" } ) );
                    }
                }
            )
        );
        await Promise.allSettled(
            list.map(
                async ( { status, value, reason }, n ) => {
                    if ( !reason && value ) {
                        return getExtension( value.blob )
                            .then( ext => zip.file( `${n.toString().padStart( 3, "0" )}0.${ext}`, value.blob ) )
                            .catch( reason => Promise.reject( { reason, uri: value.uri } ) );
                    }
                    else return Promise.reject( reason );
                }
            )
        ).then( list => list.map( ( { reason } ) => {
            if ( reason ) {
                partial_complete = true;
                $client.tabs.sendMessage( tab.id, { action: constant.__caution__, data: { brief: reason.reason, src: reason.uri } } );
            }
        } ) );
        zip.file( 'Downloaded from.txt', new Blob( [ uri ], { type: "text/plain" } ) );
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
                                if ( partial_complete ) { resolve( { result: "partial_complete", filename } ); }
                                else { resolve( { result: item.state.current, filename } ); }
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

    async function communication ( { message, action, clientUid, data }, sender, response ) {
        let result = undefined;
        switch ( action ) {
            case constant.__request__: {
                fetch( data.uri ).then( body => body.text() ).then( text => response( text ) );
                break;
            }
            case constant.__download__: {
                webRequest.connect( $client.webRequest );
                if ( !$client.webRequest ) delete data.referer;
                result = await downloadContents( data, sender.tab ).catch( data => data );
                webRequest.disconnect( $client.webRequest );
                response( result );
                break;
            }
        }
        $client.tabs.sendMessage( sender.tab.id, { action, clientUid, data: result } );
    }
    $client.runtime.onMessage.addListener( function () { communication( ...arguments ); return true; } );

    $client.browserAction.onClicked.addListener( function ( tab ) { $client.tabs.sendMessage( tab.id, { action: "toggleMode" } ); } );
    
    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );