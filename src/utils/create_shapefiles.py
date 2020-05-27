import zipfile
import shapefile
import os
import json

resolutions = {
    'State': 'state',
    'County': 'county',
    'Congressional District': 'cd'
}
for res_name, res_abbr in resolutions.items():
    file_res_abbr = 'cd116' if res_abbr == 'cd' else res_abbr
    file = zipfile.ZipFile('TIGER2018/{}/tl_2018_us_{}.zip'.format(
        res_abbr.upper(), file_res_abbr))
    sf = shapefile.Reader(
        shp=file.open('tl_2018_us_' + file_res_abbr + '.shp'),
        dbf=file.open('tl_2018_us_' + file_res_abbr + '.dbf'),
        shx=file.open('tl_2018_us_' + file_res_abbr + '.shx')
    )

    features = []
    for shape_record in sf.shapeRecords():
        geometry = shape_record.shape.__geo_interface__
        if geometry['type'] == 'Polygon':
            geometry['coordinates'] = [[
                coord for i, coord in enumerate(geometry['coordinates'][0])
                if i % 20 == 0]]
        else:
            for i, coords in enumerate(geometry['coordinates']):
                geometry['coordinates'][i] = [[
                    coord for i, coord in enumerate(coords[0])
                    if i % 20 == 0]]

        # Adapted from Frank Rowe (https://gist.github.com/frankrowe/6071443)
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": dict(zip([f[0] for f in sf.fields[1:]],
                                   shape_record.record))
        })

    folder_path = '../assets/shapefiles/'
    os.makedirs(folder_path, exist_ok=True)
    open(folder_path + res_name + '.json', 'w').write(json.dumps(
        {"type": "FeatureCollection", "features": features})
            .replace(' ', '').replace('9' * 8, '').replace('0' * 9, ''))
