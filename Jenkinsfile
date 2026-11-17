pipeline {
  agent any

  triggers {
    githubPush()
  }

  environment {
    APP_HOST = 'ubuntu@172.31.2.156'
    APP_DIR  = '/home/ubuntu/hunch'
  }

  stages {
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