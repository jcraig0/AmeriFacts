import json
import boto3


def lambda_handler(event, context):
    client = boto3.client('dynamodb')
    if 'body' in event:
        body = json.loads(event['body'])
        resolution = body['resolution'].replace(' ', '_')
    elif 'queryStringParameters' in event:
        args = event['queryStringParameters']
        resolution = args['resolution'].replace(' ', '_')

    if event['rawPath'] == '/attribute':
        attribute_names = {
            '#N': 'Name', '#V': body['attribute'],
            '#M': body['attribute'] + ' MOE',
            '#O': body['attribute'] + ' Ord'
        }
        attribute_values = {}
        filter_expression = ''

        for i, _filter in enumerate(body['filters']):
            if i != 0:
                filter_expression += ' and '
            tokens = _filter.split()
            op_idx = next(i for i, token in enumerate(tokens)
                          if token in ('=', '<', '<=', '>', '>='))
            attribute_names['#' + str(i)] = ' '.join(tokens[:op_idx])
            endTokens = tokens[op_idx+1:]

            firstNum = (endTokens[0][1:] if endTokens[0][0] == '$'
                        else endTokens[0]).replace(',', '')
            attribute_values[':' + str(i)] = {'N': firstNum}
            if len(endTokens) == 1:
                filter_expression += '#{0} {1} :{0}'.format(
                    str(i), tokens[op_idx])
            else:
                secondNum = (endTokens[2][1:] if endTokens[2][0] == '$'
                             else endTokens[2]).replace(',', '')
                attribute_values[':' + str(i) + 'a'] = {'N': secondNum}
                filter_expression += "#{0} between :{0} and :{0}a" \
                    .format(str(i))

        kwargs = {
            'TableName': resolution,
            'ExpressionAttributeNames': attribute_names,
            'ProjectionExpression': 'ID, #N, #V, #M, #O'
        }
        if filter_expression:
            kwargs.update({
                'ExpressionAttributeValues': attribute_values,
                'FilterExpression': filter_expression
            })

        results = {'Items': []}
        while True:
            response = client.scan(**kwargs)
            results['Items'].extend(response['Items'])
            if 'LastEvaluatedKey' in response:
                kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
            else:
                break
    elif event['rawPath'] == '/feature':
        results = client.query(
            TableName=resolution,
            ExpressionAttributeValues={':featureId': {'S': args['featureId']}},
            KeyConditionExpression='ID = :featureId'
        )
    else:
        tables = client.list_tables()['TableNames']
        results = []

        for table in tables:
            items = client.scan(
                TableName=table,
                ExpressionAttributeNames={'#N': 'Name'},
                ProjectionExpression='#N'
            )['Items']
            results.extend(list(map(lambda item: {
                'resolution': table.replace('_', ' '),
                'str': item['Name']['S']
            }, items)))

        results = {'names': results}

    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }
