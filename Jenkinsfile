pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24.0.5-dind
    securityContext:
      privileged: true
"""
        }
    }

    environment {
        DOCKER_IMAGE = "sergiogg06/admin-panel-frontend"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        // ID de credencial para Docker Hub
        REGISTRY_CREDENTIALS_ID = 'dc346772-1eb6-498e-820f-e8b7b5e1cd83'
        // ID de credencial para GitHub
        GIT_CREDENTIALS_ID = 'b98410a3-ed25-43e4-8477-4bd70d39c0d8'
    }

    stages {
        stage('Build & Push Image') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(credentialsId: "${env.REGISTRY_CREDENTIALS_ID}", usernameVariable: 'DUSER', passwordVariable: 'DPASS')]) {
                        sh "echo \$DPASS | docker login -u \$DUSER --password-stdin"
                        
                        // El Dockerfile debe estar configurado para puerto 3033 y npm
                        sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                        sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                        
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Update GitOps Manifests') {
            steps {
                // Clonamos el repo 
                git branch: 'main', credentialsId: "${env.GIT_CREDENTIALS_ID}", url: 'https://github.com/sergioga06/admin-panel-frontend.git'
                
                script {
                    // 1. Intentamos actualizar el tag
                    sh "sed -i 's|image: ${DOCKER_IMAGE}:.*|image: ${DOCKER_IMAGE}:${env.BUILD_NUMBER}|g' deploy/k8s-app/frontend-deployment.yaml"
                    
                    sh "git config user.email 'jenkins@vps.com'"
                    sh "git config user.name 'Jenkins CI'"
                    sh "git add deploy/k8s-app/frontend-deployment.yaml"
                    
                    // 2. Commit (con protección si no hay cambios)
                    sh "git commit -m 'Update admin-panel image to version ${env.BUILD_NUMBER} [ci skip]' || echo 'Sin cambios nuevos'"
                    
                    // 3. LA SOLUCIÓN AL ERROR 128: Inyectar credenciales en la URL de push
                    withCredentials([usernamePassword(credentialsId: "${env.GIT_CREDENTIALS_ID}", usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh "git push https://${GIT_USER}:${GIT_TOKEN}@github.com/sergioga06/admin-panel-frontend.git main"
                    }
                }
            }
        }
    }
}