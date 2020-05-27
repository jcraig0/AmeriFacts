# AmeriFacts

## Usage

This single-page web application lets you easily view data of geographic features in the United States. Currently, it uses the 1-year data from the 2018 American Community Survey.

There are two main areas of AmeriFacts. The map view shows the features color-graded, based on the values of the selected attribute. Hovering over a feature shows its name, its attribute value, and the value's margin-of-error. The details view, opened with the "Details" button, shows either an ordered table of the map's features or all the info for a selected feature. A feature can be selected by clicking on it.

A search bar at the top of the page allows you to select a feature by entering its name. Suggested results appear below the bar as you type the query. The controls bar below has functions to open/close the details view, choose the attribute to be displayed on the map and table, enable/disable percentage values, choose a resolution (i.e. summary level), add/remove filters on the map's features, and change the features' color scheme.

### Notes
* Due to a limitation in the 1-year ACS data, the "County" resolution only includes counties with at least 65,000 people.
* The "County" resolution's shapefile is ~10 MB, so a fast Internet connection is recommended to select this level.

## Technology

The front-end code is written in TypeScript using the Angular framework, HTML, and SASS. The scripts in the `src/utils` folder are written in Python. The database uses Amazon DynamoDB as its management system. The API code is stored as an AWS Lambda function. The website code is hosted in an Amazon EC2 instance.

## For Developers

Several steps are required to be able to run this application locally. An Amazon Web Services account is required. All files mentioned are stored in `src/utils`.

1. Using a Python 3 environment, install the required libraries for the `src/utils` scripts with pip and `requirements.txt`.
2. Run `create_shapefiles.py` to create the shapefiles.
3. In the IAM Management Console, create an AWSLambdaBasicExecutionRole that grants access to DynamoDB.
4. Create a DynamoDB database with the tables "State", "Congressional_District", and "County".
5. Download the AWS Command Line Interface, and configure it with an access key ID and secret access key.
6. Using an FTP client, connect to ftp2.census.gov and download the folders `/programs-surveys/acs/summary_file` and `/geo/tiger/TIGER2018` into `src\utils`, or create symbolic links in `src\utils` if you want the survey data stored elsewhere.
7. Run `load_values.py` to load the survey data into the DynamoDB database.
8. In API Gateway, create an HTTP API with the endpoints POST /attribute, POST /feature, and GET /names.
9. In Lambda, create the function "ValuesFunction" and its API Gateway triggers, using `ValuesFunction.yaml` as a reference. Make the runtime "Python 3.8". Copy and paste `lambda_function.py` into the code window for "ValuesFunction".
10. The back end should now be all set up. Install Node.js, then run `npm i` in the AmeriFacts folder. Run `npm i -g @angular/cli` to install Angular. Finally, enter `ng serve` to run the front-end code.
