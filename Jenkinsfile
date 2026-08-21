// =============================================================================
// Tinto Verano System - Pipeline declarativo (Proyecto integrador DevOps, Fase 3)
//
// Cinco etapas obligatorias: preparacion, dependencias/build, pruebas,
// construccion y publicacion. El archivo vive versionado en la raiz del
// monorepo y el job de Jenkins lo lee con "Pipeline script from SCM".
//
// Ningun secreto esta escrito aqui: el token de Docker Hub se inyecta en
// tiempo de ejecucion desde el almacen de credenciales de Jenkins.
// =============================================================================

pipeline {

    agent any

    tools {
        // Instalacion de Node registrada en Manage Jenkins > Tools.
        nodejs 'NodeJS-24'
    }

    options {
        timestamps()
        // El checkout lo hago yo en la etapa 1 para controlar la limpieza previa.
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        // Etiquetas locales: coinciden con las que declara docker-compose.yml
        LOCAL_API_IMAGE  = 'tinto-verano-api'
        LOCAL_WEB_IMAGE  = 'tinto-verano-web'
        LOCAL_TAG        = '1.0'

        // Nombres de los repositorios en Docker Hub. El usuario se antepone
        // en tiempo de ejecucion con el valor que entrega la credencial.
        REMOTE_API_IMAGE = 'tinto-verano-api'
        REMOTE_WEB_IMAGE = 'tinto-verano-web'

        // Solo el identificador de la credencial: ni usuario ni token.
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-tinto-verano'
    }

    triggers {
        githubPush()
    }

    stages {

        // ---------------------------------------------------------------
        // 1) PREPARACION / CHECKOUT
        //    Trae el commit que disparo la ejecucion y guarda los metadatos
        //    que dan trazabilidad al resto del pipeline.
        // ---------------------------------------------------------------
        stage('1. Preparacion / Checkout') {
            steps {
                script {
                    deleteDir()
                    def scmVars = checkout scm

                    env.SCM_GIT_BRANCH = scmVars.GIT_BRANCH ?: ''
                    env.SCM_GIT_COMMIT = scmVars.GIT_COMMIT ?: ''

                    env.GIT_FULL = env.SCM_GIT_COMMIT ?: sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    env.GIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    env.ORIGIN_MAIN_COMMIT = sh(
                        script: 'git rev-parse origin/main',
                        returnStdout: true
                    ).trim()

                    // La publicacion solo debe ocurrir cuando el commit
                    // construido es exactamente la punta de main.
                    env.IS_MAIN = (env.GIT_FULL == env.ORIGIN_MAIN_COMMIT) ? 'true' : 'false'

                    currentBuild.description = "commit ${env.GIT_SHORT} | main=${env.IS_MAIN}"

                    echo '========================================'
                    echo 'METADATOS DEL BUILD - TINTO VERANO'
                    echo '========================================'
                    echo "Job: ${env.JOB_NAME}"
                    echo "Build: ${env.BUILD_NUMBER}"
                    echo "Rama SCM: ${env.SCM_GIT_BRANCH}"
                    echo "Commit: ${env.GIT_SHORT} (${env.GIT_FULL})"
                    echo "Es punta de main: ${env.IS_MAIN}"
                }

                sh '''#!/usr/bin/env bash
                    set -euo pipefail

                    mkdir -p reports
                    cat > reports/build-metadata.txt <<METADATA
JOB_NAME=${JOB_NAME}
BUILD_NUMBER=${BUILD_NUMBER}
BUILD_URL=${BUILD_URL}
SCM_GIT_BRANCH=${SCM_GIT_BRANCH:-unknown}
GIT_SHORT=${GIT_SHORT}
GIT_FULL=${GIT_FULL}
ORIGIN_MAIN_COMMIT=${ORIGIN_MAIN_COMMIT}
IS_MAIN=${IS_MAIN}
METADATA

                    echo "Metadatos guardados en reports/build-metadata.txt"
                    cat reports/build-metadata.txt
                '''
            }
        }

        // ---------------------------------------------------------------
        // 2) DEPENDENCIAS / BUILD
        //    npm ci respeta el package-lock.json, asi la instalacion en el
        //    agente es identica a la de mi equipo. Prisma genera su cliente
        //    antes de compilar porque la API lo importa en tiempo de build.
        // ---------------------------------------------------------------
        stage('2. Dependencias / Build') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail

                    echo "Version de Node y npm en el agente:"
                    node --version
                    npm --version

                    echo "Instalando dependencias del monorepo (npm workspaces)..."
                    npm ci

                    echo "Generando el cliente de Prisma..."
                    npx prisma generate --schema=apps/api/schema.prisma

                    echo "Compilando la API (tsc) y el frontend (vite)..."
                    npm run build
                '''
            }
        }

        // ---------------------------------------------------------------
        // 3) PRUEBAS
        //    El shebang de bash con pipefail es intencional: sin el, el
        //    codigo de salida de la tuberia seria el de tee y una prueba
        //    rota pasaria desapercibida.
        // ---------------------------------------------------------------
        stage('3. Pruebas') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail

                    mkdir -p reports

                    echo "Analisis estatico con ESLint..."
                    npm run lint 2>&1 | tee reports/lint-output.txt

                    echo "Pruebas automatizadas con Vitest..."
                    npm run test:ci 2>&1 | tee reports/test-output.txt
                '''
            }
        }

        // ---------------------------------------------------------------
        // 4) CONSTRUCCION
        //    Las dos imagenes se arman con el contexto en la raiz del
        //    monorepo, que es lo que exigen los Dockerfile multietapa.
        // ---------------------------------------------------------------
        stage('4. Construccion') {
            steps {
                sh '''#!/usr/bin/env bash
                    set -euo pipefail

                    echo "Generando un .env efimero para validar Compose (no se versiona)..."
                    cp .env.docker.example .env
                    {
                      echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)"
                      echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
                      echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
                      echo "SEED_ADMIN_PASSWORD=$(openssl rand -hex 12)"
                    } >> .env

                    echo "Validando la sintaxis de docker-compose.yml..."
                    docker compose config --quiet

                    echo "Construyendo la imagen de la API..."
                    docker build -f apps/api/Dockerfile -t "${LOCAL_API_IMAGE}:${LOCAL_TAG}" .

                    echo "Construyendo la imagen del frontend..."
                    docker build -f apps/web/Dockerfile -t "${LOCAL_WEB_IMAGE}:${LOCAL_TAG}" .

                    echo "Verificando que las dos imagenes existan en el demonio..."
                    docker image inspect "${LOCAL_API_IMAGE}:${LOCAL_TAG}" > reports/api-image-inspect.json
                    docker image inspect "${LOCAL_WEB_IMAGE}:${LOCAL_TAG}" > reports/web-image-inspect.json

                    docker image ls --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}' \
                      | grep 'tinto-verano' > reports/docker-images.txt || true

                    # El .env efimero no debe sobrevivir a la etapa.
                    rm -f .env

                    echo "Construccion terminada."
                    cat reports/docker-images.txt
                '''
            }
        }

        // ---------------------------------------------------------------
        // 5) PUBLICACION
        //    Solo cuando el commit es la punta de main. Cada imagen sale
        //    con tres etiquetas: latest, numero de build y build-commit,
        //    para poder rastrear que codigo hay dentro de cada imagen.
        // ---------------------------------------------------------------
        stage('5. Publicacion') {
            when {
                expression { return env.IS_MAIN == 'true' }
            }

            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKERHUB_CREDENTIALS_ID}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''#!/usr/bin/env bash
                        set -euo pipefail

                        echo "========================================"
                        echo "PUBLICACION EN DOCKER HUB"
                        echo "========================================"

                        # Sesion de Docker aislada y borrada al salir: el token
                        # no queda escrito en el HOME del agente.
                        DOCKER_CONFIG="$(mktemp -d)"
                        export DOCKER_CONFIG
                        trap 'rm -rf "$DOCKER_CONFIG"' EXIT

                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        API_LATEST="${DOCKER_USER}/${REMOTE_API_IMAGE}:latest"
                        API_BUILD="${DOCKER_USER}/${REMOTE_API_IMAGE}:${BUILD_NUMBER}"
                        API_TRACE="${DOCKER_USER}/${REMOTE_API_IMAGE}:${BUILD_NUMBER}-${GIT_SHORT}"

                        WEB_LATEST="${DOCKER_USER}/${REMOTE_WEB_IMAGE}:latest"
                        WEB_BUILD="${DOCKER_USER}/${REMOTE_WEB_IMAGE}:${BUILD_NUMBER}"
                        WEB_TRACE="${DOCKER_USER}/${REMOTE_WEB_IMAGE}:${BUILD_NUMBER}-${GIT_SHORT}"

                        docker tag "${LOCAL_API_IMAGE}:${LOCAL_TAG}" "$API_LATEST"
                        docker tag "${LOCAL_API_IMAGE}:${LOCAL_TAG}" "$API_BUILD"
                        docker tag "${LOCAL_API_IMAGE}:${LOCAL_TAG}" "$API_TRACE"

                        docker tag "${LOCAL_WEB_IMAGE}:${LOCAL_TAG}" "$WEB_LATEST"
                        docker tag "${LOCAL_WEB_IMAGE}:${LOCAL_TAG}" "$WEB_BUILD"
                        docker tag "${LOCAL_WEB_IMAGE}:${LOCAL_TAG}" "$WEB_TRACE"

                        docker push "$API_LATEST"
                        docker push "$API_BUILD"
                        docker push "$API_TRACE"

                        docker push "$WEB_LATEST"
                        docker push "$WEB_BUILD"
                        docker push "$WEB_TRACE"

                        mkdir -p reports
                        cat > reports/docker-publish-metadata.txt <<PUBLICACION
