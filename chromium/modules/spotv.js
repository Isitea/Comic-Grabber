"use strict";
import { genEx } from '/lib/constant.js';

async function removeAds ( method ) {
    let Ads = [ ...document.querySelectorAll( ".mobile-m, #top-banner, .product-banner" ) ];
    Ads.push( ...[ ...document.querySelectorAll( "#free-genre-list > li" ) ].filter( item => ( !item.dataset.id ) ) );
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
        raw = document.querySelector( '.viewer-header__title' ).textContent;
        ( { title, episode } = raw?.match( genEx )?.groups || {} );

        images = JSON.parse( [ ...document.querySelectorAll( 'script' ) ]
            .filter( item => item.textContent.match( 'img_list' ) )
            .map( item => item.textContent.match( /img_list.+?(?<images>\[.+?\])/ ).groups )[0].images );
        
        resolve( {
            moveNext: Promise.resolve( async function () { return document.querySelector( '#episode-nav .right-episode.next' )?.click(); } ),
            movePrev: Promise.resolve( async function () { return document.querySelector( '#episode-nav .left-episode.prev' )?.click(); } ),
            images,
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch ( error ) { console.log( error ); }
} ) ;

export { pageModule };

