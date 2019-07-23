module.exports = ({ config }) => {

  // @see https://github.com/webpack/webpack/issues/6642#issuecomment-371087342
  config.output.globalObject = "this";

  config.module.rules.push({
    test: /\.glsl$/,
    loader: 'raw-loader'
  });

  config.module.rules.push({
    test: /\.worker\.(js|ts)$/,
    use: {
      loader: 'worker-loader',
      options: { inline: true, fallback: false }
    }
  });
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('awesome-typescript-loader'),
      },
      // Optional
      // {
      //   loader: require.resolve('react-docgen-typescript-loader'),
      // },
    ],
  });

  config.resolve.extensions.push('.ts', '.tsx', '.js', '.glsl');
  return config;
};