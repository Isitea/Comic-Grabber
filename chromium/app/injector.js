"use strict";
async function main () {
    const { logger, text2Blob } = await import( '/lib/extendVanilla.js' );

    function searchSiteModule ( moduleList, uri = document.URL ) {
        let siteModule;
        for ( const module of moduleList ) {
            if ( uri.match( module.matchPattern ) ) {
                siteModule = ( module.uri ? module.uri : text2Blob( module.content ) );
                break;
            }
        }
        
        return siteModule;
    }

    logger.inform( 'Comic grabber ( http://isitea.net )' );
    const { moduleList } = await import( "/modules/list.js" );
    let matchedModule;
    if ( matchedModule = searchSiteModule( moduleList ) ) {
        const [ { pageModule }, { Controller } ] = await Promise.all( [ import( matchedModule ), import( "/app/controller.js" ) ] );
        const grabber = new Controller( pageModule );
        return grabber.ready( { message: "Scheduled task completed successfully. Waiting user action." } );
    }
    else {
        return { message: "There is no module for this site. Manual selector is loaded for user action." }
    }
}

main()
    .then( ( { message } ) => console.log( message ) )
    .catch( error => console.log( "Something goes wrong with a content script.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );
