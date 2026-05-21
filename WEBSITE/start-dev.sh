#!/bin/bash
# Start both frontend and backend servers concurrently
# Frontend: Vite dev server (auto-reload)
# Backend: Uvicorn with auto-reload

cd frontend
npm run dev:full
