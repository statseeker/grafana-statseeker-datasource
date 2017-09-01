'use strict';

System.register(['./datasource', './query_ctrl'], function (_export, _context) {
   "use strict";

   var StatseekerDatasource, StatseekerQueryCtrl, StatseekerConfigCtrl, StatseekerQueryOptionsCtrl;

   function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
         throw new TypeError("Cannot call a class as a function");
      }
   }

   return {
      setters: [function (_datasource) {
         StatseekerDatasource = _datasource.StatseekerDatasource;
      }, function (_query_ctrl) {
         StatseekerQueryCtrl = _query_ctrl.StatseekerQueryCtrl;
      }],
      execute: function () {
         _export('ConfigCtrl', StatseekerConfigCtrl = function StatseekerConfigCtrl() {
            _classCallCheck(this, StatseekerConfigCtrl);
         });

         StatseekerConfigCtrl.templateUrl = 'partials/config.html';

         _export('QueryOptionsCtrl', StatseekerQueryOptionsCtrl = function StatseekerQueryOptionsCtrl() {
            _classCallCheck(this, StatseekerQueryOptionsCtrl);
         });

         StatseekerQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

         _export('Datasource', StatseekerDatasource);

         _export('ConfigCtrl', StatseekerConfigCtrl);

         _export('QueryCtrl', StatseekerQueryCtrl);

         _export('QueryOptionsCtrl', StatseekerQueryOptionsCtrl);
      }
   };
});
//# sourceMappingURL=module.js.map
