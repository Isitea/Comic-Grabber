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
        let raw, title, episode, images;
        if ( document.URL.match( /comic/ ) ) {
            let id, altId;
            id = document.querySelector( ".view-padding > div > p" ).className;
            altId = document.querySelector( ".view-padding > div > p" ).parentNode.className;
            [ ...document.querySelectorAll( `div.${altId} > p.${id}` ) ].map( item => item.remove() ) ;
            raw = document.querySelector( `.toon-info .toon-title` ).firstChild.textContent.trim();
            images = Promise.resolve( [ ...document.querySelectorAll( `div.${altId} img` ) ].map( item => item.dataset[id] ) );
        }
        else if ( document.URL.match( /origin/ ) ) {
            raw = document.querySelector( `.view-wrap article[itemprop=articleBody] h1[itemprop=headline]` ).textContent.trim();
            images = Promise.resolve( [ ...document.querySelectorAll( `.view-content img` ) ].map( item => item.src ) );
        }
        ( { title, episode } = raw?.match( regex )?.groups || {} );
        
        resolve( {
            moveNext: Promise.resolve( async function () { return document.querySelector( '#goNextBtn' )?.click(); } ),
            movePrev: Promise.resolve( async function () { return document.querySelector( '#goPrevBtn' )?.click(); } ),
            images,
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch ( error ) { console.log( error ); }
} ) ;

export { pageModule };
