import json
import boto3

def lambda_handler(event, context):
    client = boto3.client('dynamodb')
    if 'body' in event:
        body = json.loads(event['body'])
        resolution = body['resolution'].replace(' ', '_')

    if event['rawPath'] == '/attribute':
        attribute_names = {'#N': 'Name', '#V': body['attribute'],
            '#M': body['attribute'] + ' MOE'}
        attribute_values = {}
        filter_expression = ''

        for i, filter in enumerate(body['filters']):
            if i != 0:
                filter_expression += ' and '
            tokens = filter.split()
            op_idx = next(i for i, token in enumerate(tokens)
                if token in ('=', '<', '<=', '>', '>='))
            attribute_names['#' + str(i)] = ' '.join(tokens[:op_idx])
            endTokens = tokens[op_idx+1:]

            firstNum = (endTokens[0][1:] if endTokens[0][0] == '$'
                else endTokens[0]).replace(',', '')
            attribute_values[':' + str(i)] = {'N': firstNum}
            if len(endTokens) == 1:
                filter_expression += '#{0} {1} :{0}'.format(str(i), tokens[op_idx])
            else:
                secondNum = (endTokens[2][1:] if endTokens[2][0] == '$'
                    else endTokens[2]).replace(',', '')
                attribute_values[':' + str(i) + 'a'] = {'N': secondNum}
                filter_expression += "#{0} between :{0} and :{0}a".format(str(i))

        kwargs = {
            'TableName': resolution,
            'ExpressionAttributeNames': attribute_names,
            'ProjectionExpression': 'ID, #N, #V, #M'
        }
        if filter_expression:
            kwargs.update({
                'ExpressionAttributeValues': attribute_values,
                'FilterExpression': filter_expression
            })
        result = client.scan(**kwargs)
    elif event['rawPath'] == '/feature':
        result = client.query(
            TableName=resolution,
            ExpressionAttributeValues={':featureId': {'S': body['featureId']}},
            KeyConditionExpression='ID = :featureId'
        )
    else:
        tables = client.list_tables()['TableNames']
        result = []

        for table in tables:
            items = client.scan(
                TableName=table,
                ExpressionAttributeNames={'#N': 'Name'},
                ProjectionExpression='#N'
            )['Items']
            result.extend(list(map(lambda item: {
                'resolution': table.replace('_', ' '),
                'str': item['Name']['S']
            }, items)))

        result = { 'names': result }

    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }
