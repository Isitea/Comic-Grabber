"use strict";
let pageModule = () => ( {
    moveNext: Promise.resolve( async function () { return document.querySelector( '.next a' )?.click(); } ),
    movePrev: Promise.resolve( async function () { return document.querySelector( '.pre a' )?.click(); } ),
    info: ( async () => {
        return {
            title: document.querySelector( '.comicinfo .detail h2:first-child' ).firstChild.textContent,
            episode: document.querySelector( '.tit_area .view h3' ).textContent,
            raw: document.querySelector( '.comicinfo .detail h2:first-child' ).firstChild.textContent
        };
    } )(),
    images: Promise.resolve( [ ...document.querySelectorAll( '.view_area .wt_viewer img' ) ].map( item => item.src ) )
} );

export { pageModule };