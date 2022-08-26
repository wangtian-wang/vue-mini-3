const path = require('path');
const { build } = require('esbuild');
const args = require('minimist')(process.argv.slice(2));

const target = args._[0] || 'reactivity';
const format = args.f || "global";
const entry = path.resolve(__dirname, `../packages/${target}/src/index.ts`);
const outPutFormat = format.startsWith('global') ? "iife" : format === 'cjs' ? 'cjs' : 'esm';
const outputDir = path.resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`);
const pkg = require(path.resolve(__dirname, `../packages/${target}/package.json`))
const pkgName = pkg?.buildOptions.name;
build({
    // 打包入口文件，是一个数组或者对象
    entryPoints: [entry], 
      
    // 输入文件路径
    outfile : outputDir, 
      
    // 将依赖的文件递归的打包到一个文件中，默认不会进行打包
    bundle: true, 
    
    // 开启 sourceMap
    sourcemap: true,
      
    // 打包文件的输出格式，值有三种：iife、cjs 和 esm
    format: outPutFormat, 
    
    // 如果输出格式为 IIFE，需要为其指定一个全局变量名字
    globalName: pkgName, 
      
    // 默认情况下，esbuild 构建会生成用于浏览器的代码。如果打包的文件是在 node 环境运行，需要将平台设置为node
    platform: format === 'cjs' ? 'node' : 'browser',
    
    // 监听文件变化，进行重新构建
    watch: {
     onRebuild (error, result) {
         if (error) {
             console.error('build 失败：', error)
         } else {
             console.log('build 成功:', result) 
         }
      }
    }
  }).then(() => {
    console.log('watching ...')
  })