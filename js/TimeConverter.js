'use strict';

class TimeConverter {
    static #MIN_PER_H = 60;
    static #S_PER_MIN = 60;
    static #MS_PER_S = 1000;

    static ms2hMin(ms) {
        const h = Math.floor(ms / TimeConverter.#MS_PER_S / TimeConverter.#S_PER_MIN / TimeConverter.#MIN_PER_H);
        const min = Math.floor((ms - h * TimeConverter.#MIN_PER_H * TimeConverter.#S_PER_MIN * TimeConverter.#MS_PER_S) / TimeConverter.#MS_PER_S / TimeConverter.#S_PER_MIN);
        return [h, min];
    }
}
