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
         {text: 'Table', value: 'table'}
      ];
      this.sortDirections = [
         {text: 'Ascending', value: 'asc'},
         {text: 'Descending', value: 'desc'}
      ];

      this.fieldSelection = '+';
      this.filterSelection = '+';
      this.sortSelection = '+';
      this.objectList = [];
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
      this.target.fields      = from.fields      || [];
      this.target.filters     = from.filters     || [];
      this.target.adv_filter  = from.adv_filter  || null;
      this.target.sortby      = from.sortby      || [];
      this.target.limit       = from.limit       || 10;
      this.target.offset      = from.offset      || 0;
      this.target.output      = from.output      || 'timeseries';
   }

   loadObjectList() {
      if (this.objectList.length > 0) {
         return Promise.resolve(this.objectList);
      }

      return this.datasource.runRequest(this.datasource.url + '/object/?fields=name&limit=0&links=none', 'GET').then(response => {
         var i;
         var output = [];
         var rows = response.data.data.objects[0].data;

         if (rows.length === 0) {
            return output;
         }

         for (i = 0; i < rows.length; i++) {
            output.push({text: rows[i].name, value: rows[i].name});
         }

         /* Add the template variables */
         _.forOwn(this.datasource.templateSrv._index, (val, key) => {
            output.push({text: '$' + key, value: '$' + key});
         });

         return output;
      },
      err => {
         var res;

         if ( ! err.data.data) {
            throw {message: 'Request failed', data: err.data, config: err.config};
         }
         res = err.data.data;
         if ( ! res.success) {
            if (res.objects.length === 1) {
               throw {message: res.objects[0].status.errmsg, data: err.data, config: err.config};
            }
            else {
               throw {message: res.errmsg, data: err.data, config: err.config};
            }
         }
      });
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
               v.text.toLowerCase();
            }]);
         });

         /* Add the template variables */
         _.forOwn(this.datasource.templateSrv._index, (val, key) => {
            fieldMap['$' + key] = {name: '$' + key};
            fieldMap['$' + key].formats = [];
         });

         return fieldMap;
      },
      err => {
         var res;

         if ( ! err.data.data) {
            throw {message: 'Request failed', data: err.data, config: err.config};
         }
         res = err.data.data;
         if ( ! res.success) {
            if (res.objects.length === 1) {
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
         val.text.toLowerCase();
      }])).then(this.uiSegmentSrv.transformToSegments(false));
   }

   getFormatList(field) {
      var output = [];
      var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);

      if (this.fieldMap[fld]) {
         output = _.cloneDeep(this.fieldMap[fld].formats);
         /* Add the template variables */
         _.forOwn(this.datasource.templateSrv._index, (val, key) => {
            output.push({text: '$' + key, value: '$' + key});
         });
      }

      return Promise.resolve(_.sortBy(output, [val => {
         val.text.toLowerCase();
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
         val.text.toLowerCase();
      }])).then(this.uiSegmentSrv.transformToSegments(false));
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

      this.target.fields = [];
      this.target.filters = [];
      this.target.sortby = [];
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

   addField() {
      var row = {name: this.fieldSelection, format: 'Select format', hide: false};

      this.target.fields.push(row);
      this.fieldSelection = '+';
   }

   addFilter() {
      var row = {field: this.filterSelection, format: 'Select format'};

      this.target.filters.push(row);
      this.filterSelection = '+';
   }

   addSort() {
      var row = {field: this.sortSelection, format: 'Select format', order: 'asc'};

      this.target.sortby.push(row);
      this.sortSelection = '+';
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

   removeFilter(index) {
      this.target.filters.splice(index, 1);
   }

   removeSort(index) {
      this.target.sortby.splice(index, 1);
   }

   getCollapsedText() {
      return this.target.object + ' (' + _.map(this.target.fields, 'field').join(', ') + ') as ' + this.target.output;
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

