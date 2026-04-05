import java.io.BufferedReader

import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    id("org.springframework.boot") version "3.5.12"
    id("io.spring.dependency-management") version "1.1.7"
    id("co.uzzu.dotenv.gradle") version "4.0.0"
}

group = "cz.scrumdojo"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")

    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.apache.commons:commons-lang3")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.16")
    compileOnly("org.projectlombok:lombok")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

fun featureFlag(): Boolean {
    return System.getenv("FEATURE_FLAG")?.toBoolean() ?: false
}

sourceSets {
    main {
        resources {
            if (!featureFlag()) exclude("feature-flag.properties")
        }
    }
}

tasks.withType<BootRun> {
    environment("BE_PORT", env.fetch("BE_PORT", "8080"))
    environment("DB_SCHEMA", env.fetch("DB_SCHEMA", "public"))

    val apiKey = env.fetch("OPENROUTER_API_KEY", "")
    if (apiKey.isNotEmpty()) environment("OPENROUTER_API_KEY", apiKey)

    val model = env.fetch("OPENROUTER_MODEL", "")
    if (model.isNotEmpty()) environment("OPENROUTER_MODEL", model)
}

tasks.withType<Test> {
    environment("DB_SCHEMA", env.fetch("DB_SCHEMA", "public"))

    val apiKey = env.fetch("OPENROUTER_API_KEY", "")
    if (apiKey.isNotEmpty()) environment("OPENROUTER_API_KEY", apiKey)

    val model = env.fetch("OPENROUTER_MODEL", "")
    if (model.isNotEmpty()) environment("OPENROUTER_MODEL", model)

    jvmArgs("-XX:+EnableDynamicAgentLoading")
    testLogging {
        events("passed", "skipped", "failed")
        showExceptions = true
        showCauses = true
        showStackTraces = true
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}

tasks.register<Test>("testLocal") {
    useJUnitPlatform {
        excludeTags("ai")
    }
}

tasks.register<Test>("testAi") {
    useJUnitPlatform {
        includeTags("ai")
    }
}

fun jarFile(): String {
    return tasks.named<BootJar>("bootJar").get().archiveFile.get().asFile.relativeTo(projectDir).path
}

tasks.register<Exec>("buildDockerImage") {
    dependsOn("bootJar")
    val jarFile = jarFile().replace("\\", "/")
    commandLine("docker", "build", "--build-arg", "JAR_FILE=$jarFile", "-t", "quizmaster:latest", ".")
}
