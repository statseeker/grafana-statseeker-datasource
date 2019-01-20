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
               _this.outputModes = [{ text: 'Timeseries', value: 'timeseries' }, { text: 'Table', value: 'table' }, { text: 'Table as Timeseries', value: 'ts_table' }];
               _this.sortDirections = [{ text: 'Ascending', value: 'asc' }, { text: 'Descending', value: 'desc' }];

               _this.fieldSelection = '+';
               _this.filterSelection = '+';
               _this.sortSelection = '+';
               _this.aggrSelection = '+';
               _this.groupSelection = '+';
               _this.objectList = [];
               _this.objectLinks = {};
               _this.groupList = [];
               _this.descriptions = {};
               _this.deviceFieldMap = {};
               _this.selectedObject = _this.target.object;
               _this.loadObjectList().then(function (o) {
                  _this.objectList = o;
               });
               _this.loadDescription('cdt_device');
               if (_this.selectedObject) {
                  _this.loadDescription(_this.datasource.templateSrv.replace(_this.selectedObject));
               }
               _this.loadGroupList();

               /* Target properties */
               _this.setTargetProperties(_this.target);
               return _this;
            }

            _createClass(StatseekerQueryCtrl, [{
               key: 'setTargetProperties',
               value: function setTargetProperties(from) {
                  this.target.object = from.object || 'Select object';
                  this.target.object_opts = from.object_opts || null;
                  this.target.groups = from.groups || [];
                  this.target.fields = from.fields || [];
                  this.target.filters = from.filters || [];
                  this.target.adv_filter = from.adv_filter || null;
                  this.target.sortby = from.sortby || [];
                  this.target.groupby = from.groupby || [];
                  this.target.limit = from.limit || 10;
                  this.target.offset = from.offset || 0;
                  this.target.output = from.output || 'timeseries';
                  this.target.pivot_field = from.pivot_field || 'Select field';
                  this.target.interval = from.interval || null;
               }
            }, {
               key: 'loadDataList',
               value: function loadDataList(endpoint) {
                  var _this2 = this;

                  return this.datasource.runRequest(this.datasource.url + '/' + endpoint + '/?fields=id,name&limit=0&links=none', 'GET').then(function (response) {
                     var i;
                     var output = [];
                     var rows = response.data.data.objects[0].data;

                     if (rows.length === 0) {
                        return output;
                     }

                     for (i = 0; i < rows.length; i++) {
                        output.push({ text: rows[i].name, value: rows[i].name, id: rows[i].id });
                     }

                     /* Add the template variables */
                     var _iteratorNormalCompletion = true;
                     var _didIteratorError = false;
                     var _iteratorError = undefined;

                     try {
                        for (var _iterator = _this2.datasource.templateSrv.variables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                           var variable = _step.value;

                           output.push({ text: '$' + variable.name, value: '$' + variable.name });
                        }
                     } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                     } finally {
                        try {
                           if (!_iteratorNormalCompletion && _iterator.return) {
                              _iterator.return();
                           }
                        } finally {
                           if (_didIteratorError) {
                              throw _iteratorError;
                           }
                        }
                     }

                     return output;
                  }, function (err) {
                     var res;

                     if (!err.data.data) {
                        throw { message: 'Request failed', data: err.data, config: err.config };
                     }
                     res = err.data.data;
                     if (!res.success) {
                        if (res.objects && res.objects.length === 1) {
                           throw { message: res.objects[0].status.errmsg, data: err.data, config: err.config };
                        } else {
                           throw { message: res.errmsg, data: err.data, config: err.config };
                        }
                     }
                  });
               }
            }, {
               key: 'moveRow',
               value: function moveRow(list, from, to) {
                  _.move(list, from, to);
               }
            }, {
               key: 'loadObjectList',
               value: function loadObjectList() {
                  if (this.objectList.length > 0) {
                     return Promise.resolve(this.objectList);
                  }

                  return this.loadDataList('object');
               }
            }, {
               key: 'loadGroupList',
               value: function loadGroupList() {
                  var _this3 = this;

                  var i, j, p;

                  if (this.groupList.length > 0) {
                     return Promise.resolve(this.groupList);
                  }

                  p = this.loadDataList('group');
                  p.then(function (list) {
                     _this3.groupList = list;

                     /* Update any names in the target groups (and remove any non-existant ones) */
                     for (i = _this3.target.groups.length - 1; i >= 0; i--) {
                        if (!_this3.target.groups[i].id) {
                           continue;
                        }
                        _this3.target.groups[i].name = null;
                        for (j = 0; j < list.length; j++) {
                           if (list[j].id === _this3.target.groups[i].id) {
                              _this3.target.groups[i].name = list[j].value;
                              break;
                           }
                        }
                        if (_this3.target.groups[i].name === null) {
                           _this3.target.groups.splice(i, 1);
                        }
                     }
                  });

                  return p;
               }
            }, {
               key: 'loadDescription',
               value: function loadDescription(obj) {
                  var _this4 = this;

                  if (!obj || obj === 'Select object') {
                     return Promise.resolve([]);
                  }

                  if (this.descriptions[obj]) {
                     return Promise.resolve(this.descriptions[obj]);
                  }

                  return this.datasource.runRequest(this.datasource.url + '/' + obj + '/describe?links=none', 'GET').then(function (response) {
                     _this4.descriptions[obj] = response.data.data.objects[0];

                     /* Get the descriptions of linked fields */
                     _.forOwn(_.get(response, 'data.data.objects[0].info.links', {}), function (val, key) {
                        _this4.loadDescription(val.dst);
                     });

                     return _this4.descriptions[obj];
                  }, function (err) {
                     var res;

                     if (!err.data.data) {
                        throw { message: 'Request failed', data: err.data, config: err.config };
                     }
                     res = err.data.data;
                     if (!res.success) {
                        if (res.objects && res.objects.length === 1) {
                           throw { message: res.objects[0].status.errmsg, data: err.data, config: err.config };
                        } else {
                           throw { message: res.errmsg, data: err.data, config: err.config };
                        }
                     }
                  });
               }
            }, {
               key: 'getObjectFields',
               value: function getObjectFields(output, done, obj) {
                  var _this5 = this;

                  var selectedObj = this.datasource.templateSrv.replace(this.selectedObject);

                  if (done[obj]) {
                     return;
                  }

                  _.forOwn(_.get(this.descriptions, obj + '.fields', {}), function (val, key) {
                     if (obj === selectedObj) {
                        output.push({ text: key, value: key });
                     } else {
                        output.push({ text: obj + '.' + key, value: obj + '.' + key });
                     }
                  });

                  done[obj] = true;

                  /* Get any linked object fields */
                  _.forOwn(_.get(this.descriptions, obj + '.info.links', {}), function (val, key) {
                     _this5.getObjectFields(output, done, val.dst);
                  });
               }
            }, {
               key: 'buildFieldList',
               value: function buildFieldList() {
                  var output = [];
                  var done = {};
                  var obj = this.datasource.templateSrv.replace(this.selectedObject);

                  this.getObjectFields(output, done, this.datasource.templateSrv.replace(this.selectedObject));

                  /* Add the device fields at the end for cdt_ objects*/
                  if (obj.startsWith('cdt_') && obj !== 'cdt_ranges') {
                     this.getObjectFields(output, done, 'cdt_device');
                  }

                  /* Add the template variables */
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;

                  try {
                     for (var _iterator2 = this.datasource.templateSrv.variables[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var variable = _step2.value;

                        output.push({ text: '$' + variable.name, value: '$' + variable.name });
                     }
                  } catch (err) {
                     _didIteratorError2 = true;
                     _iteratorError2 = err;
                  } finally {
                     try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                           _iterator2.return();
                        }
                     } finally {
                        if (_didIteratorError2) {
                           throw _iteratorError2;
                        }
                     }
                  }

                  return output;
               }
            }, {
               key: 'getFieldList',
               value: function getFieldList() {
                  return Promise.resolve(this.buildFieldList()).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'buildFormatList',
               value: function buildFormatList(field) {
                  var output = [];
                  var fld = this.datasource.templateSrv.replace(field, null, this.formatFirstTemplate);
                  var obj = this.datasource.templateSrv.replace(this.selectedObject);
                  var fmtList, arr;

                  arr = fld.split('.');
                  if (arr.length === 1) {
                     fmtList = _.get(this.descriptions, obj + '.fields.' + fld + '.options.formats.values', []);
                  } else {
                     fmtList = _.get(this.descriptions, arr[0] + '.fields.' + arr[1] + '.options.formats.values', []);
                  }

                  if (!fmtList) {
                     return [];
                  }

                  _.forOwn(fmtList, function (val, key) {
                     output.push({ text: key, value: key });
                  });

                  return _.sortBy(output, [function (val) {
                     return val.text.toLowerCase();
                  }]);
               }
            }, {
               key: 'getFormatList',
               value: function getFormatList(field) {
                  var output = this.buildFormatList(field);

                  /* Add the template variables */
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                     for (var _iterator3 = this.datasource.templateSrv.variables[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var variable = _step3.value;

                        output.push({ text: '$' + variable.name, value: '$' + variable.name });
                     }
                  } catch (err) {
                     _didIteratorError3 = true;
                     _iteratorError3 = err;
                  } finally {
                     try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                           _iterator3.return();
                        }
                     } finally {
                        if (_didIteratorError3) {
                           throw _iteratorError3;
                        }
                     }
                  }

                  return Promise.resolve(output).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'fieldHasFormats',
               value: function fieldHasFormats(field) {
                  return this.buildFormatList(field).length > 0;
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
                     return val.text.toLowerCase();
                  }])).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'getGroupbyOptions',
               value: function getGroupbyOptions() {
                  var i, alias;
                  var output = [];

                  for (i = 0; i < this.target.fields.length; i++) {
                     alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     output.push({ text: alias, value: alias });
                  }

                  output = _.sortBy(output, [function (v) {
                     return v.text.toLowerCase();
                  }]);
                  output.unshift({ text: '~All~', value: '~All~' });
                  output.push({ text: '~Custom~', value: '~Custom~' });

                  return Promise.resolve(output).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'getAliasFormats',
               value: function getAliasFormats(alias) {
                  var i, f_alias;

                  for (i = 0; i < this.target.fields.length; i++) {
                     f_alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     if (f_alias === alias) {
                        return this.getFormatList(this.target.fields[i].name);
                     }
                  }

                  return [];
               }
            }, {
               key: 'getAggregationFormatList',
               value: function getAggregationFormatList() {
                  var output = [{ text: 'first', value: 'first' }, { text: 'last', value: 'last' }, { text: 'avg', value: 'avg' }, { text: 'count', value: 'count' }, { text: 'count_all', value: 'count_all' }, { text: 'cat', value: 'cat' }, { text: 'list', value: 'list' }, { text: 'min', value: 'min' }, { text: 'max', value: 'max' }, { text: 'sum', value: 'sum' }, { text: 'total', value: 'total' }, { text: 'median', value: 'median' }, { text: '95th', value: '95th' }, { text: 'stddev', value: 'stddev' }];

                  return Promise.resolve(_.sortBy(output, [function (val) {
                     return val.text.toLowerCase();
                  }])).then(this.uiSegmentSrv.transformToSegments(false));
               }
            }, {
               key: 'aliasHasFormats',
               value: function aliasHasFormats(alias) {
                  var i, f_alias;

                  for (i = 0; i < this.target.fields.length; i++) {
                     f_alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     if (f_alias === alias) {
                        return this.fieldHasFormats(this.target.fields[i].name);
                     }
                  }

                  return false;
               }
            }, {
               key: 'objectChanged',
               value: function objectChanged() {
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
            }, {
               key: 'addGroup',
               value: function addGroup() {
                  var i;

                  for (i = 0; i < this.groupList.length; i++) {
                     if (this.groupSelection === this.groupList[i].value) {
                        this.target.groups.push({ id: this.groupList[i].id, name: this.groupList[i].value });
                     }
                  }
                  this.groupSelection = '+';
               }
            }, {
               key: 'addField',
               value: function addField() {
                  var row;
                  var fieldMap = _.keyBy(this.buildFieldList(), 'text');

                  if (!(this.fieldSelection in fieldMap)) {
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
            }, {
               key: 'addFilter',
               value: function addFilter() {
                  var i, alias;

                  for (i = 0; i < this.target.fields.length; i++) {
                     alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     if (this.filterSelection === alias) {
                        this.target.filters.push({ field: this.filterSelection, format: 'Select format' });
                        break;
                     }
                  }
                  this.filterSelection = '+';
               }
            }, {
               key: 'addSort',
               value: function addSort() {
                  var i, alias;

                  for (i = 0; i < this.target.fields.length; i++) {
                     alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                     if (this.sortSelection === alias) {
                        this.target.sortby.push({ field: this.sortSelection, format: 'Select format', order: 'asc' });
                        break;
                     }
                  }
                  this.sortSelection = '+';
               }
            }, {
               key: 'addAggr',
               value: function addAggr() {
                  var i, alias;

                  if (this.aggrSelection === '~All~' || this.aggrSelection === '~Custom~') {
                     this.target.groupby.push({ field: this.aggrSelection, format: 'Select format', custom: '' });
                  } else {
                     for (i = 0; i < this.target.fields.length; i++) {
                        alias = this.target.fields[i].alias ? this.target.fields[i].alias : this.target.fields[i].name;
                        if (this.aggrSelection === alias) {
                           this.target.groupby.push({ field: this.aggrSelection, format: 'Select format', custom: '' });
                           break;
                        }
                     }
                  }
                  this.aggrSelection = '+';
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
               key: 'getCollapsedText',
               value: function getCollapsedText() {
                  return this.target.object + ' (' + _.map(this.target.fields, 'name').join(', ') + ') as ' + this.target.output;
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
