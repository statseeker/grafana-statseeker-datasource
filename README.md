# Statseeker - Grafana Integration v1.1.0
This project provides a Statseeker datasource plugin for Grafana, allowing the use of Grafana to display data from a Statseeker server.

## <a name="Prerequisites"></a>Prerequisites
#### v1.1.0
* A Statseeker v5.5.3, or later, server
* A Grafana v4.3 - v9.x , server (cannot be installed on the Statseeker server), see https://grafana.com/ for links to download packages and instructions on installation, and basic configuration of Grafana for your environment.
* Note 1 - Grafana 7.x will just display a warning for loading unsigned plugins
* Note 2 - Grafana 8.x introduced a more stricter method in relation to signed plugins and by default does not allow unsigned plugins to load. To load our datasource, you will need to enable a configuration option called "allow_loading_unsigned_plugins" and define the Id of the plugin as statseeker-datasource. Documentation can be found in the the grafana website URL = https://grafana.com/docs/grafana/latest/administration/configuration/
* Note 3 - Basic Authentication will need to be used as the primary authetication between the Statseeker server Restful API and Grafana for version of Statseeker prior to 5.5.5
* Note 4 - Token based Authentication can be confiured and used if required in Statseeker version 5.5.5 and above. You will need to add a custom header called "Authorization" with a a value of Bearer + your API user token. This can be retrieved using browser DEV tools ( example inspect on Chrome ). Please also review your user Athentication Refresh option to ensure your token does not expire if this is the authetication method used.  Only a user with administrator access can adjust the Authentication Refresh option for a user.
* Example Value = Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjkwODA1NjksImlhdCI6MTY2OTA3Njk2O

#### v1.0.2
* A Statseeker v5.2.x - v5.4.3 server
* A Grafana v4.3 - v4.6.3 server (cannot be installed on the Statseeker server), see https://grafana.com/ for links to download packages and instructions on installation, and basic configuration of Grafana for your environment.

