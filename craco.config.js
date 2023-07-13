const CracoAlias = require('craco-alias');
const path = require('path');
const fs = require('fs');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

module.exports = {
  webpack: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    configure: (webpackConfig, {env, paths}) => {
      // eslint-disable-next-line no-multi-assign
      paths.appBuild = webpackConfig.output.path = resolveApp(
        '../FSAEDesigner/static/React/'
      );
      return webpackConfig; // Important: return the modified config
    }
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        tsConfigPath: './paths.json',
        baseUrl: './'
      }
    }
  ]
};
