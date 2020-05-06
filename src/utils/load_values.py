import zipfile
import pandas
import boto3

zipfile = zipfile.ZipFile('2018/data/1_year_entire_sf/All_Geographies.zip')
columns = {
    '0003': [('Population', 129)],
    '0062': [('Population Below Poverty Line', 7)],
    '0078': [('Median Household Income', 177)]
}
items = []

for file_name in zipfile.namelist():
    if file_name[0] == 'g' and file_name[6:8] != 'us' and file_name[-4:] == '.csv':
        geo_file = pandas.read_csv(zipfile.open(file_name), encoding='latin-1', header=None)
        state_geoid, state_name = geo_file.iloc[0, 48], geo_file.iloc[0, 49]
        req_columns = {}

        for seq_num, seq_columns in columns.items():
            est_file = pandas.read_csv(zipfile.open(
                'e20181' + file_name[6:8] + seq_num + '000.txt'), header=None)
            for column in seq_columns:
                req_columns[column[0]] = {'N': str(est_file.iloc[0, column[1]])}

        items.append({'PutRequest': {'Item': {**{
            'ID': {'S': state_geoid},
            'Name': {'S': state_name}
        }, **req_columns}}})

client = boto3.client('dynamodb', region_name='us-east-2')

while items != []:
    client.batch_write_item(RequestItems={'States': items[:25]})
    items = items[25:]