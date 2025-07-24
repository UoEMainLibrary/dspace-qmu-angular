import { Component } from '@angular/core';
import { ContactUsComponent as BaseComponent } from '../../../../../app/info/contact-us/contact-us.component';
import { ThemedContactUsComponent } from 'src/app/info/contact-us/themed-contact-us.component';


@Component({
  selector: 'ds-contact-us',
  styleUrls: ['./contact-us.component.scss'],
  templateUrl: './contact-us.component.html',
  standalone: true,
  imports: [ThemedContactUsComponent],
})

/**
 * Component displaying the Contact Us Statement
 */
export class ContactUsComponent extends BaseComponent {}