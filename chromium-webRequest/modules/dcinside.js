"use strict";
let pageModule = async () => new Promise( resolve => {
    try {
        let raw = document.querySelector( `meta[name=title]` ).content;
        let title, episode;
        let images =
        [ ...document.querySelectorAll( ".gallview_contents .inner .writing_view_box .write_div img" ) ]
            .map( item => ( item.src.replace( /\/\/.+?\.dcinside\.co\.kr/i, "//image.dcinside.com" ) ) );
        console.log( 1 )
        resolve( {
            moveNext: Promise.resolve( async function () {} ),
            movePrev: Promise.resolve( async function () {} ),
            images: Promise.resolve( images ),
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch ( error ) { console.log( error ); }
} ) ;

export { pageModule };