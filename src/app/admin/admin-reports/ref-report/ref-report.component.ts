import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbAccordionModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { MetadataFieldDataService } from "../../../core/data/metadata-field-data.service";
import { MetadataSchemaDataService } from "../../../core/data/metadata-schema-data.service";
import { DspaceRestService } from 'src/app/core/dspace-rest/dspace-rest.service';
import { MetadataField } from "../../../core/metadata/metadata-field.model";
import { MetadataSchema } from "../../../core/metadata/metadata-schema.model";
import { getFirstSucceededRemoteListPayload} from "../../../core/shared/operators";
import { isEmpty } from "../../../shared/empty.util";
import { OptionVO } from "../filtered-items/option-vo.model";
import { QueryPredicate } from "../filtered-items/query-predicate.model";
import { FiltersComponent } from "../filters-section/filters-section.component";
import { FilteredItems } from "../filtered-items/filtered-items-model";
import { map, Observable } from "rxjs";
import { Item } from "../../../core/shared/item.model";
import { RawRestResponse } from 'src/app/core/dspace-rest/raw-rest-response.model';
import { environment } from "../../../../environments/environment";
import { RestRequestMethod } from "../../../core/data/rest-request-method";

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
  startDate: Date;
  endDate: Date;
  export = false;
  //context: Context = Context.AdminSearch;
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
      field: this.formBuilder.control('', []),
      author: this.formBuilder.control('', []),
      startDate: this.formBuilder.control('', []),
      endDate: this.formBuilder.control('', []),
      export: this.formBuilder.control(false, []),
      filters: FiltersComponent.formGroup(this.formBuilder),
      //additionalFields: this.formBuilder.control([], []),
    });
  }


  submit() {
    console.log('This is the field "' + this.queryForm.get('field')?.value + '"');
    console.log('This is the author "' + this.queryForm.get('author')?.value + '"');
    console.log('This is the startDate "' + this.queryForm.get('startDate')?.value + '"');
    console.log('This is the endDate "' + this.queryForm.get('endDate')?.value + '"');
    console.log('This is the export "' + this.queryForm.get('export')?.value + '"');
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
    this.metadataSchemaService.findAll({ elementsPerPage: 10000, currentPage: 1 }).pipe(
      getFirstSucceededRemoteListPayload(),
    ).subscribe(
      (schemasRest: MetadataSchema[]) => {
        schemasRest.forEach(schema => {
          this.metadataFieldService.findBySchema(schema, { elementsPerPage: 10000, currentPage: 1 }).pipe(
            getFirstSucceededRemoteListPayload(),
          ).subscribe(
            (fieldsRest: MetadataField[]) => {
              fieldsRest.forEach(field => {
                let fieldName = schema.prefix + '.' + field.toString();
                let fieldVO = OptionVO.item(field.id.toString(), fieldName);
                this.metadataFields.push(fieldVO);
                this.metadataFieldsWithAny.push(fieldVO);
                if (isEmpty(field.qualifier)) {
                  fieldName = schema.prefix + '.' + field.element + '.*';
                  fieldVO = OptionVO.item(field.id.toString(), fieldName);
                  this.metadataFieldsWithAny.push(fieldVO);
                }
              });
            },
          );
        });
      },
    );
  }

  private toQueryString(): string {
    let params = `pageNumber=${this.currentPage}&pageLimit=${this.currentPage}`;

    params += `&field=${this.field}`;
    params += `&author=${this.author}`;
    params += `&startDate=${this.startDate}`;
    params += `&endDate=${this.endDate}`;

    return params;
  }

  private pageSize() {
    const form = this.queryForm.value;
    return form.pageLimit;
  }

  getRefItems(): Observable<RawRestResponse> {
    let params = this.toQueryString();
    console.log("This is the params'" + params + "'");
    if (params.length > 0) {
      params = `?${params}`;
    }
    const scheme = environment.rest.ssl ? 'https' : 'http';
    const urlRestApp = `${scheme}://${environment.rest.host}:${environment.rest.port}${environment.rest.nameSpace}`;
    console.log("This is the urlRestApp '" + urlRestApp + '/api/refreport/refitems' + params  + "'");
    return this.restService.request(RestRequestMethod.GET, `${urlRestApp}/api/refreport/refitems${params}`);
  }
}
