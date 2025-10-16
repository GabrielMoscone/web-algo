# Deploy do WebAlgo no Azure AKS (Passo a passo)

Guia rápido para provisionar infraestrutura no Azure, criar o ACR, buildar e publicar imagens Docker, e fazer o deploy no AKS.

Arquivos úteis no repositório:
- NGINX: [nginx/nginx.conf](nginx/nginx.conf)
- Dockerfiles: [middleware/Dockerfile](middleware/Dockerfile), [web-algo/Dockerfile](web-algo/Dockerfile)
- Manifests Kubernetes (exemplos): [k8s/configmap.yaml](k8s/configmap.yaml), [k8s/middleware-deployment.yaml](k8s/middleware-deployment.yaml)

---

## 1) Instalar ferramentas

- Azure CLI: https://aka.ms/installazurecliwindows (ou `winget install -e --id Microsoft.AzureCLI`)
- kubectl: `az aks install-cli`
- Docker Desktop: https://www.docker.com/products/docker-desktop

---

## 2) Login e configuração no Azure

- Login: `az login`
- (Opcional) Selecionar assinatura: `az account set --subscription "<subscription-id>"`
- Registrar provedor AKS: `az provider register --namespace Microsoft.ContainerService`

---

## 3) Criar infraestrutura (Resource Group e AKS)

- Resource Group:
  - `az group create --name webalgo-rg --location brazilsouth`

- AKS (leva ~5–10min):
  - PowerShell (usar crase para multiline):
    ```
    az aks create `
      --resource-group webalgo-rg `
      --name webalgo-aks `
      --node-count 1 `
      --node-vm-size Standard_D2s_v6 `
      --enable-addons monitoring `
      --generate-ssh-keys `
      --enable-cluster-autoscaler --min-count 1 --max-count 2
    ```

- Conectar no cluster:
  - `az aks get-credentials --resource-group webalgo-rg --name webalgo-aks`
  - Verificar: `kubectl get nodes`

---

## 4) Criar e configurar o ACR

- Criar ACR (SKU Basic):
  - `az acr create --resource-group webalgo-rg --name webalgoacr --sku Basic`

- Login no ACR:
  - `az acr login --name webalgoacr`

- Conectar AKS ao ACR:
  - `az aks update -n webalgo-aks -g webalgo-rg --attach-acr webalgoacr`

---

## 5) Build e push das imagens

No diretório raiz do projeto:

- Definir variável:
  - PowerShell: `$ACR_NAME = "webalgoacr.azurecr.io"`

- Middleware:
  - `docker build -t ${ACR_NAME}/middleware:latest ./middleware`
  - `docker push ${ACR_NAME}/middleware:latest`

- NGINX (frontend estático):
  - `docker build -t ${ACR_NAME}/nginx-webalgo:latest ./web-algo`
  - `docker push ${ACR_NAME}/nginx-webalgo:latest`

- Conferir no ACR:
  - `az acr repository list --name webalgoacr --output table`
  - `az acr repository show-tags --name webalgoacr --repository middleware --output table`
  - `az acr repository show-tags --name webalgoacr --repository nginx-webalgo --output table`

Observação:
- O conteúdo servido pelo NGINX vem de [web-algo/Dockerfile](web-algo/Dockerfile) e [nginx/nginx.conf](nginx/nginx.conf).

---

## 6) Deploy no Kubernetes

- (Opcional) Definir namespace no contexto atual:
  - `kubectl config set-context --current --namespace=webalgo`

- Criar namespace (se tiver manifest): `kubectl apply -f k8s/namespace.yaml`
  - Alternativa sem manifest: `kubectl create namespace webalgo`

- ConfigMaps:
  - `kubectl apply -f k8s/configmap.yaml` ([k8s/configmap.yaml](k8s/configmap.yaml))

- Deploys/Services:
  - Middleware: `kubectl apply -f k8s/middleware-deployment.yaml` ([k8s/middleware-deployment.yaml](k8s/middleware-deployment.yaml))
  - NGINX (arquivo esperado: k8s/nginx-deployment.yaml): `kubectl apply -f k8s/nginx-deployment.yaml`

- Acompanhar pods:
  - `kubectl get pods -n webalgo -w`
  - Resumo: `kubectl get all -n webalgo`

---

## 7) Obter IPs (LoadBalancer)

- Listar serviços: `kubectl get svc -n webalgo`
- Aguardar 2 minutos (opcional PowerShell): `Start-Sleep -Seconds 120`
- IP externo do NGINX:
  - PowerShell: `$NGINX_IP = kubectl get svc nginx -n webalgo -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`
  - `Write-Host "Aplicação: http://${NGINX_IP}" -ForegroundColor Green`

---

## 8) Testar aplicação

- Teste via curl: `curl http://${NGINX_IP}`
- Abrir no navegador (PowerShell): `Start-Process "http://${NGINX_IP}"`

---

## 9) Comandos úteis (debug)

- Logs middleware: `kubectl logs -n webalgo -l app=middleware --tail=50`
- Logs nginx: `kubectl logs -n webalgo -l app=nginx --tail=50`
- Descrever pod: `kubectl describe pod -n webalgo <POD_NAME>`
- Shell no pod: `kubectl exec -it -n webalgo <POD_NAME> -- /bin/sh`
- Eventos: `kubectl get events -n webalgo --sort-by='.lastTimestamp'`

---

## 10) Pausar e iniciar o cluster (custos)

- Pausar: `az aks stop -n webalgo-aks -g webalgo-rg`
- Iniciar: `az aks start -n webalgo-aks -g webalgo-rg`

---

## 11) Limpar recursos (cautela)

- Remover todo o Resource Group:
  - `az group delete --name webalgo-rg --yes --no-wait`
