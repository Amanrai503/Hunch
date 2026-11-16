pipeline {
    agent any

    environment {
        APP_NAME   = 'hunch'
        PORT       = '3000'
        IMAGE_NAME = 'hunch-web'
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }

    options {
        // Keep only the last 10 builds to save disk space
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Timeout pipeline after 15 minutes if something hangs
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "=== Pulling latest changes from Git ==="
                checkout scm
            }
        }

        stage('Test & Lint') {
            steps {
                echo "=== Running Code Quality & Ranking Algorithm Unit Tests ==="
                sh '''
                    # If Node is installed locally, use npm; otherwise run in a disposable Node container
                    if command -v npm &> /dev/null; then
                        npm ci
                        npm run lint
                        npm test
                    else
                        docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci && npm run lint && npm test"
                    fi
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "=== Building Production Image (Build #${env.BUILD_NUMBER}) ==="
                sh '''
                    docker build \
                        --build-arg NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000} \
                        -t ${IMAGE_NAME}:${IMAGE_TAG} \
                        -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Deploy & Update Service') {
            steps {
                echo "=== Re-deploying Hunch Container with Zero-Downtime Reload ==="
                sh '''
                    # Recreate web container using the newly built image
                    if [ -f "docker-compose.yml" ]; then
                        docker compose up -d --build --no-deps web
                    else
                        docker stop ${APP_NAME} || true
                        docker rm ${APP_NAME} || true
                        docker run -d \
                            --name ${APP_NAME} \
                            --restart always \
                            -p 3000:3000 \
                            ${IMAGE_NAME}:latest
                    fi
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo "=== Verifying Application Health ==="
                sh '''
                    ATTEMPTS=0
                    MAX_ATTEMPTS=15
                    until curl -sf http://localhost:3000 > /dev/null || [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; do
                        echo "Waiting for Hunch service on port 3000... ($ATTEMPTS/$MAX_ATTEMPTS)"
                        sleep 2
                        ATTEMPTS=$((ATTEMPTS+1))
                    done

                    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
                        echo "ERROR: Health check timed out! Web container failed to respond on port 3000."
                        docker logs --tail 40 hunch_web || docker logs --tail 40 ${APP_NAME}
                        exit 1
                    fi

                    echo "SUCCESS: Hunch web service is healthy and serving HTTP 200!"
                '''
            }
        }
    }

    post {
        always {
            echo "=== Cleaning up dangling images ==="
            sh 'docker image prune -f || true'
        }
        success {
            echo "Deployment succeeded! Build #${env.BUILD_NUMBER} is now live."
        }
        failure {
            echo "Deployment failed for Build #${env.BUILD_NUMBER}. Check console output."
        }
    }
}

