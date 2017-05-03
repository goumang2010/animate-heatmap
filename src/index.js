import Heatmap from './heatmap';
import { GRADIENT_LEVELS } from './constants';

function initAdapter(Heatmap) {
    Heatmap.prototype._checkPosition = function(item) {
        let x, y;
        return (item && (x = item[0]) >= 0 && x < this.width && (y = item[1]) >= 0 && y < this.height)
    }
    Heatmap.prototype._getTempCtx = function() {
        if (!this.__ctx) {
            let _canvas = document.createElement('canvas');
            _canvas.width = this.width;
            _canvas.height = this.height;
            this.__ctx = _canvas.getContext('2d');
        } else {
            this.__ctx.clearRect(0, 0, this.width, this.height);
        }
        return this.__ctx;
    }
    Heatmap.prototype._getMinReDrawSection = function(data) {
        // find the minimal section to be cleared
        let xseries = data.map(x => x[0]);
        let yseries = data.map(x => x[1]);
        let r = this.r;
        let maxX = Math.ceil(Math.max(...xseries) + r);
        let minX = Math.floor(Math.min(...xseries) - r);
        let maxY = Math.ceil(Math.max(...yseries) + r);
        let minY = Math.floor(Math.min(...yseries) - r);
        let dx = minX > 0 ? minX : 0;
        let dy = minY > 0 ? minY : 0;
        let width = maxX - minX;
        let height = maxY - minY;
        return {
            dx,
            dy,
            width,
            height
        }
    }
    Heatmap.prototype.update = function(newdata) {
        if (!this.data) {
            this.refresh({ data: newdata });
            this.data = newdata;
            return;
        }
        let len;
        if (!Array.isArray(newdata) || ((len = newdata.length) !== this.data.length)) {
            throw new Error('data array of same length required!');
        }
        let needkeep = [];
        let needupdate = [];
        // to record old position
        let needupdatePrev = [];
        for (let i = 0; i < len; i++) {
            let x0 = this.data[i];
            let x1 = newdata[i];
            if (this._checkPosition(x0)) {
                // assign to keep
                if (x1[3]) {
                    needkeep.push(x0);
                    newdata[i] = x0;
                } else if (x1[0] && x1[1] && (x0[0] === x1[0]) && (x0[1] === x1[1])) {
                    needkeep.push(x0);
                } else if (this._checkPosition(x1)) {
                    needupdatePrev.push(x0);
                    needupdate.push(x1);
                    // if x1 has been deleted
                } else {
                    needupdatePrev.push(x0);
                }
                // if x1 is new
            } else if (this._checkPosition(x1)) {
                needupdate.push(x1);
            }
        }
        let all = [...needupdatePrev, ...needupdate];
        if (all.length > 0) {
            this.data = newdata;
            return this.refresh({ data: [...needupdate, ...needkeep], ...this._getMinReDrawSection(all) });
        }
    };
    Heatmap.prototype.refresh = function({ ctx = this.ctx, data = this.data, dx = 0, dy = 0, width = this.width, height = this.height } = {}) {
        var brush = this._getBrush();
        var gradient = this._getGradient();
        var r = this.r;
        let x0 = dx,
            y0 = dy,
            x1 = dx + width,
            y1 = dy + height;
        let minX = x0 - r;
        let minY = y0 - r;
        let maxX = x1 + r;
        let maxY = y1 + r;
        // create new canvas
        let _ctx = this._getTempCtx();
        for (let [x, y, value] of data) {
            // filter the point that has no effect
            if (x < minX || y < minY || x > maxX || y > maxY) {
                continue;
            }
            _ctx.globalAlpha = Math.min(1, Math.max(value * this.option.valueScale ||
                this.option.minAlpha, this.option.minAlpha));
            _ctx.drawImage(brush, x - r, y - r);
        }
        let imageData = _ctx.getImageData(x0, y0, width, height);
        let pixels = imageData.data;
        let plen = pixels.length / 4;
        while (plen--) {
            var id = plen * 4 + 3;
            var alpha = pixels[id] / 256;
            var colorOffset = Math.floor(alpha * (GRADIENT_LEVELS - 1));
            pixels[id - 3] = gradient[colorOffset * 4]; // red
            pixels[id - 2] = gradient[colorOffset * 4 + 1]; // green
            pixels[id - 1] = gradient[colorOffset * 4 + 2]; // blue
            pixels[id] *= this.option.opacity;
            pixels[id] = pixels[id] > 50 ? pixels[id] : 50; // alpha
        }
        ctx.putImageData(imageData, x0, y0);
    };
    Heatmap.prototype.reset = function({width = this.width, height = this.height} = {}) {   
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);
        this.data = null; 
    }
    Heatmap.prototype.setBackground = function(canvas, color) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;
        var len = pixels.length / 4;
        var alpha = color.a * 256;
        while (len--) {
            var id = len * 4 + 3;
            // console.log(pixels);
            if ((pixels[id - 3] + pixels[id - 2] + pixels[id - 1] + pixels[id]) === 0) {
                pixels[id - 3] = color.r; // red
                pixels[id - 2] = color.g; // green
                pixels[id - 1] = color.b; // blue
                pixels[id] = alpha; // alpha
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    };
}
initAdapter(Heatmap);
export default Heatmap;
