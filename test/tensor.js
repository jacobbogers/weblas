var tape = require('tape'),
	weblas = require('../index'),
	loader = require('floader'); // browserify aware file loader (xhr in browser)


var RTOL = 1e-05,
	ATOL = 1e-07;

tape("Tensor.transpose: 3 x 3", function(t){
	t.plan(2);

	var x = new Float32Array([ 1.0,  2.0,  3.0,
							   5.0,  6.0,  7.0,
							   9.0, 10.0, 11.0]),
		expected = new Float32Array([ 1.0,  5.0,  9.0,
									  2.0,  6.0,  10.0,
									  3.0,  7.0,  11.0]);

	var M = 3, N = 3,
		t0 = new weblas.pipeline.Tensor([M, N], x),
		t1;

	try{
		// when tranposing texture for t0 is deleted by default
		t1 = t0.transpose();
		// when transfering texture for t1 is deleted by default
		var result = t1.transfer(true);
	}
	catch(ex){
		t.assert(false, ex);
		return;
	}

	weblas.test.assert.allclose(t, result, expected, null, RTOL, ATOL);

	// use internals to check that texture is padded correctly
	var pad = 1,
		padded;

	try{
		padded = weblas.test.padData(N, M, pad, expected);
		out = weblas.gpu.gl.createOutputTexture(N, M + pad);

		// float extraction
		weblas.gpu.encode(N, M + pad, t1.texture, out);
		result = new Float32Array(weblas.gpu.gl.readData(N, M + pad));

		weblas.gpu.gl.context.deleteTexture(out);
	}
	catch(ex){
		t.assert(false, ex);
	}

	weblas.test.assert.allclose(t, result, padded, null, RTOL, ATOL);
	t1.delete();
});

tape("Tensor.transpose: 3 x 4", function(t){
	t.plan(2);

	var x = new Float32Array([ 1.0,  2.0,  3.0,  4.0,
							   5.0,  6.0,  7.0,  8.0,
							   9.0, 10.0, 11.0, 12.0]),
		expected = new Float32Array([ 1.0,  5.0,  9.0,
									  2.0,  6.0,  10.0,
									  3.0,  7.0,  11.0,
									  4.0,  8.0,  12.0]);

	var M = 3, N = 4,
		t0 = new weblas.pipeline.Tensor([M, N], x),
		t1;

	try{
		// when tranposing texture for t0 is deleted by default
		t1 = t0.transpose();
		// when transfering texture for t1 is deleted by default
		var result = t1.transfer(true);
	}
	catch(ex){
		t.assert(false, ex);
		return;
	}

	weblas.test.assert.allclose(t, result, expected, null, RTOL, ATOL);

	// use internals to check that texture is padded correctly
	var pad = 1,
		padded;

	try{
		padded = weblas.test.padData(N, M, pad, expected);
		out = weblas.gpu.gl.createOutputTexture(N, M + pad);

		// float extraction
		weblas.gpu.encode(N, M + pad, t1.texture, out);
		result = new Float32Array(weblas.gpu.gl.readData(N, M + pad));

		weblas.gpu.gl.context.deleteTexture(out);
	}
	catch(ex){
		t.assert(false, ex);
	}

	weblas.test.assert.allclose(t, result, padded, null, RTOL, ATOL);
	t1.delete();
});

// reusing data from sscal
var dataDirectory = 'test/data/sscal/',
	testFile = 'small.json';

var gl = weblas.gpu.gl;

var matrixFiles = ['a.json'];

function generateTestCase(prefix, M, N){
	return function(t){
		var pad = weblas.gpu.gl.getPad(M);
		if(pad == 0){
			t.plan(1);
		} else {
			t.plan(2);
		}

		var X, expected; // typed arrays

		// directory containing matrix data files for current test
		var testDirectory = dataDirectory + prefix + '/';

		// load matrices from files
		weblas.test.load(testDirectory, matrixFiles, function(err, matrices){

			// matrices is an array which matches matrixFiles
			var x = matrices[0];

			if(!(x && x.length && x.length == M * N)){

				throw new Error("malformed data");
			}

			X = new Float32Array(x);
			expected = weblas.util.transpose(M, N, X);

			var t0 = new weblas.pipeline.Tensor([M, N], X),
				t1;

			try{
				// when tranposing texture for t0 is deleted by default
				t1 = t0.transpose();
				// when transfering texture for t1 is deleted by default
				var result = t1.transfer(true);
			}
			catch(ex){
				t.assert(false, ex);
				return;
			}

			weblas.test.assert.allclose(t, result, expected, null, RTOL, ATOL);

			if(pad > 0){

				// use internals to check that texture is padded correctly
				var padded;

				try{
					padded = weblas.test.padData(N, M, pad, expected);
					out = weblas.gpu.gl.createOutputTexture(N, M + pad);

					// float extraction
					weblas.gpu.encode(N, M + pad, t1.texture, out);
					result = new Float32Array(weblas.gpu.gl.readData(N, M + pad));

					weblas.gpu.gl.context.deleteTexture(out);
				}
				catch(ex){
					t.assert(false, ex);
				}

				weblas.test.assert.allclose(t, result, padded, null, RTOL, ATOL);
				t1.delete();
			}
		});
	};
}

loader.load(dataDirectory + testFile, function(err, config){

	var suite = JSON.parse(config);

	// suite configuration file uses directory name as key
	for(var i = 0; i < suite.length; i++){

		directory = String("0000" + (i + 1)).slice(-4);

		var test = suite[i];

		var input = test['in'],
			sizes = input['shape'],
			arg = test['arg'] || {};

		var m = input[0]['shape'][0],
			n = input[0]['shape'][1];

		//console.log("a: " + a + "; b: " + b);
		var testName = "Tensor.transpose: " + m + "x" + n;
		tape(testName, generateTestCase(directory, m, n));
	}

});