import finsweetConfigs from '@finsweet/eslint-config';

export default [
  ...finsweetConfigs,
  {
    rules: {
      'no-undef': 'off',
    },
  },
];