## Installation
* Download the correct version of the datasource (see [prerequisites](#Prerequisites)) from the [releases](https://github.com/statseeker/grafana-statseeker-datasource/releases) page.
* Extract the package contents and copy [dist] folder to the Plugins directory on your Grafana server, typically: **/var/lib/grafana/plugins** or in version 6.x and above **/usr/share/grafana/data/plugins**
* Restart your Grafana server
`# sudo service grafana-server restart`

## Grafana Configuration
* Login to your Grafana server
* Select **Data Sources > Add data source**
* Configure your new data source as follows:

Field | Content
---- | ----
Name | Name your datasource
Default | Check to make this datasource the default used by dashboards
Type | Select *Statseeker* from the drop-down list of available datasources
URL | The root API endpoint for your Statseeker server, e.g. `https://my.statseeker.server/api/latest`
Access | Choose `Server (Default)`
Basic Auth | Check this option for accessing your Statseeker server
With Credentials | Check this option for accessing your Statseeker server
User | The Statseeker user account employed to collect the data for Grafana. **Note:** ensure that the user account has access to all Statseeker devices/interfaces.
Password | Password of the Statseeker user account employed to collect the data for Grafana

* Click  **Add**

The configuration is complete from the Grafana side and the Statseeker data-source will now be available when configuring elements on your Grafana dashboards.
See documentation on the Grafana web site for adding and configuring dashboards.

## Configuring Graph and Table Panels
See the Statseeker documentation website for detailed instructions and examples on configuring components to add to your Grafana dashboards.
[How do I Build Grafana Dashboards with Statseeker Data](https://docs.statseeker.com/grafana-dashboards/).

## Objects and Fields

Refer to [Statseeker's API documentation](https://docs.statseeker.com/restful-api-latest/) for details on objects and fields used when configuring reports/dashboards.

## Timeseries Data Formats

All timeseries data fields **must** have a format specified.
* **Graph** panels will typically use `vals` or `cvals`
* **Table** panels will typically use anything other than `vals` or `cvals`
* The below list is some examples of the formats used, depending which version of Statseeker you use.

| Formats Key              | Required Field Option  | Description                                                  |
| ------------------------ | ---------------------- | ------------------------------------------------------------ |
| 95th                     |                        | 95th percentile of the data                                  |
| anomaly_metric           |                        | Metric from -100 to 100 indicating whether requested timeseries values are unusually large or small |
| anomaly_strength         |                        | Metric from 0 to 100 indicating whether requested timeseries values are extreme or unusual |
| avg                      |                        | Average of the data                                          |
| count                    |                        | Number of non-null data points                               |
| cvals                    |                        | Cumulative data values                                       |
| forecast_boundary_time   | forecast.predict_time  | Time forecast exceeds feasible value range if before end of timefilter range |
| forecast_daily_change    |                        | The average daily change of forecast values                  |
| forecast_fit             | forecast.predict_range | An array of forecast values without periodic deviations at peak and offpeak times |
| forecast_max             |                        | Upper boundary of feasible forecast value range              |
| forecast_min             |                        | Lower boundary of feasible forecast value range              |
| forecast_predict         | forecast.predict_time  | Long term prediction value calculated from historical data   |
| forecast_predict_offpeak | forecast.predict_time  | Long term prediction value calculated from historical data at offpeak times |
| forecast_predict_peak    | forecast.predict_time  | Long term prediction value calculated from historical data at peak times |
| forecast_vals            | forecast.predict_range | An array of forecast values with periodic deviations at peak and offpeak times |
| max                      |                        | Maximum data value                                           |
| median                   |                        | Median of the data                                           |
| min                      |                        | Minimum data value                                           |
| percentile               |                        | Custom percentile of the data                                |
| start_time               |                        | Time of the first data point                                 |
| start_tz_offset          |                        | The timezone offset of the first data point                  |
| stddev                   |                        | Standard deviation of the data                               |
| total                    |                        | Sum of the data                                              |
| trendline_daily_change   |                        | Slope of the trendline (units/day)                           |
| trendline_fit            |                        | Trendline data values                                        |
| trendline_lwr            |                        | Trendline confidence interval values (lower)                 |
| trendline_predict        | trendline.predict_time | Prediction value from the trendline                          |
| trendline_start          |                        | Value of the first trendline data point                      |
| trendline_strength       |                        | Goodness of fit (R-squared) of the trendline                 |
| trendline_upr            |                        | Trendline confidence interval values (upper)                 |
| vals                     |                        | Timeseries data values                                       |

## Event Formats

Event data metrics can have a statistical analysis applied  to the raw data prior to being displayed in tables or graphs.

| Format               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| avl_totalTransitions | The total number of transitions between all of the states     |
| state_delta          | The number of seconds to the previous record                 |
| state_time           | The time of the last transition                           |
| avl_inTransitions    | The number of transitions from one of the requested states to a state not requested |
| avl_inPercent        | The percent of time the event has been in any of the requested states |
| avl_outTransitions   | The number of transitions from a state that wasn't request to a requested state |
| avl_outTime          | The time the event has not been in any of the requested states |
| state                | The current state of the event                               |
| state_intime         | The number of seconds that the current state has been active |
| state_id             | The current state identifier of the event                    |
| avl_outPercent       | The percent of time the event has not been in any of the states |
| avl_inTime           | The time the event has been in any of the requested states   |

## Panel Output
Each query used in a panel has an **Output** field.

| Output		| Description |
| --------------| ------------|
| Timeseries | Default value, used for graphing timeseries data or presenting timeseries data in a table. When used in a table each row is a polling interval and each column is an entity (device, interface, etc.) |
| Table | Set to this value for **Table** panels: each row is an entity (device, interface, etc.) and each row is a field specified in the query |
| Table as Timeseries | Used when graphing events (device down events, threshold breaches, etc.) and allows aggregation to show counts over time |

## Formatting Timestamps

When adding tables to your dashboard that display a timestamp (time of status changes and other events) you will need to specify a field option to display the timestamp in a readable format. After specifying the field and field format, the option to supply **Field Options (json)**, is presented. The content of this field should be set to:
**{"grafana_timestamp":true}**

E.g. Display the time since the last change in ping state

![timestamp setting](https://docs.statseeker.com/img/5.0.0/misc/timestamps.png)


## Useful Templates
Refer to Grafana's website for details on Templating in Grafana, the following template configurations are particularly useful to Statseeker centric Grafana dashboards.
#### Device Template
To create this template, it is easier to create a table panel on a dashboard and use the query string from that panel to define the template.

***Creating the table***
- Add a *Table* panel to a dashboard and configure it as follows

Field | Value/s
---- | ----
**Object** | cdt_device
**Fields** | id, name
**Sort By** | name, Ascending
**Limit** |  0
**Output** | Table
- Select the *hamburger* menu in the top right of the Table configuration row
- Select **Toggle Edit Mode**

This will display the query string that will be submitted to Statseeker to populate the table
- Copy the query string

**Creating the template**
- Select the **Settings** icon in the top-right of Grafana window and select **Templating**
- Configure as follows

Field | Value
---- | ----
**Name** | Reference for the template, e.g. `device`
**Label** | Label displayed in the UI for the template, e.g. `Device`
**Datasource** | Statseeker
**Query** | Paste the query string from the table

- Click  *Add*

The template will be available at the top of the dashboard. Dashboard panels can use the template as a variable reference allowing you to change the selection in the template and have that change applied to all graphs and tables which reference it.
**Note:** templates can also be used in Panel titles.

##### Port Fields Template
This template will provide a list of fields associated with the *cdt_port* Statseeker API resource. Similar templates can be used to reference fields associated with other API objects.

Field | Value
---- | ----
**Name** | Reference for the template, e.g. `field`
**Label** | Label displayed in the UI for the template, e.g. `Field`
**Datasource** | Statseeker
**Query** | DESCRIBE cdt_port.fields

## Authors
Developed by Statseeker.

## Limited Support 
This Statseeker Grafana Datasource is published with limited support, Techniche cannot guarantee that all functions will be available throughout the complete lifetime of the product. Techniche will do its best to solve upcoming problems but cannot give assurance it may work with your installed grafana version. Support for this Statseeker Grafana Datasource feature is provided on a no-obligation and best effort basis only.

## License
Copyright (c) 2021 Statseeker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Acknowledgments
We'd like to acknowledge the effort of those responsible for developing, and maintaining, Grafana.


