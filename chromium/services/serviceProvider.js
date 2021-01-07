"use strict";
function imports ( list = [] ) {
    let promises = [];
    for ( const module of list ) promises.push( import( module ) );

    return Promise.all( promises );
}

async function main () {
    async function downloadImages ( { filename, conflictAction = "overwrite", images, uri } ) {
        let list = await Promise.all( images.map( uri => fetch( uri ).then( response => response.blob() ) ) );
        let zip = new JSZip();
        for ( let i = 0; i < list.length; i++ ) {
            let ext, name = i.toString().padStart( 4, "0" );
            switch ( ext = list[i].type.split( "/" ).pop() ) {
                default: {
                    name += `.${ext}`;
                    break;
                }
                case "jpeg": {
                    name += ".jpg";
                    break;
                }
            }
            zip.file( name, list[i] );
        }
        zip.file( 'Downloaded from.txt', text2Blob( uri, "text/plain" ) );
        let url = URL.createObjectURL( await zip.generateAsync( { type: "blob" } ) );
        let id = await $client.dl.download( { url, filename, conflictAction } );
        return new Promise( resolve => {
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
            };
            $client.dl.onChanged.addListener( onComplete );
        } );
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
                    result = await downloadImages( data );
                }
            }
            $client.tabs.sendMessage( sender.tab.id, { action, clientUid, data: result } );
        }
    );

    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );