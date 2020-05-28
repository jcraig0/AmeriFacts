# AmeriFacts

## Usage

This single-page web application lets you intuitively view data of geographic features in the United States. It currently uses the 1-year data from the 2018 American Community Survey.

There are two main areas of AmeriFacts. The map view visualizes the features for a given resolution, color-graded by the values of the selected attribute. Hovering over a feature shows its name, its attribute value, and the value's margin-of-error. The details view shows either a table of the map's features or all available info for a selected feature. A feature can be selected by clicking on it. The table can be ordered by the name or the selected attribute, and the info gives the ordinal number for each attribute.

A search bar at the top of the page allows you to select a feature by entering its name. Suggested results appear below the bar as the query is typed. The controls bar below has functions to open/close the details view, choose the attribute displayed in the map and table, enable/disable percentage values, choose a resolution (i.e. summary level), add/remove filters on the map's features, and change the features' color scheme.

### Notes
* Due to a limitation in the 1-year ACS data, the "County" resolution only includes counties with at least 65,000 people.
* The "County" resolution's shapefile is ~10 MB, so a fast Internet connection is recommended to select this level.

## Technology

The front-end code is written in TypeScript using the Angular framework, HTML, and SASS. The scripts in the `src\utils` folder are written in Python. The database uses Amazon DynamoDB as its management system. The API code is stored as an AWS Lambda function. The website code is hosted in an Amazon EC2 instance.

## For Developers

The back end must be configured to be able to run this application locally. An Amazon Web Services account is required. All mentioned files are stored in `src\utils` unless said otherwise.

1. In the IAM Management Console, create an AWSLambdaBasicExecutionRole that grants access to DynamoDB.
2. Create a DynamoDB database with the tables "State", "Congressional_District", and "County".
3. Download the AWS Command Line Interface, and configure it with an access key ID and secret access key.
4. Using an FTP client, connect to ftp2.census.gov and download the folders `/programs-surveys/acs/summary_file` and `/geo/tiger/TIGER2018` into `src\utils`, or create symbolic links in `src\utils` if you want the survey data stored elsewhere.
5. Using a Python 3 environment, install the required libraries for the `src\utils` scripts with pip and `requirements.txt`.
6. Run `load_values.py` to load the survey data into the DynamoDB database.
7. Run `create_shapefiles.py` to create the GeoJSON shapefiles from the TIGER/Line data.
8. In API Gateway, create an HTTP API with the endpoints POST /attribute, POST /feature, and GET /names.
9. In Lambda, create the function "ValuesFunction" and its API Gateway triggers, using `ValuesFunction.yaml` as a reference. Make the runtime "Python 3.8". Copy and paste `lambda_function.py` into the code window for "ValuesFunction".
10. The back end should now be all set up. Install Node.js, then run `npm i` in the AmeriFacts folder. Run `npm i -g @angular/cli` to install Angular. Finally, enter `ng serve` to run the front-end code.
