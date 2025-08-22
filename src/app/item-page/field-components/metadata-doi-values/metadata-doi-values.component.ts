

import {
  NgForOf,
  NgIf,
} from '@angular/common';
import {
  Component,
  Input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MetadataValue } from '../../../core/shared/metadata.models';
import { MetadataFieldWrapperComponent } from '../../../shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { MetadataValuesComponent } from '../metadata-values/metadata-values.component';

@Component({
  selector: 'ds-metadata-doi-values',
  standalone: true,
  imports: [
    MetadataFieldWrapperComponent,
    TranslateModule,
    NgForOf,
    NgIf,
  ],
  templateUrl: './metadata-doi-values.component.html',
  styleUrl: './metadata-doi-values.component.scss'
})
export class MetadataDoiValuesComponent extends MetadataValuesComponent {

  /**
   * Optional text to replace the links with
   * If undefined, the metadata value (uri) is displayed
   */
  @Input() linktext: any;

  /**
   * The metadata values to display
   */
  @Input() mdValues: MetadataValue[];

  /**
   * The seperator used to split the metadata values (can contain HTML)
   */
  @Input() separator: string;

  /**
   * The label for this iteration of metadata values
   */
  @Input() label: string;

}
