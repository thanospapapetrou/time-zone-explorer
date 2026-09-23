'use strict';

class TimeZone {
    static LABEL_H_M = (ms) => `${(ms < 0) ? '-' : ((ms > 0) ? '+' : '')}${String(TimeConverter.ms2hMin(Math.abs(ms))[0]).padStart(2, '0')}:${String(TimeConverter.ms2hMin(Math.abs(ms))[1]).padStart(2, '0')}`;
    static LABEL_YES_NO = (boolean) => `${boolean ? 'Yes' : 'No'}`
    static #CLASS_BOOLEAN = 'boolean';
    static #CLASS_DETAILS = 'details';
    static #CLASS_NUMERIC = 'numeric';
    static #CLASS_SELECTED = 'selected';
    static #LABEL_BOOLEAN = (boolean) => `${boolean ? '✔' : '✘'}`;
    static #LABEL_CITY = 'City';
    static #LABEL_COUNTRY = 'Country';
    static #LABEL_DEC = (dec) => `${(dec < 0) ? '-' : ((dec > 0) ? '+' : '')}${Math.abs(dec)}`;
    static #LABEL_DST = 'DST';
    static #LABEL_LAT = (dec) => `${CoordinatesConverter.dec2degMinSec(Math.abs(dec))[0]}° ${CoordinatesConverter.dec2degMinSec(Math.abs(dec))[1]}′ ${CoordinatesConverter.dec2degMinSec(Math.abs(dec))[2]}″${(dec < 0) ? ' S' : ((dec > 0) ? ' N' : '')}`;
    static #LABEL_LATITUDE = 'Latitude';
    static #LABEL_LNG = (dec) => `${CoordinatesConverter.dec2degMinSec(Math.abs(dec))[0]}° ${CoordinatesConverter.dec2degMinSec(Math.abs(dec))[1]}′ ${CoordinatesConverter.dec2degMinSec(Math.abs(dec))[2]}″${(dec < 0) ? ' W' : ((dec > 0) ? ' E' : '')}`;
    static #LABEL_LONGITUDE = 'Longitude';
    static #LABEL_MS = (ms) => `${(ms < 0) ? '-' : ((ms > 0) ? '+' : '')}${Math.abs(ms).toLocaleString('en')} ms`;
    static #LABEL_OFFSET = 'Offset';
    static #LABEL_REGION = 'Region';
    static #LABEL_SAVINGS = 'Savings';
    static #LABEL_SUBREGION = 'Subregion';
    static #MARKER_ANCHOR = L.point(12, 41);
    static #MARKER_ICON = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    static #MARKER_SCALE = 1.5;
    static #MARKER_SIZE = L.point(25, 41);

    #zone;
    #row;
    #marker;

    constructor(zone, country) {
        this.#zone = zone;
        this.#zone.country = {code: this.#zone.country, name: country};
        this.#row = null;
        this.#marker = null;
    }

    get region() {
        return this.#zone.region;
    }

    get subregion() {
        return this.#zone.subregion;
    }

    get offset() {
        return this.#zone.offset;
    }

    get dst() {
        return this.#zone.dst;
    }

    get savings() {
        return this.#zone.savings;
    }

