"use strict";
import { constant } from '/lib/constant.js';
import { HTML, logger, uid } from '/lib/extendVanilla.js';
import { resourceManager } from '/lib/resourceManager.js';
import { $client } from '/lib/browserUnifier.js';
const $locale = $client.i18n.getMessage;

class Controller extends EventTarget {
    constructor ( pageModule ) {
        super();
        Object.defineProperties( this, {
            clientUid: { value: uid(), writable: false, configurable: false, enumerable: false },
            pageModule: { value: pageModule, writable: false, configurable: false, enumerable: false },
            state: { value: constant.__loaded__, writable: true, configurable: false, enumerable: false },
            resource: { value: new resourceManager( $client.runtime.getURL( "" ).replace( /\/$/, "" ) ), writable: false, configurable: false, enumerable: false },
            UINode: { writable: true, configurable: true, enumerable: false },
        } );
        this.init( this.pageModule() )
            .then( msg => this.constructUI( ) )
            .then( msg => this.activateUI( ) )
            .then( msg => logger.log( `UI for ${$client.runtime.getManifest().name } is activated.` ) )
            .then( () => this.changeState( constant.__ready__ ) );
    }

    async chekcStorage ( raw, holder ) {
        let info = await raw;
        if ( typeof info.raw == "string" ) {
            let title = sessionStorage.getItem( "title" );
            if ( title && info.title.match( title ) ) {
                info.title = title.toFilename();
                info.episode = info.raw.replace( title, "" ).toFilename();
            }
            else {
                sessionStorage.removeItem( "title" );
                info.title = info.title?.toFilename() || "";
                info.episode = info.episode?.toFilename() || "";
            }
        }
        else {
            info.title = "";
            info.episode = "";
        }
        for ( let key of [ "saveOnLoad", "moveOnSave" ] ) info[key] = JSON.parse( sessionStorage.getItem( key ) )?.value || false;
        let downloadFolder = localStorage.getItem( "downloadFolder" );
        if ( downloadFolder ) info.downloadFolder = downloadFolder;

        holder.addEventListener( "infochange", ( { data: { key, value } } ) => {
            switch ( key ) {
                case "saveOnLoad": 
                case "moveOnSave": {
                    sessionStorage.setItem( key, JSON.stringify( { value } ) );
                    break;
                }
                case "title": {
                    sessionStorage.setItem( key, value );
                    break;
                }
                case "downloadFolder": {
                    localStorage.setItem( key, value );
                    break;
                }
            }
        } );

        return info;
    }

    async init ( { moveNext, movePrev, info, images } ) {
        let holder = this;
        Object.defineProperties( this, {
            images: { value: await images, writable: true, configurable: false, enumerable: false },
            info: { value: new Proxy( ( await this.chekcStorage( info, holder ) ), { set: function ( obj, key, value ) {
                let event = new Event( "infochange" );
                if ( typeof value === "string" ) value = value.toFilename();
                event.data = { key, value };
                holder.dispatchEvent( event );
                return Reflect.set( obj, key, value );
            } } ), writable: true, configurable: false, enumerable: false },
            moveNext: { value: await moveNext, writable: false, configurable: false, enumerable: true },
            movePrev: { value: await movePrev, writable: false, configurable: false, enumerable: true },
        } );
        this.info.downloadFolder = localStorage.getItem( "downloadFolder" ) || "Downloaded Comics"; //Dev
        return "Data processing completed";
    }

    changeState ( state ) {
        this.state = state;
        this.dispatchEvent( new Event( "statechange" ) );
    }

    async constructUI () {
        if ( this.UINode ) return "UI already generated";
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabber CG-menu",
                _child: [
                    {
                        div: {
                            className: "CG-menuButton",
                            id: "menuButton"
                        }
                    },
                    {
                        label: {
                            className: "CG-moveChapter",
                            id: "movePrev",
                            textContent: $locale( "movePrev" )
                        }
                    },
                    {
                        div: {
                            className: "CG-list",
                            _child: [
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [ { label: { htmlFor: "downloadFolder", textContent: $locale( "downloadFolder" ) } } ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [ { input: { id: "downloadFolder", type: "text" } } ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [ { label: { htmlFor: "title", textContent: $locale( "comicTitle" ) } } ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [ { input: { id: "title", type: "text" } } ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-label",
                                                    _child: [ { label: { htmlFor: "episode", textContent: $locale( "comicEpisode" ) } } ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [ { input: { id: "episode", type: "text" } } ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row", id: "filenameRuleResult", _child: [ { label: {} }, { label: {} }, ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row",
                                                    _child: [ { label: { className: "CG-checkbox", id: "saveToLocal", textContent: $locale( "downloadImages" ) } } ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row",
                                                    _child: [ { label: { className: "CG-checkbox", id: "saveOnLoad", textContent: $locale( "downloadOnLoad" ) } } ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    div: {
                                        className: "CG-item",
                                        _child: [
                                            {
                                                div: {
                                                    className: "CG-row",
                                                    _child: [ { label: { className: "CG-checkbox", id: "moveOnSave", textContent: $locale( "moveOnDownload" ) } } ]
                                                }
                                            }
                                        ]
                                    }
                                },
                            ]
                        }
                    },
                    {
                        div: {
                            className: "CG-moveChapter",
                            id: "moveNext",
                            textContent: $locale( "moveNext" )
                        }
                    },
                ],
            }
        } );
        this.UINode = node;

        return "UI structure generated";
    }

    async activateUI () {
        if ( !this.UINode ) throw "UI not ready";
        this.resource.load( "/ui/style.css" );
        let holder = this;
        if ( holder.state === constant.__loaded__ ) {
            //Attach event listeners
            function bind ( id, holder ) {
                let contentBox = holder.UINode.querySelector( `#${id}` );
                contentBox.value = holder.info[id];
                holder.addEventListener( "infochange", ( { data: { key, value } } ) => { if ( key === id ) { contentBox.value = value; } } );
                contentBox.addEventListener( "change", ( { target } ) => holder.info[id] = target.value.toFilename() );
            }
            function toggle ( { target }, force ) {
                holder.info[target.id] = target.toggleAttribute( "active", force );
            }

            bind( "title", holder );
            bind( "episode", holder );
            bind( "downloadFolder", holder );

            holder.UINode.querySelector( `#movePrev` ).addEventListener( "click", holder.movePrev );
            holder.UINode.querySelector( `#moveNext` ).addEventListener( "click", holder.moveNext );
            for ( let id of [ "saveOnLoad", "moveOnSave" ] ) {
                let node = holder.UINode.querySelector( `#${id}` );
                toggle( { target: node }, holder.info[id] );
                node.addEventListener( "click", toggle );
            }
            holder.UINode.querySelector( `#saveToLocal` ).addEventListener( "click", ( { target} ) => {
                target.toggleAttribute( "active" );
                holder.downloadImages( {} )
                    .then( filename => {
                        holder.notify( `${filename} is downloded` );
                        if ( holder.info.moveOnSave ) return holder.moveNext();
                    } )
                    .catch( filename => holder.notify( `Failed to download ${filename}` ) )
                    .finally( () => target.toggleAttribute( "active" ) )
            } );
        }
        holder.addEventListener( "statechange", ( { target: { state } } ) => {
            if ( holder.info.saveOnLoad && state === constant.__ready__ ) holder.UINode.querySelector( `#saveToLocal` ).click();
        }, { once: true } );

        document.body.appendChild( this.UINode );

        return "UI activated";
    }

    refresh () {
        this.resource.unload();
        this.resource.load( "/ui/style.css" );
    }

    async deactivateUI () {
        if ( !this.UINode.parentNode ) return "Already inactive";
        this.UINode.remove();
        this.resource.unload();

        return "UI deactivated";
    }

    notify ( msg ) {
        logger.inform( msg );
    }

    downloadImages ( { filename = `${this.info.downloadFolder}/${this.info.title}/${this.info.episode}.zip`, conflictAction, uri = document.URL } ) {
        switch ( this.state ) {
            case constant.__loaded__:
            case constant.__downloading__: {
                return Promise.reject( this.state );
            }
            case constant.__ready__: {
                if ( !this.images.length ) return Promise.reject( constant.__nothing__ );
                this.changeState( constant.__downloading__ );
                return new Promise( ( resolve, reject ) => {
                    let holder = this;
                    holder.notify( `Downloading ${filename}` )
                    function listener ( { action, clientUid, data: { result, filename } }, sender ) {
                        if ( clientUid === holder.clientUid && action === "download" ) {
                            switch ( result ) {
                                case "interrupted" : {
                                    reject( filename );
                                    break;
                                }
                                case "complete" : {
                                    resolve( filename );
                                    break;
                                }
                                default:{ return; }
                            }
                            $client.runtime.onMessage.removeListener( listener );
                            holder.changeState( constant.__ready__ );
                        }
                    }
                    $client.runtime.sendMessage( { message: Date.now(), clientUid: this.clientUid, action: "download", data: { filename, conflictAction, images: this.images, uri } } );
                    $client.runtime.onMessage.addListener( listener );
                } );
            }
        }
    }

    ready ( msg ) {
        return new Promise( response => {
            function listener ( event ) {
                if ( event.target.state === constant.__ready__ ) response();
                else event.target.addEventListener( "statechange", listener, { once: true } );
            }
            if ( this.state === constant.__ready__ ) response();
            else {
                this.addEventListener( "statechange", listener, { once: true } );
            }
        } )
            .then( () => msg );
    }
}

export { Controller };
