"use strict";
import { $client } from '/lib/browserUnifier.js';
import { HTML, logger, uid } from '/lib/extendVanilla.js';

async function pageModule() {
    function getAbsolutePosition ( dom ) {
        let { top, left, width } = dom.getBoundingClientRect();
        let { x, y } = document.body.getBoundingClientRect();
        return { top: top - y, left: left - x, width };
    }

    const listO = {},
        [ helper ] = HTML.render( {
            div: {
                id: "CG-selection-helper",
                _child: [
                    {
                        div: {
                            className: "selectableImages",
                            _child: [
                                { div: { className: "imagelist" } },
                            ]
                        }
                    },
                    {
                        div: {
                            className: "viewer",
                            _child: [
                                { img: { id: "CG-canvas", CGNode: 1 } },
                                { div: { id: "CG-canvas-select" } },
                            ]
                        }
                    },
                    {
                        div: {
                            className: "selectedImages",
                            _child: [
                                { div: { className: "imagelist" } },
                            ]
                        }
                    },
                ],
            }
        } );
    helper.querySelector( '.selectableImages .imagelist' ).addEventListener( "click", function ( e ) {
        let { localName, src, selected } = e.target;
        if ( localName === 'img' ) Object.assign( helper.querySelector( '#CG-canvas' ), { src, link: e.target, selected } );
    } );
    helper.querySelector( '.selectedImages .imagelist' ).addEventListener( "click", function ( e ) {
        let { localName, src, link } = e.target;
        if ( localName === 'img' ) Object.assign( helper.querySelector( '#CG-canvas' ), { src, link, selected: e.target } );
    } );
    helper.querySelector( '#CG-canvas-select' ).addEventListener( "click", function ( e ) {
        let canvas = helper.querySelector( '#CG-canvas' );
        if ( canvas.src && canvas.link ) {
            if ( canvas.selected ) { canvas.selected.remove(); }
            else {
                let [ node ] = HTML.render( { img: { src: canvas.src, link: canvas.link, CGNode: 1 } } );
                helper.querySelector( '.selectedImages .imagelist' ).appendChild( node );
            }
            canvas.link.classList.toggle( "selected" );
            Object.assign( canvas, { src: "", link: undefined, selected: undefined } );
        }
        else {
            application.notify( { brief: "Information", msg: "Select image first" } );
        }
    } );
    [ ...helper.querySelectorAll( '.selectableImages .imagelist, .selectedImages .imagelist' ) ]
    .map( item => item.addEventListener( "dblclick", function () { helper.querySelector( '#CG-canvas-select' ).click(); } ) );
    
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
                    let list = [ ...helper.querySelectorAll( ".selectedImages .imagelist img" ) ];
                    application.images = list.map( item => item.src );
                    application?.notify( { brief: "Selection updated", msg: "Selected image list is updated" } );
                }
            }
        }
    }
    
    $client.runtime.onMessage.addListener( reactor );

    function registImage ( { src, localName } ) {
        let node = arguments[0];
        if ( !node.CGNode ) {
            if ( localName === "img") {
                application?.notify( { brief: "New image detected", src } );
                if ( !listO[src] ) listO[src] = [];
                helper.querySelector( ".selectableImages .imagelist" ).appendChild( ...HTML.render( { img: { src, CGNode: 1 } } ) );
            }
        }
    }

    {
        [ ...document.querySelectorAll( "img" ) ].filter( item => !item.CGNode )
            .map( item => ( ( item.src && !listO[item.src] ) ? listO[item.src] = [] : false ) );
        Object.entries( listO )
            .map( item => registImage( { src: item[0], localName: 'img' } ) );
        
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

    return {
        moveNext: Promise.resolve( async () => {} ),
        movePrev: Promise.resolve( async () => {} ),
        info: { raw: "manual mode", title: "manual", episode: "mode" },
        images: [],
        universal: {
            activateListener: function ( holder ) { application = holder; }
        }
    };
}

export { pageModule };