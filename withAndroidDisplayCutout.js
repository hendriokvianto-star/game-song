const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withAndroidDisplayCutout(config) {
  return withAndroidStyles(config, async (config) => {
    config.modResults = applyDisplayCutoutToStyles(config.modResults);
    return config;
  });
};

function applyDisplayCutoutToStyles(styles) {
  if (!styles.resources || !styles.resources.style) {
    return styles;
  }

  const appTheme = styles.resources.style.find(
    (style) => style.$.name === 'AppTheme'
  );

  if (appTheme) {
    if (!appTheme.item) {
      appTheme.item = [];
    }

    const hasCutoutMode = appTheme.item.some(
      (item) => item.$.name === 'android:windowLayoutInDisplayCutoutMode'
    );

    if (!hasCutoutMode) {
      appTheme.item.push({
        $: { name: 'android:windowLayoutInDisplayCutoutMode' },
        _: 'shortEdges',
      });
    }
  }

  return styles;
}
