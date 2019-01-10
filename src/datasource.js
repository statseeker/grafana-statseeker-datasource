import _ from 'lodash';

export class StatseekerDatasource {

   constructor(instanceSettings, $q, backendSrv, templateSrv) {
      this.type            = instanceSettings.type;
      this.url             = instanceSettings.url;
      this.name            = instanceSettings.name;
      this.basicAuth       = instanceSettings.basicAuth;
      this.withCredentials = instanceSettings.withCredentials;
      this.q               = $q;
      this.backendSrv      = backendSrv;
      this.templateSrv     = templateSrv;
   }

   query(options) {
      var command = this.buildCommand(options);

      return this.runRequest(this.url, 'POST', command).then(resp => {
         return this.processQueryResult(command, resp);
      },
      err => {
         var res;

         if ( ! err.data || ! err.data.data) {
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

   runRequest(url, type, data) {
      /* Setup the request */
      var request = {
         url,
         method: type,
         headers: {'content-type': 'application/json'},
         withCredentials: this.withCredentials
      };

      if (this.basicAuth) {
         request.headers.Authorization = this.basicAuth;
      }
      if (data) {
         request.data = data;
      }

      /* Run the request */
      return this.backendSrv.datasourceRequest(request).then(resp => {
         return resp;
      });
   }

   testDatasource() {
      return this.runRequest(this.url, 'OPTIONS').then(resp => {
         if (resp.status === 200) {
            return {status: 'success', message: 'Data source is working', title: 'Success'};
         }

         return {status: 'error', message: 'Error connecting to server', title: 'Error'};
      });
   }

   metricFindQuery(query) {
      var describeQuery, segments, json;

      if ( ! query) {
         Promise.resolve([]);
      }

      describeQuery = query.match(/^DESCRIBE (.+)/);
      if (describeQuery) {
         describeQuery[1] = this.templateSrv.replace(describeQuery[1]);
         segments = describeQuery[1].split('.');

         return this.runRequest(this.url + '/' + segments[0] + '/describe?links=none', 'GET').then(resp => {
            var i, res;
            var output = [];

            if ( ! resp.data || ! resp.data.data || ! resp.data.data.objects) {
               throw {message: 'Malformed API response'};
            }
            res = resp.data.data.objects[0];
            for (i = 1; i < segments.length; i++) {
               if (res[segments[i]]) {
                  res = res[segments[i]];
               }
               else {
                  throw {message: 'Unknown segment (' + segments[i] + ') in DESCRIBE request'};
               }
            }

            _.forOwn(res, (val, key) => {
               output.push({text: key, value: key});
            });

            return output;
         },
         err => {
            var res;

            if ( ! err.data || ! err.data.data) {
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

      json = _.attempt(JSON.parse, query);
      if ( ! _.isError(json)) {
         if ( ! json.fields || ! _.isArray(json.fields) || json.fields.length === 0) {
            throw {message: 'JSON query missing fields array'};
         }

         return this.query({targets: [json]}).then(resp => {
            var i, val, txt;
            var output = [];

            if ( ! resp.data || resp.data.length === 0) {
               return output;
            }
            else if ( ! resp.data[0].rows || ! resp.data[0].columns) {
               throw {message: 'Query must be a "table" type'};
            }
            else if (resp.data[0].columns.length === 0 || resp.data[0].rows.length === 0) {
               return output;
            }

            for (i = 0; i < resp.data[0].rows.length; i++) {
               val = resp.data[0].rows[i][0];
               txt = resp.data[0].columns.length > 1 ? resp.data[0].rows[i][1] : resp.data[0].rows[i][0];
               if ( ! isNaN(val) || typeof val === 'string') {
                  if ( ! isNaN(txt) || typeof txt === 'string') {
                     output.push({text: txt, value: val});
                  }
               }
            }

            return output;
         });
      }

      return Promise.resolve([]);
   }

   getTimefilter(range, intervalMs, maxDataPoints) {
      var from, to, interval;

      if ( ! range) {
         return null;
      }
      from = Math.trunc(range.from.valueOf() / 1000);
      to = Math.trunc(range.to.valueOf() / 1000);
      interval = intervalMs / 1000;

      /* The minimum interval is 60s */
      if (interval < 60) {
         interval = 60;
      }

      /* Increase the interval if necessary */
      if (Math.trunc((to - from) / maxDataPoints) > interval) {
         interval = Math.trunc((to - from) / maxDataPoints);
         interval = Math.trunc(interval / 60) * 60;
      }

      return {
         query: 'range = ' + from + ' to ' + to,
         interval,
         grafana_start: from,
         grafana_finish: to
      };
   }

   buildField(options, target, obj, data, alias, name, format, timefilter) {
      var field, arr, i, opts, json;

      field = {};

      if (timefilter) {
         field.timefilter = timefilter;
      }
      if (data.hide) {
         field.hide = data.hide;
      }

      if (name.indexOf('.') > -1) {
         arr = name.split('.');
         field.object = arr[0];
         field.field = arr[1];
      }
      else {
         field.field = name;
      }

      /* Set the format if necessary */
      if (format && format !== 'Select format') {
         field.grafana_format = format;
         field.formats = [format];
      }

      /* Set the aggregation format if necessary */
      if (data.aggregation_format && data.aggregation_format !== 'Select aggregation type') {
         field.aggregation_format = this.templateSrv.replace(data.aggregation_format, options.scopedVars);
      }

      /* Check for a filter */
      if (target.filters) {
         for (i = 0; i < target.filters.length; i++) {
            if (target.filters[i].field === alias) {
               field.filter = {query: this.templateSrv.replace(target.filters[i].query, options.scopedVars, this.formatSQLTemplate)};
               if (target.filters[i].format !== 'Select format') {
                  field.filter.format = this.templateSrv.replace(target.filters[i].format, options.scopedVars);
               }
            }
         }
      }

      /* Check for sorting */
      if (target.sortby) {
         for (i = 0; i < target.sortby.length; i++) {
            if (target.sortby[i].field === alias) {
               field.sort = {
                  priority: i + 1,
                  order: target.sortby[i].order
               };
               if (target.sortby[i].format !== 'Select format') {
                  field.sort.format = this.templateSrv.replace(target.sortby[i].format, options.scopedVars);
               }
            }
         }
      }

      /* Add any field options */
      if (data.opts) {
         opts = this.templateSrv.replace(data.opts, options.scopedVars, this.formatJSONTemplate);
         json = _.attempt(JSON.parse, opts);
         if (_.isError(json)) {
            throw {message: 'Error in ' + alias + ' options: ' + json.message};
         }
         field = _.merge(field, json);
      }

      if (obj.fields[alias]) {
         throw {message: 'Duplicate field names defined (' + alias + ')'};
      }
      obj.fields[alias] = field;
   }

   buildCommand(options) {
      var i, j, k, n, timefilter, target, obj, object_opts, json, custom;
      var alias, aggr, fld_json, fmt_json, field_name, fmt;
      var objects = [];

      /* Convert the timefilter to valid tfc */
      timefilter = this.getTimefilter(options.range, options.intervalMs, options.maxDataPoints);

      /* Create the objects */
      for (i = 0; i < options.targets.length; i++) {
         target = options.targets[i];
         if (target.rawMode) {
            target = _.attempt(JSON.parse, target.rawQuery);
            if (_.isError(target)) {
               throw {message: 'Raw query decode failed'};
            }
         }

         if ( ! target.object) {
            throw {message: 'No object provided'};
         }
         if (target.hide) {
            continue;
         }

         obj = {
            type: this.templateSrv.replace(target.object, options.scopedVars),
            limit: parseInt(this.templateSrv.replace(target.limit.toString(), options.scopedVars)),
            offset: parseInt(this.templateSrv.replace(target.offset.toString(), options.scopedVars)),
            grafana_output: target.output,
            fields: {}
         };

         if (isNaN(obj.limit) || isNaN(obj.offset)) {
            throw {message: 'Limit and Offset must be integers'};
         }

         /* Add any object options */
         if (target.object_opts) {
            object_opts = this.templateSrv.replace(target.object_opts, options.scopedVars, this.formatJSONTemplate);
            json = _.attempt(JSON.parse, object_opts);
            if (_.isError(json)) {
               throw {message: 'Error in Object options: ' + json.message};
            }
            obj = _.merge(obj, json);
         }

         /* Add the global filter */
         if (target.adv_filter) {
            obj.filter = this.templateSrv.replace(target.adv_filter, options.scopedVars, this.formatSQLTemplate);
         }

         /* Add the groups */
         if (target.groups && target.groups.length > 0) {
            obj.groups = [];
            for (j = 0; j < target.groups.length; j++) {
               if (target.groups[j].name === 'All Groups') {
                  obj.groups.push(1);
               }
               else {
                  obj.groups.push(target.groups[j].name);
               }
            }
         }

         /* Add the group by */
         if (target.groupby && target.groupby.length > 0) {
            obj.group_by = [];
            for (j = 0; j < target.groupby.length; j++) {
               aggr = target.groupby[j];
               field_name = this.templateSrv.replace(aggr.field, options.scopedVars);
               fmt = this.templateSrv.replace(aggr.format, options.scopedVars);
               custom = this.templateSrv.replace(aggr.custom, options.scopedVars);

               if (aggr.field === '~All~') {
                  obj.group_by.push('0');
               }
               else if (aggr.field === '~Custom~') {
                  obj.group_by.push(custom);
               }
               else if (aggr.format === 'Select format') {
                  obj.group_by.push('{' + field_name + '}');
               }
               else {
                  obj.group_by.push('{' + field_name + ':' + fmt + '}');
               }
            }
         }

         /* Add the fields */
         for (j = 0; j < target.fields.length; j++) {

            /* Check for a multi-fields or formats */
            field_name = this.templateSrv.replace(target.fields[j].name, options.scopedVars);
            fmt = this.templateSrv.replace(target.fields[j].format, options.scopedVars);
            fld_json = _.attempt(JSON.parse, this.templateSrv.replace(target.fields[j].name, options.scopedVars, this.formatJSONTemplate));
            fmt_json = _.attempt(JSON.parse, this.templateSrv.replace(target.fields[j].format, options.scopedVars, this.formatJSONTemplate));

            if (_.isArray(fld_json)) {
               /* Field is a multi-value, so add each field in the list */
               for (k = 0; k < fld_json.length; k++) {
                  alias = target.fields[j].alias ? target.fields[j].alias + ' ' + fld_json[k] : fld_json[k];
                  if (_.isArray(fmt_json)) {
                     /* Format is a multi-value, so add each format as a separate field */
                     for (n = 0; n < fmt_json.length; n++) {
                        this.buildField(options, target, obj, target.fields[j], alias + '-' + fmt_json[n], fld_json[k], fmt_json[n], timefilter);
                     }
                  }
                  else {
                     this.buildField(options, target, obj, target.fields[j], alias, fld_json[k], fmt, timefilter);
                  }
               }
            }
            else {
               alias = target.fields[j].alias ? target.fields[j].alias : field_name;
               if (_.isArray(fmt_json)) {
                  /* Format is a multi-value, so add each format as a separate field */
                  for (n = 0; n < fmt_json.length; n++) {
                     this.buildField(options, target, obj, target.fields[j], alias + '-' + fmt_json[n], field_name, fmt_json[n], timefilter);
                  }
               }
               else {
                  this.buildField(options, target, obj, target.fields[j], alias, field_name, fmt, timefilter);
               }
            }
         }

         /* Make sure the id field is given */
         if ( ! obj.fields.id) {
            obj.fields.id = {
               field: 'id',
               hide: true
            };
         }

         objects.push(obj);
      }

      return {
         command: 'get',
         user: 'admin',
         objects
      };
   }

   processQueryResult(command, result) {
      var i;
      var output = {data: []};

      if ( ! result.data || ! result.data.data || ! result.data.data.objects) {
         throw {message: 'Malformed API response'};
      }

      /* Loop over each object */
      for (i = 0; i < result.data.data.objects.length; i++) {
         if (command.objects[i].grafana_output === 'timeseries') {
            output.data = _.concat(output.data, this.processQueryResultTimeseries(command.objects[i], result.data.data.objects[i]));

         }
         else {
            this.mergeTableResults(output.data, this.processQueryResultTable(command.objects[i], result.data.data.objects[i]));
         }
      }

      return output;
   }

   mergeTableResults(data, table) {
      var i, j, k;

      if (data.length === 0) {
         data.push(table);

         return;
      }

      for (i = 0; i < data.length; i++) {
         if ( ! data[0].type || data[0].type !== 'table') {
            continue;
         }

         /* Add columns */
         for (j = 0; j < table.columns.length; j++) {
            data[i].columns.push(table.columns[j]);
         }

         /* Add rows */
         for (j = 0; j < data[0].rows.length; j++) {
            if (j < table.rows.length) {
               for (k = 0; k < table.columns.length; k++) {
                  data[0].rows[j].push(table.rows[j][k]);
               }
            }
         }
      }
   }

   processQueryResultTimeseries(cmdObj, resObj) {
      var i, j, time, key, subname, field, value, datapoints, rowData;
      var result = [];

      /* Loop over the rows */
      for (i = 0; i < resObj.data.length; i++) {

         /* Loop over each field (that isn't hidden) */
         subname = null;
         rowData = [];
         for (key in cmdObj.fields) {
            if ( ! cmdObj.fields.hasOwnProperty(key)) {
               continue;
            }
            field = cmdObj.fields[key];
            value = resObj.data[i][key];
            if (field.hide) {
               continue;
            }
            if (value === null) {
               /* Value is null */
               result.push({target: key, datapoints: []});
               continue;
            }

            if (field.grafana_format && typeof value === 'object') {
               value = value[field.grafana_format];
            }

            datapoints = [];
            if (_.isArray(value)) {
               /* Value is an array */
               time = field.timefilter.grafana_start;
               for (j = 0; j < value.length; j++) {
                  datapoints.push([value[j], time * 1000]);
                  time += field.timefilter.interval;
               }
            }
            else if ( ! isNaN(value)) {
               /* Value is a number */
               for (time = field.timefilter.grafana_start; time <= field.timefilter.grafana_finish; time += field.timefilter.interval) {
                  datapoints.push([value, time * 1000]);
               }
            }
            else if (typeof value === 'string') {
               subname = subname ? subname + ' ' + value : value;
               continue;
            }

            rowData.push({target: key, datapoints});
         }

         /* Append the subname if provided */
         if (subname) {
            for (j = 0; j < rowData.length; j++) {
               rowData[j].target = rowData[j].target + ' (' + subname + ')';
            }
         }
         result = _.concat(result, rowData);
      }

      return result;
   }

   processQueryResultTable(cmdObj, resObj) {
      var i, j, row, field, value, column;
      var result = {
         columns: [],
         rows: [],
         type: 'table'
      };

      _.forOwn(cmdObj.fields, (val, key) => {
         if ( ! val.hide) {
            column = {text: key};
            if (val.sort && val.sort.priority === 1) {
               column.sort = true;
               column.desc = val.sort.order === 'desc';
            }
            result.columns.push(column);
         }
      });

      /* Loop over the rows */
      for (i = 0; i < resObj.data.length; i++) {
         row = [];

         /* Loop over each field (that isn't hidden) */
         for (j = 0; j < result.columns.length; j++) {
            field = cmdObj.fields[result.columns[j].text];
            value = resObj.data[i][result.columns[j].text];
            if (value === null) {
               /* Value is null */
               row.push(null);
               continue;
            }

            if (field.grafana_format && typeof value === 'object') {
               value = value[field.grafana_format];
            }

            if ( ! isNaN(value) || typeof value === 'string') {
               /* Value is a scalar */
               if (field.grafana_timestamp) {
                  row.push(value * 1000);
               }
               else {
                  row.push(value);
               }
            }
            else {
               /* Cannot represent value */
               row.push(null);
            }
         }

         result.rows.push(row);
      }

      return result;
   }

   formatSQLTemplate(value, variable, fn) {
      var i;
      var output = [];

      if (_.isArray(value)) {
         for (i = 0; i < value.length; i++) {
            if ( ! isNaN(value[i])) {
               output.push(value[i]);
            }
            else if (typeof value[i] === 'string') {
               output.push('\'' + value[i].replace('\'', '\'\'') + '\'');
            }
         }

         return '(' + output.join() + ')';
      }
      else if ( ! isNaN(value)) {
         return value;
      }
      else if (typeof value === 'string') {
         return '\'' + value.replace('\'', '\'\'') + '\'';
      }

      return value;
   }

   formatJSONTemplate(value, variable, fn) {
      var i;
      var output = [];

      if (_.isArray(value)) {
         for (i = 0; i < value.length; i++) {
            if ( ! isNaN(value[i])) {
               output.push(parseInt(value[i]));
            }
            else if (typeof value[i] === 'string') {
               output.push(value[i]);
            }
         }

         return JSON.stringify(output);
      }
      else if (typeof value === 'string') {
         return '"' + value.replace('"', '\\"') + '"';
      }

      return value;
   }

}

