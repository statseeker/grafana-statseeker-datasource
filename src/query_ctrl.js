import {QueryCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import angular from 'angular';

export class StatseekerQueryCtrl extends QueryCtrl {

   constructor($scope, $injector, uiSegmentSrv)  {
      super($scope, $injector);

      this.scope = $scope;
      this.uiSegmentSrv = uiSegmentSrv;
      this.outputModes = [
         {text: 'Timeseries', value: 'timeseries'},
         {text: 'Table', value: 'table'},
         {text: 'Table as Timeseries', value: 'ts_table'}
      ];
      this.sortDirections = [
         {text: 'Ascending', value: 'asc'},
         {text: 'Descending', value: 'desc'}
      ];

      this.fieldSelection = '+';
      this.filterSelection = '+';
      this.sortSelection = '+';
      this.aggrSelection = '+';
      this.groupSelection = '+';
      this.objectList = [];
      this.objectLinks = {};
      this.groupList = [];
      this.descriptions = {};
      this.deviceFieldMap = {};
      this.selectedObject = this.target.object;
      this.loadObjectList().then(o => {
         this.objectList = o;
      });
      this.loadDescription('cdt_device');
      if (this.selectedObject) {
         this.loadDescription(this.datasource.templateSrv.replace(this.selectedObject));
      }
      this.loadGroupList();

      /* Target properties */
      this.setTargetProperties(this.target);
   }

   setTargetProperties(from) {
      this.target.object      = from.object      || 'Select object';
      this.target.object_opts = from.object_opts || null;
      this.target.groups      = from.groups      || [];
      this.target.fields      = from.fields      || [];
      this.target.filters     = from.filters     || [];
      this.target.adv_filter  = from.adv_filter  || null;
      this.target.sortby      = from.sortby      || [];
      this.target.groupby     = from.groupby     || [];
      this.target.limit       = from.limit       || 10;
      this.target.offset      = from.offset      || 0;
      this.target.output      = from.output      || 'timeseries';
      this.target.pivot_field = from.pivot_field || 'Select field';
      this.target.interval    = from.interval    || null;
   }

   loadDataList(endpoint) {
      return this.datasource.runRequest(this.datasource.url + '/' + endpoint + '/?fields=id,name&limit=0&links=none', 'GET').then(response => {
         var i;
         var output = [];
         var rows = response.data.data.objects[0].data;

         if (rows.length === 0) {
            return output;
         }

         for (i = 0; i < rows.length; i++) {
            output.push({text: rows[i].name, value: rows[i].name, id: rows[i].id});
         }

         /* Add the template variables */
         for (const variable of this.datasource.templateSrv.variables) {
            output.push({text: '$' + variable.name, value: '$' + variable.name});
         }

         return output;
      },
      err => {
         var res;

         if ( ! err.data.data) {
            throw {message: 'Request failed', data: err.data, config: err.config};
         }
         res = err.data.data;
         if ( ! res.success) {
            if (res.objects && res.objects.length === 1) {
               throw {message: res.objects[0].status.errmsg, data: err.data, config: err.config};
            }
            else {
               throw {message: res.errmsg, data: err.data, config: err.config};
            }
         }
      });
   }

   moveRow(list, from, to) {
      _.move(list, from, to);
   }

   loadObjectList() {
      if (this.objectList.length > 0) {
         return Promise.resolve(this.objectList);
      }

      return this.loadDataList('object');
   }

   loadGroupList() {
      var i, j, p;

      if (this.groupList.length > 0) {
         return Promise.resolve(this.groupList);
      }

      p = this.loadDataList('group');
      p.then(list => {
         this.groupList = list;

         /* Update any names in the target groups (and remove any non-existant ones) */
         for (i = this.target.groups.length - 1; i >= 0; i--) {
            if ( ! this.target.groups[i].id) {
               continue;
            }
            this.target.groups[i].name = null;
            for (j = 0; j < list.length; j++) {
               if (list[j].id === this.target.groups[i].id) {
                  this.target.groups[i].name = list[j].value;
                  break;
               }
            }
            if (this.target.groups[i].name === null) {
               this.target.groups.splice(i, 1);
            }
         }
      });

      return p;
   }

   loadDescription(obj) {
      if ( ! obj || obj === 'Select object') {
         return Promise.resolve([]);
      }

      if (this.descriptions[obj]) {
         return Promise.resolve(this.descriptions[obj]);
      }

      return this.datasource.runRequest(this.datasource.url + '/' + obj + '/describe?links=none', 'GET').then(response => {
         this.descriptions[obj] = response.data.data.objects[0];

         /* Get the descriptions of linked fields */
         _.forOwn(_.get(response, 'data.data.objects[0].info.links', {}), (val, key) => {
            this.loadDescription(val.dst);
         });

         return this.descriptions[obj];
      },
      err => {
         var res;

         if ( ! err.data.data) {
            throw {message: 'Request failed', data: err.data, config: err.config};
         }
         res = err.data.data;
         if ( ! res.success) {
            if (res.objects && res.objects.length === 1) {
               throw {message: res.objects[0].status.errmsg, data: err.data, config: err.config};
            }
            else {
               throw {message: res.errmsg, data: err.data, config: err.config};
            }
         }
      });
   }

   getObjectFields(output, done, obj) {
      var selectedObj = this.datasource.templateSrv.replace(this.selectedObject);

      if (done[obj]) {
         return;
      }

      _.forOwn(_.get(this.descriptions, obj + '.fields', {}), (val, key) => {
         if (obj === selectedObj) {
            output.push({text: key, value: key});
         }
         else {
            output.push({text: obj + '.' + key, value: obj + '.' + key});
         }
      });

      done[obj] = true;

      /* Get any linked object fields */
      _.forOwn(_.get(this.descriptions, obj + '.info.links', {}), (val, key) => {
         this.getObjectFields(output, done, val.dst);
      });
   }

   buildFieldList() {
      var output = [];
      var done = {};
      var obj = this.datasource.templateSrv.replace(this.selectedObject);

      this.getObjectFields(output, done, this.datasource.templateSrv.replace(this.selectedObject));

      /* Add the device fields at the end for cdt_ objects*/
      if (obj.startsWith('cdt_') && obj !== 'cdt_ranges') {
         this.getObjectFields(output, done, 'cdt_device');
      }

      /* Add the template variables */
      for (const variable of this.datasource.templateSrv.variables) {
         output.push({text: '$' + variable.name, value: '$' + variable.name});
      }

      return output;
   }

   getFieldList() {
      return Promise.resolve(this.buildFieldList()).then(this.uiSegmentSrv.transformToSegments(false));
   }

   buildFormatList(field) {
      var output = [];
      var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);
      var obj = this.datasource.templateSrv.replace(this.selectedObject);
      var fmtList, arr;

      arr = fld.split('.');
      if (arr.length === 1) {
         fmtList = _.get(this.descriptions, obj + '.fields.' + fld + '.options.formats.values', []);
      }
      else {
         fmtList = _.get(this.descriptions, arr[0] + '.fields.' + arr[1] + '.options.formats.values', []);
      }

      if ( ! fmtList) {
         return [];
      }

      _.forOwn(fmtList, (val, key) => {
         output.push({text: key, value: key});
      });

      return _.sortBy(output, [val => {
         return val.text.toLowerCase();
      }]);
   }

   getFormatList(field) {
      var output = this.buildFormatList(field);

      /* Add the template variables */
      for (const variable of this.datasource.templateSrv.variables) {
         output.push({text: '$' + variable.name, value: '$' + variable.name});
      }

      return Promise.resolve(output).then(this.uiSegmentSrv.transformToSegments(false));
   }

   fieldHasFormats(field) {
      return this.buildFormatList(field).length > 0;
   }

   getSelectedFields() {
      var i, alias;
      var output = [];

      for (i = 0; i < this.target.fields.length; i++) {
         alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
         output.push({text: alias, value: alias});
      }

      return Promise.resolve(_.sortBy(output, [val => {
         return val.text.toLowerCase();
      }])).then(this.uiSegmentSrv.transformToSegments(false));
   }

   getGroupbyOptions() {
      var i, alias;
      var output = [];

      for (i = 0; i < this.target.fields.length; i++) {
         alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
         output.push({text: alias, value: alias});
      }

      output = _.sortBy(output, [v => {
         return v.text.toLowerCase();
      }]);
      output.unshift({text: '~All~', value: '~All~'});
      output.push({text: '~Custom~', value: '~Custom~'});


      return Promise.resolve(output).then(this.uiSegmentSrv.transformToSegments(false));
   }

   getAliasFormats(alias) {
      var i, f_alias;

      for (i = 0; i < this.target.fields.length; i++) {
         f_alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
         if (f_alias === alias) {
            return this.getFormatList(this.target.fields[i].name);
         }
      }

      return [];
   }

   getAggregationFormatList() {
      var output = [
         {text: 'first',     value: 'first'},
         {text: 'last',      value: 'last'},
         {text: 'avg',       value: 'avg'},
         {text: 'count',     value: 'count'},
         {text: 'count_all', value: 'count_all'},
         {text: 'cat',       value: 'cat'},
         {text: 'list',      value: 'list'},
         {text: 'min',       value: 'min'},
         {text: 'max',       value: 'max'},
         {text: 'sum',       value: 'sum'},
         {text: 'total',     value: 'total'},
         {text: 'median',    value: 'median'},
         {text: '95th',      value: '95th'},
         {text: 'stddev',    value: 'stddev'}
      ];

      return Promise.resolve(_.sortBy(output, [val => {
         return val.text.toLowerCase();
      }])).then(this.uiSegmentSrv.transformToSegments(false));
   }

   aliasHasFormats(alias) {
      var i, f_alias;

      for (i = 0; i < this.target.fields.length; i++) {
         f_alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
         if (f_alias === alias) {
            return this.fieldHasFormats(this.target.fields[i].name);
         }
      }

      return false;
   }

   objectChanged() {
      var obj = this.datasource.templateSrv.replace(this.target.object);

      this.target.groups = [];
      this.target.fields = [];
      this.target.filters = [];
      this.target.sortby = [];
      this.target.groupby = [];
      this.target.object_opts = null;
      this.selectedObject = this.target.object;
      this.loadDescription(obj);
   }

   addGroup() {
      var i;

      for (i = 0; i < this.groupList.length; i++) {
         if (this.groupSelection === this.groupList[i].value) {
            this.target.groups.push({id: this.groupList[i].id, name: this.groupList[i].value});
         }
      }
      this.groupSelection = '+';
   }

   addField() {
      var row;
      var fieldMap = _.keyBy(this.buildFieldList(), 'text');

      if ( ! (this.fieldSelection in fieldMap)) {
         return;
      }

      row = {
         name: this.fieldSelection,
         format: 'Select format',
         aggregation_format: 'Select aggregation type',
         hide: false
      };

      this.target.fields.push(row);
      this.fieldSelection = '+';
   }

   addFilter() {
      var i, alias;

      for (i = 0; i < this.target.fields.length; i++) {
         alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
         if (this.filterSelection === alias) {
            this.target.filters.push({field: this.filterSelection, format: 'Select format'});
            break;
         }
      }
      this.filterSelection = '+';
   }

   addSort() {
      var i, alias;

      for (i = 0; i < this.target.fields.length; i++) {
         alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
         if (this.sortSelection === alias) {
            this.target.sortby.push({field: this.sortSelection, format: 'Select format', order: 'asc'});
            break;
         }
      }
      this.sortSelection = '+';
   }

   addAggr() {
      var i, alias;

      if (this.aggrSelection === '~All~' || this.aggrSelection === '~Custom~') {
         this.target.groupby.push({field: this.aggrSelection, format: 'Select format', custom: ''});
      }
      else {
         for (i = 0; i < this.target.fields.length; i++) {
            alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
            if (this.aggrSelection === alias) {
               this.target.groupby.push({field: this.aggrSelection, format: 'Select format', custom: ''});
               break;
            }
         }
      }
      this.aggrSelection = '+';
   }

   removeField(index) {
      var i;
      var alias = this.target.fields[index].alias ? this.target.fields[index].alias : this.target.fields[index].name;

      /* Remove any dependent filters and sorting */
      for (i = 0; i < this.target.filters.length; i++) {
         if (this.target.filters[i].field === alias) {
            this.removeFilter(i);
         }
      }
      for (i = 0; i < this.target.sortby.length; i++) {
         if (this.target.sortby[i].field === alias) {
            this.removeSort(i);
         }
      }
      this.target.fields.splice(index, 1);
   }

   getCollapsedText() {
      return this.target.object + ' (' + _.map(this.target.fields, 'name').join(', ') + ') as ' + this.target.output;
   }

   toggleEditorMode() {
      var tmp;

      if (this.target.rawMode) {
         /* Recreate the target */
         tmp = _.attempt(JSON.parse, this.target.rawQuery);
         if (_.isError(tmp)) {
            throw {message: 'JSON decode failed'};
         }
         this.setTargetProperties(tmp);
         this.target.rawMode = false;
         this.target.rawQuery = null;
      }
      else {
         /* Encode the raw query */
         this.target.rawQuery = angular.toJson(this.target);
         this.target.rawMode = true;
      }
   }

   formatFirstTemplate(value, variable, fn) {
      if (_.isArray(value)) {
         return value[0];
      }

      return value;
   }


}

StatseekerQueryCtrl.templateUrl = 'partials/query.editor.html';

