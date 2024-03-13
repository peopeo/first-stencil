import { Component, Prop, h } from '@stencil/core';
import { format } from '../../utils/utils';
//import { Viewer, XKTLoaderPlugin } from "./node_modules/@xeokit/xeokit-sdk/dist/xeokit-sdk.min.es.js";

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: false,
})
export class MyComponent {
  /**
   * The first name
   */
  @Prop() first: string;

  /**
   * The middle name
   */
  @Prop() middle: string;

  /**
   * The last name
   */
  @Prop() last: string;

  private getText(): string {
    return format(this.first, this.middle, this.last);
  }

  render() {
    return <div>Hello, World! I'm {this.getText()}</div>;
  }
}
