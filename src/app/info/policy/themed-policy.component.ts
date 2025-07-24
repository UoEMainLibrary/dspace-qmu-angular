import { Component } from '@angular/core';

import { ThemedComponent } from '../../shared/theme-support/themed.component';
import { PolicyComponent } from './policy.component';
/**
 * Themed wrapper for PolicyComponent
 */
@Component({
  selector: 'ds-policy',
  styleUrls: [],
  templateUrl: '../../shared/theme-support/themed.component.html',
  standalone: true,
  imports: [PolicyComponent],
})
export class ThemedPolicyComponent extends ThemedComponent<PolicyComponent> {
  protected getComponentName(): string {
    return 'PolicyComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../themes/${themeName}/app/info/policy/policy.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./policy.component`);  
  }


}