API_LATEST=${API_LATEST}
API_BUILD=${API_BUILD}
API_TRACE=${API_TRACE}
WEB_LATEST=${WEB_LATEST}
WEB_BUILD=${WEB_BUILD}
WEB_TRACE=${WEB_TRACE}
COMMIT=${GIT_FULL}
PUBLICACION

                        docker logout > /dev/null 2>&1 || true

                        echo "Publicacion correcta."
                        cat reports/docker-publish-metadata.txt
                    '''
                }
            }
        }
    }

    post {

        success {
            echo '========================================'
            echo 'PIPELINE SATISFACTORIO - TINTO VERANO'
            echo '========================================'
            echo "Build: ${env.BUILD_NUMBER}"
            echo "Commit: ${env.GIT_SHORT ?: 'N/A'}"
            script {
                if (env.IS_MAIN == 'true') {
                    echo 'Imagenes publicadas en Docker Hub con etiqueta trazable.'
                } else {
                    echo 'Rama de trabajo: se ejecutaron pruebas y construccion; la publicacion se omitio a proposito.'
                }
            }
        }

        failure {
            echo '========================================'
            echo 'PIPELINE FALLIDO'
            echo '========================================'
            echo 'Revisar la primera etapa en rojo y su Console Output.'
        }

        always {
            // El informe de Vitest se publica aunque la etapa haya fallado,
            // asi la pestana Test Result muestra que prueba se rompio.
            junit testResults: 'reports/junit-api.xml', allowEmptyResults: true

            archiveArtifacts(
                artifacts: 'reports/**',
                allowEmptyArchive: true,
                fingerprint: true
            )

            sh 'docker logout > /dev/null 2>&1 || true'
        }
    }
}
