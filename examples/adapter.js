import Heatmap from '../src';
const defaultOption = {
    type: 'heatmap',
    hoverable: false,
    minAlpha: 0.2,
    valueScale: 1,
    opacity: 1,
    bgAlpha: 100,
};
export default function({ option = {}, types, initData } = {}) {
    option = { ...defaultOption, ...option };
    const heatmapInstance = new Heatmap(option);
    const adapter = new Adapter(types);
    heatmapInstance.init(adapter.getIframeSize());
    const controller = heatmapInstance.buildAnimation({
        processor: adapter.process.bind(adapter),
        converter: adapter.convert.bind(adapter),
        data: adapter.preProcess(initData)
    });
    adapter.append(heatmapInstance.canvas);
    adapter.showTip();
    return controller;
}
class Adapter {
    constructor(types) {
        this.$win = document.querySelector('iframe').contentWindow;
        this.$doc = this.$win.document;
        this.$body = this.$doc.body;
        this.setTypes(types);
        this.setCurrentType();
    }
    setTypes(types) {
        this.types = types.map(x => ({ ...x, field: '_' + (x.name || 'noname') }));
    }
    setCurrentType(type = this.types[0]) {
        this.type = type;
        this.typeName = type.name;
        this.field = type.field || (type.field = '_' + (type.name || 'noname'));
    }
    getIframeSize() {
        return {
            width: this.$body.offsetWidth,
            height: this.$body.offsetHeight
        }
    }
    updateData(data) {
        this.rawData = data;
    }
    process(data) {
        const $doc = this.$doc;
        const efp = $doc.elementFromPoint.bind($doc);
        const bodyHeight = $doc.body.offsetHeight;
        const bodyScrollTop = $doc.body.scrollTop;
        const bodyScrollLeft = $doc.body.scrollLeft;
        const winHeight = this.$win.innerHeight;
        return data.map((x, i) => {
            let $el = x.$el || (x.$el = $doc.querySelector(x.selector));
            delete x.visible;
            delete x.slient;
            if (!$el) {
                return x;
            }
            let rect = $el.getBoundingClientRect();
            let _width = rect.width;
            let _height = rect.height;
            let _centerX = rect.left + _width / 2;
            let _centerY = rect.top + _height / 2;
            // refer to http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
            // if the point is scrolled out, then keep it.
            let visible = _width && _height && $el.contains(efp(_centerX, _centerY));
            let slient = _centerY < 0 || _centerY > winHeight && !visible;
            if(slient) {
                return {
                    ...x,
                    slient
                }
            }
            if (visible) {
                _centerX = Math.round(bodyScrollLeft + _centerX);
                _centerY = Math.round(bodyScrollTop + _centerY);
                return {
                    ...x,
                    _width,
                    _height,
                    _centerX,
                    _centerY,
                    visible
                };
            }
            return x;
        });
    }
    convert(data) {
        this.parsedData = data;
        return data.map(x => [x._centerX, x._centerY, x[this.field], x.visible, x.slient]);
    }
    preProcess(data, maxVal = 1) {
        if (Array.isArray(data)) {
            this.rawData = data;
        } else if (!this.rawData) {
            throw new Error('Please set rawData in advance or set data param')
        }
        for (let type of this.types) {
            let name = type.name;
            let vals = data.map(x => x[name]);
            vals.sort((a, b) => a - b);
            let half = Math.floor(vals.length / 2);
            let median = (vals.length % 2) ? vals[half] : (vals[half - 1] + vals[half]) / 2;
            type.p = maxVal / 2 / median;
            let field = type.field;
            data.forEach((x, i) => {
                x[field] = x[name] * type.p;
            })
        }
        return data;
    }
    append(el) {
        if (!this.$heatdiv) {
            const $heatdiv = document.createElement("div");
            $heatdiv.id = 'heatdiv';
            const docheight = this.$body.offsetHeight;
            const docwidth = this.$body.offsetWidth;
            $heatdiv.style.cssText = `overflow:hidden;z-index:99999;position:absolute;height:${docheight}px;width:${docwidth}px;top:0;left:0;pointer-events:none;`;
            this.$body.appendChild($heatdiv);
            this.$heatdiv = $heatdiv;
        }
        this.$heatdiv.appendChild(el);
    }
    destroy() {
        if (this.$heatdiv) {
            this.$heatdiv.parentNode.removeChild(this.$heatdiv);
            this.$heatdiv = null;
        }
    }
    switch (type = this.typeName) {
        // clear data
        this.data = null;
        this.setCurrentType(this.types.find(x => x.name === type));
    }
    showTip() {
        if (!this.$doc || !this.$heatdiv) {
            throw new Error('Iframe element and heatdiv must be assigned in advance, run generateCanvas first!');
        }
        // bind event
        this.tipEvent && this.$doc.removeEventListener('mousemove', this.tipEvent);
        let $tip, $popover;
        // inject popover
        if (!($popover = this.$popover)) {
            $tip = document.createElement('p');
            $tip.style.textAlign = 'left';
            $popover = document.createElement('div');
            $popover.style.cssText = `z-index:999999;overflow:hidden;display:none;position:absolute;border:0px solid rgb(51,51,51);transition:left 0.4s,top 0.4s;border-radius:4px;color:rgb(255,255,255);padding:5px;background-color:rgba(0,0,0,0.7);transition: all 0.5s`;
            $popover.appendChild($tip);
            this.$popover = $popover;
            this.$heatdiv.appendChild($popover);
        } else {
            $tip = $popover.querySelector('p');
        }
        const getTipText = (data) => this.types.map(x => `${x.text}: ${data[x.name]}`).join('<br>');
        const tipData = this.rawData.map(x => `Name：${x.pointName || '--'}<br>${getTipText(x)}`);
        let wait = false,
            _element, _text;
        const docwidth = this.$body.offsetWidth;
        const halfwidth = docwidth / 2;
        const setPopover = (x, y) => {
            if (x < halfwidth) {
                $popover.style.right = '';
                $popover.style.left = x + 12 + 'px';
            } else {
                $popover.style.right = docwidth - x + 12 + 'px';
                $popover.style.left = '';
            }
            $popover.style.top = y + 12 + 'px';
            $popover.style.display = 'block';
            wait = false;
        }
        this.tipEvent = (e) => {
            if (!this.parsedData) {
                return;
            }
            let _x = e.pageX;
            let _y = e.pageY;
            let i = this.parsedData.findIndex(p => Math.abs(p._centerX - _x) <= (p._width / 2) && Math.abs(p._centerY - _y) <= (p._height / 2));
            if (i > -1) {
                let item = tipData[i];
                if (_element !== item) {
                    $tip.innerHTML = item;
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
                $popover.style.display = 'none';
            }
        }
        this.$doc.addEventListener('mousemove', this.tipEvent.bind(this));
    }
}
