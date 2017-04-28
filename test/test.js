import chaiPromised from 'chai-as-promised';
import Heatmap from '../src';
chai.use(chaiPromised);
const expect = chai.expect;

describe('Heatmap instance', function() {
    it('should find inject script in html', function(done) {
        let heatmap = new Heatmap();
        expect(heatmap.option).to.exist;
        done();
    });
});
