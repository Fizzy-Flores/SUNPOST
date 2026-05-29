import os
import sys

CURDIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURDIR, '../WEBSITE/Sunpost/backend'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app as fastapi_app

try:
    from a2wsgi import AsgiToWsgi
    application = AsgiToWsgi(fastapi_app)
except ImportError:
    application = fastapi_app
