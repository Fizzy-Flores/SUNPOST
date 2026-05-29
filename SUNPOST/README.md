# SunPost Frontend

## Run locally

1) Go to the frontend folder:

```bash
cd Sunpost-frontend
```

2) Start the local server (default: 8080):

```bash
PORT=8080 python3 serve.py
```

3) Open in your browser:

http://127.0.0.1:8080/

## Notes

- If the backend API is running, the frontend can use it for signup/login.
- For local dev, `auth.js` can fall back to a local auth flow when the backend isn’t available.

