import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'my-first-stencil-project',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      // copy: [
      //   {
      //     src: '**/*.{jpg,png,xkt,ifc,glb,glTF,svg }',
      //     dest: 'www/build/assets',
      //     warn: true,
      //   }
      // ],
      serviceWorker: null, // disable service workers
    },
  ],
  testing: {
    browserHeadless: "new",
  },
};
