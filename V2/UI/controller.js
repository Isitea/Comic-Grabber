"use strict";
import { HTML, logger } from '/lib/extendVanilla.js';
import { resourceManager } from '/lib/resourceManager.js';
import { $client } from '/lib/unifyBrowser.js';
const $locale = $client.i18n.getMessage;

const log = logger.log;

class Controller {
    constructor ( baseUri, { moveNext, movePrev, info, images } ) {
        info.then( msg => {
            console.log( msg );
        } );
        //images.then( msg => console.log( msg ) );

        this.moveNext = moveNext;
        this.movePrev = movePrev;

        this.resource = new resourceManager( baseUri );
        this.constructUI().then( msg => this.activateUI() ).then( msg => log( `UI for ${$client.runtime.getManifest().className} is activated.` ) );
    }

    async constructUI () {
        let [ node ] = HTML.render( {
            div: {
                className: "ComicGrabber CG-menu",
                _child: [
                    {
                        label: {
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
                        label: {
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
        this.resource.load( "/ui/style.css" );
        //Attach event listeners
        document.body.appendChild( this.UINode );

        return "UI activated";
    }

    async deactivateUI () {
        if ( !this.UINode ) return "Already inactive";
        this.UINode.remove();
        this.UINode = null;
        this.resource.unload();

        return "UI deactivated";
    }

    async downloadImages ( { filename, conflictAction, images, uri = document.URL } ) {
        $client.runtime.sendMessage( { message: Date.now(), action: "download", data: { filename, conflictAction, images, uri } } );
    
        return this;
    }
}

export { Controller };
//"div.ComicGrabber.CG-menu>{div.CG-moveChapter#movePrev,div.CG-list>{div.CG-item},div.CG-moveChapter#moveNext}"