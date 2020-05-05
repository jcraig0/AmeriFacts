import zipfile
import shapefile
import os
import json

zipfile = zipfile.ZipFile('TIGER2018/STATE/tl_2018_us_state.zip')
sf = shapefile.Reader(
    shp=zipfile.open('tl_2018_us_state.shp'),
    dbf=zipfile.open('tl_2018_us_state.dbf'),
    shx=zipfile.open('tl_2018_us_state.shx')
)

# Adapted from Frank Rowe's code (https://gist.github.com/frankrowe/6071443)
features = [{
    "type": "Feature",
    "geometry": shape_record.shape.__geo_interface__,
    "properties": dict(zip([f[0] for f in sf.fields[1:]], shape_record.record))
} for shape_record in sf.shapeRecords()]

folder_path = '../assets/shapefiles/'
os.makedirs(folder_path, exist_ok=True)
open(folder_path + 'States.json', 'w').write(json.dumps(
    {"type": "FeatureCollection", "features": features}))