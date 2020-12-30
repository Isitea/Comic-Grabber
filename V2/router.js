"use strict";
function imports ( list = [] ) {
    let promises = [];
    for ( const module of list ) promises.push( import( module ) );

    return Promise.all( promises );
}

async function main () {
    const [ { $client }, { HTML, logger, text2Blob }, { resourceManager } ]
    = await imports( [ "/lib/unifyBrowser.js",  "/lib/extendVanilla.js", "/lib/resourceManager.js" ] );
    const $baseUri = $client.runtime.getURL( "" ).replace( /\/$/, "" );
    const $locale = $client.i18n.getMessage;

    function searchSiteModule ( moduleList, uri = document.URL ) {
        let siteModule = "/modules/universal.js";
        for ( const module of moduleList ) {
            if ( uri.match( module.matchPattern ) ) {
                siteModule = ( module.uri ? $baseUri + module.uri : text2Blob( module.content ) );
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
    let { Controller } = ( await import( "/UI/controller.js" ) );
    let { pageModule } = ( await import( searchSiteModule( moduleList ) ) );
    if ( pageModule.getInfo ) {
        let Ads = pageModule?.removeAds();
        console.log( await pageModule.getInfo() );
        console.log( await pageModule.grabImages() );
    }
    $client.runtime.onMessage.addListener(
        ( message, sender, sendResponse ) => {
            console.log( sender );
            console.log( message );
            //$client.tabs.sendMessage( sender.tab.id, message )
    
        }
    );
    $client.runtime.sendMessage( { message: Date.now(), action: "download", data: { filename: "test.zip", images: await pageModule.grabImages(), uri: document.URL } } );
    
    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );
