import {
  Component,
  Input,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { Item } from '../../../../../core/shared/item.model';
import { MetadataDoiValuesComponent } from '../../../../field-components/metadata-doi-values/metadata-doi-values.component';
import { ItemPageFieldComponent } from '../item-page-field.component';
import { MetadataValuesComponent } from '../../../../field-components/metadata-values/metadata-values.component';

@Component({
  selector: 'ds-item-page-doi-field',
  standalone: true,
  imports: [
    MetadataDoiValuesComponent,
    MetadataValuesComponent,
    AsyncPipe
],
  templateUrl: './item-page-doi-field.component.html'
})
export class ItemPageDoiFieldComponent  extends ItemPageFieldComponent {

  /**
   * The item to display metadata for
   */
  @Input() item: Item;

  /**
   * Separator string between multiple values of the metadata fields defined
   * @type {string}
   */
  @Input() separator: string;

  /**
   * Fields (schema.element.qualifier) used to render their values.
   */
  @Input() fields: string[];

  /**
   * Label i18n key for the rendered metadata
   */
  @Input() label: string;
}
