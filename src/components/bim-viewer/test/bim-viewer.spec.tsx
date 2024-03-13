import { newSpecPage } from '@stencil/core/testing';
import { BimViewer } from '../bim-viewer';

describe('bim-viewer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [BimViewer],
      html: `<bim-viewer></bim-viewer>`,
    });
    expect(page.root).toEqualHtml(`
      <bim-viewer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </bim-viewer>
    `);
  });
});
