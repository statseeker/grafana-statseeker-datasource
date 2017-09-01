import {StatseekerDatasource} from './datasource';
import {StatseekerQueryCtrl} from './query_ctrl';

class StatseekerConfigCtrl {}
StatseekerConfigCtrl.templateUrl = 'partials/config.html';

class StatseekerQueryOptionsCtrl {}
StatseekerQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

export {
   StatseekerDatasource as Datasource,
   StatseekerConfigCtrl as ConfigCtrl,
   StatseekerQueryCtrl as QueryCtrl,
   StatseekerQueryOptionsCtrl as QueryOptionsCtrl
};
