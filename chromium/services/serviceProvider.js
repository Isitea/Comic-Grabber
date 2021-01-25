"use strict";
function imports ( list = [] ) {
    let promises = [];
    for ( const module of list ) promises.push( import( module ) );

    return Promise.all( promises );
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

    const [ { $client }, { logger, text2Blob, uid, getExtension }, { constant }, {} ]
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