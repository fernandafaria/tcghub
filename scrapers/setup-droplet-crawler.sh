#!/bin/bash
# setup-droplet-crawler.sh
# Sobe um droplet DO com Docker + Crawl4AI para crawl pesado
# Uso: chmod +x setup-droplet-crawler.sh && ./setup-droplet-crawler.sh

set -e

DROPLET_NAME="crawler-liga"
REGION="nyc1"  # NY tem boa latência para servidores BR via Cloudflare
SIZE="s-2vcpu-4gb"  # $24/mês — suficiente para crawl paralelo

echo "=== Criando droplet $DROPLET_NAME ($SIZE) ==="

# Criar droplet com Ubuntu + Docker
doctl compute droplet create "$DROPLET_NAME" \
  --region "$REGION" \
  --size "$SIZE" \
  --image ubuntu-24-04-x64 \
  --ssh-keys "$(doctl compute ssh-key list --format ID --no-header | head -1)" \
  --user-data <(cat <<'EOF'
#!/bin/bash
set -e

# Atualizar sistema
apt-get update && apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | bash
systemctl enable docker && systemctl start docker

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Aumentar limite de arquivos abertos
echo "fs.file-max = 100000" >> /etc/sysctl.conf
sysctl -p

# Criar diretório de trabalho
mkdir -p /opt/crawler
cat > /opt/crawler/docker-compose.yml <<'DOCKER'
services:
  crawler:
    image: unclecode/crawl4ai:latest
    container_name: crawl4ai
    restart: unless-stopped
    ports:
      - "11235:11235"
    volumes:
      - ./data:/app/data
      - ./scripts:/app/scripts
    environment:
      - CRAWL4AI_API_KEY=change-me
      - CRAWL4AI_AUTH_REQUIRED=true
    shm_size: 2g
    deploy:
      resources:
        limits:
          memory: 3g
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11235/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Opcional: proxy rotativo via WebShare
  # proxy-pool:
  #   image: your-proxy-manager
  #   environment:
  #     - WEBSHARE_API_KEY=your-key
DOCKER

docker-compose -f /opt/crawler/docker-compose.yml pull
docker-compose -f /opt/crawler/docker-compose.yml up -d

echo ""
echo "=== Setup completo ==="
echo "IP: $(curl -s ifconfig.me)"
echo "Crawl4AI API: http://localhost:11235"
echo "Dashboard: http://localhost:11235/dashboard"
echo ""
echo "Para testar:"
echo "  curl -X POST http://localhost:11235/scrape \\"
echo "    -H 'Authorization: Bearer change-me' \\"
echo "    -d '{\"url\": \"https://www.ligalorcana.com.br/\"}'"
EOF
)

echo ""
echo "Aguardando droplet ficar pronto..."
sleep 30

# Pegar IP
IP=$(doctl compute droplet get "$DROPLET_NAME" --format PublicIPv4 --no-header)
echo "IP do droplet: $IP"

echo ""
echo "=== Próximos passos ==="
echo "1. SSH: ssh root@$IP"
echo "2. Ver logs: docker logs crawl4ai -f"
echo "3. Testar: curl http://$IP:11235/health"
echo "4. Subir scripts de crawl: scp crawl_liga.py root@$IP:/opt/crawler/scripts/"
echo "5. Rodar: docker exec crawl4ai python /app/scripts/crawl_liga.py --all --max-pages 10000"
echo ""
echo "Custo estimado: $24/mês (droplet) + tráfego (incluído no plano DO)"
