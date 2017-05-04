import Heatmap from './heatmap';

function initAnimate(Heatmap) {
    Object.assign(Heatmap.prototype, {
        buildAnimation(params) {
            let _requestId, _interval, _processor, _converter, _data, then;
            const freshCanvas = () => {
                _requestId = window.requestAnimationFrame(freshCanvas.bind(this));
                let now = Date.now();
                let elapsed = now - then;
                if (elapsed > _interval) {
                    _data = _processor(_data);
                    this.update(_converter(_data));
                    then = now;
                }
            }
            const setParams = ({ fps, processor, converter, data }) => {
                fps && (_interval = 1000 / fps) || _interval || (_interval = 50);
                processor && (_processor = processor) || _processor || (_processor = x => x);
                converter && (_converter = converter) || _converter || (_converter = x => x);
                data && (_data = data);
            }
            setParams(params);
            return {
                reset: setParams,
                start: (data) => {
                    data && (_data = data);
                    then = Date.now();
                    if (!_requestId) {
                        freshCanvas();
                    }
                },
                stop: () => {
                    if (_requestId) {
                        window.cancelAnimationFrame(_requestId);
                        _requestId = null;
                    }
                }
            }
        },
        update(newdata) {
            if (!this.data) {
                // only render visible points
                this.draw({ data: newdata.filter(x => x[3]) });
                newdata.forEach(x => (x[5] = !x[3]));
                this.data = newdata;
                return;
            }
            let len;
            if (!Array.isArray(newdata) || ((len = newdata.length) !== this.data.length)) {
                throw new Error('data array of same length required!');
            }
            // contains points those are visible and might effect redrawing.
            let needKeep = [];
            // draw these points
            let needDraw = [];
            // remove these points
            let needErease = [];
            for (let i = 0; i < len; i++) {
                // item[0] -> X; item[1] -> Y; item[3] -> visible in view; item[4] -> silent point(out of view); item[5] -> if has been deleted;
                let x0 = this.data[i];
                let x1 = newdata[i];
                // item[5] -> if deleted, then true, else false. Inherit last state.
                x1[5] = x0[5];
                // skip slient point
                if (x1[4]) {
                    continue;
                }
                // point that visible
                if (x1[3]) {
                    x1[5] = false;
                    if (x0[5]) {
                        // x0 has been deleted, then create it
                        needDraw.push(x1);
                    } else if ((x0[0] === x1[0]) && (x0[1] === x1[1])) {
                        // position is the same, keep it
                        needKeep.push(x1);
                    } else {
                        // point has been moved
                        needErease.push(x0);
                        needDraw.push(x1);
                    }
                } else {
                    // point is not visible now, we need remove it or keep it.
                    if (x0[5]) {
                        // already deleted, just leave it alone
                    } else {
                        // ever exist, now inbisible
                        needErease.push(x0);
                        x1[5] = true;
                    }
                }
            }
            let all = [...needErease, ...needDraw];
            if (all.length > 0) {
                this.data = newdata;
                return this.draw({ data: [...needDraw, ...needKeep].filter(x => this._checkPosition(x)), ...this._getMinReDrawSection(all) });
            }
        },
        _checkPosition(item) {
            let x, y;
            return (item && (x = item[0]) >= 0 && x < this.width && (y = item[1]) >= 0 && y < this.height)
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
        _getMinReDrawSection(data) {
            // find the minimal section to be cleared
            let xseries = data.map(x => x[0]).filter(Boolean);
            let yseries = data.map(x => x[1]).filter(Boolean);
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
    })
}
initAnimate(Heatmap);
export default Heatmap;
