var mockdata = require('./mock/heatdata');
export default {
	getHeatData(data) {
		return Promise.resolve(mockdata).then(function(res) {
			if (res.code !== '200' || res.iserror !== '0') {
				return Promise.reject('获取热力图信息失败：' + res.msg);
			}
			var data;
			if (res && (data = res.data) && (data = data.result) && data.length) {
				return data;
			} else {
				return Promise.reject('暂无热力图信息');
			}
		}).catch(function(err) {
			console.error(err);
		});
	}
}