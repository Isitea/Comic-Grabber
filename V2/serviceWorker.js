"use strict";

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
        let id = $client.dl.download( { url, filename, conflictAction } );
        return new Promise( ( resolve, reject ) => {
            function onComplete ( item ) {
                if ( item.id === id && item.state ) {
                    switch ( item.state.current ) {
                        case "complete": {
                            URL.revokeObjectURL( url );
                            $client.dl.onChanged.removeListener( onComplete );
                            resolve( item.state );
                            break;
                        }
                        case "interrupted": {
                            $client.dl.onChanged.removeListener( onComplete );
                            reject( item.state );
                            break;
                        }
                    }
                }
            };
            $client.dl.onChanged.addListener( onComplete );
        } );
    }

    const { $client } = ( await import( "/lib/unifyBrowser.js" ) );
    const { text2Blob, logger } = ( await import( "/lib/extendVanilla.js" ) );
    await ( import( 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js' ) );

    $client.runtime.onMessage.addListener(
        async ( { message, action, data }, sender, sendResponse ) => {
            console.log( sender );
            console.log( message );
            //$client.dl.download( { url: blob, filename: "test.jpg", conflictAction: "overwrite" } ).then( e => console.log( e ) );
            switch ( action ) {
                case "download": {
                    message = await downloadImages( data )
                }
            }
            $client.tabs.sendMessage( sender.tab.id, { message } );
        }
    );
    //zip.file( 'Downloaded from.txt', new Blob( [ document.URL ], { type: 'text/plain' } ) );
    //.reduce( ( zip, { blob, name } ) => zip.file( name, blob ), new JSZip() );
    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );