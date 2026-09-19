'use strict';

class TimeZoneExplorer {
    static #ERROR_LOADING = 'Error loading %s';
    static #LABEL_COUNT = (count, total) => `${count}/${total} Time Zones`;
    static #MAP_TILES_OPTIONS = {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    };
    static #MAP_TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    static #PARAMETER_LAT = 'lat';
    static #PARAMETER_LNG = 'lng';
    static #PARAMETER_OFFSET = 'offset';
    static #PARAMETER_REGION = 'region';
    static #PARAMETER_ZOOM = 'zoom';
    static #SELECTOR_COUNT = 'td#count';
    static #SELECTOR_DST = 'select#dst';
    static #SELECTOR_MAP = 'div#map';
    static #SELECTOR_OFFSET = 'select#offset';
    static #SELECTOR_REGION = 'select#region';
    static #SELECTOR_SAVINGS = 'select#savings';
    static #SELECTOR_ZONES = 'tbody#zones';
    static #TIME_ZONES = './json/time-zones.json';
    // TODO fix coordinates
    // TODO highlight markers and rows
    // TODO marker colors
    // TODO reset all
    // TODO count is not updated
    // TODO make selects contextual
    // TODO add more filters
    // TODO format select options
    // TODO sort select options
    // TODO select rows and markers
    

    #map;
    #markers;
    #zones;

    static async main() {
        const params = new URLSearchParams(location.search);
        (await (new TimeZoneExplorer(params.get(TimeZoneExplorer.#PARAMETER_REGION),
                Number.parseInt(params.get(TimeZoneExplorer.#PARAMETER_OFFSET)),
                Number.parseFloat(params.get(TimeZoneExplorer.#PARAMETER_LAT)) || 0.0,
                Number.parseFloat(params.get(TimeZoneExplorer.#PARAMETER_LNG)) || 0.0,
                Number.parseInt(params.get(TimeZoneExplorer.#PARAMETER_ZOOM)) || 0))).render();
    }

    constructor(region, offset, lat, lng, zoom) {
        this.#map = L.map(document.querySelector(TimeZoneExplorer.#SELECTOR_MAP), {center: [0.0, 0.0], zoom: 0});
        L.tileLayer(TimeZoneExplorer.#MAP_TILES_URL, TimeZoneExplorer.#MAP_TILES_OPTIONS).addTo(this.#map);
        this.#markers = L.layerGroup().addTo(this.#map);
        return fetch(TimeZoneExplorer.#TIME_ZONES).then((response) => {
            if (!response.ok) {
                console.error(TimeZoneExplorer.#ERROR_LOADING, TimeZoneExplorer.#TIME_ZONES);
            }
            return response.json().then((zones) => {
                this.#zones = zones.map((zone) => new TimeZone(zone));
                new Set(this.#zones.map((zone) => zone.region).sort()).forEach((region) => {
                    const option = document.querySelector(TimeZoneExplorer.#SELECTOR_REGION)
                            .appendChild(document.createElement(HtmlElements.OPTION));
                    option.appendChild(document.createTextNode(region));
                    option.value = region;
                });
                document.querySelector(TimeZoneExplorer.#SELECTOR_REGION).onchange = (event) => {
                    this.region = event.target.value;
                };
                new Set(this.#zones.map((zone) => zone.offset).sort()).forEach((offset) => {
                    const option = document.querySelector(TimeZoneExplorer.#SELECTOR_OFFSET) // TODO this sorting is not working
                            .appendChild(document.createElement(HtmlElements.OPTION));
                    option.appendChild(document.createTextNode(TimeZone.LABEL_H_M(offset)));
                    option.value = offset;
                });
                document.querySelector(TimeZoneExplorer.#SELECTOR_OFFSET).onchange = (event) => {
                    this.offset = event.target.value;
                };
                new Set(this.#zones.map((zone) => zone.dst).sort()).forEach((dst) => {
                    const option = document.querySelector(TimeZoneExplorer.#SELECTOR_DST)
                            .appendChild(document.createElement(HtmlElements.OPTION));
                    option.appendChild(document.createTextNode(dst));
                    option.value = dst;
                });
                document.querySelector(TimeZoneExplorer.#SELECTOR_DST).onchange = (event) => {
                    this.dst = event.target.value;
                };
                new Set(this.#zones.map((zone) => zone.savings).sort()).forEach((savings) => {
                    const option = document.querySelector(TimeZoneExplorer.#SELECTOR_SAVINGS)
                            .appendChild(document.createElement(HtmlElements.OPTION));
                    option.appendChild(document.createTextNode(savings));
                    option.value = savings;
                });
                document.querySelector(TimeZoneExplorer.#SELECTOR_SAVINGS).onchange = (event) => {
                    this.savings = event.target.value;
                };
                this.region = region;
                this.offset = offset;
                this.lat = lat;
                this.lng = lng;
                this.zoom = zoom;
                return this;
            });
        });
    }

    get region() {
        const region = document.querySelector(TimeZoneExplorer.#SELECTOR_REGION).value;
        return region || null;
    }

    set region(region) {
        document.querySelector(TimeZoneExplorer.#SELECTOR_REGION).value =
                ([...document.querySelector(TimeZoneExplorer.#SELECTOR_REGION).options]
                .filter((option) => option.value == region)[0]
                || document.querySelector(TimeZoneExplorer.#SELECTOR_REGION).options[0]).value;
        this.render();
    }

    get offset() {
        const offset = Number.parseInt(document.querySelector(TimeZoneExplorer.#SELECTOR_OFFSET).value);
        return Number.isNaN(offset) ? null : offset;
    }

    set offset(offset) {
        document.querySelector(TimeZoneExplorer.#SELECTOR_OFFSET).value =
                    ([...document.querySelector(TimeZoneExplorer.#SELECTOR_OFFSET).options]
                    .filter((option) => option.value == offset)[0]
                    || document.querySelector(TimeZoneExplorer.#SELECTOR_OFFSET).options[0]).value;
        this.render();
    }

    get dst() {
        const dst = document.querySelector(TimeZoneExplorer.#SELECTOR_DST).value;
         return (dst == true.toString()) || ((dst == false.toString()) ? false : null);
    }

    set dst(dst) {
        document.querySelector(TimeZoneExplorer.#SELECTOR_DST).value =
                    ([...document.querySelector(TimeZoneExplorer.#SELECTOR_DST).options]
                    .filter((option) => option.value == dst)[0]
                    || document.querySelector(TimeZoneExplorer.#SELECTOR_DST).options[0]).value;
        this.render();
    }

    get savings() {
        const savings = Number.parseInt(document.querySelector(TimeZoneExplorer.#SELECTOR_SAVINGS).value);
        return Number.isNaN(savings) ? null : savings;
    }

    set savings(savings) {
        document.querySelector(TimeZoneExplorer.#SELECTOR_SAVINGS).value =
                    ([...document.querySelector(TimeZoneExplorer.#SELECTOR_SAVINGS).options]
                    .filter((option) => option.value == savings)[0]
                    || document.querySelector(TimeZoneExplorer.#SELECTOR_SAVINGS).options[0]).value;
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

    render() {
        while (document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES).firstChild) {
            document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES)
                    .removeChild(document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES).firstChild);
        }
        this.#markers.clearLayers();
        this.#zones.filter((zone) => (this.region === null) || (zone.region == this.region))
                .filter((zone) => (this.offset === null) || (zone.offset == this.offset))
                .filter((zone) => (this.dst === null) || (zone.dst == this.dst))
                .filter((zone) => (this.savings === null) || (zone.savings == this.savings))
                .map((zone) => zone.render())
                .forEach((zone) => {
                    document.querySelector(TimeZoneExplorer.#SELECTOR_ZONES).appendChild(zone.row);
                    zone.marker.addTo(this.#markers);
                });
        document.querySelector(TimeZoneExplorer.#SELECTOR_COUNT)
                .removeChild(document.querySelector(TimeZoneExplorer.#SELECTOR_COUNT).firstChild);
        document.querySelector(TimeZoneExplorer.#SELECTOR_COUNT)
                .appendChild(document.createTextNode(TimeZoneExplorer.#LABEL_COUNT(this.#zones
                .filter((zone) => (!this.region) || (zone.region == this.region)).length, this.#zones.length)));
    }
}
