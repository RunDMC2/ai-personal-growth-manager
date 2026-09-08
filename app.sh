#!/bin/bash

# frontend
cd frontend
npm run dev &

# backend
cd ../backend
python -m uvicorn app.main:app --reload

