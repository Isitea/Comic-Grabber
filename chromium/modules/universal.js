"use strict";
import { $client } from '/lib/browserUnifier.js';
import { HTML, logger, uid } from '/lib/extendVanilla.js';
const $locale = $client.i18n.getMessage;

async function pageModule() {
    function selectImage ( { target }, automation = false ) {
        if ( target.localName === 'img' ) {
            if ( automation ) { moveCursor( target ); }
            if ( target === canvas.selected || target === canvas.link ) {
                let list = application.contents
                if ( canvas.selected ) {
                    list.splice( list.indexOf( canvas.selected.src ), 1 );
                    canvas.selected.remove();
                }
                else {
                    let [ node ] = HTML.render( { img: { src: canvas.src, link: canvas.link, CGNode: 1 } } );
                    helper.querySelector( '.selectedImages .imagelist' ).appendChild( node );
                    list.push( canvas.src );
                }
                canvas.link.classList.toggle( "selected" );
                moveCursor();
            }
            else moveCursor( target );
        }
    }
    function moveCursor ( image ) {
        helper.querySelector( '.showing' )?.classList.remove( "showing" );
        if ( image ) {
            image.classList.add( "showing" );
            let { src, link } = image;
            if ( link ) Object.assign( canvas, { src, link, selected: image } );
            else Object.assign( canvas, { src, link: image, selected: undefined } );
        }
        else Object.assign( canvas, { src: "", link: undefined, selected: undefined } );
        canvasUri.value = canvas.src;
    }
    
    const listO = {},
        [ helper ] = HTML.render( {
            div: {
                id: "CG-selection-helper",
                _child: [
                    {
                        div: {
                            class: [ "selectableImages" ],
                            _child: [
                                { button: { id: "selectAll", textContent: $locale( "selectAll" ) } },
                                { div: { class: [ "imagelist" ] } },
                            ]
                        }
                    },
                    {
                        div: {
                            class: [ "viewer" ],
                            _child: [
                                { input: { id: "CG-canvas-uri", type: "input" } },
                                { img: { id: "CG-canvas", CGNode: 1 } },
                            ]
                        }
                    },
                    {
                        div: {
                            class: [ "selectedImages" ],
                            _child: [
                                { button: { id: "unselectAll", textContent: $locale( "unselectAll" ) } },
                                { div: { class: [ "imagelist" ] } },
                            ]
                        }
                    },
                ],
            }
        } );
    const canvas = helper.querySelector( '#CG-canvas' ),
          canvasUri = helper.querySelector( '#CG-canvas-uri' );
    [ ...helper.querySelectorAll( '.selectableImages .imagelist, .selectedImages .imagelist' ) ]
    .map( node => node.addEventListener( "click", selectImage ) );
    helper.querySelector( '#selectAll' ).addEventListener( "click", () => {
        [ ...helper.querySelectorAll( '.selectableImages .imagelist img' ) ]
            .filter( node => !node.classList.contains( "selected" ) )
            .map( node => selectImage( { target: node }, true ) );
    } );
    helper.querySelector( '#unselectAll' ).addEventListener( "click", () => {
        [ ...helper.querySelectorAll( '.selectedImages .imagelist img' ) ]
            .map( node => selectImage( { target: node }, true ) );
    } );
    
    let modeStatus = false, application;

    function reactor ( { action, data } ) {
        switch ( action ) {
            case "toggleMode": {
                modeStatus = !modeStatus;
                if ( modeStatus ) {
                    document.body.dispatchEvent( new Event( "CG-universal-activated" ) );
                    document.body.classList.add( "CG-selector-active" );
                }
                else {
                    document.body.classList.remove( "CG-selector-active" );
                }
            }
        }
    }
    
    $client.runtime.onMessage.addListener( reactor );

    function registImage ( { src, localName } ) {
        let node = arguments[0];
        if ( !node.CGNode ) {
            if ( localName === "img" && src?.length ) {
                let uri = ( uri => { try { return decodeURI( uri ); } catch { return uri; } } )( src );
                if ( !listO[uri] ) {
                    listO[uri] = [ true ];
                    application?.notify( { brief: "New image detected", src: uri } );
                    ( helper.querySelector( ".selectableImages .imagelist" ).appendChild( ...HTML.render( { img: { src: uri, CGNode: 1 } } ) ) )?.scrollIntoView();
                }
            }
        }
    }

    {
        [ ...document.querySelectorAll( "img" ) ].map( registImage );
        
        let observer = new MutationObserver( function ( records ) {
            records.map( ( { target, type, addedNodes } ) => {
                switch ( type ) {
                    case "childList": {
                        [ ...addedNodes ].map( registImage );
                        break;
                    }
                    case "attributes": {
                        registImage( target );
                        break;
                    }
                }
            } );
        } );
        observer.observe( document.body, { childList: true, subtree: true, attributeFilter: [ "src" ] } );
    }

    await new Promise( res => document.body.addEventListener( "CG-universal-activated", res, { once: true } ) );
    document.body.appendChild( helper );

    let raw, title, episode = ( document.title || "manual mode" );
    raw = title = episode;

    return {
        moveNext: Promise.resolve( async () => {} ),
        movePrev: Promise.resolve( async () => {} ),
        info: { raw, title, episode },
        contents: [],
        universal: {
            activateListener: function ( holder ) { application = holder; }
        }
    };
}

export { pageModule };