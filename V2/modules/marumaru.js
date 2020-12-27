"use strict";
class pageModule {
    constructor ( root = document ) {
        this.root = root;
    }

    async moveNext () {
        return this.root.querySelector( '.chapter_prev.fa-chevron-circle-right')?.click();
    }
    async movePrev () {
        return this.root.querySelector( '.chapter_prev.fa-chevron-circle-left')?.click();
    }

    async removeAds ( method ) {
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
    async getInfo () {
        return { title: this.root.head.querySelector( "meta[name=title]" )?.content };
    }
    async grabImages () {
        return [ ...this.root.querySelectorAll( ".view-img img" ) ].map( item => item.src );
    }
}

export { pageModule };
