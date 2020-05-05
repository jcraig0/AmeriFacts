import zipfile
import pandas
import boto3

zipfile = zipfile.ZipFile('2018/data/1_year_entire_sf/All_Geographies.zip')
items = []

for file_name in zipfile.namelist():
    if file_name[0] == 'e' and file_name[6:8] != 'us' and file_name[-11:] == '0003000.txt':
        geo_file = pandas.read_csv(zipfile.open('g20181' + file_name[6:8] + '.csv'),
            encoding='latin-1', header=None)
        state_geoid, state_name = geo_file.iloc[0, 48], geo_file.iloc[0, 49]

        est_file = pandas.read_csv(zipfile.open(file_name), header=None)
        state_pop = str(est_file.iloc[0, 129])

        items.append({'PutRequest': {'Item':
            {'ID': {'S': state_geoid}, 'Name': {'S': state_name}, 'Population': {'N': state_pop}}}})

client = boto3.client('dynamodb', region_name='us-east-2')

while items != []:
    client.batch_write_item(RequestItems={'States': items[:25]})
    items = items[25:]