import java.io.BufferedReader

import org.gradle.process.ProcessForkOptions
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

// Forward optional .env vars to forked Java processes (BootRun, Test).
// Empty values are skipped so a missing key stays missing instead being set to ""
fun ProcessForkOptions.forwardSharedEnv() {
    val optionalForwardedEnvVars = listOf(
        "OPENROUTER_API_KEY",
        "OPENROUTER_MODEL",
        "OPENROUTER_MAX_TOKENS"
    )

    environment("DB_HOST", env.fetch("DB_HOST", "postgres"))
    environment("DB_NAME", env.fetch("DB_NAME", "quizmaster"))
    environment("DB_USER", env.fetch("DB_USER", "quizmaster"))
    environment("DB_PASS", env.fetch("DB_PASS", "quizmaster"))
    environment("DB_SCHEMA", env.fetch("DB_SCHEMA", "public"))
    optionalForwardedEnvVars.forEach { name ->
        val value = env.fetch(name, "")
        if (value.isNotEmpty()) environment(name, value)
    }
}

tasks.withType<BootRun> {
    environment("BE_PORT", env.fetch("BE_PORT", "8080"))
    forwardSharedEnv()
}

tasks.withType<Test> {
    forwardSharedEnv()

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

fun Test.useTestSourceSet() {
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = sourceSets["test"].runtimeClasspath
}

tasks.register<Test>("testLocal") {
    useTestSourceSet()

    useJUnitPlatform {
        excludeTags("ai")
    }
}

tasks.register<Test>("testAi") {
    useTestSourceSet()

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