    render() {
        this.#renderRow();
        this.#renderMarker();
        return {row: this.#row, marker: this.#marker};
    }

    highlight() {
        this.#row.classList.add(TimeZone.#CLASS_SELECTED);
        this.#marker.setIcon(L.icon({
            iconUrl: TimeZone.#MARKER_ICON,
            iconSize: TimeZone.#MARKER_SIZE.multiplyBy(TimeZone.#MARKER_SCALE),
            iconAnchor: TimeZone.#MARKER_ANCHOR.multiplyBy(TimeZone.#MARKER_SCALE)
        }));
        // TODO marker z index
    }

    reset() {
        this.#row.classList.remove(TimeZone.#CLASS_SELECTED);
        this.#marker.setIcon(L.icon({
            iconUrl: TimeZone.#MARKER_ICON,
            iconSize: TimeZone.#MARKER_SIZE,
            iconAnchor: TimeZone.#MARKER_ANCHOR
        }));
    }

    #renderRow() {
        this.#row = document.createElement(HtmlElements.TR);
        this.#row.appendChild(document.createElement(HtmlElements.TD)).appendChild(document.createTextNode(this.#zone.id));
        this.#row.appendChild(document.createElement(HtmlElements.TD))
                .appendChild(document.createTextNode(this.#zone.region));
        this.#row.appendChild(document.createElement(HtmlElements.TD))
                .appendChild(document.createTextNode(this.#zone.subregion));
        this.#row.appendChild(this.#renderCountry(this.#zone.country));
        this.#row.appendChild(document.createElement(HtmlElements.TD))
                .appendChild(document.createTextNode(this.#zone.city));
        this.#row.appendChild(this.#renderCoordinate(this.#zone.lat, false));
        this.#row.appendChild(this.#renderCoordinate(this.#zone.lng, true));
        this.#row.appendChild(this.#renderDuration(this.#zone.offset));
        this.#row.appendChild(this.#renderBoolean(this.#zone.dst));
        this.#row.appendChild(this.#renderDuration(this.#zone.savings));
        this.#row.addEventListener(Events.MOUSE_OVER, this.highlight.bind(this));
        this.#row.addEventListener(Events.MOUSE_OUT, this.reset.bind(this));
    }

    #renderMarker() {
        this.#marker = L.marker([this.#zone.lat, this.#zone.lng], {title: this.#zone.id}).bindPopup(this.#renderPopup());
        this.#marker.addEventListener(Events.MOUSE_OVER, this.highlight.bind(this));
        this.#marker.addEventListener(Events.MOUSE_OUT, this.reset.bind(this));
    }

    #renderPopup() {
        const popup = document.createElement(HtmlElements.DIV);
        popup.appendChild(document.createElement(HtmlElements.H2)).appendChild(document.createTextNode(this.#zone.id));
        const dl = popup.appendChild(document.createElement(HtmlElements.DL));
        Object.entries({
            [TimeZone.#LABEL_REGION]: this.#zone.region,
            [TimeZone.#LABEL_SUBREGION]: this.#zone.subregion,
            [TimeZone.#LABEL_COUNTRY]: this.#zone.country.name,
            [TimeZone.#LABEL_CITY]: this.#zone.city,
            [TimeZone.#LABEL_LATITUDE]: TimeZone.#LABEL_LAT(this.#zone.lat),
            [TimeZone.#LABEL_LONGITUDE]: TimeZone.#LABEL_LNG(this.#zone.lng),
            [TimeZone.#LABEL_OFFSET]: TimeZone.LABEL_H_M(this.#zone.offset)
        }).forEach(([term, definition]) => {
            dl.appendChild(document.createElement(HtmlElements.DT)).appendChild(document.createTextNode(term));
            dl.appendChild(document.createElement(HtmlElements.DD)).appendChild(document.createTextNode(definition));
        });
        dl.appendChild(document.createElement(HtmlElements.DT))
                .appendChild(document.createTextNode(TimeZone.#LABEL_DST));
        const dd = dl.appendChild(document.createElement(HtmlElements.DD));
        const symbol = dd.appendChild(document.createElement(HtmlElements.SPAN));
        symbol.classList.add(this.#zone.dst);
        symbol.appendChild(document.createTextNode(TimeZone.#LABEL_BOOLEAN(this.#zone.dst)));
        dd.appendChild(document.createElement(HtmlElements.SPAN))
                .appendChild(document.createTextNode(TimeZone.LABEL_YES_NO(this.#zone.dst)));
        dl.appendChild(document.createElement(HtmlElements.DT))
                .appendChild(document.createTextNode(TimeZone.#LABEL_SAVINGS));
        dl.appendChild(document.createElement(HtmlElements.DD))
                .appendChild(document.createTextNode(TimeZone.LABEL_H_M(this.#zone.savings)));
        return popup.getHTML();
    }

    #renderCountry(country) {
        const cell = document.createElement(HtmlElements.TD);
        cell.appendChild(document.createTextNode(country.name));
        cell.appendChild(document.createElement(HtmlElements.BR));
        const details = cell.appendChild(document.createElement(HtmlElements.SPAN));
        details.classList.add(TimeZone.#CLASS_DETAILS);
        details.appendChild(document.createTextNode(country.code));
        return cell;
    }

    #renderCoordinate(dec, lng) {
        const cell = document.createElement(HtmlElements.TD);
        cell.classList.add(TimeZone.#CLASS_NUMERIC);
        cell.appendChild(document.createTextNode((lng ? TimeZone.#LABEL_LNG : TimeZone.#LABEL_LAT)(dec)));
        cell.appendChild(document.createElement(HtmlElements.BR));
        const details = cell.appendChild(document.createElement(HtmlElements.SPAN));
        details.classList.add(TimeZone.#CLASS_DETAILS);
        details.appendChild(document.createTextNode(TimeZone.#LABEL_DEC(dec)));
        return cell;
    }

    #renderDuration(duration) {
        const cell = document.createElement(HtmlElements.TD);
        cell.classList.add(TimeZone.#CLASS_NUMERIC);
        cell.appendChild(document.createTextNode(TimeZone.LABEL_H_M(duration)));
        cell.appendChild(document.createElement(HtmlElements.BR));
        const details = cell.appendChild(document.createElement(HtmlElements.SPAN));
        details.classList.add(TimeZone.#CLASS_DETAILS);
        details.appendChild(document.createTextNode(TimeZone.#LABEL_MS(duration)));
        return cell;
    }

    #renderBoolean(boolean) {
        const cell = document.createElement(HtmlElements.TD);
        cell.classList.add(TimeZone.#CLASS_BOOLEAN);
        const symbol = cell.appendChild(document.createElement(HtmlElements.SPAN));
        symbol.classList.add(boolean);
        symbol.appendChild(document.createTextNode(TimeZone.#LABEL_BOOLEAN(boolean)));
        cell.appendChild(document.createElement(HtmlElements.SPAN))
                .appendChild(document.createTextNode(TimeZone.LABEL_YES_NO(boolean)));
        cell.appendChild(document.createElement(HtmlElements.BR));
        const details = cell.appendChild(document.createElement(HtmlElements.SPAN));
        details.classList.add(TimeZone.#CLASS_DETAILS);
        details.appendChild(document.createTextNode(boolean));
        return cell;
    }
}
