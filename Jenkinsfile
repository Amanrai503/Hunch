pipeline {
  agent any

  triggers {
    githubPush()
  }

  environment {
    APP_HOST = 'ubuntu@172.31.2.156'
    APP_DIR  = '/home/ubuntu/hunch'
    TMPDIR   = '/var/lib/jenkins/trivy-tmp'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Trivy Scan') {
      steps {
        sh '''
          trivy fs \
            --scanners vuln,secret,misconfig \
            --severity HIGH,CRITICAL \
            --exit-code 0 \
            --no-progress \
            .
        '''
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ['app-server-ssh']) {
          sh '''
            ssh -o StrictHostKeyChecking=accept-new $APP_HOST "bash -s" <<EOF
set -e
cd $APP_DIR
git pull --ff-only origin main
docker compose up -d --build
docker image prune -f
docker compose ps
EOF
          '''
        }
      }
    }
  }
}