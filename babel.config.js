module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated must be the LAST plugin — it rewrites the
    // React Native runtime to enable worklets/shared values.
    plugins: ['react-native-reanimated/plugin'],
  };
};
