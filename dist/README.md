# Statseeker - Grafana Integration
This project provides a Statseeker datasource plugin for Grafana, allowing the use of Grafana to display data from a Statseeker server. 


## Prerequisites

* A Statseeker v5.2, or later, server
* A Grafana v4.3, or later, server (cannot be installed on the Statseeker server), see https://grafana.com/ for links to download packages and instructions on installation, and basic configuration of Grafana for your environment.


## Installation
The datasource can be added to a Grafana server by cloning this repository, or by downloading the package and adding it to your Grafana server.
##### Clone
 * Clone this repo into your Grafana plugins directory
 * Restart your Grafana server

```
# git clone https://github.com/statseeker/grafana-statseeker-datasource.git
# sudo service grafana-server restart
```
##### Download
* Download the Statseeker Grafana Datasource package
* Extract the package contents and copy [dist] folder to the Plugins directory on your Grafana server, typically: **/var/lib/grafana/plugins**
* Restart your Grafana server
`# sudo service grafana-server restart`

## Statseeker Configuration - Enable CORS on Statseeker
- Log into your Statseeker server GUI
- Select **Administration Tool -> Statseeker Administration > CORS Configuration**
- Add an *include* line referencing your Grafana server. The format for the entry is *{include\exclude} {regex}*, e.g. `include ^http://10.2.16.10:3000$`
Statseeker will now allow connections from your Grafana server.

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
Access | Configure a direct or proxy connection to the Statseeker server as required for your installation
Basic Auth | Check this option for accessing your Statseeker server
With Credentials | Check this option for accessing your Statseeker server
User | The Statseeker user account employed to collect the data for Grafana. **Note:** ensure that the user account has access to all Statseeker devices/interfaces.
Password | Password of the Statseeker user account employed to collect the data for Grafana

* Click  **Add**
The configuration is complete from the Grafana side and 

The Statseeker data-source will now be available when configuring elements on your Grafana dashboards. See documentation on the Grafana web site for adding and configuring dashboards.

## Useful Templates
Refer to Grafana's website for details on Templating in Grafana, the following template configurations are particularly useful to Statseeker centric Grafana dashboards.
#### Device Template
To create this template, it is easier to create a table panel on a dashboard and use the query string from that panel to define the template.

***Creating the table***
- Add a *Table* panel to a dashboard and configure it as follows

Field | Value/s
---- | ----
**Object** | cdt_device
**Fields** | id
|| name
**Sort By** | name, Ascending
**Limit** |  0
**Output** | Table
- Select the *hamburger* menu in the top right of the Table configuration row
- Select **Toggle Edit Mode**

This will display the query string that will be submitted to Statseeker to populate the table
- Copy the query string

**Creating the template**
- Select the Settings icon in the top-left of Grafana window and select **Templating**
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

## Formatting Timestamps
When adding tables to your dashboard that display a timestamp (time of status changes and other events) you will need to specify a field option to display the timestamp in a readable format. After specifying the field and field format, the option to supply **Field Options (json)**, is presented. The content of this field should be set to:
**{"grafana_timestamp":true}**

## Version History


## Authors
Developed by Statseeker.

## License
Copyright (c) 2017 Statseeker

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


