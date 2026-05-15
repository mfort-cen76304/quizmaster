package cz.scrumdojo.quizmaster.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("e2e")
public class TestClockConfig {

    @Bean
    public Clock clock() {
        return new RequestScopedTestClock(ZoneId.systemDefault(), Clock.systemDefaultZone());
    }
}
