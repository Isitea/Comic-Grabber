"use strict";
import { regex } from '/lib/generalExpression.js';

let pageModule = async () => new Promise( resolve => {
    try {
        let raw = document.querySelector( `.view-top-wrap p.tit` ).textContent;
        let title, episode;
        if ( episode = document.querySelector( `.view-top-wrap .v-float-rgt-wrap select option[selected]` ).textContent ) {
            title = raw.replace( episode, "" );
        }
        else {
            ( { title, episode } = raw?.match( regex )?.groups || {} );
        }
        
        resolve( {
            moveNext: Promise.resolve( async function () { return document.querySelector( '.v-float-rgt-wrap > a[aria-label=Next]' )?.click(); } ),
            movePrev: Promise.resolve( async function () { return document.querySelector( '.v-float-rgt-wrap > a[aria-label=Previous]' )?.click(); } ),
            images: Promise.resolve( [ ...document.querySelectorAll( ".pdf-wrap img.comicdetail" ) ].map( item => item.src || item.dataset.src ) ),
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch {}
} ) ;

export { pageModule };