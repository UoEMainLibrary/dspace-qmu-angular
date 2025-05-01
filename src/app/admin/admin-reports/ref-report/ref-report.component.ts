import {
  AsyncPipe,
  NgForOf,
  NgIf,
} from '@angular/common';
import { HttpParams } from '@angular/common/http';
import {
  Component,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  forkJoin,
  map,
  Observable,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DspaceRestService } from 'src/app/core/dspace-rest/dspace-rest.service';
import { RawRestResponse } from 'src/app/core/dspace-rest/raw-rest-response.model';

import { environment } from '../../../../environments/environment';
import { MetadataFieldDataService } from '../../../core/data/metadata-field-data.service';
import { MetadataSchemaDataService } from '../../../core/data/metadata-schema-data.service';
import { RestRequestMethod } from '../../../core/data/rest-request-method';
import { MetadataField } from '../../../core/metadata/metadata-field.model';
import { MetadataSchema } from '../../../core/metadata/metadata-schema.model';
import { Item } from '../../../core/shared/item.model';
import { getFirstSucceededRemoteListPayload } from '../../../core/shared/operators';
import { isEmpty } from '../../../shared/empty.util';
import { FilteredItems } from '../filtered-items/filtered-items-model';
import { OptionVO } from '../filtered-items/option-vo.model';
import { FiltersComponent } from '../filters-section/filters-section.component';

@Component({
  selector: 'ds-ref-report',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    NgForOf,
    NgIf,
    NgbAccordionModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './ref-report.component.html',
  styleUrl: './ref-report.component.scss',
})
export class RefReportComponent implements OnInit {
  queryForm: FormGroup;
  currentPage = 0;
  metadataFields: OptionVO[];
  metadataFieldsWithAny: OptionVO[];
  field = '';
  author = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  export = false;
  showResults = false;
  results: FilteredItems = new FilteredItems();
  results$: Observable<Item[]>;
  matches = 0;

  constructor(
    private metadataSchemaService: MetadataSchemaDataService,
    private metadataFieldService: MetadataFieldDataService,
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private restService: DspaceRestService) {}

  ngOnInit() {
    this.showResults = false;
    this.loadMetadataFields();

    this.queryForm = this.formBuilder.group({
      field: '',
      author: '',
      startDate: '',
      endDate: '',
      export: false,
      filters: FiltersComponent.formGroup(this.formBuilder),
    });
  }


  submit() {
    this.field = this.queryForm.get('field')?.value;
    this.author = this.queryForm.get('author')?.value;
    this.startDate = this.queryForm.get('startDate')?.value;
    this.endDate = this.queryForm.get('endDate')?.value;
    this.export = this.queryForm.get('export')?.value;
    this.showResults = true;

    this.results$ = this
      .getRefItems()
      .pipe(
        map(response => {
          const offset = this.currentPage * this.pageSize();
          this.matches = this.results.itemCount;
          this.results.deserialize(response.payload, offset);
          return this.results.items;
        }),
      );
  }

  loadMetadataFields(): void {
    this.metadataFields = [];
    this.metadataFieldsWithAny = [];

    const anyField$ = this.translateService.stream('admin.reports.items.anyField');
    this.metadataFieldsWithAny.push(OptionVO.itemLoc('*', anyField$));

    /*Select addName = form.addItem().addSelect("field");
    addName.setLabel(T_field_label);
    addName.addOption("0", "");
    addName.setHelp(T_field_help);

    java.util.List<MetadataField> fields = metadataFieldService.findAll(context);

    for (MetadataField field : fields)
    {
      int fieldID = field.getID();
      MetadataSchema schema = field.getMetadataSchema();
      String name = schema.getName() + "." + field.getElement();
      if (field.getQualifier() != null)
      {
        name += "." + field.getQualifier();
      }

      addName.addOption(fieldID, name);
    }*/
    this.metadataSchemaService.findAll({ elementsPerPage: 10000, currentPage: 1 }).pipe(
      getFirstSucceededRemoteListPayload(),
      switchMap((schemasRest: MetadataSchema[]) =>
        forkJoin(
          schemasRest.map(schema =>
            this.metadataFieldService.findBySchema(schema, { elementsPerPage: 10000, currentPage: 1 }).pipe(
              getFirstSucceededRemoteListPayload(),
              map((fieldsRest: MetadataField[]) => {
                fieldsRest.forEach(field => {
                  let fieldName = `${schema.prefix}.${field.toString()}`;
                  let fieldVO = OptionVO.item(field.id.toString(), fieldName);
                  this.metadataFields.push(fieldVO);
                  this.metadataFieldsWithAny.push(fieldVO);
                  if (isEmpty(field.qualifier)) {
                    fieldName = `${schema.prefix}.${field.element}.*`;
                    fieldVO = OptionVO.item(field.id.toString(), fieldName);
                    this.metadataFieldsWithAny.push(fieldVO);
                  }
                });
              }),
            ),
          ),
        ),
      ),
    ).subscribe();
  }

  private toQueryString(): string {
    const params = new HttpParams()
      .set('field', this.field)
      .set('author', this.author)
      .set('startDate', this.startDate.toString())
      .set('endDate', this.endDate.toString())
      .set('pageNumber', this.currentPage)
      .set('pageLimit', this.pageSize());
    return params.toString();
  }

  private pageSize() {
    const form = this.queryForm.value;
    return form.pageLimit;
  }

  getRefItems(): Observable<RawRestResponse> {
    let params = this.toQueryString();

    if (params.length > 0) {
      params = `?${params}`;
    }
    const scheme = environment.rest.ssl ? 'https' : 'http';
    const urlRestApp = `${scheme}://${environment.rest.host}:${environment.rest.port}${environment.rest.nameSpace}`;
    return this.restService.request(RestRequestMethod.GET, `${urlRestApp}/api/refreport/refitems${params}`);
  }
}
