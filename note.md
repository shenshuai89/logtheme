## 规范化开发并发布前端npm包
### 开发工具选型
- 开发前端使用的包，主要的逻辑代码只包含js，所以选用rollup做打包工具。
- webpack适合开发项目，项目中会包含图片/视频/css、vue等多种资源，更适合使用webpack。
### 开发流程
- 初始化项目，创建合理的目录结构
- 设置基于编辑器的代码统一规范 .editorconfig [vscode的配置](https://docs.microsoft.com/zh-cn/visualstudio/ide/create-portable-custom-editor-options?view=vs-2022)
- 配置 eslint 和 pretter 统一代码风格
- 配置 babel，处理新语法兼容型
- 配置 git 提交的校验钩子
- 规范化提交代码到 git 仓库
- 设置开发和打包脚本
- 添加单元测试jest，编写测试示例
- 完善 package.json 必要字段
- 配置合适的 npm script
- 本地测试开发的 npm 包，使用yalc
- 发布包到 npm

### 初始化项目
npm init -y
``` json
{
  "name": "sumfunctionmethod",
  "version": "1.0.0",
  "description": "发布npm包，整套流程开发demo",
  "main": "src/index.js",
  "scripts": {
    "test": "npm run dev"
  },
  "author": "shenshuai89",
  "license": "ISC"
}
```
创建目录结构
``` js
├── README.md // npm包说明，安装以及使用方法
├── examples // 使用测试的案例
├── package.json // 项目结构说明
├── scripts // 用于存在开发或打包的脚本文件
└── src // 存放项目文件
    └── index.js 
```
### 配置rollup开发环境
- 根据开发环境区分不同的配置
- 设置对应的 npm script
- 输出不同规范的产物：umd、umd.min、cjs、esm、iife(global)

在scripts目录下创建rollup配置文件
``` json
├── rollup.config.base.js // 基础文件
├── rollup.config.dev.js // 开发环境的配置
└── rollup.config.prod.js // 生产环境的配置
```
**rollup.config.base.js**
``` js
// 安装以下 npm 包
// npm install -D @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-alias @rollup/plugin-replace @rollup/plugin-eslint @rollup/plugin-babel rollup-plugin-terser rollup-plugin-clear @rollup/plugin-json
import { nodeResolve } from '@rollup/plugin-node-resolve' // 解析 node_modules 中的模块
import commonjs from '@rollup/plugin-commonjs' // cjs => esm
import alias from '@rollup/plugin-alias' // alias 和 reslove 功能
import replace from '@rollup/plugin-replace'
import eslint from '@rollup/plugin-eslint'
import { babel } from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import clear from 'rollup-plugin-clear'
import json from '@rollup/plugin-json' // 支持在源码中直接引入json文件，不影响下面的
import { name, version, author } from '../package.json'

const pkgName = 'sumfunctionmethods'
// 打包处理的文件，添加的备注信息
const banner =
'/*!\n' +
` * ${name} v${version}\n` +
` * (c) 2022-${new Date().getFullYear()} ${author}\n` +
' * Released under the MIT License.\n' +
' */'

export default {
  input: 'src/index.js',
  // 同时打包多种规范的产物
  output: [
    {
      file: `dist/${pkgName}.umd.js`,
      format: 'umd',
      name: pkgName,
      banner
    },
    {
      file: `dist/${pkgName}.umd.min.js`,
      format: 'umd',
      name: pkgName,
      banner,
      plugins: [terser()]
    },
    {
      file: `dist/${pkgName}.cjs.js`,
      format: 'cjs',
      name: pkgName,
      banner,
      plugins: [terser()]
    },
    {
      file: `dist/${pkgName}.esm.js`,
      format: 'es',
      name: pkgName,
      banner,
      plugins: [terser()]
    },
    {
      file: `dist/${pkgName}.js`,
      format: 'iife',
      name: pkgName,
      banner,
      plugins: [terser()]
    }
  ],
  // 注意 plugin 的使用顺序
  plugins: [
    json(),
    clear({
      targets: ['dist']
    }),
    alias(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      preventAssignment: true
    }),
    nodeResolve(),
    commonjs({
      include: 'node_modules/**'
    }),
    eslint({
      throwOnError: true, // 抛出异常并阻止打包
      include: ['src/**'],
      exclude: ['node_modules/**']
    }),
    babel({ babelHelpers: 'bundled' })
  ]
}

```
**rollup.config.dev.js**
``` js
// npm install -D rollup-plugin-serve rollup-plugin-livereload
import baseConfig from './rollup.config.base'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export default {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    serve({
      port: 8080,
      contentBase: ['dist', 'examples/brower'],
      openPage: 'index.html',
    }),
    livereload({
      watch: 'examples/brower',
    })
  ]
}

```
**rollup.config.prod.js**
``` js
// npm install -D rollup-plugin-filesize
import baseConfig from './rollup.config.base'
import filesize from 'rollup-plugin-filesize'

export default {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    filesize()
  ]
}
```
### 配置 babel 解析兼容
安装依赖 npm i -D @babel/core @babel/preset-env
添加文件.babelrc.js

``` js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      // rollupjs 会处理模块，所以设置成 false
      modules: false
    }]
  ],
  plugins: [
  ]
}
```

### 设置eslint和pretter统一代码风格
#### eslint验证代码是否符合定义的规范
- eslint-plugin-vue：vue.js的Eslint插件（查找vue语法错误，发现错误指令，查找违规风格指南）
- eslint-plugin-prettier：运行更漂亮的Eslint，使prettier规则优先级更高，Eslint优先级低
- eslint-config-prettier：让所有可能与prettier规则存在冲突的Eslint rules失效，并使用prettier进行代码检查
- @babel/eslint-parser：该解析器允许使用Eslint校验所有babel code，仅支持最新的最终ECMAScript标准，不支持实验性语法，该编译器会将code解析为Eslint能懂的EsTree（ES2021语法等等）

``` js
npm i -D eslint 

// 生成配置文件，.eslintrc.js
npx eslint --init 
 
// 使用 standard 规范
npm install --save-dev eslint-plugin-import eslint-plugin-node eslint-plugin-prettier eslint-config-prettier @babel/eslint-parser

// .eslintrc.js 配置
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended', // eslint
    'plugin:prettier/recommended', // plugin-prettier
    'plugin:vue/vue3-recommended',  // plugin-vue
  ],
  parserOptions: {
    parser: '@babel/eslint-parser', // 解析器
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  // rules: { //也可设置一个prettier验证规则
  //  'prettier/prettier': 'error', // Runs Prettier as an ESLint rule and reports differences
  //   },
  rules: {
    'space-before-function-paren': ['error', 'never'],
    semi: 0, // 结尾不要分号
  },
}

// .eslintignore 配置, 防止校验打包的产物
dist
node_modules
```
之后可以在package.json 中添加运行脚本
``` json
"scripts": {
    "lint": "eslint src",
    "fix": "eslint src --fix",
}
```
#### pretter格式化代码符合定义的规范
安装包
``` json
npm install -D eslint-plugin-prettier prettier eslint-config-prettier
```
添加配置文件
``` json
{
  "singleQuote": true, 
  "semi": false, 
  "bracketSpacing": true, 
  "htmlWhitespaceSensitivity": "ignore",  
  "endOfLine": "auto",  
  "trailingComma": "all", 
  "tabWidth": 2 
}
```
### 使用lint-staged
对提交到暂存区的代码做校验，lint-staged 是一个在git暂存文件上运行linter的工具。可以设置对某些类型文件做特殊处理如eslint和prettier
安装和配置代码质量工具lint-staged
``` js
// 安装依赖
yarn add -D lint-staged
```
``` json
// 在package.json中添加脚本,以及配置
"scripts": {
    "lint-staged": "lint-staged",
},
"lint-staged": {
    // 匹配暂存区所有的js文件，并执行命令
  "src/*.{js}": [
    "prettier --write",
    "eslint --cache --fix",
    "git add"
  ]
}
```

### 配置 git 提交的校验钩子
- husky: git提交时触发hooks
- commitlint: 对提交的内容做规范校验
husky，主要对pre-commit和commit-msg钩子做校验。
``` js
// 安装husky
yarn add husky -D
npx husky-init // 初始化husky配置，在根目录新增.husky配置文件。初始化配置pre-commit
npx husky add .husky/commit-msg // 另外新增一个hooks，commit-msg
```
* pre-commit中添加 npm run lint-staged
* commit-msg中添加 npm run commitlint

**安装commitlint**
``` js
// 添加依赖文件
yarn add @commitlint/config-conventional @commitlint/cli -D
// 添加配置文件commitlint.config.js
module.exports = { extends: ['@commitlint/config-conventional'] }; //基本设置
```

也可以给commitlint.config.js自定义校验规则
``` js
module.exports = { 
  extends: ['@commitlint/config-conventional'],
  // 校验规则
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', //新功能（feature）
        'fix', //修补bug
        'docs', //文档（documentation）
        'style', //格式（不影响代码运行的变动）
        'refactor', //重构（即不是新增功能，也不是修改bug的代码变动）
        'perf', //性能提升（提高性能的代码改动）
        'test', //测试
        'chore', // 不修改src或测试文件的其他更改
        'revert', //撤退之前的commit
        'build' //构建过程或辅助工具的变动（webpack等)
      ]
    ],
    'type-case': [0],
    'type-empty': [0],
    'scope-empty': [0],
    'scope-case': [0],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
    'header-max-length': [0, 'always', 72]
  }
}
```

### 使用 commitizen 做git规范化提交
由于添加了commitlint验证，对于不熟悉提交规范的新手同学会有一定影响，可以添加 commitizen 工具，手动生成规范化commit。
Commitizen是一个格式化commit message的工具。[介绍](https://cloud.tencent.com/developer/article/1840686)
``` js
// 工具安装
yarn add -D commitizen
```
配置命令
``` JSON
"script": {
    "commit": "git-cz"
}
```
安装规则包
``` js
npx commitizen init cz-conventional-changelog --yarn --dev --exact
```
使用 cz-conventional-changelog 做提交规则
可以在package中定义
``` json
"config": {
    "commitizen": {
        "path": "cz-conventional-changelog"
    }
}
```
也可以单独创建.czrc文件
``` json
{
  "path": "cz-conventional-changelog"
}
```
以后进行commit提交时，可以采用npm run commit也就是使用了 git-cz 中的规则。
#### 自定义 commitizen 规则
1. 第一种方法可以直接修改package中的config
    ``` json
    "config": {
        "commitizen": {
            "path": "cz-conventional-changelog",
            "type": {
                "test": {
                    "description": "测试自定义 commitizen 规则",
                    "title": "测试自定义 commitizen"
                }
            }
        }
    }
2. 使用 cz-customizable 工具
    * 安装依赖
    ``` js
    yarn add cz-customizable -D
    ```
    * 在package.json 中添加自定义commitizen，使用git-cz执行git commit命令
    ``` json
    "config": {
        "commitizen": {
            "path": "./node_modules/cz-customizable"
        }
    }
    ```
    * 在根目录创建的.cz-config.js, 自定义commit提示内容
    ``` js
    module.exports = {
        types: [
            { value: 'feat', name: 'feat:     新功能' },
            { value: 'fix', name: 'fix:      修复' },
            { value: 'docs', name: 'docs:     文档变更' },
            { value: 'style', name: 'style:    代码格式(不影响代码运行的变动)' },
            {
            value: 'refactor',
            name: 'refactor: 重构(既不是增加feature，也不是修复bug)'
            },
            { value: 'perf', name: 'perf:     性能优化' },
            { value: 'test', name: 'test:     增加测试' },
            { value: 'chore', name: 'chore:    构建过程或辅助工具的变动' },
            { value: 'revert', name: 'revert:   回退' },
            { value: 'build', name: 'build:    打包' }
        ],
        // 消息步骤
        messages: {
            type: '请选择提交类型:',
            // scope: '请输入文件修改范围(可选):',
            // used if allowCustomScopes is true
            customScope: '请输入修改范围(可选):',
            subject: '请简要描述提交(必填):',
            body: '请输入详细描述(可选，待优化去除，跳过即可):',
            // breaking: 'List any BREAKING CHANGES (optional):\n',
            footer: '请输入要关闭的issue(待优化去除，跳过即可):',
            confirmCommit: '确认使用以上信息提交？(y/n/e/h)'
        },
        allowCustomScopes: true,
        // allowBreakingChanges: ['feat', 'fix'],
        skipQuestions: ['body', 'footer'],
        // limit subject length, commitlint默认是72
        subjectLimit: 72
        }
    ```
### 添加jest测试工具
- 选用 jest 做单元测试
- 配置 eslint 的 jest 环境
- 解决 jest 不支持 es module 的问题
- 在__test__ 目录下创建 [name].test.js(name 和 源码中的文件名保持一致)
``` js
// 安装jest依赖
npm i -D jest
// 使得支持 `es module`
npm i -D rollup-jest 

```
在package.json中设置
``` json
"scripts":{
    "test": "jest",
    "test:c": "jest --coverage",
},
"jest": {
    "preset": "rollup-jest"
}
```
执行 npm run test 进行测试
执行 npm run test:c 查看测试覆盖率 

### 完善 package.json 必要字段
- version: 版本好
- main: 主入口
- module: cjs入口
- exports: 配置多种类型的入口
- unpkg: cdn地址
- jsdelivr: cdn地址
- files: 发布库时包含的文件
- keywords: 关键测
- homepage: github的readme
- repository: 仓库地址
- bugs: bug提交
- dependencies: 库依赖文件
- devDependencies: 开发时依赖的库

#### main module exports的区别
main 是npm包的主要入口文件，当导入一个包时，实际上就是使用的main指向的地址文件。
main是遵循commonjs规范的，使用module.exports 。
module是ESM规范，是前端使用比较多的规范，使用import/export。
> 如果使用import导入库，最开始匹配module的文件，找不到则使用main指向的文件。
rollup打包工具提供了[多种打包格式](https://www.rollupjs.com/guide/big-list-of-options)，可以在output中进行设置。
``` js
// rollup.config.js
export default {
  ...,
  output: {
    file: 'bundle.js',
    format: 'iife', // 可以是amd、cjs、esm、iife、umd、system
    name: 'MyBundle'
  }
};
```
* amd – 异步模块定义，用于像RequireJS这样的模块加载器
* cjs – CommonJS，适用于 Node 和 Browserify/Webpack
* esm – 将软件包保存为 ES 模块文件，在现代浏览器中可以通过 <script type=module> 标签引入
* iife – 一个自动执行的功能，适合作为<script>标签。（如果要为应用程序创建一个捆绑包，您可能想要使用它，因为它会使文件大小变小。）
* umd – 通用模块定义，以amd，cjs 和 iife 为一体
* system - SystemJS 加载器格式

#### files指定发布包的内容
开发过程中，项目文件比较多，包含了src、script、examples、dist等文件。在 npm 发包时，实际发包内容可以在 package.json 中 files 字段进行设置，只需将构建后资源dist(如果需要构建)进行发包，源文件最好不发，这样可以大大要锁安装包时需要下载包的大小。
#### devDependencies和dependencies的区别
进行日常业务开发时，这两个并无多大区别，因为当执行npm install或者yarn时，这两个配置的包都会进行下载。
对于库开发时，两者会有区别。
当安装一个库文件是 npm install react，就只会安装react项目下dependencies中的依赖，通俗的讲，react的运行是需要这些包的支持，如果不安装这些包，react的功能就无法实现。
devDependencies 下的依赖，只是进行开发是需要进行下载的。
#### homepage repository bugs等地址
- homepage: 设置git中的地址，如https://github.com/shenshuai89/sumfunctionmethod#readme
- repository： 设置仓库地址
- bugs：设置bugs的提交地址
### 使用yalc本地测试开发的包
发布包到npmjs上前的最后一步，要自己在本地中进行多环境测试。尽量确保不出现低级的bug。
常见的两种方法：
- npm link
- 使用 yalc 工具，更方便一些。本质原理还是npm link
#### nmp link使用
``` js
// 在当前创建库的目录下，执行以下命令，可以把当前的库的项目创建一个软连接，连接到本机的根node_modules下
npm link

// 到目录下，执行下面命令
npm link sumfunctionmethod
```
这样就可以在本地目录下正常使用并测试自定义的库。
前端可以使用vite+vue3搭建一个项目，测试ESM的使用。
node的require语法，可以使用express框架创建一个项目。
#### yalc工具
使用该工具，可以实时同步与编写的库进行调试。
yalc 可以在本地将npm包模拟发布，将发布后的资源存放在一个全局存储中。通过yalc将包添加进需要引用的项目中。
这时候package.json的依赖表中会多出一个file:.yalc/...的依赖包，这就是yalc创建的flie:软链接。同时也会在项目根目录创建一个yalc.lock确保引用资源的一致性。测试完项目还需要执行删除yalc包的操作，才能正常使用。
``` js
// NPM:
npm i yalc -g

// Yarn:
yarn global add yalc

// 在自己开发的库项目根目录下发布依赖
yalc publish
```
- yalc publish发布依赖到本地仓库，此命令只是发包并不会主动推送。
- 有新修改的包需要发布并且推送时，可以使用推送命令push快速更新所有依赖。
- 即便是未执行push，在使用的项目中可以执行yalc update命令更新
** 推送命令 **
``` js
// 推送命令, yalc publish --push，简写如下
yalc push 
```
** 添加依赖 **
在需要引入库的测试项目中
``` js
// 项目中添加了yalc.lock文件，package.json对应的包名会有个地址为file:.yalc/开头的项目
yalc add [name]

// 也可以使用XX@version锁定版本号
yalc add [name@version]
```

将版本锁定，避免因为本地新包推送产生影响
* --dev：将依赖添加进dependency中
* --pure：不会影响package.json文件
* --link：使用link方式引入依赖包，yalc add [name] --link
* --workspace (or -W)：添加依赖到workspace:协议中， monorepo仓库
** 更新依赖 **
会根据yalc.lock查找更新所有依赖。
``` js
yalc update
// or
yalc update [name]
```
> 当执行publish后 并未主动执行push，用此命令在使用项目内单独更新依赖。
** 移除依赖 **
``` js
yalc remove [name]
// or
yalc remove --all
```

### 发布包
- 先注册登录npm login。登录不上，多数是因为日常开发中使用了淘宝的镜像，需要使用nrm切换到npm地址
  - nrm use npm
- npm publish发布项目
- 更新包，分为不同版本更新major/minor/patch

对包进行更新后，需要再次发包，可 npm version 控制该版本进行升级
``` js
// 可以配置package.json中scripts
"scripts":{
    "major": "npm version major -m 'build: update major'", // 只更新 大版本
    "minor": "npm version minor -m 'build: update minor'", // 只更新 中版本
    "patch": "npm version patch -m 'build: update patch'", // 只更新 小版本
    "pub": "npm run build && npm publish --access=public", // 发布
    "pub:major": "npm run major && npm publish --access=public", // 更新后发布
    "pub:minor": "npm run minor && npm publish --access=public", // 更新后发布
    "pub:patch": "npm run patch && npm publish --access=public" // 更新后发布
}
```

[库的github地址](https://github.com/shenshuai89/sumfunctionmethod#readme)
[npmjs的地址](https://www.npmjs.com/package/sumfunctionmethod)

