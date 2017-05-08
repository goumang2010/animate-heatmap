<template>
    <div class="heatmap">
        <div class='page-content'>
            <form class='form-inline'>
                <div class='form-group'>
                    <label>URL</label>
                    <input type='text' class='form-control page-url' placeholder='please enter url' v-model="config.url" @keydown.enter.stop.prevent="searchClick">
                </div>
                <div class='form-group'>
                    <label>Platform</label>
                    <select class="form-control" v-model="config.platform">
                        <option value='PC'>PC</option>
                        <option value='H5'>H5</option>
                    </select>
                </div>
                <div class='form-group'>
                    <label>dataType</label>
                    <select class="form-control data-type" v-model="typeIndex" :disabled="!show">
                        <option v-for="(t, i) of types" :value="i">{{t.text}}</option>
                    </select>
                </div>
                <div class='form-group'>
                    <label class="showmap" slot="extend-nav">
                        show
                        <input type="checkbox" v-model="show"></input>
                    </label>
                </div>
                <div style="width: 300px;">
                    <button id="search" @click='searchClick' type='button' class='btn btn-primary'>Search</button>
                    <span style="width: 200px;">{{message}}</span>
                </div>
            </form>
            <div id='container' class='main'>
                <div class='tabpanel_content' style='width: 100%; height: 1000px;'>
                    <div class='html_content' style='z-index: 2;'>
                        <iframe :class="{'pc-iframe': config.platform === 'PC', 'wap-iframe':  config.platform === 'H5'}" frameborder='no' border='0' marginwidth='0' marginheight='0' id='iframenode' :src="iframe_url" @load="init" sandbox="allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import api from './api';
import Adapter from './adapter';
export default {
    name: 'heatmap',
    data: function () {
        return {
            iframe_url: '',
            deadtimer: null,
            iframe_loaded: false,
            message: '',
            show: true,
            types: [{
                name: 'pv',
                text: 'PV',
                p: 1
            }, {
                name: 'uv',
                text: 'UV',
                p: 1
            }],
            typeIndex: 0,
            $launcher: null,
            $adapter: null,
            config: {
                platform: 'PC',
                url: 'https://www.gomeplus.com/'
            }
        }
    },
    mounted() {
        this.$adapter = new Adapter([...this.types]);
    },
    methods: {
        searchClick() {
            this.show = true;
            var url = this.config.url;
            if (!/https?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(url)) {
                alert('Wrong url!');
                return false;
            }
            this.iframe_loaded = false;
            this.message = 'please wait...';
            this.deadtimer && clearTimeout(this.deadtimer);
            let rawurl = this.config.url;
            var newiframe_url = '/api/page/html?m=' + this.config.platform + '&url=' + encodeURIComponent(rawurl);
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
            let options = this.config;
            return api.getHeatData(options).then((data) => {
                this.$launcher = this.$adapter.getLauncher({ initData: data })
                this.$launcher.start();
            }).catch(err => {
                throw err;
            });
        }
    },
    watch: {
        typeIndex: {
            handler(newValue, oldValue) {
                this.$adapter && this.$adapter.resetType(this.typeIndex, this.$launcher);
            }
        },
        show: {
            handler(newValue, oldValue) {
                if (newValue) {
                    this.$adapter.show();
                } else {
                    this.$adapter.hide();
                }
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

.form-inline input.page-url {
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
    display: block;
    background-color: #efefef;
    width: 125%;
    height: 125%;
    border: none;
    zoom: 0.8;
    transform: scale(0.8);
    transform-origin: 0 0;
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
