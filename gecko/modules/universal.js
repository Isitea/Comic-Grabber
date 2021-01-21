"use strict";

async function pageModule() {
    const { baseUri, pageUid } = ( () => {
        try { throw new Error() }
        catch ( { fileName } ) { return fileName.match( /(?<baseUri>^.+?\/\/.+?\/).*\#(?<pageUid>.+)?/ ).groups; }
    } )();
    console.log( pageUid );
    const $client = ( await import( `/lib/browserUnifier.js#${pageUid}` ) ).$client;
    await $client.complete; //Polyfill browser api for Firefox

    function getAbsolutePosition ( dom ) {
        let { top, left, width } = dom.getBoundingClientRect();
        let { x, y } = document.body.getBoundingClientRect();
        return { top: top - y, left: left - x, width };
    }

    const images = [], markers = [];
    let modeStatus = false, application;
    function selectImage ( event ) {
        event.preventDefault();
        event.stopPropagation();
        let { target } = event;
        let index;
        if ( ( index = images.indexOf( target ) ) > -1 ) {
            images.splice( index, 1 );
            ( markers.splice( index, 1 ) )[0].remove();
            markers.map( ( item, index ) => item.textContent = index + 1 );
        }
        else {
            let { top, left, width } = getAbsolutePosition( target );
            let marker = document.createElement( "div" );
            images.push( target );
            markers.push( marker );
            marker.classList.add( "CG-selector-marker" );
            marker.textContent = markers.length;
            marker.style.cssText = `top: ${top}px; left: ${left + width}px;`;
            document.body.appendChild( marker );
        }
    }

    function reactor ( { action, data } ) {
        console.log( action, data );
        switch ( action ) {
            case "toggleMode": {
                modeStatus = !modeStatus;
                if ( modeStatus ) {
                    document.body.dispatchEvent( new Event( "CG-universal-activated" ) );
                    document.body.classList.add( "CG-selector-active" );
                    let list = [ ...document.querySelectorAll( "img" ) ];
                    list.map( item => { item.classList.add( "CG-selectable" ); item.addEventListener( "click", selectImage ) } );
                }
                else {
                    document.body.classList.remove( "CG-selector-active" );
                    let list = [ ...document.querySelectorAll( "img.CG-selectable" ) ];
                    list.map( item => { item.classList.remove( "CG-selectable" ); item.removeEventListener( "click", selectImage ) } );
                    if ( images.length ) {
                        console.log( application );
                        application.images = images.map( item => item.src );
                        application.notify( { brief: "Selection updated", msg: "Selected image list is updated" } );
                    }
                }
            }
        }
    }

    $client.runtime.onMessage.addListener( reactor );
    await new Promise( res => document.body.addEventListener( "CG-universal-activated", res, { once: true } ) );

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