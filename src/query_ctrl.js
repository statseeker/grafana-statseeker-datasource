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
      this.groupList = [];
      this.fieldMap = {};
      this.deviceFieldMap = {};
      this.selectedObject = this.target.object;
      this.loadObjectList().then(o => {
         this.loadFieldMap('cdt_device').then(f_dev => {
            var obj;

            /* Prepend 'Device' to all fields */
            _.forOwn(f_dev, (val, key) => {
               this.deviceFieldMap['cdt_device.' + key] = val;
            });
            if (this.selectedObject) {
               obj = this.datasource.templateSrv.replace(this.selectedObject);

               this.loadFieldMap(obj).then(f => {
                  this.fieldMap = f;
                  if (obj !== 'cdt_device' && obj !== 'cdt_ranges' && obj.startsWith('cdt_')) {
                     _.merge(this.fieldMap, this.deviceFieldMap);
                  }
                  this.objectList = o;
               });
            }
         });
      });

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
      var p;

      if (this.groupList.length > 0) {
         return Promise.resolve(this.groupList);
      }

      p = this.loadDataList('group');
      p.then(list => {
         this.groupList = list;
      });

      return p;
   }

   loadFieldMap(obj) {
      if ( ! obj || obj === 'Select object') {
         return Promise.resolve([]);
      }

      return this.datasource.runRequest(this.datasource.url + '/' + obj + '/describe?links=none', 'GET').then(response => {
         var fieldMap, formats;

         fieldMap = response.data.data.objects[0].fields;
         _.forOwn(fieldMap, (val, key) => {
            formats = [];
            _.forOwn(_.get(val, 'options.formats.values', []), (v, fmt) => {
               formats.push({text: fmt, value: fmt});
            });
            val.formats = _.sortBy(formats, [v => {
               return v.text.toLowerCase();
            }]);
         });

         /* Add the template variables */
         for (const variable of this.datasource.templateSrv.variables) {
            fieldMap['$' + variable.name] = {name: '$' + variable.name};
            fieldMap['$' + variable.name].formats = [];
         }

         return fieldMap;
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

   getFieldList() {
      var output = [];

      _.forOwn(this.fieldMap, (val, key) => {
         output.push({text: key, value: key});
      });

      return Promise.resolve(_.sortBy(output, [val => {
         return val.text.toLowerCase();
      }])).then(this.uiSegmentSrv.transformToSegments(false));
   }

   getFormatList(field) {
      var output = [];
      var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);

      if (this.fieldMap[fld]) {
         output = _.cloneDeep(this.fieldMap[fld].formats);
         /* Add the template variables */
         for (const variable of this.datasource.templateSrv.variables) {
            output.push({text: '$' + variable.name, value: '$' + variable.name});
         }
      }

      return Promise.resolve(_.sortBy(output, [val => {
         return val.text.toLowerCase();
      }])).then(this.uiSegmentSrv.transformToSegments(false));
   }

   fieldHasFormats(field) {
      var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);

      return this.fieldMap[fld] && this.fieldMap[fld].formats.length > 0;
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
         if (f_alias === alias && this.fieldMap[this.target.fields[i].name]) {
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
         if (f_alias === alias && this.fieldMap[this.target.fields[i].name]) {
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
      this.selectedObject = null;

      this.loadFieldMap(obj).then(f => {
         this.fieldMap = f;
         if (obj !== 'cdt_device' && obj !== 'cdt_ranges' && obj.startsWith('cdt_')) {
            _.merge(this.fieldMap, this.deviceFieldMap);
         }
         this.selectedObject = this.target.object;
      });
   }

   addGroup() {
      var i;

      for (i = 0; i < this.groupList.length; i++) {
         if (this.groupSelection === this.groupList[i].value) {
            this.target.groups.push({name: this.groupList[i].value});
         }
      }
      this.groupSelection = '+';
   }

   addField() {
      var row;

      if ( ! (this.fieldSelection in this.fieldMap)) {
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

