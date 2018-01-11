'use strict';

System.register(['app/plugins/sdk', 'lodash', 'angular'], function (_export, _context) {
   "use strict";

   var QueryCtrl, _, angular, _createClass, StatseekerQueryCtrl;

   function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
         throw new TypeError("Cannot call a class as a function");
      }
   }

   function _possibleConstructorReturn(self, call) {
      if (!self) {
         throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return call && (typeof call === "object" || typeof call === "function") ? call : self;
   }

   function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
         throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
         constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
         }
      });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
   }

   return {
      setters: [function (_appPluginsSdk) {
         QueryCtrl = _appPluginsSdk.QueryCtrl;
      }, function (_lodash) {
         _ = _lodash.default;
      }, function (_angular) {
         angular = _angular.default;
      }],
      execute: function () {
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

         _export('StatseekerQueryCtrl', StatseekerQueryCtrl = function (_QueryCtrl) {
            _inherits(StatseekerQueryCtrl, _QueryCtrl);

            function StatseekerQueryCtrl($scope, $injector, uiSegmentSrv) {
               _classCallCheck(this, StatseekerQueryCtrl);

               var _this = _possibleConstructorReturn(this, (StatseekerQueryCtrl.__proto__ || Object.getPrototypeOf(StatseekerQueryCtrl)).call(this, $scope, $injector));

               _this.scope = $scope;
               _this.uiSegmentSrv = uiSegmentSrv;
               _this.outputModes = [{ text: 'Timeseries', value: 'timeseries' }, { text: 'Table', value: 'table' }];
               _this.sortDirections = [{ text: 'Ascending', value: 'asc' }, { text: 'Descending', value: 'desc' }];

               _this.fieldSelection = '+';
               _this.filterSelection = '+';
               _this.sortSelection = '+';
               _this.objectList = [];
               _this.fieldMap = {};
               _this.deviceFieldMap = {};
               _this.selectedObject = _this.target.object;
               _this.loadObjectList().then(function (o) {
                  _this.loadFieldMap('cdt_device').then(function (f_dev) {
                     var obj;

                     /* Prepend 'Device' to all fields */
                     _.forOwn(f_dev, function (val, key) {
                        _this.deviceFieldMap['cdt_device.' + key] = val;
                     });
                     if (_this.selectedObject) {
                        obj = _this.datasource.templateSrv.replace(_this.selectedObject);

                        _this.loadFieldMap(obj).then(function (f) {
                           _this.fieldMap = f;
                           if (obj !== 'cdt_device' && obj !== 'cdt_ranges' && obj.startsWith('cdt_')) {
                              _.merge(_this.fieldMap, _this.deviceFieldMap);
                           }
                           _this.objectList = o;
                        });
                     }
                  });
               });

               /* Target properties */
               _this.setTargetProperties(_this.target);
               return _this;
            }

            _createClass(StatseekerQueryCtrl, [{
               key: 'setTargetProperties',
               value: function setTargetProperties(from) {
                  this.target.object = from.object || 'Select object';
                  this.target.object_opts = from.object_opts || null;
                  this.target.fields = from.fields || [];
                  this.target.filters = from.filters || [];
                  this.target.adv_filter = from.adv_filter || null;
                  this.target.sortby = from.sortby || [];
                  this.target.limit = from.limit || 10;
                  this.target.offset = from.offset || 0;
                  this.target.output = from.output || 'timeseries';
               }
            }, {
               key: 'loadObjectList',
               value: function loadObjectList() {
                  var _this2 = this;

                  if (this.objectList.length > 0) {
                     return Promise.resolve(this.objectList);
                  }

                  return this.datasource.runRequest(this.datasource.url + '/object/?fields=name&limit=0&links=none', 'GET').then(function (response) {
                     var i;
                     var output = [];
                     var rows = response.data.data.objects[0].data;

                     if (rows.length === 0) {
                        return output;
                     }

                     for (i = 0; i < rows.length; i++) {
                        output.push({ text: rows[i].name, value: rows[i].name });
                     }

                     /* Add the template variables */
                     _.forOwn(_this2.datasource.templateSrv._index, function (val, key) {
                        output.push({ text: '$' + key, value: '$' + key });
                     });

                     return output;
                  }, function (err) {
                     var res;

                     if (!err.data.data) {
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
               key: 'loadFieldMap',
               value: function loadFieldMap(obj) {
                  var _this3 = this;

                  if (!obj || obj === 'Select object') {
                     return Promise.resolve([]);
                  }

                  return this.datasource.runRequest(this.datasource.url + '/' + obj + '/describe?links=none', 'GET').then(function (response) {
                     var fieldMap, formats;

                     fieldMap = response.data.data.objects[0].fields;
                     _.forOwn(fieldMap, function (val, key) {
                        formats = [];
                        _.forOwn(_.get(val, 'options.formats.values', []), function (v, fmt) {
                           formats.push({ text: fmt, value: fmt });
                        });
                        val.formats = _.sortBy(formats, [function (v) {
                           v.text.toLowerCase();
                        }]);
                     });

                     /* Add the template variables */
                     _.forOwn(_this3.datasource.templateSrv._index, function (val, key) {
                        fieldMap['$' + key] = { name: '$' + key };
                        fieldMap['$' + key].formats = [];
                     });

                     return fieldMap;
                  }, function (err) {
                     var res;

                     if (!err.data.data) {
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
               key: 'getFieldList',
               value: function getFieldList() {
                  var output = [];

                  _.forOwn(this.fieldMap, function (val, key) {
                     output.push({ text: key, value: key });
                  });

                  return Promise.resolve(_.sortBy(output, [function (val) {
                     val.text.toLowerCase();
                  }])).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'getFormatList',
               value: function getFormatList(field) {
                  var output = [];
                  var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);

                  if (this.fieldMap[fld]) {
                     output = _.cloneDeep(this.fieldMap[fld].formats);
                     /* Add the template variables */
                     _.forOwn(this.datasource.templateSrv._index, function (val, key) {
                        output.push({ text: '$' + key, value: '$' + key });
                     });
                  }

                  return Promise.resolve(_.sortBy(output, [function (val) {
                     val.text.toLowerCase();
                  }])).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'fieldHasFormats',
               value: function fieldHasFormats(field) {
                  var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);

                  return this.fieldMap[fld] && this.fieldMap[fld].formats.length > 0;
               }
            }, {
               key: 'getSelectedFields',
               value: function getSelectedFields() {
                  var i, alias;
                  var output = [];

                  for (i = 0; i < this.target.fields.length; i++) {
                     alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     output.push({ text: alias, value: alias });
                  }

                  return Promise.resolve(_.sortBy(output, [function (val) {
                     val.text.toLowerCase();
                  }])).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'getAliasFormats',
               value: function getAliasFormats(alias) {
                  var i, f_alias;

                  for (i = 0; i < this.target.fields.length; i++) {
                     f_alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     if (f_alias === alias && this.fieldMap[this.target.fields[i].name]) {
                        return this.getFormatList(this.target.fields[i].name);
                     }
                  }

                  return [];
               }
            }, {
               key: 'aliasHasFormats',
               value: function aliasHasFormats(alias) {
                  var i, f_alias;

                  for (i = 0; i < this.target.fields.length; i++) {
                     f_alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     if (f_alias === alias && this.fieldMap[this.target.fields[i].name]) {
                        return this.fieldHasFormats(this.target.fields[i].name);
                     }
                  }

                  return false;
               }
            }, {
               key: 'objectChanged',
               value: function objectChanged() {
                  var _this4 = this;

                  var obj = this.datasource.templateSrv.replace(this.target.object);

                  this.target.fields = [];
                  this.target.filters = [];
                  this.target.sortby = [];
                  this.target.object_opts = null;
                  this.selectedObject = null;

                  this.loadFieldMap(obj).then(function (f) {
                     _this4.fieldMap = f;
                     if (obj !== 'cdt_device' && obj !== 'cdt_ranges' && obj.startsWith('cdt_')) {
                        _.merge(_this4.fieldMap, _this4.deviceFieldMap);
                     }
                     _this4.selectedObject = _this4.target.object;
                  });
               }
            }, {
               key: 'addField',
               value: function addField() {
                  var row = { name: this.fieldSelection, format: 'Select format', hide: false };

                  this.target.fields.push(row);
                  this.fieldSelection = '+';
               }
            }, {
               key: 'addFilter',
               value: function addFilter() {
                  var row = { field: this.filterSelection, format: 'Select format' };

                  this.target.filters.push(row);
                  this.filterSelection = '+';
               }
            }, {
               key: 'addSort',
               value: function addSort() {
                  var row = { field: this.sortSelection, format: 'Select format', order: 'asc' };

                  this.target.sortby.push(row);
                  this.sortSelection = '+';
               }
            }, {
               key: 'removeField',
               value: function removeField(index) {
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
            }, {
               key: 'removeFilter',
               value: function removeFilter(index) {
                  this.target.filters.splice(index, 1);
               }
            }, {
               key: 'removeSort',
               value: function removeSort(index) {
                  this.target.sortby.splice(index, 1);
               }
            }, {
               key: 'getCollapsedText',
               value: function getCollapsedText() {
                  return this.target.object + ' (' + _.map(this.target.fields, 'field').join(', ') + ') as ' + this.target.output;
               }
            }, {
               key: 'toggleEditorMode',
               value: function toggleEditorMode() {
                  var tmp;

                  if (this.target.rawMode) {
                     /* Recreate the target */
                     tmp = _.attempt(JSON.parse, this.target.rawQuery);
                     if (_.isError(tmp)) {
                        throw { message: 'JSON decode failed' };
                     }
                     this.setTargetProperties(tmp);
                     this.target.rawMode = false;
                     this.target.rawQuery = null;
                  } else {
                     /* Encode the raw query */
                     this.target.rawQuery = angular.toJson(this.target);
                     this.target.rawMode = true;
                  }
               }
            }, {
               key: 'formatFirstTemplate',
               value: function formatFirstTemplate(value, variable, fn) {
                  if (_.isArray(value)) {
                     return value[0];
                  }

                  return value;
               }
            }]);

            return StatseekerQueryCtrl;
         }(QueryCtrl));

         _export('StatseekerQueryCtrl', StatseekerQueryCtrl);

         StatseekerQueryCtrl.templateUrl = 'partials/query.editor.html';
      }
   };
});
//# sourceMappingURL=query_ctrl.js.map
