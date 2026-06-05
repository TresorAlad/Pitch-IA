FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt requirements-mlflow.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-mlflow.txt \
    && python -m spacy download fr_core_news_sm

COPY . .

RUN if [ ! -f models/success_model.joblib ]; then python training/train.py; fi

EXPOSE 8090

ENV PORT=8090

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8090}"]
