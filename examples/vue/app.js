import Vue from 'vue';
import Heatmap from './heatmap.vue';

/* eslint-disable no-new */
const component = new Vue({...Heatmap}).$mount();
document.getElementsByTagName('body')[0].appendChild(component.$el);