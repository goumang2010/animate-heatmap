/*
    Copyright (c) 2017, Baidu Inc.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
    2. Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
    ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
    ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    The views and conclusions contained in the software and documentation are those
    of the authors and should not be interpreted as representing official policies,
    either expressed or implied, of the FreeBSD Project.
*/
/**
 * @file defines echarts Heatmap Chart
 * @author Ovilia (me@zhangwenli.com)
 * Inspired by https://github.com/mourner/simpleheat
 *
 * @module
 */
import { defaultOptions, GRADIENT_LEVELS, BRUSH_SIZE } from './constants';
import { filterPoints } from './utils';
/**
 * Heatmap Chart
 *
 * @class
 * @param {Object} opt options
 */
function Heatmap(opt) {
    this.setOption(opt);
}
Heatmap.prototype = {
    /**
     * Renders Heatmap and returns the rendered canvas
     * @param {Array} [x, y, value] array of data
     * @param {number} canvas width
     * @param {number} canvas height
     * @return {Object} rendered canvas
     */
    init: function({ width, height }) {
        this.width = width;
        this.height = height;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        this.ctx = ctx;
        this.canvas = canvas;
    },
    setOption(opt) {
        this.option = { ...defaultOptions, ...opt };
        this.r = Math.round(BRUSH_SIZE + this.option.blurSize);
        this.brush = this._getBrush();
        this.gradient = this._getGradient();
    },
    color(imageData) {
        const gradient = this.gradient;
        const { opacity, bgAlpha } = this.option;
        let pixels = imageData.data;
        let plen = pixels.length / 4;
        while (plen--) {
            var id = plen * 4 + 3;
            var alpha = pixels[id] / 256;
            var colorOffset = Math.floor(alpha * (GRADIENT_LEVELS - 1));
            pixels[id - 3] = gradient[colorOffset * 4]; // red
            pixels[id - 2] = gradient[colorOffset * 4 + 1]; // green
            pixels[id - 1] = gradient[colorOffset * 4 + 2]; // blue
            pixels[id] *= opacity;
            (pixels[id] < bgAlpha) && (pixels[id] = bgAlpha);// alpha
        }
        return imageData;
    },
    setBackgroud({ctx = this.ctx, imageData = ctx.getImageData(0, 0, this.width, this.height), bgAlpha} = {}) {
        if(bgAlpha == null) {
            bgAlpha = this.option.bgAlpha;
        } else {
            this.option.bgAlpha =bgAlpha;
        }
        let pixels = imageData.data;
        let plen = pixels.length / 4;
        while (plen--) {
            var id = plen * 4 + 3;
            (pixels[id] === 0) && (pixels[id] = bgAlpha)
        }
        ctx.putImageData(imageData, 0, 0);
    },
    drawArea({ ctx = this.ctx, data, dx = 0, dy = 0, width = this.width, height = this.height } = {}) {
        const r = this.r;
        const { minAlpha, valueScale } = this.option;
        // create new canvas
        let _ctx = this._getTempCtx();
        let x0 = dx,
            y0 = dy,
            x1 = dx + width,
            y1 = dy + height;
        let minX = x0 - r;
        let minY = y0 - r;
        let maxX = x1 + r;
        let maxY = y1 + r;
        data = filterPoints(data, { minX, minY, maxX, maxY }).hits;
        for (let [x, y, value] of data) {
            _ctx.globalAlpha = Math.min(1, Math.max(value * valueScale ||
                minAlpha, minAlpha));
            _ctx.drawImage(this.brush, x - r, y - r);
        }
        ctx.putImageData(this.color(_ctx.getImageData(x0, y0, width, height)), x0, y0);
    },
    resetSize({ width = this.width, height = this.height } = {}) {
        let imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
        delete this.__ctx;
        // reset backgroud
        this.setBackgroud();
        this.ctx.putImageData(imageData, 0, 0);
    },
    _getTempCtx() {
        if (!this.__ctx) {
            let _canvas = document.createElement('canvas');
            _canvas.width = this.width;
            _canvas.height = this.height;
            this.__ctx = _canvas.getContext('2d');
        } else {
            this.__ctx.clearRect(0, 0, this.width, this.height);
        }
        return this.__ctx;
    },
    /**
     * get canvas of a black circle brush used for canvas to draw later
     * @private
     * @returns {Object} circle brush canvas
     */
    _getBrush: function() {
        if (!this._brushCanvas) {
            this._brushCanvas = document.createElement('canvas');
            // set brush size
            var r = BRUSH_SIZE + this.option.blurSize;
            var d = r * 2;
            this._brushCanvas.width = d;
            this._brushCanvas.height = d;
            var ctx = this._brushCanvas.getContext('2d');
            // in order to render shadow without the distinct circle,
            // draw the distinct circle in an invisible place,
            // and use shadowOffset to draw shadow in the center of the canvas
            ctx.shadowOffsetX = d;
            ctx.shadowBlur = this.option.blurSize;
            // draw the shadow in black, and use alpha and shadow blur to generate
            // color in color map
            ctx.shadowColor = 'black';
            // draw circle in the left to the canvas
            ctx.beginPath();
            ctx.arc(-r, r, BRUSH_SIZE, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
        return this._brushCanvas;
    },
    /**
     * get gradient color map
     * @private
     * @returns {array} gradient color pixels
     */
    _getGradient: function() {
        if (!this._gradientPixels) {
            var levels = GRADIENT_LEVELS;
            var canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = levels;
            var ctx = canvas.getContext('2d');
            // add color to gradient stops
            var gradient = ctx.createLinearGradient(0, 0, 0, levels);
            var len = this.option.gradientColors.length;
            for (var i = 0; i < len; ++i) {
                if (typeof this.option.gradientColors[i] === 'string') {
                    gradient.addColorStop((i + 1) / len,
                        this.option.gradientColors[i]);
                } else {
                    gradient.addColorStop(this.option.gradientColors[i].offset,
                        this.option.gradientColors[i].color);
                }
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1, levels);
            this._gradientPixels = ctx.getImageData(0, 0, 1, levels).data;
        }
        return this._gradientPixels;
    }
};
export default Heatmap;
