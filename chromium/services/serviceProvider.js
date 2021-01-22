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
            let ext, name = i.toString().padStart( 3, "0" ) + "0";
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
                    result = await downloadImages( data ).catch( data => data );
                    break;
                }
            }
            $client.tabs.sendMessage( sender.tab.id, { action, clientUid, data: result } );
        }
    );

    //contextMenus( { $client } );
    $client.browserAction.onClicked.addListener( function ( tab ) { $client.tabs.sendMessage( tab.id, { action: "toggleMode" } ); } );
    
    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

function contextMenus ( { $client } ) {
    const $locale = $client.i18n.getMessage;
    const $menus = $client.contextMenus;
    $menus.removeAll();
//    $menus.create( { 
//        id: "CG-contextMenu",
//        title: $locale( "contextMenu" ),
//        contexts: [ 'all' ]
//    } );
    $menus.create( {
        id: "CG-toggleMode",
        title: $locale( "toggleMode" ),
        contexts: [ 'all' ],
//        parentId: "CG-contextMenu"
    } );
    $menus.onClicked.addListener( function ( info, tab ) {
        switch ( info.menuItemId ) {
            case "CG-toggleMode": {
                $client.tabs.sendMessage( tab.id, { action: "toggleMode", data: { info, tab } } );
                break;
            }
        }
    } );
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );