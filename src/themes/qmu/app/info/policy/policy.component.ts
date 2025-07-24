import { Component } from '@angular/core';
import { PolicyComponent as BaseComponent } from '../../../../../app/info/policy/policy.component';
import { ThemedPolicyComponent } from '../../../../../app/info/policy/themed-policy.component';


@Component({
  selector: 'ds-policy',
  styleUrls: ['./policy.component.scss'],
  templateUrl: './policy.component.html',
  standalone: true,
  imports: [ThemedPolicyComponent],
})

/**
 * Component displaying the policy Statement
 */
export class PolicyComponent extends BaseComponent {}