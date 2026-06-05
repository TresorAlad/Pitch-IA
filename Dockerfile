# Dockerfile pour déploiement alternatif si nécessaire
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY go.mod go.sum ./
RUN go mod download

# Copier le code source
COPY . .

# Compiler l'application
RUN go build -o pitch

# Image finale
FROM alpine:latest

RUN apk --no-cache add ca-certificates wget

WORKDIR /root/

# Copier le binaire compilé
COPY --from=builder /app/pitch .

ENV PORT=8088
ENV ML_SERVICE_URL=http://ml-service:8090

EXPOSE 8088

CMD ["./pitch"]

