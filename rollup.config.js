import babel from 'rollup-plugin-babel'
// import commonjs from 'rollup-plugin-commonjs'
// import resolve from 'rollup-plugin-node-resolve'

const config = {
	input: 'src/index.js',
  name: 'ZeduxSync',
	output: {
		file: 'dist/zedux-sync.js',
		format: 'iife'
	},
	plugins: [
		babel({
			presets: [
				[ 'env', { modules: false } ],
				'es2015-rollup',
				'stage-2'
			],
			runtimeHelpers: true
		})

		// resolve({
		// 	module: true,
		// 	jsnext: true
		// }),
		//
		// commonjs()
	]
}

export default config
