import { Component } from '@angular/core';

import { ThemedComponent } from '../../shared/theme-support/themed.component';
import { ContactUsComponent } from './contact-us.component';
/**
 * Themed wrapper for ContactUsComponent
 */
@Component({
  selector: 'ds-contact-us',
  styleUrls: [],
  templateUrl: '../../shared/theme-support/themed.component.html',
  standalone: true,
  imports: [ContactUsComponent],
})
export class ThemedContactUsComponent extends ThemedComponent<ContactUsComponent> {
  protected getComponentName(): string {
    return 'ContactUsComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../themes/${themeName}/app/info/contact-us/contact-us.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./contact-us.component`);
  }

}
