"use strict";
let pageModule = () => ( {
    moveNext: Promise.resolve( async function () { return document.querySelector( 'a.btn_comm.btn_next' )?.click(); } ),
    movePrev: Promise.resolve( async function () { return document.querySelector( 'a.btn_comm.btn_prev' )?.click(); } ),
    info: ( async () => {
        return {
            title: document.querySelector( '.list_info .txt_title a.link_title' ).textContent,
            episode: document.querySelector( '.list_info .txt_episode' ).textContent,
//            raw: document.head.querySelector( 'meta[property=title]' ).content
        };
    } )(),
    images: Promise.resolve( [ ...document.querySelectorAll( '.cont_view#imgView > img' ) ].map( item => item.src ) )
} );

export { pageModule };