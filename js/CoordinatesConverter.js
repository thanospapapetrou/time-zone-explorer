'use strict';

class CoordinatesConverter {
    static #MIN_PER_DEG = 60;
    static #SEC_PER_MIN = 60;

    static dec2degMinSec(dec) {
        const deg = Math.floor(dec);
        const min = Math.floor((dec - deg) * CoordinatesConverter.#MIN_PER_DEG);
        const sec = Math.floor(((dec - deg) * CoordinatesConverter.#MIN_PER_DEG - min) * CoordinatesConverter.#SEC_PER_MIN);
        return [deg, min, sec];s
    }
}
