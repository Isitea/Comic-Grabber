"use strict";
let pageModule = async () => new Promise( resolve => {
    try {
        let raw = document.querySelector( `meta[name=title]` ).content;
        let title, episode;
        let contents =
        [ ...document.querySelectorAll( ".gallview_contents .inner .writing_view_box .write_div img" ) ]
            .map( item => ( { uri: item.src.replace( /\/\/.+?\.dcinside\.co\.kr/i, "//image.dcinside.com" ) } ) );
        resolve( {
            moveNext: Promise.resolve( async function () {} ),
            movePrev: Promise.resolve( async function () {} ),
            contents: Promise.resolve( contents ),
            info: Promise.resolve( { raw, title, episode } )
        } );
    }
    catch ( error ) { console.log( error ); }
} ) ;

export { pageModule };