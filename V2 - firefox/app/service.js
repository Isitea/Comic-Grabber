"use strict";
function imports ( list = [] ) {
    let promises = [];
    for ( const module of list ) promises.push( import( module ) );

    return Promise.all( promises );
}

async function main () {
    const [ { $client }, { HTML, logger, text2Blob, uid }, { resourceManager }, { constant } ]
    = await imports( [ "/lib/browserUnifier.js",  "/lib/extendVanilla.js", "/lib/resourceManager.js", "/lib/constant.js" ] );
    const $baseUri = $client.runtime.getURL( "" ).replace( /\/$/, "" );
    const pageUid = uid();

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

    logger.inform( `Comic grabber v2 ( http://isitea.net )` );
    let moduleList;
    //let moduleList = ( await $client.localStorage.get( "modules" ) ).modules;
    //Test structure
    moduleList = [
        {
            moduleName: "marumaru",
            buildDate: "2020-12-24 18:00",
            matchPattern: "marumaru.*\\.\\w+\\/",
            uri: "/modules/marumaru.js",//for Dev.
        }
    ];
    let matchedModule;
    if ( matchedModule = searchSiteModule( moduleList ) ) {
        let [ { pageModule }, { Controller } ] = await Promise.all( [ import( matchedModule ), import( "/app/controller.js" ) ] );
        let grabber = new Controller( $baseUri, pageModule );
        return grabber.ready( { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log } );
    }
    else {
        return { message: "There is no module for this site. Manual selector is loaded for user action.", log: logger.log }
    }
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong with a content script.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );
