import {AsyncPipe, NgForOf, NgIf, NgTemplateOutlet} from "@angular/common";
import { Component } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbAccordionModule} from "@ng-bootstrap/ng-bootstrap";
import {TranslateModule, TranslateService} from "@ngx-translate/core";

import {MetadataFieldDataService} from "../../../core/data/metadata-field-data.service";
import {MetadataSchemaDataService} from "../../../core/data/metadata-schema-data.service";
import {MetadataField} from "../../../core/metadata/metadata-field.model";
import {MetadataSchema} from "../../../core/metadata/metadata-schema.model";
import {Context} from "../../../core/shared/context.model";
import {getFirstSucceededRemoteListPayload} from "../../../core/shared/operators";
import {HomeCoarComponent} from "../../../home-page/home-coar/home-coar.component";
import {ThemedHomeNewsComponent} from "../../../home-page/home-news/themed-home-news.component";
import {RecentItemListComponent} from "../../../home-page/recent-item-list/recent-item-list.component";
import {ThemedHomePageComponent} from "../../../home-page/themed-home-page.component";
import {
  ThemedTopLevelCommunityListComponent
} from "../../../home-page/top-level-community-list/themed-top-level-community-list.component";
import {SuggestionsPopupComponent} from "../../../notifications/suggestions-popup/suggestions-popup.component";
import {ThemedConfigurationSearchPageComponent} from "../../../search-page/themed-configuration-search-page.component";
import {isEmpty} from "../../../shared/empty.util";
import {ThemedSearchComponent} from "../../../shared/search/themed-search.component";
import {ThemedSearchFormComponent} from "../../../shared/search-form/themed-search-form.component";
import {ViewTrackerComponent} from "../../../statistics/angulartics/dspace/view-tracker.component";
import {OptionVO} from "../filtered-items/option-vo.model";
import {QueryPredicate} from "../filtered-items/query-predicate.model";
import {FiltersComponent} from "../filters-section/filters-section.component";

@Component({
  selector: 'ds-ref-report',
  standalone: true,
  imports: [
    AsyncPipe,
    FiltersComponent,
    FormsModule,
    NgForOf,
    NgIf,
    NgbAccordionModule,
    ReactiveFormsModule,
    TranslateModule,
    ThemedConfigurationSearchPageComponent,
    ThemedSearchComponent,
    ThemedSearchFormComponent,
    ThemedHomePageComponent,
    HomeCoarComponent,
    NgTemplateOutlet,
    RecentItemListComponent,
    SuggestionsPopupComponent,
    ThemedHomeNewsComponent,
    ThemedTopLevelCommunityListComponent,
    ViewTrackerComponent,
  ],
  templateUrl: './ref-report.component.html',
  styleUrl: './ref-report.component.scss',
})
export class RefReportComponent {
  queryForm: FormGroup;
  currentPage = 0;
  metadataFields: OptionVO[];
  metadataFieldsWithAny: OptionVO[];
  author = '';
  startDate: Date;
  endDate: Date;
  export = false;
  //context: Context = Context.AdminSearch;

  constructor(
    private metadataSchemaService: MetadataSchemaDataService,
    private metadataFieldService: MetadataFieldDataService,
    private translateService: TranslateService,
    private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.loadMetadataFields();

    const formQueryPredicates: FormGroup[] = [
      new QueryPredicate().toFormGroup(this.formBuilder),
    ];

    this.queryForm = this.formBuilder.group({
      fields: this.formBuilder.control(['field1', 'field2', 'field3'], []),
    });
  }


  submit() {

  }


  loadMetadataFields(): void {
    this.metadataFields = [];
    this.metadataFieldsWithAny = [];
    const anyField$ = this.translateService.stream('admin.reports.items.anyField');
    this.metadataFieldsWithAny.push(OptionVO.itemLoc('*', anyField$));
    this.metadataSchemaService.findAll({elementsPerPage: 10000, currentPage: 1}).pipe(
      getFirstSucceededRemoteListPayload(),
    ).subscribe(
      (schemasRest: MetadataSchema[]) => {
        schemasRest.forEach(schema => {
          this.metadataFieldService.findBySchema(schema, {elementsPerPage: 10000, currentPage: 1}).pipe(
            getFirstSucceededRemoteListPayload(),
          ).subscribe(
            (fieldsRest: MetadataField[]) => {
              fieldsRest.forEach(field => {
                let fieldName = schema.prefix + '.' + field.toString();
                let fieldVO = OptionVO.item(fieldName, fieldName);
                this.metadataFields.push(fieldVO);
                this.metadataFieldsWithAny.push(fieldVO);
                if (isEmpty(field.qualifier)) {
                  fieldName = schema.prefix + '.' + field.element + '.*';
                  fieldVO = OptionVO.item(fieldName, fieldName);
                  this.metadataFieldsWithAny.push(fieldVO);
                }
              });
            },
          );
        });
      },
    );
  }
}
