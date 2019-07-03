module.exports = ({ config }) => {

  config.module.rules.push({
    test: /\.glsl$/,
    loader: 'raw-loader'
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
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: {
      loader: 'worker-loader',
      options: { inline: true, fallback: false }
    }
  });

  config.resolve.extensions.push('.ts', '.tsx', '.js', '.glsl');
  return config;
};