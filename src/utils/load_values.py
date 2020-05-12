import zipfile
import pandas
import boto3

file = zipfile.ZipFile('2018/data/1_year_entire_sf/All_Geographies.zip')
resolutions = {
    '040': 'State',
    '050': 'County',
    '500': 'Congressional_District'
}
columns = {
    '0003': [('Population', 129)],
    '0062': [('Population Below Poverty Line', 7)],
    '0078': [('Median Household Income', 177)]
}
items_dict = {resolution: [] for resolution in resolutions.keys()}

for file_name in file.namelist():
    if file_name[0] == 'g' and file_name[6:8] != 'us' and file_name[-4:] == '.csv':
        geo_file = pandas.read_csv(file.open(file_name), encoding='latin-1', header=None)
        rows = {idx: (row.iloc[48], row.iloc[49]) for idx, row in geo_file.iterrows()
            if row.iloc[48][:3] in resolutions.keys() and row.iloc[48][3:5] == '00'}

        for seq_num, seq_columns in columns.items():
            est_file = pandas.read_csv(file.open(
                'e20181' + file_name[6:8] + seq_num + '000.txt'), header=None)
            for idx, row in rows.items():
                res_num = row[0][:3]
                try:
                    curr_item = next(item for item in items_dict[res_num]
                        if item['PutRequest']['Item']['ID']['S'] == row[0])
                except StopIteration:
                    name = row[1]
                    if res_num == '500':
                        name = name.replace(' (116th Congress)', '')
                    curr_item = {'PutRequest': {'Item': {
                        'ID': {'S': row[0]}, 'Name': {'S': name}
                    }}}
                    items_dict[res_num].append(curr_item)

                req_columns = {}
                for column in seq_columns:
                    req_columns[column[0]] = {'N': str(est_file.iloc[idx, column[1]])}

                curr_item['PutRequest']['Item'].update(req_columns)

client = boto3.client('dynamodb', region_name='us-east-2')

for res_num, items in items_dict.items():
    while items != []:
        client.batch_write_item(RequestItems={resolutions[res_num]: items[:25]})
        items = items[25:]