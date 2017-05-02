import Heatmap from '../../src';
const defaultOption = {
    type: 'heatmap',
    hoverable: false,
    minAlpha: 0.2,
    valueScale: 1,
    opacity: 1
};
export default class HeatmapAdapter extends Heatmap {
    constructor({ option = {}, types } = {}) {
        option = { ...defaultOption, ...option };
        super(option);
        this.option = option;
        this.setTypes(types);
        this.setCurrentType();
        this.resultData = {};
    }
    setTypes(types) {
        this.types = types.map(x => ({ ...x, field: '_' + (x.name || 'noname') }));
    }
    setCurrentType(type = this.types[0]) {
        this.type = type;
        this.typeName = type.name;
        this.field = type.field || (type.field = '_' + (type.name || 'noname'));
    }
    updateData(data) {
        this.rawData = data;
    }
    trimData(data) {
        let $iframe = this.iframe;
        return data.map((x, i) => {
            let $elem = x.$elem || $iframe.find(x.selector);
            if (x.$elem) {
                $elem = x.$elem;
            } else if (($elem = $iframe.find(x.selector)) && $elem.length) {
                $elem = $elem.first();
            } else {
                return {
                    ...this.rawData[i]
                };
            }
            let _offset = $elem.offset();
            let _left = _offset.left;
            let _top = _offset.top;
            if ($elem.is(":visible") && (_left + _top) > 0) {
                let _width = $elem.outerWidth();
                let _height = $elem.outerHeight();
                let _centerX = Math.round(_left + _width / 2);
                let _centerY = Math.round(_top + _height / 2);
                return ({
                    ...x,
                    $elem,
                    _width,
                    _height,
                    _centerX,
                    _centerY
                });
            } else {
                return ({
                    ...this.rawData[i],
                    $elem
                });
            }
        });
    }
    generateCanvas(data) {
        if (Array.isArray(data)) {
            this.rawData = data;
        } else if (!this.rawData) {
            throw new Error('Please set rawData in advance or set data param')
        }
        let $iframe = this.iframe = $('iframe').contents();
        let $body = this.iframeBody = $iframe.find('body');
        data = this.trimData(this.rawData);
        if (data.length === 0) {
            this.show = false;
            return;
        }
        let heatdiv = document.createElement("div");
        heatdiv.id = 'heatdiv';
        let $heatdiv = $(heatdiv);
        this.heatdiv = $heatdiv;
        let docheight = this.iframeH = $iframe.height();
        let docwidth = this.iframeW = $iframe.width();
        heatdiv.style = `overflow:hidden;z-index:1100;position:absolute;height:${docheight}px;width:${docwidth}px;top:0;left:0;pointer-events:none;`;
        $body.append(heatdiv);
        // inject popover
        let $tip = $('<p id="heatmaptip" style="text-align: left;"></p>');
        let $popover = $(`<div style="z-index:1200;overflow:hidden;display:none;position:absolute;border:0px solid rgb(51,51,51);transition:left 0.4s,top 0.4s;border-radius:4px;color:rgb(255,255,255);padding:5px;background-color:rgba(0,0,0,0.7);transition: all 0.5s"></div>`);
        $popover.append($tip);
        this.$popover = $popover;
        this.$tip = $tip;
        $heatdiv.append($popover);
        let type = this.type;
        let name = type.name;
        let vals = this.rawData.map(x => x[name]);
        let max = Math.max(...vals);
        if (max > this.maxVal) {
            type.p = this.maxVal / max;
        }
        let field = this.field;
        // 处理数据
        this.rawData.forEach((x, i) => {
            x[field] = x[name] * type.p;
            data[i][field] = x[field];
        })
        let canvasData = data.map(x => [x._centerX, x._centerY, x[field]]);
        let _canvas = super.getCanvas(canvasData,
            docwidth, docheight);
        // _canvas.style.display = 'none';
        heatdiv.appendChild(_canvas);
        this.parsedData = data;
        // this.switchCanvas(this.typeName);
        this.show = true;
    }
    freshCanvas() {
        let newdata = this.trimData(this.parsedData);
        this.parsedData = newdata;
        super.update(newdata.map(x => [x._centerX, x._centerY, x[this.field]]));
        this.requestId = window.requestAnimationFrame(this.freshCanvas.bind(this));
    }
    startFreshCanvas() {
        if (!this.requestId) {
            this.freshCanvas();
        }
    }
    stopFreshCanvas() {
        if (this.requestId) {
            window.cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }
    }
    // 筛选出在canvas范围内的点
    filterFunc(arr, canvas) {
        return arr.filter(x => (x._centerX && x._centerX < canvas.width && x._centerY < canvas.height));
    }
    destroyCanvas() {
        if (this.heatdiv) {
            this.heatdiv.remove();
            this.heatdiv = null;
        }
    }
    switchCanvas(type = this.typeName) {
        // clear data
        this.data = null;
        this.setCurrentType(this.types.find(x => x.name === type));
    }
    showTip() {
        // bind event
        this.iframe.off();
        for (let x of this.parsedData) {
            x.tip = `名称：${x.pointName || '--'}<br>点击量：${x.pv}<br>点击UV：${x.uv}`;
        }
        let $popover = this.$popover;
        let $tip = this.$tip;
        let wait = false;
        let _element;
        let _text;
        let docwidth = this.iframeW;
        let halfwidth = docwidth / 2;
        let setPopover = (x, y) => {
            if (x < halfwidth) {
                $popover.css('right', '');
                $popover.css('left', x + 12);
            } else {
                $popover.css('right', docwidth - x + 12);
                $popover.css('left', '');
            }
            $popover.css('top', y + 12);
            $popover.show();
            wait = false;
        }
        this.iframe.mousemove((e) => {
            // 检查当前位置
            let _x = e.pageX;
            let _y = e.pageY;
            let res = this.parsedData.filter(p => {
                return Math.abs(p._centerX - _x) <= (p._width / 2) && Math.abs(p._centerY - _y) <= (p._height / 2);
            });
            if (res.length > 0) {
                let item = res[0];
                if (_element !== item) {
                    $tip.html(item.tip);
                    setPopover(_x, _y);
                    _element = item;
                } else {
                    if (!wait) {
                        // throttle
                        setTimeout(() => {
                            _element && setPopover(_x, _y);
                        }, 200);
                        wait = true;
                    }
                }
            } else {
                wait = false;
                _element = null;
                $popover.hide();
            }
        });
    }
}
