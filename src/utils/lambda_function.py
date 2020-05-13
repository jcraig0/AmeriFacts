import json
import boto3

def lambda_handler(event, context):
    body = json.loads(event['body'])
    client = boto3.client('dynamodb')

    if event['rawPath'] == '/attribute':
        attribute_names = {'#N': 'Name', '#A': body['attribute']}
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
            'TableName': body['resolution'],
            'ExpressionAttributeNames': attribute_names,
            'ProjectionExpression': 'ID, #N, #A'
        }
        if filter_expression:
            kwargs.update({
                'ExpressionAttributeValues': attribute_values,
                'FilterExpression': filter_expression
            })
        result = client.scan(**kwargs)
    else:
        result = client.query(
            TableName=body['resolution'],
            ExpressionAttributeValues={':featureId': {'S': body['featureId']}},
            KeyConditionExpression='ID = :featureId'
        )

    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }
