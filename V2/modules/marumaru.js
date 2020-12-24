"use strict";
class module {
    constructor ( root = document ) {
        this.root = root;
    }

    moveNext () {
        this.root.querySelector( '.chapter_prev.fa-chevron-circle-right')?.click();
    }
    movePrev () {
        this.root.querySelector( '.chapter_prev.fa-chevron-circle-left')?.click();
    }

    removeAds ( method ) {
        let Ads = this.root.querySelectorAll( ".w_banner" );
        switch ( method ) {
            case "invisible": {
                for (let item of Ads ) item.style = "display: none !important;";
                break;
            }
            default: {
                for ( let item of Ads ) item.remove();
                break;
            }
        }
    }
    getInfo () {
        return { title: this.root.head.querySelector( "meta[name=title]" )?.content };
    }
    grabImages () {
        return [ ...this.root.querySelectorAll( ".view-img img" ) ].map( item => item.src );
    }
}

export { module };
