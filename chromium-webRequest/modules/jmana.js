"use strict";
import { genEx } from '/lib/constant.js';

let pageModule = async () => new Promise( resolve => {
    try {
        let raw = document.querySelector( `.view-top-wrap p.tit` ).textContent;
        let title, episode;
        if ( episode = document.querySelector( `.view-top-wrap .v-float-rgt-wrap select option[selected]` ).textContent ) {
            title = raw.replace( episode, "" );
        }
        else {
            ( { title, episode } = raw?.match( genEx )?.groups || {} );
        }
        let contents =
        [ ...document.querySelectorAll( ".pdf-wrap img.comicdetail" ) ]
            .map( item => decodeURIComponent( item.src || item.dataset.src ) );
        let mostMatched = Object.entries( contents.reduce( ( counter, src ) => {
            let { bundle } = src.match( /.+:\/\/(?<bundle>.+)\// ).groups;
            counter[bundle] = ( counter[bundle] ? counter[bundle] + 1 : 1 );
            return counter;
        }, {} ) ).reduce( ( result, item ) => { result[ item[1] ] = item[0]; return result; }, [] ).pop()
        
        resolve( {
            moveNext: Promise.resolve( async function () { return document.querySelector( '.v-float-rgt-wrap > a[aria-label=Next]' )?.click(); } ),
            movePrev: Promise.resolve( async function () { return document.querySelector( '.v-float-rgt-wrap > a[aria-label=Previous]' )?.click(); } ),
            contents: Promise.resolve( contents.filter( src => src.includes( mostMatched ) ).map( uri => ( { uri } ) ) ),
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch ( error ) { console.log( error ); }
} ) ;

export { pageModule };