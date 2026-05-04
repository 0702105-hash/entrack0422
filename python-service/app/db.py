import os
import pymysql

def get_connection():
    return pymysql.connect(
        host=os.getenv("ML_DB_HOST", "127.0.0.1"),
        port=int(os.getenv("ML_DB_PORT", "3306")),
        user=os.getenv("ML_DB_USER", "root"),
        password=os.getenv("ML_DB_PASSWORD", ""),
        database=os.getenv("ML_DB_NAME", "entrack"),
        cursorclass=pymysql.cursors.DictCursor
    )