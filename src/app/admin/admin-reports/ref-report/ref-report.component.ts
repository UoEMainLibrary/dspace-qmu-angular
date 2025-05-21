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
  Observable, throwError, timeout,
} from 'rxjs';
import {catchError, finalize, switchMap} from 'rxjs/operators';
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
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private metadataSchemaService: MetadataSchemaDataService,
    private metadataFieldService: MetadataFieldDataService,
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private restService: DspaceRestService) {}

  ngOnInit() {
    this.showResults = false;
    this.loadMetadataFields();
    this.loading = false;
    this.errorMessage = null;

    this.queryForm = this.formBuilder.group({
      field: '',
      author: '',
      startDate: '',
      endDate: '',
      export: false,
      filters: FiltersComponent.formGroup(this.formBuilder),
    });
  }


  submit(): void {
    console.log('Submit called');
    this.field = this.queryForm.get('field')?.value;
    this.author = this.queryForm.get('author')?.value;
    this.startDate = this.queryForm.get('startDate')?.value;
    this.endDate = this.queryForm.get('endDate')?.value;
    this.export = this.queryForm.get('export')?.value;

    this.results$ = this
      .getRefItems()
      .pipe(
        timeout(10000), // 10-second timeout
        map(response => {
          const offset = this.currentPage * this.pageSize();
          this.matches = this.results.itemCount;
          this.results.deserialize(response.payload, offset);
          return this.results.items;
        }),
        catchError(error => {
          if (error.name === 'TimeoutError') {
            this.errorMessage = 'The server is taking too long to respond.';
          } else {
            this.errorMessage = 'An unexpected error occurred.';
          }
          return throwError(() => error);
        }),
        finalize(() => {
          this.loading = false;
        })
      );

    if (this.export) {
      console.log('CSV output requested');
      this.results$.subscribe(
        results => {
          const csvData = this.generateCSV(results);
          const blob = new Blob([csvData], { type: 'text/csv' });
          this.downloadCSV(blob, 'generated.csv');
        },
      );
    } else {
      this.showResults = true;
    }
  }

  generateCSV(results: Item[]) {
    if (!results) {
      return '';
    }

    //const headers = Object.keys(results[0]);
    //const headers = ['Title', 'Author', 'Date Issued', 'Date Accepted', 'Date FCD'];
    const headers = [
      'name',
      'dc.contributor.author',
      'dc.date.issued',
      'refterms.dateAccepted',
      'refterms.dateFCD',
    ];
    /*const csvRows = [
      headers.join(','), // header row
      ...results.map(row =>
        headers.map(field => JSON.stringify(row[field] ?? '')).join(','),
      ),
    ];
    return csvRows.join('\r\n');
     */
    const csvRows = [
      headers.join(','), // header row
      ...results.map(item => {
        return headers.map(field => {
          if (field === 'name') {
            return JSON.stringify(item.name ?? '');
          }

          // Join all metadata values with semicolon
          const values = item.metadata?.[field]?.map((entry: any) => entry.value) ?? [];
          return JSON.stringify(values.join(', '));  // Use semicolon for clarity
        }).join(',');
      }),
    ];

    return csvRows.join('\r\n');
  }
  downloadCSV(blob: Blob, filename: string): void {
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
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
