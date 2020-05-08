import json
import boto3

def lambda_handler(event, context):
    body = json.loads(event['body'])

    return {
        'statusCode': 200,
        'body': json.dumps(
            boto3.client('dynamodb').scan(
                TableName=body['resolution'],
                ExpressionAttributeNames={'#N': 'Name', '#A': body['attribute']},
                ProjectionExpression='ID, #N, #A'
            ) if event['rawPath'] == '/attribute' else
            boto3.client('dynamodb').query(
                TableName=body['resolution'],
                ExpressionAttributeValues={':featureId': {'S': body['featureId']}},
                KeyConditionExpression='ID=:featureId'
            )
        )
    }
