"use strict";
class Controller {
    async downloadImages () {}
}

class View {
    constructor () {}
    
    async attachCSS () {

    }

    async buildView () {
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabber CG-menu",
                _child: [
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
                                                    _child: [ { label: { htmlFor: "subTitle", textContent: $locale( "comicEpisode" ) } } ]
                                                }
                                            },
                                            {
                                                div: {
                                                    className: "CG-text",
                                                    _child: [ { input: { id: "subTitle", type: "text" } } ]
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
                                                    className: "CG-row CG-OutSide", id: "filenameRuleResult", _child: [ { label: {} }, { label: {} }, ]
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
                                                    className: "CG-row CG-OutSide CG-Second CG-SelectiveInvisible",
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
                                                    className: "CG-row CG-OutSide CG-First CG-SelectiveInvisible",
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
                        label: {
                            className: "CG-moveChapter",
                            id: "moveNext",
                            textContent: $locale( "moveNext" )
                        }
                    },
                ],
                _todo: node => {
                    for ( const item of node.querySelectorAll( "input[type=text], select" ) ) {
                        item.addEventListener( "change", () => this.syncModelView( "VtM", { cK: item.id, cV: item.value } ) );
                    }
                    for ( const item of node.querySelectorAll( ".CG-row .CG-checkbox:not(#saveToLocal):not(#showGrabbedImages)" ) ) {
                        item.addEventListener( "click", () => {
                            item.classList.toggle( "checked" );
                            item.parentNode.classList.toggle( "CG-SelectiveInvisible" );
                            this.syncModelView( "VtM", { cK: item.id, cV: item.classList.contains( "checked" ) } );
                        } );
                    }
                    let saveToLocal = () => {
                        console.log( `%cSave images to local as zip archive.`, $log );
                        if ( this.element.querySelector( ".CG-menu-button" ).classList.contains( "CG-alert" ) ) return this.notify( this.$localized.fillTextboxes );
                        node.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).classList.toggle( "checked" );
                        //node.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).removeEventListener( "click", saveToLocal );
                        this.saveToLocal(
                            {
                                localPath: this.$local.savePath,
                                onConflict: this.$local.onConflict,
                                filenameRule: this.$local.filenameRule,
                                title: this.$memory.title,
                                subTitle: this.$memory.subTitle
                            }
                        )
                        .then( download => {
                            console.log( `%cSend download information to downloader.`, $log );
                            $tunnel.broadcast( "ComicGrabber.saveArchive", download );

                            return new Promise( resolve => $tunnel.addListener( "ComicGrabber.archiveSaved", resolve ) );
                        } )
                        .then( () => {
                            console.log( `%cArchive saved.`, $inform );
                            $fillCircle = true;
                            this.drawProgressCircle( 1 );
                            if ( this.$session.moveOnSave ) this.moveChapter( this.move.next );
                        } );
                    };
                    node.querySelector( ".CG-row #moveNext" ).addEventListener( "click", () => this.moveChapter( this.move.next ) );
                    node.querySelector( ".CG-row #movePrev" ).addEventListener( "click", () => this.moveChapter( this.move.prev ) );
                    node.querySelector( ".CG-row .CG-checkbox#saveToLocal" ).addEventListener( "click", saveToLocal );

                    return node;
                },
            }
        } );
    }
}