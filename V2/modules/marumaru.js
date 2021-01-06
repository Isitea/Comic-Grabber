"use strict";
async function removeAds ( method ) {
    let Ads = document.querySelectorAll( ".w_banner" );
    switch ( method ) {
        case "invisible": {
            for (let item of Ads ) item.style = "display: none !important;";
            break;
        }
        default: {
            for ( let item of Ads ) item.remove();
            break;
        }
    }
}
removeAds();

let pageModule = () => ( {
    moveNext: Promise.resolve( async function () { return document.querySelector( '.chapter_prev.fa-chevron-circle-right' )?.click(); } ),
    movePrev: Promise.resolve( async function () { return document.querySelector( '.chapter_prev.fa-chevron-circle-left' )?.click(); } ),
    info: ( async () => {
        let raw = document.head.querySelector( "meta[name=title]" )?.content;
        let result = raw?.match( /^(?<title>.+|(?:[\(\[]?단편[\]?\)]?.+))\s*(?<episode>(?:\d[.\d\s\-\~화권전후편]+|(?:번외|특별).+)|(?:\#\d+)|(stage\s*\d+))/i )?.groups || { title: document.head.querySelector( "meta[name=title]" )?.content };
        return { ...result, raw };
    } )(),
    images: Promise.resolve( [ ...document.querySelectorAll( ".view-img img" ) ].map( item => item.src ) )
} );

export { pageModule };