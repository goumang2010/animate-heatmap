<template>
    <div class="heatmap">
        <div class='page-content'>
            <form class='form-inline'>
                <div class='form-group'>
                    <label>URL</label>
                    <input type='text' class='form-control' placeholder='' id="page-url" data-content="please enter url" v-model="bpConfig.pageUrl" @keydown.enter.stop.prevent="searchClick">
                </div>
                <div class='form-group'>
                    <label>Platform</label>
                    <select class="form-control" v-model="bpConfig.platform">
                        <option value='PC'>PC</option>
                        <option value='H5'>H5</option>
                    </select>
                </div>
                <div style="width: 300px;">
                    <button id="search" @click='searchClick' type='button' class='btn btn-primary'>Search</button>
                    <span style="width: 200px;">{{message}}</span>
                </div>
    
            </form>
    
            <div id='container' class='main'>
                <div class='tabpanel_content' style='width: 100%; height: 1000px;'>
                    <div class='html_content' style='z-index: 2;'>
                        <iframe :class="{'pc-iframe': bpConfig.platform === 'PC', 'wap-iframe':  bpConfig.platform === 'H5'}" frameborder='no' border='0' marginwidth='0' marginheight='0' id='iframenode' :src="iframe_url" @load="init" sandbox="allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import api from './api';
import HeatmapAdapter from './adapter';
const heatmapInstance = new HeatmapAdapter({        
    types: [{
            name: 'pv',
            text: '点击量',
            p: 1
        }, {
            name: 'uv',
            text: '点击uv',
            p: 1
        }]
});
export default {
    name: 'heatmap',
    data: function () {
        return {
            iframe_url: '',
            deadtimer: null,
            iframe_loaded: false,
            message: '',
            show: true,
            // 防止热力图无限扩大设置的最大值
            // 最大不透明度为1
            maxVal: 1,
            versions: [],
            version: null,
            tableData: {
                dataTime: null,
                uv: null,
                pv: null,
                hits: null,
                rate: null
            },
            data: [],
            rawData: [],
            resultData: {},
            bpConfig: {
                show: false,
                trigger: false,
                pointName: '',
                platform: 'PC',
                pageUrl: '',
                selector: '',
                version: null,
                type: 'point'
            }
        }
    },
    methods: {
        searchClick() {
            var url = this.bpConfig.pageUrl;
            if (!/https?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(url)) {
                var $ele = $('#search');
                $ele.popover('show');
                setTimeout(function () { $ele.popover("destroy"); }, 1000);
                return false;
            }
            this.iframe_loaded = false;
            this.message = 'please wait...';
            this.deadtimer && clearTimeout(this.deadtimer);
            let rawurl = this.bpConfig.pageUrl;
            var newiframe_url = '/api/page/html?m=' + this.bpConfig.platform + '&url=' + encodeURIComponent(rawurl);
            let rawquery = rawurl.split('?')[1];
            rawquery && (newiframe_url += '&' + rawquery);
            this.iframe_url = newiframe_url;
            this.deadtimer = setTimeout(() => {
                if (!this.iframe_loaded) {
                    if (window.stop) {
                        window.stop();
                    } else {
                        document.execCommand('Stop'); // MSIE
                    }
                    this.init();
                    this.iframe_loaded = true;
                }
            }, 10000);
        },
        init() {
            if (!this.message) {
                return;
            }
            this.message = '';
            this.iframe_loaded = true;
            let options = this.bpConfig;
            return api.getHeatData(options).then((data) => {
                // this.data = data;
                heatmapInstance.generateCanvas(data);
                heatmapInstance.showTip();
                // HeatmapAdapter
                heatmapInstance.startFreshCanvas();
            }).catch(err => {
                throw err;
                // console.error(err);
            });
        }


    },
    watch: {
        'show': {
            handler(val) {
                if (this.dom.heatdiv) {
                    if (val) {
                        this.dom.heatdiv.show();
                        this.switchCanvas(this.datatype);
                    } else {
                        this.dom.heatdiv.hide();
                    }
                }
            }
        },
        'datatype': {
            handler(val) {
                this.switchCanvas(val);
            }
        }
    }
};
</script>
<style>
.heatmap #search {
    margin-left: 20%;
    margin-right: 15px;
}

.page-content {
    display: flex;
    flex-direction: column;
}

.form-inline {
    display: flex;
    flex-flow: row wrap;
    align-content: flex-start;
}

.form-inline>* {
    margin-bottom: 10px;
}

.form-inline .form-group {
    margin-right: 20px;
}

.form-inline input {
    width: 350px;
}

.tabpanel_content {
    position: relative;
    z-index: 2;
    overflow: hidden;
}

.tabpanel_content .html_content {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
}

.pc-iframe {
    /*	width:100%;
	height:100%;*/
    display: block;
    background-color: #efefef;
    width: 125%;
    height: 125%;
    border: none;
    -ms-zoom: 0.8;
    -moz-transform: scale(0.8);
    -moz-transform-origin: 0 0;
    -o-transform: scale(0.8);
    -o-transform-origin: 0 0;
    -webkit-transform: scale(0.8);
    -webkit-transform-origin: 0 0;
    overflow-y: scroll;
}

.wap-iframe {
    width: 375px;
    height: 667px;
    margin: 10px auto 0;
    display: block;
    background-color: #efefef;
}
</style>
