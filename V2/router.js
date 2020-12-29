"use strict";

import { logger } from "./lib/extendVanilla";

async function main () {
    const { $client } = ( await import( "/lib/unifyBrowser.js" ) );
    const { HTML, logger, text2Blob } = ( await import( "/lib/extendVanilla.js" ) );
    const $baseUri = $client.runtime.getURL( "" );
    const $locale = $client.i18n.getMessage;

    function searchSiteModule ( moduleList, uri = document.URL ) {
        let siteModule = "modules/universal.js";
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
            uri: "modules/marumaru.js",//for Dev.
            content: ""
        }
    ];
    let pageModule = new ( await import( searchSiteModule( moduleList ) ) ).pageModule( document );
    let Ads = pageModule?.removeAds();
    console.log( await pageModule.getInfo() );
    console.log( await pageModule.grabImages() );

    $client.runtime.onMessage.addListener(
        ( message, sender, sendResponse ) => {
            console.log( sender );
            console.log( message );
            //$client.tabs.sendMessage( sender.tab.id, message )
    
        }
    );
    $client.runtime.sendMessage( { message: 123 }, {}, e => console.log( e ) );

    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

main().then( ( { message, log } ) => log( message ) ).catch( error => console.log( "Something goes wrong. Please, contact "));
