import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

export default [
	{
		input: pkg.main,
		output: {
			name: 'NetlessIframeSDK',
			file: pkg.browser,
            format: 'umd'
		},
		plugins: [
			resolve(),
            commonjs(),
		]
	},
	{
		input: pkg.main,
		external: ['eventemitter2'],
		output: [
			{ file: pkg.module, format: 'es' }
		]
	}
];
