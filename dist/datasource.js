'use strict';

System.register(['lodash'], function (_export, _context) {
   "use strict";

   var _, _typeof, _createClass, StatseekerDatasource;

   function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
         throw new TypeError("Cannot call a class as a function");
      }
   }

   return {
      setters: [function (_lodash) {
         _ = _lodash.default;
      }],
      execute: function () {
         _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
            return typeof obj;
         } : function (obj) {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
         };

         _createClass = function () {
            function defineProperties(target, props) {
               for (var i = 0; i < props.length; i++) {
                  var descriptor = props[i];
                  descriptor.enumerable = descriptor.enumerable || false;
                  descriptor.configurable = true;
                  if ("value" in descriptor) descriptor.writable = true;
                  Object.defineProperty(target, descriptor.key, descriptor);
               }
            }

            return function (Constructor, protoProps, staticProps) {
               if (protoProps) defineProperties(Constructor.prototype, protoProps);
               if (staticProps) defineProperties(Constructor, staticProps);
               return Constructor;
            };
         }();

         _export('StatseekerDatasource', StatseekerDatasource = function () {
            function StatseekerDatasource(instanceSettings, $q, backendSrv, templateSrv) {
               _classCallCheck(this, StatseekerDatasource);

               this.type = instanceSettings.type;
               this.url = instanceSettings.url;
               this.name = instanceSettings.name;
               this.basicAuth = instanceSettings.basicAuth;
               this.withCredentials = instanceSettings.withCredentials;
               this.q = $q;
               this.backendSrv = backendSrv;
               this.templateSrv = templateSrv;
            }

            _createClass(StatseekerDatasource, [{
               key: 'query',
               value: function query(options) {
                  var _this = this;

                  var command = this.buildCommand(options);

                  return this.runRequest(this.url, 'POST', command).then(function (resp) {
                     return _this.processQueryResult(command, resp);
                  }, function (err) {
                     var res;

                     if (!err.data || !err.data.data) {
                        throw { message: 'Request failed', data: err.data, config: err.config };
                     }
                     res = err.data.data;
                     if (!res.success) {
                        if (res.objects.length === 1) {
                           throw { message: res.objects[0].status.errmsg, data: err.data, config: err.config };
                        } else {
                           throw { message: res.errmsg, data: err.data, config: err.config };
                        }
                     }
                  });
               }
            }, {
               key: 'runRequest',
               value: function runRequest(url, type, data) {
                  /* Setup the request */
                  var request = {
                     url: url,
                     method: type,
                     headers: { 'content-type': 'application/json' },
                     withCredentials: this.withCredentials
                  };

                  if (this.basicAuth) {
                     request.headers.Authorization = this.basicAuth;
                  }
                  if (data) {
                     request.data = data;
                  }

                  /* Run the request */
                  return this.backendSrv.datasourceRequest(request).then(function (resp) {
                     return resp;
                  });
               }
            }, {
               key: 'testDatasource',
               value: function testDatasource() {
                  return this.runRequest(this.url, 'OPTIONS').then(function (resp) {
                     if (resp.status === 200) {
                        return { status: 'success', message: 'Data source is working', title: 'Success' };
                     }

                     return { status: 'error', message: 'Error connecting to server', title: 'Error' };
                  });
               }
            }, {
               key: 'metricFindQuery',
               value: function metricFindQuery(query) {
                  var describeQuery, segments, json;

                  if (!query) {
                     Promise.resolve([]);
                  }

                  describeQuery = query.match(/^DESCRIBE (.+)/);
                  if (describeQuery) {
                     describeQuery[1] = this.templateSrv.replace(describeQuery[1]);
                     segments = describeQuery[1].split('.');

                     return this.runRequest(this.url + '/' + segments[0] + '/describe?links=none', 'GET').then(function (resp) {
                        var i, res;
                        var output = [];

                        if (!resp.data || !resp.data.data || !resp.data.data.objects) {
                           throw { message: 'Malformed API response' };
                        }
                        res = resp.data.data.objects[0];
                        for (i = 1; i < segments.length; i++) {
                           if (res[segments[i]]) {
                              res = res[segments[i]];
                           } else {
                              throw { message: 'Unknown segment (' + segments[i] + ') in DESCRIBE request' };
                           }
                        }

                        _.forOwn(res, function (val, key) {
                           output.push({ text: key, value: key });
                        });

                        return output;
                     }, function (err) {
                        var res;

                        if (!err.data || !err.data.data) {
                           throw { message: 'Request failed', data: err.data, config: err.config };
                        }
                        res = err.data.data;
                        if (!res.success) {
                           if (res.objects.length === 1) {
                              throw { message: res.objects[0].status.errmsg, data: err.data, config: err.config };
                           } else {
                              throw { message: res.errmsg, data: err.data, config: err.config };
                           }
                        }
                     });
                  }

                  json = _.attempt(JSON.parse, query);
                  if (!_.isError(json)) {
                     if (!json.fields || !_.isArray(json.fields) || json.fields.length === 0) {
                        throw { message: 'JSON query missing fields array' };
                     }

                     return this.query({ targets: [json] }).then(function (resp) {
                        var i, val, txt;
                        var output = [];

                        if (!resp.data || resp.data.length === 0) {
                           return output;
                        } else if (!resp.data[0].rows || !resp.data[0].columns) {
                           throw { message: 'Query must be a "table" type' };
                        } else if (resp.data[0].columns.length === 0 || resp.data[0].rows.length === 0) {
                           return output;
                        }

                        for (i = 0; i < resp.data[0].rows.length; i++) {
                           val = resp.data[0].rows[i][0];
                           txt = resp.data[0].columns.length > 1 ? resp.data[0].rows[i][1] : resp.data[0].rows[i][0];
                           if (!isNaN(val) || typeof val === 'string') {
                              if (!isNaN(txt) || typeof txt === 'string') {
                                 output.push({ text: txt, value: val });
                              }
                           }
                        }

                        return output;
                     });
                  }

                  return Promise.resolve([]);
               }
            }, {
               key: 'getTimefilter',
               value: function getTimefilter(range, intervalMs, maxDataPoints) {
                  var from, to, interval;

                  if (!range) {
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
                     interval: interval,
                     grafana_start: from,
                     grafana_finish: to
                  };
               }
            }, {
               key: 'buildCommand',
               value: function buildCommand(options) {
                  var i, j, k, timefilter, target, obj, opts, object_opts, json, alias, field;
                  var objects = [];

                  /* Convert the timefilter to valid tfc */
                  timefilter = this.getTimefilter(options.range, options.intervalMs, options.maxDataPoints);

                  /* Create the objects */
                  for (i = 0; i < options.targets.length; i++) {
                     target = options.targets[i];
                     if (target.rawMode) {
                        target = _.attempt(JSON.parse, target.rawQuery);
                        if (_.isError(target)) {
                           throw { message: 'Raw query decode failed' };
                        }
                     }

                     if (!target.object) {
                        throw { message: 'No object provided' };
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
                        throw { message: 'Limit and Offset must be integers' };
                     }

                     /* Add any object options */
                     if (target.object_opts) {
                        object_opts = this.templateSrv.replace(target.object_opts, options.scopedVars, this.formatJSONTemplate);
                        json = _.attempt(JSON.parse, object_opts);
                        if (_.isError(json)) {
                           throw { message: 'Error in Object options: ' + json.message };
                        }
                        obj = _.merge(obj, json);
                     }

                     /* Add the global filter */
                     if (target.adv_filter) {
                        obj.filter = this.templateSrv.replace(target.adv_filter, options.scopedVars, this.formatSQLTemplate);
                     }

                     /* Add the fields */
                     for (j = 0; j < target.fields.length; j++) {
                        if (!target.fields[j].name) {
                           throw { message: 'Field name missing' };
                        }

                        alias = target.fields[j].alias ? target.fields[j].alias : target.fields[j].name;
                        field = {
                           field: this.templateSrv.replace(target.fields[j].name, options.scopedVars),
                           hide: target.fields[j].hide
                        };

                        if (timefilter) {
                           field.timefilter = timefilter;
                        }

                        if (target.fields[j].name.startsWith('cdt_device.')) {
                           if (!obj.join) {
                              obj.join = '{' + obj.type + '.deviceid} = {cdt_device.id}';
                           }
                           field.field = target.fields[j].name.replace('cdt_device.', '');
                           field.object = 'cdt_device';
                        }

                        /* Set the format if necessary */
                        if (target.fields[j].format && target.fields[j].format !== 'Select format') {
                           field.grafana_format = this.templateSrv.replace(target.fields[j].format, options.scopedVars);
                           field.formats = [field.grafana_format];
                        }

                        /* Check for a filter */
                        if (target.filters) {
                           for (k = 0; k < target.filters.length; k++) {
                              if (target.filters[k].field === alias) {
                                 field.filter = { query: this.templateSrv.replace(target.filters[k].query, options.scopedVars, this.formatSQLTemplate) };
                                 if (target.filters[k].format !== 'Select format') {
                                    field.filter.format = this.templateSrv.replace(target.filters[k].format, options.scopedVars);
                                 }
                              }
                           }
                        }

                        /* Check for sorting */
                        if (target.sortby) {
                           for (k = 0; k < target.sortby.length; k++) {
                              if (target.sortby[k].field === alias) {
                                 field.sort = {
                                    priority: k + 1,
                                    order: target.sortby[k].order
                                 };
                                 if (target.sortby[k].format !== 'Select format') {
                                    field.sort.format = this.templateSrv.replace(target.sortby[k].format, options.scopedVars);
                                 }
                              }
                           }
                        }

                        /* Add any field options */
                        if (target.fields[j].opts) {
                           opts = this.templateSrv.replace(target.fields[j].opts, options.scopedVars, this.formatJSONTemplate);
                           json = _.attempt(JSON.parse, opts);
                           if (_.isError(json)) {
                              throw { message: 'Error in ' + alias + ' options: ' + json.message };
                           }
                           field = _.merge(field, json);
                        }

                        opts = this.templateSrv.replace(target.fields[j].name, options.scopedVars, this.formatJSONTemplate);
                        json = _.attempt(JSON.parse, opts);
                        if (_.isArray(json)) {
                           /* Field is a multi-value, so add each field in the list */
                           for (k = 0; k < json.length; k++) {
                              alias = target.fields[j].alias ? target.fields[j].alias + ' ' + json[k] : json[k];
                              if (obj.fields[alias]) {
                                 throw { message: 'Duplicate field names defined (' + alias + ')' };
                              }
                              obj.fields[alias] = _.cloneDeep(field);
                              obj.fields[alias].field = json[k];
                           }
                        } else {
                           /* Field is a single value */
                           alias = this.templateSrv.replace(alias, options.scopedVars);
                           if (obj.fields[alias]) {
                              throw { message: 'Duplicate field names defined (' + alias + ')' };
                           }
                           obj.fields[alias] = field;
                        }
                     }

                     /* Make sure the id field is given */
                     if (!obj.fields.id) {
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
                     objects: objects
                  };
               }
            }, {
               key: 'processQueryResult',
               value: function processQueryResult(command, result) {
                  var i;
                  var output = { data: [] };

                  if (!result.data || !result.data.data || !result.data.data.objects) {
                     throw { message: 'Malformed API response' };
                  }

                  /* Loop over each object */
                  for (i = 0; i < result.data.data.objects.length; i++) {
                     if (command.objects[i].grafana_output === 'timeseries') {
                        output.data = _.concat(output.data, this.processQueryResultTimeseries(command.objects[i], result.data.data.objects[i]));
                     } else {
                        this.mergeTableResults(output.data, this.processQueryResultTable(command.objects[i], result.data.data.objects[i]));
                     }
                  }

                  return output;
               }
            }, {
               key: 'mergeTableResults',
               value: function mergeTableResults(data, table) {
                  var i, j, k;

                  if (data.length === 0) {
                     data.push(table);

                     return;
                  }

                  for (i = 0; i < data.length; i++) {
                     if (!data[0].type || data[0].type !== 'table') {
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
            }, {
               key: 'processQueryResultTimeseries',
               value: function processQueryResultTimeseries(cmdObj, resObj) {
                  var i, j, time, key, subname, field, value, datapoints, rowData;
                  var result = [];

                  /* Loop over the rows */
                  for (i = 0; i < resObj.data.length; i++) {

                     /* Loop over each field (that isn't hidden) */
                     subname = null;
                     rowData = [];
                     for (key in cmdObj.fields) {
                        if (!cmdObj.fields.hasOwnProperty(key)) {
                           continue;
                        }
                        field = cmdObj.fields[key];
                        value = resObj.data[i][key];
                        if (field.hide) {
                           continue;
                        }
                        if (value === null) {
                           /* Value is null */
                           result.push({ target: key, datapoints: [] });
                           continue;
                        }

                        if (field.grafana_format && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
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
                        } else if (!isNaN(value)) {
                           /* Value is a number */
                           for (time = field.timefilter.grafana_start; time <= field.timefilter.grafana_finish; time += field.timefilter.interval) {
                              datapoints.push([value, time * 1000]);
                           }
                        } else if (typeof value === 'string') {
                           subname = subname ? subname + ' ' + value : value;
                           continue;
                        }

                        rowData.push({ target: key, datapoints: datapoints });
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
            }, {
               key: 'processQueryResultTable',
               value: function processQueryResultTable(cmdObj, resObj) {
                  var i, j, row, field, value, column;
                  var result = {
                     columns: [],
                     rows: [],
                     type: 'table'
                  };

                  _.forOwn(cmdObj.fields, function (val, key) {
                     if (!val.hide) {
                        column = { text: key };
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

                        if (field.grafana_format && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                           value = value[field.grafana_format];
                        }

                        if (!isNaN(value) || typeof value === 'string') {
                           /* Value is a scalar */
                           if (field.grafana_timestamp) {
                              row.push(value * 1000);
                           } else {
                              row.push(value);
                           }
                        } else {
                           /* Cannot represent value */
                           row.push(null);
                        }
                     }

                     result.rows.push(row);
                  }

                  return result;
               }
            }, {
               key: 'formatSQLTemplate',
               value: function formatSQLTemplate(value, variable, fn) {
                  var i;
                  var output = [];

                  if (_.isArray(value)) {
                     for (i = 0; i < value.length; i++) {
                        if (!isNaN(value[i])) {
                           output.push(value[i]);
                        } else if (typeof value[i] === 'string') {
                           output.push('\'' + value[i].replace('\'', '\'\'') + '\'');
                        }
                     }

                     return '(' + output.join() + ')';
                  } else if (!isNaN(value)) {
                     return value;
                  } else if (typeof value === 'string') {
                     return '\'' + value.replace('\'', '\'\'') + '\'';
                  }

                  return value;
               }
            }, {
               key: 'formatJSONTemplate',
               value: function formatJSONTemplate(value, variable, fn) {
                  var i;
                  var output = [];

                  if (_.isArray(value)) {
                     for (i = 0; i < value.length; i++) {
                        if (!isNaN(value[i])) {
                           output.push(parseInt(value[i]));
                        } else if (typeof value[i] === 'string') {
                           output.push(value[i]);
                        }
                     }

                     return JSON.stringify(output);
                  } else if (typeof value === 'string') {
                     return '"' + value.replace('"', '\\"') + '"';
                  }

                  return value;
               }
            }]);

            return StatseekerDatasource;
         }());

         _export('StatseekerDatasource', StatseekerDatasource);
      }
   };
});
//# sourceMappingURL=datasource.js.map
