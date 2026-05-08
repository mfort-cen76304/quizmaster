import java.io.BufferedReader

import org.gradle.process.ProcessForkOptions
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    jacoco
    id("org.springframework.boot") version "3.5.12"
    id("io.spring.dependency-management") version "1.1.7"
    id("co.uzzu.dotenv.gradle") version "4.0.0"
}

jacoco {
    toolVersion = "0.8.13"
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
        "OPENROUTER_MAX_TOKENS",
        "OPENROUTER_EMBEDDING_MODEL",
        "AI_EMBEDDING_SIMILARITY_THRESHOLD"
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

val jacocoPlugin = the<JacocoPluginExtension>()

tasks.withType<BootRun> {
    environment("BE_PORT", env.fetch("BE_PORT", "8080"))
    forwardSharedEnv()

    jacocoPlugin.applyTo(this)
    extensions.configure<JacocoTaskExtension> {
        isEnabled = System.getenv("ENABLE_BACKEND_COVERAGE") == "1"
        setDestinationFile(layout.buildDirectory.file("jacoco/e2e.exec").get().asFile)
    }
}

tasks.register<JacocoReport>("jacocoE2eReport") {
    executionData(layout.buildDirectory.file("jacoco/e2e.exec"))
    sourceSets(sourceSets["main"])
    reports {
        html.required = true
        html.outputLocation = layout.projectDirectory.dir("../site/coverage/backend/e2e")
        xml.required = true
        xml.outputLocation = layout.buildDirectory.file("reports/jacoco/e2e/e2e.xml")
    }
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

tasks.named<JacocoReport>("jacocoTestReport") {
    dependsOn(tasks.named("test"))
    reports {
        html.required = true
        html.outputLocation = layout.projectDirectory.dir("../site/coverage/backend")
        xml.required = true
        xml.outputLocation = layout.buildDirectory.file("reports/jacoco/test/test.xml")
    }
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
