'use strict';

class TimeZoneExplorer {
    static #ERROR_LOADING = 'Error loading %s';
    static #LABEL_COUNT = (count, total) => `${count}/${total} Time Zones`;
    static #MAP_TILES_OPTIONS = {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    };
    static #MAP_TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    static #PARAMETER_DST = 'dst';
    static #PARAMETER_LAT = 'lat';
    static #PARAMETER_LNG = 'lng';
    static #PARAMETER_OFFSET = 'offset';
    static #PARAMETER_REGION = 'region';
    static #PARAMETER_SAVINGS = 'savings';
    static #PARAMETER_ZOOM = 'zoom';
    static #SELECTOR_CLEAR = 'button#clear';
    static #SELECTOR_COUNT = 'td#count';
    static #SELECTOR_DST = 'select#dst';
    static #SELECTOR_MAP = 'div#map';
    static #SELECTOR_OFFSET = 'select#offset';
    static #SELECTOR_REGION = 'select#region';
    static #SELECTOR_SAVINGS = 'select#savings';
    static #SELECTOR_ZONES = 'tbody#zones';
    static #TIME_ZONES = './json/time-zones.json';
    // TODO fix coordinates
    // TODO marker colors
    // TODO make selects contextual
    // TODO add more filters
    // TODO select rows and markers
    // TODO countries

    #map;
    #markers;
    #zones;

    static async main() {
        const explorer = await new TimeZoneExplorer();
        const params = new URLSearchParams(location.search);
        explorer.region = params.get(TimeZoneExplorer.#PARAMETER_REGION);
        explorer.offset = Number.parseInt(params.get(TimeZoneExplorer.#PARAMETER_OFFSET));
        explorer.dst = params.get(TimeZoneExplorer.#PARAMETER_DST);
        explorer.savings = Number.parseInt(params.get(TimeZoneExplorer.#PARAMETER_SAVINGS));
        explorer.lat = Number.parseFloat(params.get(TimeZoneExplorer.#PARAMETER_LAT)) || 0.0;
        explorer.lgn = Number.parseFloat(params.get(TimeZoneExplorer.#PARAMETER_LNG)) || 0.0;
        explorer.zoom = Number.parseInt(params.get(TimeZoneExplorer.#PARAMETER_ZOOM)) || 0;
    }

    constructor() {
        this.#map = L.map(document.querySelector(TimeZoneExplorer.#SELECTOR_MAP), {center: [0.0, 0.0], zoom: 0});
        L.tileLayer(TimeZoneExplorer.#MAP_TILES_URL, TimeZoneExplorer.#MAP_TILES_OPTIONS).addTo(this.#map);
        this.#markers = L.layerGroup().addTo(this.#map);
        return fetch(TimeZoneExplorer.#TIME_ZONES).then((response) => {
            if (!response.ok) {
                console.error(TimeZoneExplorer.#ERROR_LOADING, TimeZoneExplorer.#TIME_ZONES);
            }
            return response.json().then((zones) => {
                this.#zones = zones.map((zone) => new TimeZone(zone));
                this.#renderSelect(TimeZoneExplorer.#SELECTOR_REGION, (zone) => zone.region, undefined, undefined,
                        (event) => {
                            this.region = event.target.value;
                        });
                this.#renderSelect(TimeZoneExplorer.#SELECTOR_OFFSET, (zone) => zone.offset, (a, b) => a - b,
                        TimeZone.LABEL_H_M, (event) => {
                            this.offset = event.target.value;
                        });
                this.#renderSelect(TimeZoneExplorer.#SELECTOR_DST, (zone) => zone.dst, (a, b) => a - b,
                        TimeZone.LABEL_YES_NO, (event) => {
                            this.dst = event.target.value;
                        });
                this.#renderSelect(TimeZoneExplorer.#SELECTOR_SAVINGS, (zone) => zone.savings, (a, b) => a - b,
                        TimeZone.LABEL_H_M, (event) => {
                            this.savings = event.target.value;
                        });
                document.querySelector(TimeZoneExplorer.#SELECTOR_CLEAR).onclick = this.reset.bind(this);
                return this;
            });
        });
    }

    get region() {
        return this.#getSelect(TimeZoneExplorer.#SELECTOR_REGION, (region) => region || null);
    }

    set region(region) {
        this.#setSelect(TimeZoneExplorer.#SELECTOR_REGION, region);
        this.render();
    }

    get offset() {
        return this.#getSelectInt(TimeZoneExplorer.#SELECTOR_OFFSET);
    }

    set offset(offset) {
        this.#setSelect(TimeZoneExplorer.#SELECTOR_OFFSET, offset);
        this.render();
    }

    get dst() {
        return this.#getSelect(TimeZoneExplorer.#SELECTOR_DST,
                (dst) => (dst == true.toString()) || ((dst == false.toString()) ? false : null));
    }

    set dst(dst) {
        this.#setSelect(TimeZoneExplorer.#SELECTOR_DST, dst);
        this.render();
    }

    get savings() {
        return this.#getSelectInt(TimeZoneExplorer.#SELECTOR_SAVINGS);
    }

    set savings(savings) {
        this.#setSelect(TimeZoneExplorer.#SELECTOR_SAVINGS, savings);
        this.render();
    }

    get lat() {
        return this.#map.getCenter().lat;
    }

    set lat(lat) {
        this.#map.panTo(L.latLng(lat, this.lng), {animate: false});
    }

    get lng() {
        return this.#map.getCenter().lng;
    }

    set lng(lng) {
        this.#map.panTo(L.latLng(this.lat, lng), {animate: false});
    }

    get zoom() {
        return this.#map.getZoom();
    }

    set zoom(zoom) {
        this.#map.setZoom(zoom);
    }

    reset() {
        this.region = null;
        this.offset = null;
        this.dst = null;
        this.savings = null;
    }

    render() {
        while (document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES).firstChild) {
            document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES)
                    .removeChild(document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES).firstChild);
        }
        this.#markers.clearLayers();
        this.#filter()
                .map((zone) => zone.render())
                .forEach((zone) => {
                    document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES).appendChild(zone.row);
                    zone.marker.addTo(this.#markers);
                });
        document.querySelector(TimeZoneExplorer.#SELECTOR_COUNT)
                .removeChild(document.querySelector(TimeZoneExplorer.#SELECTOR_COUNT).firstChild);
        document.querySelector(TimeZoneExplorer.#SELECTOR_COUNT)
                .appendChild(document.createTextNode(TimeZoneExplorer.#LABEL_COUNT(this.#filter().length,
                this.#zones.length)));
    }

    #filter() {
        return this.#zones.filter((zone) => (this.region === null) || (zone.region == this.region))
                .filter((zone) => (this.offset === null) || (zone.offset == this.offset))
                .filter((zone) => (this.dst === null) || (zone.dst == this.dst))
                .filter((zone) => (this.savings === null) || (zone.savings == this.savings));

    }

    #renderSelect(selector, value, comparator, label, onchange) {
        [...new Set(this.#zones.map(value))].sort(comparator).forEach((value) => {
            const option = document.querySelector(selector).appendChild(document.createElement(HtmlElements.OPTION));
            option.appendChild(document.createTextNode(label ? label(value) : value));
            option.value = value;
        });
        document.querySelector(selector).onchange = onchange;
    }

    #getSelect(selector, map) {
        const value = document.querySelector(selector).value;
        return map ? map(value) : value;
    }

    #getSelectInt(selector) {
        const value = this.#getSelect(selector, Number.parseInt);
        return Number.isNaN(value) ? null : value;
    }

    #setSelect(selector, value) {
        document.querySelector(selector).value = ([...document.querySelector(selector).options]
                .filter((option) => option.value == value)[0] || document.querySelector(selector).options[0]).value;
    }
}
