"use strict";
import { regex } from '/lib/generalExpression.js';

async function removeAds ( method ) {
    let Ads = [ ...document.querySelectorAll( ".basic-banner, .board-tail-banner" ) ];
    switch ( method ) {
        case "invisible": {
            Ads.map( item => item.style = "display: none !important;" );
            break;
        }
        default: {
            Ads.map( item => item.remove() );
            break;
        }
    }
}
removeAds();

let pageModule = async () => new Promise( resolve => {
    try {
        let id = document.querySelector( ".view-padding > div > p" ).className;
        let altId = document.querySelector( ".view-padding > div > p" ).parentNode.className;
        [ ...document.querySelectorAll( `div.${altId} > p.${id}` ) ].map( item => item.remove() ) ;
        let raw = document.querySelector( `.toon-info .toon-title` ).firstChild.textContent;
        let { title, episode } = raw?.match( regex )?.groups || {};
        
        resolve( {
            moveNext: Promise.resolve( async function () { return document.querySelector( '#goNextBtn' )?.click(); } ),
            movePrev: Promise.resolve( async function () { return document.querySelector( '#goPrevBtn' )?.click(); } ),
            images: Promise.resolve( [ ...document.querySelectorAll( `div.${altId} img` ) ].map( item => item.dataset[id] ) ),
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch {}
} ) ;

export { pageModule };
